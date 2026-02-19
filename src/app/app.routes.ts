import { Routes } from '@angular/router';

import { DashboardPageComponent } from './pages/dashboard-page.component';
import { MonitoringPageComponent } from './pages/monitoring-page.component';
import { IntegrationsPageComponent } from './pages/integrations-page.component';
import { PolicyEnginePageComponent } from './pages/policy-engine-page.component';
import { EvidenceExportPageComponent } from './pages/evidence-export-page.component';
import { ProviderProfilePageComponent } from './pages/provider-profile-page.component';
import { ProviderByNpiRedirectComponent } from './pages/provider-by-npi-redirect.component';

export const APP_ROUTES: Routes = [
    { path: '', pathMatch: 'full', component: DashboardPageComponent },
    { path: 'monitoring', component: MonitoringPageComponent },
    { path: 'integrations', component: IntegrationsPageComponent },
    { path: 'policy', component: PolicyEnginePageComponent },
    { path: 'evidence', component: EvidenceExportPageComponent },

    { path: 'provider/:id', component: ProviderProfilePageComponent },
    { path: 'provider/npi/:npi', component: ProviderByNpiRedirectComponent },

    { path: '**', redirectTo: '' },
];
