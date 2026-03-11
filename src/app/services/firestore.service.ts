import { Injectable, inject } from '@angular/core';
import {
    Firestore, collection, doc, setDoc, getDoc, getDocs, deleteDoc,
    query, where, orderBy, Timestamp, enableIndexedDbPersistence
} from '@angular/fire/firestore';
import { Topic, Word, WordProgress, UserSettings } from '../core/models';

@Injectable({ providedIn: 'root' })
export class FirestoreService {
    private db = inject(Firestore);

    constructor() {
        // Enable offline persistence
        enableIndexedDbPersistence(this.db).catch(() => {/* may fail in multi-tab */ });
    }

    // ─── Topics ───────────────────────────────────────────────────────────────
    async addTopic(userId: string, topic: Omit<Topic, 'id'>): Promise<string> {
        const ref = doc(collection(this.db, `users/${userId}/topics`));
        const data = { ...topic, createdAt: Timestamp.fromDate(topic.createdAt) };
        await setDoc(ref, data);
        return ref.id;
    }

    async updateTopic(userId: string, topicId: string, updates: Partial<Topic>): Promise<void> {
        const ref = doc(this.db, `users/${userId}/topics/${topicId}`);
        await setDoc(ref, updates, { merge: true });
    }

    async getTopics(userId: string): Promise<Topic[]> {
        const q = query(
            collection(this.db, `users/${userId}/topics`),
            orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(q);
        return snap.docs.map(d => {
            const data = d.data();
            return {
                ...data,
                id: d.id,
                createdAt: (data['createdAt'] as Timestamp).toDate(),
            } as Topic;
        });
    }

    async deleteTopic(userId: string, topicId: string): Promise<void> {
        // Delete all words in topic
        const wordsSnap = await getDocs(collection(this.db, `users/${userId}/topics/${topicId}/words`));
        const wordDeleteOps = wordsSnap.docs.map(d => deleteDoc(d.ref));
        await Promise.all(wordDeleteOps);

        // Delete word progress for this topic
        const progressSnap = await getDocs(
            query(collection(this.db, `users/${userId}/wordProgress`), where('topicId', '==', topicId))
        );
        const progressDeleteOps = progressSnap.docs.map(d => deleteDoc(d.ref));
        await Promise.all(progressDeleteOps);

        await deleteDoc(doc(this.db, `users/${userId}/topics/${topicId}`));
    }

    // ─── Words ────────────────────────────────────────────────────────────────
    async addWords(userId: string, topicId: string, words: Omit<Word, 'id'>[]): Promise<string[]> {
        const ids: string[] = [];
        for (const word of words) {
            const ref = doc(collection(this.db, `users/${userId}/topics/${topicId}/words`));
            await setDoc(ref, word);
            ids.push(ref.id);
        }
        return ids;
    }

    async getWords(userId: string, topicId: string): Promise<Word[]> {
        const snap = await getDocs(
            query(collection(this.db, `users/${userId}/topics/${topicId}/words`), orderBy('word'))
        );
        return snap.docs.map(d => ({ ...d.data(), id: d.id } as Word));
    }

    async deleteWord(userId: string, topicId: string, wordId: string): Promise<void> {
        await deleteDoc(doc(this.db, `users/${userId}/topics/${topicId}/words/${wordId}`));
        // Also delete progress
        const progressSnap = await getDocs(
            query(collection(this.db, `users/${userId}/wordProgress`), where('wordId', '==', wordId))
        );
        for (const d of progressSnap.docs) await deleteDoc(d.ref);
    }

    // ─── Word Progress ────────────────────────────────────────────────────────
    async getWordProgressForTopic(userId: string, topicId: string): Promise<WordProgress[]> {
        const q = query(
            collection(this.db, `users/${userId}/wordProgress`),
            where('topicId', '==', topicId)
        );
        const snap = await getDocs(q);
        return snap.docs.map(d => {
            const data = d.data();
            return {
                ...data,
                id: d.id,
                lastSeen: data['lastSeen'] ? (data['lastSeen'] as Timestamp).toDate() : undefined,
            } as WordProgress;
        });
    }

    async getAllWordProgress(userId: string): Promise<WordProgress[]> {
        const snap = await getDocs(collection(this.db, `users/${userId}/wordProgress`));
        return snap.docs.map(d => {
            const data = d.data();
            return {
                ...data,
                id: d.id,
                lastSeen: data['lastSeen'] ? (data['lastSeen'] as Timestamp).toDate() : undefined,
            } as WordProgress;
        });
    }

    async updateWordProgress(userId: string, wordId: string, topicId: string, isCorrect: boolean): Promise<void> {
        const ref = doc(this.db, `users/${userId}/wordProgress/${wordId}`);
        const snap = await getDoc(ref);
        if (snap.exists()) {
            const data = snap.data() as WordProgress;
            await setDoc(ref, {
                ...data,
                correct: isCorrect ? (data.correct ?? 0) + 1 : (data.correct ?? 0),
                wrong: !isCorrect ? (data.wrong ?? 0) + 1 : (data.wrong ?? 0),
                lastSeen: Timestamp.now(),
            });
        } else {
            await setDoc(ref, {
                wordId, topicId, userId,
                correct: isCorrect ? 1 : 0,
                wrong: isCorrect ? 0 : 1,
                lastSeen: Timestamp.now(),
            });
        }
    }

    // ─── User Settings ────────────────────────────────────────────────────────
    async getUserSettings(userId: string): Promise<UserSettings | null> {
        const snap = await getDoc(doc(this.db, `users/${userId}/settings/profile`));
        return snap.exists() ? snap.data() as UserSettings : null;
    }

    async saveUserSettings(userId: string, settings: UserSettings): Promise<void> {
        await setDoc(doc(this.db, `users/${userId}/settings/profile`), settings);
    }

    async isFirstLogin(userId: string): Promise<boolean> {
        const snap = await getDoc(doc(this.db, `users/${userId}/settings/profile`));
        return !snap.exists();
    }
}
