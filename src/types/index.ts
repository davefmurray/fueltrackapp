export interface Employee {
  id: string;
  name: string;
  commute_miles: number;
  vehicle_mpg: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MileageLog {
  id: string;
  employee_id: string;
  log_date: string;
  start_miles: number | null;
  end_miles: number | null;
  start_photo_url: string | null;
  end_photo_url: string | null;
  start_timestamp: string | null;
  end_timestamp: string | null;
  start_lat: number | null;
  start_lng: number | null;
  end_lat: number | null;
  end_lng: number | null;
  flagged: boolean;
  flag_reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface GasPrice {
  id: string;
  month: number;
  year: number;
  price_per_gallon: number;
  set_by: string | null;
  created_at: string;
}

export interface AppSetting {
  key: string;
  value: string;
  updated_at: string;
}

export interface EmployeeSession {
  employeeId: string;
  employeeName: string;
  exp: number;
}

export interface WeeklyReport {
  employee: Employee;
  weekStart: string;
  weekEnd: string;
  days: DailyReportEntry[];
  totalMiles: number;
  totalExcessMiles: number;
  totalReimbursement: number;
  gasPriceUsed: number;
}

export interface DailyReportEntry {
  date: string;
  dayOfWeek: string;
  startMiles: number | null;
  endMiles: number | null;
  totalMiles: number;
  excessMiles: number;
  reimbursement: number;
  flagged: boolean;
  flagReason: string | null;
}
