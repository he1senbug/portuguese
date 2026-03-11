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
        const result = [...words];
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }

    /**
     * Prioritize words for the topic exam:
     * 1. Words with progress < 100% (Not mastered)
     * 2. Among those, words with the lowest seen count (correct + wrong)
     * 3. Finally, mastered words (100%), also sorted by lowest seen count
     */
    getTopicPriorityWords(words: WordWithProgress[]): WordWithProgress[] {
        // Sort everything by progress and seen count first
        const sorted = [...words].sort((a: WordWithProgress, b: WordWithProgress) => {
            // 1. Mastery priority (not mastered first)
            const aMastered = a.progressPercent === 100 ? 1 : 0;
            const bMastered = b.progressPercent === 100 ? 1 : 0;
            if (aMastered !== bMastered) return aMastered - bMastered;

            // 2. Seen count priority (least seen first)
            const aCount = (a.progress?.correct ?? 0) + (a.progress?.wrong ?? 0);
            const bCount = (b.progress?.correct ?? 0) + (b.progress?.wrong ?? 0);
            return aCount - bCount;
        });

        // Now, within groups of same (mastered, seenCount), we should shuffle 
        // to avoid always seeing the same words in the same order if they have same priority
        const grouped: WordWithProgress[][] = [];
        for (const word of sorted) {
            const lastGroup = grouped[grouped.length - 1];
            const wordCount = (word.progress?.correct ?? 0) + (word.progress?.wrong ?? 0);
            const isMastered = word.progressPercent === 100;

            if (lastGroup &&
                (lastGroup[0].progressPercent === 100) === isMastered &&
                ((lastGroup[0].progress?.correct ?? 0) + (lastGroup[0].progress?.wrong ?? 0)) === wordCount) {
                lastGroup.push(word);
            } else {
                grouped.push([word]);
            }
        }

        return grouped.flatMap(group => this.getRandomWords(group));
    }
}
