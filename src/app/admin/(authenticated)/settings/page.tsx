"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { GasPrice } from "@/types";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_OPTIONS = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

export default function SettingsPage() {
  const [prices, setPrices] = useState<GasPrice[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // Gas price form
  const now = new Date();
  const [gasMonth, setGasMonth] = useState(now.getMonth() + 1);
  const [gasYear, setGasYear] = useState(now.getFullYear());
  const [gasPrice, setGasPrice] = useState("");
  const [gasSaving, setGasSaving] = useState(false);

  // Settings
  const [companyName, setCompanyName] = useState("");
  const [workDays, setWorkDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [settingsSaving, setSettingsSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [pricesRes, settingsRes] = await Promise.all([
          fetch("/api/admin/gas-prices"),
          fetch("/api/admin/settings"),
        ]);
        const pricesData = await pricesRes.json();
        const settingsData = await settingsRes.json();
        setPrices(pricesData.prices || []);
        setSettings(settingsData.settings || {});
        setCompanyName(settingsData.settings?.company_name || "");
        setWorkDays(
          JSON.parse(settingsData.settings?.work_days || "[1,2,3,4,5]")
        );
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleGasPriceSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGasSaving(true);
    try {
      await fetch("/api/admin/gas-prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month: gasMonth,
          year: gasYear,
          price_per_gallon: parseFloat(gasPrice),
        }),
      });
      // Reload prices
      const res = await fetch("/api/admin/gas-prices");
      const data = await res.json();
      setPrices(data.prices || []);
      setGasPrice("");
    } catch {
      // ignore
    } finally {
      setGasSaving(false);
    }
  }

  async function handleSettingsSave() {
    setSettingsSaving(true);
    try {
      await Promise.all([
        fetch("/api/admin/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: "company_name", value: companyName }),
        }),
        fetch("/api/admin/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            key: "work_days",
            value: JSON.stringify(workDays),
          }),
        }),
      ]);
    } catch {
      // ignore
    } finally {
      setSettingsSaving(false);
    }
  }

  function toggleWorkDay(day: number) {
    setWorkDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Gas Price */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Gas Price (AAA Florida)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleGasPriceSubmit} className="flex gap-3 items-end">
            <div className="space-y-2">
              <Label>Month</Label>
              <select
                className="h-9 rounded-md border px-3 text-sm bg-background"
                value={gasMonth}
                onChange={(e) => setGasMonth(parseInt(e.target.value))}
              >
                {MONTH_NAMES.map((name, i) => (
                  <option key={i} value={i + 1}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Year</Label>
              <Input
                type="number"
                value={gasYear}
                onChange={(e) => setGasYear(parseInt(e.target.value))}
                className="w-24"
              />
            </div>
            <div className="space-y-2">
              <Label>Price/Gallon ($)</Label>
              <Input
                type="number"
                step="0.001"
                placeholder="3.459"
                value={gasPrice}
                onChange={(e) => setGasPrice(e.target.value)}
                className="w-32"
                required
              />
            </div>
            <Button type="submit" disabled={gasSaving}>
              {gasSaving ? "Saving..." : "Set Price"}
            </Button>
          </form>

          {prices.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">Recent Prices</p>
              <div className="space-y-1">
                {prices.map((p) => (
                  <div
                    key={p.id}
                    className="flex justify-between text-sm py-1 border-b last:border-0"
                  >
                    <span>
                      {MONTH_NAMES[p.month - 1]} {p.year}
                    </span>
                    <span className="font-mono">
                      ${Number(p.price_per_gallon).toFixed(3)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Company Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Company Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Company Name</Label>
            <Input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Work Days</Label>
            <div className="flex gap-2">
              {DAY_OPTIONS.map((day) => (
                <Button
                  key={day.value}
                  type="button"
                  variant={workDays.includes(day.value) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleWorkDay(day.value)}
                >
                  {day.label}
                </Button>
              ))}
            </div>
          </div>

          <Button onClick={handleSettingsSave} disabled={settingsSaving}>
            {settingsSaving ? "Saving..." : "Save Settings"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
