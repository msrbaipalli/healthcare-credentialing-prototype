import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
    name: 'highlight',
    standalone: true,
})
export class HighlightPipe implements PipeTransform {
    constructor(private sanitizer: DomSanitizer) { }

    transform(value: unknown, query: string | null | undefined): SafeHtml {
        const text = value == null ? '' : String(value);
        const q = (query ?? '').trim();

        // Always escape the base text so any existing HTML is not interpreted.
        const escaped = this.escapeHtml(text);

        if (!q) {
            return this.sanitizer.bypassSecurityTrustHtml(escaped);
        }

        // Escape regex special chars in the query.
        const safeQuery = this.escapeRegExp(q);

        // Case-insensitive highlight.
        const re = new RegExp(`(${safeQuery})`, 'ig');
        const highlighted = escaped.replace(re, '<mark>$1</mark>');

        return this.sanitizer.bypassSecurityTrustHtml(highlighted);
    }

    private escapeHtml(input: string): string {
        return input
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    private escapeRegExp(input: string): string {
        return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}