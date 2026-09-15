"use client"

import * as React from "react"
import {
  LayoutDashboardIcon,
  ReceiptTextIcon,
  UsersIcon,
  KeyRoundIcon,
  Settings2Icon,
  PlusCircleIcon,
  Building2Icon,
  CreditCardIcon,
  FilePlusIcon,
} from "lucide-react"

import { NavMain } from "~/components/nav-main"
import { NavProjects } from "~/components/nav-projects"
import { NavUser } from "~/components/nav-user"
import { TeamSwitcher } from "~/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "~/components/ui/sidebar"
import { api } from "~/trpc/react"

import { AppRoutes } from "~/config/routes"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: profile } = api.profile.get.useQuery()

  const user = {
    name: profile?.companyName || "Billing Admin",
    email: profile?.email || "admin@invoify.com",
    avatar: profile?.logoUrl || "/avatars/user.jpg",
  }

  const navMain = [
    {
      title: "Dashboard",
      url: AppRoutes.DASHBOARD,
      icon: <LayoutDashboardIcon />,
    },
    {
      title: "Invoices",
      url: AppRoutes.INVOICES,
      icon: <ReceiptTextIcon />,
      items: [
        {
          title: "All Invoices",
          url: AppRoutes.INVOICES,
        },
        {
          title: "New Invoice",
          url: AppRoutes.INVOICE_NEW(),
        },
      ],
    },
    {
      title: "Customers",
      url: AppRoutes.CUSTOMERS,
      icon: <UsersIcon />,
    },
    {
      title: "Contracts",
      url: AppRoutes.CONTRACTS,
      icon: <CreditCardIcon />,
    },
    {
      title: "Licenses & Services",
      url: AppRoutes.LICENSES,
      icon: <KeyRoundIcon />,
    },
    {
      title: "Audit Ledger",
      url: AppRoutes.AUDIT,
      icon: <Building2Icon />,
    },
    {
      title: "Settings",
      url: AppRoutes.SETTINGS,
      icon: <Settings2Icon />,
    },
  ]

  const quickActions = [
    {
      name: "Onboard Client",
      url: AppRoutes.CUSTOMER_NEW,
      icon: <UsersIcon />,
    },
    {
      name: "New Invoice",
      url: AppRoutes.INVOICE_NEW(),
      icon: <FilePlusIcon />,
    },
    {
      name: "Manage Clients",
      url: AppRoutes.CUSTOMERS,
      icon: <Building2Icon />,
    },
    {
      name: "Company & Banking",
      url: AppRoutes.SETTINGS,
      icon: <CreditCardIcon />,
    },
  ]

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavProjects projects={quickActions} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
