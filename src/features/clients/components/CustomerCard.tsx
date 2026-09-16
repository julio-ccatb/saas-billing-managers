"use client";

import Link from "next/link";
import { Edit2, Trash2, Mail, Phone, MapPin } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { AppRoutes } from "~/config/routes";

interface CustomerCardProps {
  customer: {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    city?: string | null;
    zipCode?: string | null;
    country?: string | null;
    taxId?: string | null;
  };
  onEdit: (customer: any) => void;
  onDelete: (id: string, name: string) => void;
}

export function CustomerCard({ customer, onEdit, onDelete }: CustomerCardProps) {
  return (
    <Card className="hover:border-border/80 transition-shadow flex flex-col justify-between">
      <CardHeader className="p-4 sm:p-5 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base text-foreground font-semibold">
              <Link href={AppRoutes.CUSTOMER_DETAILS(customer.id)} className="hover:text-primary transition-colors">
                {customer.name}
              </Link>
            </CardTitle>
            {customer.taxId && (
              <span className="inline-block text-[10px] font-mono bg-muted text-muted-foreground px-2 py-0.5 rounded mt-1">
                Tax ID: {customer.taxId}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(customer)}
              className="h-8 w-8 text-muted-foreground hover:text-primary"
              title="Edit Customer"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(customer.id, customer.name)}
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              title="Delete Customer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-5 pt-0 space-y-2 text-xs text-muted-foreground">
        {customer.email && (
          <div className="flex items-center gap-2 truncate">
            <Mail className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" />
            <span className="truncate">{customer.email}</span>
          </div>
        )}
        {customer.phone && (
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" />
            <span>{customer.phone}</span>
          </div>
        )}
        {(customer.address || customer.city || customer.country) && (
          <div className="flex items-start gap-2">
            <MapPin className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0 mt-0.5" />
            <span className="line-clamp-2">
              {[customer.address, customer.city, customer.zipCode, customer.country].filter(Boolean).join(", ")}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
