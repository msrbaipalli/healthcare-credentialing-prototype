import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatInputModule } from '@angular/material/input';

import { CredentialingMockService, PolicyRule } from '../services/credentialing-mock.service';

@Component({
    standalone: true,
    selector: 'app-policy-engine-page',
    imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule, MatSlideToggleModule, MatInputModule],
    templateUrl: './policy-enginecomponent.html',
    styleUrl: './policy-enginecomponent.scss',
})
export class PolicyEnginePageComponent {
    constructor(public mock: CredentialingMockService) { }

    rulesSig = signal<PolicyRule[]>(this.mock.listPolicyRules());

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
        this.mock.updatePolicyRule({ id: r.id, ifAnyFailsRequireManualReview: !r.ifAnyFailsRequireManualReview });
        this.rulesSig.set(this.mock.listPolicyRules());
    }
}
