export interface InvoiceTemplateConfig {
  id: string; // 1 to 13 or key name
  numberId: number;
  name: string;
  description: string;
}

export const INVOICE_TEMPLATES: InvoiceTemplateConfig[] = [
  { id: "1", numberId: 1, name: "1. Classic", description: "Logo left, large invoice title right" },
  { id: "2", numberId: 2, name: "2. Modern", description: "Stacked header over a full-width accent rule" },
  { id: "3", numberId: 3, name: "3. Sidebar", description: "Full-height accent rail carries the details" },
  { id: "4", numberId: 4, name: "4. Bold Header", description: "Full-bleed colour band across the top" },
  { id: "5", numberId: 5, name: "5. Minimal", description: "No rules or fills, whitespace focus" },
  { id: "6", numberId: 6, name: "6. Letterhead", description: "Centred masthead, formal and symmetrical" },
  { id: "7", numberId: 7, name: "7. Compact", description: "Tight receipt-style sheet for short invoices" },
  { id: "8", numberId: 8, name: "8. Two-Tone", description: "Soft tinted bands behind header and totals" },
  { id: "9", numberId: 9, name: "9. Bordered", description: "Ruled frame throughout, official form feel" },
  { id: "10", numberId: 10, name: "10. Left Rail", description: "Thin accent stripe, editorial spacing" },
  { id: "11", numberId: 11, name: "11. Statement", description: "Summary strip of key figures up front" },
  { id: "12", numberId: 12, name: "12. Corner", description: "Amount due stamped in the top corner" },
  { id: "13", numberId: 13, name: "13. Column", description: "Metadata column beside items, spec-sheet style" },
];

export const ACCENT_COLORS = [
  { name: "Indigo", value: "#4F46E5", bgClass: "bg-indigo-600" },
  { name: "Emerald", value: "#059669", bgClass: "bg-emerald-600" },
  { name: "Slate", value: "#334155", bgClass: "bg-slate-700" },
  { name: "Rose", value: "#E11D48", bgClass: "bg-rose-600" },
  { name: "Obsidian", value: "#0F172A", bgClass: "bg-slate-900" },
] as const;

export function tint(hex: string, amount: number): string {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return hex;

  const mix = (channel: number) => Math.round(channel + (255 - channel) * amount);
  const r = mix(parseInt(clean.slice(0, 2), 16));
  const g = mix(parseInt(clean.slice(2, 4), 16));
  const b = mix(parseInt(clean.slice(4, 6), 16));

  return `rgb(${r}, ${g}, ${b})`;
}

export function readableOn(hex: string): string {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return "#ffffff";

  const channel = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };

  const luminance =
    0.2126 * channel(parseInt(clean.slice(0, 2), 16)) +
    0.7152 * channel(parseInt(clean.slice(2, 4), 16)) +
    0.0722 * channel(parseInt(clean.slice(4, 6), 16));

  return luminance > 0.45 ? "#111827" : "#ffffff";
}
