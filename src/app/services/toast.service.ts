import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ToastType = 'success' | 'error' | 'warning';

export interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _toasts = new BehaviorSubject<ToastItem[]>([]);
  readonly toasts$ = this._toasts.asObservable();
  private nextId = 1;

  success(message: string, durationMs = 3500) {
    this.show('success', message, durationMs);
  }

  error(message: string, durationMs = 4000) {
    this.show('error', message, durationMs);
  }

  warning(message: string, durationMs = 4000) {
    this.show('warning', message, durationMs);
  }

  dismiss(id: number) {
    this._toasts.next(this._toasts.value.filter((t) => t.id !== id));
  }

  private show(type: ToastType, message: string, durationMs: number) {
    const toast: ToastItem = { id: this.nextId++, type, message };
    this._toasts.next([...this._toasts.value, toast]);
    if (durationMs > 0) {
      setTimeout(() => this.dismiss(toast.id), durationMs);
    }
  }
}
