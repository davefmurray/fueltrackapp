"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { MileageLog, LogStatus } from "@/types";

interface Submission extends MileageLog {
  employee_name: string;
  start_photo_signed_url: string | null;
  end_photo_signed_url: string | null;
}

const statusBadge: Record<LogStatus, { label: string; variant: "secondary" | "default" | "destructive" }> = {
  pending: { label: "Pending", variant: "secondary" },
  approved: { label: "Approved", variant: "default" },
  rejected: { label: "Rejected", variant: "destructive" },
};

export function SubmissionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [photoModal, setPhotoModal] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "pending");
  const [dateFrom, setDateFrom] = useState(searchParams.get("date_from") || "");
  const [dateTo, setDateTo] = useState(searchParams.get("date_to") || "");

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("status", statusFilter);
      if (dateFrom) params.set("date_from", dateFrom);
      if (dateTo) params.set("date_to", dateTo);

      const res = await fetch(`/api/admin/submissions?${params}`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      setSubmissions(json.submissions);
    } catch {
      toast.error("Failed to load submissions");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  async function handleReview(id: string, status: "approved" | "rejected") {
    try {
      const res = await fetch(`/api/admin/submissions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, review_note: reviewNote }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Submission ${status}`);
      setReviewingId(null);
      setReviewNote("");
      fetchSubmissions();
    } catch {
      toast.error("Failed to update submission");
    }
  }

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams();
    if (key === "status") {
      params.set("status", value);
      setStatusFilter(value);
    } else {
      params.set("status", statusFilter);
    }
    if (key === "date_from") {
      if (value) params.set("date_from", value);
      setDateFrom(value);
    } else if (dateFrom) {
      params.set("date_from", dateFrom);
    }
    if (key === "date_to") {
      if (value) params.set("date_to", value);
      setDateTo(value);
    } else if (dateTo) {
      params.set("date_to", dateTo);
    }
    router.replace(`/admin/submissions?${params}`);
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <h1 className="text-2xl font-bold">Submissions</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <Label className="text-xs mb-1 block">Status</Label>
          <select
            className="border rounded-md px-3 py-2 text-sm bg-background"
            value={statusFilter}
            onChange={(e) => updateFilter("status", e.target.value)}
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="all">All</option>
          </select>
        </div>
        <div>
          <Label className="text-xs mb-1 block">From</Label>
          <Input
            type="date"
            className="w-40"
            value={dateFrom}
            onChange={(e) => updateFilter("date_from", e.target.value)}
          />
        </div>
        <div>
          <Label className="text-xs mb-1 block">To</Label>
          <Input
            type="date"
            className="w-40"
            value={dateTo}
            onChange={(e) => updateFilter("date_to", e.target.value)}
          />
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : submissions.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center">
          No {statusFilter !== "all" ? statusFilter : ""} submissions found.
        </p>
      ) : (
        <div className="space-y-4">
          {submissions.map((sub) => {
            const totalMiles =
              sub.start_miles != null && sub.end_miles != null
                ? Number(sub.end_miles) - Number(sub.start_miles)
                : 0;
            const badge = statusBadge[sub.status];

            return (
              <Card key={sub.id}>
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    {/* Info */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold">{sub.employee_name}</span>
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(sub.log_date + "T12:00:00").toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Start</p>
                          <p className="font-medium">
                            {sub.start_miles != null
                              ? `${Number(sub.start_miles).toLocaleString()} mi`
                              : "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">End</p>
                          <p className="font-medium">
                            {sub.end_miles != null
                              ? `${Number(sub.end_miles).toLocaleString()} mi`
                              : "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Total</p>
                          <p className="font-medium">{totalMiles.toFixed(1)} mi</p>
                        </div>
                      </div>
                      {sub.review_note && (
                        <p className="text-xs text-muted-foreground italic">
                          Note: {sub.review_note}
                        </p>
                      )}
                      {sub.reviewed_at && (
                        <p className="text-xs text-muted-foreground">
                          Reviewed:{" "}
                          {new Date(sub.reviewed_at).toLocaleString("en-US", {
                            timeZone: "America/New_York",
                          })}
                        </p>
                      )}
                    </div>

                    {/* Photos */}
                    <div className="flex gap-2">
                      {sub.start_photo_signed_url && (
                        <button
                          onClick={() => setPhotoModal(sub.start_photo_signed_url)}
                          className="block"
                        >
                          <img
                            src={sub.start_photo_signed_url}
                            alt="Start odometer"
                            className="w-24 h-24 object-cover rounded border cursor-pointer hover:opacity-80"
                          />
                          <span className="text-xs text-muted-foreground">Start</span>
                        </button>
                      )}
                      {sub.end_photo_signed_url && (
                        <button
                          onClick={() => setPhotoModal(sub.end_photo_signed_url)}
                          className="block"
                        >
                          <img
                            src={sub.end_photo_signed_url}
                            alt="End odometer"
                            className="w-24 h-24 object-cover rounded border cursor-pointer hover:opacity-80"
                          />
                          <span className="text-xs text-muted-foreground">End</span>
                        </button>
                      )}
                    </div>

                    {/* Actions */}
                    {sub.status === "pending" && (
                      <div className="flex flex-col gap-2 min-w-[140px]">
                        {reviewingId === sub.id ? (
                          <>
                            <Input
                              placeholder="Note (optional)"
                              value={reviewNote}
                              onChange={(e) => setReviewNote(e.target.value)}
                              className="text-sm"
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="flex-1"
                                onClick={() => handleReview(sub.id, "approved")}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="flex-1"
                                onClick={() => handleReview(sub.id, "rejected")}
                              >
                                Reject
                              </Button>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setReviewingId(null);
                                setReviewNote("");
                              }}
                            >
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="flex-1"
                              onClick={() => setReviewingId(sub.id)}
                            >
                              Review
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Photo modal */}
      {photoModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() => setPhotoModal(null)}
        >
          <div className="max-w-3xl max-h-[90vh] p-2">
            <img
              src={photoModal}
              alt="Odometer photo"
              className="max-w-full max-h-[85vh] object-contain rounded"
            />
          </div>
        </div>
      )}
    </div>
  );
}
