import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [FormsModule, RouterLink],
    template: `
    <div class="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary-950 via-gray-950 to-gray-900">
      <div class="w-full max-w-md animate-slide-up">
        <div class="text-center mb-8">
          <div class="text-6xl mb-3">🇵🇹</div>
          <h1 class="text-3xl font-bold text-white">Português</h1>
          <p class="text-gray-400 mt-1">Створіть акаунт</p>
        </div>

        <div class="card p-6 space-y-5">
          <h2 class="section-title text-center">Реєстрація</h2>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
              <input id="register-email" [(ngModel)]="email" type="email" placeholder="your@email.com" class="input-field">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Пароль</label>
              <input id="register-password" [(ngModel)]="password" type="password" placeholder="Мінімум 6 символів" class="input-field">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Підтвердіть пароль</label>
              <input id="register-confirm" [(ngModel)]="confirm" type="password" placeholder="Повторіть пароль"
                class="input-field" (keyup.enter)="register()">
            </div>
          </div>

          @if (error()) {
            <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-red-700 dark:text-red-400 text-sm">
              {{ error() }}
            </div>
          }

          <button id="btn-register" (click)="register()" [disabled]="loading()"
            class="btn-primary w-full flex items-center justify-center gap-2">
            @if (loading()) { <span class="animate-spin">⟳</span> }
            Зареєструватись
          </button>

          <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-blue-700 dark:text-blue-400 text-sm">
            📧 Після реєстрації надішлемо листа для підтвердження email.
          </div>

          <p class="text-center text-sm text-gray-500 dark:text-gray-400">
            Вже є акаунт?
            <a routerLink="/auth/login" class="text-primary-600 dark:text-primary-400 hover:underline font-medium">Увійти</a>
          </p>
        </div>
      </div>
    </div>
  `,
})
export class RegisterComponent {
    private authService = inject(AuthService);
    private router = inject(Router);

    email = '';
    password = '';
    confirm = '';
    loading = signal(false);
    error = signal('');

    async register(): Promise<void> {
        this.error.set('');
        if (!this.email || !this.password) {
            this.error.set('Заповніть всі поля.');
            return;
        }
        if (this.password !== this.confirm) {
            this.error.set('Паролі не співпадають.');
            return;
        }
        if (this.password.length < 6) {
            this.error.set('Пароль повинен містити мінімум 6 символів.');
            return;
        }
        this.loading.set(true);
        const ok = await this.authService.registerWithEmail(this.email, this.password);
        this.loading.set(false);
        if (ok) this.router.navigate(['/onboarding']);
    }
}
