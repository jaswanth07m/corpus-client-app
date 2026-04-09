import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock useWelcomeTour hook
const mockStartTour = vi.fn();
vi.mock('@/hooks/useWelcomeTour', () => ({
  useWelcomeTour: () => ({
    startTour: mockStartTour,
  }),
}));

// Mock UserStatsSummary component
vi.mock('@/components/UserStatsSummary', () => ({
  default: vi.fn(() => (
    <div data-testid="user-stats-summary">User Stats Summary</div>
  )),
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock react-i18next with proper translation values
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue: string) => {
      const translations: Record<string, string> = {
        'common.swechaTechnologyForSociety': 'Swecha Technology For Society',
        'common.uploadFiles': 'Upload Files',
        'common.click.to.get.started': 'Click to get started',
        'common.contributeToOpenDataAndHelpBuildTheFuture':
          'Contribute to open data and help build the future',
      };
      return translations[key] || defaultValue || key;
    },
  }),
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

import LandingPage from '@/pages/LandingPage';

describe('LandingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue('true'); // Tour completed
    mockLocalStorage.setItem.mockClear();
    mockNavigate.mockClear();
    mockStartTour.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders without crashing', () => {
    render(<LandingPage />);
    expect(screen.getByTestId('user-stats-summary')).toBeInTheDocument();
  });

  it('displays the Swecha logo', () => {
    render(<LandingPage />);
    const logo = screen.getByAltText('Swecha Technology For Society');
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('src', '/Swecha_Logo_English.png');
  });

  it('displays the upload button', () => {
    render(<LandingPage />);
    const uploadButton = document.getElementById('tour-upload-btn');
    expect(uploadButton).toBeInTheDocument();
  });

  it('navigates to upload page when upload button is clicked', () => {
    render(<LandingPage />);
    const uploadButton = document.getElementById('tour-upload-btn');
    fireEvent.click(uploadButton!);
    expect(mockNavigate).toHaveBeenCalledWith('/upload');
  });

  it('displays the contribution message', () => {
    render(<LandingPage />);
    expect(
      screen.getByText('Contribute to open data and help build the future'),
    ).toBeInTheDocument();
  });

  it('starts welcome tour if not completed', async () => {
    mockLocalStorage.getItem.mockReturnValue(null); // Tour not completed
    vi.useFakeTimers();

    render(<LandingPage />);

    // Fast-forward time
    vi.advanceTimersByTime(600);

    expect(mockStartTour).toHaveBeenCalled();

    vi.useRealTimers();
  });

  it('does not start welcome tour if already completed', async () => {
    mockLocalStorage.getItem.mockReturnValue('true'); // Tour completed

    render(<LandingPage />);

    await waitFor(() => {
      expect(mockStartTour).not.toHaveBeenCalled();
    });
  });

  it('has proper decorative background elements', () => {
    const { container } = render(<LandingPage />);
    const decorativeElements = container.querySelectorAll(
      '.absolute.bg-emerald-200\\/20, .absolute.bg-blue-200\\/20',
    );
    expect(decorativeElements.length).toBeGreaterThanOrEqual(1);
  });

  it('has proper styling classes', () => {
    const { container } = render(<LandingPage />);
    const mainDiv = container.firstChild as HTMLElement;
    expect(mainDiv).toHaveClass('min-h-screen');
    expect(mainDiv).toHaveClass(
      'bg-gradient-to-br',
      'from-emerald-50',
      'via-white',
      'to-blue-50',
    );
  });

  it('displays the cloud upload icon', () => {
    render(<LandingPage />);
    const cloudIcon = document.querySelector('.lucide-cloud-upload');
    expect(cloudIcon).toBeInTheDocument();
  });

  it('has the upload button with correct ID for tour', () => {
    render(<LandingPage />);
    const uploadButton = document.getElementById('tour-upload-btn');
    expect(uploadButton).toBeInTheDocument();
  });

  it('has the logo with correct ID for tour', () => {
    render(<LandingPage />);
    const logoContainer = document.getElementById('tour-swecha-logo');
    expect(logoContainer).toBeInTheDocument();
  });
});
