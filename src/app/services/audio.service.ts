import { Injectable } from '@angular/core';
import { APP_CONFIG } from '../core/app.constants';

@Injectable({ providedIn: 'root' })
export class AudioService {
    private synth = window.speechSynthesis;

    speak(text: string): void {
        if (!this.synth) return;
        this.synth.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = APP_CONFIG.speechLang;
        utterance.rate = 0.9;
        utterance.pitch = 1.0;

        // Try to find a pt-PT voice
        const voices = this.synth.getVoices();
        const ptVoice = voices.find(v => v.lang.startsWith('pt'));
        if (ptVoice) utterance.voice = ptVoice;

        this.synth.speak(utterance);
    }

    stop(): void {
        this.synth?.cancel();
    }
}
