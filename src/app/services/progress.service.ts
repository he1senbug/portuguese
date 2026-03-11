import { Injectable } from '@angular/core';
import { WordProgress, WordWithProgress } from '../core/models';
import { APP_CONFIG } from '../core/app.constants';

@Injectable({ providedIn: 'root' })
export class ProgressService {
    /**
     * Calculate word progress percentage (0–100).
     * Requires at least APP_CONFIG.wordScoreToComplete correct answers
     * AND net score (correct - wrong) >= APP_CONFIG.wordScoreToComplete for 100%.
     */
    calculateWordProgress(progress: WordProgress | undefined): number {
        if (!progress) return 0;
        const { correct = 0, wrong = 0 } = progress;
        const net = correct - wrong;
        const threshold = APP_CONFIG.wordScoreToComplete;

        if (correct < threshold) {
            // Not enough correct answers yet
            return Math.min(99, Math.floor((correct / threshold) * 100));
        }
        if (net < threshold) {
            // Enough correct but too many wrong
            return Math.min(99, Math.floor((net / threshold) * 100));
        }
        return 100;
    }

    /**
     * Calculate topic progress as the average word progress percentage.
     */
    calculateTopicProgress(wordProgresses: WordProgress[], totalWords: number): number {
        if (totalWords === 0) return 0;
        if (wordProgresses.length === 0) return 0;

        const total = wordProgresses.reduce((sum, p) => sum + this.calculateWordProgress(p), 0);
        // Words with no progress count as 0
        return Math.floor(total / totalWords);
    }

    /**
     * Merge words with their progress records.
     */
    mergeWordsWithProgress(words: any[], progressList: WordProgress[]): WordWithProgress[] {
        const progressMap = new Map(progressList.map(p => [p.wordId, p]));
        return words.map(w => ({
            ...w,
            progress: progressMap.get(w.id),
            progressPercent: this.calculateWordProgress(progressMap.get(w.id)),
        }));
    }

    /**
     * Get words sorted by worst score (for hardest words exam).
     */
    getHardestWords(words: WordWithProgress[]): WordWithProgress[] {
        return [...words].sort((a, b) => a.progressPercent - b.progressPercent);
    }

    /**
     * Get words sorted by fewest times seen (for new words exam).
     */
    getLeastSeenWords(words: WordWithProgress[]): WordWithProgress[] {
        return [...words].sort((a, b) => {
            const aCount = (a.progress?.correct ?? 0) + (a.progress?.wrong ?? 0);
            const bCount = (b.progress?.correct ?? 0) + (b.progress?.wrong ?? 0);
            return aCount - bCount;
        });
    }

    /**
     * Get randomly shuffled words.
     */
    getRandomWords(words: WordWithProgress[]): WordWithProgress[] {
        return [...words].sort(() => Math.random() - 0.5);
    }
}
