import { Component, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';

import { CredentialingMockService, Connector, ConnectorStatus } from '../../services/credentialing-mock.service';

@Component({
    standalone: true,
    selector: 'app-integrations-page',
    imports: [CommonModule, DatePipe, MatCardModule, MatIconModule, MatButtonModule, MatDividerModule],
    templateUrl: './integrations.component.html',
    styleUrl: './integrations.component.scss',
})
export class IntegrationsPageComponent {
    constructor(public mock: CredentialingMockService) { }

    connectorsSig = signal<Connector[]>(this.mock.listConnectors());

    statusIcon(s: ConnectorStatus) {
        switch (s) {
            case 'healthy': return 'check_circle';
            case 'degraded': return 'warning';
            case 'down': return 'error';
        }
    }

    chipClass(s: ConnectorStatus) {
        return `chip chip--${s}`;
    }

    ping(id: string) {
        this.mock.mockPingConnector(id);
        this.connectorsSig.set(this.mock.listConnectors());
    }
}
