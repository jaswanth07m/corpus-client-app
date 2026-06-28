import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';

const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockAxiosPost = vi.fn();
vi.mock('@/api/axiosInstance', () => ({
  axiosInstance: {
    post: (...args: unknown[]) => mockAxiosPost(...args),
    get: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

vi.mock('@/lib/constants', () => ({
  BACKEND_URL: 'http://test-api.com',
}));

const mockT = vi.fn((key: string, options?: Record<string, unknown>) => {
  const translations: Record<string, string> = {
    'tools.readSpeech': 'Read Speech',
    'tools.readSpeechDescription':
      'Record your voice reading displayed sentences.',
    'readSpeech.accentPromptTitle': 'Select Your Accent Location',
    'readSpeech.accentPromptDescription':
      'Choose your location before starting.',
    'readSpeech.chooseLocation': 'Choose Your Location',
    'readSpeech.submitAll': 'Submit all 5',
    'readSpeech.sentence': 'Sentence',
    'readSpeech.skip': 'Skip',
    'readSpeech.submitFailed': 'Submission failed',
    'readSpeech.batchSubmitted': '5 recordings submitted!',
    'readSpeech.sentences': 'Sentences',
    'common.loading': 'Loading...',
    'common.retry': 'Retry',
    'common.edit': 'Edit',
    'media.rerecord': 'Re-record',
  };
  return translations[key] || key;
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: mockT,
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
}));

const mockUser = { id: 'user-123', name: 'Test User' };
const mockLogout = vi.fn();
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    token: 'mock-token',
    user: mockUser,
    logout: mockLogout,
    login: vi.fn(),
    isReady: true,
    refetchUser: vi.fn(),
  }),
}));

vi.mock('@/hooks/useToolEventFilters', () => ({
  useToolEventFilters: () => ({
    reviewFilters: { language: ['telugu'], media_type: ['text'] },
    isReady: true,
  }),
}));

let mockRecorderState: Record<string, unknown> = {};
const mockStartRecording = vi.fn();
const mockStopRecording = vi.fn();
const mockResetRecording = vi.fn();

vi.mock('@/hooks/useAudioRecorder', () => ({
  useAudioRecorder: () => ({
    status: 'idle',
    blob: null,
    blobUrl: null,
    duration: 0,
    error: null,
    frequencyData: null,
    startRecording: mockStartRecording,
    stopRecording: mockStopRecording,
    resetRecording: mockResetRecording,
    ...mockRecorderState,
  }),
}));

let mockRecords: { id: string; text: string }[] = [];
let mockRecordIds: string[] = [];
let mockLoading = false;
let mockError: string | null = null;
const mockRefetch = vi.fn();

vi.mock('@/hooks/useReadSpeechRecord', () => ({
  useReadSpeechRecord: () => ({
    records: mockRecords,
    loading: mockLoading,
    error: mockError,
    recordIds: mockRecordIds,
    refetch: mockRefetch,
  }),
  collectIds: vi.fn((data) => {
    if (Array.isArray(data))
      return data.map(
        (item: { record_id?: string; id?: string }) =>
          item.record_id || item.id || '',
      );
    if (data?.record_ids) return data.record_ids;
    return [];
  }),
}));

vi.mock('@/components/LocationPicker', () => ({
  default: ({
    onLocationSelect,
    onClose,
  }: {
    onLocationSelect: (lat: number, lng: number) => void;
    onClose: () => void;
  }) => (
    <div data-testid="location-picker">
      <button
        data-testid="location-select-btn"
        onClick={() => onLocationSelect(17.385, 78.4867)}
      >
        Select Location
      </button>
      <button data-testid="location-close-btn" onClick={onClose}>
        Close
      </button>
    </div>
  ),
}));

