import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FirestoreService } from '../../services/firestore.service';
import { ProgressService } from '../../services/progress.service';
import { ExamService } from '../../services/exam.service';
import { ToastService } from '../../services/toast.service';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { ExamQuestion, ExamResult, WordWithProgress } from '../../core/models';
import { APP_CONFIG } from '../../core/app.constants';

type ExamMode = 'topic' | 'hardest' | 'new' | 'random';
type ExamPhase = 'loading' | 'question' | 'result';

@Component({
    selector: 'app-exam',
    standalone: true,
    imports: [NavbarComponent],
    template: `
    <div class="min-h-screen bg-gray-50 dark:bg-gray-950">
      <app-navbar />
      <div class="page-container">
        @if (phase() === 'loading') {
          <div class="text-center py-20 text-gray-400">
            <div class="text-5xl animate-pulse-soft mb-3">🎓</div>
            <p>Підготовка іспиту...</p>
          </div>
        }

        @if (phase() === 'question' && currentQuestion()) {
          <div class="animate-fade-in">
            <!-- Progress header -->
            <div class="mb-6">
              <div class="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-2">
                <span>Питання {{ currentIndex() + 1 }} з {{ questions().length }}</span>
                <span>{{ correctCount() }} правильних</span>
              </div>
              <div class="progress-bar-bg">
                <div class="progress-bar-fill transition-all duration-500"
                  [style.width.%]="((currentIndex()) / questions().length) * 100"></div>
              </div>
            </div>

            <!-- Question card -->
            <div class="card p-6 mb-4" [class.border-green-400]="answerFeedback() === 'correct'"
              [class.border-red-400]="answerFeedback() === 'wrong'"
              [class.dark:border-green-500]="answerFeedback() === 'correct'"
              [class.dark:border-red-500]="answerFeedback() === 'wrong'">
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase mb-3">
                {{ questionTypeLabel() }}
              </div>
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {{ currentQuestion()!.question }}
              </h2>
              @if (currentQuestion()!.extraContext) {
                <p class="text-sm text-gray-500 dark:text-gray-400">{{ currentQuestion()!.extraContext }}</p>
              }
            </div>

            <!-- Options -->
            <div class="space-y-2">
              @for (option of currentQuestion()!.options; track option) {
                <button (click)="selectAnswer(option)"
                  [disabled]="!!answerFeedback()"
                  class="w-full text-left p-4 rounded-xl border-2 font-medium transition-all duration-200"
                  [class]="optionClass(option)">
                  {{ option }}
                </button>
              }
            </div>

            @if (answerFeedback()) {
              <div class="mt-4 p-4 rounded-xl animate-slide-up"
                [class]="answerFeedback() === 'correct'
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
                  : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'">
                <div class="font-semibold mb-1">
                  {{ answerFeedback() === 'correct' ? '✅ Правильно!' : '❌ Помилка!' }}
                </div>
                @if (answerFeedback() === 'wrong') {
                  <div class="text-sm">Правильна відповідь: <strong>{{ currentQuestion()!.correctAnswer }}</strong></div>
                }
              </div>
              <button (click)="nextQuestion()" class="btn-primary w-full mt-3">
                {{ currentIndex() + 1 < questions().length ? 'Далі →' : 'Завершити іспит' }}
              </button>
            }
          </div>
        }

        @if (phase() === 'result') {
          <div class="animate-fade-in text-center">
            <div class="text-6xl mb-4">{{ scoreEmoji() }}</div>
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">Іспит завершено!</h1>
            <div class="text-5xl font-bold my-4"
              [class]="correctCount() >= questions().length * 0.7
                ? 'text-accent-500' : 'text-red-500'">
              {{ correctCount() }}/{{ questions().length }}
            </div>
            <p class="text-gray-500 dark:text-gray-400 mb-8">
              {{ scoreMessage() }}
            </p>

            <!-- Results breakdown -->
            <div class="card p-4 mb-6 text-left space-y-2">
              @for (result of results(); track result.question.word.id) {
                <div class="flex items-center gap-3 p-2 rounded-lg"
                  [class]="result.isCorrect ? 'bg-green-50 dark:bg-green-900/10' : 'bg-red-50 dark:bg-red-900/10'">
                  <span>{{ result.isCorrect ? '✅' : '❌' }}</span>
                  <div class="flex-1 min-w-0">
                    <div class="font-medium text-gray-800 dark:text-gray-200 truncate">{{ result.question.word.word }}</div>
                    @if (!result.isCorrect) {
                      <div class="text-xs text-red-500 dark:text-red-400">
                        Ваша відповідь: {{ result.selectedAnswer }} → {{ result.question.correctAnswer }}
                      </div>
                    }
                  </div>
                </div>
              }
            </div>

            <div class="flex gap-3">
              <button (click)="restartExam()" class="btn-secondary flex-1">🔁 Повторити</button>
              <button (click)="exit()" class="btn-primary flex-1">← Назад</button>
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class ExamComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private auth = inject(AuthService);
    private firestore = inject(FirestoreService);
    private progressService = inject(ProgressService);
    private examService = inject(ExamService);
    private toast = inject(ToastService);

    phase = signal<ExamPhase>('loading');
    questions = signal<ExamQuestion[]>([]);
    results = signal<ExamResult[]>([]);
    currentIndex = signal(0);
    selectedAnswer = signal('');
    answerFeedback = signal<'correct' | 'wrong' | null>(null);
    correctCount = signal(0);

    private mode: ExamMode = 'topic';
    private topicId: string = '';
    private allWords: WordWithProgress[] = [];

    private get uid(): string { return this.auth.user()?.uid ?? ''; }

    async ngOnInit(): Promise<void> {
        this.topicId = this.route.snapshot.paramMap.get('topicId') ?? '';
        const routeMode = this.route.snapshot.paramMap.get('mode') ?? this.route.snapshot.data['mode'];
        this.mode = (routeMode as ExamMode) ?? 'topic';

        await this.loadAndStart();
    }

    private async loadAndStart(): Promise<void> {
        this.phase.set('loading');
        try {
            await this.loadWords();
            this.startExam();
        } catch (e: any) {
            this.toast.error(`Помилка іспиту: ${e.message}`);
            this.router.navigate(['/learn']);
        }
    }

    private async loadWords(): Promise<void> {
        const allProgress = await this.firestore.getAllWordProgress(this.uid);

        if (this.mode === 'topic' && this.topicId) {
            const rawWords = await this.firestore.getWords(this.uid, this.topicId);
            const topicProgress = await this.firestore.getWordProgressForTopic(this.uid, this.topicId);
            this.allWords = this.progressService.mergeWordsWithProgress(rawWords, topicProgress);
        } else {
            // Global exam — get all words across all topics
            const topics = await this.firestore.getTopics(this.uid);
            const allWordsArr: WordWithProgress[] = [];
            for (const topic of topics) {
                const rawWords = await this.firestore.getWords(this.uid, topic.id!);
                const merged = this.progressService.mergeWordsWithProgress(rawWords, allProgress.filter(p => p.topicId === topic.id));
                allWordsArr.push(...merged);
            }
            this.allWords = allWordsArr;
        }
    }

    private startExam(): void {
        const n = APP_CONFIG.examQuestionsPerSession;
        let selectedWords: WordWithProgress[];

        switch (this.mode) {
            case 'hardest':
                selectedWords = this.progressService.getHardestWords(this.allWords).slice(0, n);
                break;
            case 'new':
                selectedWords = this.progressService.getLeastSeenWords(this.allWords).slice(0, n);
                break;
            case 'random':
                selectedWords = this.progressService.getRandomWords(this.allWords).slice(0, n);
                break;
            default:
                selectedWords = this.allWords;
        }

        if (selectedWords.length === 0) {
            this.toast.warning('Недостатньо слів для іспиту.');
            this.router.navigate(['/learn']);
            return;
        }

        const qs = this.examService.generateQuestions(selectedWords, n);
        this.questions.set(qs);
        this.results.set([]);
        this.currentIndex.set(0);
        this.correctCount.set(0);
        this.answerFeedback.set(null);
        this.phase.set('question');
    }

    currentQuestion(): ExamQuestion | null {
        return this.questions()[this.currentIndex()] ?? null;
    }

    async selectAnswer(option: string): Promise<void> {
        if (this.answerFeedback()) return;

        const q = this.currentQuestion();
        if (!q) return;

        const isCorrect = option === q.correctAnswer;
        this.answerFeedback.set(isCorrect ? 'correct' : 'wrong');
        if (isCorrect) this.correctCount.update(c => c + 1);

        this.results.update(r => [...r, { question: q, selectedAnswer: option, isCorrect }]);

        // Update progress in Firestore
        try {
            await this.firestore.updateWordProgress(this.uid, q.word.id!, q.word.topicId, isCorrect);
        } catch {/* non-fatal */ }
    }

    nextQuestion(): void {
        if (this.currentIndex() + 1 >= this.questions().length) {
            this.phase.set('result');
        } else {
            this.currentIndex.update(i => i + 1);
            this.answerFeedback.set(null);
        }
    }

    optionClass(option: string): string {
        const q = this.currentQuestion();
        if (!this.answerFeedback()) {
            return 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20';
        }
        if (option === q?.correctAnswer) {
            return 'border-green-400 dark:border-green-500 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200';
        }
        if (option === this.results()[this.results().length - 1]?.selectedAnswer) {
            return 'border-red-400 dark:border-red-500 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200';
        }
        return 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-400 dark:text-gray-600';
    }

    questionTypeLabel(): string {
        const labels: Record<string, string> = {
            'translate-pt-ua': 'Переклад: Португальська → Українська',
            'translate-ua-pt': 'Переклад: Українська → Португальська',
            'gender': 'Граматика: Рід іменника',
            'plural': 'Граматика: Множина іменника',
            'conjugation': 'Граматика: Дієвідмінювання',
            'comparative': 'Граматика: Порівняльна ступінь',
            'superlative': 'Граматика: Найвища ступінь',
        };
        return labels[this.currentQuestion()?.type ?? ''] ?? 'Питання';
    }

    scoreEmoji(): string {
        const ratio = this.correctCount() / this.questions().length;
        if (ratio === 1) return '🏆';
        if (ratio >= 0.8) return '⭐';
        if (ratio >= 0.6) return '👍';
        return '📚';
    }

    scoreMessage(): string {
        const ratio = this.correctCount() / this.questions().length;
        if (ratio === 1) return 'Ідеальний результат! Бездоганно!';
        if (ratio >= 0.8) return 'Відмінно! Продовжуйте в тому ж дусі!';
        if (ratio >= 0.6) return 'Непогано! Ще трохи практики — і буде чудово.';
        return 'Треба більше практики. Не здавайтесь!';
    }

    async restartExam(): Promise<void> {
        await this.loadAndStart();
    }

    exit(): void {
        if (this.topicId && this.mode === 'topic') {
            this.router.navigate(['/learn', this.topicId]);
        } else {
            this.router.navigate(['/learn']);
        }
    }
}
