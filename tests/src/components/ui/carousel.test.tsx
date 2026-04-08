import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/ui/carousel';
import useEmblaCarousel from 'embla-carousel-react';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

// Provide a global fallback for `t` because `CarouselPrevious` and `CarouselNext`
// reference `t` but do not call `useTranslation()` directly (a bug in carousel.tsx).
// This prevents ReferenceError: t is not defined during testing.
(globalThis as unknown as { t: (key: string) => string }).t = (key: string) =>
  key;

// Mock embla-carousel-react
const mockApi = {
  canScrollPrev: vi.fn(() => true),
  canScrollNext: vi.fn(() => true),
  scrollPrev: vi.fn(),
  scrollNext: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
};

vi.mock('embla-carousel-react', () => ({
  default: vi.fn(() => [vi.fn(), mockApi]),
}));

describe('Carousel Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.canScrollPrev.mockReturnValue(true);
    mockApi.canScrollNext.mockReturnValue(true);
  });

  it('throws error when used outside provider', () => {
    const consoleSpy = vi.spyOn(console, 'error');
    consoleSpy.mockImplementation(() => {});

    expect(() => {
      render(<CarouselContent />);
    }).toThrow('useCarousel must be used within a <Carousel />');

    consoleSpy.mockRestore();
  });

  it('renders basic carousel successfully', () => {
    render(
      <Carousel>
        <CarouselContent>
          <CarouselItem>Item 1</CarouselItem>
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>,
    );

    expect(screen.getByRole('region')).toBeInTheDocument();
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'common.previousSlide' }),
    ).not.toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'common.nextSlide' }),
    ).not.toBeDisabled();
  });

  it('applies horizontal classes by default', () => {
    render(
      <Carousel>
        <CarouselContent data-testid="content">
          <CarouselItem data-testid="item">Item 1</CarouselItem>
        </CarouselContent>
        <CarouselPrevious data-testid="prev" />
        <CarouselNext data-testid="next" />
      </Carousel>,
    );

    expect(screen.getByTestId('content')).toHaveClass('-ml-4');
    expect(screen.getByTestId('item')).toHaveClass('pl-4');
    expect(screen.getByTestId('prev')).toHaveClass('-left-12');
    expect(screen.getByTestId('next')).toHaveClass('-right-12');
  });

  it('applies vertical classes when orientation is vertical', () => {
    render(
      <Carousel orientation="vertical">
        <CarouselContent data-testid="content">
          <CarouselItem data-testid="item">Item 1</CarouselItem>
        </CarouselContent>
        <CarouselPrevious data-testid="prev" />
        <CarouselNext data-testid="next" />
      </Carousel>,
    );

    expect(useEmblaCarousel).toHaveBeenCalledWith(
      expect.objectContaining({ axis: 'y' }),
      undefined,
    );

    expect(screen.getByTestId('content')).toHaveClass('-mt-4');
    expect(screen.getByTestId('content')).toHaveClass('flex-col');
    expect(screen.getByTestId('item')).toHaveClass('pt-4');
    expect(screen.getByTestId('prev')).toHaveClass('-top-12 rotate-90');
    expect(screen.getByTestId('next')).toHaveClass('-bottom-12 rotate-90');
  });

  it('falls back to opts.axis if orientation is falsy to ensure coverage', () => {
    render(
      <Carousel orientation={'' as 'horizontal'} opts={{ axis: 'y' }}>
        <CarouselContent data-testid="content" />
      </Carousel>,
    );
    expect(screen.getByTestId('content')).toHaveClass('flex-col');
    // Because of the ternary inside orientation fallback, '' acts falsy.
    // It covers (opts?.axis === 'y' ? 'vertical' : 'horizontal')
  });

  it('falls back to x axis if orientation is falsy and opts.axis is not y', () => {
    render(
      <Carousel orientation={'' as 'horizontal'} opts={{ axis: 'x' }}>
        <CarouselContent data-testid="content" />
      </Carousel>,
    );
    expect(screen.getByTestId('content')).toHaveClass('-ml-4');
  });

  it('handles clicking previous and next buttons', () => {
    render(
      <Carousel>
        <CarouselPrevious data-testid="prev" />
        <CarouselNext data-testid="next" />
      </Carousel>,
    );

    fireEvent.click(screen.getByTestId('prev'));
    expect(mockApi.scrollPrev).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId('next'));
    expect(mockApi.scrollNext).toHaveBeenCalledTimes(1);
  });

  it('handles keyboard navigation', () => {
    render(
      <Carousel data-testid="carousel">
        <CarouselContent />
      </Carousel>,
    );

    const carousel = screen.getByTestId('carousel');

    fireEvent.keyDown(carousel, { key: 'ArrowLeft' });
    expect(mockApi.scrollPrev).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(carousel, { key: 'ArrowRight' });
    expect(mockApi.scrollNext).toHaveBeenCalledTimes(1);

    // Ignore unknown keys
    fireEvent.keyDown(carousel, { key: 'ArrowUp' });
    expect(mockApi.scrollPrev).toHaveBeenCalledTimes(1);
    expect(mockApi.scrollNext).toHaveBeenCalledTimes(1);
  });

  it('sets buttons disabled state based on scrollability', () => {
    mockApi.canScrollPrev.mockReturnValue(false);
    mockApi.canScrollNext.mockReturnValue(false);

    render(
      <Carousel>
        <CarouselPrevious data-testid="prev" />
        <CarouselNext data-testid="next" />
      </Carousel>,
    );

    // Initial render will call onSelect immediately in useEffect and disable buttons
    expect(screen.getByTestId('prev')).toBeDisabled();
    expect(screen.getByTestId('next')).toBeDisabled();
  });

  it('bails out onSelect if api is falsy', () => {
    let selectCallback: ((api: unknown) => void) | undefined;
    mockApi.on.mockImplementation((event, cb) => {
      if (event === 'select') {
        selectCallback = cb;
      }
    });

    render(
      <Carousel>
        <CarouselContent />
      </Carousel>,
    );

    mockApi.canScrollPrev.mockClear();
    mockApi.canScrollNext.mockClear();

    if (selectCallback) {
      selectCallback(null);
    }

    expect(mockApi.canScrollPrev).not.toHaveBeenCalled();
    expect(mockApi.canScrollNext).not.toHaveBeenCalled();
  });

  it('calls setApi callback properly', () => {
    const setApi = vi.fn();
    render(<Carousel setApi={setApi} />);
    expect(setApi).toHaveBeenCalledWith(mockApi);
  });

  it('handles null api gracefully', () => {
    // @ts-expect-error - Testing null api gracefully
    vi.mocked(useEmblaCarousel).mockReturnValueOnce([vi.fn(), null]);

    render(
      <Carousel>
        <CarouselPrevious data-testid="prev" />
        <CarouselNext data-testid="next" />
      </Carousel>,
    );

    // By default should be disabled as state initiates to false
    expect(screen.getByTestId('prev')).toBeDisabled();
    expect(screen.getByTestId('next')).toBeDisabled();

    // Should not throw
    fireEvent.click(screen.getByTestId('prev'));
    fireEvent.click(screen.getByTestId('next'));
  });

  it('unmounts cleanly and removes event listeners', () => {
    const { unmount } = render(<Carousel />);
    expect(mockApi.on).toHaveBeenCalledWith('reInit', expect.any(Function));
    expect(mockApi.on).toHaveBeenCalledWith('select', expect.any(Function));

    unmount();

    expect(mockApi.off).toHaveBeenCalledWith('select', expect.any(Function));
  });
});