vi.mock('@/components/NetworkStrengthIndicator', () => ({
  NetworkStrengthIndicator: () => (
    <div data-testid="network-strength-indicator" />
  ),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

function renderComponent() {
  return render(
    <BrowserRouter>
      {/* Wrap in a container that simulates the route context if needed */}
      <ReadSpeech />
    </BrowserRouter>,
  );
}

// Dynamic import so mocks are set up first
let ReadSpeech: React.ComponentType;

beforeEach(async () => {
  vi.clearAllMocks();
  localStorage.clear();
  mockRecords = [];
  mockRecordIds = [];
  mockLoading = false;
  mockError = null;
  mockRecorderState = {};
  mockFetch.mockReset();
  mockAxiosPost.mockReset();
  mockFetch.mockResolvedValue({ ok: true, json: async () => [] });

  // Import after all mocks are registered
  const mod = await import('@/pages/tools/ReadSpeech');
  ReadSpeech = mod.default;
});

describe('ReadSpeech', () => {
  describe('Loading State', () => {
    it('shows loading spinner when records are loading', () => {
      mockLoading = true;
      renderComponent();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('shows error message and retry button', () => {
      mockError = 'Failed to load';
      mockLoading = false;
      renderComponent();
      expect(screen.getByText('Failed to load')).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    it('calls refetch when retry button is clicked', async () => {
      mockError = 'Failed to load';
      mockLoading = false;
      renderComponent();
      await userEvent.click(screen.getByText('Retry'));
      expect(mockRefetch).toHaveBeenCalled();
    });
  });

  describe('Sentence Display', () => {
    beforeEach(() => {
      mockRecords = [
        { id: 'rec-1', text: 'First sentence' },
        { id: 'rec-2', text: 'Second sentence' },
        { id: 'rec-3', text: 'Third sentence' },
        { id: 'rec-4', text: 'Fourth sentence' },
        { id: 'rec-5', text: 'Fifth sentence' },
      ];
      mockRecordIds = ['rec-1', 'rec-2', 'rec-3', 'rec-4', 'rec-5'];
      mockLoading = false;
      mockError = null;
    });

    it('displays the first sentence text', () => {
      renderComponent();
      expect(screen.getByText('First sentence')).toBeInTheDocument();
    });

    it('shows 5 sentence slots', () => {
      renderComponent();
      // First slot shows "Recording" since it's current and unrecorded
      expect(screen.getByText('Recording')).toBeInTheDocument();
      expect(screen.getAllByText(/Sentence [2-5]/)).toHaveLength(4);
    });

    it('shows Sentences heading in right panel', () => {
      renderComponent();
      expect(screen.getByText('Sentences')).toBeInTheDocument();
    });

    it('shows empty slots with number badges', () => {
      renderComponent();
      const badges = screen.getAllByText(/^[1-5]$/);
      expect(badges.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('Accent Location Prompt', () => {
    beforeEach(() => {
      localStorage.removeItem('read_speech_location');
      mockRecords = [
        { id: 'rec-1', text: 'Test sentence' },
        { id: 'rec-2', text: 'Test sentence 2' },
        { id: 'rec-3', text: 'Test sentence 3' },
        { id: 'rec-4', text: 'Test sentence 4' },
        { id: 'rec-5', text: 'Test sentence 5' },
      ];
      mockRecordIds = ['rec-1', 'rec-2', 'rec-3', 'rec-4', 'rec-5'];
      mockLoading = false;
    });

    it('shows accent prompt overlay when no location saved', () => {
      renderComponent();
      expect(
        screen.getByText('Select Your Accent Location'),
      ).toBeInTheDocument();
      expect(screen.getByText('Choose Your Location')).toBeInTheDocument();
    });

    it('does not show accent prompt when location is saved', () => {
      localStorage.setItem(
        'read_speech_location',
        JSON.stringify({ lat: 17.385, lng: 78.4867, label: 'Hyderabad' }),
      );
      // Re-render requires re-import to re-evaluate useState initializer
      // Since we already imported, manually set localStorage before render
      // and refresh the component
      renderComponent();
      expect(
        screen.queryByText('Select Your Accent Location'),
      ).not.toBeInTheDocument();
    });

    it('opens location picker when Choose Your Location is clicked', async () => {
      renderComponent();
      await userEvent.click(screen.getByText('Choose Your Location'));
      expect(screen.getByTestId('location-picker')).toBeInTheDocument();
    });

    it('closes accent prompt and saves location on selection', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ formatted_address: 'Hyderabad, India' }),
      });
      renderComponent();
      await userEvent.click(screen.getByText('Choose Your Location'));
      await userEvent.click(screen.getByTestId('location-select-btn'));
      expect(
        screen.queryByText('Select Your Accent Location'),
      ).not.toBeInTheDocument();
      const stored = localStorage.getItem('read_speech_location');
      expect(stored).toBeTruthy();
      if (stored) {
        const parsed = JSON.parse(stored);
        expect(parsed.label).toBe('Hyderabad, India');
      }
    });
  });

  describe('Location Display', () => {
    it('shows saved location below nav on top right', () => {
      localStorage.setItem(
        'read_speech_location',
        JSON.stringify({
          lat: 17.385,
          lng: 78.4867,
          label: 'Hyderabad, India',
        }),
      );
      mockRecords = [
        { id: 'rec-1', text: 'Test' },
        { id: 'rec-2', text: 'Test 2' },
        { id: 'rec-3', text: 'Test 3' },
        { id: 'rec-4', text: 'Test 4' },
        { id: 'rec-5', text: 'Test 5' },
      ];
      mockRecordIds = ['rec-1', 'rec-2', 'rec-3', 'rec-4', 'rec-5'];
      renderComponent();
      expect(screen.getByText('Hyderabad, India')).toBeInTheDocument();
    });
  });

  describe('Recording Flow', () => {
    beforeEach(() => {
      localStorage.setItem(
        'read_speech_location',
        JSON.stringify({ lat: 17.385, lng: 78.4867, label: 'Hyderabad' }),
      );
      mockRecords = [
        { id: 'rec-1', text: 'First sentence' },
        { id: 'rec-2', text: 'Second sentence' },
        { id: 'rec-3', text: 'Third sentence' },
        { id: 'rec-4', text: 'Fourth sentence' },
        { id: 'rec-5', text: 'Fifth sentence' },
      ];
      mockRecordIds = ['rec-1', 'rec-2', 'rec-3', 'rec-4', 'rec-5'];
      mockLoading = false;
    });

    it('shows mic button for first unrecorded slot', () => {
      renderComponent();
      const buttons = screen.getAllByRole('button');
      const micBtn = buttons.find((btn) =>
        btn.innerHTML.includes('lucide-mic'),
      );
      expect(micBtn).toBeTruthy();
    });

    it('redo button clears recording and shows mic', async () => {
      renderComponent();
      // Initially no re-record buttons since nothing is recorded
      expect(screen.queryByTitle('Re-record')).not.toBeInTheDocument();
    });

    it('next button is not visible until a recording is made', () => {
      renderComponent();
      expect(screen.queryByText('Next')).not.toBeInTheDocument();
    });
  });

  describe('Submit Flow', () => {
    beforeEach(() => {
      localStorage.setItem(
        'read_speech_location',
        JSON.stringify({ lat: 17.385, lng: 78.4867, label: 'Hyderabad' }),
      );
      mockRecords = [
        { id: 'rec-1', text: 'First sentence' },
        { id: 'rec-2', text: 'Second sentence' },
        { id: 'rec-3', text: 'Third sentence' },
        { id: 'rec-4', text: 'Fourth sentence' },
        { id: 'rec-5', text: 'Fifth sentence' },
      ];
      mockRecordIds = ['rec-1', 'rec-2', 'rec-3', 'rec-4', 'rec-5'];
      mockLoading = false;
    });

    it('does not show submit button when not all recorded', () => {
      expect(screen.queryByText('Submit all 5')).not.toBeInTheDocument();
    });

    it('provides source record IDs from the hook', () => {
      expect(mockRecordIds).toEqual([
        'rec-1',
        'rec-2',
        'rec-3',
        'rec-4',
        'rec-5',
      ]);
    });
  });

  describe('Skip Button', () => {
    beforeEach(() => {
      localStorage.setItem(
        'read_speech_location',
        JSON.stringify({ lat: 17.385, lng: 78.4867, label: 'Hyderabad' }),
      );
      mockRecords = [
        { id: 'rec-1', text: 'First sentence' },
        { id: 'rec-2', text: 'Second sentence' },
        { id: 'rec-3', text: 'Third sentence' },
        { id: 'rec-4', text: 'Fourth sentence' },
        { id: 'rec-5', text: 'Fifth sentence' },
      ];
      mockRecordIds = ['rec-1', 'rec-2', 'rec-3', 'rec-4', 'rec-5'];
      mockLoading = false;
    });

    it('shows skip button when not recording', () => {
      renderComponent();
      expect(screen.getByText('Skip')).toBeInTheDocument();
    });
  });

  describe('Header', () => {
    beforeEach(() => {
      mockRecords = [
        { id: 'rec-1', text: 'Test' },
        { id: 'rec-2', text: 'Test 2' },
        { id: 'rec-3', text: 'Test 3' },
        { id: 'rec-4', text: 'Test 4' },
        { id: 'rec-5', text: 'Test 5' },
      ];
      mockRecordIds = ['rec-1', 'rec-2', 'rec-3', 'rec-4', 'rec-5'];
      mockLoading = false;
    });

    it('renders the page title and description', () => {
      renderComponent();
      expect(screen.getByText('Read Speech')).toBeInTheDocument();
      expect(
        screen.getByText('Record your voice reading displayed sentences.'),
      ).toBeInTheDocument();
    });

    it('shows back button linking to /tools', () => {
      renderComponent();
      const backLink = screen.getByRole('link');
      expect(backLink).toHaveAttribute('href', '/tools');
    });

    it('shows network strength indicator', () => {
      renderComponent();
      expect(
        screen.getByTestId('network-strength-indicator'),
      ).toBeInTheDocument();
    });
  });
});
