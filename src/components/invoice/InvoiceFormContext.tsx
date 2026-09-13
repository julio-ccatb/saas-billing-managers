"use client";

import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import type { InvoiceInput } from "~/lib/schemas/invoice";
import { invoiceSchema } from "~/lib/schemas/invoice";

export const initialInvoiceState: InvoiceInput = {
  invoiceNumber: "INV-2026-0001",
  issueDate: new Date(),
  dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
  status: "PENDING",
  currency: "USD",

  senderName: "Acme Studios Inc.",
  senderEmail: "billing@acmestudios.com",
  senderPhone: "+1 (555) 234-5678",
  senderAddress: "100 Innovation Way, Suite 400",
  senderCity: "San Francisco",
  senderZipCode: "94107",
  senderCountry: "United States",
  senderTaxId: "US-987654321",

  receiverName: "Global Tech Enterprises",
  receiverEmail: "accounts@globaltech.io",
  receiverPhone: "+1 (555) 987-6543",
  receiverAddress: "450 Market Street, 12th Floor",
  receiverCity: "San Francisco",
  receiverZipCode: "94105",
  receiverCountry: "United States",
  receiverTaxId: "US-123456789",

  items: [
    {
      description: "Frontend Design & Web App Architecture",
      quantity: 40,
      unitPrice: 120,
      total: 4800,
      orderIndex: 0,
    },
    {
      description: "API Integration & Database Modeling",
      quantity: 25,
      unitPrice: 140,
      total: 3500,
      orderIndex: 1,
    },
  ],

  taxRate: 8,
  discountRate: 5,
  shippingAmount: 0,
  notes: "Thank you for partnering with us. Please settle within terms.",
  paymentTerms: "Net 14 - Direct Bank Transfer or Credit Card",
  bankName: "",
  bankAccountName: "",
  bankAccountNumber: "",
  templateId: "classic",
  themeColor: "#4F46E5",
  logoUrl: null,
  signatureData: null,
};

export type FormErrors = Record<string, string>;

interface InvoiceFormContextType {
  invoice: InvoiceInput;
  setInvoice: React.Dispatch<React.SetStateAction<InvoiceInput>>;
  updateField: <K extends keyof InvoiceInput>(field: K, value: InvoiceInput[K]) => void;
  addItem: () => void;
  removeItem: (index: number) => void;
  updateItem: (index: number, field: keyof InvoiceInput["items"][0], value: any) => void;
  errors: FormErrors;
  validateForm: () => boolean;
  clearError: (field: string) => void;
}

const InvoiceFormContext = createContext<InvoiceFormContextType | undefined>(undefined);

export function InvoiceFormProvider({
  children,
  initialData,
}: {
  children: React.ReactNode;
  initialData?: InvoiceInput;
}) {
  const [invoice, setInvoice] = useState<InvoiceInput>(initialData ?? initialInvoiceState);
  const [errors, setErrors] = useState<FormErrors>({});

  const clearError = useCallback((field: string) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });
  }, []);

  const updateField = useCallback(<K extends keyof InvoiceInput>(field: K, value: InvoiceInput[K]) => {
    setInvoice((prev) => ({ ...prev, [field]: value }));
    clearError(field as string);
  }, [clearError]);

  const addItem = useCallback(() => {
    setInvoice((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          description: "",
          quantity: 1,
          unitPrice: 0,
          total: 0,
          orderIndex: prev.items.length,
        },
      ],
    }));
    clearError("items");
  }, [clearError]);

  const removeItem = useCallback((index: number) => {
    setInvoice((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  }, []);

  const updateItem = useCallback((index: number, field: keyof InvoiceInput["items"][0], value: any) => {
    setInvoice((prev) => {
      const newItems = [...prev.items];
      const target = { ...newItems[index]! };
      (target as any)[field] = value;

      if (field === "quantity" || field === "unitPrice") {
        const qty = field === "quantity" ? Number(value) : target.quantity;
        const price = field === "unitPrice" ? Number(value) : target.unitPrice;
        target.total = Number((qty * price).toFixed(2));
      }

      newItems[index] = target;
      return { ...prev, items: newItems };
    });
    clearError(`items.${index}.${field}`);
    clearError("items");
  }, [clearError]);

  const validateForm = useCallback(() => {
    const result = invoiceSchema.safeParse(invoice);
    if (!result.success) {
      const newErrors: FormErrors = {};
      result.error.errors.forEach((err) => {
        const path = err.path.join(".");
        newErrors[path] = err.message;
      });
      setErrors(newErrors);
      return false;
    }
    setErrors({});
    return true;
  }, [invoice]);

  const value = useMemo(
    () => ({
      invoice,
      setInvoice,
      updateField,
      addItem,
      removeItem,
      updateItem,
      errors,
      validateForm,
      clearError,
    }),
    [invoice, updateField, addItem, removeItem, updateItem, errors, validateForm, clearError]
  );

  return (
    <InvoiceFormContext.Provider value={value}>
      {children}
    </InvoiceFormContext.Provider>
  );
}

export function useInvoiceForm() {
  const context = useContext(InvoiceFormContext);
  if (!context) {
    throw new Error("useInvoiceForm must be used within an InvoiceFormProvider");
  }
  return context;
}
