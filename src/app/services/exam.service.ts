import { Injectable } from '@angular/core';
import { ExamQuestion, WordWithProgress } from '../core/models';
import { APP_CONFIG } from '../core/app.constants';

const TENSE_LABELS: Record<string, string> = {
    presente: 'Presente (теперішній)',
    preteritoPerfeito: 'Pretérito Perfeito (минулий доконаний)',
    preteritoImperfeito: 'Pretérito Imperfeito (минулий недоконаний)',
    futuro: 'Futuro (майбутній)',
    imperativo: 'Imperativo (наказовий)',
};

const PERSONS = ['eu', 'tu', 'ele/ela', 'nós', 'vós', 'eles/elas'];

@Injectable({ providedIn: 'root' })
export class ExamService {
    /**
     * Generate exam questions for a set of words.
     * Returns exactly APP_CONFIG.examQuestionsPerSession questions, or fewer if not enough words.
     */
    generateQuestions(words: WordWithProgress[], count = APP_CONFIG.examQuestionsPerSession): ExamQuestion[] {
        if (words.length === 0) return [];

        const questions: ExamQuestion[] = [];
        const shuffledWords = [...words].sort(() => Math.random() - 0.5);

        // Generate one question per word, cycling if needed
        for (let i = 0; i < count; i++) {
            const word = shuffledWords[i % shuffledWords.length];
            const q = this.generateQuestionForWord(word, words);
            if (q) questions.push(q);
        }

        return questions.slice(0, count);
    }

    private generateQuestionForWord(word: WordWithProgress, allWords: WordWithProgress[]): ExamQuestion | null {
        const type = word.type;
        const possibleTypes: ExamQuestion['type'][] = ['translate-pt-ua', 'translate-ua-pt'];

        if (type === 'noun') {
            possibleTypes.push('gender', 'plural');
        } else if (type === 'verb') {
            possibleTypes.push('conjugation');
        } else if (type === 'adjective') {
            possibleTypes.push('comparative', 'superlative');
        }

        const qType = possibleTypes[Math.floor(Math.random() * possibleTypes.length)];
        return this.buildQuestion(qType, word, allWords);
    }

