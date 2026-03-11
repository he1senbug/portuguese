import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './services/theme.service';
import { ToastContainerComponent } from './shared/toast-container/toast-container.component';
import { NetworkBannerComponent } from './shared/network-banner/network-banner.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastContainerComponent, NetworkBannerComponent],
  template: `
    <app-network-banner />
    <router-outlet />
    <app-toast-container />
  `,
})
export class AppComponent implements OnInit {
  private theme = inject(ThemeService);

  ngOnInit(): void {
    // Theme initialized in ThemeService constructor
  }
}
