import React from "react";
import { renderToStaticMarkup } from "react-dom/server.edge";
import type { InvoiceInput } from "~/lib/schemas/invoice";
import { adaptInvoiceToInvoify } from "~/components/invoice/templates/types";
import { getTemplateByIdOrSlug } from "~/components/invoice/templates/registry";

export function getTemplateComponent(invoice: InvoiceInput): React.ReactElement {
  const entry = getTemplateByIdOrSlug(invoice.templateId);
  const invoifyData = adaptInvoiceToInvoify(invoice);

  return React.createElement(entry.component, invoifyData);
}

export function renderInvoiceHtml(invoice: InvoiceInput): string {
  const templateComponent = getTemplateComponent(invoice);
  const innerHtml = renderToStaticMarkup(templateComponent);

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Invoice ${invoice.invoiceNumber || ""}</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@600;700&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&family=Outfit:wght@400;500;600;700&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&display=swap" rel="stylesheet">
      <style>
        @page {
          size: A4;
          margin: 0;
        }
        body {
          margin: 0;
          padding: 0;
          background: #ffffff;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .invoice-sheet {
          width: 210mm;
          min-height: 297mm;
          margin: 0 auto;
          background: #ffffff;
        }
      </style>
    </head>
    <body>
      <div class="invoice-sheet">
        ${innerHtml}
      </div>
    </body>
    </html>
  `;
}
