"use client";

import React from "react";
import { useInvoiceForm } from "./InvoiceFormContext";
import { Plus, Trash2, Building2, User, Users, Calendar, CreditCard, Percent, Truck, Landmark } from "lucide-react";
import { api } from "~/trpc/react";
import { LogoUploader } from "./LogoUploader";
import { SignaturePad } from "./SignaturePad";

export function InvoiceFormEditor() {
  const { invoice, updateField, addItem, removeItem, updateItem } = useInvoiceForm();
  const { data: customers } = api.customer.getAll.useQuery();

  return (
    <div className="space-y-8 p-6 bg-white border border-gray-200 rounded-xl shadow-xs">
      {/* Top Branding & Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pb-6 border-b border-gray-100 items-end">
        <div>
          <LogoUploader
            value={invoice.logoUrl}
            onChange={(base64) => updateField("logoUrl", base64)}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Invoice Number
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            value={invoice.invoiceNumber}
            onChange={(e) => updateField("invoiceNumber", e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Issue Date
            </span>
          </label>
          <input
            type="date"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            value={invoice.issueDate ? new Date(invoice.issueDate).toISOString().split("T")[0] : ""}
            onChange={(e) => updateField("issueDate", new Date(e.target.value))}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Due Date
            </span>
          </label>
          <input
            type="date"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            value={invoice.dueDate ? new Date(invoice.dueDate).toISOString().split("T")[0] : ""}
            onChange={(e) => updateField("dueDate", new Date(e.target.value))}
          />
        </div>
      </div>

      {/* From & To Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* From (Sender) */}
        <div className="space-y-3 bg-gray-50/70 p-4 rounded-lg border border-gray-100">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 pb-1 border-b border-gray-200">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>From (Your Business)</span>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Company / Name</label>
            <input
              type="text"
              placeholder="e.g. Acme Studio"
              className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm"
              value={invoice.senderName}
              onChange={(e) => updateField("senderName", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Email</label>
              <input
                type="email"
                placeholder="billing@company.com"
                className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm"
                value={invoice.senderEmail}
                onChange={(e) => updateField("senderEmail", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Phone</label>
              <input
                type="text"
                placeholder="+1 234 567"
                className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm"
                value={invoice.senderPhone}
                onChange={(e) => updateField("senderPhone", e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Address</label>
            <input
              type="text"
              placeholder="Street address"
              className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm"
              value={invoice.senderAddress}
              onChange={(e) => updateField("senderAddress", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">City</label>
              <input
                type="text"
                placeholder="City"
                className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm"
                value={invoice.senderCity}
                onChange={(e) => updateField("senderCity", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Postal Code</label>
              <input
                type="text"
                placeholder="Zip"
                className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm"
                value={invoice.senderZipCode}
                onChange={(e) => updateField("senderZipCode", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Country</label>
              <input
                type="text"
                placeholder="Country"
                className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm"
                value={invoice.senderCountry}
                onChange={(e) => updateField("senderCountry", e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Tax ID / VAT</label>
            <input
              type="text"
              placeholder="Tax Identification Number"
              className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm"
              value={invoice.senderTaxId}
              onChange={(e) => updateField("senderTaxId", e.target.value)}
            />
          </div>
        </div>

        {/* To (Client) */}
        <div className="space-y-3 bg-gray-50/70 p-4 rounded-lg border border-gray-100">
          <div className="flex items-center justify-between pb-1 border-b border-gray-200">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
              <User className="w-4 h-4 text-emerald-600" />
              <span>Bill To (Client)</span>
            </div>
            {customers && customers.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs">
                <Users className="w-3.5 h-3.5 text-gray-400" />
                <select
                  aria-label="Select existing client"
                  className="bg-white border border-gray-300 rounded px-2 py-0.5 text-xs text-gray-700"
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
                  <option value="">Choose saved client...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.email ? `(${c.email})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Client Name *</label>
            <input
              type="text"
              placeholder="Client / Company Name"
              className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm"
              value={invoice.receiverName}
              onChange={(e) => updateField("receiverName", e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Email</label>
              <input
                type="email"
                placeholder="client@company.com"
                className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm"
                value={invoice.receiverEmail}
                onChange={(e) => updateField("receiverEmail", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Phone</label>
              <input
                type="text"
                placeholder="+1 987 654"
                className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm"
                value={invoice.receiverPhone}
                onChange={(e) => updateField("receiverPhone", e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Address</label>
            <input
              type="text"
              placeholder="Client billing address"
              className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm"
              value={invoice.receiverAddress}
              onChange={(e) => updateField("receiverAddress", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">City</label>
              <input
                type="text"
                placeholder="City"
                className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm"
                value={invoice.receiverCity}
                onChange={(e) => updateField("receiverCity", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Postal Code</label>
              <input
                type="text"
                placeholder="Zip"
                className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm"
                value={invoice.receiverZipCode}
                onChange={(e) => updateField("receiverZipCode", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Country</label>
              <input
                type="text"
                placeholder="Country"
                className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm"
                value={invoice.receiverCountry}
                onChange={(e) => updateField("receiverCountry", e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Tax ID / VAT</label>
            <input
              type="text"
              placeholder="Client Tax ID"
              className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm"
              value={invoice.receiverTaxId}
              onChange={(e) => updateField("receiverTaxId", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Line Items Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-800">Items & Services</h3>
          <button
            type="button"
            onClick={addItem}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Item
          </button>
        </div>

        <div className="space-y-3">
          {invoice.items.map((item, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200/60"
            >
              <div className="flex-1">
                <label className="block text-xs text-gray-400 mb-1">Description</label>
                <input
                  type="text"
                  placeholder="Item or service description"
                  className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm"
                  value={item.description}
                  onChange={(e) => updateItem(index, "description", e.target.value)}
                  required
                />
              </div>
              <div className="w-24">
                <label className="block text-xs text-gray-400 mb-1">Qty</label>
                <input
                  type="number"
                  min="1"
                  className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm text-right"
                  value={item.quantity}
                  onChange={(e) => updateItem(index, "quantity", Number(e.target.value))}
                />
              </div>
              <div className="w-28">
                <label className="block text-xs text-gray-400 mb-1">Rate</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm text-right"
                  value={item.unitPrice}
                  onChange={(e) => updateItem(index, "unitPrice", Number(e.target.value))}
                />
              </div>
              <div className="w-28 text-right">
                <label className="block text-xs text-gray-400 mb-1">Total</label>
                <div className="py-1.5 text-sm font-medium text-gray-900">
                  ${((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)).toFixed(2)}
                </div>
              </div>
              {invoice.items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="mt-6 text-gray-400 hover:text-red-500 transition-colors p-1 cursor-pointer"
                  title="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Adjustments: Tax, Discount, Shipping */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200/60">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            <span className="inline-flex items-center gap-1">
              <Percent className="w-3.5 h-3.5 text-gray-500" /> Tax Rate (%)
            </span>
          </label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm"
            value={invoice.taxRate}
            onChange={(e) => updateField("taxRate", Number(e.target.value))}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            <span className="inline-flex items-center gap-1">
              <Percent className="w-3.5 h-3.5 text-gray-500" /> Discount Rate (%)
            </span>
          </label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm"
            value={invoice.discountRate}
            onChange={(e) => updateField("discountRate", Number(e.target.value))}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            <span className="inline-flex items-center gap-1">
              <Truck className="w-3.5 h-3.5 text-gray-500" /> Shipping / Handling ($)
            </span>
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm"
            value={invoice.shippingAmount}
            onChange={(e) => updateField("shippingAmount", Number(e.target.value))}
          />
        </div>
      </div>

      {/* Notes & Payment Terms */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Payment Terms
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            value={invoice.paymentTerms}
            onChange={(e) => updateField("paymentTerms", e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Notes / Memo
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            value={invoice.notes}
            onChange={(e) => updateField("notes", e.target.value)}
          />
        </div>
      </div>

      {/* Payment & Bank Information */}
      <div className="space-y-3 bg-gray-50/70 p-4 rounded-lg border border-gray-100">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 pb-1 border-b border-gray-200">
          <Landmark className="w-4 h-4 text-blue-600" />
          <span>Payment Information (Bank Details)</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Bank Name</label>
            <input
              type="text"
              placeholder="e.g. Chase"
              className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm"
              value={invoice.bankName || ""}
              onChange={(e) => updateField("bankName", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Account Name</label>
            <input
              type="text"
              placeholder="e.g. Acme Studio LLC"
              className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm"
              value={invoice.bankAccountName || ""}
              onChange={(e) => updateField("bankAccountName", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Account Number / IBAN</label>
            <input
              type="text"
              placeholder="e.g. 1234567890"
              className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm"
              value={invoice.bankAccountNumber || ""}
              onChange={(e) => updateField("bankAccountNumber", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Signature Section */}
      <div className="pt-4 border-t border-gray-100">
        <SignaturePad
          value={invoice.signatureData}
          onChange={(sig) => updateField("signatureData", sig)}
        />
      </div>
    </div>
  );
}
