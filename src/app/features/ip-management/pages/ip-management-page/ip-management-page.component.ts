import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';

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

        <section class="panel">
          <div class="panel-header">
            <h3>Manage IP Addresses</h3>
            <div class="panel-actions">
              <input [(ngModel)]="searchTerm" placeholder="Search IP..." />
              <button (click)="loadIps()">Refresh</button>
            </div>
          </div>
          <p class="hint">Use actions to set each IP as whitelist or blacklist.</p>
          <table *ngIf="filteredIps.length; else emptyState">
            <thead>
              <tr>
                <th>IP Address</th>
                <th>Current Policy</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let row of filteredIps">
                <td>{{ row.ip }}</td>
                <td>
                  <span class="badge" [class.whitelist]="row.policy === 'whitelist'" [class.blacklist]="row.policy === 'blacklist'">
                    {{ row.policy || 'none' }}
                  </span>
                </td>
                <td class="actions">
                  <button class="allow" (click)="setPolicy(row.ip, 'whitelist')">Add to whitelist</button>
                  <button class="deny" (click)="setPolicy(row.ip, 'blacklist')">Add to blacklist</button>
                </td>
              </tr>
            </tbody>
          </table>
          <ng-template #emptyState>
            <p *ngIf="ips.length">No IP matches your search.</p>
            <p *ngIf="!ips.length">No IP addresses found yet.</p>
          </ng-template>
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
        background: #030712;
      }
      .dashboard-layout.light-theme {
        background: #f3f7ff;
      }
      .main-content {
        padding: 24px;
      }
      .panel {
        background: rgba(15, 23, 42, 0.7);
        border: 1px solid rgba(148, 163, 184, 0.24);
        border-radius: 14px;
        padding: 16px;
        color: #e2e8f0;
      }
      .dashboard-layout.light-theme .panel {
        background: #ffffff;
        color: #0f172a;
        border: 1px solid #dbe3ee;
      }
      .panel-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }
      .panel-actions {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .panel-actions input {
        border: 1px solid rgba(148, 163, 184, 0.35);
        background: rgba(2, 6, 23, 0.7);
        color: #f8fafc;
        border-radius: 10px;
        padding: 8px 10px;
        min-width: 180px;
      }
      .dashboard-layout.light-theme .panel-actions input {
        border: 1px solid #d1d5db;
        background: #ffffff;
        color: #0f172a;
      }
      .hint {
        color: #94a3b8;
      }
      table {
        width: 100%;
        border-collapse: collapse;
      }
      th,
      td {
        border-bottom: 1px solid rgba(148, 163, 184, 0.2);
        padding: 10px 8px;
        text-align: left;
      }
      .badge {
        padding: 4px 8px;
        border-radius: 999px;
        font-size: 0.82rem;
        border: 1px solid rgba(148, 163, 184, 0.35);
      }
      .badge.whitelist {
        background: rgba(16, 185, 129, 0.2);
      }
      .badge.blacklist {
        background: rgba(239, 68, 68, 0.2);
      }
      .actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      button {
        border-radius: 10px;
        padding: 7px 11px;
        border: 1px solid rgba(148, 163, 184, 0.4);
        background: transparent;
        color: inherit;
        cursor: pointer;
      }
      .allow {
        border-color: rgba(16, 185, 129, 0.5);
      }
      .deny {
        border-color: rgba(239, 68, 68, 0.5);
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
      .modal-actions .secondary {
        border: 1px solid rgba(148, 163, 184, 0.5);
      }
      .modal-actions .primary {
        border: 1px solid rgba(56, 189, 248, 0.5);
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
export class IpManagementPageComponent implements OnInit {
  ips: Array<{ ip: string; policy: 'whitelist' | 'blacklist' | null }> = [];
  searchTerm = '';
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
    private readonly route: ActivatedRoute,
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
    this.ips = (this.route.snapshot.data['ipList'] as Array<{ ip: string; policy: 'whitelist' | 'blacklist' | null }>) ?? [];
  }

  refreshPage() {
    this.loadAlerts();
    this.loadIps();
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
    if (!nextName || !nextEmail) {
      this.toast.warning('Full name and email are required');
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

  loadIps() {
    this.api.listDistinctIps().subscribe({
      next: (rows: Array<{ ip: string; policy: 'whitelist' | 'blacklist' | null }>) => {
        this.ips = rows;
      },
      error: () => {
        this.ips = [];
      },
    });
  }

  get filteredIps() {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      return this.ips;
    }
    return this.ips.filter((row) => row.ip.toLowerCase().includes(term));
  }

  setPolicy(ip: string, policy: 'whitelist' | 'blacklist') {
    this.api.setIpPolicy(ip, policy).subscribe({
      next: () => {
        this.toast.success(`IP ${ip} added to ${policy}`);
        this.loadIps();
      },
      error: (e: HttpErrorResponse) => this.toast.error(e?.error?.error ?? 'Failed to update IP policy'),
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
