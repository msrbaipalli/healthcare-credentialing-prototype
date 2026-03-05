import { Component, computed, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';

import { Clipboard } from '@angular/cdk/clipboard';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import {
    CredentialingMockService,
    Provider,
    VerificationStatus,
    VerificationCheck,
    LedgerEntry,
    EvidenceItem,
    AlertItem,
    ProviderNote,
} from '../../services/credentialing-mock.service';

import { HighlightPipe } from '../pipes/highlight.pipe';

type TimelineType = 'alert' | 'check' | 'ledger';

interface TimelineItem {
    type: TimelineType;
    title: string;
    timestamp: string; // ISO
    subtitle: string;
    status?: VerificationStatus;
    alertSeverity?: string;
}

@Component({
    standalone: true,
    selector: 'app-provider-profile-page',
    imports: [
        CommonModule,
        DatePipe,
        RouterModule,
        ReactiveFormsModule,
        MatCardModule,
        MatIconModule,
        MatButtonModule,
        MatDividerModule,
        MatProgressBarModule,
        MatTabsModule,
        MatInputModule,
        MatChipsModule,
        HighlightPipe,
    ],
    templateUrl: './provider-profile-page.component.html',
    styleUrl: './provider-profile-page.component.scss',
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

    private qSig = toSignal(
        this.route.queryParamMap.pipe(map(q => (q.get('q') ?? '').trim())),
        { initialValue: (this.route.snapshot.queryParamMap.get('q') ?? '').trim() }
    );

    providerId = computed(() => this.idSig());

    tab = computed(() => {
        const t = this.tabSig();
        const allowed = new Set(['overview', 'checks', 'ledger', 'evidence', 'timeline', 'notes']);
        return allowed.has(t) ? t : 'overview';
    });

    tabIndex = computed(() => {
        switch (this.tab()) {
            case 'overview': return 0;
            case 'checks': return 1;
            case 'ledger': return 2;
            case 'evidence': return 3;
            case 'timeline': return 4;
            case 'notes': return 5;
            default: return 0;
        }
    });

    setTabFromIndex(index: number) {
        const tab =
            index === 0 ? 'overview' :
                index === 1 ? 'checks' :
                    index === 2 ? 'ledger' :
                        index === 3 ? 'evidence' :
                            index === 4 ? 'timeline' :
                                'notes';

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

    // Search control initialized from q=
    searchCtrl = new FormControl('', { nonNullable: true });

    suggestionChips = [
        { label: 'NPPES', value: 'nppes' },
        { label: 'PECOS', value: 'pecos' },
        { label: 'OIG/LEIE', value: 'oig' },
        { label: 'License', value: 'license' },
        { label: 'Ledger', value: 'ledger' },
        { label: 'Evidence', value: 'evidence' },
        { label: 'Pending', value: 'pending' },
        { label: 'Failed', value: 'failed' },
    ] as const;

    private readonly HISTORY_KEY = 'cnx.provider.searchHistory.v1';
    historySig = signal<string[]>([]);

    ngOnInit() {
        // Load history once
        this.historySig.set(this.loadHistory());

        // Initialize input from ?q=
        const q = this.qSig();
        this.searchCtrl.setValue(q, { emitEvent: false });

        // Keep URL q= synced while typing
        this.searchCtrl.valueChanges.subscribe(v => {
            const value = (v ?? '').trim();
            this.router.navigate([], {
                relativeTo: this.route,
                queryParams: { q: value || null },
                queryParamsHandling: 'merge',
            });
        });
    }

    applySuggestion(value: string) {
        this.searchCtrl.setValue(value);
        this.saveQuery(value);
    }

    // Save query when user hits Enter (or when we call it manually)
    saveQuery(forceValue?: string) {
        const raw = (forceValue ?? this.searchCtrl.value ?? '').trim();
        if (!raw) return;

        const normalized = raw; // keep original casing user typed
        const existing = this.historySig();

        const next = [normalized, ...existing.filter(x => x.toLowerCase() !== normalized.toLowerCase())].slice(0, 6);

        this.historySig.set(next);
        this.persistHistory(next);

        this.toastSig.set('Saved to search history');
        setTimeout(() => this.toastSig.set(''), 1200);
    }

    applyHistory(q: string) {
        this.searchCtrl.setValue(q);
    }

    clearHistory() {
        this.historySig.set([]);
        this.persistHistory([]);
        this.toastSig.set('History cleared');
        setTimeout(() => this.toastSig.set(''), 1200);
    }

    private loadHistory(): string[] {
        try {
            const raw = localStorage.getItem(this.HISTORY_KEY);
            if (!raw) return [];
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) return [];
            return parsed.filter(x => typeof x === 'string').slice(0, 6);
        } catch {
            return [];
        }
    }

    private persistHistory(list: string[]) {
        try {
            localStorage.setItem(this.HISTORY_KEY, JSON.stringify(list.slice(0, 6)));
        } catch {
            // ignore
        }
    }

    query = computed(() => (this.qSig() ?? '').toLowerCase());

    private includes(text: string, q: string) {
        return text.toLowerCase().includes(q);
    }

    // Raw data
    checksAll = computed<VerificationCheck[]>(() => {
        const p = this.provider();
        return p ? this.mock.getVerificationChecks(p.id) : [];
    });

    ledgerAll = computed<LedgerEntry[]>(() => {
        const p = this.provider();
        return p ? this.mock.getLedger(p.id) : [];
    });

    evidenceAll = computed<EvidenceItem[]>(() => {
        const p = this.provider();
        return p ? this.mock.getEvidenceForProvider(p.id) : [];
    });

    alertsAll = computed<AlertItem[]>(() => {
        const p = this.provider();
        return p ? this.mock.listAlertsForProvider(p.id) : [];
    });

    notesAll = computed<ProviderNote[]>(() => {
        const p = this.provider();
        return p ? this.mock.listNotes(p.id) : [];
    });

    // Filtered data
    checks = computed(() => {
        const q = this.query();
        const list = this.checksAll();
        if (!q) return list;
        return list.filter(c =>
            [c.name, c.source, c.status, c.details].some(v => this.includes(String(v), q))
        );
    });

    ledger = computed(() => {
        const q = this.query();
        const list = this.ledgerAll();
        if (!q) return list;
        return list.filter(l =>
            [l.action, l.actor, l.txHash, l.summary].some(v => this.includes(String(v), q))
        );
    });

    evidence = computed(() => {
        const q = this.query();
        const list = this.evidenceAll();
        if (!q) return list;
        return list.filter(e =>
            [e.title, e.category, e.source, e.status, e.summary].some(v => this.includes(String(v), q))
        );
    });

    alerts = computed(() => {
        const q = this.query();
        const list = this.alertsAll();
        if (!q) return list;
        return list.filter(a =>
            [a.title, a.severity, a.source, a.details, a.recommendedAction, a.status].some(v =>
                this.includes(String(v), q)
            )
        );
    });

    notes = computed(() => {
        const q = this.query();
        const list = this.notesAll();
        if (!q) return list;
        return list.filter(n =>
            [n.text, n.author, n.status].some(v => this.includes(String(v), q))
        );
    });

    timeline = computed<TimelineItem[]>(() => {
        const p = this.provider();
        if (!p) return [];

        const alertItems: TimelineItem[] = this.alerts().map(a => ({
            type: 'alert',
            title: a.title,
            timestamp: a.createdAt,
            subtitle: `${a.source} · ${a.details} · (${a.status})`,
            alertSeverity: a.severity,
        }));

        const checkItems: TimelineItem[] = this.checks().map(c => ({
            type: 'check',
            title: c.name,
            timestamp: c.checkedAt,
            subtitle: `${c.source} · ${c.details}`,
            status: c.status,
        }));

        const ledgerItems: TimelineItem[] = this.ledger().map(l => ({
            type: 'ledger',
            title: l.action,
            timestamp: l.timestamp,
            subtitle: `${l.actor} · ${l.txHash} · ${l.summary}`,
        }));

        return [...alertItems, ...checkItems, ...ledgerItems].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    });

    timelineIcon(t: TimelineType) {
        switch (t) {
            case 'alert': return 'crisis_alert';
            case 'check': return 'task_alt';
            case 'ledger': return 'receipt_long';
        }
    }

    // Notes actions
    noteInput = new FormControl('', { nonNullable: true });

    addNote() {
        const p = this.provider();
        const text = this.noteInput.value.trim();
        if (!p || !text) return;
        this.mock.addNote(p.id, text);
        this.noteInput.setValue('');
    }

    toggleNote(id: string) {
        this.mock.toggleNote(id);
    }

    // Navigation (prev/next)
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

    // Copy links
    copyDeepLink() {
        const url = window.location.href;
        this.clipboard.copy(url);
        this.toastSig.set('Link copied');
        setTimeout(() => this.toastSig.set(''), 1600);
    }

    copyTabLinkOnly() {
        const url = new URL(window.location.href);
        const tab = this.tab();
        url.searchParams.set('tab', tab);
        url.searchParams.delete('q');
        this.clipboard.copy(url.toString());
        this.toastSig.set('Tab link copied');
        setTimeout(() => this.toastSig.set(''), 1600);
    }

    copySearchLinkOnly() {
        const url = new URL(window.location.href);
        const tab = this.tab();
        const q = this.qSig();
        url.searchParams.set('tab', tab);
        if (q) url.searchParams.set('q', q);
        else url.searchParams.delete('q');
        this.clipboard.copy(url.toString());
        this.toastSig.set('Search link copied');
        setTimeout(() => this.toastSig.set(''), 1600);
    }

    clearSearch() {
        this.searchCtrl.setValue('');
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