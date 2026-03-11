import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { FirestoreService } from '../../services/firestore.service';
import { ToastService } from '../../services/toast.service';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { APP_CONFIG, ModelMode } from '../../core/app.constants';
import { UserSettings } from '../../core/models';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule, NavbarComponent],
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-gray-950">
      <app-navbar />
      <div class="page-container space-y-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">⚙️ Налаштування</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Керуйте вашим досвідом навчання</p>
        </div>

        <!-- Theme -->
        <div class="card p-5">
          <h2 class="font-semibold text-gray-900 dark:text-white mb-4">🎨 Тема оформлення</h2>
          <div class="flex gap-3">
            <button id="btn-theme-dark" (click)="setTheme('dark')"
              class="flex-1 py-3 rounded-xl border-2 font-medium transition-all"
              [class]="themeService.isDark() ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300' : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'">
              🌙 Темна
            </button>
            <button id="btn-theme-light" (click)="setTheme('light')"
              class="flex-1 py-3 rounded-xl border-2 font-medium transition-all"
              [class]="!themeService.isDark() ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300' : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'">
              ☀️ Світла
            </button>
          </div>
        </div>

        <!-- Gemini API Key -->
        <div class="card p-5">
          <h2 class="font-semibold text-gray-900 dark:text-white mb-1">🤖 API ключ Gemini</h2>
          <p class="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Ключ зберігається ЛИШЕ на вашому пристрої і ніколи не передається на наші сервери.
            Отримайте безкоштовний ключ на <a href="https://aistudio.google.com/api-keys" target="_blank"
            class="text-primary-600 dark:text-primary-400 hover:underline">Google AI Studio</a>.
          </p>
          <div class="flex gap-2">
            <input id="api-key-input" [(ngModel)]="apiKey" type="password"
              placeholder="AIzaSy..."
              class="input-field flex-1">
            <button id="btn-save-api-key" (click)="saveApiKey()" class="btn-primary whitespace-nowrap">Зберегти</button>
          </div>
          @if (apiKeySaved()) {
            <p class="text-xs text-accent-500 mt-2">✓ Ключ збережено</p>
          }
        </div>

        <!-- Model Selection -->
        <div class="card p-5">
          <h2 class="font-semibold text-gray-900 dark:text-white mb-1">🧠 Модель ШІ</h2>
          <p class="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Градуальний режим: спочатку Gemini 2.5 Flash, при вичерпанні ліміту — переходить до легших моделей.
          </p>

          <!-- Mode selector -->
          <div class="flex gap-2 mb-4">
            <button id="btn-mode-gradual" (click)="setModelMode('gradual')"
              class="flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition-all"
              [class]="modelMode() === 'gradual' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'">
              🔄 Градуальний
            </button>
            <button id="btn-mode-manual" (click)="setModelMode('manual')"
              class="flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition-all"
              [class]="modelMode() === 'manual' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'">
              ✋ Вручну
            </button>
          </div>

          @if (modelMode() === 'manual') {
            <div class="space-y-2">
              @for (m of models; track m.id) {
                <button (click)="setSelectedModel(m.id)"
                  class="w-full text-left p-3 rounded-xl border-2 text-sm font-medium transition-all"
                  [class]="selectedModel() === m.id ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300' : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'">
                  {{ m.label }}
                </button>
              }
            </div>
          } @else {
            <div class="bg-gray-100 dark:bg-gray-800 rounded-xl p-3 text-sm text-gray-600 dark:text-gray-400">
              <div class="font-medium text-gray-800 dark:text-gray-200 mb-2">Порядок fallback:</div>
              @for (m of models; track m.id; let i = $index) {
                <div class="flex items-center gap-2 py-0.5">
                  <span class="text-xs bg-gray-200 dark:bg-gray-700 rounded-full px-2 py-0.5">{{ i + 1 }}</span>
                  {{ m.label }}
                </div>
              }
            </div>
          }
        </div>

        <!-- PWA Install -->
        <div class="card p-5">
          <h2 class="font-semibold text-gray-900 dark:text-white mb-1">📱 Встановити як застосунок</h2>
          <p class="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Встановіть Português як окремий застосунок на ваш телефон або комп'ютер для кращого досвіду.
          </p>
          @if (canInstallPwa()) {
            <button id="btn-pwa-install" (click)="installPwa()" class="btn-primary">
              📲 Встановити застосунок
            </button>
          } @else {
            <div class="text-sm text-gray-500 dark:text-gray-400">
              @if (pwaInstalled()) {
                ✅ Застосунок вже встановлено
              } @else {
                💡 Відкрийте у браузері Chrome/Edge і натисніть «Встановити» у адресному рядку
              }
            </div>
          }
        </div>

        <!-- Account -->
        <div class="card p-5">
          <h2 class="font-semibold text-gray-900 dark:text-white mb-4">👤 Акаунт</h2>
          <div class="text-sm text-gray-600 dark:text-gray-400 mb-4">
            <span>Email: </span>
            <span class="font-medium text-gray-900 dark:text-white">{{ userEmail() }}</span>
          </div>
          <button id="btn-logout" (click)="logout()" class="btn-danger text-sm px-4 py-2">
            Вийти з акаунту
          </button>
        </div>
      </div>
    </div>
  `,
})
export class SettingsComponent implements OnInit {
  themeService = inject(ThemeService);
  private auth = inject(AuthService);
  private firestore = inject(FirestoreService);
  private toast = inject(ToastService);

  apiKey = '';
  apiKeySaved = signal(false);
  modelMode = signal<ModelMode>('gradual');
  selectedModel = signal(APP_CONFIG.modelsGradual[0] as string);
  models = APP_CONFIG.modelsManual;
  canInstallPwa = signal(false);
  pwaInstalled = signal(false);
  userEmail = signal('');

  private deferredPrompt: any = null;

  ngOnInit(): void {
    this.apiKey = localStorage.getItem(APP_CONFIG.storageKeys.geminiApiKey) ?? '';
    this.modelMode.set((localStorage.getItem(APP_CONFIG.storageKeys.modelMode) as ModelMode) ?? 'gradual');
    this.selectedModel.set(localStorage.getItem(APP_CONFIG.storageKeys.selectedModel) ?? APP_CONFIG.modelsGradual[0]);
    this.userEmail.set(this.auth.user()?.email ?? '');

    // PWA install prompt
    window.addEventListener('beforeinstallprompt', (e: any) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.canInstallPwa.set(true);
    });
    window.addEventListener('appinstalled', () => {
      this.pwaInstalled.set(true);
      this.canInstallPwa.set(false);
    });
    if (window.matchMedia?.('(display-mode: standalone)')?.matches) {
      this.pwaInstalled.set(true);
    }
  }

  setTheme(theme: 'dark' | 'light'): void {
    this.themeService.setTheme(theme);
    this.saveToFirestore();
  }

  setModelMode(mode: ModelMode): void {
    this.modelMode.set(mode);
    localStorage.setItem(APP_CONFIG.storageKeys.modelMode, mode);
    this.saveToFirestore();
  }

  setSelectedModel(modelId: string): void {
    this.selectedModel.set(modelId);
    localStorage.setItem(APP_CONFIG.storageKeys.selectedModel, modelId);
    this.saveToFirestore();
  }

  saveApiKey(): void {
    localStorage.setItem(APP_CONFIG.storageKeys.geminiApiKey, this.apiKey.trim());
    this.apiKeySaved.set(true);
    this.toast.success('API ключ збережено.');
    setTimeout(() => this.apiKeySaved.set(false), 3000);
  }

  private async saveToFirestore(): Promise<void> {
    const uid = this.auth.user()?.uid;
    if (!uid) return;
    try {
      await this.firestore.saveUserSettings(uid, {
        theme: this.themeService.theme(),
        modelMode: this.modelMode(),
        selectedModel: this.selectedModel(),
      });
    } catch {/* non-fatal */ }
  }

  async installPwa(): Promise<void> {
    if (!this.deferredPrompt) return;
    this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      this.toast.success('Застосунок встановлено! 🎉');
      this.canInstallPwa.set(false);
    }
    this.deferredPrompt = null;
  }

  async logout(): Promise<void> {
    await this.auth.logout();
  }
}
