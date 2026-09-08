import React, { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

/**
 * Renders text that may contain inline LaTeX delimited by $...$.
 * Replaces each $...$ span with KaTeX-rendered HTML.
 * Non-math text is returned as-is.
 */
export const InlineMath: React.FC<{ children: string }> = ({ children }) => {
  const html = useMemo(() => processInlineMath(children), [children]);
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
};

/**
 * Process a string containing $...$ delimiters into HTML with KaTeX.
 * Handles edge cases like escaped dollars and unmatched delimiters.
 */
function processInlineMath(text: string): string {
  const parts: string[] = [];
  let i = 0;
  while (i < text.length) {
    const dollarIdx = text.indexOf('$', i);
    if (dollarIdx === -1) {
      parts.push(escapeHtml(text.slice(i)));
      break;
    }
    // Push text before the dollar
    if (dollarIdx > i) {
      parts.push(escapeHtml(text.slice(i, dollarIdx)));
    }
    // Find closing dollar
    const closeIdx = text.indexOf('$', dollarIdx + 1);
    if (closeIdx === -1) {
      // Unmatched dollar — render literally
      parts.push(escapeHtml(text.slice(dollarIdx)));
      break;
    }
    const latex = text.slice(dollarIdx + 1, closeIdx);
    try {
      parts.push(
        katex.renderToString(latex, {
          throwOnError: false,
          displayMode: false,
          output: 'html',
        })
      );
    } catch {
      // Fallback: render the raw LaTeX in a monospace span
      parts.push(`<code>${escapeHtml(latex)}</code>`);
    }
    i = closeIdx + 1;
    continue;
  }
  return parts.join('');
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
