import { Component, computed, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTabsModule } from '@angular/material/tabs';

import { Clipboard } from '@angular/cdk/clipboard';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';

import {
    CredentialingMockService,
    Provider,
    VerificationStatus,
    VerificationCheck,
    LedgerEntry,
    EvidenceItem,
} from '../../services/credentialing-mock.service';

@Component({
    standalone: true,
    selector: 'app-provider-profile-page',
    imports: [
        CommonModule,
        DatePipe,
        RouterModule,
        MatCardModule,
        MatIconModule,
        MatButtonModule,
        MatDividerModule,
        MatProgressBarModule,
        MatTabsModule,
    ],
    templateUrl: './provider-profile.component.html',
    styleUrl: './provider-profile.component.scss',
})
export class ProviderProfilePageComponent {
    constructor(
        private route: ActivatedRoute,
        private router: Router,
        public mock: CredentialingMockService,
        private clipboard: Clipboard
    ) { }

    toastSig = signal('');

    providersSig = signal<Provider[]>(this.mock.listProviders());

    private idSig = toSignal(
        this.route.paramMap.pipe(map(pm => pm.get('id') ?? '')),
        { initialValue: this.route.snapshot.paramMap.get('id') ?? '' }
    );

    private tabSig = toSignal(
        this.route.queryParamMap.pipe(map(q => (q.get('tab') ?? 'overview').toLowerCase())),
        { initialValue: (this.route.snapshot.queryParamMap.get('tab') ?? 'overview').toLowerCase() }
    );

    providerId = computed(() => this.idSig());

    tab = computed(() => {
        const t = this.tabSig();
        const allowed = new Set(['overview', 'checks', 'ledger', 'evidence']);
        return allowed.has(t) ? t : 'overview';
    });

    tabIndex = computed(() => {
        switch (this.tab()) {
            case 'overview': return 0;
            case 'checks': return 1;
            case 'ledger': return 2;
            case 'evidence': return 3;
            default: return 0;
        }
    });

    setTabFromIndex(index: number) {
        const tab =
            index === 0 ? 'overview' :
                index === 1 ? 'checks' :
                    index === 2 ? 'ledger' :
                        'evidence';

        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { tab },
            queryParamsHandling: 'merge',
        });
    }

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

    index = computed(() => {
        const id = this.providerId();
        return this.providersSig().findIndex(p => p.id === id);
    });

    hasPrev = computed(() => this.index() > 0);
    hasNext = computed(() => {
        const i = this.index();
        return i >= 0 && i < this.providersSig().length - 1;
    });

    prevProvider() {
        const i = this.index();
        if (i <= 0) return;
        const prev = this.providersSig()[i - 1];
        this.router.navigate(['/provider', prev.id], { queryParamsHandling: 'merge' });
    }

    nextProvider() {
        const i = this.index();
        if (i < 0 || i >= this.providersSig().length - 1) return;
        const next = this.providersSig()[i + 1];
        this.router.navigate(['/provider', next.id], { queryParamsHandling: 'merge' });
    }

    copyDeepLink() {
        const url = window.location.href; // includes ?tab=
        this.clipboard.copy(url);
        this.toastSig.set('Link copied');
        setTimeout(() => this.toastSig.set(''), 1600);
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

    syncSelected() {
        const p = this.provider();
        if (!p) return;
        this.mock.selectProviderById(p.id);
    }
}
