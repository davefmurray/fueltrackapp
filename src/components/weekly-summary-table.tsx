"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { WeeklyReport } from "@/types";

interface WeeklySummaryTableProps {
  report: WeeklyReport;
}

export function WeeklySummaryTable({ report }: WeeklySummaryTableProps) {
  return (
    <div className="rounded-md border overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Day</TableHead>
            <TableHead className="text-right">Start</TableHead>
            <TableHead className="text-right">End</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="text-right">Excess</TableHead>
            <TableHead className="text-right">Reimb.</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {report.days.map((day) => (
            <TableRow key={day.date}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{day.dayOfWeek.slice(0, 3)}</span>
                  <span className="text-xs text-muted-foreground">
                    {day.date.slice(5)}
                  </span>
                  {day.flagged && (
                    <Badge variant="destructive" className="text-[10px] px-1 py-0">
                      Flagged
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right font-mono text-sm">
                {day.startMiles != null ? day.startMiles.toLocaleString() : "—"}
              </TableCell>
              <TableCell className="text-right font-mono text-sm">
                {day.endMiles != null ? day.endMiles.toLocaleString() : "—"}
              </TableCell>
              <TableCell className="text-right font-mono text-sm">
                {day.totalMiles > 0 ? day.totalMiles.toFixed(1) : "—"}
              </TableCell>
              <TableCell className="text-right font-mono text-sm">
                {day.excessMiles > 0 ? day.excessMiles.toFixed(1) : "—"}
              </TableCell>
              <TableCell className="text-right font-mono text-sm">
                {day.reimbursement > 0
                  ? `$${day.reimbursement.toFixed(2)}`
                  : "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={3} className="font-bold">
              Weekly Total
            </TableCell>
            <TableCell className="text-right font-mono font-bold">
              {report.totalMiles.toFixed(1)}
            </TableCell>
            <TableCell className="text-right font-mono font-bold">
              {report.totalExcessMiles.toFixed(1)}
            </TableCell>
            <TableCell className="text-right font-mono font-bold">
              ${report.totalReimbursement.toFixed(2)}
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
