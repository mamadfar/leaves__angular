import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideZonelessChangeDetection } from '@angular/core';
import { of } from 'rxjs';
import { Dashboard } from './dashboard';
import { AuthService } from '../../services/auth/Auth.service';
import { LeaveService } from '../../services/leave/Leave.service';
import { LeaveBalanceService } from '../../services/leave-balance/Leave-balance.service';
import { EmployeeService } from '../../services/employee/Employee.service';

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;
  let authService: jasmine.SpyObj<AuthService>;
  let leaveService: jasmine.SpyObj<LeaveService>;
  let leaveBalanceService: jasmine.SpyObj<LeaveBalanceService>;
  let employeeService: jasmine.SpyObj<EmployeeService>;
  let router: jasmine.SpyObj<Router>;

  const mockUser = {
    employeeId: 'K123456',
    name: 'John Doe',
    isManager: false,
  };

  const mockManagerUser = {
    employeeId: 'M123456',
    name: 'Jane Manager',
    isManager: true,
  };

  beforeEach(async () => {
    const authSpy = jasmine.createSpyObj('AuthService', [
      'isAuthenticated',
      'getCurrentUser',
      'isManager',
      'logout',
    ]);
    const leaveSpy = jasmine.createSpyObj('LeaveService', [
      'getEmployeeLeaves',
      'getManagerLeaves',
      'deleteLeave',
      'updateLeaveStatus',
      'createLeave',
    ]);
    const balanceSpy = jasmine.createSpyObj('LeaveBalanceService', ['getEmployeeBalance']);
    const employeeSpy = jasmine.createSpyObj('EmployeeService', ['getEmployees']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        provideZonelessChangeDetection(),
        { provide: AuthService, useValue: authSpy },
        { provide: LeaveService, useValue: leaveSpy },
        { provide: LeaveBalanceService, useValue: balanceSpy },
        { provide: EmployeeService, useValue: employeeSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    leaveService = TestBed.inject(LeaveService) as jasmine.SpyObj<LeaveService>;
    leaveBalanceService = TestBed.inject(
      LeaveBalanceService,
    ) as jasmine.SpyObj<LeaveBalanceService>;
    employeeService = TestBed.inject(EmployeeService) as jasmine.SpyObj<EmployeeService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    // Default setup
    authService.isAuthenticated.and.returnValue(true);
    authService.getCurrentUser.and.returnValue(mockUser);
    authService.isManager.and.returnValue(false);
    leaveService.getEmployeeLeaves.and.returnValue(of([]));
    leaveBalanceService.getEmployeeBalance.and.returnValue(
      of({
        employeeId: 'K123456',
        regularLeaveBalance: 25,
        sickLeaveBalance: 10,
      } as any),
    );
    employeeService.getEmployees.and.returnValue(of([]));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should redirect to login if not authenticated', () => {
    authService.isAuthenticated.and.returnValue(false);

    component.ngOnInit();

    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should load data for authenticated user', () => {
    component.ngOnInit();

    expect(leaveService.getEmployeeLeaves).toHaveBeenCalledWith('K123456');
    expect(leaveBalanceService.getEmployeeBalance).toHaveBeenCalledWith('K123456');
    expect(employeeService.getEmployees).toHaveBeenCalled();
  });

  it('should load pending approvals for manager', () => {
    authService.getCurrentUser.and.returnValue(mockManagerUser);
    authService.isManager.and.returnValue(true);
    leaveService.getManagerLeaves.and.returnValue(
      of([{ id: '1', status: 'REQUESTED', leaveLabel: 'Test Leave' } as any]),
    );

    component.ngOnInit();

    expect(leaveService.getManagerLeaves).toHaveBeenCalledWith('M123456');
  });

  it('should set active tab', () => {
    component.setActiveTab('balance');

    expect(component.activeTab()).toBe('balance');
  });

  it('should handle leave created event', () => {
    // Since loadMyLeaves and loadLeaveBalance are private, we can test the effect
    const mockLeave = { id: '1', leaveLabel: 'Test Leave' };
    component.onLeaveCreated(mockLeave);

    expect(component.activeTab()).toBe('my-leaves');
    expect(leaveService.getEmployeeLeaves).toHaveBeenCalled();
    expect(leaveBalanceService.getEmployeeBalance).toHaveBeenCalled();
  });

  it('should delete leave with confirmation', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    leaveService.deleteLeave.and.returnValue(of(undefined));

    component.deleteLeave('leave123');

    expect(leaveService.deleteLeave).toHaveBeenCalledWith('leave123', 'K123456');
  });

  it('should not delete leave without confirmation', () => {
    spyOn(window, 'confirm').and.returnValue(false);

    component.deleteLeave('leave123');

    expect(leaveService.deleteLeave).not.toHaveBeenCalled();
  });

  it('should approve leave', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    leaveService.updateLeaveStatus.and.returnValue(
      of({
        leaveId: 'leave123',
        status: 'APPROVED',
      } as any),
    );

    component.approveLeave('leave123', true);

    expect(leaveService.updateLeaveStatus).toHaveBeenCalledWith('leave123', 'APPROVED', 'K123456');
  });

  it('should reject leave', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    leaveService.updateLeaveStatus.and.returnValue(
      of({
        leaveId: 'leave123',
        status: 'CLOSED',
      } as any),
    );

    component.approveLeave('leave123', false);

    expect(leaveService.updateLeaveStatus).toHaveBeenCalledWith('leave123', 'CLOSED', 'K123456');
  });

  it('should determine if leave can be deleted', () => {
    const futureLeave = {
      startOfLeave: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      status: 'REQUESTED',
    } as any;

    const pastLeave = {
      startOfLeave: new Date(Date.now() - 86400000).toISOString(), // Yesterday
      status: 'REQUESTED',
    } as any;

    const approvedLeave = {
      startOfLeave: new Date(Date.now() + 86400000).toISOString(),
      status: 'APPROVED',
    } as any;

    expect(component.canDeleteLeave(futureLeave)).toBe(true);
    expect(component.canDeleteLeave(pastLeave)).toBe(false);
    expect(component.canDeleteLeave(approvedLeave)).toBe(false);
  });

  it('should format date correctly', () => {
    const dateString = '2025-09-07T09:00:00.000Z';
    const formatted = component.formatDate(dateString);

    expect(formatted).toContain('2025'); // Basic check that it's formatted
  });

  it('should return correct status class', () => {
    expect(component.getStatusClass('APPROVED')).toBe('bg-green-100 text-green-800');
    expect(component.getStatusClass('REQUESTED')).toBe('bg-yellow-100 text-yellow-800');
    expect(component.getStatusClass('CLOSED')).toBe('bg-red-100 text-red-800');
    expect(component.getStatusClass('UNKNOWN')).toBe('bg-gray-100 text-gray-800');
  });

  it('should logout and navigate to login', () => {
    component.logout();

    expect(authService.logout).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });
});
