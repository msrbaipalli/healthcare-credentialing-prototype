import { Component, computed, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import {
    CredentialingMockService,
    Connector,
    ConnectorStatus
} from '../../services/credentialing-mock.service';

type IntegrationFilter = 'all' | ConnectorStatus;

@Component({
    standalone: true,
    selector: 'app-integrations-page',
    imports: [
        CommonModule,
        DatePipe,
        MatCardModule,
        MatIconModule,
        MatButtonModule,
        MatDividerModule,
        MatChipsModule,
        MatSlideToggleModule,
    ],
    templateUrl: './integrations-page.component.html',
    styleUrl: './integrations-page.component.scss',
})
export class IntegrationsPageComponent {
    constructor(public mock: CredentialingMockService) { }

    connectorsSig = signal<Connector[]>(this.mock.listConnectors());

    activeFilter = signal<IntegrationFilter>('all');
    attentionOnly = signal(false);

    filterChips: Array<{ key: IntegrationFilter; label: string }> = [
        { key: 'all', label: 'All' },
        { key: 'healthy', label: 'Healthy' },
        { key: 'degraded', label: 'Degraded' },
        { key: 'down', label: 'Down' },
    ];

    filtered = computed(() => {
        let list = this.connectorsSig();
        const filter = this.activeFilter();
        const attentionOnly = this.attentionOnly();

        if (filter !== 'all') {
            list = list.filter(c => c.status === filter);
        }

        if (attentionOnly) {
            list = list.filter(c => c.status === 'degraded' || c.status === 'down');
        }

        return list;
    });

    setFilter(filter: IntegrationFilter) {
        this.activeFilter.set(filter);
    }

    toggleAttentionOnly(value: boolean) {
        this.attentionOnly.set(value);
    }

    clearFilters() {
        this.activeFilter.set('all');
        this.attentionOnly.set(false);
    }

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
} import { Component, computed, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import {
    CredentialingMockService,
    Connector,
    ConnectorStatus
} from '../services/credentialing-mock.service';

type IntegrationFilter = 'all' | ConnectorStatus;

@Component({
    standalone: true,
    selector: 'app-integrations-page',
    imports: [
        CommonModule,
        DatePipe,
        MatCardModule,
        MatIconModule,
        MatButtonModule,
        MatDividerModule,
        MatChipsModule,
        MatSlideToggleModule,
    ],
    templateUrl: './integrations-page.component.html',
    styleUrl: './integrations-page.component.scss',
})
export class IntegrationsPageComponent {
    constructor(public mock: CredentialingMockService) { }

    connectorsSig = signal<Connector[]>(this.mock.listConnectors());

    activeFilter = signal<IntegrationFilter>('all');
    attentionOnly = signal(false);

    filterChips: Array<{ key: IntegrationFilter; label: string }> = [
        { key: 'all', label: 'All' },
        { key: 'healthy', label: 'Healthy' },
        { key: 'degraded', label: 'Degraded' },
        { key: 'down', label: 'Down' },
    ];

    filtered = computed(() => {
        let list = this.connectorsSig();
        const filter = this.activeFilter();
        const attentionOnly = this.attentionOnly();

        if (filter !== 'all') {
            list = list.filter(c => c.status === filter);
        }

        if (attentionOnly) {
            list = list.filter(c => c.status === 'degraded' || c.status === 'down');
        }

        return list;
    });

    setFilter(filter: IntegrationFilter) {
        this.activeFilter.set(filter);
    }

    toggleAttentionOnly(value: boolean) {
        this.attentionOnly.set(value);
    }

    clearFilters() {
        this.activeFilter.set('all');
        this.attentionOnly.set(false);
    }

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