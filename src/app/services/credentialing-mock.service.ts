import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type VerificationStatus = 'verified' | 'warning' | 'failed' | 'pending';
export type Severity = 'info' | 'low' | 'medium' | 'high' | 'critical';
export type ConnectorStatus = 'healthy' | 'degraded' | 'down';

export interface Provider {
    id: string;
    npi: string;
    fullName: string;
    specialty: string;
    organization: string;
    state: string;
    lastVerifiedAt: string; // ISO
    status: VerificationStatus;
    riskScore: number; // 0-100
}

export interface VerificationCheck {
    name: string;
    source: string;
    status: VerificationStatus;
    details: string;
    checkedAt: string; // ISO
}

export interface LedgerEntry {
    id: string;
    txHash: string;
    action: string;
    actor: string;
    timestamp: string; // ISO
    summary: string;
}

export interface AlertItem {
    id: string;
    providerId: string;
    title: string;
    severity: Severity;
    source: string;
    createdAt: string; // ISO
    details: string;
    recommendedAction: string;
    status: 'open' | 'acknowledged' | 'resolved';
}

export interface Connector {
    id: string;
    name: string;
    description: string;
    status: ConnectorStatus;
    lastCheckAt: string; // ISO
    latencyMs: number;
    uptimePct: number;
    notes: string;
}

export interface PolicyRule {
    id: string;
    name: string;
    enabled: boolean;
    autoApprove: boolean;
    riskMax: number; // <=
    requiredSources: string[];
    ifAnyFailsRequireManualReview: boolean;
}

export interface EvidenceItem {
    id: string;
    category: 'identity' | 'license' | 'sanctions' | 'enrollment' | 'audit';
    title: string;
    source: string;
    timestamp: string; // ISO
    status: VerificationStatus;
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

    private connectors: Connector[] = [
        {
            id: 'c-nppes',
            name: 'NPPES (NPI Registry)',
            description: 'Identity, practice location, taxonomy checks',
            status: 'healthy',
            lastCheckAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
            latencyMs: 210,
            uptimePct: 99.9,
            notes: 'Stable.',
        },
        {
            id: 'c-pecos',
            name: 'PECOS (CMS Enrollment)',
            description: 'Medicare enrollment validation',
            status: 'degraded',
            lastCheckAt: new Date(Date.now() - 1000 * 60 * 6).toISOString(),
            latencyMs: 980,
            uptimePct: 98.3,
            notes: 'Latency spikes observed.',
        },
        {
            id: 'c-oig',
            name: 'OIG/LEIE',
            description: 'Sanctions and exclusions screening',
            status: 'healthy',
            lastCheckAt: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
            latencyMs: 320,
            uptimePct: 99.6,
            notes: 'OK.',
        },
        {
            id: 'c-boards',
            name: 'State Medical Boards',
            description: 'License status + disciplinary actions',
            status: 'down',
            lastCheckAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
            latencyMs: 0,
            uptimePct: 93.4,
            notes: 'One board endpoint failing. Using fallback.',
        },
    ];

    private policyRules: PolicyRule[] = [
        {
            id: 'r-1',
            name: 'Auto-approve low-risk',
            enabled: true,
            autoApprove: true,
            riskMax: 25,
            requiredSources: ['NPPES', 'State Medical Board', 'OIG/LEIE'],
            ifAnyFailsRequireManualReview: true,
        },
        {
            id: 'r-2',
            name: 'Manual review for high-risk',
            enabled: true,
            autoApprove: false,
            riskMax: 100,
            requiredSources: ['NPPES', 'State Medical Board', 'OIG/LEIE', 'PECOS'],
            ifAnyFailsRequireManualReview: true,
        },
    ];

