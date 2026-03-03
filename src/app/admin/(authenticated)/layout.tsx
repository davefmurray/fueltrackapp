import { AdminNav } from "@/components/admin-nav";

export default function AdminAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh">
      <AdminNav />
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  );
}
