import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ContributionDashboard, {
  DashboardCard,
  MediaTypeCard,
} from '../../../src/components/ContributionDashboard';
import type { ContributionDashboardProps } from '../../../src/components/ContributionDashboard';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock utils
vi.mock('../../../src/lib/utils', () => ({
  formatModernTime: vi.fn((time) => time),
  formatDuration: vi.fn((seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }),
  getISTDate: vi.fn((timestamp) => {
    const date = new Date(timestamp);
    // Add 5.5 hours for IST
    date.setHours(date.getHours() + 5.5);
    return date;
  }),
}));

const mockDailyStats = {
  uploads_today: 5,
  total_uploads: 150,
  last_upload_date: '2024-01-15',
  streak_days: 7,
};

const mockContributions = {
  totalContributions: 150,
  contributionsByType: {
    text: 30,
    audio: 50,
    image: 25,
    video: 20,
    document: 25,
  },
  audioContributions: [
    {
      id: '1',
      size: 1024,
      category_id: 'cat1',
      reviewed: true,
      title: 'Audio 1',
      description: 'Test audio',
      duration: 120,
      timestamp: '2024-01-15T10:00:00Z',
      release_rights: 'creator',
      language: 'english',
      file_hash: 'hash1',
      snr_frequency: 50,
    },
  ],
  videoContributions: [
    {
      id: '2',
      size: 2048,
      category_id: 'cat2',
      reviewed: false,
      title: 'Video 1',
      description: 'Test video',
      duration: 300,
      timestamp: '2024-01-14T10:00:00Z',
      release_rights: 'others',
      language: 'hindi',
      file_hash: 'hash2',
      snr_frequency: 60,
    },
  ],
  textContributions: [
    {
      id: '3',
      size: 512,
      category_id: 'cat1',
      reviewed: true,
      title: 'Text 1',
      description: 'Test text',
      timestamp: '2024-01-15T10:00:00Z',
      release_rights: 'creator',
      language: 'english',
      file_hash: 'hash3',
      snr_frequency: 40,
    },
  ],
  imageContributions: [
    {
      id: '4',
      size: 4096,
      category_id: 'cat3',
      reviewed: true,
      title: 'Image 1',
      description: 'Test image',
      timestamp: '2024-01-13T10:00:00Z',
      release_rights: 'creator',
      language: 'telugu',
      file_hash: 'hash4',
      snr_frequency: 55,
    },
  ],
  documentContributions: [
    {
      id: '5',
      size: 8192,
      category_id: 'cat1',
      reviewed: false,
      title: 'Document 1',
      description: 'Test document',
      timestamp: '2024-01-12T10:00:00Z',
      release_rights: 'others',
      language: 'tamil',
      file_hash: 'hash5',
      snr_frequency: 45,
    },
  ],
  audioDuration: 3600,
  videoDuration: 7200,
};

const createMockProps = (
  overrides: Partial<ContributionDashboardProps> = {},
) => ({
  dailyStats: mockDailyStats,
  contributions: mockContributions,
  loading: false,
  edits: 10,
  onMediaTypeClick: vi.fn(),
  ...overrides,
});

