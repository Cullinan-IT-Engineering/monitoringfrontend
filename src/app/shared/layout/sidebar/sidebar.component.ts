import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <aside class="sidebar" [class.light-theme]="theme === 'light'">
      <div class="brand">
        <div class="brand-logo">MW</div>
        <div>
          <p class="brand-title">Monitoring WAF</p>
          <p class="brand-subtitle">Security Center</p>
        </div>
      </div>

      <nav class="nav-links">
        <a routerLink="/dashboard" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Dashboard</a>
        <a routerLink="/users" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Users</a>
        <a routerLink="/ip-management" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">IP Management</a>
        <a routerLink="/logs" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Logs</a>
      </nav>

    </aside>
  `,
  styles: [
    `
      .sidebar {
        background: linear-gradient(180deg, rgba(2, 6, 23, 0.97) 0%, rgba(15, 23, 42, 0.96) 100%);
        color: #e2e8f0;
        padding: 22px 16px;
        display: flex;
        flex-direction: column;
        gap: 20px;
        height: 100vh;
        position: sticky;
        top: 0;
        overflow-y: auto;
        border-right: 1px solid rgba(148, 163, 184, 0.2);
        box-shadow: inset -1px 0 0 rgba(14, 165, 233, 0.18);
      }

      .brand {
        display: flex;
        gap: 12px;
        align-items: center;
      }

      .brand-logo {
        width: 42px;
        height: 42px;
        border-radius: 12px;
        display: grid;
        place-items: center;
        font-weight: 700;
        background: linear-gradient(135deg, #2563eb, #22d3ee);
        color: white;
        box-shadow: 0 0 18px rgba(34, 211, 238, 0.35);
      }

      .brand-title {
        margin: 0;
        font-weight: 700;
      }

      .brand-subtitle {
        margin: 2px 0 0;
        color: #94a3b8;
        font-size: 0.85rem;
      }

      .nav-links {
        display: grid;
        gap: 8px;
      }

      .nav-links a {
        text-decoration: none;
        color: #cbd5e1;
        border-radius: 10px;
        padding: 10px 12px;
        font-size: 0.95rem;
        border: 1px solid transparent;
      }

      .nav-links a.active,
      .nav-links a:hover {
        background: rgba(56, 189, 248, 0.14);
        border-color: rgba(125, 211, 252, 0.35);
        color: #ffffff;
      }

      .sidebar.light-theme {
        background: linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%);
        color: #0f172a;
        border-right: 1px solid #d1d5db;
        box-shadow: inset -1px 0 0 rgba(37, 99, 235, 0.1);
      }

      .sidebar.light-theme .brand-subtitle {
        color: #64748b;
      }

      .sidebar.light-theme .nav-links a {
        color: #334155;
      }

      .sidebar.light-theme .nav-links a.active,
      .sidebar.light-theme .nav-links a:hover {
        background: rgba(37, 99, 235, 0.08);
        border-color: rgba(37, 99, 235, 0.25);
        color: #0f172a;
      }

      @media (max-width: 1080px) {
        .sidebar {
          padding: 14px;
          height: auto;
          position: static;
        }
      }
    `,
  ],
})
export class SidebarComponent {
  @Input() theme: 'dark' | 'light' = 'dark';
}
