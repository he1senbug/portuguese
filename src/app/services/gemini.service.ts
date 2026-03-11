import { Injectable, inject } from '@angular/core';
import { APP_CONFIG, ModelMode } from '../core/app.constants';
import { ToastService } from './toast.service';
import { Word } from '../core/models';
import { NetworkStatusService } from './network-status.service';

interface GeminiResponse {
    candidates: [{
        content: { parts: [{ text: string }] }
    }];
    error?: { code: number; message: string; status: string };
}

interface TopicGenerationResult {
    topicTitle: string;
    words: Omit<Word, 'id' | 'topicId'>[];
}

@Injectable({ providedIn: 'root' })
export class GeminiService {
    private toast = inject(ToastService);
    private network = inject(NetworkStatusService);

    private get apiKey(): string {
        return localStorage.getItem(APP_CONFIG.storageKeys.geminiApiKey) ?? '';
    }

    private get modelMode(): ModelMode {
        return (localStorage.getItem(APP_CONFIG.storageKeys.modelMode) as ModelMode) ?? 'manual';
    }

    private get currentModel(): string {
        if (this.modelMode === 'gradual') {
            return this.getGradualModel();
        }
        return localStorage.getItem(APP_CONFIG.storageKeys.selectedModel) ?? APP_CONFIG.modelsGradual[0];
    }

    private getGradualModel(): string {
        // Reset daily model index at midnight UTC
        const today = new Date().toISOString().slice(0, 10);
        const resetDate = localStorage.getItem(APP_CONFIG.storageKeys.gradualModelResetDate);
        if (resetDate !== today) {
            localStorage.setItem(APP_CONFIG.storageKeys.gradualModelResetDate, today);
            localStorage.setItem(APP_CONFIG.storageKeys.gradualCurrentModelIndex, '0');
        }
        const idx = parseInt(localStorage.getItem(APP_CONFIG.storageKeys.gradualCurrentModelIndex) ?? '0');
        return APP_CONFIG.modelsGradual[Math.min(idx, APP_CONFIG.modelsGradual.length - 1)];
    }

    private advanceGradualModel(): void {
        const idx = parseInt(localStorage.getItem(APP_CONFIG.storageKeys.gradualCurrentModelIndex) ?? '0');
        const newIdx = Math.min(idx + 1, APP_CONFIG.modelsGradual.length - 1);
        localStorage.setItem(APP_CONFIG.storageKeys.gradualCurrentModelIndex, newIdx.toString());
        this.toast.warning(`Перемикаємось на модель: ${APP_CONFIG.modelsGradual[newIdx]}`);
    }

    async generateTopic(topic: string): Promise<TopicGenerationResult | null> {
        if (!this.network.isOnline()) {
            this.toast.error('Ви офлайн. Генерація неможлива без інтернету.');
            return null;
        }
        if (!this.apiKey) {
            this.toast.error('Будь ласка, введіть ваш API ключ Gemini у налаштуваннях.');
            return null;
        }

        const prompt = this.buildTopicPrompt(topic);
        return this.callGeminiWithRetry<TopicGenerationResult>(prompt);
    }

