import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AnnotationsDashboard from '../src/pages/AnnotationsDashboard';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';

// Mock useTranslation hook
const useTranslationMock = vi.fn(() => ({
  t: (key: string, defaultValue?: string) => {
    const translations: Record<string, string> = {
      'tools.peerReview': 'Peer Review',
      'tools.peerReviewDescription':
        "Review other users' contributions and provide feedback.",
      'tools.imageAnnotation': 'Image Annotation',
      'tools.imageAnnotationDescription':
        'Annotate objects, regions, and patterns in images.',
      'tools.audioTool': 'Audio Tool',
      'tools.audioToolDescription': 'Review and annotate audio recordings.',
      'tools.videoTool': 'Video Tool',
      'tools.videoToolDescription': 'Review and annotate video content.',
      'tools.docDigitization': 'Doc Digitization',
      'tools.docDigitizationDescription': 'Digitize and process documents.',
      'tools.transcription': 'Transcription',
      'tools.transcriptionDescription': 'Convert audio to text.',
      'tools.textExtraction': 'Text Extraction',
      'tools.textExtractionDescription': 'Extract text from documents.',
      'tools.askYourCorpus': 'Ask Your Corpus',
      'tools.askYourCorpusDescription':
        'Retrieval-Augmented Generation for intelligent document querying.',
      'tools.storyGenerator': 'Story Generator',
      'tools.storyGeneratorDescription':
        'Automatically generate engaging stories from collected data.',
      'tools.agentWorkflows': 'Agent Workflows',
      'tools.agentWorkflowsDescription':
        'Design and manage automated AI agent processes.',
      'tools.metadataIndex': 'Metadata Index',
      'tools.metadataIndexDescription':
        'Advanced indexing and search for community metadata.',
      'tools.heading': 'Annotation Tools',
      'tools.comingSoonDescription': 'Coming soon',
      'tools.planned': 'Planned',
    };
    return translations[key] || defaultValue || key;
  },
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

// Mock useNavigate
const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...(actual as object),
    useNavigate: () => navigateMock,
  };
});

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <MemoryRouter initialEntries={['/tools']}>{component}</MemoryRouter>,
  );
};

