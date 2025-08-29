import React from 'react';

// Enhanced component to render text with markdown-like formatting.
// This version properly groups multi-line lists and blockquotes,
// and ensures correct rendering of inline code, bold, italics, etc.
const FormattedMessage: React.FC<{ text: string }> = ({ text }) => {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];

  // Buffers for grouping consecutive block-level elements
  let listType: 'ul' | 'ol' | null = null;
  let listItems: React.ReactNode[] = [];
  let inBlockquote = false;
  let blockquoteItems: React.ReactNode[] = [];

  const processInlineFormatting = (line: string): React.ReactNode => {
    // Added font-mono for better code readability.
    const html = line
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;') // Basic HTML escape
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
      .replace(/\*(.*?)\*/g, '<em>$1</em>')       // Italic
      .replace(/~~(.*?)~~/g, '<s>$1</s>')         // Strikethrough
      .replace(
        /`(.*?)`/g,
        '<code class="bg-surface-secondary text-brand-secondary px-1 py-0.5 rounded text-sm font-mono">$1</code>'
      ); // Inline Code
    return <span dangerouslySetInnerHTML={{ __html: html }} />;
  };

  // Flushes only the list buffer
  const flushList = () => {
    if (listItems.length > 0) {
      const ListComponent = listType === 'ul' ? 'ul' : 'ol';
      const listClasses = listType === 'ul' ? 'list-disc' : 'list-decimal';
      elements.push(
        <ListComponent key={`list-${elements.length}`} className={`${listClasses} pl-5 space-y-1 my-2`}>
          {listItems}
        </ListComponent>
      );
    }
    listItems = [];
    listType = null;
  };

  // Flushes only the blockquote buffer
  const flushBlockquote = () => {
    if (blockquoteItems.length > 0) {
      elements.push(
        <blockquote key={`quote-${elements.length}`} className="pl-4 border-l-4 border-border-primary text-text-secondary my-2">
          {blockquoteItems}
        </blockquote>
      );
    }
    blockquoteItems = [];
    inBlockquote = false;
  };

  lines.forEach((line, index) => {
    const isUnorderedItem = line.startsWith('- ');
    const isOrderedItem = /^\d+\.\s*/.test(line);
    const isBlockquoteItem = line.startsWith('> ');

    // Case 1: Unordered List
    if (isUnorderedItem) {
      if (listType !== 'ul') {
        flushList();
        flushBlockquote();
      }
      listType = 'ul';
      inBlockquote = false;
      listItems.push(<li key={index}>{processInlineFormatting(line.substring(2))}</li>);
    }
    // Case 2: Ordered List
    else if (isOrderedItem) {
      if (listType !== 'ol') {
        flushList();
        flushBlockquote();
      }
      listType = 'ol';
      inBlockquote = false;
      listItems.push(<li key={index}>{processInlineFormatting(line.replace(/^\d+\.\s*/, ''))}</li>);
    }
    // Case 3: Blockquote
    else if (isBlockquoteItem) {
      if (!inBlockquote) {
        flushList();
        flushBlockquote();
      }
      inBlockquote = true;
      listType = null;
      blockquoteItems.push(<p key={index} className="italic">{processInlineFormatting(line.substring(2))}</p>);
    }
    // Case 4: Paragraph or empty line
    else {
      flushList();
      flushBlockquote();
      // Use a non-breaking space for empty lines to ensure they take up space and create paragraph breaks.
      const content = line.trim() === '' ? '\u00A0' : processInlineFormatting(line);
      elements.push(<p key={index}>{content}</p>);
    }
  });

  // Flush any remaining buffers at the end
  flushList();
  flushBlockquote();

  return <>{elements}</>;
};

export default FormattedMessage;