    private buildQuestion(
        qType: ExamQuestion['type'],
        word: WordWithProgress,
        allWords: WordWithProgress[]
    ): ExamQuestion | null {
        const wrongOptions = this.getWrongOptions(qType, word, allWords);

        switch (qType) {
            case 'translate-pt-ua': {
                const cleanWord = word.word.replace(/^[OoAa]s? /, '');
                // Primary source: AI provided distractor translations
                let wrongOpts = word.distractorTranslations || [];

                // Secondary source: other words of the same type in the topic
                if (wrongOpts.length < 3) {
                    const otherSameType = allWords
                        .filter(w => w.id !== word.id && w.type === word.type)
                        .map(w => w.translation);
                    wrongOpts = [...wrongOpts, ...otherSameType];
                }

                // Tertiary source: any other words in the topic
                if (wrongOpts.length < 3) {
                    const anyOther = allWords
                        .filter(w => w.id !== word.id)
                        .map(w => w.translation);
                    wrongOpts = [...wrongOpts, ...anyOther];
                }

                const opts = this.ensureCorrectInOptions(wrongOpts, word.translation);
                return {
                    type: qType,
                    word,
                    question: `Перекладіть: "${cleanWord}"`,
                    correctAnswer: word.translation,
                    options: opts,
                };
            }

            case 'translate-ua-pt': {
                // Primary source: AI provided distractors (Portuguese words)
                let wrongOpts = word.distractors || [];

                // Secondary fallback
                if (wrongOpts.length < 3) {
                    const otherSameType = allWords
                        .filter(w => w.id !== word.id && w.type === word.type)
                        .map(w => w.word);
                    wrongOpts = [...wrongOpts, ...otherSameType];
                }

                const opts = this.ensureCorrectInOptions(wrongOpts, word.word);
                return {
                    type: qType,
                    word,
                    question: `Як перекладається: "${word.translation}"?`,
                    correctAnswer: word.word,
                    options: opts,
                };
            }

            case 'gender': {
                if (!word.gender) return null;
                const cleanWord = word.word.replace(/^[OoAa]s? /, '');
                return {
                    type: qType,
                    word,
                    question: `Який рід іменника "${cleanWord}" (${word.translation})?`,
                    correctAnswer: word.gender === 'm' ? 'Чоловічий (masculino)' : 'Жіночий (feminino)',
                    options: ['Чоловічий (masculino)', 'Жіночий (feminino)'],
                };
            }

            case 'plural': {
                if (!word.plural) return null;
                let wrongPlurals = (word.distractors || []).slice(0, 3).map(d => {
                    return d.endsWith('o') ? d.slice(0, -1) + 'os' :
                        d.endsWith('a') ? d.slice(0, -1) + 'as' : d + 's';
                });

                if (wrongPlurals.length < 3) {
                    const otherPlurals = allWords
                        .filter(w => w.id !== word.id && w.type === 'noun' && !!w.plural)
                        .map(w => w.plural!);
                    wrongPlurals = [...wrongPlurals, ...otherPlurals];
                }

                const opts = this.ensureCorrectInOptions(wrongPlurals, word.plural);
                return {
                    type: qType,
                    word,
                    question: `Яка множина іменника "${word.word.replace(/^[OoAa]s? /, '')}"?`,
                    correctAnswer: word.plural,
                    options: opts,
                };
            }

            case 'conjugation': {
                if (!word.conjugations) return null;
                const tenseKey = this.randomFrom(Object.keys(word.conjugations));
                const tense = word.conjugations[tenseKey as keyof typeof word.conjugations];
                const person = this.randomFrom(Object.keys(tense));
                const correctAnswer = tense[person];
                if (!correctAnswer) return null;

                // Build wrong options from distractors + other conjugation forms
                const allForms = Object.values(tense).filter(f => f !== correctAnswer);
                let wrongForms = [...allForms, ...(word.distractors ?? [])];

                if (wrongForms.length < 3) {
                    const otherVerbs = allWords
                        .filter(w => w.id !== word.id && w.type === 'verb' && !!w.conjugations)
                        .map(w => w.conjugations![tenseKey as keyof typeof word.conjugations]![person as any]);
                    wrongForms = [...wrongForms, ...otherVerbs.filter(f => !!f)];
                }

                const opts = this.ensureCorrectInOptions(wrongForms, correctAnswer);
                return {
                    type: qType,
                    word,
                    question: `Відмінюйте дієслово "${word.word}" — ${person} (${TENSE_LABELS[tenseKey] ?? tenseKey}):`,
                    correctAnswer,
                    options: opts,
                    extraContext: `${person} — ${TENSE_LABELS[tenseKey] ?? tenseKey}`,
                };
            }

            case 'comparative': {
                if (!word.comparative) return null;
                const wrongComparatives = (word.distractors || []).slice(0, 3).map(d => `mais ${d}`);
                const opts = this.ensureCorrectInOptions(wrongComparatives, word.comparative);
                return {
                    type: qType,
                    word,
                    question: `Яка порівняльна форма прикметника "${word.word}" (${word.translation})?`,
                    correctAnswer: word.comparative,
                    options: opts,
                };
            }

            case 'superlative': {
                if (!word.superlative) return null;
                const wrongSuperlatives = (word.distractors || []).slice(0, 3).map(d => `o/a mais ${d}`);
                const opts = this.ensureCorrectInOptions(wrongSuperlatives, word.superlative);
                return {
                    type: qType,
                    word,
                    question: `Яка найвища форма прикметника "${word.word}" (${word.translation})?`,
                    correctAnswer: word.superlative,
                    options: opts,
                };
            }

            default:
                return null;
        }
    }

    private getWrongOptions(
        qType: ExamQuestion['type'],
        word: WordWithProgress,
        allWords: WordWithProgress[]
    ): WordWithProgress[] {
        // First use distractors (as fake words), then fill with actual words from the list
        const sameTypeWords = allWords
            .filter(w => w.id !== word.id && w.type === word.type)
            .sort(() => Math.random() - 0.5);
        return sameTypeWords.slice(0, 3);
    }

    private ensureCorrectInOptions(options: string[], correct: string): string[] {
        const wrongOpts = Array.from(new Set(options.filter(o => o !== correct)));
        return this.shuffle([correct, ...wrongOpts.slice(0, 3)]);
    }

    private shuffle<T>(arr: T[]): T[] {
        return [...arr].sort(() => Math.random() - 0.5);
    }

    private randomFrom<T>(arr: T[]): T {
        return arr[Math.floor(Math.random() * arr.length)];
    }
}
