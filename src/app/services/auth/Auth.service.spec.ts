import { TestBed } from '@angular/core/testing';
import { AuthService } from './Auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should login with valid employee ID', () => {
    service.login('K123456').subscribe((user) => {
      expect(user).toBeTruthy();
      expect(user?.employeeId).toBe('K123456');
      expect(user?.name).toBe('John Doe');
    });
  });

  it('should return null for invalid employee ID', () => {
    service.login('INVALID').subscribe((user) => {
      expect(user).toBeNull();
    });
  });

  it('should logout correctly', () => {
    service.login('K123456').subscribe(() => {
      service.logout();
      expect(service.isAuthenticated()).toBeFalse();
      expect(service.getCurrentUser()).toBeNull();
    });
  });

  it('should check manager status correctly', () => {
    service.login('K789012').subscribe(() => {
      expect(service.isManager()).toBeTrue();
    });

    service.login('K123456').subscribe(() => {
      expect(service.isManager()).toBeFalse();
    });
  });
});
