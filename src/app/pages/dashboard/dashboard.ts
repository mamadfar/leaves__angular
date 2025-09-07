import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { LeaveBalanceService } from '$services/leave-balance/Leave-balance.service';
import { LeaveService } from '$services/leave/Leave.service';
import { EmployeeService } from '$services/employee/Employee.service';
import { AuthService } from '$app/services/auth/Auth.service';
import { IEmployee } from '$types/Employee.type';
import { ILeave } from '$types/Leave.type';
import { ILeaveBalance } from '$types/LeaveBalance.type';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LeaveFormComponent } from '../../components/leave-form/leave-form.component';

@Component({
  selector: 'dashboard',
  imports: [CommonModule, FormsModule, LeaveFormComponent],
  templateUrl: './dashboard.html',
  standalone: true,
})
export class Dashboard implements OnInit {
  private _employeeService = inject(EmployeeService);
  private _leaveService = inject(LeaveService);
  private _leaveBalanceService = inject(LeaveBalanceService);
  private _authService = inject(AuthService);
  private _router = inject(Router);

  // Tab management
  activeTab = signal('my-leaves');

  // Data signals
  myLeaves = signal<ILeave[]>([]);
  pendingApprovals = signal<ILeave[]>([]);
  leaveBalance = signal<ILeaveBalance | null>(null);

  // User data
  currentUser = computed(() => this._authService.getCurrentUser());

  // Legacy properties for compatibility
  employees = signal<IEmployee[]>([]);
  selectedEmployee = signal<IEmployee | null>(null);
  selectedEmployeeId = '';
  subordinateLeaves = signal<ILeave[]>([]);

  showCreateLeaveForm = false;
  newLeave = {
    leaveLabel: '',
    employeeId: '',
    startOfLeave: '',
    endOfLeave: '',
  };

  ngOnInit() {
    if (!this._authService.isAuthenticated()) {
      this._router.navigate(['/login']);
      return;
    }

    this.loadData();
    this.loadEmployees();
    // Legacy compatibility - auto-select current user
    const currentUser = this._authService.getCurrentUser();
    if (currentUser) {
      this.selectedEmployeeId = currentUser.employeeId;
      // Set selected employee to null initially, will be set when employees load
      setTimeout(() => this.onEmployeeChange(), 0);
    }
  }

  // Tab management methods
  setActiveTab(tab: string): void {
    this.activeTab.set(tab);
  }

  // Leave form event handler
  onLeaveCreated(leave: any): void {
    this.loadMyLeaves();
    this.loadLeaveBalance();
    this.setActiveTab('my-leaves');
  }

  // Data loading methods
  private loadData(): void {
    this.loadMyLeaves();
    this.loadLeaveBalance();
    if (this.currentUser()?.isManager) {
      this.loadPendingApprovals();
    }
  }

  private loadMyLeaves(): void {
    const user = this.currentUser();
    if (user) {
      this._leaveService.getEmployeeLeaves(user.employeeId).subscribe({
        next: (leaves) => this.myLeaves.set(leaves),
        error: (error) => console.error('Error loading leaves:', error),
      });
    }
  }

  private loadPendingApprovals(): void {
    const user = this.currentUser();
    if (user?.isManager) {
      this._leaveService.getManagerLeaves(user.employeeId).subscribe({
        next: (leaves) => {
          // Filter only pending requests
          const pending = leaves.filter((leave) => leave.status === 'REQUESTED');
          this.pendingApprovals.set(pending);
          // Also set subordinateLeaves for legacy compatibility
          this.subordinateLeaves.set(leaves);
        },
        error: (error) => console.error('Error loading subordinate leaves:', error),
      });
    }
  }

  private loadLeaveBalance(): void {
    const user = this.currentUser();
    if (user) {
      this._leaveBalanceService.getEmployeeBalance(user.employeeId).subscribe({
        next: (balance) => this.leaveBalance.set(balance),
        error: (error) => console.error('Error loading balance:', error),
      });
    }
  }

  // Legacy methods for compatibility
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

  // Leave action methods (updated for new UI)
  deleteLeave(leaveId: string): void {
    const user = this.currentUser();
    const selectedEmp = this.selectedEmployee();
    const employeeId = user?.employeeId || selectedEmp?.employeeId;

    if (!employeeId) return;

    if (confirm('Are you sure you want to cancel this leave request?')) {
      this._leaveService.deleteLeave(leaveId, employeeId).subscribe({
        next: () => {
          this.loadMyLeaves();
          this.loadLeaveBalance();
          this.loadEmployeeData(); // For legacy compatibility
        },
        error: (error) => {
          console.error('Error deleting leave:', error);
          alert('Error canceling leave request. Please try again.');
        },
      });
    }
  }

  approveLeave(leaveId: string, approved: boolean = true): void {
    const user = this.currentUser();
    const selectedEmp = this.selectedEmployee();
    const approverId = user?.employeeId || selectedEmp?.employeeId;

    if (!approverId) return;

    const status = approved ? 'APPROVED' : 'CLOSED';
    const action = approved ? 'approve' : 'reject';

    if (confirm(`Are you sure you want to ${action} this leave request?`)) {
      this._leaveService.updateLeaveStatus(leaveId, status, approverId).subscribe({
        next: () => {
          this.loadPendingApprovals();
          this.loadEmployeeData(); // For legacy compatibility
        },
        error: (error) => {
          console.error(`Error ${action}ing leave:`, error);
          alert(`Error ${action}ing leave. Please try again.`);
        },
      });
    }
  }

  // Legacy approve/reject methods for compatibility
  rejectLeave(leaveId: string) {
    this.approveLeave(leaveId, false);
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
        this.loadMyLeaves();
      },
      error: (error) => {
        console.error('Error creating leave:', error);
        alert('Error creating leave request. Please try again.');
      },
    });
  }

  canDeleteLeave(leave: ILeave): boolean {
    const startDate = new Date(leave.startOfLeave);
    const now = new Date();
    return startDate > now && leave.status !== 'CLOSED' && leave.status !== 'APPROVED';
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

  logout() {
    this._authService.logout();
    this._router.navigate(['/login']);
  }

  getCurrentUser() {
    return this._authService.getCurrentUser();
  }

  isCurrentUserManager(): boolean {
    return this._authService.isManager();
  }
}
