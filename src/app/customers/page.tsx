"use client";

import React, { useState } from "react";
import { Plus, Search, Trash2, Edit2, Users, Mail, Phone, MapPin } from "lucide-react";
import { api } from "~/trpc/react";
import { DashboardLayout } from "~/components/layout/DashboardLayout";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "~/components/ui/dialog";

export default function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    zipCode: "",
    country: "",
    taxId: "",
  });

  const utils = api.useUtils();

  const { data: customers, isLoading } = api.customer.getAll.useQuery({
    search: searchTerm,
  });

  const upsertMutation = api.customer.upsert.useMutation({
    onSuccess: () => {
      utils.customer.getAll.invalidate();
      closeModal();
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
    if (customer) {
      setEditingId(customer.id);
      setFormData({
        name: customer.name,
        email: customer.email ?? "",
        phone: customer.phone ?? "",
        address: customer.address ?? "",
        city: customer.city ?? "",
        zipCode: customer.zipCode ?? "",
        country: customer.country ?? "",
        taxId: customer.taxId ?? "",
      });
    } else {
      setEditingId(null);
      setFormData({
        name: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        zipCode: "",
        country: "",
        taxId: "",
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    upsertMutation.mutate({
      ...formData,
      id: editingId ?? undefined,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">Customers & Clients</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Manage your client contacts and billing profiles</p>
          </div>
          <Button onClick={() => openModal()} className="gap-2 self-start sm:self-auto">
            <Plus className="w-4 h-4" />
            <span>Add Customer</span>
          </Button>
        </div>

        {/* Search */}
        <Card className="p-3 sm:p-4">
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search clients by name, email, or tax ID..."
              className="pl-9 h-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
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
              <Card key={c.id} className="hover:border-border/80 transition-shadow flex flex-col justify-between">
                <CardHeader className="p-4 sm:p-5 pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base text-foreground font-semibold">{c.name}</CardTitle>
                      {c.taxId && (
                        <span className="inline-block text-[10px] font-mono bg-muted text-muted-foreground px-2 py-0.5 rounded mt-1">
                          Tax ID: {c.taxId}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openModal(c)}
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        title="Edit Customer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm(`Delete customer ${c.name}? This may impact existing drafts.`)) {
                            deleteMutation.mutate({ id: c.id });
                          }
                        }}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        title="Delete Customer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-5 pt-0 space-y-2 text-xs text-muted-foreground">
                  {c.email && (
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" />
                      <span className="truncate">{c.email}</span>
                    </div>
                  )}
                  {c.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" />
                      <span>{c.phone}</span>
                    </div>
                  )}
                  {(c.address || c.city || c.country) && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">
                        {[c.address, c.city, c.zipCode, c.country].filter(Boolean).join(", ")}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Upsert Customer Dialog */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Customer" : "New Customer"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-2">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Company or Person Name *</label>
                <Input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Acme Corp"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Email</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="billing@acme.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Phone</label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Tax ID / VAT Number</label>
                <Input
                  value={formData.taxId}
                  onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                  placeholder="US123456789"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Street Address</label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="123 Main St"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">City</label>
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="San Francisco"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">ZIP / Postal</label>
                  <Input
                    value={formData.zipCode}
                    onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                    placeholder="94105"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Country</label>
                  <Input
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="USA"
                  />
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={closeModal}>
                  Cancel
                </Button>
                <Button type="submit" disabled={upsertMutation.isPending}>
                  {upsertMutation.isPending ? "Saving..." : editingId ? "Update Customer" : "Create Customer"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
