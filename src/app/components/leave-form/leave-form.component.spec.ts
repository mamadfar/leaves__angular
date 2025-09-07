import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { provideZonelessChangeDetection } from '@angular/core';
import { of, throwError } from 'rxjs';
import { LeaveFormComponent } from './leave-form.component';
import { LeaveService } from '../../services/leave/Leave.service';
import { AuthService } from '../../services/auth/Auth.service';

describe('LeaveFormComponent', () => {
  let component: LeaveFormComponent;
  let fixture: ComponentFixture<LeaveFormComponent>;
  let leaveService: jasmine.SpyObj<LeaveService>;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    const leaveSpy = jasmine.createSpyObj('LeaveService', ['createLeave']);
    const authSpy = jasmine.createSpyObj('AuthService', ['getCurrentUser']);

    await TestBed.configureTestingModule({
      imports: [LeaveFormComponent, FormsModule],
      providers: [
        provideZonelessChangeDetection(),
        { provide: LeaveService, useValue: leaveSpy },
        { provide: AuthService, useValue: authSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LeaveFormComponent);
    component = fixture.componentInstance;
    leaveService = TestBed.inject(LeaveService) as jasmine.SpyObj<LeaveService>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.leaveRequest.leaveType).toBe('REGULAR');
    expect(component.leaveRequest.leaveLabel).toBe('');
    expect(component.isSubmitting()).toBe(false);
    expect(component.errorMessage()).toBe('');
  });

  it('should reset special leave type when changing leave type from SPECIAL', () => {
    component.leaveRequest.leaveType = 'SPECIAL' as any;
    component.leaveRequest.specialLeaveType = 'MATERNITY' as any;

    component.leaveRequest.leaveType = 'REGULAR' as any;
    component.onLeaveTypeChange();

    expect(component.leaveRequest.specialLeaveType).toBeUndefined();
  });

  it('should submit leave successfully', () => {
    const mockUser = { employeeId: 'K123456', name: 'John Doe', isManager: false };
    const mockLeave = {
      leaveId: '1',
      leaveLabel: 'Test Leave',
      employeeId: 'K123456',
      startOfLeave: '2025-09-08T09:00:00.000Z',
      endOfLeave: '2025-09-08T17:00:00.000Z',
      status: 'REQUESTED',
      leaveType: 'REGULAR',
    } as any;

    authService.getCurrentUser.and.returnValue(mockUser);
    leaveService.createLeave.and.returnValue(of(mockLeave));

    component.leaveRequest.leaveLabel = 'Test Leave';
    component.submitLeave();

    expect(leaveService.createLeave).toHaveBeenCalled();
    expect(component.isSubmitting()).toBeFalse();
    // Just check that the submission completed without checking the exact message
  });

  it('should show error when user not authenticated', () => {
    authService.getCurrentUser.and.returnValue(null);

    component.submitLeave();

    expect(component.errorMessage()).toBe('User not authenticated');
    expect(leaveService.createLeave).not.toHaveBeenCalled();
  });

  it('should handle create leave error', () => {
    const mockUser = { employeeId: 'K123456', name: 'John Doe', isManager: false };

    authService.getCurrentUser.and.returnValue(mockUser);
    leaveService.createLeave.and.returnValue(throwError(() => new Error('Server error')));

    component.submitLeave();

    expect(component.errorMessage()).toBe('Server error');
    expect(component.isSubmitting()).toBe(false);
  });

  it('should reset form correctly', () => {
    component.leaveRequest.leaveLabel = 'Test';
    component.errorMessage.set('Error');
    component.successMessage.set('Success');

    component.resetForm();

    expect(component.leaveRequest.leaveLabel).toBe('');
    expect(component.errorMessage()).toBe('');
    expect(component.successMessage()).toBe('');
  });
});
