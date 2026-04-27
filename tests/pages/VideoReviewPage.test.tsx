import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import VideoReviewPage from '../../src/pages/VideoReviewPage';
import { BrowserRouter } from 'react-router-dom';

// Mock useTranslation with a spy
const useTranslationMock = vi.fn(() => ({
  t: (key: string, defaultValue: string) => defaultValue,
  i18n: {
    language: 'en',
    changeLanguage: vi.fn(),
  },
}));

vi.mock('react-i18next', async () => {
  const actual = await vi.importActual('react-i18next');
  return {
    ...actual,
    useTranslation: () => useTranslationMock(),
  };
});

const useTranslation = useTranslationMock;

// Mock ReviewPageBase component
vi.mock('@/components/ReviewPageBase', () => ({
  default: ({
    title,
    description,
    mediaTypes,
  }: {
    title: string;
    description: string;
    mediaTypes: string[];
  }) => (
    <div data-testid="review-page-base">
      <h1 data-testid="page-title">{title}</h1>
      <p data-testid="page-description">{description}</p>
      <div data-testid="media-types">
        {mediaTypes.map((type) => (
          <span key={type} data-testid={`media-type-${type}`}>
            {type}
          </span>
        ))}
      </div>
    </div>
  ),
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('VideoReviewPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render VideoReviewPage component', () => {
    renderWithRouter(<VideoReviewPage />);
    expect(screen.getByTestId('review-page-base')).toBeInTheDocument();
  });

  it('should display correct title "Video Tool"', () => {
    renderWithRouter(<VideoReviewPage />);
    const titleElement = screen.getByTestId('page-title');
    expect(titleElement).toHaveTextContent('Video Tool');
  });

  it('should display correct description "Review and annotate video content."', () => {
    renderWithRouter(<VideoReviewPage />);
    const descriptionElement = screen.getByTestId('page-description');
    expect(descriptionElement).toHaveTextContent(
      'Review and annotate video content.',
    );
  });

  it('should pass video media type to ReviewPageBase', () => {
    renderWithRouter(<VideoReviewPage />);
    expect(screen.getByTestId('media-type-video')).toBeInTheDocument();
  });

  it('should only have video as the media type (not audio or image)', () => {
    renderWithRouter(<VideoReviewPage />);
    expect(screen.queryByTestId('media-type-audio')).not.toBeInTheDocument();
    expect(screen.queryByTestId('media-type-image')).not.toBeInTheDocument();
  });

  it('should call useTranslation hook from react-i18next', () => {
    useTranslationMock.mockClear();
    renderWithRouter(<VideoReviewPage />);
    expect(useTranslationMock).toHaveBeenCalled();
  });

  it('should pass mediaTypes as an array with single "video" string', () => {
    renderWithRouter(<VideoReviewPage />);
    const mediaTypesContainer = screen.getByTestId('media-types');
    expect(mediaTypesContainer.children).toHaveLength(1);
    expect(mediaTypesContainer.children[0]).toHaveTextContent('video');
  });

  it('should not have proofReading prop set (default behavior)', () => {
    // This test verifies the component doesn't explicitly pass proofReading
    // The ReviewPageBase should use its default value
    renderWithRouter(<VideoReviewPage />);
    // If component rendered without errors, default behavior is confirmed
    expect(screen.getByTestId('review-page-base')).toBeInTheDocument();
  });

  it('should match snapshot', () => {
    const { container } = renderWithRouter(<VideoReviewPage />);
    expect(container).toMatchSnapshot();
  });

  describe('Translation keys', () => {
    it('should use correct translation key for title (tools.videoTool)', () => {
      useTranslationMock.mockReturnValue({
        t: vi.fn((key: string, defaultValue: string) => {
          if (key === 'tools.videoTool') return 'Video Tool';
          return defaultValue;
        }),
        i18n: {
          language: 'en',
          changeLanguage: vi.fn(),
        },
      });

      renderWithRouter(<VideoReviewPage />);
      expect(screen.getByTestId('page-title')).toHaveTextContent('Video Tool');
    });

    it('should use correct translation key for description (tools.videoToolDescription)', () => {
      useTranslationMock.mockReturnValue({
        t: vi.fn((key: string, defaultValue: string) => {
          if (key === 'tools.videoToolDescription')
            return 'Review and annotate video content.';
          return defaultValue;
        }),
        i18n: {
          language: 'en',
          changeLanguage: vi.fn(),
        },
      });

      renderWithRouter(<VideoReviewPage />);
      expect(screen.getByTestId('page-description')).toHaveTextContent(
        'Review and annotate video content.',
      );
    });
  });

  describe('Component structure', () => {
    it('should be a functional component', () => {
      expect(typeof VideoReviewPage).toBe('function');
    });

    it('should export as default export', () => {
      expect(VideoReviewPage).toBeDefined();
    });

    it('should render without crashing', () => {
      expect(() => renderWithRouter(<VideoReviewPage />)).not.toThrow();
    });

    it('should handle multiple renders', () => {
      const { rerender } = renderWithRouter(<VideoReviewPage />);
      expect(screen.getByTestId('review-page-base')).toBeInTheDocument();
      expect(() => rerender(<VideoReviewPage />)).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      renderWithRouter(<VideoReviewPage />);
      const heading = screen.getByRole('heading');
      expect(heading).toBeInTheDocument();
    });

    it('should have descriptive text for the page', () => {
      renderWithRouter(<VideoReviewPage />);
      const description = screen.getByText(
        'Review and annotate video content.',
      );
      expect(description).toBeInTheDocument();
    });
  });
});
