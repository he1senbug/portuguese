import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs/operators';

export const authGuard: CanActivateFn = () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    return toObservable(auth.user).pipe(
        filter(u => u !== undefined),
        take(1),
        map(u => u ? true : router.createUrlTree(['/auth/login']))
    );
};
