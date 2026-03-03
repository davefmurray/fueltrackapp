"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/submissions", label: "Submissions", pendingBadge: true },
  { href: "/admin/employees", label: "Employees" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/reports", label: "Reports" },
];

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    async function loadPending() {
      try {
        const res = await fetch("/api/admin/dashboard");
        if (!res.ok) return;
        const data = await res.json();
        setPendingCount(data.pendingSubmissions || 0);
      } catch {
        // ignore
      }
    }
    loadPending();
  }, [pathname]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
  }

  return (
    <aside className="w-56 border-r bg-muted/30 min-h-dvh p-4 flex flex-col">
      <div className="mb-8">
        <h2 className="font-bold text-lg">FuelTrack</h2>
        <p className="text-xs text-muted-foreground">Admin Panel</p>
      </div>

      <nav className="space-y-1 flex-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors",
              pathname === item.href
                ? "bg-primary text-primary-foreground font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            {item.label}
            {item.pendingBadge && pendingCount > 0 && (
              <Badge
                variant="destructive"
                className="ml-auto text-xs h-5 min-w-5 flex items-center justify-center"
              >
                {pendingCount}
              </Badge>
            )}
          </Link>
        ))}
      </nav>

      <Button variant="ghost" size="sm" onClick={handleLogout}>
        Sign Out
      </Button>
    </aside>
  );
}
