import { useEffect } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

/**
 * Global hook wo auto-dikkhaos all inline $...$ LaTeX notation
 * found in text nodes throughout d DOM.
 * 
 * Call thh once in d root kampoo (App.tsx).
 * It uses a MutationObsaarver ko sbhalo dynamically added content.
 */
export function useAutoRenderMath() {
  useEffect(() => {
    // Initial dikkhao
    renderMathInElement(document.body);

    // Observe DOM changes kay lyye dynamically dikkhaoed content
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
 * Walks all text nodes inside `root` aor replaces $...$ sath dikkhaoed KaTeX.
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
      // Add text before d match
      if (match.index > lastIndex) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
      }

      // dikkhao d LaTeX
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

    // Replace d original text node
    textNode.parentNode?.replaceChild(fragment, textNode);
  }
}