    private alerts: AlertItem[] = [
        {
            id: 'a-1',
            providerId: 'p-1001',
            title: 'DEA renewal window approaching',
            severity: 'medium',
            source: 'DEA',
            createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
            details: 'Registration nearing expiry. Verify renewal submission.',
            recommendedAction: 'Request updated DEA certificate or renewal receipt.',
            status: 'open',
        },
        {
            id: 'a-2',
            providerId: 'p-1003',
            title: 'License mismatch detected',
            severity: 'critical',
            source: 'State Medical Board',
            createdAt: new Date(Date.now() - 1000 * 60 * 80).toISOString(),
            details: 'License not found for the supplied state. Possible data entry issue.',
            recommendedAction: 'Manual review; confirm state, license number, and issuer.',
            status: 'open',
        },
        {
            id: 'a-3',
            providerId: 'p-1004',
            title: 'Enrollment verification pending',
            severity: 'low',
            source: 'PECOS',
            createdAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
            details: 'External enrollment check awaiting response.',
            recommendedAction: 'Wait or rerun verification when connector is healthy.',
            status: 'acknowledged',
        },
    ];

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
                name: 'Enrollment Validation',
                source: 'PECOS',
                status: 'pending' as VerificationStatus,
                details: 'Awaiting confirmation from external service.',
                checkedAt: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
            },
        ];

        if (providerId === 'p-1001') {
            return base.map(c =>
                c.name === 'Enrollment Validation'
                    ? { ...c, status: 'warning', details: 'Enrollment active, but revalidation due soon.' }
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
        if (providerId === 'p-1004') {
            return base.map(c =>
                c.name === 'Enrollment Validation'
                    ? { ...c, status: 'pending', details: 'PECOS connector degraded; retry scheduled.' }
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
                summary: 'Automated verification executed across configured sources.',
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

    // Monitoring / Alerts
    listAlerts() {
        return [...this.alerts].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }

    setAlertStatus(id: string, status: AlertItem['status']) {
        this.alerts = this.alerts.map(a => (a.id === id ? { ...a, status } : a));
    }

    // Integrations
    listConnectors() {
        return [...this.connectors];
    }

    mockPingConnector(id: string) {
        this.connectors = this.connectors.map(c => {
            if (c.id !== id) return c;
            const jitter = Math.floor(Math.random() * 400);
            const degraded = Math.random() < 0.3;
            const down = Math.random() < 0.08;

            const status: ConnectorStatus = down ? 'down' : degraded ? 'degraded' : 'healthy';
            const latencyMs = status === 'down' ? 0 : Math.max(120, c.latencyMs - 120 + jitter);
            const notes =
                status === 'down'
                    ? 'Ping failed. Using cached responses.'
                    : status === 'degraded'
                        ? 'High latency detected.'
                        : 'OK.';

            return {
                ...c,
                status,
                latencyMs,
                lastCheckAt: new Date().toISOString(),
                notes,
            };
        });
    }

    // Policy Engine
    listPolicyRules() {
        return [...this.policyRules];
    }

    updatePolicyRule(patch: Partial<PolicyRule> & { id: string }) {
        this.policyRules = this.policyRules.map(r => (r.id === patch.id ? { ...r, ...patch } : r));
    }

    // Evidence bundle
    getEvidenceForProvider(providerId: string): EvidenceItem[] {
        const now = Date.now();
        const checks = this.getVerificationChecks(providerId);

        const mapToEvidence = checks.map((c, i) => ({
            id: `${providerId}-e-${i + 1}`,
            category:
                c.source === 'NPPES' ? 'identity' :
                    c.source === 'State Medical Board' ? 'license' :
                        c.source === 'OIG/LEIE' ? 'sanctions' :
                            c.source === 'PECOS' ? 'enrollment' : 'audit',
            title: `${c.name} Result`,
            source: c.source,
            timestamp: c.checkedAt,
            status: c.status,
            summary: c.details,
        } satisfies EvidenceItem));

        const ledger = this.getLedger(providerId).map((l, i) => ({
            id: `${providerId}-audit-${i + 1}`,
            category: 'audit' as const,
            title: `Ledger Anchor: ${l.action}`,
            source: 'Blockchain Ledger',
            timestamp: l.timestamp,
            status: 'verified' as const,
            summary: `${l.summary} (${l.txHash})`,
        }));

        // Add a “bundle generated” item
        const bundle: EvidenceItem = {
            id: `${providerId}-bundle`,
            category: 'audit',
            title: 'Evidence Bundle Compilation',
            source: 'Credentialing Nexus',
            timestamp: new Date(now - 1000 * 60 * 2).toISOString(),
            status: 'verified',
            summary: 'Bundle compiled with source checks + ledger anchors for audit.',
        };

        return [...mapToEvidence, ...ledger, bundle].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    }

    // Existing actions
    mockApprove(providerId: string) {
        this.providers = this.providers.map(p =>
            p.id === providerId ? { ...p, status: 'verified', riskScore: Math.min(p.riskScore, 25) } : p
        );
        const current = this.selectedProviderSubject.value;
        if (current?.id === providerId) {
            this.selectedProviderSubject.next(this.providers.find(p => p.id === providerId) ?? current);
        }
    }

    mockRequestMoreInfo(providerId: string) {
        this.providers = this.providers.map(p =>
            p.id === providerId ? { ...p, status: 'pending', riskScore: Math.max(p.riskScore, 40) } : p
        );
        const current = this.selectedProviderSubject.value;
        if (current?.id === providerId) {
            this.selectedProviderSubject.next(this.providers.find(p => p.id === providerId) ?? current);
        }
    }
}
