const { sanitizeHtmlWeb, sanitizeHtmlEmail } = require('../utils/sanitizeHtml');

describe('utils/sanitizeHtml', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV, PUBLIC_BASE_URL: 'http://localhost:3000' };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  test('allows site-relative anchors without target on web', () => {
    const input = 'Go to <a href="/dashboard">Dashboard</a>';
    const out = sanitizeHtmlWeb(input);
    expect(out).toContain('<a href="/dashboard"');
    expect(out).not.toContain('target="_blank"');
  });

  test('external anchors get target=_blank and rel hardening', () => {
    const input = 'Visit <a href="https://example.com">Example</a>';
    const out = sanitizeHtmlWeb(input);
    expect(out).toContain('href="https://example.com"');
    expect(out).toContain('target="_blank"');
    expect(out).toMatch(/rel="[^"]*noopener[^"]*"/);
  });

  test('blocks javascript: scheme', () => {
    const input = '<a href="javascript:alert(1)">Click</a>';
    const out = sanitizeHtmlWeb(input);
    expect(out).not.toContain('javascript:');
  });

  test('email context rewrites /relative to absolute using PUBLIC_BASE_URL', () => {
    const input = 'Open your <a href="/dashboard">Dashboard</a>';
    const out = sanitizeHtmlEmail(input, 'http://localhost:3000');
    expect(out).toContain('href="http://localhost:3000/dashboard"');
  });

  test('removes style and inline event handlers', () => {
    const input = '<a href="/dashboard" style="color:red" onclick="alert(1)">Dashboard</a>';
    const out = sanitizeHtmlWeb(input);
    expect(out).toContain('<a href="/dashboard"');
    expect(out).not.toContain('style=');
    expect(out).not.toContain('onclick');
  });
});