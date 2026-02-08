import { Component, computed, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

import {
    CredentialingMockService,
    Provider,
    VerificationStatus,
    VerificationCheck,
    LedgerEntry,
} from '../../services/credentialing-mock.service';

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
        MatChipsModule,
        MatButtonModule,
        MatDividerModule,
        MatTableModule,
        MatProgressBarModule,
        MatTooltipModule,
    ],
    templateUrl: './dashboardcomponent.html',
    styleUrl: './dashboardcomponent.scss',
})
export class DashboardPageComponent {
    constructor(public mock: CredentialingMockService) { }

    query = new FormControl('', { nonNullable: true });
    providersSig = signal<Provider[]>(this.mock.listProviders());
    selectedSig = signal<Provider | null>(this.providersSig()[0] ?? null);

    ngOnInit() {
        this.mock.selectedProvider$.subscribe(p => this.selectedSig.set(p));
    }

    filtered = computed(() => {
        const q = this.query.value.trim().toLowerCase();
        const list = this.providersSig();
        if (!q) return list;
        return list.filter(p =>
            [p.fullName, p.npi, p.specialty, p.organization, p.state].some(v =>
                v.toLowerCase().includes(q)
            )
        );
    });

    kpis = computed(() => {
        const list = this.providersSig();
        const total = list.length;
        const verified = list.filter(p => p.status === 'verified').length;
        const warning = list.filter(p => p.status === 'warning').length;
        const failed = list.filter(p => p.status === 'failed').length;
        const pending = list.filter(p => p.status === 'pending').length;
        return { total, verified, warning, failed, pending };
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
