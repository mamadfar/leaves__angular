import { Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { IUser, IAuthState } from '$types/Auth.type';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private _authState = signal<IAuthState>({
    isAuthenticated: false,
    user: null,
  });

  //* Mock users for demo
  private _mockUsers: IUser[] = [
    { employeeId: 'K012345', name: 'Mohammad Farhadi', isManager: false, managerId: 'K000001' },
    { employeeId: 'K012346', name: 'Bertold Oravecz', isManager: false, managerId: 'K000001' },
    { employeeId: 'K012347', name: 'Carol Davis', isManager: false, managerId: 'K000002' },
    { employeeId: 'K000001', name: 'Velthoven Jeroen-van', isManager: true },
    { employeeId: 'K000002', name: 'Eszter Nasz', isManager: true },
  ];

  login(employeeId: string): Observable<IUser | null> {
    const user = this._mockUsers.find((u) => u.employeeId === employeeId);
    if (user) {
      this._authState.set({
        isAuthenticated: true,
        user,
      });
      return of(user);
    }
    return of(null);
  }

  logout(): void {
    this._authState.set({
      isAuthenticated: false,
      user: null,
    });
  }

  getCurrentUser(): IUser | null {
    return this._authState().user;
  }

  isAuthenticated(): boolean {
    return this._authState().isAuthenticated;
  }

  isManager(): boolean {
    return this._authState().user?.isManager || false;
  }

  getAuthState() {
    return this._authState.asReadonly();
  }
}
