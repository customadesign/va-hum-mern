import React from 'react';
import { useNavigate } from 'react-router-dom';

const SafeHtml = ({ html }) => {
  const navigate = useNavigate();

  const handleClick = (e) => {
    const anchor = e.target.closest && e.target.closest('a');
    if (!anchor) return;

    const href = anchor.getAttribute('href') || '';
    if (!href) return;

    if (href.startsWith('/')) {
      e.preventDefault();
      e.stopPropagation();
      navigate(href);
    }
  };

  return (
    <div
      className="safe-html"
      onClick={handleClick}
      dangerouslySetInnerHTML={{ __html: html || '' }}
    />
  );
};

export default SafeHtml;