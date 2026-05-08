import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="top-header" [class.light-theme]="theme === 'light'">
      <div class="header-copy">
        <p class="eyebrow">Cyber Defense Grid</p>
        <h2>Security Monitoring Dashboard</h2>
        <p>Real-time visibility on requests, attacks, and risk signals.</p>
      </div>

      <div class="header-actions">
        <button class="refresh-btn" (click)="refresh.emit()">Refresh now</button>
        <span class="live-badge">Live Sync: ON (5s)</span>
        <button
          class="theme-toggle"
          (click)="toggleTheme.emit()"
          [attr.aria-label]="theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
          [attr.title]="theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
        >
          <span class="theme-icon" aria-hidden="true">{{ theme === 'dark' ? '☀' : '☾' }}</span>
        </button>

        <div class="notification-menu">
          <button class="notif-btn" (click)="toggleNotifications()" title="Notifications" aria-label="Notifications">
            🔔
            <span class="notif-count" *ngIf="alerts.length">{{ alerts.length }}</span>
          </button>
          <div class="dropdown notif-dropdown" *ngIf="notificationsOpen">
            <p class="notif-title">Alerts</p>
            <p class="notif-empty" *ngIf="!alerts.length">No alerts yet.</p>
            <button class="notif-item" *ngFor="let alert of alerts">
              <span class="notif-message">{{ alert.message }}</span>
              <span class="notif-time">{{ alert.createdAt }}</span>
            </button>
          </div>
        </div>

        <div class="profile-menu">
          <button class="profile-btn" (click)="toggleMenu()">
            <span class="avatar">{{ initials }}</span>
            <span class="name">{{ fullName || 'User' }}</span>
          </button>
          <div class="dropdown" *ngIf="menuOpen">
            <button (click)="openProfile.emit(); menuOpen = false">Profile</button>
            <button (click)="logout.emit(); menuOpen = false">Logout</button>
          </div>
        </div>
      </div>
    </header>
  `,
  styles: [
    `
      :host {
        display: block;
        position: relative;
        z-index: 80;
      }

      .top-header {
        background: rgba(15, 23, 42, 0.68);
        border: 1px solid rgba(148, 163, 184, 0.24);
        border-radius: 18px;
        padding: 18px;
        display: flex;
        justify-content: space-between;
        gap: 18px;
        align-items: center;
        box-shadow: 0 14px 38px rgba(2, 6, 23, 0.45);
        backdrop-filter: blur(8px);
        position: relative;
        z-index: 80;
        overflow: visible;
      }

      .header-copy .eyebrow {
        margin: 0;
        color: #67e8f9;
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-weight: 700;
      }

      .top-header h2 {
        margin: 6px 0 0;
        color: #f8fafc;
      }

      .top-header p {
        margin: 4px 0 0;
        color: #cbd5e1;
      }

      .header-actions {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
        position: relative;
        z-index: 90;
        overflow: visible;
      }

      .refresh-btn {
        border: 1px solid rgba(56, 189, 248, 0.5);
        background: linear-gradient(135deg, rgba(37, 99, 235, 0.25), rgba(14, 165, 233, 0.2));
        color: #dbeafe;
        border-radius: 10px;
        padding: 8px 12px;
        cursor: pointer;
        font-weight: 600;
      }

      .live-badge {
        background: rgba(16, 185, 129, 0.16);
        color: #6ee7b7;
        border: 1px solid rgba(110, 231, 183, 0.4);
        border-radius: 999px;
        padding: 8px 12px;
        font-weight: 600;
      }

      .profile-menu {
        position: relative;
        z-index: 100;
      }

      .notification-menu {
        position: relative;
        z-index: 100;
      }

      .theme-toggle {
        border: 1px solid rgba(148, 163, 184, 0.4);
        background: rgba(2, 6, 23, 0.5);
        color: #e2e8f0;
        border-radius: 10px;
        width: 40px;
        height: 40px;
        display: grid;
        place-items: center;
        padding: 0;
        cursor: pointer;
        font-weight: 600;
      }

      .theme-icon {
        font-size: 1rem;
        line-height: 1;
      }

      .notif-btn {
        position: relative;
        border: 1px solid rgba(148, 163, 184, 0.4);
        background: rgba(2, 6, 23, 0.5);
        color: #e2e8f0;
        border-radius: 10px;
        width: 40px;
        height: 40px;
        display: grid;
        place-items: center;
        cursor: pointer;
      }

      .notif-count {
        position: absolute;
        top: -6px;
        right: -6px;
        min-width: 18px;
        height: 18px;
        border-radius: 999px;
        background: #ef4444;
        color: #fff;
        font-size: 0.7rem;
        display: grid;
        place-items: center;
        padding: 0 4px;
      }

      .notif-dropdown {
        width: min(320px, 80vw);
      }

      .notif-title {
        margin: 4px 6px 8px;
        color: #94a3b8;
        font-size: 0.8rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }

      .notif-empty {
        margin: 6px;
        color: #94a3b8;
      }

      .notif-item {
        display: grid;
        gap: 4px;
        width: 100%;
      }

      .notif-message {
        color: #e2e8f0;
        font-size: 0.9rem;
        white-space: normal;
      }

      .notif-time {
        color: #94a3b8;
        font-size: 0.75rem;
      }

      .profile-btn {
        border: 1px solid rgba(148, 163, 184, 0.3);
        background: rgba(2, 6, 23, 0.65);
        color: #e2e8f0;
        border-radius: 10px;
        padding: 6px 10px;
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
      }

      .avatar {
        width: 26px;
        height: 26px;
        border-radius: 999px;
        background: linear-gradient(135deg, #2563eb, #22d3ee);
        display: grid;
        place-items: center;
        color: white;
        font-size: 0.75rem;
        font-weight: 700;
      }

      .name {
        max-width: 120px;
        text-overflow: ellipsis;
        overflow: hidden;
        white-space: nowrap;
      }

      .dropdown {
        position: absolute;
        right: 0;
        top: calc(100% + 8px);
        width: 160px;
        min-width: max-content;
        background: rgba(2, 6, 23, 0.96);
        border: 1px solid rgba(148, 163, 184, 0.28);
        border-radius: 10px;
        padding: 6px;
        display: grid;
        gap: 4px;
        box-shadow: 0 16px 30px rgba(2, 6, 23, 0.55);
        z-index: 9999;
      }

      .dropdown button {
        border: 0;
        border-radius: 8px;
        background: transparent;
        color: #e2e8f0;
        text-align: left;
        padding: 8px 10px;
        cursor: pointer;
      }

      .dropdown button:hover {
        background: rgba(56, 189, 248, 0.16);
      }

      .top-header.light-theme {
        background: rgba(255, 255, 255, 0.92);
        border: 1px solid #d1d5db;
      }

      .top-header.light-theme .header-copy .eyebrow {
        color: #0284c7;
      }

      .top-header.light-theme h2 {
        color: #0f172a;
      }

      .top-header.light-theme p {
        color: #475569;
      }

      .top-header.light-theme .refresh-btn {
        border: 1px solid #bfdbfe;
        background: #eff6ff;
        color: #1d4ed8;
      }

      .top-header.light-theme .live-badge {
        background: #dcfce7;
        color: #166534;
        border: 1px solid #bbf7d0;
      }

      .top-header.light-theme .theme-toggle,
      .top-header.light-theme .notif-btn,
      .top-header.light-theme .profile-btn {
        border: 1px solid #d1d5db;
        background: #f8fafc;
        color: #0f172a;
      }

      .top-header.light-theme .dropdown {
        background: #ffffff;
        border: 1px solid #e5e7eb;
      }

      .top-header.light-theme .dropdown button {
        color: #0f172a;
      }

      .top-header.light-theme .notif-title,
      .top-header.light-theme .notif-empty,
      .top-header.light-theme .notif-time {
        color: #64748b;
      }

      .top-header.light-theme .notif-message {
        color: #0f172a;
      }

      @media (max-width: 700px) {
        .top-header {
          flex-direction: column;
          align-items: flex-start;
        }

        .header-actions {
          width: 100%;
          justify-content: space-between;
        }
      }
    `,
  ],
})
export class HeaderComponent {
  @Input() fullName = '';
  @Input() theme: 'dark' | 'light' = 'dark';
  @Input() alerts: Array<{ id: number; message: string; createdAt: string; sentEmail: boolean }> = [];
  @Output() refresh = new EventEmitter<void>();
  @Output() toggleTheme = new EventEmitter<void>();
  @Output() openProfile = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();

  menuOpen = false;
  notificationsOpen = false;

  get initials() {
    const value = (this.fullName || 'U').trim();
    return value.slice(0, 2).toUpperCase();
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
    if (this.menuOpen) {
      this.notificationsOpen = false;
    }
  }

  toggleNotifications() {
    this.notificationsOpen = !this.notificationsOpen;
    if (this.notificationsOpen) {
      this.menuOpen = false;
    }
  }

  @HostListener('document:click', ['$event'])
  closeOnOutside(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.profile-menu')) {
      this.menuOpen = false;
    }
    if (!target.closest('.notification-menu')) {
      this.notificationsOpen = false;
    }
  }
}
