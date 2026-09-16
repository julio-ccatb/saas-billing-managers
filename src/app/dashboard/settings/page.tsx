"use client";

import React, { useState } from "react";
import { Building2, Users } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/components/ui/tabs";
import { api } from "~/trpc/react";
import { CompanyProfileForm } from "~/features/settings/components/CompanyProfileForm";
import { TeamMembersSection } from "~/features/settings/components/TeamMembersSection";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const { data: members } = api.company.getMembers.useQuery();

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">Business Settings</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          Configure default company sender information, currency, payment details, and terms
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as string)} className="w-full">
        <TabsList className="bg-muted p-1 rounded-xl h-10 w-fit">
          <TabsTrigger value="profile" className="gap-2 text-xs font-semibold px-3 py-1.5 data-[state=active]:bg-card">
            <Building2 className="w-3.5 h-3.5" />
            <span>Company Profile &amp; Banking</span>
          </TabsTrigger>
          <TabsTrigger value="members" className="gap-2 text-xs font-semibold px-3 py-1.5 data-[state=active]:bg-card">
            <Users className="w-3.5 h-3.5" />
            <span>Workspace Members ({members?.length || 0})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="pt-2">
          <CompanyProfileForm />
        </TabsContent>

        <TabsContent value="members" className="pt-2">
          <TeamMembersSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