    private async callGeminiWithRetry<T>(prompt: string, attempt = 0): Promise<T | null> {
        const model = this.currentModel;
        const url = `${APP_CONFIG.geminiBaseUrl}/${model}:generateContent?key=${this.apiKey}`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        responseMimeType: 'application/json',
                        temperature: 0.7,
                    }
                })
            });

            const data: GeminiResponse = await response.json();

            if (!response.ok || data.error) {
                const errCode = data.error?.code ?? response.status;
                const errMsg = data.error?.message ?? response.statusText;

                // Daily rate limit — switch model
                if (errCode === 429 && (errMsg.includes('quota') || errMsg.includes('QUOTA'))) {
                    if (this.modelMode === 'gradual') {
                        this.advanceGradualModel();
                        if (attempt < APP_CONFIG.modelsGradual.length - 1) {
                            return this.callGeminiWithRetry<T>(prompt, attempt + 1);
                        }
                    }
                    this.toast.error(`Ліміт запитів Gemini вичерпано. Спробуйте пізніше. (${errMsg})`);
                    return null;
                }

                // Per-minute rate limit — wait and retry
                if (errCode === 429) {
                    this.toast.warning(`Ліміт за хвилину. Чекаємо ${APP_CONFIG.rateLimitWaitMinutes} хв...`);
                    await this.sleep(APP_CONFIG.rateLimitWaitMinutes * 60 * 1000);
                    return this.callGeminiWithRetry<T>(prompt, attempt);
                }

                throw new Error(`Gemini API error ${errCode}: ${errMsg}`);
            }

            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!text) throw new Error('Порожня відповідь від Gemini');

            // Parse JSON
            const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            return JSON.parse(cleaned) as T;
        } catch (err: any) {
            this.toast.error(`Помилка Gemini: ${err.message ?? err}`);
            return null;
        }
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private buildTopicPrompt(topic: string): string {
        const { min, max } = APP_CONFIG.wordsPerTopic;
        return `You are a European Portuguese language teacher. Generate a vocabulary learning set for the topic: "${topic}".

Return ONLY a JSON object (no markdown blocks) with this exact structure:
{
  "topicTitle": "Topic name in Ukrainian",
  "words": [
    {
      "word": "Portuguese word",
      "translation": "Ukrainian translation",
      "transcription": "IPA or simplified phonetic transcription",
      "type": "noun" | "verb" | "adjective",
      "gender": "m" | "f" | null,
      "plural": "plural form or null (for nouns only)",
      "conjugations": {
        "presente": {"eu": "...", "tu": "...", "ele/ela": "...", "nós": "...", "vós": "...", "eles/elas": "..."},
        "preteritoPerfeito": {"eu": "...", "tu": "...", "ele/ela": "...", "nós": "...", "vós": "...", "eles/elas": "..."},
        "preteritoImperfeito": {"eu": "...", "tu": "...", "ele/ela": "...", "nós": "...", "vós": "...", "eles/elas": "..."},
        "futuro": {"eu": "...", "tu": "...", "ele/ela": "...", "nós": "...", "vós": "...", "eles/elas": "..."},
        "imperativo": {"tu": "...", "você": "...", "nós": "...", "vocês": "..."}
      } or null (for verbs only),
      "comparative": "comparative form or null (for adjectives only)",
      "superlative": "superlative form or null (for adjectives only)",
      "examples": [
        {"pt": "Example sentence in Portuguese", "ua": "Ukrainian translation"},
        {"pt": "Second example sentence", "ua": "Ukrainian translation"}
      ],
      "note": "Optional note about exceptions, special usage, or regional notes. null if none.",
      "distractors": ["similar_word_1", "similar_word_2", "similar_word_3"],
      "distractorTranslations": ["translation_1", "translation_2", "translation_3"]
    }
  ]
}

Rules:
- Generate between ${min} and ${max} words covering nouns, verbs, and adjectives relevant to the topic "${topic}".
- Use EUROPEAN Portuguese (Portugal dialect), NOT Brazilian Portuguese.
- All translations and notes must be in Ukrainian.
- Distractors must be real Portuguese words that are either semantically similar, sound similar, or have similar spelling to the original word — making them genuinely confusing for learners. Provide exactly 3 distractors per word.
- DistractorTranslations must be the exact Ukrainian translations of the 3 distractors provided.
- For nouns, always provide gender and plural. Set conjugations, comparative, superlative to null.
- For verbs, always provide conjugations for all 5 tenses. Set gender, plural, comparative, superlative to null.
- For adjectives, always provide comparative and superlative. Set gender, plural, conjugations to null.
- Always return valid JSON. Do not include any text outside the JSON object.`;
    }
}
