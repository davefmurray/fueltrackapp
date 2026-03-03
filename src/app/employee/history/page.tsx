"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { MileageLog } from "@/types";

export default function HistoryPage() {
  const [logs, setLogs] = useState<MileageLog[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/mileage/history?page=${page}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setLogs(data.logs);
        setTotalPages(data.totalPages);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [page]);

  if (loading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60dvh]">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <h1 className="text-xl font-bold">Mileage History</h1>

      {logs.length === 0 ? (
        <p className="text-sm text-muted-foreground">No logs yet.</p>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => {
            const total =
              log.start_miles != null && log.end_miles != null
                ? Number(log.end_miles) - Number(log.start_miles)
                : null;
            return (
              <Card key={log.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">
                      {new Date(log.log_date + "T12:00:00").toLocaleDateString(
                        "en-US",
                        { weekday: "short", month: "short", day: "numeric" }
                      )}
                    </span>
                    {log.flagged ? (
                      <Badge variant="destructive">Flagged</Badge>
                    ) : total != null ? (
                      <Badge variant="secondary">
                        {total.toFixed(1)} mi
                      </Badge>
                    ) : (
                      <Badge variant="outline">Incomplete</Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                    <div>
                      Start:{" "}
                      {log.start_miles != null
                        ? `${Number(log.start_miles).toLocaleString()} mi`
                        : "—"}
                    </div>
                    <div>
                      End:{" "}
                      {log.end_miles != null
                        ? `${Number(log.end_miles).toLocaleString()} mi`
                        : "—"}
                    </div>
                  </div>
                  {log.flag_reason && (
                    <p className="mt-2 text-xs text-destructive">
                      {log.flag_reason}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
