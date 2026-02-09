import { Routes } from '@angular/router';
import { DashboardPageComponent } from './pages/dashboard/dashboard.component';
import { MonitoringPageComponent } from './pages/monitoringcomponent';
import { IntegrationsPageComponent } from './pages/integrationscomponent';
import { PolicyEnginePageComponent } from './pages/policy-enginecomponent';
import { EvidenceExportPageComponent } from './pages/evidence-exportcomponent';

export const APP_ROUTES: Routes = [
    { path: '', pathMatch: 'full', component: DashboardPageComponent },
    { path: 'monitoring', component: MonitoringPageComponent },
    { path: 'integrations', component: IntegrationsPageComponent },
    { path: 'policy', component: PolicyEnginePageComponent },
    { path: 'evidence', component: EvidenceExportPageComponent },
    { path: 'provider/:id', component: ProviderProfilePageComponent },
    { path: '**', redirectTo: '' },
];
