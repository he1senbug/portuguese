import { Injectable, signal, computed } from '@angular/core';
import { APP_CONFIG, Theme } from '../core/app.constants';

@Injectable({ providedIn: 'root' })
export class ThemeService {
    private readonly _theme = signal<Theme>(this.getStoredTheme());
    readonly theme = this._theme.asReadonly();
    readonly isDark = computed(() => this._theme() === 'dark');

    constructor() {
        this.applyTheme(this._theme());
    }

    private getStoredTheme(): Theme {
        const stored = localStorage.getItem(APP_CONFIG.storageKeys.theme) as Theme | null;
        return stored ?? APP_CONFIG.defaultTheme;
    }

    toggle(): void {
        this.setTheme(this._theme() === 'dark' ? 'light' : 'dark');
    }

    setTheme(theme: Theme): void {
        this._theme.set(theme);
        localStorage.setItem(APP_CONFIG.storageKeys.theme, theme);
        this.applyTheme(theme);
    }

    private applyTheme(theme: Theme): void {
        const root = document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    }
}
