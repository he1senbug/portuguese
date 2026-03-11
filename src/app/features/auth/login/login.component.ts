import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ThemeService } from '../../../services/theme.service';
import { AuthService } from '../../../services/auth.service';
import { APP_CONFIG } from '../../../core/app.constants';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary-950 via-gray-950 to-gray-900 dark:from-gray-950 dark:to-gray-900">
      <div class="w-full max-w-md animate-slide-up">
        <!-- Logo -->
        <div class="text-center mb-8">
          <div class="text-6xl mb-3">🇵🇹</div>
          <h1 class="text-3xl font-bold text-white">Português</h1>
          <p class="text-gray-400 mt-1">Вивчай португальську з ШІ</p>
        </div>

        <div class="card p-6 space-y-5">
          <h2 class="section-title text-center">Вхід в акаунт</h2>

          @if (error()) {
            <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-red-700 dark:text-red-400 text-sm">
              {{ error() }}
            </div>
          }

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
              <input id="login-email" [(ngModel)]="email" type="email" placeholder="your@email.com"
                class="input-field" (keyup.enter)="loginEmail()">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Пароль</label>
              <input id="login-password" [(ngModel)]="password" type="password" placeholder="••••••••"
                class="input-field" (keyup.enter)="loginEmail()">
            </div>
          </div>

          <button id="btn-login-email" (click)="loginEmail()" [disabled]="loading()"
            class="btn-primary w-full text-center justify-center flex items-center gap-2">
            @if (loading()) { <span class="animate-spin">⟳</span> }
            Увійти
          </button>

          @if (features.enableGoogleAuth || features.enableFacebookAuth) {
            <div class="relative my-2">
              <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-gray-200 dark:border-gray-700"></div></div>
              <div class="relative flex justify-center text-sm"><span class="px-3 bg-white dark:bg-gray-900 text-gray-400">або</span></div>
            </div>

            <div class="space-y-2">
              @if (features.enableGoogleAuth) {
                <button id="btn-login-google" (click)="loginGoogle()" [disabled]="loading()"
                  class="btn-secondary w-full flex items-center justify-center gap-3">
                  <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.2 0 5.7 1.1 7.5 2.9l5.5-5.5C33.5 3.7 29.2 2 24 2 14.8 2 7 7.7 3.6 15.7l6.7 5.2C12.1 14.5 17.6 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.7-.2-3.3-.5-4.8H24v9.1h12.7c-.5 2.9-2.2 5.4-4.7 7l7.1 5.5c4.2-3.9 6.4-9.5 6.4-16.8z"/><path fill="#FBBC05" d="M10.3 28.5A14.5 14.5 0 0 1 9.4 24c0-1.6.3-3.1.7-4.5L3.5 14.3A23.9 23.9 0 0 0 .1 24c0 3.8.9 7.4 2.5 10.6l7.7-6.1z"/><path fill="#34A853" d="M24 46c5.5 0 10.1-1.8 13.5-4.9l-7.1-5.5c-1.9 1.3-4.3 2-6.4 2-6.4 0-11.8-4.3-13.7-10.1l-7.7 6.1C7 41.6 15 46 24 46z"/></svg>
                  Увійти через Google
                </button>
              }
              @if (features.enableFacebookAuth) {
                <button id="btn-login-facebook" (click)="loginFacebook()" [disabled]="loading()"
                  class="btn-secondary w-full flex items-center justify-center gap-3">
                  <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#1877F2" d="M48 24C48 10.7 37.3 0 24 0S0 10.7 0 24c0 12 8.8 21.9 20.3 23.7V30.9h-6.1V24h6.1v-5.3c0-6.1 3.6-9.4 9.1-9.4 2.6 0 5.4.5 5.4.5v5.9h-3c-3 0-3.9 1.9-3.9 3.8V24h6.6l-1.1 6.9h-5.5v16.8C39.2 45.9 48 36 48 24z"/></svg>
                  Увійти через Facebook
                </button>
              }
            </div>
          }

          <p class="text-center text-sm text-gray-500 dark:text-gray-400">
            Немає акаунту?
            <a routerLink="/auth/register" class="text-primary-600 dark:text-primary-400 hover:underline font-medium">Зареєструватись</a>
          </p>
        </div>

        <p class="text-center text-xs text-gray-500 mt-4">
          <button (click)="themeService.toggle()" class="hover:text-gray-300 transition-colors">
            {{ themeService.isDark() ? '☀️ Світла тема' : '🌙 Темна тема' }}
          </button>
        </p>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  themeService = inject(ThemeService);

  features = APP_CONFIG.features;

  email = '';
  password = '';
  loading = signal(false);
  error = signal('');

  async loginEmail(): Promise<void> {
    if (!this.email || !this.password) return;
    this.loading.set(true);
    this.error.set('');
    const ok = await this.authService.loginWithEmail(this.email, this.password);
    this.loading.set(false);
    if (ok) this.router.navigate(['/learn']);
  }

  async loginGoogle(): Promise<void> {
    this.loading.set(true);
    const ok = await this.authService.loginWithGoogle();
    this.loading.set(false);
    if (ok) this.router.navigate(['/learn']);
  }

  async loginFacebook(): Promise<void> {
    this.loading.set(true);
    const ok = await this.authService.loginWithFacebook();
    this.loading.set(false);
    if (ok) this.router.navigate(['/learn']);
  }
}
