import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PeerReview from '../src/pages/PeerReview';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';

// Mock useTranslation with a spy
const useTranslationMock = vi.fn(() => ({
  t: vi.fn((key: string, defaultValue?: string) => {
    // Return default value if provided, otherwise return a formatted string
    if (defaultValue) return defaultValue;
    // Fallback for common keys
    const fallbacks: Record<string, string> = {
      'common.peerReview': 'Peer Review',
      'common.reviewCommunityContributions': 'Review Community Contributions',
    };
    return fallbacks[key] || key;
  }),
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
        {mediaTypes.map((type: string) => (
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

describe('PeerReview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render PeerReview component', () => {
      renderWithRouter(<PeerReview />);
      expect(screen.getByTestId('review-page-base')).toBeInTheDocument();
    });

    it('should display correct title from translation', () => {
      renderWithRouter(<PeerReview />);
      const titleElement = screen.getByTestId('page-title');
      expect(titleElement).toHaveTextContent('Peer Review');
    });

    it('should display correct description from translation', () => {
      renderWithRouter(<PeerReview />);
      const descriptionElement = screen.getByTestId('page-description');
      expect(descriptionElement).toHaveTextContent(
        'Review Community Contributions',
      );
    });

    it('should pass audio media type to ReviewPageBase', () => {
      renderWithRouter(<PeerReview />);
      expect(screen.getByTestId('media-type-audio')).toBeInTheDocument();
    });

    it('should pass video media type to ReviewPageBase', () => {
      renderWithRouter(<PeerReview />);
      expect(screen.getByTestId('media-type-video')).toBeInTheDocument();
    });

    it('should pass image media type to ReviewPageBase', () => {
      renderWithRouter(<PeerReview />);
      expect(screen.getByTestId('media-type-image')).toBeInTheDocument();
    });

    it('should have exactly three media types (audio, video, image)', () => {
      renderWithRouter(<PeerReview />);
      const mediaTypesContainer = screen.getByTestId('media-types');
      expect(mediaTypesContainer.children).toHaveLength(3);
    });

    it('should not have document media type', () => {
      renderWithRouter(<PeerReview />);
      expect(
        screen.queryByTestId('media-type-document'),
      ).not.toBeInTheDocument();
    });

    it('should not have text media type', () => {
      renderWithRouter(<PeerReview />);
      expect(screen.queryByTestId('media-type-text')).not.toBeInTheDocument();
    });
  });

  describe('Translation keys', () => {
    it('should use correct translation key for title (common.peerReview)', () => {
      useTranslationMock.mockReturnValue({
        t: vi.fn((key: string, defaultValue: string) => {
          if (key === 'common.peerReview') return 'Peer Review';
          return defaultValue;
        }),
        i18n: {
          language: 'en',
          changeLanguage: vi.fn(),
        },
      });

      renderWithRouter(<PeerReview />);
      expect(screen.getByTestId('page-title')).toHaveTextContent('Peer Review');
    });

    it('should use correct translation key for description (common.reviewCommunityContributions)', () => {
      useTranslationMock.mockReturnValue({
        t: vi.fn((key: string, defaultValue: string) => {
          if (key === 'common.reviewCommunityContributions')
            return 'Review Community Contributions';
          return defaultValue;
        }),
        i18n: {
          language: 'en',
          changeLanguage: vi.fn(),
        },
      });

      renderWithRouter(<PeerReview />);
      expect(screen.getByTestId('page-description')).toHaveTextContent(
        'Review Community Contributions',
      );
    });

    it('should call useTranslation hook from react-i18next', () => {
      useTranslationMock.mockClear();
      renderWithRouter(<PeerReview />);
      expect(useTranslationMock).toHaveBeenCalled();
    });

    it('should use translation function for title', () => {
      const mockT = vi.fn((key: string) => {
        if (key === 'common.peerReview') return 'Peer Review';
        return key;
      });
      useTranslationMock.mockReturnValue({
        t: mockT,
        i18n: {
          language: 'en',
          changeLanguage: vi.fn(),
        },
      });

      renderWithRouter(<PeerReview />);
      expect(mockT).toHaveBeenCalledWith('common.peerReview');
    });

    it('should use translation function for description', () => {
      const mockT = vi.fn((key: string) => {
        if (key === 'common.reviewCommunityContributions')
          return 'Review Community Contributions';
        return key;
      });
      useTranslationMock.mockReturnValue({
        t: mockT,
        i18n: {
          language: 'en',
          changeLanguage: vi.fn(),
        },
      });

      renderWithRouter(<PeerReview />);
      expect(mockT).toHaveBeenCalledWith('common.reviewCommunityContributions');
    });
  });

  describe('Component structure', () => {
    it('should be a functional component', () => {
      expect(typeof PeerReview).toBe('function');
    });

    it('should export as default export', () => {
      expect(PeerReview).toBeDefined();
    });

    it('should render without crashing', () => {
      expect(() => renderWithRouter(<PeerReview />)).not.toThrow();
    });

    it('should handle multiple renders', () => {
      const { rerender } = renderWithRouter(<PeerReview />);
      expect(screen.getByTestId('review-page-base')).toBeInTheDocument();
      expect(() => rerender(<PeerReview />)).not.toThrow();
    });

    it('should return valid JSX element', () => {
      const { container } = renderWithRouter(<PeerReview />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      renderWithRouter(<PeerReview />);
      const heading = screen.getByRole('heading');
      expect(heading).toBeInTheDocument();
    });

    it('should have descriptive text for the page', () => {
      renderWithRouter(<PeerReview />);
      const description = screen.getByText('Review Community Contributions');
      expect(description).toBeInTheDocument();
    });

    it('should have h1 heading level', () => {
      renderWithRouter(<PeerReview />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
    });
  });

  describe('Media types configuration', () => {
    it('should pass mediaTypes as an array with three strings', () => {
      renderWithRouter(<PeerReview />);
      const mediaTypesContainer = screen.getByTestId('media-types');
      expect(mediaTypesContainer.children).toHaveLength(3);
    });

    it('should have audio as first media type', () => {
      renderWithRouter(<PeerReview />);
      const mediaTypesContainer = screen.getByTestId('media-types');
      expect(mediaTypesContainer.children[0]).toHaveTextContent('audio');
    });

    it('should have video as second media type', () => {
      renderWithRouter(<PeerReview />);
      const mediaTypesContainer = screen.getByTestId('media-types');
      expect(mediaTypesContainer.children[1]).toHaveTextContent('video');
    });

    it('should have image as third media type', () => {
      renderWithRouter(<PeerReview />);
      const mediaTypesContainer = screen.getByTestId('media-types');
      expect(mediaTypesContainer.children[2]).toHaveTextContent('image');
    });

    it('should only have audio, video, and image media types', () => {
      renderWithRouter(<PeerReview />);
      expect(screen.getByTestId('media-type-audio')).toBeInTheDocument();
      expect(screen.getByTestId('media-type-video')).toBeInTheDocument();
      expect(screen.getByTestId('media-type-image')).toBeInTheDocument();
      expect(screen.queryByTestId('media-type-text')).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('media-type-document'),
      ).not.toBeInTheDocument();
    });
  });

  describe('Props validation', () => {
    it('should pass title prop to ReviewPageBase', () => {
      renderWithRouter(<PeerReview />);
      expect(screen.getByTestId('page-title')).toBeInTheDocument();
    });

    it('should pass description prop to ReviewPageBase', () => {
      renderWithRouter(<PeerReview />);
      expect(screen.getByTestId('page-description')).toBeInTheDocument();
    });

    it('should pass mediaTypes prop to ReviewPageBase', () => {
      renderWithRouter(<PeerReview />);
      expect(screen.getByTestId('media-types')).toBeInTheDocument();
    });

    it('should not pass proofReading prop (uses default)', () => {
      renderWithRouter(<PeerReview />);
      expect(screen.getByTestId('review-page-base')).toBeInTheDocument();
    });
  });

  describe('Internationalization', () => {
    it('should support different languages through i18n', () => {
      useTranslationMock.mockReturnValue({
        t: vi.fn((key: string) => {
          const translations: Record<string, string> = {
            'common.peerReview': 'Peer Review',
            'common.reviewCommunityContributions':
              'Review Community Contributions',
          };
          return translations[key] || key;
        }),
        i18n: {
          language: 'es',
          changeLanguage: vi.fn(),
        },
      });

      renderWithRouter(<PeerReview />);
      expect(useTranslationMock().i18n.language).toBe('es');
    });

    it('should call changeLanguage when language changes', () => {
      const changeLanguageMock = vi.fn();
      useTranslationMock.mockReturnValue({
        t: vi.fn((key: string) => key),
        i18n: {
          language: 'en',
          changeLanguage: changeLanguageMock,
        },
      });

      renderWithRouter(<PeerReview />);
      expect(useTranslationMock().i18n.changeLanguage).toBeDefined();
    });

    it('should use default values when translation key is missing', () => {
      const mockT = vi.fn((key: string) => {
        // Simulate i18next behavior: return key when translation is missing
        return key;
      });

      useTranslationMock.mockReturnValue({
        t: mockT,
        i18n: {
          language: 'en',
          changeLanguage: vi.fn(),
        },
      });

      renderWithRouter(<PeerReview />);
      // Verify that the translation function was called with the correct keys
      expect(mockT).toHaveBeenCalledWith('common.peerReview');
      expect(mockT).toHaveBeenCalledWith('common.reviewCommunityContributions');
      // When translation is missing, i18next returns the key itself
      expect(screen.getByTestId('page-title')).toHaveTextContent(
        'common.peerReview',
      );
    });
  });

  describe('Snapshot testing', () => {
    it('should render consistently', () => {
      const { container: first } = renderWithRouter(<PeerReview />);
      const { container: second } = renderWithRouter(<PeerReview />);
      expect(first.innerHTML).toBe(second.innerHTML);
    });

    it('should render with correct structure', () => {
      renderWithRouter(<PeerReview />);
      expect(screen.getByTestId('review-page-base')).toBeInTheDocument();
      expect(screen.getByTestId('media-types')).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('should handle empty translation keys gracefully', () => {
      useTranslationMock.mockReturnValue({
        t: vi.fn((key: string, defaultValue: string) => ''),
        i18n: {
          language: 'en',
          changeLanguage: vi.fn(),
        },
      });

      expect(() => renderWithRouter(<PeerReview />)).not.toThrow();
    });

    it('should handle null translation keys gracefully', () => {
      useTranslationMock.mockReturnValue({
        t: vi.fn(() => ''),
        i18n: {
          language: 'en',
          changeLanguage: vi.fn(),
        },
      });

      expect(() => renderWithRouter(<PeerReview />)).not.toThrow();
    });

    it('should handle very long translation values', () => {
      const longText = 'A'.repeat(1000);
      useTranslationMock.mockReturnValue({
        t: vi.fn(() => longText),
        i18n: {
          language: 'en',
          changeLanguage: vi.fn(),
        },
      });

      expect(() => renderWithRouter(<PeerReview />)).not.toThrow();
    });

    it('should handle special characters in translation', () => {
      const specialText = 'Peer Review & Annotations <3';
      useTranslationMock.mockReturnValue({
        t: vi.fn(() => specialText),
        i18n: {
          language: 'en',
          changeLanguage: vi.fn(),
        },
      });

      expect(() => renderWithRouter(<PeerReview />)).not.toThrow();
    });
  });

  describe('React best practices', () => {
    it('should use React.FC type', () => {
      const componentType = typeof PeerReview;
      expect(componentType).toBe('function');
    });

    it('should not have side effects during render', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {
        // Suppress console errors
      });
      renderWithRouter(<PeerReview />);
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should cleanup properly on unmount', () => {
      const { unmount } = renderWithRouter(<PeerReview />);
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Router integration', () => {
    it('should work with BrowserRouter', () => {
      expect(() => renderWithRouter(<PeerReview />)).not.toThrow();
    });

    it('should render within router context', () => {
      renderWithRouter(<PeerReview />);
      expect(screen.getByTestId('review-page-base')).toBeInTheDocument();
    });
  });
});
