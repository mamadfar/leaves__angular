import { Request, Response } from 'express';
import { prisma } from '../services/prisma.service';
import { LeaveStatus } from '../../../generated/prisma';

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
      const { leaveLabel, employeeId, startOfLeave, endOfLeave } = req.body;

      if (!leaveLabel || !employeeId || !startOfLeave || !endOfLeave) {
        res.status(400).json({ error: 'All fields are required' });
        return;
      }
      const startDate = new Date(startOfLeave);
      const endDate = new Date(endOfLeave);

      //* Validate dates -----------------
      if (startDate >= endDate) {
        res.status(400).json({ error: 'End date must be after start date' });
        return;
      }

      if (startDate < new Date()) {
        res.status(400).json({ error: 'Cannot create leave in the past' });
        return;
      }

      //* Check for overlapping leaves -----------------
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

      //* Get employee's manager for approval -----------------
      const employee = await prisma.employee.findUnique({
        where: { employeeId },
        select: { managerId: true },
      });

      const leave = await prisma.leave.create({
        data: {
          leaveLabel,
          employeeId,
          startOfLeave: startDate,
          endOfLeave: endDate,
          approverId: employee?.managerId || null,
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
      res.status(201).json(leave);
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
}
