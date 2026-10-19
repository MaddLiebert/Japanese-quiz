import React from 'react';

/**
 * Renders text with Furigana using the format: "Kanji[kana]"
 * Example: "私[わたし]は学生[がくせい]です"
 */
export const Furigana = ({ text, className = "" }) => {
  if (!text) return null;

  // Regex matches: (Kanji sequence)[reading]
  // CJK Unified Ideographs + iteration marks (々, 〆)
  const pattern = /([\u4e00-\u9faf\u3400-\u4dbf\uf900-\ufaff々〆]+)\[(.*?)\]/g;
  const elements = [];
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    const [fullMatch, kanji, reading] = match;
    const matchStart = match.index;

    // Plain text before this kanji
    if (matchStart > lastIndex) {
      elements.push(
        <span key={`text-${lastIndex}`}>
          {text.slice(lastIndex, matchStart)}
        </span>
      );
    }

    // Kanji with furigana
    elements.push(
      <ruby key={`ruby-${matchStart}`} className="ruby-base">
        {kanji}
        <rt className="ruby-text text-[0.6em] opacity-80 select-none">{reading}</rt>
      </ruby>
    );

    lastIndex = matchStart + fullMatch.length;
  }

  // Trailing plain text
  if (lastIndex < text.length) {
    elements.push(
      <span key={`text-${lastIndex}`}>
        {text.slice(lastIndex)}
      </span>
    );
  }

  return <span className={className}>{elements}</span>;
};
