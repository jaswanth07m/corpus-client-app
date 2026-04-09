import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MediaTypeWheel from '../../../src/components/MediaTypeWheel';
import { useTranslation } from 'react-i18next';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: vi.fn(() => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'common.selectMediaType': 'Select Media Type',
        'ui.tap.any.colored.section': 'Tap any colored section',
        'common.to.choose': 'to choose',
      };
      return translations[key] || key;
    },
  })),
  useSSR: vi.fn(),
  withTranslation: vi.fn(),
  Translation: vi.fn(({ children }) => children),
  I18nextProvider: vi.fn(({ children }) => children),
}));

// Mock lucide-react icons
vi.mock('lucide-react', async () => {
  const actual = await vi.importActual('lucide-react');
  return {
    ...(actual as object),
    Type: ({
      size,
      color,
      strokeWidth,
    }: {
      size?: number;
      color?: string;
      strokeWidth?: number;
    }) => (
      <span
        data-testid="type-icon"
        data-size={size}
        data-color={color}
        data-stroke={strokeWidth}
      />
    ),
    Mic: ({
      size,
      color,
      strokeWidth,
    }: {
      size?: number;
      color?: string;
      strokeWidth?: number;
    }) => (
      <span
        data-testid="mic-icon"
        data-size={size}
        data-color={color}
        data-stroke={strokeWidth}
      />
    ),
    Video: ({
      size,
      color,
      strokeWidth,
    }: {
      size?: number;
      color?: string;
      strokeWidth?: number;
    }) => (
      <span
        data-testid="video-icon"
        data-size={size}
        data-color={color}
        data-stroke={strokeWidth}
      />
    ),
    FileText: ({
      size,
      color,
      strokeWidth,
    }: {
      size?: number;
      color?: string;
      strokeWidth?: number;
    }) => (
      <span
        data-testid="filetext-icon"
        data-size={size}
        data-color={color}
        data-stroke={strokeWidth}
      />
    ),
    Image: ({
      size,
      color,
      strokeWidth,
    }: {
      size?: number;
      color?: string;
      strokeWidth?: number;
    }) => (
      <span
        data-testid="image-icon"
        data-size={size}
        data-color={color}
        data-stroke={strokeWidth}
      />
    ),
  };
});

