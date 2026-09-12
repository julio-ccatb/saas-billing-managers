export function calculateInvoiceTotals(params: {
  items: Array<{ quantity: number; unitPrice: number }>;
  taxRate?: number;
  discountRate?: number;
  shippingAmount?: number;
}) {
  const { items, taxRate = 0, discountRate = 0, shippingAmount = 0 } = params;

  const subTotal = items.reduce((acc, item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unitPrice) || 0;
    return acc + qty * price;
  }, 0);

  const discountAmount = Math.max(0, (subTotal * (Number(discountRate) || 0)) / 100);
  const discountedSubtotal = Math.max(0, subTotal - discountAmount);
  const taxAmount = Math.max(0, (discountedSubtotal * (Number(taxRate) || 0)) / 100);
  const totalAmount = Math.max(0, discountedSubtotal + taxAmount + (Number(shippingAmount) || 0));

  return {
    subTotal: Number(subTotal.toFixed(2)),
    discountAmount: Number(discountAmount.toFixed(2)),
    taxAmount: Number(taxAmount.toFixed(2)),
    totalAmount: Number(totalAmount.toFixed(2)),
  };
}

export function formatCurrency(amount: number, currency: string = "USD", locale: string = "en-US"): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency || "USD",
    }).format(amount || 0);
  } catch {
    return `$${(amount || 0).toFixed(2)}`;
  }
}

export function formatDate(date: Date | string | number | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
