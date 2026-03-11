import { Injectable, signal, inject } from '@angular/core';
import {
    Auth, User, createUserWithEmailAndPassword, signInWithEmailAndPassword,
    signOut, GoogleAuthProvider, FacebookAuthProvider, signInWithPopup,
    sendEmailVerification, onAuthStateChanged
} from '@angular/fire/auth';
import { ToastService } from './toast.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private auth = inject(Auth);
    private toast = inject(ToastService);

    private readonly _user = signal<User | null | undefined>(undefined);
    readonly user = this._user.asReadonly();

    constructor() {
        onAuthStateChanged(this.auth, (u) => this._user.set(u));
    }

    async registerWithEmail(email: string, password: string): Promise<boolean> {
        try {
            const cred = await createUserWithEmailAndPassword(this.auth, email, password);
            try {
                await sendEmailVerification(cred.user);
            } catch (emailError: any) {
                console.error('Failed to send verification email:', emailError);
                // Even if email fails, we log them out.
                await signOut(this.auth);
                this.toast.error('Акаунт створено, але не вдалося надіслати email-підтвердження. Спробуйте увійти пізніше, щоб надіслати його знову.');
                return false;
            }

            await signOut(this.auth);
            this.toast.success('Акаунт створено! Перевірте вашу пошту для підтвердження. Потім увійдіть.');
            return true;
        } catch (e: any) {
            this.toast.error(this.mapAuthError(e.code));
            return false;
        }
    }

    async loginWithEmail(email: string, password: string): Promise<boolean> {
        try {
            const cred = await signInWithEmailAndPassword(this.auth, email, password);
            if (!cred.user.emailVerified) {
                await signOut(this.auth);
                try {
                    await sendEmailVerification(cred.user);
                    this.toast.error('Ваша пошта не підтверджена. Ми щойно надіслали новий лінк.');
                } catch (e: any) {
                    this.toast.error('Ваша пошта не підтверджена. Перевірте скриньку (та папку Спам).');
                }
                return false;
            }
            return true;
        } catch (e: any) {
            this.toast.error(this.mapAuthError(e.code));
            return false;
        }
    }

    async loginWithGoogle(): Promise<boolean> {
        try {
            await signInWithPopup(this.auth, new GoogleAuthProvider());
            return true;
        } catch (e: any) {
            this.toast.error(this.mapAuthError(e.code));
            return false;
        }
    }

    async loginWithFacebook(): Promise<boolean> {
        try {
            await signInWithPopup(this.auth, new FacebookAuthProvider());
            return true;
        } catch (e: any) {
            this.toast.error(this.mapAuthError(e.code));
            return false;
        }
    }

    async logout(): Promise<void> {
        localStorage.clear();
        await signOut(this.auth);
        this.toast.info('Ви вийшли з акаунту.');
    }

    private mapAuthError(code: string): string {
        const map: Record<string, string> = {
            'auth/email-already-in-use': 'Ця пошта вже використовується.',
            'auth/invalid-email': 'Некоректна email адреса.',
            'auth/weak-password': 'Пароль надто слабкий (мінімум 6 символів).',
            'auth/user-not-found': 'Користувача з такою поштою не знайдено.',
            'auth/wrong-password': 'Невірний пароль.',
            'auth/invalid-credential': 'Невірні дані для входу.',
            'auth/too-many-requests': 'Забагато спроб. Спробуйте пізніше.',
            'auth/popup-closed-by-user': 'Авторизацію скасовано.',
        };
        return map[code] ?? `Помилка авторизації: ${code}`;
    }
}
