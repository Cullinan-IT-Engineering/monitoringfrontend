import { Routes } from '@angular/router';
import { adminGuard, authGuard } from './core/auth/auth.guard';
import { LoginComponent } from './features/auth/pages/login-page/login.component';
import { DashboardComponent } from './features/dashboard/pages/dashboard-page/dashboard.component';
import { RegisterComponent } from './features/auth/pages/register-page/register.component';
import { UsersPageComponent } from './features/users/pages/users-page/users-page.component';
import { IpManagementPageComponent } from './features/ip-management/pages/ip-management-page/ip-management-page.component';
import { ipListResolver } from './features/ip-management/data-access/ip-management.resolver';
import { LogsPageComponent } from './features/logs/pages/logs-page/logs-page.component';
import { logsResolver } from './features/logs/data-access/logs.resolver';
import { SettingsPageComponent } from './features/settings/pages/settings-page/settings-page.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'users', component: UsersPageComponent, canActivate: [authGuard, adminGuard] },
  { path: 'settings', component: SettingsPageComponent, canActivate: [authGuard, adminGuard] },
  {
    path: 'ip-management',
    component: IpManagementPageComponent,
    canActivate: [authGuard],
    resolve: { ipList: ipListResolver },
  },
  { path: 'logs', component: LogsPageComponent, canActivate: [authGuard], resolve: { logsData: logsResolver } },
  { path: '**', redirectTo: 'login' },
];
