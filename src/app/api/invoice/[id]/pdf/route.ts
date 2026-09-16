import { NextRequest, NextResponse } from "next/server";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { generatePdfFromInvoice } from "~/server/services/pdfService";
import { canUserAccessInvoice } from "~/server/auth/invoiceAccess";

export const maxDuration = 20;
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await props.params;
  if (!id) {
    return NextResponse.json({ error: "Invoice ID required" }, { status: 400 });
  }

  try {
    const invoice = await db.invoice.findUnique({
      where: { id },
      include: {
        items: { orderBy: { orderIndex: "asc" } },
        company: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Enforce strict access control: Company members or invoice customer only
    const hasAccess = await canUserAccessInvoice(db, invoice, session.user);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Access denied. You do not have permission to view this invoice." },
        { status: 403 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const disposition = searchParams.get("disposition") === "attachment" ? "attachment" : "inline";

    const invoiceData = {
      ...invoice,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      items: invoice.items,
      status: invoice.status as any,
    };

    const pdfBuffer = await generatePdfFromInvoice(invoiceData as any);
    const filename = `invoice-${invoice.invoiceNumber || id}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${disposition}; filename="${filename}"`,
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    });
  } catch (error: any) {
    console.error(`Failed to generate PDF for invoice ${id}:`, error);
    return NextResponse.json(
      {
        error: "Failed to generate invoice PDF",
        message: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
