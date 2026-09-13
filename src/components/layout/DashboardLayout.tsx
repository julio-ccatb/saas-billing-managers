"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  FileText, 
  Users, 
  Settings, 
  LayoutDashboard, 
  PlusCircle, 
  Menu, 
  X,
  CreditCard,
  LogOut,
  KeyRound
} from "lucide-react";
import { cn } from "~/lib/utils";
import { useSession, signOut } from "next-auth/react";
import { Button } from "~/components/ui/button";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Invoices", href: "/invoices", icon: FileText },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Licenses", href: "/licenses", icon: KeyRound },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row text-foreground">
      {/* Mobile Topbar with ergonomic touch target */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-card/95 backdrop-blur-sm border-b border-border shadow-xs">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="p-2 bg-primary rounded-lg text-primary-foreground shadow-xs">
            <CreditCard className="w-4 h-4" />
          </div>
          <span className="font-bold text-foreground text-sm tracking-tight">Invoify SaaS</span>
        </Link>
        <button
          type="button"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label={sidebarOpen ? "Close menu" : "Open menu"}
          className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted active:scale-95 transition-colors cursor-pointer"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Backdrop for mobile drawer */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-card border-r border-border flex flex-col transition-transform duration-200 ease-out md:static md:w-64 md:translate-x-0 md:z-auto",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg text-primary-foreground shadow-xs">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-foreground text-sm leading-tight">Billing Manager</h2>
              <span className="text-[10px] font-semibold text-primary tracking-wider uppercase">Invoify Suite</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
            className="md:hidden p-1.5 text-muted-foreground hover:text-foreground rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Action */}
        <div className="px-4 py-4">
          <Button asChild className="w-full justify-center gap-2 shadow-xs font-semibold text-xs h-10">
            <Link
              href="/invoices/new"
              onClick={() => setSidebarOpen(false)}
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Invoice</span>
            </Link>
          </Button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors min-h-[44px]",
                  isActive
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className={cn("w-4 h-4 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Session Footer */}
        <div className="p-3 border-t border-border bg-muted/40">
          {session?.user ? (
            <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-card border border-border shadow-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                {session.user.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name ?? "User"}
                    className="w-8 h-8 rounded-full border border-border shrink-0 object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                    {(session.user.name ?? session.user.email ?? "U")[0]?.toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">
                    {session.user.name || "Billing Admin"}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {session.user.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                className="p-1.5 text-muted-foreground hover:text-destructive rounded-md hover:bg-muted transition-colors cursor-pointer shrink-0"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href="/auth/signin">
                Sign In
              </Link>
            </Button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-auto bg-background">
        <div className="p-4 sm:p-6 lg:p-8 w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
