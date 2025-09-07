import { LeaveStatus, LeaveType, SpecialLeaveType } from '../../generated/prisma/enums';

export interface ILeave {
  leaveId: string;
  leaveLabel: string;
  employeeId: string;
  startOfLeave: string;
  endOfLeave: string;
  approverId?: string;
  status: LeaveStatus;
  leaveType: LeaveType;
  specialLeaveType?: SpecialLeaveType;
  totalHours: number;
  createdAt: string;
  updatedAt: string;
  employee?: { employeeId: string; name: string };
  approver?: { employeeId: string; name: string };
}

export interface ICreateLeaveRequest {
  leaveLabel: string;
  employeeId: string;
  startOfLeave: string;
  endOfLeave: string;
  leaveType?: LeaveType;
  specialLeaveType?: SpecialLeaveType;
}

export interface ISpecialLeaveUsage {
  id: number;
  employeeId: string;
  year: number;
  specialLeaveType: SpecialLeaveType;
  usedDays: number;
  usedHours: number;
  maxDays: number;
  maxHours: number;
}
