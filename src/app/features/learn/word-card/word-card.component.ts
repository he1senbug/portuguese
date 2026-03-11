import { Component, Input, Output, EventEmitter, signal, inject } from '@angular/core';
import { WordWithProgress } from '../../../core/models';
import { AudioService } from '../../../services/audio.service';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-word-card',
  standalone: true,
  imports: [],
  animations: [
    trigger('expand', [
      transition(':enter', [
        style({ opacity: 0, height: '0', overflow: 'hidden' }),
        animate('250ms ease-out', style({ opacity: 1, height: '*' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, height: '0', overflow: 'hidden' }))
      ]),
    ])
  ],
  template: `
    <div class="card overflow-hidden transition-all duration-300" [class.shadow-md]="expanded()">
      <!-- Header row -->
      <div class="p-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        (click)="toggleExpand()">

        <!-- Progress mini arc -->
        <div class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold border-2 transition-colors"
          [class]="progressCircleClass()">
          {{ word.progressPercent }}%
        </div>

        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="font-semibold text-gray-900 dark:text-white">{{ word.word }}</span>
            <span [class]="typeBadgeClass()">{{ typeLabel() }}</span>
            @if (word.gender) {
              <span class="badge bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                {{ word.gender === 'm' ? 'masc.' : 'fem.' }}
              </span>
            }
          </div>
          <div class="text-sm text-gray-500 dark:text-gray-400 truncate">{{ word.translation }}</div>
        </div>

        <div class="flex items-center gap-1 flex-shrink-0">
          <button (click)="$event.stopPropagation(); playAudio()"
            class="p-1.5 text-lg hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Прослухати">
            🔊
          </button>
          <button (click)="$event.stopPropagation(); onDelete.emit()"
            class="p-1.5 text-lg hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-red-400 hover:text-red-500"
            title="Видалити слово">
            🗑️
          </button>
          <span class="text-gray-400 dark:text-gray-600 text-sm transition-transform duration-200"
            [class.rotate-90]="expanded()">›</span>
        </div>
      </div>

      <!-- Expandable Details -->
      @if (expanded()) {
        <div @expand class="border-t border-gray-100 dark:border-gray-800 p-4 space-y-4 bg-gray-50/50 dark:bg-gray-900/30">

          <!-- Transcription -->
          <div class="flex items-center gap-2 text-sm">
            <span class="text-gray-400">🗣️</span>
            <span class="font-mono text-gray-600 dark:text-gray-300 italic">[{{ word.transcription }}]</span>
          </div>

          <!-- Noun details -->
          @if (word.type === 'noun' && (word.gender || word.plural)) {
            <div class="grid grid-cols-2 gap-3">
              @if (word.gender) {
                <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                  <div class="text-xs text-blue-500 dark:text-blue-400 font-medium uppercase mb-1">Рід</div>
                  <div class="font-semibold text-blue-700 dark:text-blue-300">
                    {{ word.gender === 'm' ? '♂ Чоловічий' : '♀ Жіночий' }}
                  </div>
                </div>
              }
              @if (word.plural) {
                <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                  <div class="text-xs text-blue-500 dark:text-blue-400 font-medium uppercase mb-1">Множина</div>
                  <div class="font-semibold text-blue-700 dark:text-blue-300">{{ word.plural }}</div>
                </div>
              }
            </div>
          }

          <!-- Adjective details -->
          @if (word.type === 'adjective' && (word.comparative || word.superlative)) {
            <div class="grid grid-cols-2 gap-3">
              @if (word.comparative) {
                <div class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                  <div class="text-xs text-purple-500 dark:text-purple-400 font-medium uppercase mb-1">Порівняльна</div>
                  <div class="font-semibold text-purple-700 dark:text-purple-300">{{ word.comparative }}</div>
                </div>
              }
              @if (word.superlative) {
                <div class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                  <div class="text-xs text-purple-500 dark:text-purple-400 font-medium uppercase mb-1">Найвища</div>
                  <div class="font-semibold text-purple-700 dark:text-purple-300">{{ word.superlative }}</div>
                </div>
              }
            </div>
          }

          <!-- Verb conjugations -->
          @if (word.type === 'verb' && word.conjugations) {
            <div class="space-y-3">
              <div class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Дієвідміна</div>
              @for (tense of tenseEntries(); track tense.key) {
                <div class="bg-green-50 dark:bg-green-900/10 rounded-lg p-3">
                  <div class="text-xs text-green-600 dark:text-green-400 font-semibold uppercase mb-2">{{ tense.label }}</div>
                  <div class="grid grid-cols-2 gap-1">
                    @for (form of tense.forms; track form.person) {
                      <div class="flex items-baseline gap-2 text-sm">
                        <span class="text-gray-400 dark:text-gray-500 text-xs w-20 flex-shrink-0">{{ form.person }}</span>
                        <span class="font-medium text-green-700 dark:text-green-300">{{ form.form }}</span>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          }

          <!-- Examples -->
          @if (word.examples && word.examples.length > 0) {
            <div class="space-y-2">
              <div class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Приклади</div>
              @for (ex of word.examples; track ex.pt) {
                <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-1">
                  <div class="text-sm font-medium text-gray-800 dark:text-gray-200 italic">{{ ex.pt }}</div>
                  <div class="text-sm text-gray-500 dark:text-gray-400">{{ ex.ua }}</div>
                </div>
              }
            </div>
          }

          <!-- Note -->
          @if (word.note) {
            <div class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              <div class="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase mb-1">📝 Примітка</div>
              <div class="text-sm text-amber-700 dark:text-amber-300">{{ word.note }}</div>
            </div>
          }

          <!-- Progress stats -->
          <div class="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500 pt-1 border-t border-gray-100 dark:border-gray-800">
            <span>✅ Правильно: {{ word.progress?.correct ?? 0 }}</span>
            <span>❌ Помилки: {{ word.progress?.wrong ?? 0 }}</span>
          </div>
        </div>
      }
    </div>
  `,
})
export class WordCardComponent {
  @Input({ required: true }) word!: WordWithProgress;
  @Output() onDelete = new EventEmitter<void>();

  private audio = inject(AudioService);
  expanded = signal(false);

  toggleExpand(): void {
    this.expanded.update(v => !v);
  }

  playAudio(): void {
    this.audio.speak(this.word.word);
  }

  typeLabel(): string {
    return { noun: 'іменник', verb: 'дієслово', adjective: 'прикметник' }[this.word.type] ?? this.word.type;
  }

  typeBadgeClass(): string {
    return { noun: 'badge-noun', verb: 'badge-verb', adjective: 'badge-adjective' }[this.word.type] ?? 'badge';
  }

  progressCircleClass(): string {
    if (this.word.progressPercent === 100) return 'border-accent-500 text-accent-600 dark:text-accent-400 bg-accent-50 dark:bg-accent-900/20';
    if (this.word.progressPercent >= 50) return 'border-primary-400 text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20';
    return 'border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400';
  }

  tenseEntries(): { key: string; label: string; forms: { person: string; form: string }[] }[] {
    if (!this.word.conjugations) return [];
    const labels: Record<string, string> = {
      presente: 'Presente',
      preteritoPerfeito: 'Pretérito Perfeito',
      preteritoImperfeito: 'Pretérito Imperfeito',
      futuro: 'Futuro',
      imperativo: 'Imperativo',
    };
    return Object.entries(this.word.conjugations).map(([key, forms]) => ({
      key,
      label: labels[key] ?? key,
      forms: Object.entries(forms as Record<string, string>).map(([person, form]) => ({ person, form })),
    }));
  }
}
