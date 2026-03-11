import { Component, inject } from '@angular/core';
import { NgIf } from '@angular/common';
import { NetworkStatusService } from '../../services/network-status.service';

@Component({
    selector: 'app-network-banner',
    standalone: true,
    imports: [NgIf],
    template: `
    @if (!network.isOnline()) {
      <div class="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-amber-950 text-center text-sm py-2 px-4 font-medium flex items-center justify-center gap-2 animate-fade-in">
        <span>📡</span>
        <span>Ви офлайн. ШІ-функції недоступні. Ваш прогрес збережено локально.</span>
      </div>
    }
  `,
})
export class NetworkBannerComponent {
    network = inject(NetworkStatusService);
}
