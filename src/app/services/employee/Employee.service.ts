import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IEmployee } from '$types/Employee.type';

@Injectable({
  providedIn: 'root',
})
export class EmployeeService {
  private _http = inject(HttpClient);
  private _baseUrl = '/api/employees';

  getEmployees(): Observable<IEmployee[]> {
    return this._http.get<IEmployee[]>(this._baseUrl);
  }
  getEmployee(employeeId: string): Observable<IEmployee> {
    return this._http.get<IEmployee>(`${this._baseUrl}/${employeeId}`);
  }
  getSubordinates(employeeId: string): Observable<IEmployee[]> {
    return this._http.get<IEmployee[]>(`${this._baseUrl}/${employeeId}/subordinates`);
  }
}
