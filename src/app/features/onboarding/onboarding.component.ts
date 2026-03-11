import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { FirestoreService } from '../../services/firestore.service';
import { GeminiService } from '../../services/gemini.service';
import { ToastService } from '../../services/toast.service';

const INITIAL_TOPICS_PROMPT = (profession: string) =>
    `Suggest 5 practical vocabulary topics for learning European Portuguese for someone whose profession/interests are: "${profession}". Topics should be practical for real life. Return as a JSON array of strings in Ukrainian, like ["Тема 1","Тема 2",...]. Only the JSON array, no other text.`;

@Component({
    selector: 'app-onboarding',
    standalone: true,
    imports: [FormsModule],
    template: `
    <div class="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary-950 via-gray-950 to-gray-900">
      <div class="w-full max-w-md animate-slide-up">
        <div class="text-center mb-8">
          <div class="text-5xl mb-3">👋</div>
          <h1 class="text-2xl font-bold text-white">Ласкаво просимо!</h1>
          <p class="text-gray-400 mt-2">Давайте налаштуємо ваше навчання</p>
        </div>

        <div class="card p-6 space-y-5">
          @if (!loading()) {
            <div>
              <label class="block text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Чим ви займаєтесь?
              </label>
              <p class="text-sm text-gray-500 dark:text-gray-400 mb-3">
                Розкажіть про вашу роботу або інтереси — ми підберемо найкорисніші теми для старту.
              </p>
              <textarea id="onboarding-profession" [(ngModel)]="profession" rows="3"
                placeholder="Наприклад: лікар, програміст, домогосподарство, туризм..."
                class="input-field resize-none"></textarea>
            </div>

            <button id="btn-onboarding-start" (click)="start()"
              class="btn-primary w-full flex items-center justify-center gap-2">
              🚀 Генерувати теми та розпочати
            </button>

            <button id="btn-onboarding-skip" (click)="skip()"
              class="btn-ghost w-full text-center text-sm text-gray-400">
              Пропустити (теми можна додати пізніше)
            </button>
          } @else {
            <div class="text-center py-8 space-y-4">
              <div class="text-4xl animate-pulse-soft">🤖</div>
              <div class="text-gray-700 dark:text-gray-300 font-medium">Генеруємо ваші початкові теми...</div>
              <div class="text-sm text-gray-500 dark:text-gray-400">Це може зайняти кілька секунд</div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class OnboardingComponent {
    private router = inject(Router);
    private auth = inject(AuthService);
    private firestore = inject(FirestoreService);
    private gemini = inject(GeminiService);
    private toast = inject(ToastService);

    profession = '';
    loading = signal(false);

    async start(): Promise<void> {
        if (!this.profession.trim()) {
            this.toast.warning('Будь ласка, опишіть ваші інтереси або пропустіть.');
            return;
        }
        const user = this.auth.user();
        if (!user) return;

        this.loading.set(true);

        // Save settings to mark onboarding complete
        await this.firestore.saveUserSettings(user.uid, {
            theme: 'dark',
            modelMode: 'gradual',
            selectedModel: 'gemini-2.5-flash-preview-05-20',
        });

        // Try to generate initial topics using Gemini
        try {
            const apiKey = localStorage.getItem('pt_app_gemini_key');
            if (apiKey) {
                const topics = await this.generateInitialTopics(user.uid, this.profession);
                if (topics > 0) {
                    this.toast.success(`Створено ${topics} початкових тем! 🎉`);
                }
            }
        } catch {
            // Non-fatal, user can add topics manually
        }

        this.loading.set(false);
        this.router.navigate(['/learn']);
    }

    private async generateInitialTopics(uid: string, profession: string): Promise<number> {
        const result = await this.gemini.generateTopic(profession);
        if (!result) return 0;

        // Generate a couple of suggested topics from the full result
        const topicId = await this.firestore.addTopic(uid, {
            title: result.topicTitle,
            createdAt: new Date(),
            wordCount: result.words.length,
            userId: uid,
        });
        await this.firestore.addWords(uid, topicId, result.words.map(w => ({ ...w, topicId })));
        return 1;
    }

    async skip(): Promise<void> {
        const user = this.auth.user();
        if (user) {
            await this.firestore.saveUserSettings(user.uid, {
                theme: 'dark',
                modelMode: 'gradual',
                selectedModel: 'gemini-2.5-flash-preview-05-20',
            });
        }
        this.router.navigate(['/learn']);
    }
}
