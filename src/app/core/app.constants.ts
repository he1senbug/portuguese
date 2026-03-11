/**
 * Central configuration constants for the Portuguese Learning App.
 * All tunable parameters live here — no magic numbers in the codebase.
 */

export const APP_CONFIG = {
    /** Number of words generated per topic */
    wordsPerTopic: { min: 25, max: 50 },

    /** Questions per exam session */
    examQuestionsPerSession: 10,

    /** Minimum net score (correct - wrong) AND minimum correct answers to reach 100% on a word */
    wordScoreToComplete: 3,

    /** Speech synthesis language for audio pronunciation */
    speechLang: 'pt-PT',

    /** Default theme on first launch */
    defaultTheme: 'dark' as 'dark' | 'light',

    /** Gemini model identifiers in priority order (gradual mode) */
    modelsGradual: [
        'gemini-2.5-flash',
        'gemini-3.1-flash-lite',
        'gemini-3.0-flash',
    ] as const,

    /** Manual model choices shown in settings */
    modelsManual: [
        { id: 'gemini-3.0-flash', label: 'Gemini 3 Flash' },
        { id: 'gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash Lite' },
        { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
    ],

    /** Gemini API base URL */
    geminiBaseUrl: 'https://generativelanguage.googleapis.com/v1beta/models',

    /** Minutes to wait before retrying after per-minute rate limit */
    rateLimitWaitMinutes: 1,

    /** LocalStorage keys */
    storageKeys: {
        theme: 'pt_app_theme',
        geminiApiKey: 'pt_app_gemini_key',
        modelMode: 'pt_app_model_mode',
        selectedModel: 'pt_app_selected_model',
        gradualCurrentModelIndex: 'pt_app_gradual_model_index',
        gradualModelResetDate: 'pt_app_gradual_reset_date',
    },

    /** Feature Flags */
    features: {
        enableGoogleAuth: false,
        enableFacebookAuth: false,
    }
};

export type ModelMode = 'manual' | 'gradual';
export type Theme = 'dark' | 'light';
export type WordType = 'noun' | 'verb' | 'adjective';
export type Gender = 'm' | 'f';
