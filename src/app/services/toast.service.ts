import { Injectable, signal } from '@angular/core';
import { Toast } from '../core/models';

@Injectable({ providedIn: 'root' })
export class ToastService {
    private readonly _toasts = signal<Toast[]>([]);
    readonly toasts = this._toasts.asReadonly();

    show(message: string, type: Toast['type'] = 'info', duration = 4000): void {
        const id = Math.random().toString(36).slice(2);
        const toast: Toast = { id, message, type, duration };
        this._toasts.update(t => [...t, toast]);
        if (duration > 0) {
            setTimeout(() => this.dismiss(id), duration);
        }
    }

    success(message: string, duration = 3000): void {
        this.show(message, 'success', duration);
    }

    error(message: string, duration = 6000): void {
        this.show(message, 'error', duration);
    }

    warning(message: string, duration = 5000): void {
        this.show(message, 'warning', duration);
    }

    info(message: string, duration = 4000): void {
        this.show(message, 'info', duration);
    }

    dismiss(id: string): void {
        this._toasts.update(t => t.filter(toast => toast.id !== id));
    }
}
