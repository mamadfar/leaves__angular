import { Request, Response } from 'express';
import { prisma } from '../services/prisma.service';

export class EmployeeController {
  static async getEmployees(req: Request, res: Response) {
    try {
      const employees = await prisma.employee.findMany({
        include: {
          manager: {
            select: {
              employeeId: true,
              name: true,
            },
          },
          subordinates: {
            select: {
              employeeId: true,
              name: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      });
      res.json(employees);
    } catch (err) {
      console.error('Error fetching employees:', err);
      res.status(500).json({ error: 'Failed to fetch employees' });
    }
  }

  static async getEmployee(req: Request, res: Response) {
    try {
      const { employeeId } = req.params;

      const employee = await prisma.employee.findUnique({
        where: { employeeId },
        include: {
          manager: {
            select: { employeeId: true, name: true },
          },
          subordinates: {
            select: { employeeId: true, name: true },
          },
        },
      });
      if (!employee) {
        res.status(404).json({ error: 'Employee not found' });
        return;
      }
      res.json(employee);
    } catch (err) {
      console.error('Error fetching employee:', err);
      res.status(500).json({ error: 'Failed to fetch employee' });
    }
  }

  static async createEmployee(req: Request, res: Response): Promise<void> {
    try {
      const { employeeId, name, managerId, contractHours, isManager } = req.body;

      if (!employeeId || !name) {
        res.status(400).json({ error: 'EmployeeId and name are required' });
        return;
      }

      // Validate employeeId format
      const employeeIdPattern = /^K[0-9]{6}$/;
      if (!employeeIdPattern.test(employeeId)) {
        res.status(400).json({ error: 'EmployeeId must be in format K012345' });
        return;
      }

      const employee = await prisma.employee.create({
        data: {
          employeeId,
          name,
          managerId: managerId || null,
          contractHours: contractHours || 40,
          isManager: isManager || false,
        },
        include: {
          manager: {
            select: { employeeId: true, name: true },
          },
        },
      });

      const currentYear = new Date().getFullYear();
      const leaveDays = Math.round(((contractHours || 40) / 40) * 25); // Pro rata calculation
      const leaveHours = leaveDays * 8;

      await prisma.leaveBalance.create({
        data: {
          employeeId,
          year: currentYear,
          totalDays: leaveDays,
          totalHours: leaveHours,
        },
      });

      res.status(201).json(employee);
    } catch (err: any) {
      console.error('Error creating employee:', err);

      if (err.code === 'P2002') {
        res.status(409).json({ error: 'Employee ID already exists' });
        return;
      }

      res.status(500).json({ error: 'Failed to create employee' });
    }
  }

  static async getSubordinates(req: Request, res: Response) {
    try {
      const { employeeId } = req.params;
      const subordinates = await prisma.employee.findMany({
        where: { managerId: employeeId },
        select: {
          employeeId: true,
          name: true,
          contractHours: true,
        },
        orderBy: { name: 'asc' },
      });
      res.json(subordinates);
    } catch (err) {
      console.error('Error fetching subordinates:', err);
      res.status(500).json({ error: 'Failed to fetch subordinates' });
    }
  }
}
