import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly api = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  ingestCsv(file: File) {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<{ imported: number; blocked: number }>(`${this.api}/ingest-csv`, fd);
  }

  evaluateLiveRequest(payload: {
    timestamp?: string;
    ip: string;
    method: string;
    path: string;
    user_agent?: string;
    payload?: string;
    label?: string;
  }) {
    return this.http.post<{
      requestId: number;
      attackType: string;
      riskScore: number;
      blocked: boolean;
      alertCreated: boolean;
      emailSent: boolean;
    }>(`${this.api}/requests/evaluate`, payload);
  }

  summary() {
    return this.http.get<{
      totalRequests: number;
      blockedRequests: number;
      highRisk: number;
      blockRate: number;
    }>(`${this.api}/dashboard/summary`);
  }

  trafficOverview(window: '24h' | '7d' | '30d') {
    const params = new HttpParams().set('window', window);
    return this.http.get<{ labels: string[]; values: number[] }>(`${this.api}/dashboard/traffic-overview`, { params });
  }

  attackTypes() {
    return this.http.get<{ labels: string[]; values: number[] }>(`${this.api}/dashboard/attack-types`);
  }

  allAttackTypes() {
    return this.http.get<string[]>(`${this.api}/dashboard/all-attack-types`);
  }

  hourlyTraffic() {
    return this.http.get<{ labels: string[]; values: number[] }>(`${this.api}/dashboard/hourly-traffic`);
  }

  recentActivity() {
    return this.http.get<
      Array<{ ts: string; ip: string; method: string; path: string; blocked: boolean; riskScore: number }>
    >(`${this.api}/dashboard/recent-activity`);
  }

  logs(filters?: { startDate?: string; endDate?: string; method?: string; attackType?: string }) {
    let params = new HttpParams();
    if (filters?.startDate) {
      params = params.set('startDate', filters.startDate);
    }
    if (filters?.endDate) {
      params = params.set('endDate', filters.endDate);
    }
    if (filters?.method) {
      params = params.set('method', filters.method);
    }
    if (filters?.attackType) {
      params = params.set('attackType', filters.attackType);
    }
    return this.http.get<
      Array<{
        ts: string;
        ip: string;
        method: string;
        path: string;
        userAgent: string;
        attackType: string;
        riskScore: number;
        blocked: boolean;
      }>
    >(`${this.api}/dashboard/logs`, { params });
  }

  topBlockedIps() {
    return this.http.get<Array<{ ip: string; count: number }>>(`${this.api}/dashboard/top-blocked-ips`);
  }

  listDistinctIps() {
    return this.http.get<Array<{ ip: string; policy: 'whitelist' | 'blacklist' | null }>>(`${this.api}/ip-policies/ips`);
  }

  setIpPolicy(ip: string, policy: 'whitelist' | 'blacklist') {
    return this.http.post<{ message: string; ip: string; policy: 'whitelist' | 'blacklist' }>(`${this.api}/ip-policies`, {
      ip,
      policy,
    });
  }

  alerts() {
    return this.http.get<Array<{ id: number; message: string; createdAt: string; sentEmail: boolean }>>(
      `${this.api}/alerts`
    );
  }

  getProfile() {
    return this.http.get<{ full_name: string; email: string }>(`${this.api}/auth/profile`);
  }

  updateProfile(payload: { full_name: string; email: string; password?: string }) {
    return this.http.put<{ message: string; full_name: string; email: string }>(`${this.api}/auth/profile`, payload);
  }

  usersList() {
    return this.http.get<{
      users: Array<{ id: number; full_name: string; email: string; role: string; created_at: string; is_disabled: boolean }>;
    }>(`${this.api}/auth/users`);
  }

  usersCreate(payload: { full_name: string; email: string; password: string; role: 'Admin' | 'Responsable IT' }) {
    return this.http.post<{ message: string; id: number }>(`${this.api}/auth/users`, payload);
  }

  usersUpdate(userId: number, payload: { full_name: string; email: string; role: 'Admin' | 'Responsable IT' }) {
    return this.http.put<{ message: string }>(`${this.api}/auth/users/${userId}`, payload);
  }

  usersDelete(userId: number) {
    return this.http.delete<{ message: string }>(`${this.api}/auth/users/${userId}`);
  }

  usersSetDisabled(userId: number, is_disabled: boolean) {
    return this.http.patch<{ message: string }>(`${this.api}/auth/users/${userId}/disable`, { is_disabled });
  }
}
