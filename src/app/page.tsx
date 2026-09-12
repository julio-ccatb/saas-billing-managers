"use client";

import React from "react";
import Link from "next/link";
import { 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  FileText,
  ArrowRight
} from "lucide-react";
import { api } from "~/trpc/react";
import { formatCurrency, formatDate } from "~/lib/utils/format";
import { DashboardLayout } from "~/components/layout/DashboardLayout";

export default function DashboardPage() {
  const { data: metrics, isLoading: loadingMetrics } = api.invoice.getMetrics.useQuery(undefined, {
    retry: false,
  });

  const { data: recentData, isLoading: loadingInvoices } = api.invoice.getAll.useQuery(
    { page: 1, pageSize: 5 },
    { retry: false }
  );

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Financial Overview</h1>
            <p className="text-sm text-gray-500 mt-0.5">Track your invoices, revenue, and pending collections</p>
          </div>
          <Link
            href="/invoices/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg shadow-xs transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Create Invoice
          </Link>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Invoiced */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Invoiced</p>
              <p className="text-xl font-bold text-gray-900 mt-1">
                {loadingMetrics ? "..." : formatCurrency(metrics?.totalInvoiced ?? 0)}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{metrics?.counts.total ?? 0} invoices</p>
            </div>
          </div>

          {/* Paid */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Collected</p>
              <p className="text-xl font-bold text-gray-900 mt-1">
                {loadingMetrics ? "..." : formatCurrency(metrics?.totalPaid ?? 0)}
              </p>
              <p className="text-xs text-emerald-600 font-medium mt-0.5">{metrics?.counts.paid ?? 0} paid</p>
            </div>
          </div>

          {/* Pending */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Pending</p>
              <p className="text-xl font-bold text-gray-900 mt-1">
                {loadingMetrics ? "..." : formatCurrency(metrics?.totalPending ?? 0)}
              </p>
              <p className="text-xs text-amber-600 font-medium mt-0.5">{metrics?.counts.pending ?? 0} awaiting</p>
            </div>
          </div>

          {/* Overdue */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex items-center gap-4">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-lg">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Overdue</p>
              <p className="text-xl font-bold text-gray-900 mt-1">
                {loadingMetrics ? "..." : formatCurrency(metrics?.totalOverdue ?? 0)}
              </p>
              <p className="text-xs text-rose-600 font-medium mt-0.5">{metrics?.counts.overdue ?? 0} overdue</p>
            </div>
          </div>
        </div>

        {/* Recent Invoices Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">Recent Invoices</h2>
              <p className="text-xs text-gray-500">Latest billing activity and updates</p>
            </div>
            <Link
              href="/invoices"
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                  <th className="py-3 px-5">Invoice</th>
                  <th className="py-3 px-5">Client</th>
                  <th className="py-3 px-5">Due Date</th>
                  <th className="py-3 px-5">Amount</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loadingInvoices ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-400">
                      Loading invoices...
                    </td>
                  </tr>
                ) : !recentData?.invoices || recentData.invoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12">
                      <div className="max-w-sm mx-auto space-y-3">
                        <FileText className="w-10 h-10 text-gray-300 mx-auto" />
                        <p className="text-gray-500 font-medium">No invoices created yet</p>
                        <Link
                          href="/invoices/new"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" /> Create your first invoice
                        </Link>
                      </div>
                    </td>
                  </tr>
                ) : (
                  recentData.invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3.5 px-5 font-semibold text-gray-900">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3.5 px-5 text-gray-600">
                        {inv.receiverName}
                      </td>
                      <td className="py-3.5 px-5 text-gray-500 text-xs">
                        {formatDate(inv.dueDate)}
                      </td>
                      <td className="py-3.5 px-5 font-semibold text-gray-900">
                        {formatCurrency(inv.totalAmount, inv.currency)}
                      </td>
                      <td className="py-3.5 px-5">
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
                      <td className="py-3.5 px-5 text-right">
                        <Link
                          href={`/invoices/${inv.id}/edit`}
                          className="text-xs font-medium text-blue-600 hover:text-blue-800"
                        >
                          View / Edit
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
