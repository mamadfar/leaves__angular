import { LeaveStatus } from '../../generated/prisma';

export interface ILeave {
  leaveId: string;
  leaveLabel: string;
  employeeId: string;
  startOfLeave: string;
  endOfLeave: string;
  approverId?: string;
  status: LeaveStatus;
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
}
