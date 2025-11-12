/**
 * sanitizeHtml(input: string): string
 * - Allows safe subset: a, b, strong, i, em, p, br, span, ul, ol, li, code, pre
 * - On <a>, keeps href/title/target/rel/class; validates href to http/https/mailto/tel or site-relative "/"
 * - Blocks javascript:, vbscript:, data:, on* handlers, style, and unknown tags/attrs
 * - Uses DOMPurify if available; otherwise falls back to a template-based sanitizer
 */
export function sanitizeHtml(input) {
  const html = typeof input === 'string' ? input : '';
  if (!html) return '';

  // Prefer DOMPurify if available globally
  try {
    if (typeof window !== 'undefined' && window.DOMPurify && typeof window.DOMPurify.sanitize === 'function') {
      return window.DOMPurify.sanitize(html, {
        ALLOWED_TAGS: ['a', 'b', 'strong', 'i', 'em', 'p', 'br', 'span', 'ul', 'ol', 'li', 'code', 'pre'],
        ALLOWED_ATTR: { a: ['href', 'title', 'target', 'rel', 'class'] },
        ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|\/(?!\/))/i,
        FORBID_TAGS: ['script', 'iframe', 'object', 'embed'],
        FORBID_ATTR: ['style'],
        KEEP_CONTENT: false
      });
    }
  } catch {
    // fall through to fallback
  }

  // Fallback sanitizer (client-side only)
  try {
    if (typeof window === 'undefined' || typeof document === 'undefined' || !document.createElement) {
      // Server-side: conservative strip
      return html.replace(/<[^>]*>/g, '');
    }

    const allowedTags = new Set(['A', 'B', 'STRONG', 'I', 'EM', 'P', 'BR', 'SPAN', 'UL', 'OL', 'LI', 'CODE', 'PRE']);

    const tpl = document.createElement('template');
    tpl.innerHTML = html;

    const isSafeHref = (href) => {
      if (!href) return false;
      if (href.startsWith('/')) return true;
      const lower = href.toLowerCase();
      return (
        lower.startsWith('http://') ||
        lower.startsWith('https://') ||
        lower.startsWith('mailto:') ||
        lower.startsWith('tel:')
      );
    };

    const walk = (root) => {
      const nodeList = root.querySelectorAll('*');
      nodeList.forEach((el) => {
        const tag = el.tagName.toUpperCase();
        if (!allowedTags.has(tag)) {
          const text = document.createTextNode(el.textContent || '');
          el.replaceWith(text);
          return;
        }

        // Strip dangerous attributes
        Array.from(el.attributes).forEach((attr) => {
          const name = attr.name;
          if (name.startsWith('on')) el.removeAttribute(name);
          if (name === 'style') el.removeAttribute(name);
        });

        if (tag === 'A') {
          const a = el;
          const href = a.getAttribute('href') || '';
          const safeHref = isSafeHref(href) ? href : '#';
          a.setAttribute('href', safeHref);
          a.setAttribute('target', safeHref.startsWith('/') ? '_self' : '_blank');
          a.setAttribute('rel', 'noopener noreferrer');

          Array.from(a.attributes).forEach((attr) => {
            if (!['href', 'title', 'target', 'rel', 'class'].includes(attr.name)) {
              a.removeAttribute(attr.name);
            }
          });

          const existingClass = a.getAttribute('class') || '';
          a.setAttribute('class', (existingClass + ' text-blue-600 underline').trim());
        } else {
          Array.from(el.attributes).forEach((attr) => {
            if (['class'].includes(attr.name)) return;
            el.removeAttribute(attr.name);
          });
        }
      });
    };

    walk(tpl.content);
    return tpl.innerHTML;
  } catch {
    return html.replace(/<[^>]*>/g, '');
  }
}

export default sanitizeHtml;