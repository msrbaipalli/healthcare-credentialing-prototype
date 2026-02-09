import { Component, computed, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import {
    CredentialingMockService,
    Provider,
    VerificationStatus,
    VerificationCheck,
    LedgerEntry,
    EvidenceItem,
} from '../services/credentialing-mock.service';

@Component({
    standalone: true,
    selector: 'app-provider-profile',
    imports: [
        CommonModule,
        DatePipe,
        RouterModule,
        MatCardModule,
        MatIconModule,
        MatButtonModule,
        MatDividerModule,
        MatProgressBarModule,
    ],
    templateUrl: './provider-profile.component.html',
    styleUrl: './provider-profile.component.scss',
})
export class ProviderProfilePageComponent {
    constructor(private route: ActivatedRoute, public mock: CredentialingMockService) { }

    providersSig = signal<Provider[]>(this.mock.listProviders());

    providerId = computed(() => this.route.snapshot.paramMap.get('id') ?? '');

    provider = computed<Provider | null>(() => {
        const id = this.providerId();
        return this.providersSig().find(p => p.id === id) ?? null;
    });

    checks = computed<VerificationCheck[]>(() => {
        const p = this.provider();
        return p ? this.mock.getVerificationChecks(p.id) : [];
    });

    ledger = computed<LedgerEntry[]>(() => {
        const p = this.provider();
        return p ? this.mock.getLedger(p.id) : [];
    });

    evidence = computed<EvidenceItem[]>(() => {
        const p = this.provider();
        return p ? this.mock.getEvidenceForProvider(p.id) : [];
    });

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

    approve() {
        const p = this.provider();
        if (!p) return;
        this.mock.mockApprove(p.id);
        this.providersSig.set(this.mock.listProviders());
    }

    requestMoreInfo() {
        const p = this.provider();
        if (!p) return;
        this.mock.mockRequestMoreInfo(p.id);
        this.providersSig.set(this.mock.listProviders());
    }

    // Optional: keep global selected provider in sync for other pages
    syncSelected() {
        const p = this.provider();
        if (!p) return;
        this.mock.selectProviderById(p.id);
    }
}
