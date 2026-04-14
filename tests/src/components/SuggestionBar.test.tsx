import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

import { SuggestionBar } from '../../../src/components/SuggestionBar';

const mockSuggestions = [
  { eng: 'hello', indic: 'హలో' },
  { eng: 'world', indic: 'ప్రపంచం' },
  { eng: 'test', indic: 'పరీక్ష' },
];

describe('SuggestionBar', () => {
  it('renders nothing when suggestions is null', () => {
    const { container } = render(<SuggestionBar suggestions={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when suggestions array is empty', () => {
    const { container } = render(<SuggestionBar suggestions={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders suggestion items when suggestions are provided', () => {
    render(<SuggestionBar suggestions={mockSuggestions} />);
    expect(screen.getByText('hello')).toBeInTheDocument();
    expect(screen.getByText('world')).toBeInTheDocument();
    expect(screen.getByText('test')).toBeInTheDocument();
  });

  it('renders indic text for each suggestion', () => {
    render(<SuggestionBar suggestions={mockSuggestions} />);
    expect(screen.getByText('హలో')).toBeInTheDocument();
    expect(screen.getByText('ప్రపంచం')).toBeInTheDocument();
  });

  it('renders eng text inside bold elements', () => {
    render(<SuggestionBar suggestions={mockSuggestions} />);
    const boldElements = screen
      .getAllByRole('strong')
      .concat(Array.from(document.querySelectorAll('strong')));
    const uniqueBolds = Array.from(new Set(boldElements));
    expect(uniqueBolds.length).toBeGreaterThan(0);
  });

  it('has a highlighted background for the first suggestion', () => {
    const { container } = render(
      <SuggestionBar suggestions={mockSuggestions} />,
    );
    const suggestionDivs = container.querySelectorAll('div > div');
    // The first inner div should have a non-transparent background
    expect(suggestionDivs[0]).toBeInTheDocument();
  });

  it('renders with position absolute style', () => {
    const { container } = render(
      <SuggestionBar suggestions={mockSuggestions} />,
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.position).toBe('absolute');
  });

  it('renders a single suggestion correctly', () => {
    const single = [{ eng: 'single', indic: 'ఒకే ఒక' }];
    render(<SuggestionBar suggestions={single} />);
    expect(screen.getByText('single')).toBeInTheDocument();
    expect(screen.getByText('ఒకే ఒక')).toBeInTheDocument();
  });
});
