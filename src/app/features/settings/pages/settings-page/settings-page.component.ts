import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';

import { HeaderComponent } from '../../../../shared/layout/header/header.component';
import { SidebarComponent } from '../../../../shared/layout/sidebar/sidebar.component';
import { AuthService } from '../../../../services/auth.service';
import { DashboardService } from '../../../../services/dashboard.service';
import { ToastService } from '../../../../services/toast.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, SidebarComponent],
  template: `
    <div class="dashboard-layout" [class.light-theme]="theme === 'light'">
      <app-sidebar [theme]="theme" />

      <main class="main-content">
        <app-header
          [fullName]="profileName"
          [theme]="theme"
          [alerts]="alerts"
          (refresh)="refreshPage()"
          (toggleTheme)="toggleTheme()"
          (openProfile)="openProfileModal()"
          (logout)="logout()"
        />

        <section class="panel glass-panel" [class.light-theme]="theme === 'light'">
          <h2>Alert email recipients</h2>
          <p class="hint">
            Up to three addresses receive email when the system raises an attack alert. SMTP must be enabled in
            <code>config.json</code> on the server.
          </p>

          <div class="form-grid">
            <label>
              Email 1
              <input [(ngModel)]="emailSlots[0]" type="email" autocomplete="email" placeholder="soc@example.com" />
            </label>
            <label>
              Email 2
              <input [(ngModel)]="emailSlots[1]" type="email" autocomplete="off" placeholder="security@example.com" />
            </label>
            <label>
              Email 3
              <input [(ngModel)]="emailSlots[2]" type="email" autocomplete="off" placeholder="oncall@example.com" />
            </label>
          </div>

          <div class="actions">
            <button class="secondary" type="button" (click)="loadEmails()" [disabled]="saving">Reload</button>
            <button class="primary" type="button" (click)="saveEmails()" [disabled]="saving">
              {{ saving ? 'Saving…' : 'Save' }}
            </button>
          </div>
        </section>

        <div class="modal-backdrop" *ngIf="showProfileModal" (click)="closeProfileModal()">
          <div class="profile-modal" (click)="$event.stopPropagation()">
            <h3>Edit Profile</h3>
            <label>
              Full Name
              <input [(ngModel)]="profileNameInput" placeholder="Enter full name" />
            </label>
            <label>
              Email
              <input [(ngModel)]="profileEmailInput" placeholder="Enter email" type="email" disabled />
            </label>
            <label>
              New password (optional)
              <input [(ngModel)]="profilePasswordInput" placeholder="At least 6 characters" type="password" />
            </label>
            <div class="modal-actions">
              <button class="secondary" (click)="closeProfileModal()">Cancel</button>
              <button class="primary" (click)="saveProfile()">Save</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [
    `
      .dashboard-layout {
        min-height: 100vh;
        display: grid;
        grid-template-columns: 260px 1fr;
        background:
          radial-gradient(circle at 15% 10%, rgba(56, 189, 248, 0.16), transparent 34%),
          radial-gradient(circle at 90% 85%, rgba(37, 99, 235, 0.12), transparent 34%),
          #030712;
      }

      .dashboard-layout.light-theme {
        background:
          radial-gradient(circle at 12% 12%, rgba(59, 130, 246, 0.14), transparent 34%),
          radial-gradient(circle at 88% 90%, rgba(34, 211, 238, 0.1), transparent 34%),
          #f3f7ff;
      }

      .main-content {
        padding: 24px;
      }

      .panel {
        margin-top: 8px;
        padding: 18px;
        border-radius: 14px;
        border: 1px solid rgba(148, 163, 184, 0.24);
        background: rgba(15, 23, 42, 0.68);
        color: #e2e8f0;
        max-width: 560px;
      }

      .panel.light-theme {
        background: rgba(255, 255, 255, 0.92);
        border: 1px solid #dbe3ee;
        color: #0f172a;
      }

      .panel h2 {
        margin: 0 0 8px;
        font-size: 1.15rem;
        color: #f1f5f9;
      }

      .panel.light-theme h2 {
        color: #0f172a;
      }

      .hint {
        margin: 0 0 16px;
        color: #94a3b8;
        font-size: 0.9rem;
        line-height: 1.45;
      }

      .panel.light-theme .hint {
        color: #64748b;
      }

      .hint code {
        font-size: 0.85rem;
        padding: 1px 6px;
        border-radius: 6px;
        background: rgba(2, 6, 23, 0.35);
      }

      .panel.light-theme .hint code {
        background: #f1f5f9;
      }

      .form-grid {
        display: grid;
        gap: 12px;
      }

      label {
        display: grid;
        gap: 6px;
        font-size: 0.9rem;
        color: #cbd5e1;
      }

      .panel.light-theme label {
        color: #334155;
      }

      input[type='email'] {
        border: 1px solid rgba(148, 163, 184, 0.35);
        background: rgba(2, 6, 23, 0.5);
        color: #f8fafc;
        border-radius: 10px;
        padding: 10px 12px;
      }

      .panel.light-theme input[type='email'] {
        border: 1px solid #d1d5db;
        background: #ffffff;
        color: #0f172a;
      }

      .actions {
        margin-top: 16px;
        display: flex;
        gap: 10px;
        justify-content: flex-end;
      }

      .actions button {
        border-radius: 10px;
        padding: 8px 14px;
        cursor: pointer;
        font-weight: 600;
      }

      .actions .secondary {
        border: 1px solid rgba(148, 163, 184, 0.45);
        background: transparent;
        color: #e2e8f0;
      }

      .panel.light-theme .actions .secondary {
        border: 1px solid #d1d5db;
        color: #0f172a;
      }

      .actions .primary {
        border: 1px solid rgba(56, 189, 248, 0.45);
        background: linear-gradient(135deg, rgba(37, 99, 235, 0.45), rgba(14, 165, 233, 0.35));
        color: #f8fafc;
      }

      .panel.light-theme .actions .primary {
        color: #ffffff;
      }

      .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(2, 6, 23, 0.7);
        display: grid;
        place-items: center;
        z-index: 1200;
        padding: 16px;
      }

      .profile-modal {
        width: min(420px, 100%);
        background: rgba(15, 23, 42, 0.94);
        border: 1px solid rgba(148, 163, 184, 0.3);
        border-radius: 14px;
        padding: 16px;
        color: #e2e8f0;
        display: grid;
        gap: 12px;
      }

      .dashboard-layout.light-theme .profile-modal {
        background: #ffffff;
        border: 1px solid #d1d5db;
        color: #0f172a;
      }

      .profile-modal label {
        display: grid;
        gap: 6px;
        font-size: 0.9rem;
      }

      .profile-modal input {
        border: 1px solid rgba(148, 163, 184, 0.35);
        background: rgba(2, 6, 23, 0.7);
        color: #f8fafc;
        border-radius: 10px;
        padding: 10px 12px;
      }

      .dashboard-layout.light-theme .profile-modal input {
        border: 1px solid #d1d5db;
        background: #ffffff;
        color: #0f172a;
      }

      .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
      }

      @media (max-width: 1080px) {
        .dashboard-layout {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class SettingsPageComponent implements OnInit {
  showProfileModal = false;
  profileName = '';
  profileNameInput = '';
  profileEmailInput = '';
  profilePasswordInput = '';
  theme: 'dark' | 'light' = 'dark';
  alerts: Array<{ id: number; message: string; createdAt: string; sentEmail: boolean }> = [];

  emailSlots: [string, string, string] = ['', '', ''];
  saving = false;

  constructor(
    private readonly auth: AuthService,
    private readonly api: DashboardService,
    private readonly toast: ToastService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    const savedTheme = localStorage.getItem('monitor_theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      this.theme = savedTheme;
    }
    this.profileName = this.auth.getFullName() || 'User';
    this.profileNameInput = this.profileName;
    this.profileEmailInput = localStorage.getItem('monitor_email') ?? '';
    this.loadProfile();
    this.loadAlerts();
    this.loadEmails();
  }

  refreshPage() {
    this.loadAlerts();
  }

  toggleTheme() {
    this.theme = this.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('monitor_theme', this.theme);
  }

  logout() {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }

  openProfileModal() {
    this.profileNameInput = this.profileName;
    this.profileEmailInput = localStorage.getItem('monitor_email') ?? '';
    this.profilePasswordInput = '';
    this.showProfileModal = true;
  }

  closeProfileModal() {
    this.showProfileModal = false;
  }

  saveProfile() {
    const nextName = (this.profileNameInput || '').trim();
    const nextEmail = (this.profileEmailInput || '').trim();
    const nextPassword = (this.profilePasswordInput || '').trim();
    if (!nextName) {
      this.toast.warning('Full name is required');
      return;
    }
    if (!nextEmail) {
      this.toast.warning('Email is required');
      return;
    }
    if (nextPassword && nextPassword.length < 6) {
      this.toast.warning('Password must be at least 6 characters');
      return;
    }

    this.api
      .updateProfile({
        full_name: nextName,
        email: nextEmail,
        password: nextPassword || undefined,
      })
      .subscribe({
        next: (res: { message: string; full_name: string; email: string }) => {
          this.profileName = res.full_name;
          this.auth.setFullName(res.full_name);
          this.auth.setEmail(res.email);
          this.profilePasswordInput = '';
          this.showProfileModal = false;
          this.toast.success('Profile updated');
        },
        error: (e: HttpErrorResponse) => this.toast.error(e?.error?.error ?? 'Profile update failed'),
      });
  }

  loadEmails() {
    this.api.getAlertEmails().subscribe({
      next: (res) => {
        const list = res.alert_emails ?? [];
        this.emailSlots = [
          String(list[0] ?? '').trim(),
          String(list[1] ?? '').trim(),
          String(list[2] ?? '').trim(),
        ] as [string, string, string];
      },
      error: (e: HttpErrorResponse) => this.toast.error(e?.error?.error ?? 'Failed to load alert emails'),
    });
  }

  saveEmails() {
    const payload = [this.emailSlots[0].trim(), this.emailSlots[1].trim(), this.emailSlots[2].trim()];
    this.saving = true;
    this.api.updateAlertEmails(payload).subscribe({
      next: (res) => {
        this.saving = false;
        const list = res.alert_emails ?? payload;
        this.emailSlots = [
          String(list[0] ?? '').trim(),
          String(list[1] ?? '').trim(),
          String(list[2] ?? '').trim(),
        ] as [string, string, string];
        this.toast.success(res.message ?? 'Saved');
      },
      error: (e: HttpErrorResponse) => {
        this.saving = false;
        this.toast.error(e?.error?.error ?? 'Failed to save');
      },
    });
  }

  private loadProfile() {
    this.api.getProfile().subscribe({
      next: (res: { full_name: string; email: string }) => {
        this.profileName = res.full_name;
        this.profileNameInput = res.full_name;
        this.profileEmailInput = res.email;
        this.auth.setFullName(res.full_name);
        this.auth.setEmail(res.email);
      },
      error: () => {},
    });
  }

  private loadAlerts() {
    this.api.alerts().subscribe({
      next: (d: Array<{ id: number; message: string; createdAt: string; sentEmail: boolean }>) => (this.alerts = d),
      error: () => {
        this.alerts = [];
      },
    });
  }
}
