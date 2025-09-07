import { Request, Response } from 'express';
import { prisma } from '../services/prisma.service';
import { LeaveStatus, LeaveType, SpecialLeaveType } from '../../../generated/prisma/enums';
import { LeaveBusinessRulesService } from '../services/leave-business-rules.service';

export class LeaveController {
  static async getEmployeeLeaves(req: Request, res: Response) {
    try {
      const { employeeId } = req.params;

      const leaves = await prisma.leave.findMany({
        where: { employeeId },
        include: {
          approver: {
            select: {
              employeeId: true,
              name: true,
            },
          },
        },
        orderBy: { startOfLeave: 'desc' },
      });
      res.json(leaves);
    } catch (err) {
      console.error('Error fetching leaves:', err);
      res.status(500).json({ error: 'Failed to fetch leaves' });
    }
  }

  static async getManagerLeaves(req: Request, res: Response) {
    try {
      const { managerId } = req.params;

      const subordinates = await prisma.employee.findMany({
        where: { managerId },
        select: { employeeId: true },
      });
      const subordinateIds = subordinates.map((sub: any) => sub.employeeId);

      const leaves = await prisma.leave.findMany({
        where: { employeeId: { in: subordinateIds } },
        include: {
          employee: {
            select: {
              employeeId: true,
              name: true,
            },
          },
          approver: {
            select: {
              employeeId: true,
              name: true,
            },
          },
        },
        orderBy: { startOfLeave: 'desc' },
      });
      res.json(leaves);
    } catch (err) {
      console.error('Error fetching manager leaves:', err);
      res.status(500).json({ error: 'Failed to fetch manager leaves' });
    }
  }

