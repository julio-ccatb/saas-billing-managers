"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { SearchInput } from "~/components/SearchInput";
import { AppRoutes } from "~/config/routes";
import { type CustomerUpsertValues } from "~/lib/schemas/forms";
import { CustomerCard } from "~/features/clients/components/CustomerCard";
import { CustomerUpsertDialog } from "~/features/clients/components/CustomerUpsertDialog";

export default function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);

  const utils = api.useUtils();

  const { data: customers, isLoading } = api.customer.getAll.useQuery({
    search: searchTerm,
  });

  const upsertMutation = api.customer.upsert.useMutation({
    onSuccess: () => {
      utils.customer.getAll.invalidate();
      setIsModalOpen(false);
      setEditingCustomer(null);
    },
    onError: (err) => {
      alert(`Error saving customer: ${err.message}`);
    },
  });

  const deleteMutation = api.customer.delete.useMutation({
    onSuccess: () => {
      utils.customer.getAll.invalidate();
    },
  });

  const openModal = (customer?: any) => {
    setEditingCustomer(customer ?? null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCustomer(null);
  };

  const handleSubmit = (values: CustomerUpsertValues) => {
    upsertMutation.mutate({
      id: editingCustomer?.id ?? undefined,
      ...values,
    });
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Delete customer ${name}? This may impact existing drafts.`)) {
      deleteMutation.mutate({ id });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">Customers &amp; Clients</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Manage your client contacts and billing profiles</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => openModal()}
            className="gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Quick Add</span>
          </Button>
          <Button
            render={<Link href={AppRoutes.CUSTOMER_NEW} />}
            size="sm"
            className="gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Onboard Client</span>
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card className="p-3 sm:p-4">
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search clients by name, email, or tax ID..."
          className="w-full max-w-md"
        />
      </Card>

      {/* Customer Cards Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground text-xs">Loading customers...</div>
      ) : !customers || customers.length === 0 ? (
        <Card className="text-center py-16 px-4">
          <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-foreground font-semibold text-sm">No customers found</p>
          <p className="text-muted-foreground text-xs mt-1 mb-4">Add your first client to start sending invoices quickly.</p>
          <Button onClick={() => openModal()} variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-1.5" /> Add Customer
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {customers.map((c) => (
            <CustomerCard
              key={c.id}
              customer={c}
              onEdit={openModal}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Upsert Customer Dialog */}
      <CustomerUpsertDialog
        isOpen={isModalOpen}
        editingCustomer={editingCustomer}
        onClose={closeModal}
        onSubmit={handleSubmit}
        isPending={upsertMutation.isPending}
      />
    </div>
  );
}
