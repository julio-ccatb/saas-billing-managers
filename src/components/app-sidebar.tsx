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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: profile } = api.profile.get.useQuery()

  const user = {
    name: profile?.companyName || "Billing Admin",
    email: profile?.email || "admin@invoify.com",
    avatar: profile?.logoUrl || "/avatars/user.jpg",
  }

  const teams = [
    {
      name: profile?.companyName || "Invoify Workspace",
      logo: <Building2Icon className="size-4" />,
      plan: "Production",
    },
  ]

  const navMain = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: <LayoutDashboardIcon />,
    },
    {
      title: "Invoices",
      url: "/dashboard/invoices",
      icon: <ReceiptTextIcon />,
      items: [
        {
          title: "All Invoices",
          url: "/dashboard/invoices",
        },
        {
          title: "New Invoice",
          url: "/dashboard/invoices/new",
        },
      ],
    },
    {
      title: "Customers",
      url: "/dashboard/customers",
      icon: <UsersIcon />,
    },
    {
      title: "Licenses",
      url: "/dashboard/licenses",
      icon: <KeyRoundIcon />,
    },
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: <Settings2Icon />,
    },
  ]

  const quickActions = [
    {
      name: "New Invoice",
      url: "/dashboard/invoices/new",
      icon: <FilePlusIcon />,
    },
    {
      name: "Manage Customers",
      url: "/dashboard/customers",
      icon: <UsersIcon />,
    },
    {
      name: "Company & Banking",
      url: "/dashboard/settings",
      icon: <CreditCardIcon />,
    },
  ]

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={teams} />
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
