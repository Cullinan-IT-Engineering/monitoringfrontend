import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  register(payload: { full_name: string; email: string; password: string }) {
    return this.http.post(`${this.api}/auth/register`, payload);
  }

  login(payload: { email: string; password: string }) {
    return this.http
      .post<{ token: string; full_name: string; email?: string }>(`${this.api}/auth/login`, payload)
      .pipe(
        tap((res) => {
          localStorage.setItem('monitor_token', res.token);
          localStorage.setItem('monitor_full_name', res.full_name);
          if (res.email) {
            localStorage.setItem('monitor_email', res.email);
          }
        })
      );
  }

  logout() {
    localStorage.removeItem('monitor_token');
    localStorage.removeItem('monitor_full_name');
    localStorage.removeItem('monitor_email');
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
