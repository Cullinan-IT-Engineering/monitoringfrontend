import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { Subject, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DashboardService } from '../../../../services/dashboard.service';
import { AuthService } from '../../../../services/auth.service';
import { Router } from '@angular/router';
import { ToastService } from '../../../../services/toast.service';
import { SidebarComponent } from '../../../../shared/layout/sidebar/sidebar.component';
import { HeaderComponent } from '../../../../shared/layout/header/header.component';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective, SidebarComponent, HeaderComponent],
  template: `
    <div class="dashboard-layout" [class.light-theme]="theme === 'light'">
      <app-sidebar [theme]="theme" />

      <main class="main-content">
        <app-header
          [fullName]="profileName"
          [theme]="theme"
          [alerts]="alerts"
          (refresh)="refresh(currentWindow)"
          (toggleTheme)="toggleTheme()"
          (openProfile)="openProfileModal()"
          (logout)="logout()"
        />

        <p class="upload-message" *ngIf="uploadMessage">{{ uploadMessage }}</p>
        <p class="last-updated">Last updated: {{ lastUpdatedAt }}</p>

          <div class="metric-cards" role="list">
            <article class="metric-card metric-card--total" role="listitem">
              <div class="metric-icon-wrap" aria-hidden="true">
                <svg class="metric-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18 20V10M12 20V4M6 20v-6" />
                </svg>
              </div>
              <div class="metric-body">
                <h4 class="metric-label">Total Requests</h4>
                <p class="metric-value">{{ summary.totalRequests | number : '1.0-0' }}</p>
              </div>
            </article>
            <article class="metric-card metric-card--blocked" role="listitem">
              <div class="metric-icon-wrap" aria-hidden="true">
                <svg class="metric-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
              </div>
              <div class="metric-body">
                <h4 class="metric-label">Blocked Requests</h4>
                <p class="metric-value">{{ summary.blockedRequests | number : '1.0-0' }}</p>
              </div>
            </article>
            <article class="metric-card metric-card--risk" role="listitem">
              <div class="metric-icon-wrap" aria-hidden="true">
                <svg class="metric-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M10.29 3.86L1.82 18a1 1 0 00.9 1.5h18.56a1 1 0 00.9-1.5L13.71 3.86a1 1 0 00-1.72 0z" />
                  <path d="M12 9v4M12 17h.01" />
                </svg>
              </div>
              <div class="metric-body">
                <h4 class="metric-label">High Risk</h4>
                <p class="metric-value">{{ summary.highRisk | number : '1.0-0' }}</p>
              </div>
            </article>
            <article class="metric-card metric-card--rate" role="listitem">
              <div class="metric-icon-wrap" aria-hidden="true">
                <svg class="metric-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
              </div>
              <div class="metric-body">
                <h4 class="metric-label">Block Rate</h4>
                <p class="metric-value">{{ summary.blockRate | number : '1.0-1' }}<span class="metric-suffix">%</span></p>
              </div>
            </article>
          </div>

          <div class="window-buttons">
            <button [class.active]="currentWindow === '24h'" (click)="setWindow('24h')">24h</button>
            <button [class.active]="currentWindow === '7d'" (click)="setWindow('7d')">7d</button>
            <button [class.active]="currentWindow === '30d'" (click)="setWindow('30d')">30d</button>
          </div>

          <div class="charts">
          <div class="panel glass-panel">
            <h3>Traffic Overview</h3>
            <p *ngIf="!trafficChart.labels?.length">No traffic data yet. Waiting for live requests.</p>
            <canvas baseChart [type]="'line'" [data]="trafficChart"></canvas>
          </div>
          <div class="panel glass-panel">
            <h3>Attack Types</h3>
            <p *ngIf="!attackChart.labels?.length">No blocked attack data yet.</p>
            <canvas baseChart [type]="'pie'" [data]="attackChart"></canvas>
          </div>
          </div>

          <div class="charts">
          <div class="panel glass-panel">
            <h3>Hourly Traffic (Last 24 Hours)</h3>
            <canvas baseChart [type]="'bar'" [data]="hourlyChart"></canvas>
          </div>
          <div class="panel glass-panel">
            <h3>Top Blocked IP Addresses</h3>
            <ul class="simple-list">
              <li *ngFor="let ip of topIps">{{ ip.ip }} - {{ ip.count }}</li>
            </ul>
          </div>
          </div>

          <div class="panels">
          <div class="panel glass-panel">
            <h3>Recent Activity (Last 5 Minutes)</h3>
            <ul class="simple-list">
              <li *ngFor="let a of recent">
                {{ a.ts }} | {{ a.ip }} | {{ a.method }} {{ a.path }} | blocked={{ a.blocked }} | risk={{ a.riskScore }}
              </li>
            </ul>
          </div>
          <div class="panel glass-panel">
            <h3>Alerts</h3>
            <ul class="simple-list">
              <li *ngFor="let al of alerts">
                {{ al.createdAt }} - {{ al.message }} - email={{ al.sentEmail }}
              </li>
            </ul>
          </div>
          </div>

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

      .upload-message {
        margin: 10px 0;
        color: #6ee7b7;
      }

      .dashboard-layout.light-theme .upload-message {
        color: #166534;
      }

      .last-updated {
        margin: 2px 0 12px;
        color: #94a3b8;
        font-size: 0.85rem;
      }

      .dashboard-layout.light-theme .last-updated {
        color: #64748b;
      }

      .metric-cards {
        margin-top: 16px;
        display: grid;
        grid-template-columns: repeat(4, minmax(160px, 1fr));
        gap: 14px;
      }

      .metric-card {
        position: relative;
        display: flex;
        align-items: flex-start;
        gap: 14px;
        padding: 16px 18px;
        border-radius: 16px;
        border: 1px solid rgba(148, 163, 184, 0.22);
        background: linear-gradient(145deg, rgba(15, 23, 42, 0.92) 0%, rgba(15, 23, 42, 0.72) 100%);
        box-shadow:
          0 1px 0 rgba(255, 255, 255, 0.06) inset,
          0 16px 40px rgba(2, 6, 23, 0.45);
        backdrop-filter: blur(10px);
        overflow: hidden;
        transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
      }

      .metric-card::before {
        content: '';
        position: absolute;
        inset: 0 0 auto 0;
        height: 3px;
        border-radius: 16px 16px 0 0;
        opacity: 0.95;
      }

      .metric-card--total::before {
        background: linear-gradient(90deg, #38bdf8, #6366f1);
      }
      .metric-card--blocked::before {
        background: linear-gradient(90deg, #34d399, #14b8a6);
      }
      .metric-card--risk::before {
        background: linear-gradient(90deg, #fbbf24, #f97316);
      }
      .metric-card--rate::before {
        background: linear-gradient(90deg, #a78bfa, #ec4899);
      }

      .metric-card:hover {
        transform: translateY(-2px);
        border-color: rgba(125, 211, 252, 0.35);
        box-shadow:
          0 1px 0 rgba(255, 255, 255, 0.08) inset,
          0 20px 48px rgba(2, 6, 23, 0.55);
      }

      .dashboard-layout.light-theme .metric-card {
        background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
        border: 1px solid #e2e8f0;
        box-shadow: 0 10px 28px rgba(15, 23, 42, 0.08);
      }

      .dashboard-layout.light-theme .metric-card:hover {
        border-color: rgba(59, 130, 246, 0.35);
        box-shadow: 0 16px 36px rgba(30, 41, 59, 0.12);
      }

      .metric-icon-wrap {
        flex-shrink: 0;
        width: 48px;
        height: 48px;
        border-radius: 14px;
        display: grid;
        place-items: center;
        color: #f8fafc;
      }

      .metric-card--total .metric-icon-wrap {
        background: linear-gradient(135deg, rgba(56, 189, 248, 0.35), rgba(99, 102, 241, 0.4));
        box-shadow: 0 8px 20px rgba(56, 189, 248, 0.2);
      }
      .metric-card--blocked .metric-icon-wrap {
        background: linear-gradient(135deg, rgba(52, 211, 153, 0.35), rgba(20, 184, 166, 0.4));
        box-shadow: 0 8px 20px rgba(52, 211, 153, 0.18);
      }
      .metric-card--risk .metric-icon-wrap {
        background: linear-gradient(135deg, rgba(251, 191, 36, 0.4), rgba(249, 115, 22, 0.45));
        box-shadow: 0 8px 20px rgba(251, 191, 36, 0.2);
      }
      .metric-card--rate .metric-icon-wrap {
        background: linear-gradient(135deg, rgba(167, 139, 250, 0.4), rgba(236, 72, 153, 0.4));
        box-shadow: 0 8px 20px rgba(167, 139, 250, 0.2);
      }

      .dashboard-layout.light-theme .metric-card--total .metric-icon-wrap {
        color: #0c4a6e;
        background: linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(99, 102, 241, 0.28));
      }
      .dashboard-layout.light-theme .metric-card--blocked .metric-icon-wrap {
        color: #064e3b;
        background: linear-gradient(135deg, rgba(52, 211, 153, 0.28), rgba(20, 184, 166, 0.28));
      }
      .dashboard-layout.light-theme .metric-card--risk .metric-icon-wrap {
        color: #78350f;
        background: linear-gradient(135deg, rgba(251, 191, 36, 0.35), rgba(249, 115, 22, 0.3));
      }
      .dashboard-layout.light-theme .metric-card--rate .metric-icon-wrap {
        color: #5b21b6;
        background: linear-gradient(135deg, rgba(167, 139, 250, 0.3), rgba(236, 72, 153, 0.25));
      }

      .metric-icon {
        width: 24px;
        height: 24px;
      }

      .metric-body {
        min-width: 0;
        flex: 1;
      }

      .metric-label {
        margin: 0;
        font-size: 0.8rem;
        font-weight: 600;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: #94a3b8;
      }

      .dashboard-layout.light-theme .metric-label {
        color: #64748b;
      }

      .metric-value {
        margin: 6px 0 0;
        font-size: 1.85rem;
        font-weight: 800;
        font-variant-numeric: tabular-nums;
        letter-spacing: -0.02em;
        line-height: 1.1;
        color: #f8fafc;
      }

      .dashboard-layout.light-theme .metric-value {
        color: #0f172a;
      }

      .metric-suffix {
        margin-left: 2px;
        font-size: 1.1rem;
        font-weight: 700;
        opacity: 0.85;
      }

      .panel {
        background: rgba(15, 23, 42, 0.68);
        border: 1px solid rgba(148, 163, 184, 0.24);
        border-radius: 14px;
        padding: 14px;
        box-shadow: 0 12px 30px rgba(2, 6, 23, 0.35);
        backdrop-filter: blur(6px);
      }

      .dashboard-layout.light-theme .panel {
        background: rgba(255, 255, 255, 0.92);
        border: 1px solid #dbe3ee;
        box-shadow: 0 10px 24px rgba(30, 41, 59, 0.08);
      }

      .panel h3 {
        margin: 0 0 10px;
        color: #f1f5f9;
      }

      .dashboard-layout.light-theme .panel h3 {
        color: #0f172a;
      }

      .window-buttons {
        margin: 14px 0;
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .window-buttons button {
        border: 1px solid rgba(56, 189, 248, 0.35);
        background: rgba(15, 23, 42, 0.6);
        color: #cbd5e1;
        border-radius: 10px;
        padding: 8px 12px;
        cursor: pointer;
      }

      .dashboard-layout.light-theme .window-buttons button {
        border: 1px solid #d1d5db;
        background: #ffffff;
        color: #334155;
      }

      .window-buttons button.active {
        background: linear-gradient(135deg, rgba(37, 99, 235, 0.85), rgba(14, 165, 233, 0.85));
        color: white;
        border-color: rgba(125, 211, 252, 0.75);
      }

      .charts,
      .panels {
        margin-top: 12px;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }

      .simple-list {
        margin: 0;
        padding-left: 18px;
        color: #cbd5e1;
        line-height: 1.45;
      }

      .dashboard-layout.light-theme .simple-list {
        color: #334155;
      }

      .simple-list li {
        margin-bottom: 6px;
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

        .metric-cards {
          grid-template-columns: repeat(2, minmax(120px, 1fr));
        }

        .charts,
        .panels {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 700px) {
        .metric-cards {
          grid-template-columns: 1fr;
        }

        .metric-value {
          font-size: 1.65rem;
        }

      }
    `,
  ],
})
export class DashboardComponent implements OnInit, OnDestroy {
  summary = { totalRequests: 0, blockedRequests: 0, highRisk: 0, blockRate: 0 };
  currentWindow: '24h' | '7d' | '30d' = '24h';
  uploadMessage = '';
  lastUpdatedAt = 'never';
  showProfileModal = false;
  profileName = '';
  profileNameInput = '';
  profileEmailInput = '';
  profilePasswordInput = '';
  theme: 'dark' | 'light' = 'dark';
  private readonly destroy$ = new Subject<void>();
  topIps: Array<{ ip: string; count: number }> = [];
  recent: Array<{ ts: string; ip: string; method: string; path: string; blocked: boolean; riskScore: number }> = [];
  alerts: Array<{ id: number; message: string; createdAt: string; sentEmail: boolean }> = [];

