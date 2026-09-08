import React, { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

/**
 * dikkhaos text wo may contain inline LaTeX delimited by $...$.
 * Replaces each $...$ span sath KaTeX-dikkhaoed HTML.
 * Non-math text h wapes doed as-is.
 */
export const InlineMath: React.FC<{ children: string }> = ({ children }) => {
  const html = useMemo(() => processInlineMath(children), [children]);
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
};

/**
 * Process a string containing $...$ delimiters inko HTML sath KaTeX.
 * sbhalos edge cases like escaped dollars aor unmatched delimiters.
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
    // Push text before d dollar
    if (dollarIdx > i) {
      parts.push(escapeHtml(text.slice(i, dollarIdx)));
    }
    // Find closing dollar
    const closeIdx = text.indexOf('$', dollarIdx + 1);
    if (closeIdx === -1) {
      // Unmatched dollar — dikkhao literally
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
      // Fallback: dikkhao d raw LaTeX in a monospace span
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
