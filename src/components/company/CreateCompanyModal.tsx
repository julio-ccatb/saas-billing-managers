"use client";

import React, { useState } from "react";
import { api } from "~/trpc/react";
import { useCompany } from "./CompanyContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

export function CreateCompanyModal() {
  const { isCreateModalOpen, setIsCreateModalOpen, switchCompany } = useCompany();
  const utils = api.useUtils();

  const [formData, setFormData] = useState({
    name: "",
    currency: "USD",
    email: "",
    phone: "",
    taxId: "",
    address: "",
    city: "",
    zipCode: "",
    country: "",
  });

  const createMutation = api.company.create.useMutation({
    onSuccess: (newCompany) => {
      utils.company.list.invalidate();
      switchCompany(newCompany.id);
      setIsCreateModalOpen(false);
      setFormData({
        name: "",
        currency: "USD",
        email: "",
        phone: "",
        taxId: "",
        address: "",
        city: "",
        zipCode: "",
        country: "",
      });
    },
    onError: (err) => {
      alert(`Error creating company: ${err.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    createMutation.mutate(formData);
  };

  return (
    <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Company Workspace</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Company / Legal Name *
            </label>
            <Input
              required
              placeholder="e.g. Acme Cloud Corp"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Currency
              </label>
              <select
                className="w-full px-3 py-2 border border-input rounded-lg bg-card text-foreground text-sm focus:outline-hidden focus:ring-2 focus:ring-ring"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="CAD">CAD ($)</option>
                <option value="AUD">AUD ($)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Tax / VAT ID
              </label>
              <Input
                placeholder="e.g. US-123456"
                value={formData.taxId}
                onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Billing Email
              </label>
              <Input
                type="email"
                placeholder="billing@company.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Phone
              </label>
              <Input
                placeholder="+1 (555) 000-0000"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Address
            </label>
            <Input
              placeholder="100 Innovation Way"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">City</label>
              <Input
                placeholder="New York"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">ZIP</label>
              <Input
                placeholder="10001"
                value={formData.zipCode}
                onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Country</label>
              <Input
                placeholder="USA"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Workspace"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
