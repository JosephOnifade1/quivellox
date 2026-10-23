'use client';

import React from 'react';
import { Citation } from '@/types';
import { CitationBadge } from './CitationBadge';

export interface AnswerRendererProps {
  content: string;
  citations?: Citation[];
  activeCitation?: Citation | null;
  onCitationClick: (citation: Citation) => void;
  className?: string;
}

export const AnswerRenderer: React.FC<AnswerRendererProps> = ({
  content,
  citations = [],
  activeCitation,
  onCitationClick,
  className = '',
}) => {
  if (!content) return null;

  // Helper to replace [N] tokens with interactive CitationBadge components
  const renderInlineTextWithCitations = (text: string, keyPrefix: string) => {
    // Regex matches [1], [2], etc.
    const parts = text.split(/(\[\d+\])/g);

    return parts.map((part, index) => {
      const match = part.match(/^\[(\d+)\]$/);
      if (match) {
        const citationNum = parseInt(match[1], 10);
        // Look up citation by 1-based index or index field
        const citation =
          citations[citationNum - 1] ||
          citations.find((c, i) => i + 1 === citationNum);

        const isActive =
          Boolean(activeCitation && citation && activeCitation.chunk_id === citation.chunk_id);

        if (citation) {
          return (
            <CitationBadge
              key={`${keyPrefix}-cite-${citationNum}-${index}`}
              index={citationNum}
              citation={citation}
              isActive={isActive}
              onClick={() => onCitationClick(citation)}
            />
          );
        }

        // Fallback badge if citation not found in backend metadata
        return (
          <span
            key={`${keyPrefix}-unavail-${citationNum}-${index}`}
            className="inline-flex items-center font-mono text-[10px] text-[var(--text-faint)] px-1 border border-dashed border-[var(--border-subtle)] rounded-[3px] select-none mx-0.5"
            title="Citation passage unavailable or unverified"
          >
            [{citationNum}]
          </span>
        );
      }

      // Format bold markdown (**text**)
      const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
      if (boldParts.length > 1) {
        return (
          <span key={`${keyPrefix}-part-${index}`}>
            {boldParts.map((bPart, bIdx) => {
              if (bPart.startsWith('**') && bPart.endsWith('**')) {
                return (
                  <strong
                    key={`${keyPrefix}-bold-${bIdx}`}
                    className="font-semibold text-[var(--text-primary)]"
                  >
                    {bPart.slice(2, -2)}
                  </strong>
                );
              }
              // Format inline code (`code`)
              return renderInlineCode(bPart, `${keyPrefix}-${index}-${bIdx}`);
            })}
          </span>
        );
      }

      return renderInlineCode(part, `${keyPrefix}-${index}`);
    });
  };

  const renderInlineCode = (text: string, key: string) => {
    const codeParts = text.split(/(`[^`]+`)/g);
    if (codeParts.length <= 1) {
      return <React.Fragment key={key}>{text}</React.Fragment>;
    }
    return (
      <React.Fragment key={key}>
        {codeParts.map((cPart, cIdx) => {
          if (cPart.startsWith('`') && cPart.endsWith('`')) {
            return (
              <code
                key={`${key}-c-${cIdx}`}
                className="font-mono text-xs px-1.5 py-0.5 rounded-[3px] bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)]"
              >
                {cPart.slice(1, -1)}
              </code>
            );
          }
          return <span key={`${key}-txt-${cIdx}`}>{cPart}</span>;
        })}
      </React.Fragment>
    );
  };

  // Split content into blocks (paragraphs, headers, quotes, lists)
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let currentList: { type: 'ul' | 'ol'; items: string[] } | null = null;
  let inCodeBlock = false;
  let codeBlockLines: string[] = [];

  const flushList = (key: string) => {
    if (!currentList) return;
    const isUl = currentList.type === 'ul';
    elements.push(
      isUl ? (
        <ul key={key} className="space-y-1.5 my-2.5 pl-5 list-disc text-sm text-[var(--text-primary)]">
          {currentList.items.map((item, idx) => (
            <li key={`${key}-item-${idx}`} className="leading-relaxed">
              {renderInlineTextWithCitations(item, `${key}-li-${idx}`)}
            </li>
          ))}
        </ul>
      ) : (
        <ol key={key} className="space-y-1.5 my-2.5 pl-5 list-decimal text-sm text-[var(--text-primary)] font-mono-numbers">
          {currentList.items.map((item, idx) => (
            <li key={`${key}-item-${idx}`} className="leading-relaxed">
              {renderInlineTextWithCitations(item, `${key}-li-${idx}`)}
            </li>
          ))}
        </ol>
      )
    );
    currentList = null;
  };

  lines.forEach((line, lineIdx) => {
    const trimmed = line.trim();

    // Code blocks
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        // End code block
        elements.push(
          <div
            key={`code-${lineIdx}`}
            className="my-3 rounded-[6px] border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] p-3 overflow-x-auto text-xs font-mono text-[var(--text-primary)]"
          >
            <pre>
              <code>{codeBlockLines.join('\n')}</code>
            </pre>
          </div>
        );
        codeBlockLines = [];
        inCodeBlock = false;
      } else {
        if (currentList) flushList(`list-before-code-${lineIdx}`);
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      return;
    }

    // Blank line
    if (!trimmed) {
      if (currentList) flushList(`list-${lineIdx}`);
      return;
    }

    // Unordered List
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const itemText = trimmed.slice(2);
      if (currentList && currentList.type === 'ul') {
        currentList.items.push(itemText);
      } else {
        if (currentList) flushList(`list-flush-${lineIdx}`);
        currentList = { type: 'ul', items: [itemText] };
      }
      return;
    }

    // Ordered List
    const matchOrdered = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (matchOrdered) {
      const itemText = matchOrdered[2];
      if (currentList && currentList.type === 'ol') {
        currentList.items.push(itemText);
      } else {
        if (currentList) flushList(`list-flush-${lineIdx}`);
        currentList = { type: 'ol', items: [itemText] };
      }
      return;
    }

    // Any non-list line flushes open list
    if (currentList) flushList(`list-flush-${lineIdx}`);

    // Headers
    if (trimmed.startsWith('### ')) {
      elements.push(
        <h4
          key={`h4-${lineIdx}`}
          className="font-heading font-medium text-sm text-[var(--text-primary)] mt-3.5 mb-1.5 tracking-tight"
        >
          {renderInlineTextWithCitations(trimmed.slice(4), `h4-${lineIdx}`)}
        </h4>
      );
      return;
    }

    if (trimmed.startsWith('## ')) {
      elements.push(
        <h3
          key={`h3-${lineIdx}`}
          className="font-heading font-semibold text-base text-[var(--text-primary)] mt-4 mb-2 tracking-tight"
        >
          {renderInlineTextWithCitations(trimmed.slice(3), `h3-${lineIdx}`)}
        </h3>
      );
      return;
    }

    if (trimmed.startsWith('# ')) {
      elements.push(
        <h2
          key={`h2-${lineIdx}`}
          className="font-heading font-semibold text-lg text-[var(--text-primary)] mt-4 mb-2 tracking-tight"
        >
          {renderInlineTextWithCitations(trimmed.slice(2), `h2-${lineIdx}`)}
        </h2>
      );
      return;
    }

    // Blockquote
    if (trimmed.startsWith('> ')) {
      elements.push(
        <blockquote
          key={`quote-${lineIdx}`}
          className="border-l-2 border-[var(--accent-citron-muted)] pl-3.5 my-2.5 font-serif italic text-sm text-[var(--text-primary)] bg-[var(--bg-surface-elevated)]/30 py-1.5 rounded-r-[4px]"
        >
          {renderInlineTextWithCitations(trimmed.slice(2), `quote-${lineIdx}`)}
        </blockquote>
      );
      return;
    }

    // Standard paragraph
    elements.push(
      <p
        key={`p-${lineIdx}`}
        className="text-sm leading-relaxed text-[var(--text-primary)] my-2"
      >
        {renderInlineTextWithCitations(line, `p-${lineIdx}`)}
      </p>
    );
  });

  if (currentList) flushList(`list-end`);

  return <div className={`space-y-1 ${className}`}>{elements}</div>;
};
