import { describe, it, expect } from 'vitest';
import { parseRequirementsHtml } from './requirementsParser.js';

describe('RequirementsParser Service', () => {
  it('parses typical Steam HTML publisher specifications', () => {
    const rawHtml = `
      <strong>Minimum:</strong><br>
      <ul class="bb_ul">
        <li><strong>OS:</strong> 64-bit Windows 10<br></li>
        <li><strong>Processor:</strong> Core i7-6700 or Ryzen 5 1600<br></li>
        <li><strong>Memory:</strong> 12 GB RAM<br></li>
        <li><strong>Graphics:</strong> GeForce GTX 1060 6GB or Radeon RX 580 8GB<br></li>
        <li><strong>DirectX:</strong> Version 12<br></li>
        <li><strong>Storage:</strong> 70 GB available space<br></li>
        <li><strong>Additional Notes:</strong> SSD required. 1080p @ 30 FPS</li>
      </ul>
    `;

    const parsed = parseRequirementsHtml(rawHtml);
    expect(parsed).not.toBeNull();
    expect(parsed.os).toContain('Windows 10');
    expect(parsed.cpu).toContain('Core i7-6700');
    expect(parsed.ramGb).toBe(12);
    expect(parsed.gpu).toContain('GTX 1060');
    expect(parsed.vramGb).toBe(6);
    expect(parsed.directX).toContain('Version 12');
    expect(parsed.storageGb).toBe(70);
    expect(parsed.storageType).toBe('SSD Required');
  });

  it('handles null or empty html string gracefully', () => {
    expect(parseRequirementsHtml('')).toBeNull();
    expect(parseRequirementsHtml(null)).toBeNull();
    expect(parseRequirementsHtml(undefined)).toBeNull();
  });
});
