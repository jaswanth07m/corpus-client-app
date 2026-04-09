/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom" />

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SwechaLogo from '../../../src/components/SwechaLogo';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'common.technologyForSociety': 'Technology for Society',
      };
      return translations[key] || key;
    },
  }),
}));

describe('SwechaLogo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Default Rendering', () => {
    it('should render the component with default props', () => {
      render(<SwechaLogo />);

      expect(screen.getByText('Swecha')).toBeInTheDocument();
    });

    it('should render the SVG bird graphics', () => {
      const { container } = render(<SwechaLogo />);

      const svgElement = container.querySelector('svg');
      expect(svgElement).toBeInTheDocument();
      expect(svgElement?.tagName).toBe('svg');
    });

    it('should have the correct default size (md)', () => {
      const { container } = render(<SwechaLogo />);

      const textElement = container.querySelector('.text-3xl');
      expect(textElement).toBeInTheDocument();
    });

    it('should not show tagline by default', () => {
      render(<SwechaLogo />);

      expect(
        screen.queryByText('Technology for Society'),
      ).not.toBeInTheDocument();
    });
  });

  describe('Size Props', () => {
    it('should render with small size when size="sm"', () => {
      const { container } = render(<SwechaLogo size="sm" />);

      expect(container.querySelector('.text-xl')).toBeInTheDocument();
      expect(container.querySelector('.w-8')).toBeInTheDocument();
      expect(container.querySelector('.h-6')).toBeInTheDocument();
    });

    it('should render with medium size when size="md"', () => {
      const { container } = render(<SwechaLogo size="md" />);

      expect(container.querySelector('.text-3xl')).toBeInTheDocument();
      expect(container.querySelector('.w-12')).toBeInTheDocument();
      expect(container.querySelector('.h-9')).toBeInTheDocument();
    });

    it('should render with large size when size="lg"', () => {
      const { container } = render(<SwechaLogo size="lg" />);

      expect(container.querySelector('.text-4xl')).toBeInTheDocument();
      expect(container.querySelector('.w-16')).toBeInTheDocument();
      expect(container.querySelector('.h-12')).toBeInTheDocument();
    });

    it('should render with extra large size when size="xl"', () => {
      const { container } = render(<SwechaLogo size="xl" />);

      expect(container.querySelector('.text-5xl')).toBeInTheDocument();
      expect(container.querySelector('.w-20')).toBeInTheDocument();
      expect(container.querySelector('.h-15')).toBeInTheDocument();
    });
  });

  describe('Tagline Display', () => {
    it('should show tagline when showTagline=true', () => {
      render(<SwechaLogo showTagline />);

      expect(screen.getByText('Technology for Society')).toBeInTheDocument();
    });

    it('should not show tagline when showTagline=false', () => {
      render(<SwechaLogo showTagline={false} />);

      expect(
        screen.queryByText('Technology for Society'),
      ).not.toBeInTheDocument();
    });

    it('should apply correct tagline size for sm', () => {
      const { container } = render(<SwechaLogo size="sm" showTagline />);

      expect(container.querySelector('.text-\\[9px\\]')).toBeInTheDocument();
    });

    it('should apply correct tagline size for md', () => {
      const { container } = render(<SwechaLogo size="md" showTagline />);

      expect(container.querySelector('.text-xs')).toBeInTheDocument();
    });

    it('should apply correct tagline size for lg', () => {
      const { container } = render(<SwechaLogo size="lg" showTagline />);

      expect(container.querySelector('.text-sm')).toBeInTheDocument();
    });

    it('should apply correct tagline size for xl', () => {
      const { container } = render(<SwechaLogo size="xl" showTagline />);

      expect(container.querySelector('.text-base')).toBeInTheDocument();
    });
  });

  describe('Custom ClassName', () => {
    it('should apply custom className when provided', () => {
      const { container } = render(<SwechaLogo className="custom-class" />);

      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });

    it('should apply multiple custom classes', () => {
      const { container } = render(
        <SwechaLogo className="class1 class2 class3" />,
      );

      expect(container.querySelector('.class1')).toBeInTheDocument();
      expect(container.querySelector('.class2')).toBeInTheDocument();
      expect(container.querySelector('.class3')).toBeInTheDocument();
    });

    it('should work with Tailwind utility classes', () => {
      const { container } = render(
        <SwechaLogo className="mb-4 p-2 bg-white" />,
      );

      expect(container.querySelector('.mb-4')).toBeInTheDocument();
      expect(container.querySelector('.p-2')).toBeInTheDocument();
      expect(container.querySelector('.bg-white')).toBeInTheDocument();
    });
  });

  describe('SVG Structure', () => {
    it('should have correct viewBox for SVG', () => {
      const { container } = render(<SwechaLogo />);

      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('viewBox', '0 0 100 60');
    });

    it('should have correct xmlns attribute', () => {
      const { container } = render(<SwechaLogo />);

      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('xmlns', 'http://www.w3.org/2000/svg');
    });

    it('should render two bird paths', () => {
      const { container } = render(<SwechaLogo />);

      const paths = container.querySelectorAll('path');
      expect(paths).toHaveLength(4); // 2 birds × 2 paths each
    });

    it('should have black fill for birds', () => {
      const { container } = render(<SwechaLogo />);

      const birdPaths = container.querySelectorAll('path[fill="black"]');
      expect(birdPaths).toHaveLength(2);
    });
  });

  describe('Text Styling', () => {
    it('should have cursive font style', () => {
      const { container } = render(<SwechaLogo />);

      const textElement = container.querySelector('span');
      expect(textElement).toHaveStyle('font-style: italic');
    });

    it('should have bold font weight', () => {
      const { container } = render(<SwechaLogo />);

      const textElement = container.querySelector('span.font-bold');
      expect(textElement).toBeInTheDocument();
    });

    it('should have black text color', () => {
      const { container } = render(<SwechaLogo />);

      const textElement = container.querySelector('span.text-black');
      expect(textElement).toBeInTheDocument();
    });

    it('should have correct letter spacing', () => {
      const { container } = render(<SwechaLogo />);

      const textElement = container.querySelector('span');
      expect(textElement).toHaveStyle('letter-spacing: 0.02em');
    });
  });

  describe('Layout Structure', () => {
    it('should use flex layout for container', () => {
      const { container } = render(<SwechaLogo />);

      const containerElement = container.firstChild as HTMLElement;
      expect(containerElement).toHaveClass('flex');
      expect(containerElement).toHaveClass('items-center');
      expect(containerElement).toHaveClass('gap-3');
    });

    it('should use flex-col for text container', () => {
      const { container } = render(<SwechaLogo />);

      const textContainer = container.querySelectorAll('div.flex')[1];
      expect(textContainer).toHaveClass('flex-col');
    });
  });

  describe('Accessibility', () => {
    it('should have proper SVG accessibility', () => {
      const { container } = render(<SwechaLogo />);

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should render text content accessibly', () => {
      render(<SwechaLogo />);

      expect(screen.getByText('Swecha')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty className gracefully', () => {
      const { container } = render(<SwechaLogo className="" />);

      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle all size variants without errors', () => {
      const sizes: Array<'sm' | 'md' | 'lg' | 'xl'> = ['sm', 'md', 'lg', 'xl'];

      sizes.forEach((size) => {
        const { unmount } = render(<SwechaLogo size={size} />);
        expect(screen.getByText('Swecha')).toBeInTheDocument();
        unmount();
      });
    });

    it('should handle tagline with special characters in translation', () => {
      render(<SwechaLogo showTagline />);

      expect(screen.getByText('Technology for Society')).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    it('should render correctly with all props combined', () => {
      const { container } = render(
        <SwechaLogo size="lg" showTagline className="test-class" />,
      );

      expect(container.querySelector('.test-class')).toBeInTheDocument();
      expect(container.querySelector('.text-4xl')).toBeInTheDocument();
      expect(screen.getByText('Swecha')).toBeInTheDocument();
      expect(screen.getByText('Technology for Society')).toBeInTheDocument();
    });

    it('should maintain structure with different prop combinations', () => {
      const { container: container1 } = render(<SwechaLogo size="sm" />);
      const { container: container2 } = render(
        <SwechaLogo size="xl" showTagline />,
      );

      expect(container1.querySelector('.text-xl')).toBeInTheDocument();
      expect(container2.querySelector('.text-5xl')).toBeInTheDocument();
      expect(container2.querySelector('.text-base')).toBeInTheDocument();
    });
  });
});
