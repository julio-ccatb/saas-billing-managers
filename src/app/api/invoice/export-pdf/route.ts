import { NextRequest, NextResponse } from "next/server";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { generatePdfFromInvoice } from "~/server/services/pdfService";
import { invoiceSchema } from "~/lib/schemas/invoice";

// Increase max duration to maximum allowable on Vercel Hobby/Free tier (15s)
export const maxDuration = 15;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const json = await req.json();

    let invoiceData;
    // Either receive invoice ID or raw invoice form payload
    if (json.id && typeof json.id === "string" && !json.items) {
      const dbInvoice = await db.invoice.findUnique({
        where: { id: json.id },
        include: { items: { orderBy: { orderIndex: "asc" } } },
      });

      if (!dbInvoice || dbInvoice.userId !== session.user.id) {
        return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
      }

      invoiceData = {
        ...dbInvoice,
        issueDate: dbInvoice.issueDate,
        dueDate: dbInvoice.dueDate,
        items: dbInvoice.items,
        status: dbInvoice.status as any,
      };
    } else {
      const parsed = invoiceSchema.safeParse(json);
      if (!parsed.success) {
        return NextResponse.json({ error: "Invalid invoice data", issues: parsed.error.issues }, { status: 400 });
      }
      invoiceData = parsed.data;
    }

    const pdfBuffer = await generatePdfFromInvoice(invoiceData as any);

    const filename = `invoice-${invoiceData.invoiceNumber || "draft"}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error("PDF generation failed:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF", message: error.message },
      { status: 500 }
    );
  }
}
