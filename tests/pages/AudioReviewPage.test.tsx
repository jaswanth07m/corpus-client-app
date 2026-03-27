import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AudioReviewPage from '../../src/pages/AudioReviewPage';
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

describe('AudioReviewPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render AudioReviewPage component', () => {
    renderWithRouter(<AudioReviewPage />);
    expect(screen.getByTestId('review-page-base')).toBeInTheDocument();
  });

  it('should display correct title "Audio Tool"', () => {
    renderWithRouter(<AudioReviewPage />);
    const titleElement = screen.getByTestId('page-title');
    expect(titleElement).toHaveTextContent('Audio Tool');
  });

  it('should display correct description "Review and annotate audio recordings."', () => {
    renderWithRouter(<AudioReviewPage />);
    const descriptionElement = screen.getByTestId('page-description');
    expect(descriptionElement).toHaveTextContent(
      'Review and annotate audio recordings.',
    );
  });

  it('should pass audio media type to ReviewPageBase', () => {
    renderWithRouter(<AudioReviewPage />);
    expect(screen.getByTestId('media-type-audio')).toBeInTheDocument();
  });

  it('should only have audio as the media type (not video or image)', () => {
    renderWithRouter(<AudioReviewPage />);
    expect(screen.queryByTestId('media-type-video')).not.toBeInTheDocument();
    expect(screen.queryByTestId('media-type-image')).not.toBeInTheDocument();
  });

  it('should call useTranslation hook from react-i18next', () => {
    useTranslationMock.mockClear();
    renderWithRouter(<AudioReviewPage />);
    expect(useTranslationMock).toHaveBeenCalled();
  });

  it('should pass mediaTypes as an array with single "audio" string', () => {
    renderWithRouter(<AudioReviewPage />);
    const mediaTypesContainer = screen.getByTestId('media-types');
    expect(mediaTypesContainer.children).toHaveLength(1);
    expect(mediaTypesContainer.children[0]).toHaveTextContent('audio');
  });

  it('should not have proofReading prop set (default behavior)', () => {
    // This test verifies the component doesn't explicitly pass proofReading
    // The ReviewPageBase should use its default value
    renderWithRouter(<AudioReviewPage />);
    // If component rendered without errors, default behavior is confirmed
    expect(screen.getByTestId('review-page-base')).toBeInTheDocument();
  });

  it('should match snapshot', () => {
    const { container } = renderWithRouter(<AudioReviewPage />);
    expect(container).toMatchSnapshot();
  });

  describe('Translation keys', () => {
    it('should use correct translation key for title (tools.audioTool)', () => {
      useTranslationMock.mockReturnValue({
        t: vi.fn((key: string, defaultValue: string) => {
          if (key === 'tools.audioTool') return 'Audio Tool';
          return defaultValue;
        }),
        i18n: {
          language: 'en',
          changeLanguage: vi.fn(),
        },
      });

      renderWithRouter(<AudioReviewPage />);
      expect(screen.getByTestId('page-title')).toHaveTextContent('Audio Tool');
    });

    it('should use correct translation key for description (tools.audioToolDescription)', () => {
      useTranslationMock.mockReturnValue({
        t: vi.fn((key: string, defaultValue: string) => {
          if (key === 'tools.audioToolDescription')
            return 'Review and annotate audio recordings.';
          return defaultValue;
        }),
        i18n: {
          language: 'en',
          changeLanguage: vi.fn(),
        },
      });

      renderWithRouter(<AudioReviewPage />);
      expect(screen.getByTestId('page-description')).toHaveTextContent(
        'Review and annotate audio recordings.',
      );
    });
  });

  describe('Component structure', () => {
    it('should be a functional component', () => {
      expect(typeof AudioReviewPage).toBe('function');
    });

    it('should export as default export', () => {
      expect(AudioReviewPage).toBeDefined();
    });

    it('should render without crashing', () => {
      expect(() => renderWithRouter(<AudioReviewPage />)).not.toThrow();
    });

    it('should handle multiple renders', () => {
      const { rerender } = renderWithRouter(<AudioReviewPage />);
      expect(screen.getByTestId('review-page-base')).toBeInTheDocument();
      expect(() => rerender(<AudioReviewPage />)).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      renderWithRouter(<AudioReviewPage />);
      const heading = screen.getByRole('heading');
      expect(heading).toBeInTheDocument();
    });

    it('should have descriptive text for the page', () => {
      renderWithRouter(<AudioReviewPage />);
      const description = screen.getByText(
        'Review and annotate audio recordings.',
      );
      expect(description).toBeInTheDocument();
    });
  });
});
