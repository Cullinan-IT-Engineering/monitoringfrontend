import { Component } from '@angular/core';
import { AsyncPipe, NgClass, NgFor } from '@angular/common';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [NgFor, AsyncPipe, NgClass],
  template: `
    <div class="toast-stack">
      <div class="toast" *ngFor="let toast of toastService.toasts$ | async" [ngClass]="toast.type">
        <span>{{ toast.message }}</span>
        <button type="button" (click)="toastService.dismiss(toast.id)" aria-label="Close">x</button>
      </div>
    </div>
  `,
  styles: [
    `
      .toast-stack {
        position: fixed;
        top: 16px;
        right: 16px;
        z-index: 3000;
        display: grid;
        gap: 10px;
        width: min(360px, calc(100vw - 24px));
      }

      .toast {
        border-radius: 12px;
        padding: 12px 14px;
        box-shadow: 0 12px 24px rgba(15, 23, 42, 0.18);
        border: 1px solid;
        display: flex;
        justify-content: space-between;
        gap: 10px;
        animation: toastIn 0.16s ease-out;
      }

      .toast.success {
        background: #dcfce7;
        color: #166534;
        border-color: #bbf7d0;
      }

      .toast.error {
        background: #fee2e2;
        color: #991b1b;
        border-color: #fecaca;
      }

      .toast.warning {
        background: #fef3c7;
        color: #92400e;
        border-color: #fde68a;
      }

      .toast button {
        border: 0;
        background: transparent;
        cursor: pointer;
        color: inherit;
        font-weight: 700;
      }

      @keyframes toastIn {
        from {
          opacity: 0;
          transform: translateY(-6px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `,
  ],
})
export class ToastContainerComponent {
  constructor(public readonly toastService: ToastService) {}
}