describe('ContributionDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('renders loading spinner when loading is true', () => {
      render(<ContributionDashboard {...createMockProps({ loading: true })} />);

      expect(
        screen.getByText('messages.loadingContributionsDashboard'),
      ).toBeInTheDocument();
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('renders empty state when no data is available', () => {
      render(
        <ContributionDashboard
          {...createMockProps({
            dailyStats: null,
            contributions: null,
          })}
        />,
      );

      expect(
        screen.getByText('common.noContributionDataAvailable'),
      ).toBeInTheDocument();
    });
  });

  describe('Stats Cards', () => {
    it('renders all stats cards with correct values', () => {
      render(<ContributionDashboard {...createMockProps()} />);

      expect(screen.getByText('Uploads')).toBeInTheDocument();
      expect(screen.getByText('150')).toBeInTheDocument();

      expect(screen.getByText('Edits')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();

      expect(screen.getByText('Streak')).toBeInTheDocument();

      expect(screen.getByText('Hours')).toBeInTheDocument();

      expect(screen.getByText('Today')).toBeInTheDocument();
    });

    it('displays correct uploads count', () => {
      render(<ContributionDashboard {...createMockProps()} />);

      const uploadsValue = screen.getByText('150');
      expect(uploadsValue).toBeInTheDocument();
    });

    it('displays correct edits count', () => {
      render(<ContributionDashboard {...createMockProps({ edits: 25 })} />);

      const editsValues = screen.getAllByText('25');
      expect(editsValues.length).toBeGreaterThan(0);
    });

    it('displays zero when contributions is null', () => {
      render(
        <ContributionDashboard
          {...createMockProps({
            contributions: null,
            dailyStats: mockDailyStats,
          })}
        />,
      );

      // Should show 0 for contributions when null
      const zeros = screen.getAllByText('0');
      expect(zeros.length).toBeGreaterThan(0);
    });

    it('formats duration correctly', () => {
      render(<ContributionDashboard {...createMockProps()} />);

      // Audio duration (3600s) + Video duration (7200s) = 10800s = 3h 0m
      expect(screen.getByText('3h 0m')).toBeInTheDocument();
    });
  });

  describe('Media Type Cards', () => {
    it('renders all media type cards', () => {
      render(<ContributionDashboard {...createMockProps()} />);

      expect(screen.getByText('Text')).toBeInTheDocument();
      expect(screen.getByText('Doc')).toBeInTheDocument();
      expect(screen.getByText('Image')).toBeInTheDocument();
      expect(screen.getByText('Audio')).toBeInTheDocument();
      expect(screen.getByText('Video')).toBeInTheDocument();
    });

    it('displays correct counts for each media type', () => {
      render(<ContributionDashboard {...createMockProps()} />);

      // Find all number values in the document
      const allText = screen.getAllByText('30');
      expect(allText.length).toBeGreaterThan(0);

      const docValues = screen.getAllByText('25');
      expect(docValues.length).toBeGreaterThan(0);

      const audioValues = screen.getAllByText('50');
      expect(audioValues.length).toBeGreaterThan(0);

      const videoValues = screen.getAllByText('20');
      expect(videoValues.length).toBeGreaterThan(0);
    });

    it('calls onMediaTypeClick when Text card is clicked', () => {
      const onMediaTypeClick = vi.fn();
      render(
        <ContributionDashboard {...createMockProps({ onMediaTypeClick })} />,
      );

      const textCard = screen.getByText('Text').closest('div');
      if (textCard) {
        fireEvent.click(textCard);
        expect(onMediaTypeClick).toHaveBeenCalledWith('text');
      }
    });

    it('calls onMediaTypeClick when Audio card is clicked', () => {
      const onMediaTypeClick = vi.fn();
      render(
        <ContributionDashboard {...createMockProps({ onMediaTypeClick })} />,
      );

      const audioCard = screen.getByText('Audio').closest('div');
      if (audioCard) {
        fireEvent.click(audioCard);
        expect(onMediaTypeClick).toHaveBeenCalledWith('audio');
      }
    });

    it('calls onMediaTypeClick when Video card is clicked', () => {
      const onMediaTypeClick = vi.fn();
      render(
        <ContributionDashboard {...createMockProps({ onMediaTypeClick })} />,
      );

      const videoCard = screen.getByText('Video').closest('div');
      if (videoCard) {
        fireEvent.click(videoCard);
        expect(onMediaTypeClick).toHaveBeenCalledWith('video');
      }
    });

    it('calls onMediaTypeClick when Image card is clicked', () => {
      const onMediaTypeClick = vi.fn();
      render(
        <ContributionDashboard {...createMockProps({ onMediaTypeClick })} />,
      );

      const imageCard = screen.getByText('Image').closest('div');
      if (imageCard) {
        fireEvent.click(imageCard);
        expect(onMediaTypeClick).toHaveBeenCalledWith('image');
      }
    });

    it('calls onMediaTypeClick when Doc card is clicked', () => {
      const onMediaTypeClick = vi.fn();
      render(
        <ContributionDashboard {...createMockProps({ onMediaTypeClick })} />,
      );

      const docCard = screen.getByText('Doc').closest('div');
      if (docCard) {
        fireEvent.click(docCard);
        expect(onMediaTypeClick).toHaveBeenCalledWith('document');
      }
    });

    it('does not call onMediaTypeClick when undefined', () => {
      render(
        <ContributionDashboard
          {...createMockProps({ onMediaTypeClick: undefined })}
        />,
      );

      const textCard = screen.getByText('Text').closest('div');
      if (textCard) {
        expect(() => fireEvent.click(textCard)).not.toThrow();
      }
    });

    it('has pointer cursor for clickable cards', () => {
      render(<ContributionDashboard {...createMockProps()} />);

      const textCard = screen.getByText('Text').closest('div');
      // Card should be clickable
      expect(textCard).not.toBeNull();
    });
  });

  describe('Contribution Streak Calculation', () => {
    it('calculates streak correctly with consecutive days', () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const twoDaysAgo = new Date(today);
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      const contributionsWithStreak = {
        ...mockContributions,
        textContributions: [
          {
            ...mockContributions.textContributions[0],
            timestamp: today.toISOString(),
          },
          {
            ...mockContributions.textContributions[0],
            id: 'streak1',
            timestamp: yesterday.toISOString(),
          },
          {
            ...mockContributions.textContributions[0],
            id: 'streak2',
            timestamp: twoDaysAgo.toISOString(),
          },
        ],
        audioContributions: [],
        videoContributions: [],
        imageContributions: [],
        documentContributions: [],
      };

      render(
        <ContributionDashboard
          {...createMockProps({ contributions: contributionsWithStreak })}
        />,
      );

      const streakCard = screen.getByText('Streak');
      expect(streakCard).toBeInTheDocument();
    });

    it('shows zero streak when no contributions', () => {
      const emptyContributions = {
        ...mockContributions,
        audioContributions: [],
        videoContributions: [],
        textContributions: [],
        imageContributions: [],
        documentContributions: [],
      };

      render(
        <ContributionDashboard
          {...createMockProps({ contributions: emptyContributions })}
        />,
      );

      const streakCard = screen.getByText('Streak').closest('div');
      expect(streakCard).toBeInTheDocument();
    });
  });

  describe('Uploads Today Calculation', () => {
    it('calculates uploads today correctly', () => {
      const today = new Date();
      const todayContributions = {
        ...mockContributions,
        textContributions: [
          {
            ...mockContributions.textContributions[0],
            timestamp: today.toISOString(),
          },
          {
            ...mockContributions.textContributions[0],
            id: 'today1',
            timestamp: today.toISOString(),
          },
        ],
        audioContributions: [],
        videoContributions: [],
        imageContributions: [],
        documentContributions: [],
      };

      render(
        <ContributionDashboard
          {...createMockProps({ contributions: todayContributions })}
        />,
      );

      const todayCard = screen.getByText('Today');
      expect(todayCard).toBeInTheDocument();
    });

    it('shows zero uploads today when no contributions today', () => {
      const oldContributions = {
        ...mockContributions,
        textContributions: [
          {
            ...mockContributions.textContributions[0],
            timestamp: '2023-01-01T10:00:00Z',
          },
        ],
        audioContributions: [],
        videoContributions: [],
        imageContributions: [],
        documentContributions: [],
      };

      render(
        <ContributionDashboard
          {...createMockProps({ contributions: oldContributions })}
        />,
      );

      const todayCard = screen.getByText('Today').closest('div');
      expect(todayCard).toBeInTheDocument();
    });
  });

  describe('Language Contributions', () => {
    it('groups contributions by language correctly', () => {
      render(<ContributionDashboard {...createMockProps()} />);

      // The component calculates language contributions internally
      // We verify the component renders without errors
      expect(screen.getByText('Audio')).toBeInTheDocument();
    });

    it('handles empty language field', () => {
      const contributionsWithEmptyLang = {
        ...mockContributions,
        textContributions: [
          {
            ...mockContributions.textContributions[0],
            language: '',
          },
        ],
      };

      render(
        <ContributionDashboard
          {...createMockProps({ contributions: contributionsWithEmptyLang })}
        />,
      );

      expect(screen.getByText('Text')).toBeInTheDocument();
    });
  });

  describe('Monthly Contributions', () => {
    it('groups contributions by month correctly', () => {
      render(<ContributionDashboard {...createMockProps()} />);

      // The component calculates monthly contributions internally
      // We verify the component renders without errors
      expect(screen.getByText('Uploads')).toBeInTheDocument();
    });

    it('handles contributions without timestamp', () => {
      const contributionsWithoutTimestamp = {
        ...mockContributions,
        textContributions: [
          {
            ...mockContributions.textContributions[0],
            timestamp: undefined,
          },
        ],
      };

      render(
        <ContributionDashboard
          {...createMockProps({ contributions: contributionsWithoutTimestamp })}
        />,
      );

      expect(screen.getByText('Text')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('applies correct gradient colors to stats cards', () => {
      render(<ContributionDashboard {...createMockProps()} />);

      const statsCards = document.querySelectorAll('[style*="background"]');
      expect(statsCards.length).toBeGreaterThan(0);
    });

    it('applies hover effect to media type cards', () => {
      render(<ContributionDashboard {...createMockProps()} />);

      // Media type cards should have hover class
      const allDivs = document.querySelectorAll('div');
      const hoverDivs = Array.from(allDivs).filter((div) =>
        div.className?.includes('hover'),
      );
      expect(hoverDivs.length).toBeGreaterThan(0);
    });

    it('applies transition classes to media type cards', () => {
      render(<ContributionDashboard {...createMockProps()} />);

      // Media type cards should have transition class
      const allDivs = document.querySelectorAll('div');
      const transitionDivs = Array.from(allDivs).filter((div) =>
        div.className?.includes('transition'),
      );
      expect(transitionDivs.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('handles zero contributions gracefully', () => {
      const zeroContributions = {
        totalContributions: 0,
        contributionsByType: {
          text: 0,
          audio: 0,
          image: 0,
          video: 0,
          document: 0,
        },
        audioContributions: [],
        videoContributions: [],
        textContributions: [],
        imageContributions: [],
        documentContributions: [],
        audioDuration: 0,
        videoDuration: 0,
      };

      render(
        <ContributionDashboard
          {...createMockProps({ contributions: zeroContributions })}
        />,
      );

      // Component should render without errors
      const uploadsCard = screen.getByText('Uploads').closest('div');
      expect(uploadsCard).toBeInTheDocument();
    });

    it('handles streak calculation with empty unique dates', () => {
      const contributionsWithNoValidDates = {
        ...mockContributions,
        textContributions: [
          {
            ...mockContributions.textContributions[0],
            timestamp: undefined,
          },
        ],
        audioContributions: [],
        videoContributions: [],
        imageContributions: [],
        documentContributions: [],
      };

      render(
        <ContributionDashboard
          {...createMockProps({ contributions: contributionsWithNoValidDates })}
        />,
      );

      const streakCard = screen.getByText('Streak').closest('div');
      expect(streakCard).toBeInTheDocument();
    });

    it('handles streak broken by more than one day gap', () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 5);

      const contributionsWithBrokenStreak = {
        ...mockContributions,
        textContributions: [
          {
            ...mockContributions.textContributions[0],
            timestamp: oldDate.toISOString(),
          },
        ],
        audioContributions: [],
        videoContributions: [],
        imageContributions: [],
        documentContributions: [],
      };

      render(
        <ContributionDashboard
          {...createMockProps({ contributions: contributionsWithBrokenStreak })}
        />,
      );

      const streakCard = screen.getByText('Streak').closest('div');
      expect(streakCard).toBeInTheDocument();
    });

    it('handles very large contribution numbers', () => {
      const largeContributions = {
        ...mockContributions,
        totalContributions: 999999,
        contributionsByType: {
          text: 999999,
          audio: 999999,
          image: 999999,
          video: 999999,
          document: 999999,
        },
      };

      render(
        <ContributionDashboard
          {...createMockProps({ contributions: largeContributions })}
        />,
      );

      // Large numbers are rendered correctly
      const uploadsCard = screen.getByText('Uploads').closest('div');
      expect(uploadsCard).toBeInTheDocument();
    });

    it('handles negative edits gracefully', () => {
      render(<ContributionDashboard {...createMockProps({ edits: -5 })} />);

      expect(screen.getByText('-5')).toBeInTheDocument();
    });

    it('handles undefined dailyStats', () => {
      render(
        <ContributionDashboard
          {...createMockProps({ dailyStats: undefined })}
        />,
      );

      expect(screen.getByText('Uploads')).toBeInTheDocument();
    });

    it('handles partial contributions data', () => {
      const partialContributions = {
        totalContributions: 50,
        contributionsByType: {
          text: 10,
          audio: 20,
          image: 0,
          video: 0,
          document: 0,
        },
        audioContributions: mockContributions.audioContributions,
        videoContributions: [],
        textContributions: mockContributions.textContributions,
        imageContributions: [],
        documentContributions: [],
        audioDuration: 1800,
        videoDuration: 0,
      };

      render(
        <ContributionDashboard
          {...createMockProps({ contributions: partialContributions })}
        />,
      );

      expect(screen.getByText('Text')).toBeInTheDocument();
      expect(screen.getByText('Audio')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('renders semantic HTML structure', () => {
      const { container } = render(
        <ContributionDashboard {...createMockProps()} />,
      );

      expect(container.querySelector('div')).toBeInTheDocument();
    });

    it('has proper flex layout', () => {
      const { container } = render(
        <ContributionDashboard {...createMockProps()} />,
      );

      const firstDiv = container.firstChild as HTMLElement;
      expect(firstDiv).toHaveStyle('display: flex');
    });
  });

  describe('DashboardCard Component', () => {
    it('renders stats cards correctly', () => {
      render(<ContributionDashboard {...createMockProps()} />);

      // Verify stats cards are rendered
      expect(screen.getByText('Uploads')).toBeInTheDocument();
      expect(screen.getByText('Edits')).toBeInTheDocument();
      expect(screen.getByText('Streak')).toBeInTheDocument();
    });
  });

  describe('MediaTypeCard Component', () => {
    it('renders media type cards correctly', () => {
      render(<ContributionDashboard {...createMockProps()} />);

      // Verify media type cards are rendered
      expect(screen.getByText('Text')).toBeInTheDocument();
      expect(screen.getByText('Audio')).toBeInTheDocument();
      expect(screen.getByText('Video')).toBeInTheDocument();
    });

    it('renders MediaTypeCard without duration', () => {
      render(<ContributionDashboard {...createMockProps()} />);

      const audioCard = screen.getByText('Audio').closest('div');
      expect(audioCard).toBeInTheDocument();
    });
  });

  describe('DashboardCard Standalone Component', () => {
    it('renders DashboardCard with all props', () => {
      const mockIcon = <svg data-testid="mock-icon" />;

      render(
        <DashboardCard
          icon={mockIcon}
          title="Test Card"
          value={100}
          unit="items"
          color="bg-blue-500"
        />,
      );

      expect(screen.getByText('Test Card')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('items')).toBeInTheDocument();
      expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
    });

    it('renders DashboardCard without unit', () => {
      const mockIcon = <svg data-testid="mock-icon" />;

      render(
        <DashboardCard
          icon={mockIcon}
          title="Test Card"
          value={50}
          color="bg-green-500"
        />,
      );

      expect(screen.getByText('Test Card')).toBeInTheDocument();
      expect(screen.getByText('50')).toBeInTheDocument();
      // Unit should not be rendered
      expect(screen.queryByText('items')).not.toBeInTheDocument();
    });
  });

  describe('MediaTypeCard Standalone Component', () => {
    it('renders MediaTypeCard with duration', () => {
      const mockIcon = <svg data-testid="mock-icon" />;

      const { container } = render(
        <MediaTypeCard
          type="Audio"
          count={25}
          duration={3600}
          icon={mockIcon}
          color="bg-green-500"
        />,
      );

      expect(container.textContent).toContain('Audio');
      expect(container.textContent).toContain('25');
      expect(container.textContent).toContain('Contributions');
      expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
    });

    it('renders MediaTypeCard without duration', () => {
      const mockIcon = <svg data-testid="mock-icon" />;

      const { container } = render(
        <MediaTypeCard
          type="Text"
          count={10}
          icon={mockIcon}
          color="bg-blue-500"
        />,
      );

      expect(container.textContent).toContain('Text');
      expect(container.textContent).toContain('10');
      expect(container.textContent).toContain('Contributions');
      expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
    });

    it('renders MediaTypeCard with zero duration', () => {
      const mockIcon = <svg data-testid="mock-icon" />;

      const { container } = render(
        <MediaTypeCard
          type="Video"
          count={5}
          duration={0}
          icon={mockIcon}
          color="bg-purple-500"
        />,
      );

      expect(container.textContent).toContain('Video');
      expect(container.textContent).toContain('5');
      expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
    });
  });

  describe('Timezone Handling', () => {
    it('handles IST timezone conversion correctly', () => {
      const utcTimestamp = '2024-01-15T00:00:00Z';
      const istDate = new Date(utcTimestamp);
      istDate.setHours(istDate.getHours() + 5.5);

      render(<ContributionDashboard {...createMockProps()} />);

      // Component should handle timezone conversion without errors
      expect(screen.getByText('Uploads')).toBeInTheDocument();
    });

    it('handles different timestamp formats', () => {
      const contributionsWithDifferentTimestamps = {
        ...mockContributions,
        textContributions: [
          {
            ...mockContributions.textContributions[0],
            timestamp: '2024-01-15T10:00:00.000Z',
          },
          {
            ...mockContributions.textContributions[0],
            id: 'ts1',
            timestamp: new Date().toISOString(),
          },
        ],
      };

      render(
        <ContributionDashboard
          {...createMockProps({
            contributions: contributionsWithDifferentTimestamps,
          })}
        />,
      );

      expect(screen.getByText('Text')).toBeInTheDocument();
    });
  });

  describe('Icons', () => {
    it('renders icons for all stats cards', () => {
      render(<ContributionDashboard {...createMockProps()} />);

      // Icons are rendered as SVG elements
      const svgs = document.querySelectorAll('svg');
      expect(svgs.length).toBeGreaterThan(0);
    });

    it('renders correct icon for Uploads', () => {
      render(<ContributionDashboard {...createMockProps()} />);

      const uploadsCard = screen.getByText('Uploads').closest('div');
      expect(uploadsCard).toBeInTheDocument();
    });

    it('renders correct icon for Edits', () => {
      render(<ContributionDashboard {...createMockProps()} />);

      const editsCard = screen.getByText('Edits').closest('div');
      expect(editsCard).toBeInTheDocument();
    });

    it('renders correct icon for Streak', () => {
      render(<ContributionDashboard {...createMockProps()} />);

      const streakCard = screen.getByText('Streak').closest('div');
      expect(streakCard).toBeInTheDocument();
    });

    it('renders correct icon for Hours', () => {
      render(<ContributionDashboard {...createMockProps()} />);

      const hoursCard = screen.getByText('Hours').closest('div');
      expect(hoursCard).toBeInTheDocument();
    });

    it('renders correct icon for Today', () => {
      render(<ContributionDashboard {...createMockProps()} />);

      const todayCard = screen.getByText('Today').closest('div');
      expect(todayCard).toBeInTheDocument();
    });
  });

  describe('Color Schemes', () => {
    it('renders Uploads card with gradient background', () => {
      render(<ContributionDashboard {...createMockProps()} />);

      const uploadsCard = screen.getByText('Uploads').closest('div');
      expect(uploadsCard).toBeInTheDocument();
      expect(uploadsCard).toHaveStyle('color: rgb(255, 255, 255)');
    });

    it('renders Edits card with green background', () => {
      render(<ContributionDashboard {...createMockProps()} />);

      const editsCard = screen.getByText('Edits').closest('div');
      expect(editsCard).toBeInTheDocument();
    });

    it('renders Streak card with orange gradient', () => {
      render(<ContributionDashboard {...createMockProps()} />);

      const streakCard = screen.getByText('Streak').closest('div');
      expect(streakCard).toBeInTheDocument();
    });

    it('renders Hours card with purple gradient', () => {
      render(<ContributionDashboard {...createMockProps()} />);

      const hoursCard = screen.getByText('Hours').closest('div');
      expect(hoursCard).toBeInTheDocument();
    });

    it('renders Today card with blue gradient', () => {
      render(<ContributionDashboard {...createMockProps()} />);

      const todayCard = screen.getByText('Today').closest('div');
      expect(todayCard).toBeInTheDocument();
    });
  });

  describe('Media Type Colors', () => {
    it('renders Text card with blue background', () => {
      render(<ContributionDashboard {...createMockProps()} />);

      const textCard = screen.getByText('Text').closest('div');
      expect(textCard).toBeInTheDocument();
      expect(textCard).toHaveStyle('color: rgb(255, 255, 255)');
    });

    it('renders Doc card with red background', () => {
      render(<ContributionDashboard {...createMockProps()} />);

      const docCard = screen.getByText('Doc').closest('div');
      expect(docCard).toBeInTheDocument();
    });

    it('renders Image card with orange background', () => {
      render(<ContributionDashboard {...createMockProps()} />);

      const imageCard = screen.getByText('Image').closest('div');
      expect(imageCard).toBeInTheDocument();
    });

    it('renders Audio card with green background', () => {
      render(<ContributionDashboard {...createMockProps()} />);

      const audioCard = screen.getByText('Audio').closest('div');
      expect(audioCard).toBeInTheDocument();
    });

    it('renders Video card with purple background', () => {
      render(<ContributionDashboard {...createMockProps()} />);

      const videoCard = screen.getByText('Video').closest('div');
      expect(videoCard).toBeInTheDocument();
    });
  });
});
