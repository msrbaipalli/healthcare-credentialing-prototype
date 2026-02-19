import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { CredentialingMockService } from '../services/credentialing-mock.service';

@Component({
  standalone: true,
  selector: 'app-provider-by-npi-redirect',
  imports: [CommonModule, RouterModule, MatCardModule, MatIconModule, MatButtonModule],
  template: `
    <mat-card class="panel">
      <mat-icon>search</mat-icon>
      <div class="h1">Locating provider…</div>
      <div class="muted">Resolving NPI to provider profile (mock).</div>
      <button mat-flat-button routerLink="/">
        <mat-icon>arrow_back</mat-icon>
        Back to Dashboard
      </button>
    </mat-card>
  `,
  styles: [`
    .panel { padding: 42px 14px; border-radius: 16px; display: grid; place-items: center; gap: 10px; text-align: center; }
    .h1 { font-size: 18px; font-weight: 900; }
    .muted { font-size: 12px; opacity: 0.8; }
  `],
})
export class ProviderByNpiRedirectComponent {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private mock: CredentialingMockService
  ) { }

  ngOnInit() {
    const npi = (this.route.snapshot.paramMap.get('npi') ?? '').trim();
    const provider = this.mock.listProviders().find(p => p.npi === npi);

    if (provider) {
      this.router.navigate(['/provider', provider.id], { replaceUrl: true, queryParams: { tab: 'overview' } });
    } else {
      this.router.navigate(['/'], { replaceUrl: true });
    }
  }
}