  static async createLeave(req: Request, res: Response): Promise<void> {
    try {
      const {
        leaveLabel,
        employeeId,
        startOfLeave,
        endOfLeave,
        leaveType = LeaveType.REGULAR,
        specialLeaveType,
      } = req.body;

      if (!leaveLabel || !employeeId || !startOfLeave || !endOfLeave) {
        res.status(400).json({ error: 'All required fields must be provided' });
        return;
      }

      const startDate = new Date(startOfLeave);
      const endDate = new Date(endOfLeave);

      // Get employee information
      const employee = await prisma.employee.findUnique({
        where: { employeeId },
        select: { managerId: true, contractHours: true },
      });

      if (!employee) {
        res.status(404).json({ error: 'Employee not found' });
        return;
      }

      // Validate business rules
      const validation = LeaveBusinessRulesService.validateLeaveRequest({
        startOfLeave: startDate,
        endOfLeave: endDate,
        leaveType,
        specialLeaveType,
        employeeId,
        contractHours: employee.contractHours,
      });

      if (!validation.isValid) {
        res.status(400).json({
          error: 'Leave request violates business rules',
          details: validation.errors,
        });
        return;
      }

      // Check for overlapping leaves
      const overlappingLeaves = await prisma.leave.findMany({
        where: {
          employeeId,
          OR: [
            {
              AND: [{ startOfLeave: { lte: startDate } }, { endOfLeave: { gte: startDate } }],
            },
            {
              AND: [{ startOfLeave: { lte: endDate } }, { endOfLeave: { gte: endDate } }],
            },
            {
              AND: [{ startOfLeave: { gte: startDate } }, { endOfLeave: { lte: endDate } }],
            },
          ],
          status: { notIn: [LeaveStatus.REJECTED, LeaveStatus.CANCELLED, LeaveStatus.CLOSED] },
        },
      });

      if (overlappingLeaves.length > 0) {
        res.status(409).json({ error: 'Overlapping leave exists' });
        return;
      }

      // Calculate total hours for the leave
      const totalHours = LeaveBusinessRulesService.calculateWorkingHours(startDate, endDate);

      // For special leaves, check against usage limits
      if (leaveType === LeaveType.SPECIAL && specialLeaveType) {
        const currentYear = startDate.getFullYear();
        const limits = LeaveBusinessRulesService.getSpecialLeaveLimit(
          specialLeaveType,
          employee.contractHours
        );

        // Get current usage
        const currentUsage = await prisma.specialLeaveUsage.findUnique({
          where: {
            employeeId_year_specialLeaveType: {
              employeeId,
              year: currentYear,
              specialLeaveType,
            },
          },
        });

        const currentUsedHours = currentUsage?.usedHours || 0;
        if (currentUsedHours + totalHours > limits.maxHours) {
          res.status(400).json({
            error: `Special leave limit exceeded. Maximum ${limits.maxHours} hours allowed for ${specialLeaveType}`,
          });
          return;
        }
      }

      // Check regular leave balance
      if (leaveType === LeaveType.REGULAR) {
        const currentYear = startDate.getFullYear();
        const leaveBalance = await prisma.leaveBalance.findUnique({
          where: { employeeId_year: { employeeId, year: currentYear } },
        });

        if (!leaveBalance) {
          res.status(400).json({ error: 'Leave balance not found for current year' });
          return;
        }

        // Calculate current used hours from approved leaves
        const approvedLeaves = await prisma.leave.findMany({
          where: {
            employeeId,
            status: LeaveStatus.APPROVED,
            leaveType: LeaveType.REGULAR,
            startOfLeave: {
              gte: new Date(currentYear, 0, 1),
              lt: new Date(currentYear + 1, 0, 1),
            },
          },
        });

        const currentUsedHours = approvedLeaves.reduce(
          (total: number, leave: any) => total + leave.totalHours,
          0
        );

        if (currentUsedHours + totalHours > leaveBalance.totalHours) {
          res.status(400).json({
            error: 'Insufficient leave balance',
            details: {
              requested: totalHours,
              available: leaveBalance.totalHours - currentUsedHours,
              total: leaveBalance.totalHours,
            },
          });
          return;
        }
      }

      // Create the leave
      const leave = await prisma.leave.create({
        data: {
          leaveLabel,
          employeeId,
          startOfLeave: startDate,
          endOfLeave: endDate,
          approverId: employee.managerId || null,
          leaveType,
          specialLeaveType,
          totalHours,
        },
        include: {
          employee: {
            select: { employeeId: true, name: true },
          },
          approver: {
            select: { employeeId: true, name: true },
          },
        },
      });

      // Return warnings if any
      const response: any = { leave };
      if (validation.warnings.length > 0) {
        response.warnings = validation.warnings;
      }

      res.status(201).json(response);
    } catch (err) {
      console.error('Error creating leave:', err);
      res.status(500).json({ error: 'Failed to create leave' });
    }
  }

