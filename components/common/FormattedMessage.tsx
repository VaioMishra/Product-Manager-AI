import React from 'react';

// A simple component to render text with basic markdown-like formatting.
// This is not a full markdown parser but handles the common cases for this app.
const FormattedMessage: React.FC<{ text: string }> = ({ text }) => {
  const lines = text.split('\n');
  const elements = [];
  let listType: 'ul' | 'ol' | null = null;
  let listItems: React.ReactNode[] = [];

  const processInlineFormatting = (line: string): React.ReactNode => {
    // Use dangerouslySetInnerHTML with simple replacements for inline styles.
    const html = line
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') // Basic HTML escape
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/~~(.*?)~~/g, '<s>$1</s>')
      .replace(/`(.*?)`/g, '<code class="bg-base-300 text-brand-secondary px-1 py-0.5 rounded text-sm">$1</code>');
    return <span dangerouslySetInnerHTML={{ __html: html }} />;
  };

  const flushList = () => {
    if (listItems.length > 0) {
      if (listType === 'ul') {
        elements.push(<ul key={`list-${elements.length}`} className="list-disc pl-5 space-y-1">{listItems}</ul>);
      } else if (listType === 'ol') {
        elements.push(<ol key={`list-${elements.length}`} className="list-decimal pl-5 space-y-1">{listItems}</ol>);
      }
      listItems = [];
      listType = null;
    }
  };

  lines.forEach((line, index) => {
    if (line.startsWith('- ')) {
      if (listType !== 'ul') flushList();
      listType = 'ul';
      listItems.push(<li key={index}>{processInlineFormatting(line.substring(2))}</li>);
    } else if (/^\d+\.\s*/.test(line)) {
      if (listType !== 'ol') flushList();
      listType = 'ol';
      listItems.push(<li key={index}>{processInlineFormatting(line.replace(/^\d+\.\s*/, ''))}</li>);
    } else if (line.startsWith('> ')) {
      flushList();
      elements.push(<blockquote key={index} className="pl-4 border-l-4 border-base-300 italic text-content-200">{processInlineFormatting(line.substring(2))}</blockquote>);
    } else {
      flushList();
      // Use a non-breaking space for empty lines to ensure they take up space
      const content = line.trim() === '' ? '\u00A0' : processInlineFormatting(line);
      elements.push(<p key={index}>{content}</p>);
    }
  });

  flushList(); // Flush any remaining list items

  return <>{elements}</>;
};

export default FormattedMessage;