import { Request, Response } from 'express';
import { prisma } from '../services/prisma.service';
import { LeaveStatus, LeaveType } from '../../../generated/prisma/enums';
import { LeaveBusinessRulesService } from '../services/leave-business-rules.service';

export class LeaveBalanceController {
  static async getEmployeeBalance(req: Request, res: Response) {
    try {
      const { employeeId } = req.params;

      const year = parseInt(req.query['year'] as string) || new Date().getFullYear();

      let balance = await prisma.leaveBalance.findUnique({
        where: { employeeId_year: { employeeId, year } },
      });

      if (!balance) {
        const employee = await prisma.employee.findUnique({
          where: { employeeId },
          select: { contractHours: true },
        });

        if (!employee) {
          return res.status(404).json({ error: 'Employee not found' });
        }

        const proRataLeave = LeaveBusinessRulesService.calculateProRataLeave(
          employee.contractHours
        );

        balance = await prisma.leaveBalance.create({
          data: {
            employeeId,
            year,
            totalDays: proRataLeave.days,
            totalHours: proRataLeave.hours,
          },
        });
      }

      // Calculate used hours from approved regular leaves only
      const approvedLeaves = await prisma.leave.findMany({
        where: {
          employeeId,
          status: LeaveStatus.APPROVED,
          leaveType: LeaveType.REGULAR, // Only count regular leaves against regular balance
          startOfLeave: {
            gte: new Date(year, 0, 1), //* e.g., Jan 1st this year
            lte: new Date(year + 1, 0, 1), //* e.g., Jan 1st next year
          },
        },
      });

      let usedHours = 0;
      approvedLeaves.forEach((leave: any) => {
        // Use the stored totalHours if available, otherwise calculate
        if (leave.totalHours && leave.totalHours > 0) {
          usedHours += leave.totalHours;
        } else {
          // Fallback to legacy calculation for existing data
          const start = new Date(leave.startOfLeave);
          const end = new Date(leave.endOfLeave);
          const diffTime = Math.abs(end.getTime() - start.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          usedHours += diffDays * 8; //* Assuming 8 hours per day
        }
      });
      const usedDays = Math.round(usedHours / 8);

      await prisma.leaveBalance.update({
        where: { id: balance.id },
        data: {
          usedDays,
          usedHours,
        },
      });

      const updatedBalance = {
        ...balance,
        usedDays,
        usedHours,
        remainingDays: balance.totalDays - usedDays,
        remainingHours: balance.totalHours - usedHours,
      };
      return res.json(updatedBalance);
    } catch (err) {
      console.error('Error fetching leave balance:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}
