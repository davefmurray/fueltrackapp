"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PinPad } from "@/components/pin-pad";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handlePinSubmit(pin: string) {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/pin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Invalid PIN");
        setLoading(false);
        throw new Error("Invalid PIN");
      }

      router.push("/employee/dashboard");
    } catch (e) {
      setLoading(false);
      throw e;
    }
  }

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">FuelTrack</h1>
          <p className="text-sm text-muted-foreground">
            Enter your 4-digit PIN to clock in
          </p>
        </div>

        <PinPad onSubmit={handlePinSubmit} loading={loading} error={error} />

        <Link
          href="/admin/login"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Admin Login
        </Link>
      </div>
    </main>
  );
}
