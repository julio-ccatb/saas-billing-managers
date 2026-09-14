import type { Browser } from "puppeteer-core";
import { renderInvoiceHtml } from "./renderHtml";
import type { InvoiceInput } from "~/lib/schemas/invoice";

let browserPromise: Promise<Browser> | null = null;

async function getBrowser(): Promise<Browser> {
  if (browserPromise) {
    try {
      const b = await browserPromise;
      if (b.connected) return b;
    } catch {
      browserPromise = null;
    }
  }

  const isServerless = Boolean(
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.VERCEL ||
    process.env.NETLIFY
  );

  browserPromise = (async () => {
    if (isServerless) {
      // Vercel / AWS Lambda environment
      const chromium = (await import("@sparticuz/chromium")).default;
      const puppeteer = (await import("puppeteer-core")).default;

      let executablePath: string;
      try {
        if (process.env.CHROMIUM_EXECUTABLE_PATH) {
          executablePath = await chromium.executablePath(process.env.CHROMIUM_EXECUTABLE_PATH);
        } else {
          executablePath = await chromium.executablePath();
        }
      } catch (err: any) {
        console.warn("Local executablePath failed, attempting remote pack:", err?.message);
        executablePath = await chromium.executablePath(
          "https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar"
        );
      }

      try {
        return await puppeteer.launch({
          args: [
            ...chromium.args,
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu",
            "--no-first-run",
            "--no-zygote",
            "--single-process",
          ],
          executablePath,
          headless: true,
        });
      } catch (launchErr) {
        browserPromise = null;
        throw launchErr;
      }
    }

    // Local / Self-hosted environment
    // Uses puppeteer-core with local installed Chrome/Chromium executable
    const puppeteer = (await import("puppeteer-core")).default;

    // Detect standard system Chrome paths on Windows/Mac/Linux
    const possiblePaths = [
      process.env.PUPPETEER_EXECUTABLE_PATH,
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
      "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
      "/usr/bin/google-chrome",
      "/usr/bin/chromium-browser",
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    ].filter(Boolean) as string[];

    let executablePath = possiblePaths[0];

    // Find first existing executable
    const fs = await import("node:fs");
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        executablePath = p;
        break;
      }
    }

    return puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
      executablePath,
      headless: true,
    });
  })();

  return browserPromise;
}

export async function generatePdfFromInvoice(invoice: InvoiceInput): Promise<Buffer> {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 });
    await page.emulateMediaType("print");

    const html = renderInvoiceHtml(invoice);

    await page.setContent(html, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    const pdfUint8Array = await page.pdf({
      format: "a4",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });

    return Buffer.from(pdfUint8Array);
  } finally {
    await page.close();
  }
}
