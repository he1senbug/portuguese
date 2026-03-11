import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { ThemeService } from '../../services/theme.service';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-navbar',
    standalone: true,
    imports: [RouterLink, RouterLinkActive],
    template: `
    <nav class="sticky top-0 z-40 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
      <div class="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <a routerLink="/learn" class="flex items-center gap-2 font-bold text-lg text-primary-600 dark:text-primary-400">
          🇵🇹 <span>Português</span>
        </a>
        <div class="flex items-center gap-1">
          <a routerLink="/learn"
             routerLinkActive="text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20"
             class="btn-ghost text-sm">
            📚 Навчання
          </a>
          <a routerLink="/settings"
             routerLinkActive="text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20"
             class="btn-ghost text-sm">
            ⚙️
          </a>
          <button (click)="themeService.toggle()" class="btn-ghost text-lg"
            [title]="themeService.isDark() ? 'Світла тема' : 'Темна тема'">
            {{ themeService.isDark() ? '☀️' : '🌙' }}
          </button>
          <button (click)="logout()" class="btn-ghost text-sm text-red-500 hover:text-red-600 dark:text-red-400">
            Вийти
          </button>
        </div>
      </div>
    </nav>
  `,
})
export class NavbarComponent {
    themeService = inject(ThemeService);
    private auth = inject(AuthService);
    private router = inject(Router);

    async logout(): Promise<void> {
        await this.auth.logout();
        this.router.navigate(['/auth/login']);
    }
}
