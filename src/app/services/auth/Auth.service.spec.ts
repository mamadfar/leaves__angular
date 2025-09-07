import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { AuthService } from './Auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should login with valid employee ID', () => {
    service.login('K012345').subscribe((user) => {
      expect(user).toBeTruthy();
      expect(user?.employeeId).toBe('K012345');
      expect(user?.name).toBe('Mohammad Farhadi');
    });
  });

  it('should return null for invalid employee ID', () => {
    service.login('INVALID').subscribe((user) => {
      expect(user).toBeNull();
    });
  });

  it('should logout correctly', () => {
    service.login('K012345').subscribe(() => {
      service.logout();
      expect(service.isAuthenticated()).toBeFalse();
      expect(service.getCurrentUser()).toBeNull();
    });
  });

  it('should check manager status correctly', () => {
    service.login('K000001').subscribe(() => {
      expect(service.isManager()).toBeTrue();
    });

    service.login('K012345').subscribe(() => {
      expect(service.isManager()).toBeFalse();
    });
  });
});
