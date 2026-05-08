import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';

import { HeaderComponent } from '../../../../shared/layout/header/header.component';
import { SidebarComponent } from '../../../../shared/layout/sidebar/sidebar.component';
import { UsersManagementComponent } from '../../components/users-management/users-management.component';
import { AuthService } from '../../../../services/auth.service';
import { DashboardService } from '../../../../services/dashboard.service';
import { ToastService } from '../../../../services/toast.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, SidebarComponent, UsersManagementComponent],
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

        <app-users-management [theme]="theme" />

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

      .profile-modal h3 {
        margin: 0;
      }

      .profile-modal label {
        display: grid;
        gap: 6px;
        font-size: 0.9rem;
        color: #cbd5e1;
      }

      .dashboard-layout.light-theme .profile-modal label {
        color: #334155;
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

      .modal-actions button {
        border-radius: 10px;
        padding: 8px 12px;
        cursor: pointer;
      }

      .modal-actions .secondary {
        border: 1px solid rgba(148, 163, 184, 0.5);
        background: transparent;
        color: #e2e8f0;
      }

      .modal-actions .primary {
        border: 1px solid rgba(56, 189, 248, 0.5);
        background: linear-gradient(135deg, rgba(37, 99, 235, 0.35), rgba(14, 165, 233, 0.3));
        color: #dbeafe;
      }

      @media (max-width: 1080px) {
        .dashboard-layout {
          grid-template-columns: 1fr;
        }

        .main-content {
          padding: 16px;
        }
      }
    `,
  ],
})
export class UsersPageComponent implements OnInit {
  showProfileModal = false;
  profileName = '';
  profileNameInput = '';
  profileEmailInput = '';
  profilePasswordInput = '';
  theme: 'dark' | 'light' = 'dark';
  alerts: Array<{ id: number; message: string; createdAt: string; sentEmail: boolean }> = [];

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

  private loadProfile() {
    this.api.getProfile().subscribe({
      next: (res: { full_name: string; email: string }) => {
        this.profileName = res.full_name;
        this.profileNameInput = res.full_name;
        this.profileEmailInput = res.email;
        this.auth.setFullName(res.full_name);
        this.auth.setEmail(res.email);
      },
      error: () => {
        // Keep local cached values as fallback.
      },
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
