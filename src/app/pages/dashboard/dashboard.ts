import { Component, inject, OnInit, signal } from '@angular/core';
import { LeaveBalanceService } from '$services/leave-balance/Leave-balance.service';
import { LeaveService } from '$services/leave/Leave.service';
import { EmployeeService } from '$services/employee/Employee.service';
import { IEmployee } from '$types/Employee.type';
import { ILeave } from '$types/Leave.type';
import { ILeaveBalance } from '$types/LeaveBalance.type';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'dashboard',
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  standalone: true,
})
export class Dashboard implements OnInit {
  private _employeeService = inject(EmployeeService);
  private _leaveService = inject(LeaveService);
  private _leaveBalanceService = inject(LeaveBalanceService);

  employees = signal<IEmployee[]>([]);
  selectedEmployee = signal<IEmployee | null>(null);
  selectedEmployeeId = '';
  myLeaves = signal<ILeave[]>([]);
  subordinateLeaves = signal<ILeave[]>([]);
  leaveBalance = signal<ILeaveBalance | null>(null);

  showCreateLeaveForm = false;
  newLeave = {
    leaveLabel: '',
    employeeId: '',
    startOfLeave: '',
    endOfLeave: '',
  };

  ngOnInit() {
    this.loadEmployees();
  }

  loadEmployees() {
    this._employeeService.getEmployees().subscribe({
      next: (employees) => this.employees.set(employees),
      error: (error) => console.error('Error loading employees:', error),
    });
  }

  onEmployeeChange() {
    if (this.selectedEmployeeId) {
      const employee = this.employees().find((emp) => emp.employeeId === this.selectedEmployeeId);
      this.selectedEmployee.set(employee || null);
      this.loadEmployeeData();
    } else {
      this.selectedEmployee.set(null);
    }
  }

  loadEmployeeData() {
    if (!this.selectedEmployee()) return;

    const employeeId = this.selectedEmployee()!.employeeId;

    //* Load employee's leaves
    this._leaveService.getEmployeeLeaves(employeeId).subscribe({
      next: (leaves) => this.myLeaves.set(leaves),
      error: (error) => console.error('Error loading leaves:', error),
    });

    //* Load leave balance
    this._leaveBalanceService.getEmployeeBalance(employeeId).subscribe({
      next: (balance) => this.leaveBalance.set(balance),
      error: (error) => console.error('Error loading balance:', error),
    });

    //* Load subordinate leaves if manager
    if (this.selectedEmployee()?.isManager) {
      this._leaveService.getManagerLeaves(employeeId).subscribe({
        next: (leaves) => this.subordinateLeaves.set(leaves),
        error: (error) => console.error('Error loading subordinate leaves:', error),
      });
    }
  }

  createLeave() {
    if (!this.selectedEmployee()) return;

    const leaveRequest = {
      ...this.newLeave,
      employeeId: this.selectedEmployee()!.employeeId,
    };

    this._leaveService.createLeave(leaveRequest).subscribe({
      next: () => {
        this.showCreateLeaveForm = false;
        this.resetForm();
        this.loadEmployeeData(); //* Refresh data
      },
      error: (error) => {
        console.error('Error creating leave:', error);
        alert('Error creating leave request. Please try again.');
      },
    });
  }

  deleteLeave(leaveId: string) {
    if (!this.selectedEmployee()) return;

    if (confirm('Are you sure you want to cancel this leave request?')) {
      this._leaveService.deleteLeave(leaveId, this.selectedEmployee()!.employeeId).subscribe({
        next: () => this.loadEmployeeData(),
        error: (error) => {
          console.error('Error deleting leave:', error);
          alert('Error canceling leave request. Please try again.');
        },
      });
    }
  }

  approveLeave(leaveId: string) {
    if (!this.selectedEmployee()) return;

    this._leaveService
      .updateLeaveStatus(leaveId, 'APPROVED', this.selectedEmployee()!.employeeId)
      .subscribe({
        next: () => this.loadEmployeeData(),
        error: (error) => {
          console.error('Error approving leave:', error);
          alert('Error approving leave. Please try again.');
        },
      });
  }

  rejectLeave(leaveId: string) {
    if (!this.selectedEmployee()) return;

    this._leaveService
      .updateLeaveStatus(leaveId, 'CLOSED', this.selectedEmployee()!.employeeId)
      .subscribe({
        next: () => this.loadEmployeeData(),
        error: (error) => {
          console.error('Error rejecting leave:', error);
          alert('Error rejecting leave. Please try again.');
        },
      });
  }

  canDeleteLeave(leave: ILeave): boolean {
    const startDate = new Date(leave.startOfLeave);
    const now = new Date();
    return startDate > now && leave.status !== 'CLOSED';
  }

  resetForm() {
    this.newLeave = {
      leaveLabel: '',
      employeeId: '',
      startOfLeave: '',
      endOfLeave: '',
    };
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REQUESTED':
        return 'bg-yellow-100 text-yellow-800';
      case 'CLOSED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
}
