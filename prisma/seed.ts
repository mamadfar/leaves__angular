import { PrismaClient } from '../generated/prisma';

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

    //* Create sample leaves
    await prisma.leave.create({
      data: {
        leaveLabel: 'Summer vacation',
        employeeId: 'K012345',
        startOfLeave: new Date('2024-07-01T08:00:00Z'),
        endOfLeave: new Date('2024-07-15T17:00:00Z'),
        approverId: 'K000001',
        status: 'APPROVED',
      },
    });
    await prisma.leave.create({
      data: {
        leaveLabel: 'Christmas break',
        employeeId: 'K012346',
        startOfLeave: new Date('2024-12-23T08:00:00Z'),
        endOfLeave: new Date('2024-12-30T17:00:00Z'),
        approverId: 'K000001',
        status: 'REQUESTED',
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
