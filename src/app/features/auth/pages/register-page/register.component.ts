import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';
import { ToastService } from '../../../../services/toast.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="auth-page">
      <div class="auth-card">
        <p class="auth-eyebrow">Security Monitoring</p>
        <h1>Create account</h1>
        <p class="auth-subtitle">Get access to request monitoring, blocking metrics, and attack alerts.</p>

        <form class="auth-form" (ngSubmit)="submit()">
          <label>
            Full Name
            <input name="full_name" [(ngModel)]="fullName" placeholder="Enter your full name" required />
          </label>

          <label>
            Email
            <input name="email" [(ngModel)]="email" placeholder="you@example.com" type="email" required />
          </label>

          <label>
            Password
            <input
              name="password"
              [(ngModel)]="password"
              placeholder="Minimum 6 characters"
              type="password"
              required
            />
          </label>

          <button type="submit">Create account</button>
        </form>

        <p class="auth-footer">
          Already have an account?
          <a routerLink="/login">Back to login</a>
        </p>
      </div>
    </section>
  `,
  styles: [
    `
      .auth-page {
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 24px;
      }

      .auth-card {
        width: min(460px, 100%);
        background: rgba(255, 255, 255, 0.92);
        border: 1px solid rgba(255, 255, 255, 0.7);
        border-radius: 20px;
        padding: 28px;
        box-shadow: 0 24px 48px rgba(15, 23, 42, 0.14);
        backdrop-filter: blur(8px);
      }

      .auth-eyebrow {
        margin: 0;
        color: #2563eb;
        font-weight: 700;
        font-size: 0.82rem;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }

      h1 {
        margin: 8px 0 6px;
        color: #0f172a;
        font-size: 1.7rem;
      }

      .auth-subtitle {
        margin: 0 0 18px;
        color: #475569;
        line-height: 1.45;
      }

      .auth-form {
        display: grid;
        gap: 14px;
      }

      label {
        display: grid;
        gap: 6px;
        font-size: 0.9rem;
        color: #334155;
        font-weight: 600;
      }

      input {
        border: 1px solid #dbe3ee;
        border-radius: 12px;
        padding: 12px 13px;
        font-size: 0.96rem;
        outline: none;
        transition: border-color 0.2s, box-shadow 0.2s;
      }

      input:focus {
        border-color: #3b82f6;
        box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15);
      }

      button {
        margin-top: 6px;
        border: 0;
        border-radius: 12px;
        padding: 12px 14px;
        color: #fff;
        font-size: 0.96rem;
        font-weight: 700;
        cursor: pointer;
        background: linear-gradient(135deg, #2563eb, #0ea5e9);
        transition: transform 0.15s, box-shadow 0.2s;
      }

      button:hover {
        transform: translateY(-1px);
        box-shadow: 0 12px 20px rgba(37, 99, 235, 0.28);
      }

      .auth-footer {
        margin: 14px 0 0;
        color: #475569;
      }

      .auth-footer a {
        color: #2563eb;
        font-weight: 600;
        text-decoration: none;
      }

      .auth-footer a:hover {
        text-decoration: underline;
      }
    `,
  ],
})
export class RegisterComponent {
  fullName = '';
  email = '';
  password = '';

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router,
    private readonly toast: ToastService
  ) {}

  submit() {
    this.auth.register({ full_name: this.fullName, email: this.email, password: this.password }).subscribe({
      next: () => {
        this.toast.success('Account created. Redirecting to login...');
        setTimeout(() => this.router.navigateByUrl('/login'), 800);
      },
      error: (e: HttpErrorResponse) => this.toast.error(e?.error?.error ?? 'Registration failed'),
    });
  }
}
