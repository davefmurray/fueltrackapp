"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PinPadProps {
  onSubmit: (pin: string) => Promise<void>;
  loading?: boolean;
  error?: string | null;
}

export function PinPad({ onSubmit, loading, error }: PinPadProps) {
  const [pin, setPin] = useState("");
  const [shake, setShake] = useState(false);

  const triggerShake = useCallback(() => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  }, []);

  const handleDigit = useCallback(
    async (digit: string) => {
      if (loading) return;
      const newPin = pin + digit;
      if (newPin.length <= 4) {
        setPin(newPin);
        if (newPin.length === 4) {
          try {
            await onSubmit(newPin);
          } catch {
            triggerShake();
            setPin("");
          }
        }
      }
    },
    [pin, loading, onSubmit, triggerShake]
  );

  const handleBackspace = useCallback(() => {
    if (loading) return;
    setPin((p) => p.slice(0, -1));
  }, [loading]);

  const handleClear = useCallback(() => {
    if (loading) return;
    setPin("");
  }, [loading]);

  return (
    <div className="flex flex-col items-center gap-8">
      {/* PIN dots */}
      <div
        className={cn(
          "flex gap-4 transition-transform",
          shake && "animate-shake"
        )}
      >
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              "w-4 h-4 rounded-full border-2 transition-colors",
              i < pin.length
                ? "bg-primary border-primary"
                : "border-muted-foreground/40"
            )}
          />
        ))}
      </div>

      {/* Error message */}
      {error && (
        <p className="text-sm text-destructive font-medium">{error}</p>
      )}

      {/* Numpad */}
      <div className="grid grid-cols-3 gap-3">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
          <Button
            key={digit}
            variant="outline"
            className="w-[72px] h-[72px] text-2xl font-semibold rounded-2xl"
            onClick={() => handleDigit(digit)}
            disabled={loading}
          >
            {digit}
          </Button>
        ))}
        <Button
          variant="ghost"
          className="w-[72px] h-[72px] text-sm font-medium rounded-2xl"
          onClick={handleClear}
          disabled={loading}
        >
          Clear
        </Button>
        <Button
          variant="outline"
          className="w-[72px] h-[72px] text-2xl font-semibold rounded-2xl"
          onClick={() => handleDigit("0")}
          disabled={loading}
        >
          0
        </Button>
        <Button
          variant="ghost"
          className="w-[72px] h-[72px] text-lg rounded-2xl"
          onClick={handleBackspace}
          disabled={loading}
        >
          ⌫
        </Button>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Verifying...</span>
        </div>
      )}
    </div>
  );
}
