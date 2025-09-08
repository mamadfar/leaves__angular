import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '$services/auth/Auth.service';

export const authGuard = () => {
  const _authService = inject(AuthService);
  const _router = inject(Router);

  if (_authService.isAuthenticated()) {
    return true;
  } else {
    _router.navigate(['/login']);
    return false;
  }
};
