import type { ComponentType } from "react";
import type { TemplateProps } from "./TemplateFrame";

import Classic from "./layouts/Classic";
import Modern from "./layouts/Modern";
import Sidebar from "./layouts/Sidebar";
import BoldHeader from "./layouts/BoldHeader";
import Minimal from "./layouts/Minimal";
import Letterhead from "./layouts/Letterhead";
import Compact from "./layouts/Compact";
import TwoTone from "./layouts/TwoTone";
import Bordered from "./layouts/Bordered";
import LeftRail from "./layouts/LeftRail";
import Statement from "./layouts/Statement";
import Corner from "./layouts/Corner";
import Column from "./layouts/Column";

export type TemplateEntry = {
  id: number;
  slug: string;
  name: string;
  description: string;
  component: ComponentType<TemplateProps>;
};

export const TEMPLATES: TemplateEntry[] = [
  {
    id: 1,
    slug: "classic",
    name: "Classic",
    description: "Logo left, large invoice title right",
    component: Classic,
  },
  {
    id: 2,
    slug: "modern",
    name: "Modern",
    description: "Stacked header over a full-width accent rule",
    component: Modern,
  },
  {
    id: 3,
    slug: "sidebar",
    name: "Sidebar",
    description: "Full-height accent rail carries the details",
    component: Sidebar,
  },
  {
    id: 4,
    slug: "bold-header",
    name: "Bold Header",
    description: "Full-bleed colour band across the top",
    component: BoldHeader,
  },
  {
    id: 5,
    slug: "minimal",
    name: "Minimal",
    description: "No rules, fills or logo — whitespace does the work",
    component: Minimal,
  },
  {
    id: 6,
    slug: "letterhead",
    name: "Letterhead",
    description: "Centred masthead, formal and symmetrical",
    component: Letterhead,
  },
  {
    id: 7,
    slug: "compact",
    name: "Compact",
    description: "Tight receipt-style sheet for short invoices",
    component: Compact,
  },
  {
    id: 8,
    slug: "two-tone",
    name: "Two-Tone",
    description: "Soft tinted bands behind header and totals",
    component: TwoTone,
  },
  {
    id: 9,
    slug: "bordered",
    name: "Bordered",
    description: "Ruled frame throughout, official-form feel",
    component: Bordered,
  },
  {
    id: 10,
    slug: "left-rail",
    name: "Left Rail",
    description: "Thin accent stripe, editorial spacing",
    component: LeftRail,
  },
  {
    id: 11,
    slug: "statement",
    name: "Statement",
    description: "Summary strip of key figures up front",
    component: Statement,
  },
  {
    id: 12,
    slug: "corner",
    name: "Corner",
    description: "Amount due stamped in the top corner",
    component: Corner,
  },
  {
    id: 13,
    slug: "column",
    name: "Column",
    description: "Metadata column beside the items, spec-sheet style",
    component: Column,
  },
];

export const DEFAULT_TEMPLATE_ID = 1;

export function getTemplateByIdOrSlug(idOrSlug: string | number | undefined): TemplateEntry {
  if (!idOrSlug) return TEMPLATES[0]!;
  const found = TEMPLATES.find(
    (t) => t.id === Number(idOrSlug) || t.slug.toLowerCase() === String(idOrSlug).toLowerCase()
  );
  return found || TEMPLATES[0]!;
}
