import { Component, computed, signal, HostListener } from '@angular/core';
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

import { HighlightPipe } from '../../pipes/highlight.pipe';

type TimelineType = 'alert' | 'check' | 'ledger';

interface TimelineItem {
    type: TimelineType;
    title: string;
    timestamp: string;
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

    searchCtrl = new FormControl('', { nonNullable: true });

    suggestionChips = [
        { label: 'NPPES', value: 'nppes' },
        { label: 'PECOS', value: 'pecos' },
        { label: 'OIG', value: 'oig' },
        { label: 'License', value: 'license' },
        { label: 'Ledger', value: 'ledger' },
        { label: 'Evidence', value: 'evidence' },
        { label: 'Pending', value: 'pending' },
        { label: 'Failed', value: 'failed' },
    ];

    private HISTORY_KEY = 'provider.search.history';
    historySig = signal<string[]>([]);

    ngOnInit() {
        this.historySig.set(this.loadHistory());

        const q = this.qSig();
        this.searchCtrl.setValue(q, { emitEvent: false });

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

    saveQuery(forceValue?: string) {
        const raw = (forceValue ?? this.searchCtrl.value ?? '').trim();
        if (!raw) return;

        const existing = this.historySig();

        const next = [
            raw,
            ...existing.filter(x => x.toLowerCase() !== raw.toLowerCase())
        ].slice(0, 6);

        this.historySig.set(next);
        localStorage.setItem(this.HISTORY_KEY, JSON.stringify(next));
    }

    applyHistory(q: string) {
        this.searchCtrl.setValue(q);
    }

    clearHistory() {
        this.historySig.set([]);
        localStorage.removeItem(this.HISTORY_KEY);
    }

    private loadHistory(): string[] {
        try {
            const raw = localStorage.getItem(this.HISTORY_KEY);
            if (!raw) return [];
            return JSON.parse(raw);
        } catch {
            return [];
        }
    }

    query = computed(() => (this.qSig() ?? '').toLowerCase());

    private includes(text: string, q: string) {
        return text.toLowerCase().includes(q);
    }

    checks = computed<VerificationCheck[]>(() => {
        const p = this.provider();
        if (!p) return [];
        return this.mock.getVerificationChecks(p.id);
    });

    ledger = computed<LedgerEntry[]>(() => {
        const p = this.provider();
        if (!p) return [];
        return this.mock.getLedger(p.id);
    });

    evidence = computed<EvidenceItem[]>(() => {
        const p = this.provider();
        if (!p) return [];
        return this.mock.getEvidenceForProvider(p.id);
    });

    alerts = computed<AlertItem[]>(() => {
        const p = this.provider();
        if (!p) return [];
        return this.mock.listAlertsForProvider(p.id);
    });

    notes = computed<ProviderNote[]>(() => {
        const p = this.provider();
        if (!p) return [];
        return this.mock.listNotes(p.id);
    });

    timeline = computed<TimelineItem[]>(() => {

        const items: TimelineItem[] = [];

        this.alerts().forEach(a =>
            items.push({
                type: 'alert',
                title: a.title,
                timestamp: a.createdAt,
                subtitle: a.details,
                alertSeverity: a.severity,
            })
        );

        this.checks().forEach(c =>
            items.push({
                type: 'check',
                title: c.name,
                timestamp: c.checkedAt,
                subtitle: c.details,
                status: c.status,
            })
        );

        this.ledger().forEach(l =>
            items.push({
                type: 'ledger',
                title: l.action,
                timestamp: l.timestamp,
                subtitle: l.summary,
            })
        );

        return items.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    });

    timelineIcon(t: TimelineType) {
        switch (t) {
            case 'alert': return 'crisis_alert';
            case 'check': return 'task_alt';
            case 'ledger': return 'receipt_long';
        }
    }

    noteInput = new FormControl('', { nonNullable: true });

    addNote() {
        const p = this.provider();
        if (!p) return;

        const text = this.noteInput.value.trim();
        if (!text) return;

        this.mock.addNote(p.id, text);
        this.noteInput.setValue('');
    }

    toggleNote(id: string) {
        this.mock.toggleNote(id);
    }

    prevProvider() {
        const list = this.providersSig();
        const index = list.findIndex(p => p.id === this.providerId());
        if (index <= 0) return;

        this.router.navigate(['/provider', list[index - 1].id]);
    }

    nextProvider() {
        const list = this.providersSig();
        const index = list.findIndex(p => p.id === this.providerId());
        if (index >= list.length - 1) return;

        this.router.navigate(['/provider', list[index + 1].id]);
    }

    copyDeepLink() {
        const url = window.location.href;
        this.clipboard.copy(url);
        this.toastSig.set('Link copied');
        setTimeout(() => this.toastSig.set(''), 1500);
    }

    clearSearch() {
        this.searchCtrl.setValue('');
    }

    statusLabel(s: VerificationStatus) {
        switch (s) {
            case 'verified': return 'Verified';
            case 'warning': return 'Warning';
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

    @HostListener('window:keydown', ['$event'])
    handleKeyboard(event: KeyboardEvent) {

        const tag = (event.target as HTMLElement)?.tagName?.toLowerCase();

        if (tag === 'input' || tag === 'textarea') return;

        if (event.key === '/') {
            event.preventDefault();
            const input = document.querySelector<HTMLInputElement>('input[matinput]');
            input?.focus();
        }

        if (event.key === 'Escape') {
            this.clearSearch();
        }

        if (event.key === '[') {
            this.prevProvider();
        }

        if (event.key === ']') {
            this.nextProvider();
        }
    }
}