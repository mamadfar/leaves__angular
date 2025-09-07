import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ISpecialLeaveUsage } from '$types/Leave.type';

@Injectable({
  providedIn: 'root',
})
export class SpecialLeaveService {
  private _http = inject(HttpClient);
  private readonly _apiUrl = '/api';

  getSpecialLeaveUsage(employeeId: string, year?: number): Observable<ISpecialLeaveUsage[]> {
    const url = `${this._apiUrl}/employees/${employeeId}/special-leave-usage`;
    const options = year ? { params: { year: year.toString() } } : {};
    return this._http.get<ISpecialLeaveUsage[]>(url, options);
  }
}
