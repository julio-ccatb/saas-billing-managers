"use client";

import React, { useState } from "react";
import { useInvoiceForm } from "./InvoiceFormContext";
import { 
  Plus, 
  Trash2, 
  Building2, 
  User, 
  Users, 
  Calendar, 
  Percent, 
  Truck, 
  Landmark, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  Hash, 
  FileText,
  CreditCard,
  PenTool
} from "lucide-react";
import { api } from "~/trpc/react";
import { LogoUploader } from "./LogoUploader";
import { SignaturePad } from "./SignaturePad";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { NativeSelect } from "~/components/ui/native-select";
import { cn } from "~/lib/utils";

export function InvoiceFormEditor() {
  const { invoice, updateField, addItem, removeItem, updateItem, errors } = useInvoiceForm();
  const { data: customers } = api.customer.getAll.useQuery();

  // Accordion/Section Collapsible states for advanced sections
  const [senderOpen, setSenderOpen] = useState(false);
  const [bankingOpen, setBankingOpen] = useState(Boolean(invoice.bankName || invoice.bankAccountNumber));
  const [adjustmentsOpen, setAdjustmentsOpen] = useState(Boolean(invoice.taxRate || invoice.discountRate || invoice.shippingAmount));

  return (
    <div className="space-y-5 w-full">
      {/* Top Level Error Banner if validation failed */}
      {Object.keys(errors).length > 0 && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-xs flex items-start gap-3 animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-sm">Please correct the highlighted fields:</p>
            <ul className="list-disc list-inside space-y-0.5 opacity-90">
              {Object.entries(errors).slice(0, 3).map(([key, msg]) => (
                <li key={key}>{msg}</li>
              ))}
              {Object.keys(errors).length > 3 && (
                <li>And {Object.keys(errors).length - 3} more field(s)...</li>
              )}
            </ul>
          </div>
        </div>
      )}

      {/* SECTION 1: INVOICE ESSENTIALS (Meta & Dates) */}
      <Card className="p-4 sm:p-5 shadow-xs border-border bg-card">
        <div className="flex items-center gap-2 pb-3 border-b border-border text-sm font-semibold text-foreground">
          <Hash className="w-4 h-4 text-primary" />
          <span>Invoice Essentials</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 items-start">
          <div>
            <LogoUploader
              value={invoice.logoUrl}
              onChange={(base64) => updateField("logoUrl", base64)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Invoice Number *
            </label>
            <Input
              type="text"
              placeholder="e.g. INV-2026-0001"
              className={cn("h-10 font-mono font-semibold", errors["invoiceNumber"] && "border-destructive focus-visible:ring-destructive")}
              value={invoice.invoiceNumber}
              onChange={(e) => updateField("invoiceNumber", e.target.value)}
            />
            {errors["invoiceNumber"] && (
              <p className="text-[11px] text-destructive mt-1 font-medium">{errors["invoiceNumber"]}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Issue Date *
              </span>
            </label>
            <Input
              type="date"
              className={cn("h-10", errors["issueDate"] && "border-destructive focus-visible:ring-destructive")}
              value={invoice.issueDate ? new Date(invoice.issueDate).toISOString().split("T")[0] : ""}
              onChange={(e) => updateField("issueDate", new Date(e.target.value))}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Due Date *
              </span>
            </label>
            <Input
              type="date"
              className={cn("h-10", errors["dueDate"] && "border-destructive focus-visible:ring-destructive")}
              value={invoice.dueDate ? new Date(invoice.dueDate).toISOString().split("T")[0] : ""}
              onChange={(e) => updateField("dueDate", new Date(e.target.value))}
            />
          </div>
        </div>
      </Card>

      {/* SECTION 2: PARTICIPANTS — CLIENT SPOTLIGHT (BILL TO PRIMARY + SENDER COLLAPSIBLE) */}
      <div className="space-y-4">
        {/* COLLAPSIBLE SENDER BAR */}
        <Card className="shadow-xs border-border bg-card overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:px-5 hover:bg-muted/30 transition-colors gap-2">
            <div className="flex items-center gap-2.5 text-xs text-muted-foreground min-w-0">
              <Building2 className="w-4 h-4 text-primary shrink-0" />
              <span className="font-semibold text-foreground">Billed by:</span>
              <span className="font-medium text-foreground truncate">
                {invoice.senderName || "Your Company / Business"}
              </span>
              {invoice.senderEmail && (
                <span className="hidden md:inline text-muted-foreground/80 truncate">
                  ({invoice.senderEmail})
                </span>
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSenderOpen(!senderOpen)}
              className="h-7 text-xs gap-1.5 text-primary hover:text-primary self-start sm:self-auto"
            >
              <span>{senderOpen ? "Close Sender Info" : "Edit Sender Info"}</span>
              {senderOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </Button>
          </div>

          {senderOpen && (
            <div className="p-4 sm:p-5 pt-2 border-t border-border bg-muted/20 space-y-3.5 animate-in fade-in duration-150">
              <p className="text-xs text-muted-foreground">
                Sender profile defaults are loaded from your settings. You can customize them for this invoice here:
              </p>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Company / Legal Name</label>
                <Input
                  type="text"
                  placeholder="e.g. Acme Studio LLC"
                  value={invoice.senderName}
                  onChange={(e) => updateField("senderName", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Email</label>
                  <Input
                    type="email"
                    placeholder="billing@company.com"
                    value={invoice.senderEmail}
                    onChange={(e) => updateField("senderEmail", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Phone</label>
                  <Input
                    type="text"
                    placeholder="+1 234 567 890"
                    value={invoice.senderPhone}
                    onChange={(e) => updateField("senderPhone", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Address</label>
                <Input
                  type="text"
                  placeholder="123 Business Way, Suite 100"
                  value={invoice.senderAddress}
                  onChange={(e) => updateField("senderAddress", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">City</label>
                  <Input
                    type="text"
                    placeholder="City"
                    value={invoice.senderCity}
                    onChange={(e) => updateField("senderCity", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Postal</label>
                  <Input
                    type="text"
                    placeholder="Zip"
                    value={invoice.senderZipCode}
                    onChange={(e) => updateField("senderZipCode", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Country</label>
                  <Input
                    type="text"
                    placeholder="Country"
                    value={invoice.senderCountry}
                    onChange={(e) => updateField("senderCountry", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Tax ID / VAT</label>
                <Input
                  type="text"
                  placeholder="Tax Identification Number"
                  value={invoice.senderTaxId}
                  onChange={(e) => updateField("senderTaxId", e.target.value)}
                />
              </div>
            </div>
          )}
        </Card>

        {/* PRIMARY SPOTLIGHT: BILL TO (CLIENT) */}
        <Card className="p-4 sm:p-5 shadow-xs border-border bg-card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-border">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <User className="w-4 h-4 text-emerald-600" />
              <span>Bill To (Client) *</span>
            </div>

            {customers && customers.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs">
                <Users className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <NativeSelect
                  aria-label="Select existing client"
                  className="w-full sm:w-auto"
                  value={invoice.customerId ?? ""}
                  onChange={(e) => {
                    const id = e.target.value;
                    if (!id) {
                      updateField("customerId", null);
                      return;
                    }
                    const cust = customers.find((c) => c.id === id);
                    if (cust) {
                      updateField("customerId", cust.id);
                      updateField("receiverName", cust.name);
                      updateField("receiverEmail", cust.email);
                      updateField("receiverPhone", cust.phone);
                      updateField("receiverAddress", cust.address);
                      updateField("receiverCity", cust.city);
                      updateField("receiverZipCode", cust.zipCode);
                      updateField("receiverCountry", cust.country);
                      updateField("receiverTaxId", cust.taxId);
                    }
                  }}
                >
                  <option value="">Quick fill from saved clients...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.email ? `(${c.email})` : ""}
                    </option>
                  ))}
                </NativeSelect>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Client Name *</label>
              <Input
                type="text"
                placeholder="Company or Individual Name"
                className={cn(errors["receiverName"] && "border-destructive focus-visible:ring-destructive font-medium")}
                value={invoice.receiverName}
                onChange={(e) => updateField("receiverName", e.target.value)}
                required
              />
              {errors["receiverName"] && (
                <p className="text-[11px] text-destructive mt-1 font-medium">{errors["receiverName"]}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Client Tax ID / VAT</label>
              <Input
                type="text"
                placeholder="e.g. EU123456789 or Tax ID"
                value={invoice.receiverTaxId}
                onChange={(e) => updateField("receiverTaxId", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Email</label>
              <Input
                type="email"
                placeholder="client@company.com"
                value={invoice.receiverEmail}
                onChange={(e) => updateField("receiverEmail", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Phone</label>
              <Input
                type="text"
                placeholder="+1 987 654 321"
                value={invoice.receiverPhone}
                onChange={(e) => updateField("receiverPhone", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1">Address</label>
              <Input
                type="text"
                placeholder="Billing address"
                value={invoice.receiverAddress}
                onChange={(e) => updateField("receiverAddress", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">City</label>
              <Input
                type="text"
                placeholder="City"
                value={invoice.receiverCity}
                onChange={(e) => updateField("receiverCity", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Zip</label>
                <Input
                  type="text"
                  placeholder="Zip"
                  value={invoice.receiverZipCode}
                  onChange={(e) => updateField("receiverZipCode", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Country</label>
                <Input
                  type="text"
                  placeholder="Country"
                  value={invoice.receiverCountry}
                  onChange={(e) => updateField("receiverCountry", e.target.value)}
                />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* SECTION 3: LINE ITEMS */}
      <Card className="p-4 sm:p-5 shadow-xs border-border bg-card space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-foreground">Items & Services *</h3>
            {errors["items"] && (
              <p className="text-[11px] text-destructive font-medium mt-0.5">{errors["items"]}</p>
            )}
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={addItem}
            className="gap-1.5 text-xs text-primary"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Item
          </Button>
        </div>

        <div className="space-y-3">
          {invoice.items.map((item, index) => {
            const descError = errors[`items.${index}.description`];
            const qtyError = errors[`items.${index}.quantity`];
            const priceError = errors[`items.${index}.unitPrice`];

            return (
              <div
                key={index}
                className="p-3.5 bg-muted/40 rounded-xl border border-border/80 transition-all hover:border-border"
              >
                <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
                  <div className="flex-1 w-full">
                    <label className="block text-xs text-muted-foreground mb-1 font-medium">Description *</label>
                    <Input
                      type="text"
                      placeholder="Service or product description"
                      className={cn(descError && "border-destructive focus-visible:ring-destructive font-medium")}
                      value={item.description}
                      onChange={(e) => updateItem(index, "description", e.target.value)}
                      required
                    />
                    {descError && (
                      <p className="text-[10px] text-destructive mt-0.5 font-medium">{descError}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto pt-1 md:pt-0">
                    <div className="w-20 sm:w-24">
                      <label className="block text-xs text-muted-foreground mb-1 font-medium">Qty</label>
                      <Input
                        type="number"
                        min="1"
                        className={cn("text-right font-mono", qtyError && "border-destructive focus-visible:ring-destructive")}
                        value={item.quantity}
                        onChange={(e) => updateItem(index, "quantity", Number(e.target.value))}
                      />
                    </div>
                    <div className="w-24 sm:w-28">
                      <label className="block text-xs text-muted-foreground mb-1 font-medium">Rate ($)</label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        className={cn("text-right font-mono", priceError && "border-destructive focus-visible:ring-destructive")}
                        value={item.unitPrice}
                        onChange={(e) => updateItem(index, "unitPrice", Number(e.target.value))}
                      />
                    </div>
                    <div className="w-24 text-right pt-4 md:pt-0">
                      <label className="block text-xs text-muted-foreground mb-1 font-medium">Total</label>
                      <div className="py-1 text-sm font-bold text-foreground font-mono">
                        ${((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)).toFixed(2)}
                      </div>
                    </div>
                    {invoice.items.length > 1 && (
                      <div className="pt-4 md:pt-4">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(index)}
                          className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* SECTION 4: ADJUSTMENTS & TOTALS (COLLAPSIBLE / ACCORDION STYLE) */}
      <Card className="shadow-xs border-border bg-card overflow-hidden">
        <button
          type="button"
          onClick={() => setAdjustmentsOpen(!adjustmentsOpen)}
          className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-muted/40 transition-colors cursor-pointer text-left select-none"
        >
          <div className="flex items-center gap-2">
            <Percent className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Taxes, Discounts & Shipping</span>
            {(invoice.taxRate > 0 || invoice.discountRate > 0 || invoice.shippingAmount > 0) && (
              <span className="text-[10px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                Active
              </span>
            )}
          </div>
          {adjustmentsOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>

        {adjustmentsOpen && (
          <div className="p-4 sm:p-5 pt-0 border-t border-border grid grid-cols-1 sm:grid-cols-3 gap-4 bg-muted/20">
            <div className="pt-3">
              <label className="block text-xs font-medium text-foreground mb-1">
                Tax Rate (%)
              </label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.1"
                className="font-mono"
                value={invoice.taxRate}
                onChange={(e) => updateField("taxRate", Number(e.target.value))}
              />
            </div>
            <div className="pt-3">
              <label className="block text-xs font-medium text-foreground mb-1">
                Discount Rate (%)
              </label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.1"
                className="font-mono"
                value={invoice.discountRate}
                onChange={(e) => updateField("discountRate", Number(e.target.value))}
              />
            </div>
            <div className="pt-3">
              <label className="block text-xs font-medium text-foreground mb-1">
                Shipping / Handling ($)
              </label>
              <Input
                type="number"
                min="0"
                step="0.01"
                className="font-mono"
                value={invoice.shippingAmount}
                onChange={(e) => updateField("shippingAmount", Number(e.target.value))}
              />
            </div>
          </div>
        )}
      </Card>

      {/* SECTION 5: PAYMENT TERMS & MEMO */}
      <Card className="p-4 sm:p-5 shadow-xs border-border bg-card space-y-4">
        <div className="flex items-center gap-2 pb-2.5 border-b border-border text-sm font-semibold text-foreground">
          <FileText className="w-4 h-4 text-primary" />
          <span>Payment Terms & Notes</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Payment Terms
            </label>
            <Input
              type="text"
              placeholder="e.g. Net 14 - Direct Deposit"
              value={invoice.paymentTerms}
              onChange={(e) => updateField("paymentTerms", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Notes / Memo for Client
            </label>
            <Input
              type="text"
              placeholder="e.g. Thank you for your business!"
              value={invoice.notes}
              onChange={(e) => updateField("notes", e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* SECTION 6: BANKING DETAILS (COLLAPSIBLE / ACCORDION STYLE) */}
      <Card className="shadow-xs border-border bg-card overflow-hidden">
        <button
          type="button"
          onClick={() => setBankingOpen(!bankingOpen)}
          className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-muted/40 transition-colors cursor-pointer text-left select-none"
        >
          <div className="flex items-center gap-2">
            <Landmark className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Bank & Wire Information</span>
            {(invoice.bankName || invoice.bankAccountNumber) && (
              <span className="text-[10px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                Configured
              </span>
            )}
          </div>
          {bankingOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>

        {bankingOpen && (
          <div className="p-4 sm:p-5 pt-0 border-t border-border grid grid-cols-1 sm:grid-cols-3 gap-4 bg-muted/20">
            <div className="pt-3">
              <label className="block text-xs text-muted-foreground mb-1 font-medium">Bank Name</label>
              <Input
                type="text"
                placeholder="e.g. Chase Bank"
                value={invoice.bankName || ""}
                onChange={(e) => updateField("bankName", e.target.value)}
              />
            </div>
            <div className="pt-3">
              <label className="block text-xs text-muted-foreground mb-1 font-medium">Account Beneficiary</label>
              <Input
                type="text"
                placeholder="e.g. Acme Studio LLC"
                value={invoice.bankAccountName || ""}
                onChange={(e) => updateField("bankAccountName", e.target.value)}
              />
            </div>
            <div className="pt-3">
              <label className="block text-xs text-muted-foreground mb-1 font-medium">Account # / IBAN</label>
              <Input
                type="text"
                placeholder="e.g. 1234567890"
                value={invoice.bankAccountNumber || ""}
                onChange={(e) => updateField("bankAccountNumber", e.target.value)}
              />
            </div>
          </div>
        )}
      </Card>

      {/* SECTION 7: SIGNATURE */}
      <Card className="p-4 sm:p-5 shadow-xs border-border bg-card">
        <SignaturePad
          value={invoice.signatureData}
          onChange={(sig) => updateField("signatureData", sig)}
        />
      </Card>
    </div>
  );
}