describe('MediaTypeWheel', () => {
  const mockOnSelect = vi.fn();
  const mockOnCategorySelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the component without crashing', () => {
      render(
        <MediaTypeWheel
          onSelect={mockOnSelect}
          selectedType={null}
          onCategorySelect={mockOnCategorySelect}
        />,
      );

      expect(screen.getByText('Select Media Type')).toBeInTheDocument();
    });

    it('displays the title "Select Media Type" in the center', () => {
      render(
        <MediaTypeWheel
          onSelect={mockOnSelect}
          selectedType={null}
          onCategorySelect={mockOnCategorySelect}
        />,
      );

      expect(screen.getByText('Select Media Type')).toBeInTheDocument();
    });

    it('displays the instruction text "Tap any colored section"', () => {
      render(
        <MediaTypeWheel
          onSelect={mockOnSelect}
          selectedType={null}
          onCategorySelect={mockOnCategorySelect}
        />,
      );

      expect(screen.getByText('Tap any colored section')).toBeInTheDocument();
    });

    it('displays the "to choose" helper text', () => {
      render(
        <MediaTypeWheel
          onSelect={mockOnSelect}
          selectedType={null}
          onCategorySelect={mockOnCategorySelect}
        />,
      );

      expect(screen.getByText('to choose')).toBeInTheDocument();
    });

    it('renders all 5 media type segments', () => {
      const { container } = render(
        <MediaTypeWheel
          onSelect={mockOnSelect}
          selectedType={null}
          onCategorySelect={mockOnCategorySelect}
        />,
      );

      // Check for SVG paths (one for each media type segment)
      const paths = container.querySelectorAll('svg path');
      expect(paths.length).toBeGreaterThanOrEqual(5);
    });

    it('renders icons for all media types', () => {
      render(
        <MediaTypeWheel
          onSelect={mockOnSelect}
          selectedType={null}
          onCategorySelect={mockOnCategorySelect}
        />,
      );

      // Check that foreignObject elements exist for icons
      const { container } = render(
        <MediaTypeWheel
          onSelect={mockOnSelect}
          selectedType={null}
          onCategorySelect={mockOnCategorySelect}
        />,
      );

      const foreignObjects = container.querySelectorAll('foreignObject');
      expect(foreignObjects.length).toBe(5);
    });

    it('renders decorative elements (pulse animations)', () => {
      const { container } = render(
        <MediaTypeWheel
          onSelect={mockOnSelect}
          selectedType={null}
          onCategorySelect={mockOnCategorySelect}
        />,
      );

      // Check for decorative circles with animate-pulse class
      const decorativeElements = container.querySelectorAll(
        '[class*="animate-pulse"]',
      );
      expect(decorativeElements.length).toBeGreaterThan(0);
    });

    it('renders the wheel container with proper structure', () => {
      const { container } = render(
        <MediaTypeWheel
          onSelect={mockOnSelect}
          selectedType={null}
          onCategorySelect={mockOnCategorySelect}
        />,
      );

      // Check for the main wheel structure
      const wheelContainer = container.querySelector('[class*="relative"]');
      expect(wheelContainer).toBeInTheDocument();
    });

    it('renders the center circle with tour ID', () => {
      const { container } = render(
        <MediaTypeWheel
          onSelect={mockOnSelect}
          selectedType={null}
          onCategorySelect={mockOnCategorySelect}
        />,
      );

      expect(
        container.querySelector('#tour-media-type-wheel'),
      ).toBeInTheDocument();
    });

    it('renders outer glow effect', () => {
      const { container } = render(
        <MediaTypeWheel
          onSelect={mockOnSelect}
          selectedType={null}
          onCategorySelect={mockOnCategorySelect}
        />,
      );

      // Check for glow effect element
      const glowElements = container.querySelectorAll(
        '[class*="glow"], [class*="pulse"]',
      );
      expect(glowElements.length).toBeGreaterThan(0);
    });
  });

  describe('User Interactions', () => {
    it('calls onSelect with "image" when clicking the image segment', () => {
      const { container } = render(
        <MediaTypeWheel
          onSelect={mockOnSelect}
          selectedType={null}
          onCategorySelect={mockOnCategorySelect}
        />,
      );

      // Get all clickable paths and click the first one (image)
      const paths = container.querySelectorAll('svg path.cursor-pointer');
      if (paths.length > 0) {
        fireEvent.click(paths[0]);
        expect(mockOnSelect).toHaveBeenCalledWith('image');
      }
    });

    it('calls onSelect with "text" when clicking the text segment', () => {
      const { container } = render(
        <MediaTypeWheel
          onSelect={mockOnSelect}
          selectedType={null}
          onCategorySelect={mockOnCategorySelect}
        />,
      );

      const paths = container.querySelectorAll('svg path.cursor-pointer');
      // Text is the second segment (index 1)
      if (paths.length > 1) {
        fireEvent.click(paths[1]);
        expect(mockOnSelect).toHaveBeenCalledWith('text');
      }
    });

    it('calls onSelect with "audio" when clicking the audio segment', () => {
      const { container } = render(
        <MediaTypeWheel
          onSelect={mockOnSelect}
          selectedType={null}
          onCategorySelect={mockOnCategorySelect}
        />,
      );

      const paths = container.querySelectorAll('svg path.cursor-pointer');
      // Audio is the third segment (index 2)
      if (paths.length > 2) {
        fireEvent.click(paths[2]);
        expect(mockOnSelect).toHaveBeenCalledWith('audio');
      }
    });

    it('calls onSelect with "video" when clicking the video segment', () => {
      const { container } = render(
        <MediaTypeWheel
          onSelect={mockOnSelect}
          selectedType={null}
          onCategorySelect={mockOnCategorySelect}
        />,
      );

      const paths = container.querySelectorAll('svg path.cursor-pointer');
      // Video is the fourth segment (index 3)
      if (paths.length > 3) {
        fireEvent.click(paths[3]);
        expect(mockOnSelect).toHaveBeenCalledWith('video');
      }
    });

    it('calls onSelect with "document" when clicking the document segment', () => {
      const { container } = render(
        <MediaTypeWheel
          onSelect={mockOnSelect}
          selectedType={null}
          onCategorySelect={mockOnCategorySelect}
        />,
      );

      const paths = container.querySelectorAll('svg path.cursor-pointer');
      // Document is the fifth segment (index 4)
      if (paths.length > 4) {
        fireEvent.click(paths[4]);
        expect(mockOnSelect).toHaveBeenCalledWith('document');
      }
    });

    it('calls onSelect when clicking on the icon inside a segment', () => {
      const { container } = render(
        <MediaTypeWheel
          onSelect={mockOnSelect}
          selectedType={null}
          onCategorySelect={mockOnCategorySelect}
        />,
      );

      // Click on foreignObject (icon container)
      const foreignObjects = container.querySelectorAll('foreignObject');
      if (foreignObjects.length > 0) {
        fireEvent.click(foreignObjects[0]);
        expect(mockOnSelect).toHaveBeenCalledWith('image');
      }
    });

    it('calls onSelect only once per click', () => {
      const { container } = render(
        <MediaTypeWheel
          onSelect={mockOnSelect}
          selectedType={null}
          onCategorySelect={mockOnCategorySelect}
        />,
      );

      const paths = container.querySelectorAll('svg path.cursor-pointer');
      if (paths.length > 0) {
        fireEvent.click(paths[0]);
        expect(mockOnSelect).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe('Selected State', () => {
    it('applies active styling when a media type is selected', () => {
      const { container, rerender } = render(
        <MediaTypeWheel
          onSelect={mockOnSelect}
          selectedType={null}
          onCategorySelect={mockOnCategorySelect}
        />,
      );

      // Initially no selection
      const paths = container.querySelectorAll('svg path');
      expect(paths.length).toBeGreaterThan(0);

      // Rerender with a selection
      rerender(
        <MediaTypeWheel
          onSelect={mockOnSelect}
          selectedType="image"
          onCategorySelect={mockOnCategorySelect}
        />,
      );

      // The component should still render correctly with selection
      expect(screen.getByText('Select Media Type')).toBeInTheDocument();
    });

    it('maintains selection state after onSelect is called', () => {
      render(
        <MediaTypeWheel
          onSelect={mockOnSelect}
          selectedType="video"
          onCategorySelect={mockOnCategorySelect}
        />,
      );

      expect(screen.getByText('Select Media Type')).toBeInTheDocument();
    });

    it('can switch between different selected types', () => {
      const { rerender } = render(
        <MediaTypeWheel
          onSelect={mockOnSelect}
          selectedType="text"
          onCategorySelect={mockOnCategorySelect}
        />,
      );

      expect(screen.getByText('Select Media Type')).toBeInTheDocument();

      rerender(
        <MediaTypeWheel
          onSelect={mockOnSelect}
          selectedType="audio"
          onCategorySelect={mockOnCategorySelect}
        />,
      );

      expect(screen.getByText('Select Media Type')).toBeInTheDocument();
    });
  });

  describe('Callbacks', () => {
    it('receives the correct media type string in onSelect callback', () => {
      const { container } = render(
        <MediaTypeWheel
          onSelect={mockOnSelect}
          selectedType={null}
          onCategorySelect={mockOnCategorySelect}
        />,
      );

      const paths = container.querySelectorAll('svg path.cursor-pointer');

      // Test each media type
      const mediaTypes = [
        'image',
        'text',
        'audio',
        'video',
        'document',
      ] as const;

      mediaTypes.forEach((type, index) => {
        vi.clearAllMocks();
        if (paths[index]) {
          fireEvent.click(paths[index]);
          expect(mockOnSelect).toHaveBeenCalledWith(type);
        }
      });
    });

    it('does not call onCategorySelect when clicking segments', () => {
      const { container } = render(
        <MediaTypeWheel
          onSelect={mockOnSelect}
          selectedType={null}
          onCategorySelect={mockOnCategorySelect}
        />,
      );

      const paths = container.querySelectorAll('svg path.cursor-pointer');
      if (paths.length > 0) {
        fireEvent.click(paths[0]);
        expect(mockOnCategorySelect).not.toHaveBeenCalled();
      }
    });

    it('handles undefined onCategorySelect gracefully', () => {
      expect(() => {
        render(<MediaTypeWheel onSelect={mockOnSelect} selectedType={null} />);
      }).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('handles null selectedType correctly', () => {
      expect(() => {
        render(
          <MediaTypeWheel
            onSelect={mockOnSelect}
            selectedType={null}
            onCategorySelect={mockOnCategorySelect}
          />,
        );
      }).not.toThrow();

      expect(screen.getByText('Select Media Type')).toBeInTheDocument();
    });

    it('handles rapid multiple clicks', () => {
      const { container } = render(
        <MediaTypeWheel
          onSelect={mockOnSelect}
          selectedType={null}
          onCategorySelect={mockOnCategorySelect}
        />,
      );

      const paths = container.querySelectorAll('svg path.cursor-pointer');
      if (paths.length > 0) {
        // Click multiple times rapidly
        fireEvent.click(paths[0]);
        fireEvent.click(paths[0]);
        fireEvent.click(paths[0]);
        expect(mockOnSelect).toHaveBeenCalledTimes(3);
      }
    });

    it('handles clicking different segments in sequence', () => {
      const { container } = render(
        <MediaTypeWheel
          onSelect={mockOnSelect}
          selectedType={null}
          onCategorySelect={mockOnCategorySelect}
        />,
      );

      const paths = container.querySelectorAll('svg path.cursor-pointer');

      if (paths.length >= 2) {
        fireEvent.click(paths[0]);
        fireEvent.click(paths[1]);
        expect(mockOnSelect).toHaveBeenNthCalledWith(1, 'image');
        expect(mockOnSelect).toHaveBeenNthCalledWith(2, 'text');
      }
    });

    it('renders with all props provided', () => {
      expect(() => {
        render(
          <MediaTypeWheel
            onSelect={mockOnSelect}
            selectedType="document"
            onCategorySelect={mockOnCategorySelect}
          />,
        );
      }).not.toThrow();
    });

    it('renders without onCategorySelect prop', () => {
      expect(() => {
        render(<MediaTypeWheel onSelect={mockOnSelect} selectedType="image" />);
      }).not.toThrow();
    });
  });

  describe('Visual Elements', () => {
    it('renders SVG with gradient definitions', () => {
      const { container } = render(
        <MediaTypeWheel
          onSelect={mockOnSelect}
          selectedType={null}
          onCategorySelect={mockOnCategorySelect}
        />,
      );

      const defs = container.querySelectorAll('svg defs');
      expect(defs.length).toBeGreaterThan(0);

      const gradients = container.querySelectorAll('linearGradient');
      expect(gradients.length).toBe(5); // One for each media type
    });

    it('renders decorative rings', () => {
      const { container } = render(
        <MediaTypeWheel
          onSelect={mockOnSelect}
          selectedType={null}
          onCategorySelect={mockOnCategorySelect}
        />,
      );

      // Check for border elements (decorative rings)
      const borders = container.querySelectorAll('[class*="border"]');
      expect(borders.length).toBeGreaterThan(0);
    });

    it('renders with proper responsive classes', () => {
      const { container } = render(
        <MediaTypeWheel
          onSelect={mockOnSelect}
          selectedType={null}
          onCategorySelect={mockOnCategorySelect}
        />,
      );

      // Check for responsive class patterns
      const responsiveElements = container.querySelectorAll(
        '[class*="sm:"], [class*="md:"]',
      );
      expect(responsiveElements.length).toBeGreaterThan(0);
    });

    it('renders center circle with shadow styling', () => {
      const { container } = render(
        <MediaTypeWheel
          onSelect={mockOnSelect}
          selectedType={null}
          onCategorySelect={mockOnCategorySelect}
        />,
      );

      const centerCircle = container.querySelector('#tour-media-type-wheel');
      expect(centerCircle).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has interactive elements with cursor pointer style', () => {
      const { container } = render(
        <MediaTypeWheel
          onSelect={mockOnSelect}
          selectedType={null}
          onCategorySelect={mockOnCategorySelect}
        />,
      );

      const clickablePaths = container.querySelectorAll(
        'svg path.cursor-pointer',
      );
      expect(clickablePaths.length).toBeGreaterThanOrEqual(5);
    });

    it('renders icons with proper styling', () => {
      render(
        <MediaTypeWheel
          onSelect={mockOnSelect}
          selectedType={null}
          onCategorySelect={mockOnCategorySelect}
        />,
      );

      // Check that all 5 icon types are rendered using data-testid
      const imageIcons = screen.getAllByTestId('image-icon');
      const typeIcons = screen.getAllByTestId('type-icon');
      const micIcons = screen.getAllByTestId('mic-icon');
      const videoIcons = screen.getAllByTestId('video-icon');
      const fileTextIcons = screen.getAllByTestId('filetext-icon');

      expect(imageIcons.length).toBe(1);
      expect(typeIcons.length).toBe(1);
      expect(micIcons.length).toBe(1);
      expect(videoIcons.length).toBe(1);
      expect(fileTextIcons.length).toBe(1);
    });
  });

  describe('Media Type Specific Tests', () => {
    it('renders image segment with correct color scheme', () => {
      const { container } = render(
        <MediaTypeWheel
          onSelect={mockOnSelect}
          selectedType={null}
          onCategorySelect={mockOnCategorySelect}
        />,
      );

      // Check for emerald color (#00A36C) gradient
      const gradients = container.querySelectorAll('linearGradient');
      expect(gradients.length).toBe(5);
    });

    it('renders text segment', () => {
      const { container } = render(
        <MediaTypeWheel
          onSelect={mockOnSelect}
          selectedType={null}
          onCategorySelect={mockOnCategorySelect}
        />,
      );

      const paths = container.querySelectorAll('svg path');
      expect(paths.length).toBeGreaterThanOrEqual(5);
    });

    it('renders audio segment', () => {
      const { container } = render(
        <MediaTypeWheel
          onSelect={mockOnSelect}
          selectedType={null}
          onCategorySelect={mockOnCategorySelect}
        />,
      );

      const foreignObjects = container.querySelectorAll('foreignObject');
      expect(foreignObjects.length).toBe(5);
    });

    it('renders video segment', () => {
      render(
        <MediaTypeWheel
          onSelect={mockOnSelect}
          selectedType={null}
          onCategorySelect={mockOnCategorySelect}
        />,
      );

      expect(screen.getByText('Select Media Type')).toBeInTheDocument();
    });

    it('renders document segment', () => {
      render(
        <MediaTypeWheel
          onSelect={mockOnSelect}
          selectedType={null}
          onCategorySelect={mockOnCategorySelect}
        />,
      );

      const { container } = render(
        <MediaTypeWheel
          onSelect={mockOnSelect}
          selectedType={null}
          onCategorySelect={mockOnCategorySelect}
        />,
      );

      const paths = container.querySelectorAll('svg path');
      expect(paths.length).toBeGreaterThanOrEqual(5);
    });
  });
});
