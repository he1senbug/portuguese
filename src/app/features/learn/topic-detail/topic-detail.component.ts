import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { FirestoreService } from '../../../services/firestore.service';
import { ProgressService } from '../../../services/progress.service';
import { AudioService } from '../../../services/audio.service';
import { ToastService } from '../../../services/toast.service';
import { NavbarComponent } from '../../../shared/navbar/navbar.component';
import { WordWithProgress, Topic } from '../../../core/models';
import { WordCardComponent } from '../word-card/word-card.component';

@Component({
  selector: 'app-topic-detail',
  standalone: true,
  imports: [NavbarComponent, WordCardComponent],
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-gray-950">
      <app-navbar />
      <div class="page-container">
        <!-- Header -->
        @if (topic()) {
          <div class="mb-6">
            <button (click)="goBack()" class="btn-ghost px-2 py-1 text-sm mb-3 -ml-2">← Назад</button>
            <div class="flex items-start justify-between gap-3">
              <div class="flex-1">
                <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ topic()!.title }}</h1>
                <div class="flex items-center gap-3 mt-1">
                  <span class="text-sm text-gray-500 dark:text-gray-400">{{ words().length }} слів</span>
                  <div class="flex-1 progress-bar-bg max-w-[150px]">
                    <div class="progress-bar-fill" [style.width.%]="topicProgress()"></div>
                  </div>
                  <span class="text-sm font-semibold text-primary-600 dark:text-primary-400">{{ topicProgress() }}%</span>
                </div>
              </div>
              <button id="btn-start-exam" (click)="startExam()"
                [disabled]="words().length === 0"
                class="btn-primary whitespace-nowrap">
                🎓 Іспит
              </button>
            </div>
          </div>
        }

        <!-- Words List -->
        @if (loading()) {
          <div class="text-center py-12 text-gray-400">
            <div class="text-4xl animate-pulse-soft mb-3">📖</div>
            <p>Завантаження слів...</p>
          </div>
        } @else if (words().length === 0) {
          <div class="text-center py-12 card p-8 text-gray-400">
            <p>Слів у цій темі ще немає.</p>
          </div>
        } @else {
          <div class="space-y-2">
            @for (word of words(); track word.id) {
              <app-word-card
                [word]="word"
                (onDelete)="requestDeleteWord(word)"
              />
            }
          </div>
        }
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    @if (wordToDelete()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
           (click)="wordToDelete.set(null)">
        <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-sm p-6 animate-slide-up border border-gray-100 dark:border-gray-800"
             (click)="$event.stopPropagation()">
          <div class="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4 text-red-600 dark:text-red-400 text-xl">
            🗑️
          </div>
          <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">Видалити слово?</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">Ви впевнені, що хочете видалити слово «<span class="font-semibold text-gray-900 dark:text-white">{{ wordToDelete()?.word }}</span>»? Цю дію неможливо скасувати.</p>
          <div class="flex gap-3">
            <button (click)="wordToDelete.set(null)" class="flex-1 py-2.5 rounded-xl font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">Скасувати</button>
            <button (click)="executeDeleteWord()" class="flex-1 py-2.5 rounded-xl font-medium text-white bg-red-500 hover:bg-red-600 transition-colors">Видалити</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class TopicDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private auth = inject(AuthService);
  private firestore = inject(FirestoreService);
  private progressService = inject(ProgressService);
  private toast = inject(ToastService);

  topic = signal<Topic | null>(null);
  words = signal<WordWithProgress[]>([]);
  loading = signal(true);
  wordToDelete = signal<WordWithProgress | null>(null);
  topicProgress = signal(0);

  private get uid(): string { return this.auth.user()?.uid ?? ''; }
  private get topicId(): string { return this.route.snapshot.paramMap.get('topicId') ?? ''; }

  async ngOnInit(): Promise<void> {
    await this.loadData();
  }

  private async loadData(): Promise<void> {
    this.loading.set(true);
    try {
      const rawTopics = await this.firestore.getTopics(this.uid);
      const t = rawTopics.find(t => t.id === this.topicId);
      this.topic.set(t ?? null);

      const rawWords = await this.firestore.getWords(this.uid, this.topicId);
      const progressList = await this.firestore.getWordProgressForTopic(this.uid, this.topicId);

      // Sort by type: noun, verb, adjective
      const order = { noun: 1, verb: 2, adjective: 3 };
      const merged = this.progressService.mergeWordsWithProgress(rawWords, progressList)
        .sort((a, b) => (order[a.type] || 99) - (order[b.type] || 99));

      this.words.set(merged);

      const progress = this.progressService.calculateTopicProgress(progressList, rawWords.length);
      this.topicProgress.set(progress);
    } catch (e: any) {
      this.toast.error(`Помилка: ${e.message}`);
    } finally {
      this.loading.set(false);
    }
  }

  requestDeleteWord(word: WordWithProgress): void {
    this.wordToDelete.set(word);
  }

  async executeDeleteWord(): Promise<void> {
    const word = this.wordToDelete();
    if (!word) return;
    this.wordToDelete.set(null);
    try {
      await this.firestore.deleteWord(this.uid, this.topicId, word.id!);
      this.words.update(ws => ws.filter(w => w.id !== word.id));
      this.toast.success(`Слово "${word.word}" видалено.`);

      // Update topic word count without duplicating
      if (this.topic()) {
        const newCount = this.topic()!.wordCount - 1;
        this.topic.update(t => ({ ...t!, wordCount: newCount }));
        await this.firestore.updateTopic(this.uid, this.topicId, { wordCount: newCount });
      }
    } catch (e: any) {
      this.toast.error(`Помилка видалення: ${e.message}`);
    }
  }

  startExam(): void {
    this.router.navigate(['/learn', this.topicId, 'exam']);
  }

  goBack(): void {
    this.router.navigate(['/learn']);
  }
}
