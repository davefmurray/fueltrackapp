"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DashboardStats {
  activeEmployees: number;
  loggedToday: number;
  notLoggedToday: number;
  flaggedDays: number;
  pendingSubmissions: number;
  currentGasPrice: number | null;
  currentMonth: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/dashboard");
        if (!res.ok) throw new Error();
        setStats(await res.json());
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!stats) return <p>Failed to load dashboard.</p>;

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Employees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.activeEmployees}</p>
          </CardContent>
        </Card>

        <Link href="/admin/submissions?status=pending">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Submissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-amber-600">
                {stats.pendingSubmissions}
              </p>
            </CardContent>
          </Card>
        </Link>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Logged Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              {stats.loggedToday}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Not Logged Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-500">
              {stats.notLoggedToday}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Flagged Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-500">
              {stats.flaggedDays}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Current Gas Price ({stats.currentMonth})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.currentGasPrice != null ? (
            <p className="text-3xl font-bold">
              ${stats.currentGasPrice.toFixed(3)}/gal
            </p>
          ) : (
            <p className="text-muted-foreground">
              No gas price set for this month. Go to Settings to add one.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
