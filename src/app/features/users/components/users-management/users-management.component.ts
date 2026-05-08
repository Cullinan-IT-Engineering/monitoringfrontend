import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { DashboardService } from '../../../../services/dashboard.service';
import { ToastService } from '../../../../services/toast.service';

@Component({
  selector: 'app-users-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="panel glass-panel users-panel" [class.light-theme]="theme === 'light'">
      <div class="panel-head">
        <h3>Users Management</h3>
        <div class="head-actions">
          <input
            class="search-input"
            [(ngModel)]="searchTerm"
            placeholder="Search name or email..."
            type="text"
            aria-label="Search users by name or email"
          />
          <button class="add-user-btn" (click)="openCreateModal()" title="Add new user" aria-label="Add new user">+</button>
        </div>
      </div>

      <ul class="simple-list" *ngIf="!filteredUsers.length">
        <li>No users found.</li>
      </ul>

      <div class="users-table-wrap" *ngIf="filteredUsers.length">
        <table class="users-table">
          <thead>
            <tr>
              <th>Full Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let user of filteredUsers">
              <td>{{ user.full_name }}</td>
              <td>{{ user.email }}</td>
              <td>{{ user.role }}</td>
              <td>
                <span class="status-badge" [class.disabled]="user.is_disabled">
                  {{ user.is_disabled ? 'Disabled' : 'Active' }}
                </span>
              </td>
              <td>{{ user.created_at }}</td>
              <td class="action-cell">
                <button class="small-btn icon-btn" (click)="editUser(user)" title="Edit user" aria-label="Edit user">✏</button>
                <button
                  class="small-btn warning icon-btn"
                  (click)="toggleUserDisabled(user)"
                  [attr.title]="user.is_disabled ? 'Enable user' : 'Disable user'"
                  [attr.aria-label]="user.is_disabled ? 'Enable user' : 'Disable user'"
                >
                  {{ user.is_disabled ? '✓' : '⏸' }}
                </button>
                <button class="small-btn danger icon-btn" (click)="removeUser(user)" title="Delete user" aria-label="Delete user">
                  🗑
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="modal-backdrop" *ngIf="showUserModal" (click)="closeUserModal()">
        <div class="user-modal" (click)="$event.stopPropagation()">
          <h4>{{ userForm.id ? 'Edit User' : 'Add New User' }}</h4>
          <label>
            Full Name
            <input [(ngModel)]="userForm.full_name" placeholder="Full Name" />
          </label>
          <label>
            Email
            <input [(ngModel)]="userForm.email" placeholder="Email" type="email" />
          </label>
          <label>
            Role
            <select [(ngModel)]="userForm.role">
              <option value="Admin">Admin</option>
              <option value="Responsable IT">Responsable IT</option>
            </select>
          </label>
          <label *ngIf="!userForm.id">
            Password
            <input [(ngModel)]="userForm.password" placeholder="Password (min 6 chars)" type="password" />
          </label>
          <div class="modal-actions">
            <button class="secondary" (click)="closeUserModal()">Cancel</button>
            <button class="primary" (click)="saveUser()">{{ userForm.id ? 'Update User' : 'Create User' }}</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .users-panel {
        margin-top: 14px;
      }

      .panel-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
      }

      .panel-head h3 {
        margin: 0;
        color: #f1f5f9;
      }

      .light-theme .panel-head h3 {
        color: #0f172a;
      }

      .head-actions {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .search-input {
        min-width: 220px;
        border: 1px solid rgba(148, 163, 184, 0.35);
        background: rgba(2, 6, 23, 0.5);
        color: #f8fafc;
        border-radius: 10px;
        padding: 8px 10px;
      }

      .add-user-btn {
        width: 34px;
        height: 34px;
        border-radius: 50%;
        border: 1px solid rgba(56, 189, 248, 0.5);
        background: rgba(14, 165, 233, 0.2);
        color: #e0f2fe;
        font-size: 1.2rem;
        cursor: pointer;
        display: grid;
        place-items: center;
        line-height: 1;
      }

      .user-modal label {
        display: grid;
        gap: 6px;
        font-size: 0.9rem;
        color: #cbd5e1;
      }

      .user-modal input {
        border: 1px solid rgba(148, 163, 184, 0.35);
        background: rgba(2, 6, 23, 0.5);
        color: #f8fafc;
        border-radius: 10px;
        padding: 10px 12px;
      }

      .user-modal select {
        border: 1px solid rgba(148, 163, 184, 0.35);
        background: rgba(2, 6, 23, 0.5);
        color: #f8fafc;
        border-radius: 10px;
        padding: 10px 12px;
      }

      .users-table-wrap {
        overflow-x: auto;
      }

      .users-table {
        width: 100%;
        border-collapse: collapse;
      }

      .users-table th,
      .users-table td {
        text-align: left;
        padding: 10px 8px;
        border-bottom: 1px solid rgba(148, 163, 184, 0.2);
        color: #cbd5e1;
      }

      .status-badge {
        display: inline-block;
        background: rgba(34, 197, 94, 0.16);
        color: #86efac;
        border: 1px solid rgba(134, 239, 172, 0.4);
        border-radius: 999px;
        padding: 2px 8px;
        font-size: 0.8rem;
      }

      .status-badge.disabled {
        background: rgba(245, 158, 11, 0.12);
        color: #fcd34d;
        border-color: rgba(252, 211, 77, 0.45);
      }

      .action-cell {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
      }

      .small-btn,
      .modal-actions .primary,
      .modal-actions .secondary {
        border-radius: 8px;
        padding: 7px 10px;
        border: 1px solid rgba(148, 163, 184, 0.35);
        background: rgba(15, 23, 42, 0.7);
        color: #e2e8f0;
        cursor: pointer;
      }

      .small-btn.warning {
        border-color: rgba(252, 211, 77, 0.45);
      }

      .small-btn.danger {
        border-color: rgba(248, 113, 113, 0.45);
        color: #fecaca;
      }

      .icon-btn {
        width: 34px;
        height: 34px;
        padding: 0;
        display: grid;
        place-items: center;
        font-size: 0.95rem;
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

      .user-modal {
        width: min(420px, 100%);
        background: rgba(15, 23, 42, 0.96);
        border: 1px solid rgba(148, 163, 184, 0.3);
        border-radius: 14px;
        padding: 16px;
        color: #e2e8f0;
        display: grid;
        gap: 12px;
      }

      .user-modal h4 {
        margin: 0;
      }

      .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
      }

      .light-theme .user-form input {
        border: 1px solid #d1d5db;
        background: #ffffff;
        color: #0f172a;
      }

      .light-theme .user-modal {
        background: #ffffff;
        border: 1px solid #d1d5db;
        color: #0f172a;
      }

      .light-theme .user-modal label {
        color: #334155;
      }

      .light-theme .user-modal input {
        border: 1px solid #d1d5db;
        background: #ffffff;
        color: #0f172a;
      }

      .light-theme .user-modal select {
        border: 1px solid #d1d5db;
        background: #ffffff;
        color: #0f172a;
      }

      .light-theme .search-input {
        border: 1px solid #d1d5db;
        background: #ffffff;
        color: #0f172a;
      }

      .light-theme .users-table th,
      .light-theme .users-table td {
        color: #334155;
        border-bottom: 1px solid #e5e7eb;
      }

      .light-theme .small-btn,
      .light-theme .modal-actions .primary,
      .light-theme .modal-actions .secondary,
      .light-theme .add-user-btn {
        border: 1px solid #d1d5db;
        background: #f8fafc;
        color: #0f172a;
      }

      .simple-list {
        margin: 0;
        padding-left: 18px;
        color: #cbd5e1;
        line-height: 1.45;
      }

      .light-theme .simple-list {
        color: #334155;
      }

      @media (max-width: 700px) {
        .head-actions {
          width: 100%;
        }

        .search-input {
          min-width: 0;
          width: 100%;
        }
      }
    `,
  ],
})
export class UsersManagementComponent implements OnInit {
  @Input() theme: 'dark' | 'light' = 'dark';
  showUserModal = false;
  searchTerm = '';

  managedUsers: Array<{ id: number; full_name: string; email: string; role: string; created_at: string; is_disabled: boolean }> = [];
  userForm: { id: number | null; full_name: string; email: string; role: 'Admin' | 'Responsable IT'; password: string } = {
    id: null,
    full_name: '',
    email: '',
    role: 'Responsable IT',
    password: '',
  };

  constructor(
    private readonly api: DashboardService,
    private readonly toast: ToastService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  get filteredUsers() {
    const q = this.searchTerm.trim().toLowerCase();
    if (!q) {
      return this.managedUsers;
    }
    return this.managedUsers.filter(
      (u) => u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  resetUserForm() {
    this.userForm = { id: null, full_name: '', email: '', role: 'Responsable IT', password: '' };
  }

  openCreateModal() {
    this.resetUserForm();
    this.showUserModal = true;
  }

  closeUserModal() {
    this.showUserModal = false;
  }

  editUser(user: { id: number; full_name: string; email: string; role: string }) {
    this.userForm = {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      role: user.role === 'Admin' ? 'Admin' : 'Responsable IT',
      password: '',
    };
    this.showUserModal = true;
  }

  saveUser() {
    const full_name = this.userForm.full_name.trim();
    const email = this.userForm.email.trim().toLowerCase();
    const role = this.userForm.role;
    const password = this.userForm.password.trim();
    if (!full_name || !email) {
      this.toast.warning('Full name and email are required');
      return;
    }
    if (!this.userForm.id && password.length < 6) {
      this.toast.warning('Password must be at least 6 characters');
      return;
    }

    if (this.userForm.id) {
      this.api.usersUpdate(this.userForm.id, { full_name, email, role }).subscribe({
        next: () => {
          this.toast.success('User updated');
          this.resetUserForm();
          this.closeUserModal();
          this.loadUsers();
        },
        error: (e) => this.toast.error(e?.error?.error ?? 'Failed to update user'),
      });
      return;
    }

    this.api.usersCreate({ full_name, email, role, password }).subscribe({
      next: () => {
        this.toast.success('User created');
        this.resetUserForm();
        this.closeUserModal();
        this.loadUsers();
      },
      error: (e) => this.toast.error(e?.error?.error ?? 'Failed to create user'),
    });
  }

  removeUser(user: { id: number; full_name: string }) {
    if (!window.confirm(`Delete user "${user.full_name}"?`)) {
      return;
    }
    this.api.usersDelete(user.id).subscribe({
      next: () => {
        this.toast.success('User deleted');
        this.loadUsers();
      },
      error: (e) => this.toast.error(e?.error?.error ?? 'Failed to delete user'),
    });
  }

  toggleUserDisabled(user: { id: number; is_disabled: boolean }) {
    this.api.usersSetDisabled(user.id, !user.is_disabled).subscribe({
      next: () => {
        this.toast.success(!user.is_disabled ? 'User disabled' : 'User enabled');
        this.loadUsers();
      },
      error: (e) => this.toast.error(e?.error?.error ?? 'Failed to update user status'),
    });
  }

  private loadUsers() {
    this.api.usersList().subscribe({
      next: (res) => {
        this.managedUsers = res.users;
        // Ensure table refreshes immediately when route opens.
        this.cdr.detectChanges();
      },
      error: (e) => this.toast.warning(e?.error?.error ?? 'Failed to load users'),
    });
  }
}
