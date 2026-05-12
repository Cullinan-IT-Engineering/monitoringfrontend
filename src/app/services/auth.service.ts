import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

const ROLE_STORAGE_KEY = 'monitor_role';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  register(payload: { full_name: string; email: string; password: string }) {
    return this.http.post(`${this.api}/auth/register`, payload);
  }

  login(payload: { email: string; password: string }) {
    return this.http
      .post<{ token: string; full_name: string; email?: string; role?: string }>(`${this.api}/auth/login`, payload)
      .pipe(
        tap((res) => {
          localStorage.setItem('monitor_token', res.token);
          localStorage.setItem('monitor_full_name', res.full_name);
          if (res.email) {
            localStorage.setItem('monitor_email', res.email);
          }
          this.setRole(res.role ?? 'Responsable IT');
        })
      );
  }

  logout() {
    localStorage.removeItem('monitor_token');
    localStorage.removeItem('monitor_full_name');
    localStorage.removeItem('monitor_email');
    localStorage.removeItem(ROLE_STORAGE_KEY);
  }

  /** Fetches profile once when logged in but role is missing (e.g. older sessions). */
  ensureRoleLoaded(): Observable<void> {
    if (!this.isLoggedIn()) {
      return of(void 0);
    }
    if (this.getRole()) {
      return of(void 0);
    }
    return this.http.get<{ full_name: string; email: string; role?: string }>(`${this.api}/auth/profile`).pipe(
      tap((res) => {
        this.setRole(res.role ?? 'Responsable IT');
        if (res.full_name) {
          localStorage.setItem('monitor_full_name', res.full_name);
        }
        if (res.email) {
          localStorage.setItem('monitor_email', res.email);
        }
      }),
      map(() => void 0)
    );
  }

  getRole(): string | null {
    return localStorage.getItem(ROLE_STORAGE_KEY);
  }

  setRole(role: string) {
    localStorage.setItem(ROLE_STORAGE_KEY, role.trim() || 'Responsable IT');
  }

  isAdmin(): boolean {
    return this.getRole() === 'Admin';
  }

  token() {
    return localStorage.getItem('monitor_token');
  }

  isLoggedIn() {
    return !!this.token();
  }

  getFullName() {
    return localStorage.getItem('monitor_full_name') ?? '';
  }

  setFullName(fullName: string) {
    localStorage.setItem('monitor_full_name', fullName);
  }

  setEmail(email: string) {
    localStorage.setItem('monitor_email', email);
  }
}
