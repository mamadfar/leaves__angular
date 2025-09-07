import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '$services/auth/Auth.service';

@Component({
  selector: 'login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.html',
})
export class Login {
  private _authService = inject(AuthService);
  private _router = inject(Router);
  employeeId = '';
  isLoading = signal(false);
  errorMessage = signal('');

  login(): void {
    if (!this.employeeId) {
      this.errorMessage.set('Please enter an employee ID');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this._authService.login(this.employeeId).subscribe({
      next: (user) => {
        this.isLoading.set(false);
        if (user) {
          this._router.navigate(['/dashboard']);
        } else {
          this.errorMessage.set('Invalid employee ID');
        }
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('Login failed. Please try again.');
      },
    });
  }

  quickLogin(employeeId: string): void {
    this.employeeId = employeeId;
    this.login();
  }
}
