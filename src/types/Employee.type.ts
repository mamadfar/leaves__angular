export interface IEmployee {
  employeeId: string;
  name: string;
  managerId?: string;
  contractHours: number;
  isManager: boolean;
  createdAt: string;
  updatedAt: string;
  manager?: { employeeId: string; name: string };
  subordinates?: { employeeId: string; name: string }[];
}
