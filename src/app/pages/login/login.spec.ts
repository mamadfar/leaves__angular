import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { provideZonelessChangeDetection } from '@angular/core';
import { of } from 'rxjs';
import { Login } from './login';
import { AuthService } from '../../services/auth/Auth.service';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const authSpy = jasmine.createSpyObj('AuthService', ['login']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [Login, FormsModule],
      providers: [
        provideZonelessChangeDetection(),
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should login successfully with valid credentials', () => {
    const mockUser = { employeeId: 'K123456', name: 'John Doe', isManager: false };
    authService.login.and.returnValue(of(mockUser));

    component.employeeId = 'K123456';
    component.login();

    expect(authService.login).toHaveBeenCalledWith('K123456');
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should show error for invalid credentials', () => {
    authService.login.and.returnValue(of(null));

    component.employeeId = 'INVALID';
    component.login();

    expect(component.errorMessage()).toBe('Invalid employee ID');
  });

  it('should show error for empty employee ID', () => {
    component.employeeId = '';
    component.login();

    expect(component.errorMessage()).toBe('Please enter an employee ID');
  });
});
