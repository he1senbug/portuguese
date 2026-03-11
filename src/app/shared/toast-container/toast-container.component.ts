import { Component, inject } from '@angular/core';
import { NgFor, NgClass } from '@angular/common';
import { ToastService } from '../../services/toast.service';
import { Toast } from '../../core/models';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
    selector: 'app-toast-container',
    standalone: true,
    imports: [NgFor, NgClass],
    animations: [
        trigger('toast', [
            transition(':enter', [
                style({ opacity: 0, transform: 'translateY(16px)' }),
                animate('250ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
            ]),
            transition(':leave', [
                animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(8px)' }))
            ]),
        ])
    ],
    template: `
    <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm pointer-events-none">
      @for (toast of toastService.toasts(); track toast.id) {
        <div @toast
          class="pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-lg border text-sm font-medium"
          [ngClass]="toastClass(toast)">
          <span class="text-lg leading-none">{{ toastIcon(toast) }}</span>
          <span class="flex-1">{{ toast.message }}</span>
          <button (click)="toastService.dismiss(toast.id)"
            class="opacity-70 hover:opacity-100 text-lg leading-none transition-opacity">✕</button>
        </div>
      }
    </div>
  `,
})
export class ToastContainerComponent {
    toastService = inject(ToastService);

    toastClass(toast: Toast): string {
        return {
            success: 'bg-green-50 dark:bg-green-900/40 border-green-200 dark:border-green-800 text-green-900 dark:text-green-100',
            error: 'bg-red-50 dark:bg-red-900/40 border-red-200 dark:border-red-800 text-red-900 dark:text-red-100',
            warning: 'bg-amber-50 dark:bg-amber-900/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100',
            info: 'bg-blue-50 dark:bg-blue-900/40 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100',
        }[toast.type];
    }

    toastIcon(toast: Toast): string {
        return { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' }[toast.type];
    }
}
