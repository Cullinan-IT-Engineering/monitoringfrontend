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
import { LogsResolverData } from '../../data-access/logs.resolver';

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
          <h3>Requests Logs</h3>
          <div class="filters">
            <label class="range-filter">
              Date range
              <input
                class="range-input"
                [value]="dateRangeLabel"
                readonly
                placeholder="Select date range"
                (click)="toggleDatePicker()"
              />
              <div class="range-popover" *ngIf="showDatePicker">
                <div class="calendar-header">
                  <button type="button" (click)="prevMonth()"><</button>
                  <strong>{{ monthLabel }}</strong>
                  <button type="button" (click)="nextMonth()">></button>
                </div>
                <div class="calendar-weekdays">
                  <span *ngFor="let wd of weekDays">{{ wd }}</span>
                </div>
                <div class="calendar-grid">
                  <button
                    type="button"
                    *ngFor="let day of calendarDays"
                    [disabled]="!day"
                    [class.start]="isStart(day)"
                    [class.end]="isEnd(day)"
                    [class.in-range]="isInRange(day)"
                    (click)="selectCalendarDay(day)"
                  >
                    {{ day ? day.getDate() : '' }}
                  </button>
                </div>
                <p class="range-preview">{{ rangePreview }}</p>
                <div class="range-actions">
                  <button type="button" (click)="clearDateRange()">Clear</button>
                  <button type="button" (click)="applyDateRange()">Apply</button>
                </div>
              </div>
            </label>
            <label>
              Method
              <select [(ngModel)]="filters.method" (ngModelChange)="onFiltersChanged()">
                <option value="">All</option>
                <option *ngFor="let m of methods" [value]="m">{{ m }}</option>
              </select>
            </label>
            <label>
              Attack type
              <select [(ngModel)]="filters.attackType" (ngModelChange)="onFiltersChanged()">
                <option value="">All</option>
                <option *ngFor="let t of attackTypes" [value]="t">{{ t }}</option>
              </select>
            </label>
          </div>

          <div class="table-wrap">
            <table *ngIf="logs.length; else emptyState">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>IP</th>
                  <th>Method</th>
                  <th>Path</th>
                  <th>Attack Type</th>
                  <th>Risk</th>
                  <th>Blocked</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let row of logs">
                  <td>{{ row.ts }}</td>
                  <td>{{ row.ip }}</td>
                  <td>{{ row.method }}</td>
                  <td>{{ row.path }}</td>
                  <td>{{ row.attackType }}</td>
                  <td>{{ row.riskScore }}</td>
                  <td>{{ row.blocked }}</td>
                </tr>
              </tbody>
            </table>
            <ng-template #emptyState>
              <p>No requests found for selected filters.</p>
            </ng-template>
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
      .dashboard-layout { min-height: 100vh; display: grid; grid-template-columns: 260px 1fr; background: #030712; }
      .dashboard-layout.light-theme { background: #f3f7ff; }
      .main-content { padding: 24px; }
      .panel { background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(148, 163, 184, 0.24); border-radius: 14px; padding: 16px; color: #e2e8f0; }
      .dashboard-layout.light-theme .panel { background: #ffffff; color: #0f172a; border: 1px solid #dbe3ee; }
      .filters { display: grid; grid-template-columns: 1.4fr repeat(2, minmax(140px, 1fr)); gap: 10px; margin-bottom: 12px; }
      .filters label { display: grid; gap: 6px; font-size: 0.85rem; }
      .filters input, .filters select { border: 1px solid rgba(148, 163, 184, 0.35); background: rgba(2, 6, 23, 0.7); color: #f8fafc; border-radius: 10px; padding: 8px 10px; }
      .dashboard-layout.light-theme .filters input, .dashboard-layout.light-theme .filters select { border: 1px solid #d1d5db; background: #ffffff; color: #0f172a; }
      .range-filter { position: relative; }
      .range-input { cursor: pointer; }
      .range-popover {
        position: absolute;
        top: calc(100% + 6px);
        left: 0;
        z-index: 20;
        min-width: 340px;
        display: grid;
        gap: 8px;
        padding: 10px;
        border-radius: 10px;
        border: 1px solid rgba(148, 163, 184, 0.35);
        background: rgba(2, 6, 23, 0.98);
      }
      .calendar-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .calendar-header button {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        border: 1px solid rgba(148, 163, 184, 0.4);
        background: transparent;
        color: inherit;
        cursor: pointer;
      }
      .calendar-weekdays {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 4px;
        font-size: 0.75rem;
        color: #94a3b8;
        text-align: center;
      }
      .calendar-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 4px;
      }
      .calendar-grid button {
        border-radius: 8px;
        border: 1px solid rgba(148, 163, 184, 0.25);
        height: 32px;
        background: transparent;
        color: inherit;
        cursor: pointer;
      }
      .calendar-grid button:disabled {
        border-color: transparent;
        cursor: default;
      }
      .calendar-grid button.in-range {
        background: rgba(56, 189, 248, 0.2);
      }
      .calendar-grid button.start,
      .calendar-grid button.end {
        background: rgba(59, 130, 246, 0.8);
        color: #fff;
      }
      .range-preview {
        margin: 0;
        font-size: 0.82rem;
        color: #94a3b8;
      }
      .dashboard-layout.light-theme .range-popover {
        background: #ffffff;
        border: 1px solid #d1d5db;
      }
      .range-actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
      }
      .range-actions button {
        border-radius: 8px;
        padding: 6px 10px;
        border: 1px solid rgba(148, 163, 184, 0.4);
        background: transparent;
        color: inherit;
        cursor: pointer;
      }
      .table-wrap { overflow: auto; }
      table { width: 100%; border-collapse: collapse; min-width: 900px; }
      th, td { border-bottom: 1px solid rgba(148, 163, 184, 0.2); padding: 10px 8px; text-align: left; }
      .modal-backdrop { position: fixed; inset: 0; background: rgba(2, 6, 23, 0.7); display: grid; place-items: center; z-index: 1200; padding: 16px; }
      .profile-modal { width: min(420px, 100%); background: rgba(15, 23, 42, 0.94); border: 1px solid rgba(148, 163, 184, 0.3); border-radius: 14px; padding: 16px; color: #e2e8f0; display: grid; gap: 12px; }
      .dashboard-layout.light-theme .profile-modal { background: #ffffff; border: 1px solid #d1d5db; color: #0f172a; }
      .profile-modal label { display: grid; gap: 6px; }
      .profile-modal input { border: 1px solid rgba(148, 163, 184, 0.35); background: rgba(2, 6, 23, 0.7); color: #f8fafc; border-radius: 10px; padding: 10px 12px; }
      .dashboard-layout.light-theme .profile-modal input { border: 1px solid #d1d5db; background: #ffffff; color: #0f172a; }
      .modal-actions { display: flex; justify-content: flex-end; gap: 10px; }
      .modal-actions .secondary { border: 1px solid rgba(148, 163, 184, 0.5); }
      .modal-actions .primary { border: 1px solid rgba(56, 189, 248, 0.5); }
      @media (max-width: 1080px) { .dashboard-layout { grid-template-columns: 1fr; } .main-content { padding: 16px; } .filters { grid-template-columns: 1fr 1fr; } }
    `,
  ],
})
export class LogsPageComponent implements OnInit {
  allLogs: Array<{ ts: string; ip: string; method: string; path: string; attackType: string; riskScore: number; blocked: boolean }> = [];
  logs: Array<{ ts: string; ip: string; method: string; path: string; attackType: string; riskScore: number; blocked: boolean }> = [];
  attackTypes: string[] = [];
  methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'];
  filters = { startDate: '', endDate: '', method: '', attackType: '' };
  showDatePicker = false;
  draftStartDate = '';
  draftEndDate = '';
  viewDate = new Date();
  weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  calendarDays: Array<Date | null> = [];
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
    if (savedTheme === 'light' || savedTheme === 'dark') this.theme = savedTheme;
    this.profileName = this.auth.getFullName() || 'User';
    this.profileNameInput = this.profileName;
    this.profileEmailInput = localStorage.getItem('monitor_email') ?? '';
    const logsData = this.route.snapshot.data['logsData'] as LogsResolverData | undefined;
    this.allLogs = logsData?.logs ?? [];
    this.logs = [...this.allLogs];
    this.attackTypes = logsData?.attackTypes ?? [];
    this.loadProfile();
    this.loadAlerts();
  }

  refreshPage() { this.loadAlerts(); this.loadLogs(); }
  toggleTheme() { this.theme = this.theme === 'dark' ? 'light' : 'dark'; localStorage.setItem('monitor_theme', this.theme); }
  logout() { this.auth.logout(); this.router.navigateByUrl('/login'); }
  openProfileModal() { this.profileNameInput = this.profileName; this.profileEmailInput = localStorage.getItem('monitor_email') ?? ''; this.profilePasswordInput = ''; this.showProfileModal = true; }
  closeProfileModal() { this.showProfileModal = false; }

  saveProfile() {
    const nextName = (this.profileNameInput || '').trim();
    const nextEmail = (this.profileEmailInput || '').trim();
    const nextPassword = (this.profilePasswordInput || '').trim();
    if (!nextName || !nextEmail) return this.toast.warning('Full name and email are required');
    if (nextPassword && nextPassword.length < 6) return this.toast.warning('Password must be at least 6 characters');
    this.api.updateProfile({ full_name: nextName, email: nextEmail, password: nextPassword || undefined }).subscribe({
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

  loadLogs() {
    this.api.logs().subscribe({
      next: (rows) => {
        this.allLogs = rows;
        this.applyClientFilters();
      },
      error: () => {
        this.allLogs = [];
        this.logs = [];
      },
    });
  }

  onFiltersChanged() {
    this.applyClientFilters();
  }

  toggleDatePicker() {
    this.showDatePicker = !this.showDatePicker;
    if (this.showDatePicker) {
      this.draftStartDate = this.filters.startDate ? this.filters.startDate.slice(0, 10) : '';
      this.draftEndDate = this.filters.endDate ? this.filters.endDate.slice(0, 10) : '';
      const seed = this.draftStartDate || this.draftEndDate;
      this.viewDate = seed ? new Date(`${seed}T00:00:00`) : new Date();
      this.buildCalendar();
    }
  }

  prevMonth() {
    this.viewDate = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth() - 1, 1);
    this.buildCalendar();
  }

  nextMonth() {
    this.viewDate = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth() + 1, 1);
    this.buildCalendar();
  }

  selectCalendarDay(day: Date | null) {
    if (!day) {
      return;
    }
    const value = this.toDateString(day);
    if (!this.draftStartDate || (this.draftStartDate && this.draftEndDate)) {
      this.draftStartDate = value;
      this.draftEndDate = '';
      return;
    }
    if (value < this.draftStartDate) {
      this.draftEndDate = this.draftStartDate;
      this.draftStartDate = value;
      return;
    }
    this.draftEndDate = value;
  }

  applyDateRange() {
    this.filters.startDate = this.draftStartDate ? `${this.draftStartDate}T00:00` : '';
    this.filters.endDate = this.draftEndDate ? `${this.draftEndDate}T23:59` : '';
    this.showDatePicker = false;
    this.onFiltersChanged();
  }

  clearDateRange() {
    this.draftStartDate = '';
    this.draftEndDate = '';
    this.applyDateRange();
  }

  get dateRangeLabel() {
    if (!this.filters.startDate && !this.filters.endDate) {
      return '';
    }
    const start = this.filters.startDate ? this.filters.startDate.slice(0, 10) : '';
    const end = this.filters.endDate ? this.filters.endDate.slice(0, 10) : '';
    if (start && end) {
      return `${start} -> ${end}`;
    }
    return start || end;
  }

  get monthLabel() {
    return this.viewDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  }

  get rangePreview() {
    if (!this.draftStartDate && !this.draftEndDate) {
      return 'Select start and end dates';
    }
    if (this.draftStartDate && this.draftEndDate) {
      return `${this.draftStartDate} -> ${this.draftEndDate}`;
    }
    return this.draftStartDate;
  }

  isStart(day: Date | null) {
    return !!day && this.toDateString(day) === this.draftStartDate;
  }

  isEnd(day: Date | null) {
    return !!day && this.toDateString(day) === this.draftEndDate;
  }

  isInRange(day: Date | null) {
    if (!day || !this.draftStartDate || !this.draftEndDate) {
      return false;
    }
    const v = this.toDateString(day);
    return v > this.draftStartDate && v < this.draftEndDate;
  }

  private buildCalendar() {
    const year = this.viewDate.getFullYear();
    const month = this.viewDate.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const pad = first.getDay();
    const days: Array<Date | null> = [];
    for (let i = 0; i < pad; i++) {
      days.push(null);
    }
    for (let d = 1; d <= last.getDate(); d++) {
      days.push(new Date(year, month, d));
    }
    this.calendarDays = days;
  }

  private toDateString(date: Date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private applyClientFilters() {
    const start = this.filters.startDate ? new Date(this.filters.startDate).getTime() : null;
    const end = this.filters.endDate ? new Date(this.filters.endDate).getTime() : null;
    const method = (this.filters.method || '').trim().toUpperCase();
    const attackType = (this.filters.attackType || '').trim().toLowerCase();

    this.logs = this.allLogs.filter((row) => {
      const ts = new Date(row.ts).getTime();
      if (start !== null && ts < start) {
        return false;
      }
      if (end !== null && ts > end) {
        return false;
      }
      if (method && (row.method || '').toUpperCase() !== method) {
        return false;
      }
      if (attackType && (row.attackType || '').toLowerCase() !== attackType) {
        return false;
      }
      return true;
    });
  }

  private loadAttackTypes() {
    this.api.allAttackTypes().subscribe({
      next: (rows: string[]) => (this.attackTypes = rows),
      error: () => (this.attackTypes = []),
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
      error: () => { this.alerts = []; },
    });
  }
}
