"use client"

import * as React from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "~/components/ui/sidebar"
import { ChevronsUpDownIcon, PlusIcon, Building2Icon, Check, Users } from "lucide-react"
import { useCompany } from "./company/CompanyContext"

export function TeamSwitcher() {
  const { isMobile } = useSidebar()
  const { companies, activeCompany, switchCompany, setIsCreateModalOpen, setIsMembersModalOpen } = useCompany()

  const activeName = activeCompany?.name || "My Workspace"
  const activeRole = activeCompany?.role ? `${activeCompany.role} (${activeCompany.currency})` : "Workspace"

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground"
              />
            }
          >
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground font-bold">
              {activeCompany?.logoUrl ? (
                <img src={activeCompany.logoUrl} alt={activeName} className="size-8 rounded-lg object-cover" />
              ) : (
                <Building2Icon className="size-4" />
              )}
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{activeName}</span>
              <span className="truncate text-xs text-muted-foreground">{activeRole}</span>
            </div>
            <ChevronsUpDownIcon className="ml-auto" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-64"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Companies &amp; Workspaces
              </DropdownMenuLabel>
              {companies.map((team, index) => {
                const isCurrent = team.id === activeCompany?.id
                return (
                  <DropdownMenuItem
                    key={team.id}
                    onClick={() => switchCompany(team.id)}
                    className="gap-2 p-2 cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex size-6 items-center justify-center rounded-md border bg-muted/40 shrink-0">
                        {team.logoUrl ? (
                          <img src={team.logoUrl} alt={team.name} className="size-5 rounded-md object-cover" />
                        ) : (
                          <Building2Icon className="size-3.5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="truncate">
                        <span className="truncate text-xs font-medium block">{team.name}</span>
                        <span className="text-[10px] text-muted-foreground block">{team.currency} • {team.role}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {isCurrent && <Check className="w-3.5 h-3.5 text-primary" />}
                      <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                    </div>
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                className="gap-2 p-2 cursor-pointer"
                onClick={() => setIsMembersModalOpen(true)}
              >
                <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                  <Users className="size-3.5 text-muted-foreground" />
                </div>
                <div className="font-medium text-xs text-muted-foreground">
                  Manage team members
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2 p-2 cursor-pointer"
                onClick={() => setIsCreateModalOpen(true)}
              >
                <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                  <PlusIcon className="size-4" />
                </div>
                <div className="font-medium text-xs text-muted-foreground">
                  Add company
                </div>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}


