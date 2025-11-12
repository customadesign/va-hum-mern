/* eslint-env jest */
const { sanitizeHtmlWeb, sanitizeHtmlEmail } = require('../utils/sanitizeHtml');

describe('sanitizeHtml policy (web context)', () => {
  it('keeps allowed tags and strips disallowed tags/attributes', () => {
    const input = `
      <p>Hello <strong>world</strong>
        <script>alert(1)</script>
        <span style="color:red" onclick="evil()">text</span>
      </p>`;
    const out = sanitizeHtmlWeb(input);

    // Allowed content remains
    expect(out).toContain('<p>');
    expect(out).toContain('<strong>world</strong>');

    // Disallowed script removed
    expect(out).not.toContain('<script');

    // Disallowed inline style and event handlers removed
    expect(out).not.toContain('style=');
    expect(out).not.toContain('onclick=');
  });

  it('hardens external anchors with target and rel', () => {
    const input = `<a href="https://example.com/page">link</a>`;
    const out = sanitizeHtmlWeb(input);
    expect(out).toContain('href="https://example.com/page"');
    expect(out).toContain('target="_blank"');
    expect(out).toContain('rel="noopener noreferrer nofollow"');
  });

  it('preserves site-relative anchors without forcing _blank', () => {
    const input = `<a href="/dashboard">Dashboard</a>`;
    const out = sanitizeHtmlWeb(input);
    expect(out).toContain('href="/dashboard"');
    // Should not be forced to _blank for internal links
    expect(out).not.toContain('target="_blank"');
  });

  it('drops dangerous schemes like javascript: and vbscript:', () => {
    const input = `<a href="javascript:alert(1)">x</a> <a href="vbscript:msgbox(1)">y</a>`;
    const out = sanitizeHtmlWeb(input);
    // No javascript: or vbscript: present
    expect(out.toLowerCase()).not.toContain('javascript:');
    expect(out.toLowerCase()).not.toContain('vbscript:');
  });

  it('allows mailto: and tel: schemes', () => {
    const input = `<a href="mailto:test@example.com">Mail</a> <a href="tel:+11234567890">Call</a>`;
    const out = sanitizeHtmlWeb(input);
    expect(out).toContain('href="mailto:test@example.com"');
    expect(out).toContain('href="tel:+11234567890"');
  });
});

describe('sanitizeHtml policy (email context)', () => {
  const BASE = 'https://myapp.test';

  it('rewrites relative / links to absolute using baseUrl', () => {
    const input = `<a href="/dashboard">Go</a>`;
    const out = sanitizeHtmlEmail(input, BASE);
    expect(out).toContain(`href="${BASE}/dashboard"`);
  });

  it('does not rewrite already absolute http(s) links', () => {
    const input = `<a href="https://example.com/features">Features</a>`;
    const out = sanitizeHtmlEmail(input, BASE);
    expect(out).toContain('href="https://example.com/features"');
  });

  it('hardens external http(s) links with target and rel in email context', () => {
    const input = `<a href="https://example.com">External</a>`;
    const out = sanitizeHtmlEmail(input, BASE);
    expect(out).toContain('target="_blank"');
    expect(out).toContain('rel="noopener noreferrer nofollow"');
  });

  it('keeps mailto: and tel: intact in email context', () => {
    const input = `<a href="mailto:support@example.com">Support</a> <a href="tel:+15551230000">Call</a>`;
    const out = sanitizeHtmlEmail(input, BASE);
    expect(out).toContain('href="mailto:support@example.com"');
    expect(out).toContain('href="tel:+15551230000"');
  });

  it('strips dangerous schemes in email context as well', () => {
    const input = `<a href="javascript:alert(1)">bad</a>`;
    const out = sanitizeHtmlEmail(input, BASE);
    expect(out.toLowerCase()).not.toContain('javascript:');
  });
});