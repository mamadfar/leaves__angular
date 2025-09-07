import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ILeaveBalance } from '$types/LeaveBalance.type';

@Injectable({
  providedIn: 'root',
})
export class LeaveBalanceService {
  private _http = inject(HttpClient);
  private readonly _apiUrl = '/api';

  getEmployeeBalance(employeeId: string, year?: number): Observable<ILeaveBalance> {
    const yearParam = year ? `?year=${year}` : '';
    return this._http.get<ILeaveBalance>(
      `${this._apiUrl}/employees/${employeeId}/balance${yearParam}`
    );
  }
}
