import React from 'react';

/**
 * Renders text with Furigana using the format: "Kanji[kana]"
 * Example: "私[わたし]は学生[がくせい]です"
 */
export const Furigana = ({ text, className = "" }) => {
  if (!text) return null;

  // Regex to match Kanji[reading] patterns
  const parts = text.split(/(\[.*?\])/g);
  const result = [];

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    
    // Check if the next part is a reading block [reading]
    if (i + 1 < parts.length && parts[i+1].startsWith('[') && parts[i+1].endsWith(']')) {
      const reading = parts[i+1].slice(1, -1);
      result.push(
        <ruby key={i} className="ruby-base">
          {part}
          <rt className="ruby-text text-[0.6em] opacity-80 select-none">{reading}</rt>
        </ruby>
      );
      i++; // Skip the reading part
    } else if (!part.startsWith('[') || !part.endsWith(']')) {
      result.push(<span key={i}>{part}</span>);
    }
  }

  return <span className={className}>{result}</span>;
};
