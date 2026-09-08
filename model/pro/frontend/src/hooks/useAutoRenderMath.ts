import { useEffect } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

/**
 * Global hook that auto-renders all inline $...$ LaTeX notation
 * found in text nodes throughout the DOM.
 * 
 * Call this once in the root component (App.tsx).
 * It uses a MutationObserver to handle dynamically added content.
 */
export function useAutoRenderMath() {
  useEffect(() => {
    // Initial render
    renderMathInElement(document.body);

    // Observe DOM changes for dynamically rendered content
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node instanceof HTMLElement) {
            renderMathInElement(node);
          }
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, []);
}

/**
 * Walks all text nodes inside `root` and replaces $...$ with rendered KaTeX.
 * Skips nodes inside <code>, <pre>, <script>, <style>, <textarea>, <input>, and
 * nodes already processed by KaTeX.
 */
function renderMathInElement(root: Element) {
  const skipTags = new Set(['CODE', 'PRE', 'SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'BUTTON']);
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        if (skipTags.has(parent.tagName)) return NodeFilter.FILTER_REJECT;
        if (parent.closest('.katex')) return NodeFilter.FILTER_REJECT;
        if (parent.classList?.contains('katex-rendered')) return NodeFilter.FILTER_REJECT;
        if (!node.textContent || !node.textContent.includes('$')) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  const textNodes: Text[] = [];
  let current: Node | null;
  while ((current = walker.nextNode())) {
    textNodes.push(current as Text);
  }

  for (const textNode of textNodes) {
    const text = textNode.textContent;
    if (!text) continue;

    // Match $...$ patterns (non-greedy, no newlines inside)
    const regex = /\$([^$\n]+)\$/g;
    if (!regex.test(text)) continue;
    regex.lastIndex = 0;

    const fragment = document.createDocumentFragment();
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
      }

      // Render the LaTeX
      const latex = match[1];
      const span = document.createElement('span');
      span.className = 'katex-rendered';
      try {
        katex.render(latex, span, {
          throwOnError: false,
          displayMode: false,
          output: 'html',
        });
      } catch {
        span.textContent = latex;
      }
      fragment.appendChild(span);

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
    }

    // Replace the original text node
    textNode.parentNode?.replaceChild(fragment, textNode);
  }
}
