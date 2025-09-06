export interface ILeaveBalance {
  id: number;
  employeeId: string;
  year: number;
  totalDays: number;
  totalHours: number;
  usedDays: number;
  usedHours: number;
  remainingDays: number;
  remainingHours: number;
}