  trafficChart: ChartConfiguration<'line'>['data'] = { labels: [], datasets: [{ data: [], label: 'Requests' }] };
  attackChart: ChartConfiguration<'pie'>['data'] = { labels: [], datasets: [{ data: [] }] };
  hourlyChart: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [{ data: [], label: 'Requests' }] };

  constructor(
    private readonly api: DashboardService,
    private readonly auth: AuthService,
    private readonly router: Router,
    private readonly toast: ToastService,
    private readonly cdr: ChangeDetectorRef
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
    this.refresh(this.currentWindow);
    interval(5000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.refresh(this.currentWindow));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  logout() {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }

  setWindow(window: '24h' | '7d' | '30d') {
    this.currentWindow = window;
    this.loadTraffic(window);
  }

  toggleTheme() {
    this.theme = this.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('monitor_theme', this.theme);
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
        next: (res) => {
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
        this.cdr.detectChanges();
      },
      error: () => {
        // Keep local cached values as fallback.
      },
    });
  }

  refresh(window: '24h' | '7d' | '30d') {
    this.lastUpdatedAt = new Date().toLocaleTimeString();
    this.api.summary().subscribe({
      next: (s: { totalRequests: number; blockedRequests: number; highRisk: number; blockRate: number }) => {
        this.summary = s;
        this.cdr.detectChanges();
      },
      error: (e: HttpErrorResponse) => this.handleApiError(e),
    });
    this.loadTraffic(window);
    this.api.attackTypes().subscribe({
      next: (d: { labels: string[]; values: number[] }) => {
        this.attackChart = { labels: d.labels, datasets: [{ data: d.values }] };
        this.cdr.detectChanges();
      },
      error: (e: HttpErrorResponse) => this.handleApiError(e),
    });
    this.api.hourlyTraffic().subscribe({
      next: (d: { labels: string[]; values: number[] }) => {
        this.hourlyChart = { labels: d.labels, datasets: [{ data: d.values, label: 'Requests' }] };
        this.cdr.detectChanges();
      },
      error: (e: HttpErrorResponse) => this.handleApiError(e),
    });
    this.api.recentActivity().subscribe({
      next: (d: Array<{ ts: string; ip: string; method: string; path: string; blocked: boolean; riskScore: number }>) => {
        this.recent = d;
        this.cdr.detectChanges();
      },
      error: (e: HttpErrorResponse) => this.handleApiError(e),
    });
    this.api.topBlockedIps().subscribe({
      next: (d: Array<{ ip: string; count: number }>) => {
        this.topIps = d;
        this.cdr.detectChanges();
      },
      error: (e: HttpErrorResponse) => this.handleApiError(e),
    });
    this.api.alerts().subscribe({
      next: (d: Array<{ id: number; message: string; createdAt: string; sentEmail: boolean }>) => {
        this.alerts = d;
        this.cdr.detectChanges();
      },
      error: (e: HttpErrorResponse) => this.handleApiError(e),
    });
  }

  private loadTraffic(window: '24h' | '7d' | '30d') {
    this.api.trafficOverview(window).subscribe({
      next: (d: { labels: string[]; values: number[] }) => {
        this.trafficChart = { labels: d.labels, datasets: [{ data: d.values, label: 'Requests' }] };
        this.cdr.detectChanges();
      },
      error: (e: HttpErrorResponse) => this.handleApiError(e),
    });
  }


  private handleApiError(error: unknown) {
    const e = error as HttpErrorResponse;
    if (e?.status === 401) {
      this.uploadMessage = 'Session expired. Please login again.';
      this.toast.warning('Session expired. Please login again.');
      this.auth.logout();
      this.router.navigateByUrl('/login');
      return;
    }
    this.uploadMessage = `Dashboard sync failed (${e?.status ?? 'unknown'})`;
    this.toast.warning(this.uploadMessage);
  }
}
