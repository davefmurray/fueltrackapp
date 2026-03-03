import { EmployeeNav } from "@/components/employee-nav";

export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh pb-20">
      {children}
      <EmployeeNav />
    </div>
  );
}
