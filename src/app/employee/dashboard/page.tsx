"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DailyStatusCard } from "@/components/daily-status-card";
import type { MileageLog } from "@/types";

interface DashboardData {
  employee: { id: string; name: string };
  todayLog: MileageLog | null;
  todayDate: string;
  flaggedCount: number;
}

export default function EmployeeDashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/mileage/today");
        if (!res.ok) throw new Error("Failed to load");
        const json = await res.json();
        setData(json);
      } catch {
        // Session might be expired
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60dvh]">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Failed to load dashboard data.
      </div>
    );
  }

  const hasStart = data.todayLog?.start_miles != null;
  const hasEnd = data.todayLog?.end_miles != null;

  return (
    <div className="p-4 max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold">
          Welcome, {data.employee.name}
        </h1>
        <p className="text-sm text-muted-foreground">
          {new Date(data.todayDate + "T12:00:00").toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </div>

      <DailyStatusCard log={data.todayLog} dateLabel="Today" />

      {!hasStart && (
        <Button
          className="w-full h-14 text-lg"
          onClick={() => router.push("/employee/log?step=start")}
        >
          Log Start of Day
        </Button>
      )}

      {hasStart && !hasEnd && (
        <Button
          className="w-full h-14 text-lg"
          onClick={() => router.push("/employee/log?step=end")}
        >
          Log End of Day
        </Button>
      )}

      {hasStart && hasEnd && (
        <p className="text-center text-sm text-muted-foreground">
          You&apos;re all set for today!
        </p>
      )}

      {data.flaggedCount > 0 && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
          <p className="text-sm font-medium text-destructive">
            {data.flaggedCount} missed day{data.flaggedCount !== 1 ? "s" : ""} flagged
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Contact your admin if this is incorrect.
          </p>
        </div>
      )}
    </div>
  );
}
