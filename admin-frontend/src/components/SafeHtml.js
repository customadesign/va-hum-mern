import React, { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { sanitizeHtml } from '../utils/sanitizeHtml';

/**
 * SafeHtml
 * - Sanitizes provided HTML using allowlist policy (see utils/sanitizeHtml.js)
 * - Renders via dangerouslySetInnerHTML at the final insertion point
 * - Intercepts clicks on internal anchors (href starting with "/") and navigates via react-router
 * - Stops propagation to avoid parent handlers hijacking navigation
 */
export default function SafeHtml({ html = '', className }) {
  const navigate = useNavigate();
  const clean = useMemo(() => sanitizeHtml(html), [html]);

  const onClick = useCallback((e) => {
    const target = e.target;
    if (!target) return;
    const anchor = target.closest && target.closest('a');
    if (!anchor) return;

    const href = anchor.getAttribute('href') || '';
    // Internal navigation via router
    if (href.startsWith('/')) {
      e.preventDefault();
      e.stopPropagation();
      navigate(href);
    }
    // External links follow normal behavior (sanitizer sets rel/target)
  }, [navigate]);

  return (
    <div
      className={className}
      onClick={onClick}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}