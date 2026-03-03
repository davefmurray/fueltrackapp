"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { MileageLog } from "@/types";

interface DailyStatusCardProps {
  log: MileageLog | null;
  dateLabel: string;
}

export function DailyStatusCard({ log, dateLabel }: DailyStatusCardProps) {
  const hasStart = log?.start_miles != null;
  const hasEnd = log?.end_miles != null;
  const isFlagged = log?.flagged;
  const isComplete = hasStart && hasEnd;

  let status: "not-started" | "in-progress" | "complete" | "flagged";
  if (isFlagged) status = "flagged";
  else if (isComplete) status = "complete";
  else if (hasStart) status = "in-progress";
  else status = "not-started";

  const statusConfig = {
    "not-started": {
      label: "Not Started",
      variant: "secondary" as const,
      bg: "bg-muted",
    },
    "in-progress": {
      label: "Start Logged",
      variant: "default" as const,
      bg: "bg-yellow-50 dark:bg-yellow-950/20",
    },
    complete: {
      label: "Complete",
      variant: "default" as const,
      bg: "bg-green-50 dark:bg-green-950/20",
    },
    flagged: {
      label: "Flagged",
      variant: "destructive" as const,
      bg: "bg-red-50 dark:bg-red-950/20",
    },
  };

  const approvalBadge = {
    pending: { label: "Pending Review", variant: "secondary" as const },
    approved: { label: "Approved", variant: "default" as const },
    rejected: { label: "Rejected", variant: "destructive" as const },
  };

  const config = statusConfig[status];

  return (
    <Card className={config.bg}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-muted-foreground">
            {dateLabel}
          </span>
          <div className="flex gap-2">
            <Badge variant={config.variant}>{config.label}</Badge>
            {isComplete && log?.status && (
              <Badge variant={approvalBadge[log.status].variant}>
                {approvalBadge[log.status].label}
              </Badge>
            )}
          </div>
        </div>

        {log && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Start</p>
              <p className="font-semibold">
                {hasStart ? `${Number(log.start_miles).toLocaleString()} mi` : "—"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">End</p>
              <p className="font-semibold">
                {hasEnd ? `${Number(log.end_miles).toLocaleString()} mi` : "—"}
              </p>
            </div>
          </div>
        )}

        {isFlagged && log?.flag_reason && (
          <p className="mt-2 text-xs text-destructive">{log.flag_reason}</p>
        )}

        {isComplete && log?.status === "rejected" && log?.review_note && (
          <p className="mt-2 text-xs text-destructive">
            Reason: {log.review_note}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
