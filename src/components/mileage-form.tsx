"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PhotoCapture } from "@/components/photo-capture";

interface MileageFormProps {
  step: "start" | "end";
  onSubmit: (data: { miles: number; photo: File; lat?: number; lng?: number }) => Promise<void>;
  loading?: boolean;
  previousMiles?: number | null;
}

export function MileageForm({ step, onSubmit, loading, previousMiles }: MileageFormProps) {
  const [miles, setMiles] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const milesNum = parseFloat(miles);
    if (isNaN(milesNum) || milesNum < 0) {
      setError("Please enter a valid mileage reading");
      return;
    }

    if (step === "end" && previousMiles != null && milesNum < previousMiles) {
      setError(`End mileage must be at least ${previousMiles} (your start reading)`);
      return;
    }

    if (!photo) {
      setError("Please take a photo of your odometer");
      return;
    }

    // Try to get GPS coordinates
    let lat: number | undefined;
    let lng: number | undefined;
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 5000,
        });
      });
      lat = pos.coords.latitude;
      lng = pos.coords.longitude;
    } catch {
      // GPS is optional
    }

    await onSubmit({ miles: milesNum, photo, lat, lng });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PhotoCapture
        label={`${step === "start" ? "Start" : "End"} of Day — Odometer Photo`}
        onCapture={setPhoto}
      />

      <div className="space-y-2">
        <Label htmlFor="miles">
          Odometer Reading ({step === "start" ? "Start" : "End"} of Day)
        </Label>
        <Input
          id="miles"
          type="number"
          inputMode="decimal"
          step="0.1"
          min="0"
          placeholder="e.g. 45231.5"
          value={miles}
          onChange={(e) => setMiles(e.target.value)}
          className="h-14 text-lg"
          required
        />
        {previousMiles != null && (
          <p className="text-xs text-muted-foreground">
            Start reading: {previousMiles.toLocaleString()} mi
          </p>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" className="w-full h-14 text-lg" disabled={loading}>
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            Saving...
          </span>
        ) : (
          `Submit ${step === "start" ? "Start" : "End"} Reading`
        )}
      </Button>
    </form>
  );
}
