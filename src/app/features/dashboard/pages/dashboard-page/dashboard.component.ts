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

          <div class="cards">
            <div class="card metric-card"><h4>Total Requests</h4><p>{{ summary.totalRequests }}</p></div>
            <div class="card metric-card"><h4>Blocked Requests</h4><p>{{ summary.blockedRequests }}</p></div>
            <div class="card metric-card"><h4>High Risk</h4><p>{{ summary.highRisk }}</p></div>
            <div class="card metric-card"><h4>Block Rate</h4><p>{{ summary.blockRate }}%</p></div>
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

      .cards {
        margin-top: 14px;
        display: grid;
        grid-template-columns: repeat(4, minmax(140px, 1fr));
        gap: 12px;
      }

      .card,
      .panel {
        background: rgba(15, 23, 42, 0.68);
        border: 1px solid rgba(148, 163, 184, 0.24);
        border-radius: 14px;
        padding: 14px;
        box-shadow: 0 12px 30px rgba(2, 6, 23, 0.35);
        backdrop-filter: blur(6px);
      }

      .dashboard-layout.light-theme .card,
      .dashboard-layout.light-theme .panel {
        background: rgba(255, 255, 255, 0.92);
        border: 1px solid #dbe3ee;
        box-shadow: 0 10px 24px rgba(30, 41, 59, 0.08);
      }

      .metric-card {
        position: relative;
        overflow: hidden;
      }

      .metric-card::after {
        content: '';
        position: absolute;
        inset: auto -35% -60% -35%;
        height: 80px;
        background: radial-gradient(circle, rgba(56, 189, 248, 0.22) 0%, transparent 65%);
      }

      .card h4 {
        margin: 0;
        color: #cbd5e1;
        font-size: 0.9rem;
      }

      .dashboard-layout.light-theme .card h4 {
        color: #475569;
      }

      .card p {
        margin: 8px 0 0;
        font-size: 1.7rem;
        font-weight: 700;
        color: #f8fafc;
      }

      .dashboard-layout.light-theme .card p {
        color: #0f172a;
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

        .cards {
          grid-template-columns: repeat(2, minmax(120px, 1fr));
        }

        .charts,
        .panels {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 700px) {
        .cards {
          grid-template-columns: 1fr;
        }

        .card p {
          font-size: 1.45rem;
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

  onFile(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    this.api.ingestCsv(file).subscribe({
      next: (r: { imported: number; blocked: number }) => {
        this.uploadMessage = `Imported ${r.imported}, blocked ${r.blocked}`;
        this.toast.success(`CSV imported: ${r.imported}, blocked: ${r.blocked}`);
        this.refresh('24h');
      },
      error: () => {
        this.uploadMessage = 'Upload failed';
        this.toast.error('CSV upload failed');
      },
    });
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
