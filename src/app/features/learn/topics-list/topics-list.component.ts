import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { FirestoreService } from '../../../services/firestore.service';
import { GeminiService } from '../../../services/gemini.service';
import { ProgressService } from '../../../services/progress.service';
import { ToastService } from '../../../services/toast.service';
import { NetworkStatusService } from '../../../services/network-status.service';
import { NavbarComponent } from '../../../shared/navbar/navbar.component';
import { TopicWithProgress } from '../../../core/models';

@Component({
  selector: 'app-topics-list',
  standalone: true,
  imports: [FormsModule, RouterModule, NavbarComponent],
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-gray-950">
      <app-navbar />
      <div class="page-container">
        <!-- Header -->
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">📚 Мої теми</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Вивчайте слова за темами</p>
        </div>

        <!-- New Topic Input -->
        <div class="card p-4 mb-6">
          <h2 class="font-semibold text-gray-900 dark:text-white mb-3">➕ Нова тема</h2>
          <div class="flex gap-2">
            <input id="new-topic-input" [(ngModel)]="newTopicText" type="text"
              placeholder="Наприклад: медицина, ресторан, мандрівки..."
              class="input-field flex-1" (keyup.enter)="generateTopic()">
            <button id="btn-generate-topic" (click)="generateTopic()"
              [disabled]="generating() || !network.isOnline()"
              class="btn-primary whitespace-nowrap flex items-center gap-2">
              @if (generating()) { <span class="animate-spin inline-block">⟳</span> }
              @else { 🤖 }
              {{ generating() ? 'Генерація...' : 'Генерувати' }}
            </button>
          </div>
          @if (!network.isOnline()) {
            <p class="text-xs text-amber-500 mt-2">⚠️ Офлайн — генерація недоступна</p>
          }
        </div>

        <!-- Topics List -->
        @if (loading()) {
          <div class="text-center py-12 text-gray-400">
            <div class="text-4xl animate-pulse-soft mb-3">📖</div>
            <p>Завантаження тем...</p>
          </div>
        } @else if (topics().length === 0) {
          <div class="text-center py-12 text-gray-400 card p-8">
            <div class="text-5xl mb-4">🌱</div>
            <p class="font-medium text-gray-700 dark:text-gray-300 mb-1">Тем ще немає</p>
            <p class="text-sm">Введіть тему вище та натисніть «Генерувати», щоб почати навчання</p>
          </div>
        } @else {
          <div class="space-y-3 mb-8">
            @for (topic of topics(); track topic.id) {
              <div class="card p-4 hover:shadow-md transition-all duration-200 cursor-pointer group relative overflow-hidden"
                [routerLink]="['/learn', topic.id]">

                <!-- Progress bar background -->
                <div class="absolute inset-0 bg-gradient-to-r from-primary-500/10 dark:from-primary-500/10 to-transparent rounded-xl transition-all duration-700"
                  [style.width.%]="topic.progressPercent"></div>

                <div class="relative flex items-center justify-between">
                  <div class="flex-1 min-w-0 mr-3">
                    <div class="flex items-center gap-2 mb-1">
                      <h3 class="font-semibold text-gray-900 dark:text-white truncate">{{ topic.title }}</h3>
                      @if (topic.progressPercent === 100) {
                        <span class="badge bg-accent-400/20 text-accent-600 dark:text-accent-400">✓ Завершено</span>
                      }
                    </div>
                    <div class="flex items-center gap-3">
                      <span class="text-xs text-gray-500 dark:text-gray-400">{{ topic.wordCount }} слів</span>
                      <div class="flex-1 progress-bar-bg max-w-[120px]">
                        <div class="progress-bar-fill" [style.width.%]="topic.progressPercent"></div>
                      </div>
                      <span class="text-xs font-medium text-primary-600 dark:text-primary-400">{{ topic.progressPercent }}%</span>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <button (click)="requestDeleteTopic($event, topic)"
                      class="opacity-0 group-hover:opacity-100 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50
                             dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
                      title="Видалити тему">
                      🗑️
                    </button>
                    <span class="text-gray-400 dark:text-gray-600">›</span>
                  </div>
                </div>
              </div>
            }
          </div>
        }

        <!-- Global Exam Modes -->
        @if (topics().length > 0) {
          <div class="border-t border-gray-200 dark:border-gray-800 pt-6">
            <h2 class="font-semibold text-gray-900 dark:text-white mb-3">🏆 Глобальні іспити</h2>
            <div class="space-y-2">
              <button id="btn-exam-hardest" [routerLink]="['/exam/hardest']"
                class="card p-4 w-full text-left hover:shadow-md transition-all flex items-center gap-3">
                <span class="text-2xl">🔴</span>
                <div>
                  <div class="font-medium text-gray-900 dark:text-white">Найскладніші слова</div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">10 питань з найгіршими результатами</div>
                </div>
              </button>
              <button id="btn-exam-new" [routerLink]="['/exam/new']"
                class="card p-4 w-full text-left hover:shadow-md transition-all flex items-center gap-3">
                <span class="text-2xl">🟡</span>
                <div>
                  <div class="font-medium text-gray-900 dark:text-white">Нові слова</div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">10 питань з найменш вивченими словами</div>
                </div>
              </button>
              <button id="btn-exam-random" [routerLink]="['/exam/random']"
                class="card p-4 w-full text-left hover:shadow-md transition-all flex items-center gap-3">
                <span class="text-2xl">🎲</span>
                <div>
                  <div class="font-medium text-gray-900 dark:text-white">Випадкові слова</div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">10 випадкових питань з усіх тем</div>
                </div>
              </button>
            </div>
          </div>
        }
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    @if (topicToDelete()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
           (click)="topicToDelete.set(null)">
        <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-sm p-6 animate-slide-up border border-gray-100 dark:border-gray-800"
             (click)="$event.stopPropagation()">
          <div class="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4 text-red-600 dark:text-red-400 text-xl">
            🗑️
          </div>
          <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">Видалити тему?</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">Ви впевнені, що хочете видалити тему «<span class="font-semibold text-gray-900 dark:text-white">{{ topicToDelete()?.title }}</span>»? Цю дію неможливо скасувати.</p>
          <div class="flex gap-3">
            <button (click)="topicToDelete.set(null)" class="flex-1 py-2.5 rounded-xl font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">Скасувати</button>
            <button (click)="executeDeleteTopic()" class="flex-1 py-2.5 rounded-xl font-medium text-white bg-red-500 hover:bg-red-600 transition-colors">Видалити</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class TopicsListComponent implements OnInit {
  private auth = inject(AuthService);
  private firestore = inject(FirestoreService);
  private gemini = inject(GeminiService);
  private progress = inject(ProgressService);
  private toast = inject(ToastService);
  network = inject(NetworkStatusService);

  topics = signal<TopicWithProgress[]>([]);
  loading = signal(true);
  generating = signal(false);
  topicToDelete = signal<TopicWithProgress | null>(null);
  newTopicText = '';

  private get uid(): string {
    return this.auth.user()?.uid ?? '';
  }

  async ngOnInit(): Promise<void> {
    await this.loadTopics();
  }

  private async loadTopics(): Promise<void> {
    console.log('[TopicsList] loadTopics starting, uid:', this.uid);
    if (!this.uid) {
      console.warn('[TopicsList] No UID yet, skipping fetch');
      this.loading.set(false);
      return;
    }
    this.loading.set(true);
    try {
      const rawTopics = await this.firestore.getTopics(this.uid);
      const allProgress = await this.firestore.getAllWordProgress(this.uid);
      console.log(`[TopicsList] Data loaded: ${rawTopics.length} topics, ${allProgress.length} progress records`);

      const topicsWithProgress: TopicWithProgress[] = rawTopics.map(t => {
        const topicProgress = allProgress.filter(p => p.topicId === t.id);
        return {
          ...t,
          progressPercent: this.progress.calculateTopicProgress(topicProgress, t.wordCount),
        };
      });

      this.topics.set(topicsWithProgress);
    } catch (e: any) {
      this.toast.error(`Помилка завантаження тем: ${e.message}`);
    } finally {
      this.loading.set(false);
    }
  }

  async generateTopic(): Promise<void> {
    if (!this.newTopicText.trim()) {
      this.toast.warning('Введіть назву теми для генерації.');
      return;
    }
    if (!this.network.isOnline()) {
      this.toast.error('Для генерації потрібне інтернет-з\'єднання.');
      return;
    }

    this.generating.set(true);
    const topicText = this.newTopicText.trim();
    this.newTopicText = '';

    const result = await this.gemini.generateTopic(topicText);
    this.generating.set(false);

    if (!result) return;

    try {
      // Deduplicate against existing words
      const existingWords = await this.firestore.getAllWords(this.uid);
      const existingWordStrings = new Set(existingWords.map(w => w.word.toLowerCase().trim()));

      const seenNow = new Set<string>();
      const filteredWords: any[] = [];

      for (const w of result.words) {
        const key = w.word.toLowerCase().trim();
        if (!existingWordStrings.has(key) && !seenNow.has(key)) {
          filteredWords.push(w);
          seenNow.add(key);
        }
      }

      if (filteredWords.length === 0) {
        this.toast.info(`Всі слова з теми "${result.topicTitle}" вже вивчені в інших темах!`);
        return;
      }

      const topicId = await this.firestore.addTopic(this.uid, {
        title: result.topicTitle,
        createdAt: new Date(),
        wordCount: filteredWords.length,
        userId: this.uid,
      });
      await this.firestore.addWords(
        this.uid, topicId,
        filteredWords.map(w => ({ ...w, topicId }))
      );

      this.toast.success(`Тема "${result.topicTitle}" створена — ${filteredWords.length} слів!`);
      await this.loadTopics();
    } catch (e: any) {
      this.toast.error(`Помилка збереження: ${e.message}`);
    }
  }

  requestDeleteTopic(event: Event, topic: TopicWithProgress): void {
    event.stopPropagation();
    event.preventDefault();
    this.topicToDelete.set(topic);
  }

  async executeDeleteTopic(): Promise<void> {
    const topic = this.topicToDelete();
    if (!topic) return;
    this.topicToDelete.set(null);
    try {
      await this.firestore.deleteTopic(this.uid, topic.id!);
      this.toast.success('Тему видалено.');
      this.topics.update(ts => ts.filter(t => t.id !== topic.id));
    } catch (e: any) {
      this.toast.error(`Помилка видалення: ${e.message}`);
    }
  }
}
