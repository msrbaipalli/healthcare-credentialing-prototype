import { Component, computed, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import {
    CredentialingMockService,
    Provider,
    EvidenceItem,
    VerificationStatus
} from '../../services/credentialing-mock.service';

type EvidenceCategoryFilter = 'all' | EvidenceItem['category'];

@Component({
    standalone: true,
    selector: 'app-evidence-export-page',
    imports: [
        CommonModule,
        DatePipe,
        ReactiveFormsModule,
        MatCardModule,
        MatIconModule,
        MatButtonModule,
        MatSelectModule,
        MatDividerModule,
        MatChipsModule,
        MatSlideToggleModule,
    ],
    templateUrl: './evidence-export-page.component.html',
    styleUrl: './evidence-export-page.component.scss',
})
export class EvidenceExportPageComponent {
    constructor(public mock: CredentialingMockService) { }

    providersSig = signal<Provider[]>(this.mock.listProviders());
    selectedId = new FormControl(this.providersSig()[0]?.id ?? '', { nonNullable: true });

    activeCategory = signal<EvidenceCategoryFilter>('all');
    issuesOnly = signal(false);

    categoryChips: Array<{ key: EvidenceCategoryFilter; label: string }> = [
        { key: 'all', label: 'All' },
        { key: 'identity', label: 'Identity' },
        { key: 'license', label: 'License' },
        { key: 'sanctions', label: 'Sanctions' },
        { key: 'enrollment', label: 'Enrollment' },
        { key: 'audit', label: 'Audit' },
    ];

    evidenceAll = computed<EvidenceItem[]>(() => {
        const id = this.selectedId.value;
        return id ? this.mock.getEvidenceForProvider(id) : [];
    });

    evidence = computed<EvidenceItem[]>(() => {
        let list = this.evidenceAll();
        const category = this.activeCategory();
        const issuesOnly = this.issuesOnly();

        if (category !== 'all') {
            list = list.filter(e => e.category === category);
        }

        if (issuesOnly) {
            list = list.filter(e =>
                e.status === 'warning' || e.status === 'failed' || e.status === 'pending'
            );
        }

        return list;
    });

    setCategory(filter: EvidenceCategoryFilter) {
        this.activeCategory.set(filter);
    }

    toggleIssuesOnly(value: boolean) {
        this.issuesOnly.set(value);
    }

    clearFilters() {
        this.activeCategory.set('all');
        this.issuesOnly.set(false);
    }

    statusIcon(s: VerificationStatus) {
        switch (s) {
            case 'verified': return 'verified';
            case 'warning': return 'warning';
            case 'failed': return 'error';
            case 'pending': return 'schedule';
        }
    }

    chipClass(s: VerificationStatus) {
        return `chip chip--${s}`;
    }
}