import { WordType, Gender } from './app.constants';

export interface Topic {
    id?: string;
    title: string;
    createdAt: Date;
    wordCount: number;
    userId: string;
}

export interface Conjugations {
    presente: Record<string, string>;
    preteritoPerfeito: Record<string, string>;
    preteritoImperfeito: Record<string, string>;
    futuro: Record<string, string>;
    imperativo: Record<string, string>;
}

export interface Example {
    pt: string;
    ua: string;
}

export interface Word {
    id?: string;
    topicId: string;
    word: string;
    translation: string;
    transcription: string;
    type: WordType;
    gender?: Gender;
    plural?: string;
    conjugations?: Conjugations;
    comparative?: string;
    superlative?: string;
    examples: Example[];
    note?: string;
    distractors: string[];
    distractorTranslations: string[];
}

export interface WordProgress {
    id?: string;
    wordId: string;
    topicId: string;
    userId: string;
    correct: number;
    wrong: number;
    lastSeen?: Date;
}

export interface UserSettings {
    theme: 'dark' | 'light';
    modelMode: 'manual' | 'gradual';
    selectedModel: string;
    geminiApiKey?: string;
}

export interface TopicWithProgress extends Topic {
    progressPercent: number;
}

export interface WordWithProgress extends Word {
    progressPercent: number;
    progress?: WordProgress;
}

export interface ExamQuestion {
    type: 'translate-pt-ua' | 'translate-ua-pt' | 'gender' | 'plural' | 'conjugation' | 'comparative' | 'superlative';
    word: WordWithProgress;
    question: string;
    correctAnswer: string;
    options: string[];
    extraContext?: string; // e.g. tense name for conjugation questions
}

export interface ExamResult {
    question: ExamQuestion;
    selectedAnswer: string;
    isCorrect: boolean;
}

export interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    duration?: number;
}
