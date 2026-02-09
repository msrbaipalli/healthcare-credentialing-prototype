import { Component, computed, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';

import { CredentialingMockService, AlertItem, Severity, Provider } from '../services/credentialing-mock.service';
import { Router } from '@angular/router';

@Component({
    standalone: true,
    selector: 'app-monitoring-page',
    imports: [
        CommonModule,
        DatePipe,
        ReactiveFormsModule,
        MatCardModule,
        MatIconModule,
        MatChipsModule,
        MatButtonModule,
        MatInputModule,
        MatDividerModule,
    ],
    templateUrl: './monitoring.component.html',
    styleUrl: './monitoring.component.scss',
})
export class MonitoringPageComponent {
    constructor(public mock: CredentialingMockService, private router: Router) { }

    query = new FormControl('', { nonNullable: true });

    alertsSig = signal<AlertItem[]>(this.mock.listAlerts());
    providersSig = signal<Provider[]>(this.mock.listProviders());

    filtered = computed(() => {
        const q = this.query.value.trim().toLowerCase();
        const list = this.alertsSig();
        if (!q) return list;
        return list.filter(a =>
            [a.title, a.source, a.severity, a.status, a.details].some(v => v.toLowerCase().includes(q))
        );
    });

    severityIcon(s: Severity) {
        switch (s) {
            case 'info': return 'info';
            case 'low': return 'report';
            case 'medium': return 'warning';
            case 'high': return 'error';
            case 'critical': return 'crisis_alert';
        }
    }

    chipClass(s: Severity) {
        return `chip chip--${s}`;
    }

    providerName(providerId: string) {
        return this.providersSig().find(p => p.id === providerId)?.fullName ?? providerId;
    }

    selectProvider(providerId: string) {
        this.mock.selectProviderById(providerId);
    }

    ack(id: string) {
        this.mock.setAlertStatus(id, 'acknowledged');
        this.alertsSig.set(this.mock.listAlerts());
    }

    resolve(id: string) {
        this.mock.setAlertStatus(id, 'resolved');
        this.alertsSig.set(this.mock.listAlerts());
    }

    openProfile(providerId: string) {
        this.router.navigate(['/provider', providerId]);
    }
}