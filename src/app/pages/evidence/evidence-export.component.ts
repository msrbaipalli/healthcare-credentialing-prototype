import { Component, computed, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';

import { CredentialingMockService, Provider, EvidenceItem, VerificationStatus } from '../../services/credentialing-mock.service';

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
    ],
    templateUrl: './evidence-export.component.html',
    styleUrl: './evidence-export.component.scss',
})
export class EvidenceExportPageComponent {
    constructor(public mock: CredentialingMockService) { }

    providersSig = signal<Provider[]>(this.mock.listProviders());
    selectedId = new FormControl(this.providersSig()[0]?.id ?? '', { nonNullable: true });

    evidence = computed<EvidenceItem[]>(() => {
        const id = this.selectedId.value;
        return id ? this.mock.getEvidenceForProvider(id) : [];
    });

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
