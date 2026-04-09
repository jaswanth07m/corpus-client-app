import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

// Mock react-i18next so that translations resolve to their keys
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('Pagination Components', () => {
  it('renders Pagination correctly', () => {
    render(<Pagination data-testid="pagination" />);
    const nav = screen.getByTestId('pagination');
    expect(nav).toBeInTheDocument();
    expect(nav.tagName).toBe('NAV');
    expect(nav).toHaveAttribute('role', 'navigation');
    expect(nav).toHaveAttribute('aria-label', 'pagination');
    expect(nav).toHaveClass('mx-auto', 'flex', 'w-full', 'justify-center');
  });

  it('renders PaginationContent correctly', () => {
    render(<PaginationContent data-testid="content" />);
    const ul = screen.getByTestId('content');
    expect(ul).toBeInTheDocument();
    expect(ul.tagName).toBe('UL');
    expect(ul).toHaveClass('flex', 'flex-row', 'items-center', 'gap-1');
  });

  it('renders PaginationItem correctly', () => {
    render(<PaginationItem data-testid="item" />);
    const li = screen.getByTestId('item');
    expect(li).toBeInTheDocument();
    expect(li.tagName).toBe('LI');
  });

  it('renders PaginationLink correctly', () => {
    render(<PaginationLink data-testid="link" href="#" />);
    const link = screen.getByTestId('link');
    expect(link).toBeInTheDocument();
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', '#');
  });

  it('renders active PaginationLink correctly', () => {
    render(<PaginationLink data-testid="active-link" isActive />);
    const link = screen.getByTestId('active-link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('aria-current', 'page');
  });

  it('renders PaginationPrevious correctly', () => {
    render(<PaginationPrevious data-testid="prev" href="#" />);
    const prev = screen.getByTestId('prev');
    expect(prev).toBeInTheDocument();
    expect(prev).toHaveAttribute('aria-label', 'common.goToPreviousPage');
    expect(prev).toHaveTextContent('Previous');
  });

  it('renders PaginationNext correctly', () => {
    render(<PaginationNext data-testid="next" href="#" />);
    const next = screen.getByTestId('next');
    expect(next).toBeInTheDocument();
    expect(next).toHaveAttribute('aria-label', 'common.goToNextPage');
    expect(next).toHaveTextContent('Next');
  });

  it('renders PaginationEllipsis correctly', () => {
    render(<PaginationEllipsis data-testid="ellipsis" />);
    const ellipsis = screen.getByTestId('ellipsis');
    expect(ellipsis).toBeInTheDocument();
    expect(ellipsis.tagName).toBe('SPAN');
    expect(ellipsis).toHaveAttribute('aria-hidden', 'true');
    // Ensure the translated text screen-reader only class text exists
    const srText = screen.getByText('common.morePages');
    expect(srText).toBeInTheDocument();
    expect(srText).toHaveClass('sr-only');
  });

  it('merges custom classNames correctly across components', () => {
    const { container } = render(
      <Pagination className="custom-pagination">
        <PaginationContent className="custom-content">
          <PaginationItem className="custom-item">
            <PaginationPrevious className="custom-prev" />
            <PaginationLink className="custom-link" />
            <PaginationEllipsis className="custom-ellipsis" />
            <PaginationNext className="custom-next" />
          </PaginationItem>
        </PaginationContent>
      </Pagination>,
    );

    expect(container.querySelector('.custom-pagination')).toBeInTheDocument();
    expect(container.querySelector('.custom-content')).toBeInTheDocument();
    expect(container.querySelector('.custom-item')).toBeInTheDocument();
    expect(container.querySelector('.custom-prev')).toBeInTheDocument();
    expect(container.querySelector('.custom-link')).toBeInTheDocument();
    expect(container.querySelector('.custom-ellipsis')).toBeInTheDocument();
    expect(container.querySelector('.custom-next')).toBeInTheDocument();
  });

  it('forwards refs properly to underlying HTML elements', () => {
    const contentRef = React.createRef<HTMLUListElement>();
    const itemRef = React.createRef<HTMLLIElement>();

    render(
      <Pagination>
        <PaginationContent ref={contentRef}>
          <PaginationItem ref={itemRef} />
        </PaginationContent>
      </Pagination>,
    );

    expect(contentRef.current).not.toBeNull();
    expect(contentRef.current).toBeInstanceOf(HTMLUListElement);

    expect(itemRef.current).not.toBeNull();
    expect(itemRef.current).toBeInstanceOf(HTMLLIElement);
  });
});