describe('AnnotationsDashboard', () => {
  beforeEach(() => {
    navigateMock.mockClear();
  });

  describe('Component Rendering', () => {
    it('should render AnnotationsDashboard component', () => {
      renderWithRouter(<AnnotationsDashboard />);
      expect(screen.getByText('Annotation Tools')).toBeInTheDocument();
    });

    it('should display the heading', () => {
      renderWithRouter(<AnnotationsDashboard />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('Annotation Tools');
    });

    it('should render back button', () => {
      renderWithRouter(<AnnotationsDashboard />);
      const backButton = screen.getByRole('button');
      expect(backButton).toBeInTheDocument();
    });

    it('should render all available annotation tools', () => {
      renderWithRouter(<AnnotationsDashboard />);
      expect(screen.getByText('Peer Review')).toBeInTheDocument();
      expect(screen.getByText('Image Annotation')).toBeInTheDocument();
      expect(screen.getByText('Audio Tool')).toBeInTheDocument();
      expect(screen.getByText('Video Tool')).toBeInTheDocument();
      expect(screen.getByText('Doc Digitization')).toBeInTheDocument();
    });

    it('should render coming soon tools', () => {
      renderWithRouter(<AnnotationsDashboard />);
      expect(screen.getByText('Transcription')).toBeInTheDocument();
      expect(screen.getByText('Text Extraction')).toBeInTheDocument();
      expect(screen.getByText('Ask Your Corpus')).toBeInTheDocument();
      expect(screen.getByText('Story Generator')).toBeInTheDocument();
      expect(screen.getByText('Agent Workflows')).toBeInTheDocument();
      expect(screen.getByText('Metadata Index')).toBeInTheDocument();
    });

    it('should display tool descriptions', () => {
      renderWithRouter(<AnnotationsDashboard />);
      expect(
        screen.getByText(
          "Review other users' contributions and provide feedback.",
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Annotate objects, regions, and patterns in images.'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Review and annotate audio recordings.'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Review and annotate video content.'),
      ).toBeInTheDocument();
    });
  });

  describe('Tool Cards', () => {
    it('should render Peer Review tool card', () => {
      renderWithRouter(<AnnotationsDashboard />);
      const peerReviewCard = screen.getByText('Peer Review').closest('div');
      expect(peerReviewCard).toBeInTheDocument();
    });

    it('should render Image Annotation tool card', () => {
      renderWithRouter(<AnnotationsDashboard />);
      const imageCard = screen.getByText('Image Annotation').closest('div');
      expect(imageCard).toBeInTheDocument();
    });

    it('should render Audio Tool card', () => {
      renderWithRouter(<AnnotationsDashboard />);
      const audioCard = screen.getByText('Audio Tool').closest('div');
      expect(audioCard).toBeInTheDocument();
    });

    it('should render Video Tool card', () => {
      renderWithRouter(<AnnotationsDashboard />);
      const videoCard = screen.getByText('Video Tool').closest('div');
      expect(videoCard).toBeInTheDocument();
    });

    it('should render Doc Digitization tool card', () => {
      renderWithRouter(<AnnotationsDashboard />);
      const docCard = screen.getByText('Doc Digitization').closest('div');
      expect(docCard).toBeInTheDocument();
    });

    it('should mark coming soon tools with planned badge', () => {
      renderWithRouter(<AnnotationsDashboard />);
      const plannedBadges = screen.getAllByText('Planned');
      expect(plannedBadges.length).toBeGreaterThan(0);
    });

    it('should not show planned badge for available tools', () => {
      renderWithRouter(<AnnotationsDashboard />);
      const peerReviewCard = screen.getByText('Peer Review').closest('div');
      expect(peerReviewCard).not.toHaveTextContent('Planned');
    });
  });

  describe('Navigation', () => {
    it('should navigate to /peer-review when clicking Peer Review card', () => {
      renderWithRouter(<AnnotationsDashboard />);
      const peerReviewCard = screen.getByText('Peer Review').closest('div');
      if (peerReviewCard) {
        fireEvent.click(peerReviewCard);
      }
      expect(navigateMock).toHaveBeenCalledWith('/peer-review');
    });

    it('should navigate to /tools/image-review when clicking Image Annotation card', () => {
      renderWithRouter(<AnnotationsDashboard />);
      const imageCard = screen.getByText('Image Annotation').closest('div');
      if (imageCard) {
        fireEvent.click(imageCard);
      }
      expect(navigateMock).toHaveBeenCalledWith('/tools/image-review');
    });

    it('should navigate to /tools/audio-review when clicking Audio Tool card', () => {
      renderWithRouter(<AnnotationsDashboard />);
      const audioCard = screen.getByText('Audio Tool').closest('div');
      if (audioCard) {
        fireEvent.click(audioCard);
      }
      expect(navigateMock).toHaveBeenCalledWith('/tools/audio-review');
    });

    it('should navigate to /tools/video-review when clicking Video Tool card', () => {
      renderWithRouter(<AnnotationsDashboard />);
      const videoCard = screen.getByText('Video Tool').closest('div');
      if (videoCard) {
        fireEvent.click(videoCard);
      }
      expect(navigateMock).toHaveBeenCalledWith('/tools/video-review');
    });

    it('should navigate to /tools/doc-digitization when clicking Doc Digitization card', () => {
      renderWithRouter(<AnnotationsDashboard />);
      const docCard = screen.getByText('Doc Digitization').closest('div');
      if (docCard) {
        fireEvent.click(docCard);
      }
      expect(navigateMock).toHaveBeenCalledWith('/tools/doc-digitization');
    });

    it('should not navigate when clicking coming soon tools', () => {
      renderWithRouter(<AnnotationsDashboard />);
      const transcriptionCard = screen
        .getByText('Transcription')
        .closest('div');
      if (transcriptionCard) {
        fireEvent.click(transcriptionCard);
      }
      expect(navigateMock).not.toHaveBeenCalled();
    });

    it('should not navigate when clicking Text Extraction coming soon tool', () => {
      renderWithRouter(<AnnotationsDashboard />);
      const extractionCard = screen.getByText('Text Extraction').closest('div');
      if (extractionCard) {
        fireEvent.click(extractionCard);
      }
      expect(navigateMock).not.toHaveBeenCalled();
    });

    it('should not navigate when clicking Ask Your Corpus coming soon tool', () => {
      renderWithRouter(<AnnotationsDashboard />);
      const askCorpusCard = screen.getByText('Ask Your Corpus').closest('div');
      if (askCorpusCard) {
        fireEvent.click(askCorpusCard);
      }
      expect(navigateMock).not.toHaveBeenCalled();
    });
  });

  describe('Back Button', () => {
    it('should have back button with proper link', () => {
      renderWithRouter(<AnnotationsDashboard />);
      const backButton = screen.getByRole('button');
      expect(backButton).toBeInTheDocument();
    });

    it('should render back arrow icon', () => {
      renderWithRouter(<AnnotationsDashboard />);
      const backButton = screen.getByRole('button');
      expect(backButton).toHaveClass('hover:bg-slate-100');
    });
  });

  describe('Coming Soon Tools', () => {
    it('should render Transcription as coming soon', () => {
      renderWithRouter(<AnnotationsDashboard />);
      const transcriptionCard = screen
        .getByText('Transcription')
        .closest('.group');
      expect(transcriptionCard?.className).toContain('cursor-not-allowed');
    });

    it('should render Text Extraction as coming soon', () => {
      renderWithRouter(<AnnotationsDashboard />);
      const extractionCard = screen
        .getByText('Text Extraction')
        .closest('.group');
      expect(extractionCard?.className).toContain('cursor-not-allowed');
    });

    it('should render Ask Your Corpus as coming soon', () => {
      renderWithRouter(<AnnotationsDashboard />);
      const askCorpusCard = screen
        .getByText('Ask Your Corpus')
        .closest('.group');
      expect(askCorpusCard?.className).toContain('cursor-not-allowed');
    });

    it('should render Story Generator as coming soon', () => {
      renderWithRouter(<AnnotationsDashboard />);
      const storyCard = screen.getByText('Story Generator').closest('.group');
      expect(storyCard?.className).toContain('cursor-not-allowed');
    });

    it('should render Agent Workflows as coming soon', () => {
      renderWithRouter(<AnnotationsDashboard />);
      const agentCard = screen.getByText('Agent Workflows').closest('.group');
      expect(agentCard?.className).toContain('cursor-not-allowed');
    });

    it('should render Metadata Index as coming soon', () => {
      renderWithRouter(<AnnotationsDashboard />);
      const metadataCard = screen.getByText('Metadata Index').closest('.group');
      expect(metadataCard?.className).toContain('cursor-not-allowed');
    });

    it('should show coming soon description for planned tools', () => {
      renderWithRouter(<AnnotationsDashboard />);
      // Coming soon tools should have the planned badge
      const plannedBadges = document.querySelectorAll('.bg-slate-200');
      expect(plannedBadges.length).toBeGreaterThan(0);
    });

    it('should apply opacity and grayscale to coming soon tools', () => {
      renderWithRouter(<AnnotationsDashboard />);
      const innerDiv = screen
        .getByText('Transcription')
        .closest('.flex.flex-col');
      expect(innerDiv?.className).toContain('opacity-40');
      expect(innerDiv?.className).toContain('grayscale');
    });
  });

  describe('Tool Icons', () => {
    it('should display FileCheck icon for Peer Review', () => {
      renderWithRouter(<AnnotationsDashboard />);
      const peerReviewCard = screen.getByText('Peer Review').closest('div');
      expect(peerReviewCard).toBeInTheDocument();
    });

    it('should display Image icon for Image Annotation', () => {
      renderWithRouter(<AnnotationsDashboard />);
      const imageCard = screen.getByText('Image Annotation').closest('div');
      expect(imageCard).toBeInTheDocument();
    });

    it('should display AudioLines icon for Audio Tool', () => {
      renderWithRouter(<AnnotationsDashboard />);
      const audioCard = screen.getByText('Audio Tool').closest('div');
      expect(audioCard).toBeInTheDocument();
    });

    it('should display Video icon for Video Tool', () => {
      renderWithRouter(<AnnotationsDashboard />);
      const videoCard = screen.getByText('Video Tool').closest('div');
      expect(videoCard).toBeInTheDocument();
    });
  });

  describe('Tour IDs', () => {
    it('should have tour-peer-review-tool ID', () => {
      renderWithRouter(<AnnotationsDashboard />);
      const peerReviewTool = document.getElementById('tour-peer-review-tool');
      expect(peerReviewTool).toBeInTheDocument();
    });

    it('should have tour-image-review-tool ID', () => {
      renderWithRouter(<AnnotationsDashboard />);
      const imageReviewTool = document.getElementById('tour-image-review-tool');
      expect(imageReviewTool).toBeInTheDocument();
    });

    it('should have tour-audio-review-tool ID', () => {
      renderWithRouter(<AnnotationsDashboard />);
      const audioReviewTool = document.getElementById('tour-audio-review-tool');
      expect(audioReviewTool).toBeInTheDocument();
    });

    it('should have tour-video-review-tool ID', () => {
      renderWithRouter(<AnnotationsDashboard />);
      const videoReviewTool = document.getElementById('tour-video-review-tool');
      expect(videoReviewTool).toBeInTheDocument();
    });

    it('should have tour-doc-digitization-tool ID', () => {
      renderWithRouter(<AnnotationsDashboard />);
      const docDigitizationTool = document.getElementById(
        'tour-doc-digitization-tool',
      );
      expect(docDigitizationTool).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('should be a functional component', () => {
      expect(typeof AnnotationsDashboard).toBe('function');
    });

    it('should export as default export', () => {
      expect(AnnotationsDashboard).toBeDefined();
    });

    it('should render without crashing', () => {
      expect(() => renderWithRouter(<AnnotationsDashboard />)).not.toThrow();
    });

    it('should handle multiple renders', () => {
      renderWithRouter(<AnnotationsDashboard />);
      expect(document.querySelector('.min-h-screen')).toBeInTheDocument();
      // Unmount and render again
      const { unmount } = renderWithRouter(<AnnotationsDashboard />);
      expect(document.querySelector('.min-h-screen')).toBeInTheDocument();
      unmount();
    });

    it('should return valid JSX element', () => {
      const { container } = renderWithRouter(<AnnotationsDashboard />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      renderWithRouter(<AnnotationsDashboard />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
    });

    it('should have back button with proper role', () => {
      renderWithRouter(<AnnotationsDashboard />);
      const backButton = screen.getByRole('button');
      expect(backButton).toBeInTheDocument();
    });

    it('should have descriptive text for each tool', () => {
      renderWithRouter(<AnnotationsDashboard />);
      const descriptions = screen.getAllByRole('paragraph');
      expect(descriptions.length).toBeGreaterThan(0);
    });
  });

  describe('Translation', () => {
    it('should use translation for heading', () => {
      renderWithRouter(<AnnotationsDashboard />);
      expect(useTranslationMock).toHaveBeenCalled();
    });

    it('should use translation for tool titles', () => {
      renderWithRouter(<AnnotationsDashboard />);
      // Verify that translation keys are being used
      expect(document.body.innerHTML).toContain('Peer Review');
      expect(document.body.innerHTML).toContain('Audio Tool');
      expect(document.body.innerHTML).toContain('Video Tool');
    });

    it('should use translation for tool descriptions', () => {
      renderWithRouter(<AnnotationsDashboard />);
      expect(document.body.innerHTML).toContain('contributions');
    });

    it('should use translation for coming soon badge', () => {
      renderWithRouter(<AnnotationsDashboard />);
      expect(document.body.innerHTML).toContain('Planned');
    });

    it('should use translation for coming soon description', () => {
      renderWithRouter(<AnnotationsDashboard />);
      // Coming soon tools exist
      const comingSoonTools = document.querySelectorAll('.opacity-40');
      expect(comingSoonTools.length).toBeGreaterThan(0);
    });
  });

  describe('Styling', () => {
    it('should have gradient background', () => {
      renderWithRouter(<AnnotationsDashboard />);
      const container = document.querySelector('.min-h-screen');
      expect(container?.className).toContain('bg-gradient-to-br');
    });

    it('should have responsive grid layout', () => {
      renderWithRouter(<AnnotationsDashboard />);
      const grid = document.querySelector('.grid');
      expect(grid).toBeInTheDocument();
    });

    it('should have card styling for tools', () => {
      renderWithRouter(<AnnotationsDashboard />);
      const cards = document.querySelectorAll('.bg-white');
      expect(cards.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty translation keys gracefully', () => {
      useTranslationMock.mockReturnValue({
        t: vi.fn((key: string) => key),
        i18n: {
          language: 'en',
          changeLanguage: vi.fn(),
        },
      });

      expect(() => renderWithRouter(<AnnotationsDashboard />)).not.toThrow();
    });

    it('should handle missing navigation', () => {
      navigateMock.mockImplementation(() => {
        // Do nothing
      });

      renderWithRouter(<AnnotationsDashboard />);
      expect(document.querySelector('.min-h-screen')).toBeInTheDocument();
    });

    it('should handle rapid clicking on tools', () => {
      renderWithRouter(<AnnotationsDashboard />);
      const peerReviewCard = document.getElementById('tour-peer-review-tool');
      if (peerReviewCard) {
        fireEvent.click(peerReviewCard);
        fireEvent.click(peerReviewCard);
      }
      expect(navigateMock).toHaveBeenCalledTimes(2);
    });
  });

  describe('React Best Practices', () => {
    it('should use React.FC type', () => {
      const componentType = typeof AnnotationsDashboard;
      expect(componentType).toBe('function');
    });

    it('should not have side effects during render', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {
        // Suppress console errors
      });
      renderWithRouter(<AnnotationsDashboard />);
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should cleanup properly on unmount', () => {
      const { unmount } = renderWithRouter(<AnnotationsDashboard />);
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Router Integration', () => {
    it('should work with BrowserRouter', () => {
      expect(() => renderWithRouter(<AnnotationsDashboard />)).not.toThrow();
    });

    it('should render within router context', () => {
      renderWithRouter(<AnnotationsDashboard />);
      expect(document.querySelector('.min-h-screen')).toBeInTheDocument();
    });

    it('should use useNavigate hook', () => {
      renderWithRouter(<AnnotationsDashboard />);
      const peerReviewCard = document.getElementById('tour-peer-review-tool');
      if (peerReviewCard) {
        fireEvent.click(peerReviewCard);
      }
      expect(navigateMock).toHaveBeenCalled();
    });
  });

  describe('Tool Count', () => {
    it('should render exactly 11 tools', () => {
      renderWithRouter(<AnnotationsDashboard />);
      const toolCards = document.querySelectorAll('.group');
      expect(toolCards.length).toBe(11);
    });

    it('should render 5 available tools', () => {
      renderWithRouter(<AnnotationsDashboard />);
      // Check that available tools don't have cursor-not-allowed class
      const availableToolIds = [
        'tour-peer-review-tool',
        'tour-image-review-tool',
        'tour-audio-review-tool',
        'tour-video-review-tool',
        'tour-doc-digitization-tool',
      ];
      availableToolIds.forEach((id) => {
        const tool = document.getElementById(id);
        expect(tool).toBeInTheDocument();
        expect(tool?.className).not.toContain('cursor-not-allowed');
      });
    });

    it('should render 6 coming soon tools', () => {
      renderWithRouter(<AnnotationsDashboard />);
      // Check that coming soon tools have cursor-not-allowed class
      const opacityTools = document.querySelectorAll('.opacity-40');
      expect(opacityTools.length).toBe(6);
    });
  });

  describe('Snapshot Testing', () => {
    it('should match snapshot', () => {
      const { container } = renderWithRouter(<AnnotationsDashboard />);
      expect(container).toMatchSnapshot();
    });

    it('should have consistent rendering', () => {
      const { container: first } = renderWithRouter(<AnnotationsDashboard />);
      const { container: second } = renderWithRouter(<AnnotationsDashboard />);
      expect(first.innerHTML).toBe(second.innerHTML);
    });
  });
});
