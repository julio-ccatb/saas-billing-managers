"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  Eye, 
  FileText,
  Download
} from "lucide-react";
import { api } from "~/trpc/react";
import { formatCurrency, formatDate } from "~/lib/utils/format";
import { DashboardLayout } from "~/components/layout/DashboardLayout";

export default function InvoicesPage() {
  const [statusFilter, setStatusFilter] = useState<"ALL" | "DRAFT" | "PENDING" | "PAID" | "OVERDUE">("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  const utils = api.useUtils();

  const { data, isLoading } = api.invoice.getAll.useQuery({
    status: statusFilter,
    search: searchTerm,
    page,
    pageSize: 15,
  });

  const updateStatusMutation = api.invoice.updateStatus.useMutation({
    onSuccess: () => {
      utils.invoice.getAll.invalidate();
      utils.invoice.getMetrics.invalidate();
    },
  });

  const deleteMutation = api.invoice.delete.useMutation({
    onSuccess: () => {
      utils.invoice.getAll.invalidate();
      utils.invoice.getMetrics.invalidate();
    },
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Invoices</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage, track, and issue billing statements</p>
          </div>
          <Link
            href="/invoices/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg shadow-xs transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Create Invoice
          </Link>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Search */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by invoice # or client..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {(["ALL", "PENDING", "PAID", "OVERDUE", "DRAFT"] as const).map((st) => (
              <button
                key={st}
                onClick={() => {
                  setStatusFilter(st);
                  setPage(1);
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  statusFilter === st
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                  <th className="py-3.5 px-5">Invoice #</th>
                  <th className="py-3.5 px-5">Client</th>
                  <th className="py-3.5 px-5">Issue Date</th>
                  <th className="py-3.5 px-5">Due Date</th>
                  <th className="py-3.5 px-5">Amount</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-400">
                      Loading invoices...
                    </td>
                  </tr>
                ) : !data?.invoices || data.invoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-16">
                      <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-600 font-semibold">No invoices match your filter</p>
                      <p className="text-gray-400 text-xs mt-1">Try adjusting your search query or status filter.</p>
                    </td>
                  </tr>
                ) : (
                  data.invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-4 px-5 font-bold text-gray-900">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-4 px-5">
                        <div className="font-medium text-gray-900">{inv.receiverName}</div>
                        {inv.receiverEmail && (
                          <div className="text-xs text-gray-400">{inv.receiverEmail}</div>
                        )}
                      </td>
                      <td className="py-4 px-5 text-gray-500 text-xs">
                        {formatDate(inv.issueDate)}
                      </td>
                      <td className="py-4 px-5 text-gray-500 text-xs">
                        {formatDate(inv.dueDate)}
                      </td>
                      <td className="py-4 px-5 font-bold text-gray-900">
                        {formatCurrency(inv.totalAmount, inv.currency)}
                      </td>
                      <td className="py-4 px-5">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                            inv.status === "PAID"
                              ? "bg-emerald-100 text-emerald-700"
                              : inv.status === "OVERDUE"
                              ? "bg-rose-100 text-rose-700"
                              : inv.status === "DRAFT"
                              ? "bg-gray-100 text-gray-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {inv.status !== "PAID" && (
                            <button
                              onClick={() =>
                                updateStatusMutation.mutate({ id: inv.id, status: "PAID" })
                              }
                              className="p-1.5 text-gray-400 hover:text-emerald-600 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
                              title="Mark as Paid"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={async () => {
                              try {
                                const res = await fetch("/api/invoice/export-pdf", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ id: inv.id }),
                                });
                                if (!res.ok) throw new Error("Failed to generate PDF");
                                const blob = await res.blob();
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement("a");
                                a.href = url;
                                a.download = `invoice-${inv.invoiceNumber}.pdf`;
                                a.click();
                                window.URL.revokeObjectURL(url);
                              } catch (err: any) {
                                alert(`Error downloading PDF: ${err.message}`);
                              }
                            }}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
                            title="Download PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <Link
                            href={`/invoices/${inv.id}/edit`}
                            className="p-1.5 text-gray-400 hover:text-blue-600 rounded-md hover:bg-gray-100 transition-colors"
                            title="Edit Invoice"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => {
                              if (confirm(`Delete invoice ${inv.invoiceNumber}?`)) {
                                deleteMutation.mutate({ id: inv.id });
                              }
                            }}
                            className="p-1.5 text-gray-400 hover:text-rose-600 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
                            title="Delete Invoice"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <span>
                Showing page {data.page} of {data.totalPages} ({data.totalCount} total)
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1.5 border border-gray-200 rounded-md disabled:opacity-40 hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  disabled={page >= data.totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1.5 border border-gray-200 rounded-md disabled:opacity-40 hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
