import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatInputModule } from '@angular/material/input';

import { CredentialingMockService, PolicyRule } from '../../services/credentialing-mock.service';

@Component({
    standalone: true,
    selector: 'app-policy-engine-page',
    imports: [
        CommonModule,
        MatCardModule,
        MatIconModule,
        MatButtonModule,
        MatSlideToggleModule,
        MatInputModule,
    ],
    templateUrl: './policy-engine-page.component.html',
    styleUrl: './policy-engine-page.component.scss',
})
export class PolicyEnginePageComponent {
    constructor(public mock: CredentialingMockService) { }

    rulesSig = signal<PolicyRule[]>(this.mock.listPolicyRules());

    private readonly defaultRules: PolicyRule[] = this.mock.listPolicyRules().map(r => ({ ...r }));

    summary = computed(() => {
        const rules = this.rulesSig();
        return {
            total: rules.length,
            enabled: rules.filter(r => r.enabled).length,
            autoApprove: rules.filter(r => r.autoApprove).length,
        };
    });

    toggleEnabled(r: PolicyRule) {
        this.mock.updatePolicyRule({ id: r.id, enabled: !r.enabled });
        this.rulesSig.set(this.mock.listPolicyRules());
    }

    toggleAutoApprove(r: PolicyRule) {
        this.mock.updatePolicyRule({ id: r.id, autoApprove: !r.autoApprove });
        this.rulesSig.set(this.mock.listPolicyRules());
    }

    updateRiskMax(r: PolicyRule, value: string) {
        const n = Number(value);
        if (!Number.isFinite(n)) return;

        const riskMax = Math.max(0, Math.min(100, Math.floor(n)));
        this.mock.updatePolicyRule({ id: r.id, riskMax });
        this.rulesSig.set(this.mock.listPolicyRules());
    }

    toggleFailBehavior(r: PolicyRule) {
        this.mock.updatePolicyRule({
            id: r.id,
            ifAnyFailsRequireManualReview: !r.ifAnyFailsRequireManualReview
        });
        this.rulesSig.set(this.mock.listPolicyRules());
    }

    resetDefaults() {
        for (const rule of this.defaultRules) {
            this.mock.updatePolicyRule({
                id: rule.id,
                enabled: rule.enabled,
                autoApprove: rule.autoApprove,
                riskMax: rule.riskMax,
                ifAnyFailsRequireManualReview: rule.ifAnyFailsRequireManualReview,
            });
        }
        this.rulesSig.set(this.mock.listPolicyRules());
    }
}