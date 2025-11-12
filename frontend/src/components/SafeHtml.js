import React, { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { sanitizeHtml } from '../utils/sanitizeHtml';

export default function SafeHtml({ html = '', className }) {
  const navigate = useNavigate();
  const clean = useMemo(() => sanitizeHtml(html), [html]);

  const onClick = useCallback((e) => {
    const target = e.target;
    if (!target) return;
    const anchor = target.closest && target.closest('a');
    if (!anchor) return;

    const href = anchor.getAttribute('href') || '';
    if (href.startsWith('/')) {
      e.preventDefault();
      e.stopPropagation();
      navigate(href);
    }
  }, [navigate]);

  return (
    <div
      className={className}
      onClick={onClick}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}