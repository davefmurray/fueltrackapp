"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { WeeklySummaryTable } from "@/components/weekly-summary-table";
import { formatDateLong } from "@/lib/date-utils";
import type { WeeklyReport } from "@/types";

export default function EmployeeReportsPage() {
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [currentDate, setCurrentDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/reports/weekly?date=${currentDate}`);
        if (!res.ok) throw new Error();
        setReport(await res.json());
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [currentDate]);

  function shiftWeek(direction: -1 | 1) {
    const d = new Date(currentDate + "T12:00:00");
    d.setDate(d.getDate() + direction * 7);
    setCurrentDate(d.toISOString().slice(0, 10));
  }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <h1 className="text-xl font-bold">Weekly Reports</h1>

      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => shiftWeek(-1)}>
          Previous
        </Button>
        {report && (
          <span className="text-sm text-muted-foreground">
            {formatDateLong(report.weekStart)} —{" "}
            {formatDateLong(report.weekEnd)}
          </span>
        )}
        <Button variant="outline" size="sm" onClick={() => shiftWeek(1)}>
          Next
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : report ? (
        <>
          <WeeklySummaryTable report={report} />

          {report.gasPriceUsed > 0 && (
            <p className="text-xs text-muted-foreground">
              Gas price: ${report.gasPriceUsed.toFixed(3)}/gal | MPG:{" "}
              {report.employee.vehicle_mpg} | Commute:{" "}
              {report.employee.commute_miles} mi
            </p>
          )}

          <Button
            className="w-full"
            variant="outline"
            onClick={() => {
              window.open(
                `/api/reports/weekly/pdf?date=${currentDate}`,
                "_blank"
              );
            }}
          >
            Download PDF
          </Button>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">No data available.</p>
      )}
    </div>
  );
}
