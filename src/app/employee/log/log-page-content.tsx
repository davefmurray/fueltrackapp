"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MileageForm } from "@/components/mileage-form";
import type { MileageLog } from "@/types";

export function LogPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const step = searchParams.get("step") as "start" | "end" | null;
  const [todayLog, setTodayLog] = useState<MileageLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/mileage/today");
        if (!res.ok) throw new Error();
        const data = await res.json();
        setTodayLog(data.todayLog);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const effectiveStep = step || (todayLog?.start_miles != null ? "end" : "start");
  const hasStart = todayLog?.start_miles != null;
  const hasEnd = todayLog?.end_miles != null;

  async function handleSubmit(data: {
    miles: number;
    photo: File;
    lat?: number;
    lng?: number;
  }) {
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("file", data.photo);
      formData.append("step", effectiveStep);

      const photoRes = await fetch("/api/photos/upload", {
        method: "POST",
        body: formData,
      });

      if (!photoRes.ok) throw new Error("Photo upload failed");
      const { url: photoUrl } = await photoRes.json();

      const endpoint =
        effectiveStep === "start"
          ? "/api/mileage/log-start"
          : "/api/mileage/log-end";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          miles: data.miles,
          photoUrl,
          lat: data.lat,
          lng: data.lng,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save");
      }

      router.push("/employee/dashboard");
      router.refresh();
    } catch (e) {
      setSubmitting(false);
      alert(e instanceof Error ? e.message : "Failed to save. Please try again.");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60dvh]">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (hasStart && hasEnd) {
    return (
      <div className="p-4 max-w-lg mx-auto text-center space-y-4 mt-12">
        <p className="text-lg font-medium">Already logged for today</p>
        <p className="text-sm text-muted-foreground">
          Both start and end readings have been recorded.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold">
          {effectiveStep === "start" ? "Start of Day" : "End of Day"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Take a photo of your odometer and enter the reading
        </p>
      </div>

      <MileageForm
        step={effectiveStep}
        onSubmit={handleSubmit}
        loading={submitting}
        previousMiles={hasStart ? Number(todayLog!.start_miles) : null}
      />
    </div>
  );
}
