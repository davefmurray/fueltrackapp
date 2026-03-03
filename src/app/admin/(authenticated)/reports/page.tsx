"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { WeeklySummaryTable } from "@/components/weekly-summary-table";
import { formatDateLong } from "@/lib/date-utils";
import type { Employee, WeeklyReport } from "@/types";

export default function AdminReportsPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [currentDate, setCurrentDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadEmployees() {
      const res = await fetch("/api/admin/employees");
      if (res.ok) {
        const data = await res.json();
        setEmployees(data.employees);
        if (data.employees.length > 0) {
          setSelectedEmployee(data.employees[0].id);
        }
      }
    }
    loadEmployees();
  }, []);

  useEffect(() => {
    if (!selectedEmployee) return;
    async function loadReport() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/reports/weekly?employee_id=${selectedEmployee}&date=${currentDate}`
        );
        if (res.ok) {
          setReport(await res.json());
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    loadReport();
  }, [selectedEmployee, currentDate]);

  function shiftWeek(direction: -1 | 1) {
    const d = new Date(currentDate + "T12:00:00");
    d.setDate(d.getDate() + direction * 7);
    setCurrentDate(d.toISOString().slice(0, 10));
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-2xl font-bold">Reports</h1>

      <div className="flex gap-4 items-end flex-wrap">
        <div className="space-y-2">
          <Label>Employee</Label>
          <select
            className="h-9 rounded-md border px-3 text-sm bg-background min-w-[200px]"
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
          >
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name} {!emp.active ? "(Inactive)" : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => shiftWeek(-1)}>
            Previous Week
          </Button>
          <Button variant="outline" size="sm" onClick={() => shiftWeek(1)}>
            Next Week
          </Button>
        </div>
      </div>

      {report && (
        <p className="text-sm text-muted-foreground">
          {formatDateLong(report.weekStart)} — {formatDateLong(report.weekEnd)}
        </p>
      )}

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
            variant="outline"
            onClick={() => {
              window.open(
                `/api/reports/weekly/pdf?employee_id=${selectedEmployee}&date=${currentDate}`,
                "_blank"
              );
            }}
          >
            Download PDF
          </Button>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          Select an employee to view their report.
        </p>
      )}
    </div>
  );
}
