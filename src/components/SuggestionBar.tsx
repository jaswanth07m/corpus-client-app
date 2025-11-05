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
        gap: '5px',
        padding: '10px',
        border: '1px solid black',
        maxHeight: '75%',
        borderRadius: '5px',
        overflow: 'auto',
        marginTop: '7%',
        right: '98%',
        backgroundColor: '#cccccc',
      }}
    >
      {suggestions.map((sugg, index: number) => (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-around',
            backgroundColor: index == 0 ? '#818181' : 'transparent',
          }}
          key={sugg.eng}
        >
          <strong>{sugg.eng}</strong> →{' '}
          <span style={{ fontSize: '1.2em' }}>{sugg.indic}</span>
        </div>
      ))}
    </div>
  );
}
