import { Injectable, signal } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class PwaService {
    deferredPrompt = signal<any>(null);
    isInstallable = signal(false);
    isInstalled = signal(false);

    constructor() {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt.set(e);
            this.isInstallable.set(true);
        });

        window.addEventListener('appinstalled', () => {
            this.isInstalled.set(true);
            this.isInstallable.set(false);
            this.deferredPrompt.set(null);
        });

        if (window.matchMedia?.('(display-mode: standalone)')?.matches) {
            this.isInstalled.set(true);
        }
    }

    async install(): Promise<boolean> {
        const prompt = this.deferredPrompt();
        if (!prompt) return false;

        prompt.prompt();
        const { outcome } = await prompt.userChoice;

        if (outcome === 'accepted') {
            this.isInstallable.set(false);
            this.deferredPrompt.set(null);
            return true;
        }
        return false;
    }
}