  static async updateLeaveStatus(req: Request, res: Response): Promise<void> {
    try {
      const { leaveId } = req.params;
      const { status, approverId } = req.body;

      if (!Object.values(LeaveStatus).includes(status)) {
        res.status(400).json({ error: 'Invalid status value' });
        return;
      }

      //* Verify approver has permission -----------------
      const leave = await prisma.leave.findUnique({
        where: { leaveId },
        include: {
          employee: {
            select: { managerId: true },
          },
        },
      });

      if (!leave) {
        res.status(404).json({ error: 'Leave not found' });
        return;
      }

      if (leave.employee.managerId !== approverId) {
        res.status(403).json({ error: 'Approver not authorized for this leave' });
        return;
      }

      // Update the leave status
      const updatedLeave = await prisma.leave.update({
        where: { leaveId },
        data: {
          status,
          approverId: status === LeaveStatus.APPROVED ? approverId : leave.approverId,
        },
        include: {
          employee: {
            select: { employeeId: true, name: true },
          },
          approver: {
            select: { employeeId: true, name: true },
          },
        },
      });

      // If approved, update special leave usage tracking
      if (
        status === LeaveStatus.APPROVED &&
        leave.leaveType === LeaveType.SPECIAL &&
        leave.specialLeaveType
      ) {
        const currentYear = leave.startOfLeave.getFullYear();
        const employee = await prisma.employee.findUnique({
          where: { employeeId: leave.employeeId },
          select: { contractHours: true },
        });

        if (employee) {
          const limits = LeaveBusinessRulesService.getSpecialLeaveLimit(
            leave.specialLeaveType,
            employee.contractHours
          );

          // Update or create special leave usage record
          await prisma.specialLeaveUsage.upsert({
            where: {
              employeeId_year_specialLeaveType: {
                employeeId: leave.employeeId,
                year: currentYear,
                specialLeaveType: leave.specialLeaveType,
              },
            },
            update: {
              usedHours: {
                increment: leave.totalHours,
              },
              usedDays: {
                increment: Math.ceil(leave.totalHours / 8),
              },
            },
            create: {
              employeeId: leave.employeeId,
              year: currentYear,
              specialLeaveType: leave.specialLeaveType,
              usedHours: leave.totalHours,
              usedDays: Math.ceil(leave.totalHours / 8),
              maxHours: limits.maxHours,
              maxDays: limits.maxDays,
            },
          });
        }
      }

      res.json(updatedLeave);
    } catch (err) {
      console.error('Error updating leave status:', err);
      res.status(500).json({ error: 'Failed to update leave status' });
    }
  }

  static async deleteLeave(req: Request, res: Response): Promise<void> {
    try {
      const { leaveId } = req.params;
      const { employeeId } = req.body;

      const leave = await prisma.leave.findUnique({
        where: { leaveId },
      });

      if (!leave) {
        res.status(404).json({ error: 'Leave not found' });
        return;
      }

      if (leave.employeeId !== employeeId) {
        res.status(403).json({ error: 'Not authorized to delete this leave' });
        return;
      }

      if (leave.startOfLeave <= new Date()) {
        res.status(404).json({ error: 'Cannot delete leave that has started or passed' });
        return;
      }

      if (leave.status === LeaveStatus.APPROVED) {
        res.status(400).json({
          error: 'Cannot delete an approved leave. Please contact your manager to cancel it.',
        });
        return;
      }

      await prisma.leave.delete({
        where: { leaveId },
      });
      res.status(204).send();
    } catch (err) {
      console.error('Error deleting leave:', err);
      res.status(500).json({ error: 'Failed to delete leave' });
    }
  }

  static async getSpecialLeaveUsage(req: Request, res: Response): Promise<void> {
    try {
      const { employeeId } = req.params;
      const year = parseInt(req.query['year'] as string) || new Date().getFullYear();

      const usage = await prisma.specialLeaveUsage.findMany({
        where: {
          employeeId,
          year,
        },
      });

      // Get employee contract hours for calculating limits
      const employee = await prisma.employee.findUnique({
        where: { employeeId },
        select: { contractHours: true },
      });

      if (!employee) {
        res.status(404).json({ error: 'Employee not found' });
        return;
      }

      // Build complete usage information including unused types
      const allSpecialLeaveTypes = Object.values(SpecialLeaveType);
      const completeUsage = allSpecialLeaveTypes.map((type) => {
        const existing = usage.find((u: any) => u.specialLeaveType === type);
        const limits = LeaveBusinessRulesService.getSpecialLeaveLimit(type, employee.contractHours);

        return {
          specialLeaveType: type,
          usedDays: existing?.usedDays || 0,
          usedHours: existing?.usedHours || 0,
          maxDays: limits.maxDays,
          maxHours: limits.maxHours,
          remainingDays: limits.maxDays - (existing?.usedDays || 0),
          remainingHours: limits.maxHours - (existing?.usedHours || 0),
        };
      });

      res.json(completeUsage);
    } catch (err) {
      console.error('Error fetching special leave usage:', err);
      res.status(500).json({ error: 'Failed to fetch special leave usage' });
    }
  }
}
