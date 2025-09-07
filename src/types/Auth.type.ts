export interface IUser {
  employeeId: string;
  name: string;
  isManager: boolean;
  managerId?: string;
}

export interface IAuthState {
  isAuthenticated: boolean;
  user: IUser | null;
}
