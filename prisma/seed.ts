import { PrismaClient, LeaveType, SpecialLeaveType } from '../generated/prisma/client';

//* Set the database URL if not already set
if (!process.env['DATABASE_URL']) {
  process.env['DATABASE_URL'] = 'file:./dev.db';
}

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  try {
    //* Clear existing data
    await prisma.leave.deleteMany();
    await prisma.leaveBalance.deleteMany();
    await prisma.employee.deleteMany();

    const manager1 = await prisma.employee.create({
      data: {
        employeeId: 'K000001',
        name: 'Velthoven Jeroen-van',
        isManager: true,
        contractHours: 40,
      },
    });

    const manager2 = await prisma.employee.create({
      data: {
        employeeId: 'K000002',
        name: 'Eszter Nasz',
        isManager: true,
        contractHours: 40,
      },
    });

    const employee1 = await prisma.employee.create({
      data: {
        employeeId: 'K012345',
        name: 'Mohammad Farhadi',
        managerId: 'K000001',
        contractHours: 40,
      },
    });

    const employee2 = await prisma.employee.create({
      data: {
        employeeId: 'K012346',
        name: 'Bertold Oravecz',
        managerId: 'K000001',
        contractHours: 32,
      },
    });

    const employee3 = await prisma.employee.create({
      data: {
        employeeId: 'K012347',
        name: 'Carol Davis',
        managerId: 'K000002',
        contractHours: 40,
      },
    });

    //* Create leave balances for current year
    const currentYear = new Date().getFullYear();

    const employees = [manager1, manager2, employee1, employee2, employee3];

    for (const employee of employees) {
      const leaveDays = Math.round((employee.contractHours / 40) * 25);
      const leaveHours = leaveDays * 8;

      await prisma.leaveBalance.create({
        data: {
          employeeId: employee.employeeId,
          year: currentYear,
          totalDays: leaveDays,
          totalHours: leaveHours,
        },
      });
    }

    //* Create sample leaves with proper totalHours calculation
    const calculateWorkingHours = (startDate: Date, endDate: Date): number => {
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays * 8; // 8 hours per day
    };

    const summerVacationStart = new Date('2025-07-01T09:00:00Z');
    const summerVacationEnd = new Date('2025-07-15T17:00:00Z');

    await prisma.leave.create({
      data: {
        leaveLabel: 'Summer vacation',
        employeeId: 'K012345',
        startOfLeave: summerVacationStart,
        endOfLeave: summerVacationEnd,
        approverId: 'K000001',
        status: 'APPROVED',
        leaveType: LeaveType.REGULAR,
        totalHours: calculateWorkingHours(summerVacationStart, summerVacationEnd),
      },
    });

    const christmasStart = new Date('2025-12-23T09:00:00Z');
    const christmasEnd = new Date('2025-12-30T17:00:00Z');

    await prisma.leave.create({
      data: {
        leaveLabel: 'Christmas break',
        employeeId: 'K012346',
        startOfLeave: christmasStart,
        endOfLeave: christmasEnd,
        approverId: 'K000001',
        status: 'REQUESTED',
        leaveType: LeaveType.REGULAR,
        totalHours: calculateWorkingHours(christmasStart, christmasEnd),
      },
    });

    // Add a special leave example
    const movingStart = new Date('2025-11-15T09:00:00Z');
    const movingEnd = new Date('2025-11-15T17:00:00Z');

    await prisma.leave.create({
      data: {
        leaveLabel: 'Moving day',
        employeeId: 'K012347',
        startOfLeave: movingStart,
        endOfLeave: movingEnd,
        approverId: 'K000002',
        status: 'APPROVED',
        leaveType: LeaveType.SPECIAL,
        specialLeaveType: SpecialLeaveType.MOVING,
        totalHours: 8,
      },
    });

    console.info('Database seeded successfully!');
  } catch (err) {
    console.error('❌ Error seeding database:', err);
    throw err;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
