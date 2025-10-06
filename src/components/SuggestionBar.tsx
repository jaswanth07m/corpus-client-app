import React from 'react';

export function SuggestionBar({ suggestions }) {
  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        position: 'absolute',
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
        padding: '10px',
        borderRadius: '5px',
        marginTop: '5px',
      }}
    >
      {suggestions.map((sugg) => (
        <div key={sugg.eng}>
          <strong>{sugg.eng}</strong> →{' '}
          <span style={{ fontSize: '1.2em' }}>{sugg.indic}</span>
        </div>
      ))}
    </div>
  );
}
