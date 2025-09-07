import { Component, EventEmitter, Output, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { LeaveService } from '$services/leave/Leave.service';
import { AuthService } from '$app/services/auth/Auth.service';
import { ICreateLeaveRequest, ILeave } from '$types/Leave.type';
import { LeaveType, SpecialLeaveType } from '$prisma/enums';

@Component({
  selector: 'leave-form',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './leave-form.component.html',
})
export class LeaveFormComponent {
  private _leaveService = inject(LeaveService);
  private _authService = inject(AuthService);

  @Output() leaveCreated = new EventEmitter<ILeave>();

  //* Expose enums to template
  LeaveType = LeaveType;
  SpecialLeaveType = SpecialLeaveType;

  leaveRequest: ICreateLeaveRequest = {
    leaveLabel: '',
    employeeId: '',
    startOfLeave: this.getDefaultStartDateString(),
    endOfLeave: this.getDefaultEndDateString(),
    leaveType: LeaveType.REGULAR,
  };

  isSubmitting = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  onLeaveTypeChange(): void {
    //* Reset special leave type when changing leave type
    if (this.leaveRequest.leaveType !== LeaveType.SPECIAL) {
      this.leaveRequest.specialLeaveType = undefined;
    }
  }

  submitLeave(): void {
    const currentUser = this._authService.getCurrentUser();
    if (!currentUser) {
      this.errorMessage.set('User not authenticated');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    //* Set employee ID from current user
    this.leaveRequest.employeeId = currentUser.employeeId;

    this._leaveService.createLeave(this.leaveRequest).subscribe({
      next: (leave) => {
        this.isSubmitting.set(false);
        this.successMessage.set('Leave request submitted successfully!');
        this.leaveCreated.emit(leave);
        this.resetForm();
      },
      error: (error) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(error.message || 'Failed to create leave request');
      },
    });
  }

  resetForm(): void {
    this.leaveRequest = {
      leaveLabel: '',
      employeeId: '',
      startOfLeave: this.getDefaultStartDateString(),
      endOfLeave: this.getDefaultEndDateString(),
      leaveType: LeaveType.REGULAR,
    };
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  private getDefaultStartDateString(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    return tomorrow.toISOString().slice(0, 16); // Format for datetime-local input
  }

  private getDefaultEndDateString(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(17, 0, 0, 0);
    return tomorrow.toISOString().slice(0, 16); // Format for datetime-local input
  }
}
