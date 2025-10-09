const sanitizeHtml = require('sanitize-html');

/**
 * Sanitize HTML content for safe web rendering
 * Prevents XSS attacks while preserving basic formatting
 * @param {string} html - HTML content to sanitize
 * @returns {string} - Sanitized HTML safe for rendering
 */
function sanitizeHtmlWeb(html) {
  if (!html || typeof html !== 'string') {
    return '';
  }

  return sanitizeHtml(html, {
    allowedTags: [
      'b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre',
      'span', 'div', 'img'
    ],
    allowedAttributes: {
      'a': ['href', 'target', 'rel'],
      'img': ['src', 'alt', 'width', 'height'],
      'span': ['class'],
      'div': ['class']
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: {
      img: ['http', 'https', 'data']
    },
    // Enforce rel="noopener noreferrer" on all links for security
    transformTags: {
      'a': (tagName, attribs) => {
        return {
          tagName: 'a',
          attribs: {
            ...attribs,
            rel: 'noopener noreferrer',
            target: attribs.target || '_blank'
          }
        };
      }
    }
  });
}

module.exports = {
  sanitizeHtmlWeb
};
