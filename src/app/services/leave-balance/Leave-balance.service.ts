import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ILeaveBalance } from '$types/LeaveBalance.type';

@Injectable({
  providedIn: 'root',
})
export class LeaveBalanceService {
  private http = inject(HttpClient);

  getEmployeeBalance(employeeId: string, year?: number): Observable<ILeaveBalance> {
    const yearParam = year ? `?year=${year}` : '';
    return this.http.get<ILeaveBalance>(`/api/employees/${employeeId}/balance${yearParam}`);
  }
}
