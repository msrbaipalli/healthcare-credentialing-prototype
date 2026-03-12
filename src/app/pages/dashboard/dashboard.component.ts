import { Component, computed, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import {
    CredentialingMockService,
    Provider,
    VerificationStatus,
    VerificationCheck,
    LedgerEntry,
} from '../../services/credentialing-mock.service';

type DashboardFilter = 'all' | VerificationStatus;

@Component({
    standalone: true,
    selector: 'app-dashboard-page',
    imports: [
        CommonModule,
        DatePipe,
        ReactiveFormsModule,
        MatCardModule,
        MatIconModule,
        MatInputModule,
        MatButtonModule,
        MatDividerModule,
        MatTableModule,
        MatProgressBarModule,
        MatTooltipModule,
        MatChipsModule,
        MatSlideToggleModule
    ],
    templateUrl: './dashboard-page.component.html',
    styleUrl: './dashboard-page.component.scss',
})
export class DashboardPageComponent {

    constructor(
        public mock: CredentialingMockService,
        private router: Router
    ) { }

    query = new FormControl('', { nonNullable: true });

    providersSig = signal<Provider[]>(this.mock.listProviders());
    selectedSig = signal<Provider | null>(this.providersSig()[0] ?? null);

    activeFilter = signal<DashboardFilter>('all');

    // NEW
    highRiskOnly = signal(false);

    filterChips: Array<{ key: DashboardFilter; label: string }> = [
        { key: 'all', label: 'All' },
        { key: 'verified', label: 'Verified' },
        { key: 'warning', label: 'Needs Attention' },
        { key: 'failed', label: 'Failed' },
        { key: 'pending', label: 'Pending' },
    ];

    ngOnInit() {
        this.mock.selectedProvider$.subscribe(p => this.selectedSig.set(p));
    }

    filtered = computed(() => {

        const q = this.query.value.trim().toLowerCase();
        const filter = this.activeFilter();
        const highRisk = this.highRiskOnly();

        let list = this.providersSig();

        if (filter !== 'all') {
            list = list.filter(p => p.status === filter);
        }

        if (highRisk) {
            list = list.filter(p => p.riskScore >= 70);
        }

        if (!q) return list;

        return list.filter(p =>
            [p.fullName, p.npi, p.specialty, p.organization, p.state].some(v =>
                v.toLowerCase().includes(q)
            )
        );
    });

    kpis = computed(() => {

        const list = this.providersSig();

        return {
            total: list.length,
            verified: list.filter(p => p.status === 'verified').length,
            warning: list.filter(p => p.status === 'warning').length,
            failed: list.filter(p => p.status === 'failed').length,
            pending: list.filter(p => p.status === 'pending').length,
        };
    });

    checks = computed<VerificationCheck[]>(() => {
        const p = this.selectedSig();
        if (!p) return [];
        return this.mock.getVerificationChecks(p.id);
    });

    ledger = computed<LedgerEntry[]>(() => {
        const p = this.selectedSig();
        if (!p) return [];
        return this.mock.getLedger(p.id);
    });

    queueColumns = ['status', 'name', 'npi', 'specialty', 'risk', 'lastVerified'];

    setFilter(filter: DashboardFilter) {
        this.activeFilter.set(filter);
    }

    toggleHighRisk(value: boolean) {
        this.highRiskOnly.set(value);
    }

    clearFilters() {
        this.activeFilter.set('all');
        this.highRiskOnly.set(false);
        this.query.setValue('');
    }

    statusLabel(s: VerificationStatus) {
        switch (s) {
            case 'verified': return 'Verified';
            case 'warning': return 'Needs Attention';
            case 'failed': return 'Failed';
            case 'pending': return 'Pending';
        }
    }

    statusIcon(s: VerificationStatus) {
        switch (s) {
            case 'verified': return 'verified';
            case 'warning': return 'warning';
            case 'failed': return 'error';
            case 'pending': return 'schedule';
        }
    }

    statusChipClass(s: VerificationStatus) {
        return `chip chip--${s}`;
    }

    select(p: Provider) {
        this.mock.selectProviderById(p.id);
    }

    openProfile(p: Provider) {
        this.router.navigate(['/provider', p.id], { queryParams: { tab: 'overview' } });
    }

    approve() {
        const p = this.selectedSig();
        if (!p) return;

        this.mock.mockApprove(p.id);
        this.providersSig.set(this.mock.listProviders());
    }

    requestMoreInfo() {
        const p = this.selectedSig();
        if (!p) return;

        this.mock.mockRequestMoreInfo(p.id);
        this.providersSig.set(this.mock.listProviders());
    }
}