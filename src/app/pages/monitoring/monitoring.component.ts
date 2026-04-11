import { Component, computed, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import {
    CredentialingMockService,
    AlertItem,
    Severity,
    Provider
} from '../../services/credentialing-mock.service';

type SeverityFilter = 'all' | Severity;

@Component({
    standalone: true,
    selector: 'app-monitoring-page',
    imports: [
        CommonModule,
        DatePipe,
        ReactiveFormsModule,
        MatCardModule,
        MatIconModule,
        MatButtonModule,
        MatInputModule,
        MatDividerModule,
        MatChipsModule,
        MatSlideToggleModule,
    ],
    templateUrl: './monitoring-page.component.html',
    styleUrl: './monitoring-page.component.scss',
})
export class MonitoringPageComponent {
    constructor(public mock: CredentialingMockService, private router: Router) { }

    query = new FormControl('', { nonNullable: true });

    alertsSig = signal<AlertItem[]>(this.mock.listAlerts());
    providersSig = signal<Provider[]>(this.mock.listProviders());

    activeSeverity = signal<SeverityFilter>('all');
    openOnly = signal(false);

    severityChips: Array<{ key: SeverityFilter; label: string }> = [
        { key: 'all', label: 'All' },
        { key: 'low', label: 'Low' },
        { key: 'medium', label: 'Medium' },
        { key: 'high', label: 'High' },
        { key: 'critical', label: 'Critical' },
    ];

    // NEW: summary counts
    summary = computed(() => {
        const list = this.alertsSig();
        return {
            total: list.length,
            open: list.filter(a => a.status === 'open').length,
            acknowledged: list.filter(a => a.status === 'acknowledged').length,
            resolved: list.filter(a => a.status === 'resolved').length,
        };
    });

    filtered = computed(() => {
        const q = this.query.value.trim().toLowerCase();
        const severity = this.activeSeverity();
        const openOnly = this.openOnly();

        let list = this.alertsSig();

        if (severity !== 'all') {
            list = list.filter(a => a.severity === severity);
        }

        if (openOnly) {
            list = list.filter(a => a.status === 'open' || a.status === 'acknowledged');
        }

        if (!q) return list;

        return list.filter(a =>
            [a.title, a.source, a.severity, a.status, a.details, a.recommendedAction].some(v =>
                v.toLowerCase().includes(q)
            )
        );
    });

    setSeverity(filter: SeverityFilter) {
        this.activeSeverity.set(filter);
    }

    toggleOpenOnly(value: boolean) {
        this.openOnly.set(value);
    }

    clearFilters() {
        this.query.setValue('');
        this.activeSeverity.set('all');
        this.openOnly.set(false);
    }

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

    openProfile(providerId: string) {
        this.router.navigate(['/provider', providerId], { queryParams: { tab: 'timeline' } });
    }

    ack(id: string) {
        this.mock.setAlertStatus(id, 'acknowledged');
        this.alertsSig.set(this.mock.listAlerts());
    }

    resolve(id: string) {
        this.mock.setAlertStatus(id, 'resolved');
        this.alertsSig.set(this.mock.listAlerts());
    }
}