import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ICreateLeaveRequest, ILeave } from '$types/Leave.type';

@Injectable({
  providedIn: 'root',
})
export class LeaveService {
  private _http = inject(HttpClient);

  getEmployeeLeaves(employeeId: string): Observable<ILeave[]> {
    return this._http.get<ILeave[]>(`/api/employees/${employeeId}/leaves`);
  }

  getManagerLeaves(managerId: string): Observable<ILeave[]> {
    return this._http.get<ILeave[]>(`/api/managers/${managerId}/leaves`);
  }

  createLeave(leave: ICreateLeaveRequest): Observable<ILeave> {
    return this._http.post<ILeave>('/api/leaves', leave);
  }

  updateLeaveStatus(leaveId: string, status: string, approverId: string): Observable<ILeave> {
    return this._http.patch<ILeave>(`/api/leaves/${leaveId}/status`, { status, approverId });
  }

  deleteLeave(leaveId: string, employeeId: string): Observable<void> {
    return this._http.delete<void>(`/api/leaves/${leaveId}`, { body: { employeeId } });
  }
}
