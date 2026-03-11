import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class NetworkStatusService {
    private readonly _isOnline = signal<boolean>(navigator.onLine);
    readonly isOnline = this._isOnline.asReadonly();

    constructor() {
        window.addEventListener('online', () => this._isOnline.set(true));
        window.addEventListener('offline', () => this._isOnline.set(false));
    }
}
