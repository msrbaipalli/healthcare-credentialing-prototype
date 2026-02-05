import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type VerificationStatus = 'verified' | 'warning' | 'failed' | 'pending';

export interface Provider {
    id: string;
    npi: string;
    fullName: string;
    specialty: string;
    organization: string;
    state: string;
    lastVerifiedAt: string; // ISO
    status: VerificationStatus;
    riskScore: number
}

export interface VerificationCheck {
    name: string;
    source: string;
    status: VerificationStatus;
    details: string;
    checkedAt: string;
}

export interface LedgerEntry {
    id: string;
    txHash: string;
    action: string;
    actor: string;
    timestamp: string;
    summary: string;
}

@Injectable({ providedIn: 'root' })
export class CredentialingMockService {
    private providers: Provider[] = [
        {
            id: 'p-1001',
            npi: '1457398921',
            fullName: 'Dr. Aisha Patel',
            specialty: 'Internal Medicine',
            organization: 'Triangle Health Partners',
            state: 'NC',
            lastVerifiedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
            status: 'warning',
            riskScore: 62,
        },
        {
            id: 'p-1002',
            npi: '1881749203',
            fullName: 'Dr. Michael Chen',
            specialty: 'Cardiology',
            organization: 'Blue Ridge Heart Center',
            state: 'VA',
            lastVerifiedAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
            status: 'verified',
            riskScore: 18,
        },
        {
            id: 'p-1003',
            npi: '1093764450',
            fullName: 'Dr. Sofia Ramirez',
            specialty: 'Pediatrics',
            organization: 'Capital Kids Clinic',
            state: 'TX',
            lastVerifiedAt: new Date(Date.now() - 1000 * 60 * 200).toISOString(),
            status: 'failed',
            riskScore: 91,
        },
        {
            id: 'p-1004',
            npi: '1679530212',
            fullName: 'Dr. James Wilson',
            specialty: 'Family Medicine',
            organization: 'Raleigh Care Network',
            state: 'NC',
            lastVerifiedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
            status: 'pending',
            riskScore: 44,
        },
    ];

    private selectedProviderSubject = new BehaviorSubject<Provider | null>(this.providers[0]);
    selectedProvider$ = this.selectedProviderSubject.asObservable();

    listProviders() {
        return [...this.providers];
    }

    selectProviderById(id: string) {
        const found = this.providers.find(p => p.id === id) ?? null;
        this.selectedProviderSubject.next(found);
    }

    getVerificationChecks(providerId: string): VerificationCheck[] {
        const base = [
            {
                name: 'NPI Registry Match',
                source: 'NPPES',
                status: 'verified' as VerificationStatus,
                details: 'Name and NPI match. Practice location verified.',
                checkedAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
            },
            {
                name: 'License Status',
                source: 'State Medical Board',
                status: 'verified' as VerificationStatus,
                details: 'Active license found. No disciplinary actions detected.',
                checkedAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
            },
            {
                name: 'Sanctions Screening',
                source: 'OIG/LEIE',
                status: 'verified' as VerificationStatus,
                details: 'No matches found.',
                checkedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
            },
            {
                name: 'DEA Registration',
                source: 'DEA',
                status: 'pending' as VerificationStatus,
                details: 'Awaiting confirmation from external service.',
                checkedAt: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
            },
        ];

        // Make it feel “real” per provider
        if (providerId === 'p-1001') {
            return base.map(c =>
                c.name === 'DEA Registration'
                    ? { ...c, status: 'warning', details: 'DEA expiring soon. Renewal window flagged.' }
                    : c
            );
        }
        if (providerId === 'p-1003') {
            return base.map(c =>
                c.name === 'License Status'
                    ? { ...c, status: 'failed', details: 'License not found for supplied state. Manual review needed.' }
                    : c
            );
        }
        return base;
    }

    getLedger(providerId: string): LedgerEntry[] {
        const now = Date.now();
        return [
            {
                id: `${providerId}-l1`,
                txHash: '0x8f3c...a91d',
                action: 'VERIFICATION_RUN',
                actor: 'ai-agent:verifier',
                timestamp: new Date(now - 1000 * 60 * 18).toISOString(),
                summary: 'Automated verification executed across 4 sources.',
            },
            {
                id: `${providerId}-l2`,
                txHash: '0x21b9...c032',
                action: 'CREDENTIAL_UPDATE',
                actor: 'ops:credentialing-team',
                timestamp: new Date(now - 1000 * 60 * 45).toISOString(),
                summary: 'Updated practice location and payer enrollment metadata.',
            },
            {
                id: `${providerId}-l3`,
                txHash: '0x9c02...11ef',
                action: 'ATTESTATION_SIGNED',
                actor: 'provider',
                timestamp: new Date(now - 1000 * 60 * 90).toISOString(),
                summary: 'Provider attestation signed and anchored to ledger.',
            },
        ];
    }

    mockApprove(providerId: string) {
        this.providers = this.providers.map(p =>
            p.id === providerId ? { ...p, status: 'verified', riskScore: Math.min(p.riskScore, 25) } : p
        );
        const current = this.selectedProviderSubject.value;
        if (current?.id === providerId) {
            const updated = this.providers.find(p => p.id === providerId) ?? current;
            this.selectedProviderSubject.next(updated);
        }
    }

    mockRequestMoreInfo(providerId: string) {
        this.providers = this.providers.map(p =>
            p.id === providerId ? { ...p, status: 'pending', riskScore: Math.max(p.riskScore, 40) } : p
        );
        const current = this.selectedProviderSubject.value;
        if (current?.id === providerId) {
            const updated = this.providers.find(p => p.id === providerId) ?? current;
            this.selectedProviderSubject.next(updated);
        }
    }
}
