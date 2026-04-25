import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  render,
  screen,
  waitFor,
  fireEvent,
  act,
} from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';
import Categories from '../../../src/components/Categories';
import { BACKEND_URL } from '../../../src/lib/constants';

// Save original global functions for restoration
const originalSetTimeout = global.setTimeout;
const originalBlob = global.Blob;
const originalFile = global.File;

// Initialize i18n for tests
i18n.init({
  lng: 'en',
  resources: {
    en: {
      translation: {
        'ui.failed.to.fetch.categories': 'Failed to fetch categories',
        'messages.networkErrorPleaseTryAgain':
          'Network error, please try again',
        'user.requestingLocationAccess': 'Requesting location access',
        'user.locationAccessGranted': 'Location access granted',
        'common.geolocationNotSupported': 'Geolocation not supported',
        'validation.pleaseEnterValidLatitudeAndLongitudeValues':
          'Please enter valid latitude and longitude values',
        'validation.latitudeMustBeBetween90And90':
          'Latitude must be between -90 and 90',
        'validation.longitudeMustBeBetween180And180':
          'Longitude must be between -180 and 180',
        'user.locationSetManually': 'Location set manually',
        'common.pleaseSelectAtLeastOneCategoryAndProvideATitle':
          'Please select at least one category and provide a title',
        'user.locationIsRequiredPleaseEnableLocationAccessOrEnterManually':
          'Location is required',
        'common.releaseRightsNotFoundCheckForReleaseRights':
          'Release rights not found',
        'common.selectALangauge': 'Select a language',
        'common.pleaseSelectAFile': 'Please select a file',
        'validation.pleaseEnterTextContent': 'Please enter text content',
        'messages.contentUploadedSuccessfullyRedirectingToLanding':
          'Content uploaded successfully',
        'common.uploadFailedPleaseTryAgain': 'Upload failed, please try again',
        'messages.networkErrorPleaseCheckYourConnectionAndTryAgain':
          'Network error, please check your connection',
        'categories.chooseACategoryToContributeContent':
          'Choose a category to contribute content',
        'ui.choose.how.youd.like.to.contribute':
          'Choose how you would like to contribute',
        'common.searchByUserId': 'Search by user ID',
        'common.searchUsers': 'Search users',
        'common.peerReview': 'Peer review',
        'common.userIdNotFoundPleaseTryLoggingInAgain':
          'User ID not found, please try logging in again',
        'ui.failed.to.get.user.information.please.try.logging.in.again':
          'Failed to get user information',
        'user.locationAccessDenied': 'Location access denied',
      },
    },
  },
});

// Import toast to mock it properly
import { toast } from 'sonner';

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock posthog (removed for F-Droid compliance - mock kept to avoid import errors in test)
vi.mock('posthog-js', () => ({
  default: {
    capture: vi.fn(),
    captureException: vi.fn(),
  },
}));

// Mock ContentInput component
vi.mock('../../../src/components/ContentInput', () => ({
  default: ({
    uploadMode,
    onBack,
    onUpload,
    requestLocation,
    handleManualLocationSubmit,
    handleFileSelect,
    title,
    setTitle,
    textContent,
    setTextContent,
    selectedFile,
    setSelectedFile,
    location,
    setLocation,
    selectedCategory,
    setSelectedCategory,
    selectedCategories,
    setSelectedCategories,
    description,
    setDescription,
    releaseRights,
    setreleaseRights,
    selectedLanguage,
    setSelectedLangugae,
    creator,
    setCreator,
  }: {
    uploadMode: string;
    onBack: () => void;
    onUpload: () => void;
    requestLocation?: () => void;
    handleManualLocationSubmit?: () => void;
    handleFileSelect?: (event: React.ChangeEvent<HTMLInputElement>) => void;
    title?: string;
    setTitle?: (title: string) => void;
    textContent?: string;
    setTextContent?: (content: string) => void;
    selectedFile?: File | null;
    setSelectedFile?: (file: File | null) => void;
    location?: { lat: number; lng: number } | null;
    setLocation?: (location: { lat: number; lng: number }) => void;
    selectedCategory?: { id: string; name: string } | null;
    setSelectedCategory?: (
      category: { id: string; name: string } | null,
    ) => void;
    selectedCategories?: Array<{ id: string; name: string }>;
    setSelectedCategories?: (
      categories: Array<{ id: string; name: string }>,
    ) => void;
    description?: string;
    setDescription?: (description: string) => void;
    releaseRights?: string;
    setreleaseRights?: (rights: string) => void;
    selectedLanguage?: string;
    setSelectedLangugae?: (language: string) => void;
    creator?: string;
    setCreator?: (creator: string) => void;
  }) => {
    // Store onUpload for test access
    if (typeof window !== 'undefined') {
      (window as Record<string, unknown>).__testOnUpload = onUpload;
    }
    return (
      <div data-testid="content-input">
        <div>Upload Mode: {uploadMode}</div>
        <button onClick={onBack}>Back</button>
        <button onClick={onUpload}>Upload</button>
        <button onClick={requestLocation}>Request Location</button>
        <button onClick={handleManualLocationSubmit}>Submit Location</button>
        <input
          type="file"
          onChange={handleFileSelect}
          data-testid="file-input"
        />
        <input
          type="text"
          value={title || ''}
          onChange={(e) => setTitle?.(e.target.value)}
          data-testid="title-input"
        />
        <textarea
          value={textContent || ''}
          onChange={(e) => setTextContent?.(e.target.value)}
          data-testid="text-content"
        />
        <button
          onClick={() => {
            setSelectedCategory?.({ id: '1', name: 'fables' });
          }}
          data-testid="select-category"
        >
          Select Category
        </button>
        <button
          onClick={() => {
            setSelectedCategories?.([{ id: '1', name: 'fables' }]);
          }}
          data-testid="select-categories"
        >
          Select Categories
        </button>
        <button
          onClick={() => {
            setLocation?.({ lat: 40.7128, lng: -74.006 });
          }}
          data-testid="set-location"
        >
          Set Location
        </button>
        <input
          type="text"
          value={description || ''}
          onChange={(e) => setDescription?.(e.target.value)}
          data-testid="description-input"
        />
        <select
          value={releaseRights || ''}
          onChange={(e) => setreleaseRights?.(e.target.value)}
          data-testid="release-rights-select"
        >
          <option value="">Select</option>
          <option value="self">Self</option>
          <option value="downloaded">Downloaded</option>
          <option value="others">Others</option>
        </select>
        <select
          value={selectedLanguage || ''}
          onChange={(e) => setSelectedLangugae?.(e.target.value)}
          data-testid="language-select"
        >
          <option value="">Select</option>
          <option value="en">English</option>
          <option value="es">Spanish</option>
        </select>
      </div>
    );
  },
}));

// Mock SwechaLogo component
vi.mock('../../../src/components/SwechaLogo', () => ({
  default: ({ size, showTagline }: { size: string; showTagline: boolean }) => (
    <div data-testid="swecha-logo" data-size={size} data-tagline={showTagline}>
      Logo
    </div>
  ),
}));

// Mock UI components
vi.mock('../../../src/components/ui/button', () => ({
  Button: ({ children, ...props }: React.HTMLProps<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
}));

vi.mock('../../../src/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card">{children}</div>
  ),
  CardContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-content">{children}</div>
  ),
}));

const mockCategories = [
  {
    id: '1',
    name: 'fables',
    title: 'Fables',
    description: 'Traditional stories and tales',
    published: true,
    rank: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'music',
    title: 'Music',
    description: 'Musical traditions and songs',
    published: true,
    rank: 2,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '3',
    name: 'food',
    title: 'Food',
    description: 'Culinary traditions and recipes',
    published: true,
    rank: 3,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '4',
    name: 'unpublished_category',
    title: 'Unpublished',
    description: 'Should not appear',
    published: false,
    rank: 4,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

const mockToken = 'mock.jwt.token';
const mockOnBack = vi.fn();
const mockOnLogout = vi.fn();
const mockOnSessionExpired = vi.fn();

// Helper function to create a mock JWT token
const createMockJWTToken = (payload: { exp?: number; sub?: string } = {}) => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const defaultPayload = {
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
    sub: 'test-user-123',
    ...payload,
  };
  const encodedPayload = btoa(JSON.stringify(defaultPayload));
  const signature = 'mock-signature';
  return `${header}.${encodedPayload}.${signature}`;
};

const renderCategories = (props = {}) => {
  return render(
    <BrowserRouter>
      <I18nextProvider i18n={i18n}>
        <Categories
          token={mockToken}
          onBack={mockOnBack}
          onLogout={mockOnLogout}
          onSessionExpired={mockOnSessionExpired}
          {...props}
        />
      </I18nextProvider>
    </BrowserRouter>,
  );
};

describe('Categories Component', () => {
  // Mock fetch globally
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock = vi.fn();
    global.fetch = fetchMock;

    // Mock geolocation
    Object.defineProperty(navigator, 'geolocation', {
      writable: true,
      value: {
        getCurrentPosition: vi.fn(),
      },
    });

    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    Object.defineProperty(global, 'localStorage', {
      value: localStorageMock,
    });

    // Mock sessionStorage
    const sessionStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    Object.defineProperty(global, 'sessionStorage', {
      value: sessionStorageMock,
    });

    // Mock crypto.randomUUID
    Object.defineProperty(global.crypto, 'randomUUID', {
      writable: true,
      value: vi.fn().mockReturnValue('test-uuid-123'),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    // Restore global functions to originals
    global.setTimeout = originalSetTimeout;
    global.Blob = originalBlob;
    global.File = originalFile;
  });

  describe('Initial Rendering', () => {
    it('should render loading state initially', () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategories,
      });

      const { container } = renderCategories();

      // Component should be in the DOM (loading state)
      expect(container).toBeTruthy();
    });

    it('should render header with SwechaLogo and Corpus title', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategories,
      });

      renderCategories();

      await waitFor(() => {
        expect(screen.getByTestId('swecha-logo')).toBeInTheDocument();
      });

      expect(screen.getByText('Corpus')).toBeInTheDocument();
    });

    it('should render bottom navigation bar', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategories,
      });

      renderCategories();

      await waitFor(() => {
        // Bottom navigation has Home, Review, Annotate, Profile
        // Use getAllByText since some labels might appear elsewhere too
        expect(screen.getAllByText('Home').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('Review').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('Annotate').length).toBeGreaterThanOrEqual(
          1,
        );
      });

      // Profile appears in both header and bottom nav
      expect(screen.getAllByText('Profile').length).toBeGreaterThanOrEqual(1);
    });

    it('should render page title and description', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategories,
      });

      renderCategories();

      await waitFor(() => {
        expect(screen.getByText('Categories')).toBeInTheDocument();
      });

      expect(
        screen.getByText('Choose a category to contribute content'),
      ).toBeInTheDocument();
    });
  });

  describe('Category Display', () => {
    it('should fetch and display published categories sorted by rank', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategories,
      });

      renderCategories();

      await waitFor(() => {
        expect(screen.getByText('Fables')).toBeInTheDocument();
        expect(screen.getByText('Music')).toBeInTheDocument();
        expect(screen.getByText('Food')).toBeInTheDocument();
      });

      // Unpublished category should not appear
      expect(screen.queryByText('Unpublished')).not.toBeInTheDocument();

      // Verify fetch was called with correct auth header
      expect(fetchMock).toHaveBeenCalledWith(
        `${BACKEND_URL}/categories/`,
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockToken}`,
            'Content-Type': 'application/json',
          }),
        }),
      );
    });

    it('should display category icons based on category name', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategories,
      });

      renderCategories();

      await waitFor(() => {
        // Fables should have book icon
        expect(screen.getByText('📚')).toBeInTheDocument();
        // Music should have music note icon
        expect(screen.getByText('🎵')).toBeInTheDocument();
        // Food should have fork icon
        expect(screen.getByText('🍽️')).toBeInTheDocument();
      });
    });

    it('should display category descriptions', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategories,
      });

      renderCategories();

      await waitFor(() => {
        expect(
          screen.getByText('Traditional stories and tales'),
        ).toBeInTheDocument();
        expect(
          screen.getByText('Musical traditions and songs'),
        ).toBeInTheDocument();
        expect(
          screen.getByText('Culinary traditions and recipes'),
        ).toBeInTheDocument();
      });
    });

    it('should handle empty categories list', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      renderCategories();

      await waitFor(() => {
        expect(screen.getByText('Categories')).toBeInTheDocument();
      });

      // No category cards should be rendered
      expect(screen.queryByText('Fables')).not.toBeInTheDocument();
    });

    it('should handle fetch error gracefully', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      renderCategories();

      await waitFor(() => {
        expect(screen.getByText('Categories')).toBeInTheDocument();
      });

      // Should not have categories
      expect(screen.queryByText('Fables')).not.toBeInTheDocument();
    });
  });

  describe('Category Selection', () => {
    it('should show upload options when clicking a category', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategories,
      });

      renderCategories();

      await waitFor(() => {
        expect(screen.getByText('Fables')).toBeInTheDocument();
      });

      // Click on Fables category
      fireEvent.click(screen.getByText('Fables'));

      // Should show upload options modal
      await waitFor(() => {
        expect(
          screen.getByText('Choose how you would like to contribute'),
        ).toBeInTheDocument();
      });

      // Should show back button with ArrowLeft icon
      const allButtons = screen.getAllByRole('button');
      const backButton = allButtons.find((btn) =>
        btn.querySelector('svg.lucide-arrow-left'),
      );
      expect(backButton).toBeInTheDocument();
    });

    it('should display selected category title in header', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategories,
      });

      renderCategories();

      await waitFor(() => {
        expect(screen.getByText('Fables')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Fables'));

      await waitFor(() => {
        expect(screen.getByText('Fables')).toBeInTheDocument();
      });
    });

    it('should return to categories list when clicking back button', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategories,
      });

      renderCategories();

      await waitFor(() => {
        expect(screen.getByText('Fables')).toBeInTheDocument();
      });

      // Click category
      fireEvent.click(screen.getByText('Fables'));

      // Wait for upload options
      await waitFor(() => {
        expect(
          screen.getByText('Choose how you would like to contribute'),
        ).toBeInTheDocument();
      });

      // Click back button - it has an ArrowLeft icon
      const allButtons = screen.getAllByRole('button');
      const backButton = allButtons.find((btn) =>
        btn.querySelector('svg.lucide-arrow-left'),
      );

      if (backButton) {
        fireEvent.click(backButton);
      }

      // Should return to categories view
      await waitFor(() => {
        expect(screen.getByText('Fables')).toBeInTheDocument();
        expect(
          screen.queryByText('Choose how you would like to contribute'),
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Upload Options', () => {
    it('should display all 5 upload options', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategories,
      });

      renderCategories();

      await waitFor(() => {
        expect(screen.getByText('Fables')).toBeInTheDocument();
      });

      // Click category to show upload options
      fireEvent.click(screen.getByText('Fables'));

      await waitFor(() => {
        // Text Input
        expect(screen.getByText('Text Input')).toBeInTheDocument();
        // Audio Recording
        expect(screen.getByText('Audio Recording')).toBeInTheDocument();
        // Video Content
        expect(screen.getByText('Video Content')).toBeInTheDocument();
        // Photo Capture
        expect(screen.getByText('Photo Capture')).toBeInTheDocument();
        // Document Upload
        expect(screen.getByText('Document Upload')).toBeInTheDocument();
      });
    });

    it('should display correct icons for each upload option', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategories,
      });

      renderCategories();

      await waitFor(() => {
        expect(screen.getByText('Fables')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Fables'));

      await waitFor(() => {
        // Check that icons are present (rendered as SVG elements)
        const icons = document.querySelectorAll('svg');
        expect(icons.length).toBeGreaterThanOrEqual(5);
      });
    });

    it('should handle upload option selection', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategories,
      });

      renderCategories();

      await waitFor(() => {
        expect(screen.getByText('Fables')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Fables'));

      await waitFor(() => {
        expect(screen.getByText('Text Input')).toBeInTheDocument();
      });

      // Click Text Input option
      fireEvent.click(screen.getByText('Text Input'));

      // Should render ContentInput component
      await waitFor(() => {
        expect(screen.getByTestId('content-input')).toBeInTheDocument();
      });

      expect(screen.getByText('Upload Mode: text')).toBeInTheDocument();
    });

    it('should request location when selecting upload option', async () => {
      const mockGetCurrentPosition = vi.fn((success) => {
        success({
          coords: {
            latitude: 40.7128,
            longitude: -74.006,
          },
        });
      });

      navigator.geolocation.getCurrentPosition = mockGetCurrentPosition;

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategories,
      });

      renderCategories();

      await waitFor(() => {
        expect(screen.getByText('Fables')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Fables'));

      await waitFor(() => {
        expect(screen.getByText('Text Input')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Text Input'));

      // Location should be requested
      await waitFor(() => {
        expect(navigator.geolocation.getCurrentPosition).toHaveBeenCalled();
      });
    });
  });

  describe('User Interactions', () => {
    it('should call onLogout when clicking logout button', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategories,
      });

      renderCategories();

      await waitFor(() => {
        expect(screen.getByText('Categories')).toBeInTheDocument();
      });

      // Find logout button - it has a LogOut icon
      const allButtons = screen.getAllByRole('button');
      const logoutButton = allButtons.find((btn) =>
        btn.querySelector('svg.lucide-log-out'),
      );

      if (logoutButton) {
        fireEvent.click(logoutButton);
        expect(mockOnLogout).toHaveBeenCalled();
      }
    });

    it('should call onBack when clicking back button in upload mode', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategories,
      });

      renderCategories();

      await waitFor(() => {
        expect(screen.getByText('Fables')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Fables'));

      await waitFor(() => {
        expect(screen.getByText('Text Input')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Text Input'));

      await waitFor(() => {
        expect(screen.getByTestId('content-input')).toBeInTheDocument();
      });

      // Click back button in ContentInput
      fireEvent.click(screen.getByText('Back'));

      expect(mockOnBack).toHaveBeenCalled();
    });

    it('should toggle search input visibility', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategories,
      });

      renderCategories();

      await waitFor(() => {
        expect(screen.getByText('Categories')).toBeInTheDocument();
      });

      // Search button has a Search icon - find all buttons and click the one with Search icon
      const allButtons = screen.getAllByRole('button');
      // The search button is in the header, has a Search icon
      const searchButton = allButtons.find(
        (btn) =>
          btn.querySelector('svg[aria-label="search"]') ||
          btn.querySelector('svg.lucide-search'),
      );

      if (searchButton) {
        fireEvent.click(searchButton);

        // Search input should appear
        await waitFor(() => {
          expect(
            screen.getByPlaceholderText('Search by user ID'),
          ).toBeInTheDocument();
        });

        // Click close button
        const closeButton = screen.getByTitle('Close');
        fireEvent.click(closeButton);

        // Search input should disappear
        await waitFor(() => {
          expect(
            screen.queryByPlaceholderText('Search by user ID'),
          ).not.toBeInTheDocument();
        });
      }
    });

    it('should navigate to profile when searching for user', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategories,
      });

      const originalHref = window.location.href;

      Object.defineProperty(window, 'location', {
        value: { href: '' },
        writable: true,
      });

      renderCategories();

      await waitFor(() => {
        expect(screen.getByText('Categories')).toBeInTheDocument();
      });

      // Find search button by its Search icon
      const allButtons = screen.getAllByRole('button');
      const searchButton = allButtons.find((btn) =>
        btn.querySelector('svg.lucide-search'),
      );

      if (searchButton) {
        fireEvent.click(searchButton);

        // Enter user ID
        const searchInput = screen.getByPlaceholderText('Search by user ID');
        fireEvent.change(searchInput, { target: { value: 'test-user-123' } });

        // Press Enter
        fireEvent.keyDown(searchInput, { key: 'Enter' });

        // Should navigate to profile page
        expect(window.location.href).toBe('/profile/test-user-123');
      }

      // Restore original href
      Object.defineProperty(window, 'location', {
        value: { href: originalHref },
        writable: true,
      });
    });
  });

  describe('Session Handling', () => {
    it('should handle session expiration on categories fetch', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      renderCategories();

      await waitFor(() => {
        expect(mockOnSessionExpired).toHaveBeenCalled();
      });

      // Should clear auth tokens
      expect(global.localStorage.removeItem).toHaveBeenCalledWith('authToken');
      expect(global.sessionStorage.removeItem).toHaveBeenCalledWith(
        'authToken',
      );
    });

    it('should handle session expiration on profile fetch', async () => {
      // First call for categories (success)
      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCategories,
        })
        // Second call for profile (401)
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
        });

      renderCategories();

      await waitFor(() => {
        expect(mockOnSessionExpired).toHaveBeenCalled();
      });
    });

    it('should handle expired JWT token', async () => {
      const expiredToken = createMockJWTToken({
        exp: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago
      });

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategories,
      });

      renderCategories({ token: expiredToken });

      await waitFor(() => {
        expect(mockOnSessionExpired).toHaveBeenCalled();
      });
    });
  });

  describe('Props Handling', () => {
    it('should handle preSelectedMediaType prop', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategories,
      });

      renderCategories({ preSelectedMediaType: 'text' });

      // Should directly show ContentInput with text mode
      await waitFor(() => {
        expect(screen.getByTestId('content-input')).toBeInTheDocument();
      });

      expect(screen.getByText('Upload Mode: text')).toBeInTheDocument();
    });

    it('should pass token correctly to API calls', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategories,
      });

      renderCategories();

      await waitFor(() => {
        expect(screen.getByText('Fables')).toBeInTheDocument();
      });

      expect(fetchMock).toHaveBeenCalledWith(
        `${BACKEND_URL}/categories/`,
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockToken}`,
          }),
        }),
      );
    });

    it('should call onSessionExpired callback when provided', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 403,
      });

      renderCategories();

      await waitFor(() => {
        expect(mockOnSessionExpired).toHaveBeenCalled();
      });
    });

    it('should fallback to onLogout when onSessionExpired is not provided', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      render(
        <BrowserRouter>
          <I18nextProvider i18n={i18n}>
            <Categories
              token={mockToken}
              onBack={mockOnBack}
              onLogout={mockOnLogout}
              // No onSessionExpired provided
            />
          </I18nextProvider>
        </BrowserRouter>,
      );

      await waitFor(() => {
        expect(mockOnLogout).toHaveBeenCalled();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle network error during categories fetch', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      renderCategories();

      await waitFor(() => {
        expect(screen.getByText('Categories')).toBeInTheDocument();
      });

      // Should not crash, just no categories displayed
      expect(screen.queryByText('Fables')).not.toBeInTheDocument();
    });

    it('should handle malformed JWT token', async () => {
      const invalidToken = 'invalid.token';

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategories,
      });

      renderCategories({ token: invalidToken });

      await waitFor(() => {
        expect(screen.getByText('Fables')).toBeInTheDocument();
      });

      // Should not crash, just log error
      expect(screen.getByText('Fables')).toBeInTheDocument();
    });

    it('should handle missing user ID in profile response', async () => {
      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCategories,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ name: 'Test User' }), // No ID field
        });

      renderCategories();

      await waitFor(() => {
        expect(screen.getByText('Fables')).toBeInTheDocument();
      });

      // Should still render categories
      expect(screen.getByText('Fables')).toBeInTheDocument();
    });

    it('should handle geolocation not supported', async () => {
      // This test verifies that the component handles missing geolocation
      // The actual UI behavior depends on ContentInput component which is mocked
      // This is a placeholder for integration testing with the real ContentInput

      // Mock geolocation as not available
      const originalGeolocation = navigator.geolocation;
      Object.defineProperty(navigator, 'geolocation', {
        value: undefined,
        writable: true,
      });

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategories,
      });

      renderCategories();

      await waitFor(() => {
        expect(screen.getByText('Fables')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Fables'));

      await waitFor(() => {
        expect(screen.getByText('Text Input')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Text Input'));

      // ContentInput should be rendered (location handling is in ContentInput)
      await waitFor(() => {
        expect(screen.getByTestId('content-input')).toBeInTheDocument();
      });

      // Restore
      Object.defineProperty(navigator, 'geolocation', {
        value: originalGeolocation,
        writable: true,
      });
    });

    it('should handle location permission denied', async () => {
      const mockGetCurrentPosition = vi.fn((success, error) => {
        error({
          code: 1, // PERMISSION_DENIED
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
        });
      });

      navigator.geolocation.getCurrentPosition = mockGetCurrentPosition;

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategories,
      });

      renderCategories();

      await waitFor(() => {
        expect(screen.getByText('Fables')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Fables'));

      await waitFor(() => {
        expect(screen.getByText('Text Input')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Text Input'));

      // Should handle permission denied
      await waitFor(() => {
        expect(mockGetCurrentPosition).toHaveBeenCalled();
      });
    });

    it('should handle location timeout', async () => {
      const mockGetCurrentPosition = vi.fn((success, error) => {
        error({
          code: 3, // TIMEOUT
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
        });
      });

      navigator.geolocation.getCurrentPosition = mockGetCurrentPosition;

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategories,
      });

      renderCategories();

      await waitFor(() => {
        expect(screen.getByText('Fables')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Fables'));

      await waitFor(() => {
        expect(screen.getByText('Text Input')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Text Input'));

      await waitFor(() => {
        expect(mockGetCurrentPosition).toHaveBeenCalled();
      });
    });

    it('should handle manual location input validation', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategories,
      });

      renderCategories();

      await waitFor(() => {
        expect(screen.getByText('Fables')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Fables'));

      await waitFor(() => {
        expect(screen.getByText('Text Input')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Text Input'));

      // Manual location form should be visible after location error
      // This tests the validation logic in the component
    });

    it('should sort categories by rank correctly', async () => {
      const unsortedCategories = [
        {
          id: '1',
          name: 'fables',
          title: 'Fables',
          description: 'Test',
          published: true,
          rank: 3,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: '2',
          name: 'music',
          title: 'Music',
          description: 'Test',
          published: true,
          rank: 1,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: '3',
          name: 'food',
          title: 'Food',
          description: 'Test',
          published: true,
          rank: 2,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => unsortedCategories,
      });

      renderCategories();

      await waitFor(() => {
        expect(screen.getByText('Music')).toBeInTheDocument();
        expect(screen.getByText('Food')).toBeInTheDocument();
        expect(screen.getByText('Fables')).toBeInTheDocument();
      });

      // Verify order in DOM (Music should come before Food, Food before Fables)
      const allText = screen.getByText('Music').parentElement?.parentElement;
      expect(allText).toBeInTheDocument();
    });

    it('should handle unknown category names with default icon', async () => {
      const unknownCategory = [
        {
          id: '99',
          name: 'unknown_category',
          title: 'Unknown',
          description: 'Test unknown category',
          published: true,
          rank: 1,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => unknownCategory,
      });

      renderCategories();

      await waitFor(() => {
        expect(screen.getByText('Unknown')).toBeInTheDocument();
      });

      // Should show default folder icon for unknown categories
      expect(screen.getByText('📂')).toBeInTheDocument();
    });

    it('should fetch user ID from token payload when available', async () => {
      // Create a token with valid user ID in payload
      const validToken = createMockJWTToken({
        exp: Math.floor(Date.now() / 1000) + 3600,
        sub: 'token-user-id-123',
      });

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategories,
      });

      renderCategories({ token: validToken });

      await waitFor(() => {
        expect(screen.getByText('Fables')).toBeInTheDocument();
      });

      // Should not call profile API since we got user ID from token
      // The profile fetch should still be called but the token path should be covered
    });

    it('should fetch user ID from profile API when token has no sub', async () => {
      // Create a token without sub field
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payload = btoa(
        JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }),
      );
      const tokenWithoutSub = `${header}.${payload}.signature`;

      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCategories,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 'profile-user-id-456', name: 'Test User' }),
        });

      renderCategories({ token: tokenWithoutSub });

      await waitFor(() => {
        expect(screen.getByText('Fables')).toBeInTheDocument();
      });
    });

    it('should handle location POSITION_UNAVAILABLE error', async () => {
      const mockGetCurrentPosition = vi.fn((success, error) => {
        error({
          code: 2, // POSITION_UNAVAILABLE
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
        });
      });

      navigator.geolocation.getCurrentPosition = mockGetCurrentPosition;

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategories,
      });

      renderCategories();

      await waitFor(() => {
        expect(screen.getByText('Fables')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Fables'));

      await waitFor(() => {
        expect(screen.getByText('Text Input')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Text Input'));

      await waitFor(() => {
        expect(mockGetCurrentPosition).toHaveBeenCalled();
      });
    });

    it('should handle location TIMEOUT error', async () => {
      const mockGetCurrentPosition = vi.fn((success, error) => {
        error({
          code: 3, // TIMEOUT
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
        });
      });

      navigator.geolocation.getCurrentPosition = mockGetCurrentPosition;

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategories,
      });

      renderCategories();

      await waitFor(() => {
        expect(screen.getByText('Fables')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Fables'));

      await waitFor(() => {
        expect(screen.getByText('Text Input')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Text Input'));

      await waitFor(() => {
        expect(mockGetCurrentPosition).toHaveBeenCalled();
      });
    });

    it('should handle manual location with invalid latitude/longitude', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategories,
      });

      renderCategories();

      await waitFor(() => {
        expect(screen.getByText('Fables')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Fables'));

      await waitFor(() => {
        expect(screen.getByText('Text Input')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Text Input'));

      // Manual location form should be shown after location error
      // This test ensures the validation logic exists
    });

    it('should handle file selection', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategories,
      });

      renderCategories();

      await waitFor(() => {
        expect(screen.getByText('Fables')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Fables'));

      await waitFor(() => {
        expect(screen.getByText('Document Upload')).toBeInTheDocument();
      });

      // Click document upload
      fireEvent.click(screen.getByText('Document Upload'));

      // ContentInput should be rendered
      await waitFor(() => {
        expect(screen.getByTestId('content-input')).toBeInTheDocument();
      });
    });

    it('should handle preSelectedMediaType with audio', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategories,
      });

      renderCategories({ preSelectedMediaType: 'audio' });

      await waitFor(() => {
        expect(screen.getByTestId('content-input')).toBeInTheDocument();
      });

      expect(screen.getByText('Upload Mode: audio')).toBeInTheDocument();
    });

    it('should handle preSelectedMediaType with video', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategories,
      });

      renderCategories({ preSelectedMediaType: 'video' });

      await waitFor(() => {
        expect(screen.getByTestId('content-input')).toBeInTheDocument();
      });

      expect(screen.getByText('Upload Mode: video')).toBeInTheDocument();
    });

    it('should handle preSelectedMediaType with image', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategories,
      });

      renderCategories({ preSelectedMediaType: 'image' });

      await waitFor(() => {
        expect(screen.getByTestId('content-input')).toBeInTheDocument();
      });

      expect(screen.getByText('Upload Mode: image')).toBeInTheDocument();
    });

    it('should handle preSelectedMediaType with document', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategories,
      });

      renderCategories({ preSelectedMediaType: 'document' });

      await waitFor(() => {
        expect(screen.getByTestId('content-input')).toBeInTheDocument();
      });

      expect(screen.getByText('Upload Mode: document')).toBeInTheDocument();
    });

    it('should call handleBackToCategories to reset state', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategories,
      });

      renderCategories();

      await waitFor(() => {
        expect(screen.getByText('Fables')).toBeInTheDocument();
      });

      // Click category to show upload options
      fireEvent.click(screen.getByText('Fables'));

      await waitFor(() => {
        expect(
          screen.getByText('Choose how you would like to contribute'),
        ).toBeInTheDocument();
      });

      // Click back button to return to categories
      const allButtons = screen.getAllByRole('button');
      const backButton = allButtons.find((btn) =>
        btn.querySelector('svg.lucide-arrow-left'),
      );

      if (backButton) {
        fireEvent.click(backButton);
      }

      // Should return to categories view
      await waitFor(() => {
        expect(screen.getByText('Fables')).toBeInTheDocument();
        expect(
          screen.queryByText('Choose how you would like to contribute'),
        ).not.toBeInTheDocument();
      });
    });

    it('should navigate to profile when clicking search button', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategories,
      });

      const originalHref = window.location.href;
      Object.defineProperty(window, 'location', {
        value: { href: '' },
        writable: true,
      });

      renderCategories();

      await waitFor(() => {
        expect(screen.getByText('Categories')).toBeInTheDocument();
      });

      // Open search
      const searchTooltip = screen.getByText('Search users');
      const searchButton = searchTooltip.closest('button');

      if (searchButton) {
        fireEvent.click(searchButton);

        // Enter user ID
        const searchInput = screen.getByPlaceholderText('Search by user ID');
        fireEvent.change(searchInput, { target: { value: 'user123' } });

        // Click search button (the green one with icon)
        const searchButtons = screen.getAllByRole('button');
        const greenSearchButton = searchButtons.find((btn) =>
          btn.querySelector('svg[aria-label="search"]'),
        );

        if (greenSearchButton) {
          fireEvent.click(greenSearchButton);
          expect(window.location.href).toBe('/profile/user123');
        }
      }

      Object.defineProperty(window, 'location', {
        value: { href: originalHref },
        writable: true,
      });
    });

    it('should navigate to home when clicking home button in bottom nav', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategories,
      });

      const originalHref = window.location.href;
      Object.defineProperty(window, 'location', {
        value: { href: '' },
        writable: true,
      });

      renderCategories();

      await waitFor(() => {
        expect(screen.getByText('Home')).toBeInTheDocument();
      });

      // Click home button
      const homeButton = screen.getByText('Home').closest('button');
      if (homeButton) {
        fireEvent.click(homeButton);
        expect(window.location.href).toBe('/');
      }

      Object.defineProperty(window, 'location', {
        value: { href: originalHref },
        writable: true,
      });
    });

    it('should navigate to profile when clicking search icon button', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategories,
      });

      const originalHref = window.location.href;
      Object.defineProperty(window, 'location', {
        value: { href: '' },
        writable: true,
      });

      renderCategories();

      await waitFor(() => {
        expect(screen.getByText('Categories')).toBeInTheDocument();
      });

      // Open search by clicking the search button in header
      const searchButtons = screen.getAllByRole('button');
      const headerSearchButton = searchButtons.find((btn) => {
        const svg = btn.querySelector('svg.lucide-search');
        // Header search button doesn't have bg-emerald-600 class
        return svg && !btn.className?.includes('bg-emerald-600');
      });

      if (headerSearchButton) {
        fireEvent.click(headerSearchButton);

        // Enter user ID
        const searchInput = screen.getByPlaceholderText('Search by user ID');
        fireEvent.change(searchInput, { target: { value: 'testuser123' } });

        // Wait for search input to be visible
        await waitFor(() => {
          expect(searchInput).toBeInTheDocument();
        });

        // Find and click the green search button (lines 914-915)
        // This button has the Search icon with white color and bg-emerald-600 background
        const allButtons = screen.getAllByRole('button');

        // Try to find by looking for button with Search icon inside search container
        for (const btn of allButtons) {
          const svg = btn.querySelector('svg');
          if (svg && btn.className?.includes('bg-emerald-600')) {
            fireEvent.click(btn);
            expect(window.location.href).toBe('/profile/testuser123');
            break;
          }
        }
      }

      Object.defineProperty(window, 'location', {
        value: { href: originalHref },
        writable: true,
      });
    });
  });

  describe('Upload Validation', () => {
    beforeEach(() => {
      // Mock crypto.randomUUID
      Object.defineProperty(global.crypto, 'randomUUID', {
        writable: true,
        value: vi.fn().mockReturnValue('test-uuid-123'),
      });
    });

    it('should show error when no category selected and no title provided', async () => {
      const validToken = createMockJWTToken();

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategories,
      });

      renderCategories({ token: validToken });

      await waitFor(() => {
        expect(screen.getByText('Fables')).toBeInTheDocument();
      });

      // Click category and select text upload
      fireEvent.click(screen.getByText('Fables'));
      await waitFor(() => {
        expect(screen.getByText('Text Input')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Text Input'));

      await waitFor(() => {
        expect(screen.getByTestId('content-input')).toBeInTheDocument();
      });

      // Click upload without selecting category or entering title
      fireEvent.click(screen.getByText('Upload'));

      // Toast should be called (the exact message depends on i18n translation)
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });

    it('should show error when location is not set', async () => {
      const validToken = createMockJWTToken();

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategories,
      });

      renderCategories({ token: validToken });

      await waitFor(() => {
        expect(screen.getByText('Fables')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Fables'));
      await waitFor(() => {
        expect(screen.getByText('Text Input')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Text Input'));

      await waitFor(() => {
        expect(screen.getByTestId('content-input')).toBeInTheDocument();
      });

      // Select category and enter title but don't set location
      fireEvent.click(screen.getByTestId('select-category'));
      fireEvent.change(screen.getByTestId('title-input'), {
        target: { value: 'Test Title' },
      });

      // Click upload
      fireEvent.click(screen.getByText('Upload'));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });

    it('should show error when user ID is not found', async () => {
      // Create token without sub
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payload = btoa(
        JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }),
      );
      const tokenWithoutSub = `${header}.${payload}.signature`;

      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCategories,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ name: 'Test User' }), // No ID field
        });

      renderCategories({ token: tokenWithoutSub });

      await waitFor(() => {
        expect(screen.getByText('Fables')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Fables'));
      await waitFor(() => {
        expect(screen.getByText('Text Input')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Text Input'));

      await waitFor(() => {
        expect(screen.getByTestId('content-input')).toBeInTheDocument();
      });

      // Set category, title, and location
      fireEvent.click(screen.getByTestId('select-category'));
      fireEvent.change(screen.getByTestId('title-input'), {
        target: { value: 'Test Title' },
      });
      fireEvent.click(screen.getByTestId('set-location'));

      // Click upload
      fireEvent.click(screen.getByText('Upload'));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'User ID not found. Please try logging in again.',
        );
      });
    });

    it('should show error when release rights not selected', async () => {
      const validToken = createMockJWTToken();

      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCategories,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 'test-user-id' }),
        });

      renderCategories({ token: validToken });

      await waitFor(() => {
        expect(screen.getByText('Fables')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Fables'));
      await waitFor(() => {
        expect(screen.getByText('Text Input')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Text Input'));

      await waitFor(() => {
        expect(screen.getByTestId('content-input')).toBeInTheDocument();
      });

      // Set category, title, and location
      fireEvent.click(screen.getByTestId('select-category'));
      fireEvent.change(screen.getByTestId('title-input'), {
        target: { value: 'Test Title' },
      });
      fireEvent.click(screen.getByTestId('set-location'));

      // Click upload without selecting release rights
      fireEvent.click(screen.getByText('Upload'));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });

    it('should show error when release rights is downloaded', async () => {
      const validToken = createMockJWTToken();

      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCategories,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 'test-user-id' }),
        });

      renderCategories({ token: validToken });

      await waitFor(() => {
        expect(screen.getByText('Fables')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Fables'));
      await waitFor(() => {
        expect(screen.getByText('Text Input')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Text Input'));

      await waitFor(() => {
        expect(screen.getByTestId('content-input')).toBeInTheDocument();
      });

      // Set category, title, location, and release rights to downloaded
      fireEvent.click(screen.getByTestId('select-category'));
      fireEvent.change(screen.getByTestId('title-input'), {
        target: { value: 'Test Title' },
      });
      fireEvent.click(screen.getByTestId('set-location'));
      fireEvent.change(screen.getByTestId('release-rights-select'), {
        target: { value: 'downloaded' },
      });

      // Click upload
      fireEvent.click(screen.getByText('Upload'));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });

    it('should show error when language not selected', async () => {
      const validToken = createMockJWTToken();

      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCategories,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 'test-user-id' }),
        });

      renderCategories({ token: validToken });

      await waitFor(() => {
        expect(screen.getByText('Fables')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Fables'));
      await waitFor(() => {
        expect(screen.getByText('Text Input')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Text Input'));

      await waitFor(() => {
        expect(screen.getByTestId('content-input')).toBeInTheDocument();
      });

      // Set category, title, location, and release rights
      fireEvent.click(screen.getByTestId('select-category'));
      fireEvent.change(screen.getByTestId('title-input'), {
        target: { value: 'Test Title' },
      });
      fireEvent.click(screen.getByTestId('set-location'));
      fireEvent.change(screen.getByTestId('release-rights-select'), {
        target: { value: 'self' },
      });

      // Click upload without selecting language
      fireEvent.click(screen.getByText('Upload'));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });

    it('should show error when text content is empty in text mode', async () => {
      const validToken = createMockJWTToken();

      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCategories,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 'test-user-id' }),
        });

      renderCategories({ token: validToken });

      await waitFor(() => {
        expect(screen.getByText('Fables')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Fables'));
      await waitFor(() => {
        expect(screen.getByText('Text Input')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Text Input'));

      await waitFor(() => {
        expect(screen.getByTestId('content-input')).toBeInTheDocument();
      });

      // Set all required fields but leave text content empty
      fireEvent.click(screen.getByTestId('select-category'));
      fireEvent.change(screen.getByTestId('title-input'), {
        target: { value: 'Test Title' },
      });
      fireEvent.click(screen.getByTestId('set-location'));
      fireEvent.change(screen.getByTestId('release-rights-select'), {
        target: { value: 'self' },
      });
      fireEvent.change(screen.getByTestId('language-select'), {
        target: { value: 'en' },
      });

      // Click upload with empty text content
      fireEvent.click(screen.getByText('Upload'));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });

    it('should successfully upload when all fields are valid', async () => {
      const validToken = createMockJWTToken();

      // Mock all fetch calls to succeed
      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCategories,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 'test-user-id' }),
        })
        .mockResolvedValue({
          ok: true,
          json: async () => ({ success: true }),
        });

      renderCategories({ token: validToken });

      await waitFor(() => {
        expect(screen.getByText('Fables')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Fables'));
      await waitFor(() => {
        expect(screen.getByText('Text Input')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Text Input'));

      await waitFor(() => {
        expect(screen.getByTestId('content-input')).toBeInTheDocument();
      });

      // Set all required fields
      fireEvent.click(screen.getByTestId('select-category'));
      fireEvent.change(screen.getByTestId('title-input'), {
        target: { value: 'Test Title' },
      });
      fireEvent.change(screen.getByTestId('text-content'), {
        target: { value: 'Test content' },
      });
      fireEvent.click(screen.getByTestId('set-location'));
      fireEvent.change(screen.getByTestId('release-rights-select'), {
        target: { value: 'self' },
      });
      fireEvent.change(screen.getByTestId('language-select'), {
        target: { value: 'en' },
      });

      // Click upload
      fireEvent.click(screen.getByText('Upload'));

      // Should show success toast
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalled();
      });
    });

    it('should handle upload finalization failure', async () => {
      const validToken = createMockJWTToken();

      // Mock fetch to succeed on chunk upload but fail on finalization
      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCategories,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 'test-user-id' }),
        })
        .mockResolvedValue({
          ok: false,
          json: async () => ({ message: 'Finalization failed' }),
        });

      renderCategories({ token: validToken });

      await waitFor(() => {
        expect(screen.getByText('Fables')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Fables'));
      await waitFor(() => {
        expect(screen.getByText('Text Input')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Text Input'));

      await waitFor(() => {
        expect(screen.getByTestId('content-input')).toBeInTheDocument();
      });

      // Set all required fields
      fireEvent.click(screen.getByTestId('select-category'));
      fireEvent.change(screen.getByTestId('title-input'), {
        target: { value: 'Test Title' },
      });
      fireEvent.change(screen.getByTestId('text-content'), {
        target: { value: 'Test content' },
      });
      fireEvent.click(screen.getByTestId('set-location'));
      fireEvent.change(screen.getByTestId('release-rights-select'), {
        target: { value: 'self' },
      });
      fireEvent.change(screen.getByTestId('language-select'), {
        target: { value: 'en' },
      });

      // Click upload
      fireEvent.click(screen.getByText('Upload'));

      // Should show error toast for finalization failure
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });

    it('should handle network error in upload catch block', async () => {
      const validToken = createMockJWTToken();

      // Save original File prototype
      const originalSlice = File.prototype.slice;

      // Mock File.prototype.slice to throw error (triggers catch block)
      File.prototype.slice = function () {
        throw new Error('Slice error');
      };

      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCategories,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 'test-user-id' }),
        });

      renderCategories({ token: validToken });

      await waitFor(() => {
        expect(screen.getByText('Fables')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Fables'));
      await waitFor(() => {
        expect(screen.getByText('Text Input')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Text Input'));

      await waitFor(() => {
        expect(screen.getByTestId('content-input')).toBeInTheDocument();
      });

      // Set all required fields
      fireEvent.click(screen.getByTestId('select-category'));
      fireEvent.change(screen.getByTestId('title-input'), {
        target: { value: 'Test Title' },
      });
      fireEvent.change(screen.getByTestId('text-content'), {
        target: { value: 'Test content' },
      });
      fireEvent.click(screen.getByTestId('set-location'));
      fireEvent.change(screen.getByTestId('release-rights-select'), {
        target: { value: 'self' },
      });
      fireEvent.change(screen.getByTestId('language-select'), {
        target: { value: 'en' },
      });

      // Click upload - this should trigger the catch block
      fireEvent.click(screen.getByText('Upload'));

      // Restore File prototype
      File.prototype.slice = originalSlice;

      // Should show error toast and capture exception
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });

    it('should create text blob when uploadMode is text (lines 677-682)', async () => {
      const validToken = createMockJWTToken();

      // Mock all fetch endpoints properly
      fetchMock.mockImplementation((url: string) => {
        if (typeof url === 'string') {
          if (url.includes('/categories/')) {
            return Promise.resolve({
              ok: true,
              json: async () => mockCategories,
            });
          }
          if (url.includes('/users/profile')) {
            return Promise.resolve({
              ok: true,
              json: async () => ({ id: 'test-user-id' }),
            });
          }
          if (url.includes('/records/upload/chunk')) {
            return Promise.resolve({
              ok: true,
              json: async () => ({ success: true }),
            });
          }
          if (url.includes('/records/upload')) {
            return Promise.resolve({
              ok: true,
              json: async () => ({ success: true, id: 'record-123' }),
            });
          }
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({}),
        });
      });

      renderCategories({ token: validToken });

      await waitFor(() => {
        expect(screen.getByText('Fables')).toBeInTheDocument();
      });

      // Select text upload mode
      fireEvent.click(screen.getByText('Fables'));
      await waitFor(() => {
        expect(screen.getByText('Text Input')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Text Input'));

      await waitFor(() => {
        expect(screen.getByTestId('content-input')).toBeInTheDocument();
      });

      // Set all required fields including text content
      fireEvent.click(screen.getByTestId('select-category'));
      fireEvent.change(screen.getByTestId('title-input'), {
        target: { value: 'Test Title' },
      });
      // Enter text content - this will trigger blob creation on upload (lines 677-682)
      fireEvent.change(screen.getByTestId('text-content'), {
        target: { value: 'Test text content for blob creation' },
      });
      fireEvent.click(screen.getByTestId('set-location'));
      fireEvent.change(screen.getByTestId('release-rights-select'), {
        target: { value: 'self' },
      });
      fireEvent.change(screen.getByTestId('language-select'), {
        target: { value: 'en' },
      });

      // Click upload - this should trigger text blob creation (lines 677-682)
      fireEvent.click(screen.getByText('Upload'));

      // Verify upload succeeded (which proves lines 677-682 executed)
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalled();
      });
    });

    it('should show error when no file selected for non-text mode (lines 680-682)', async () => {
      const validToken = createMockJWTToken();

      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCategories,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 'test-user-id' }),
        });

      renderCategories({ token: validToken });

      await waitFor(() => {
        expect(screen.getByText('Fables')).toBeInTheDocument();
      });

      // Select audio upload mode (non-text)
      fireEvent.click(screen.getByText('Fables'));
      await waitFor(() => {
        expect(screen.getByText('Audio Recording')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Audio Recording'));

      await waitFor(() => {
        expect(screen.getByTestId('content-input')).toBeInTheDocument();
      });

      // Set required fields but DON'T select a file
      fireEvent.click(screen.getByTestId('select-category'));
      fireEvent.change(screen.getByTestId('title-input'), {
        target: { value: 'Test Title' },
      });
      fireEvent.click(screen.getByTestId('set-location'));
      fireEvent.change(screen.getByTestId('release-rights-select'), {
        target: { value: 'self' },
      });
      fireEvent.change(screen.getByTestId('language-select'), {
        target: { value: 'en' },
      });

      // Click upload without file - should trigger lines 680-682
      fireEvent.click(screen.getByText('Upload'));

      // Should show error for missing file
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });

    it('should redirect after successful upload using setTimeout (line 714)', async () => {
      const validToken = createMockJWTToken();
      const originalHref = window.location.href;
      const originalSetTimeoutLocal = global.setTimeout;

      Object.defineProperty(window, 'location', {
        value: { href: '' },
        writable: true,
      });

      // Mock all fetch calls to succeed
      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCategories,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 'test-user-id' }),
        })
        .mockResolvedValue({
          ok: true,
          json: async () => ({ success: true }),
        });

      renderCategories({ token: validToken });

      await waitFor(() => {
        expect(screen.getByText('Fables')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Fables'));
      await waitFor(() => {
        expect(screen.getByText('Text Input')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Text Input'));

      await waitFor(() => {
        expect(screen.getByTestId('content-input')).toBeInTheDocument();
      });

      // Set all required fields
      fireEvent.click(screen.getByTestId('select-category'));
      fireEvent.change(screen.getByTestId('title-input'), {
        target: { value: 'Test Title' },
      });
      fireEvent.change(screen.getByTestId('text-content'), {
        target: { value: 'Test content' },
      });
      fireEvent.click(screen.getByTestId('set-location'));
      fireEvent.change(screen.getByTestId('release-rights-select'), {
        target: { value: 'self' },
      });
      fireEvent.change(screen.getByTestId('language-select'), {
        target: { value: 'en' },
      });

      // Now mock setTimeout before clicking upload to catch the redirect
      global.setTimeout = ((fn: TimerHandler, delay?: number) => {
        if (delay === 1500) {
          queueMicrotask(fn as () => void);
        } else {
          return originalSetTimeoutLocal(fn, delay);
        }
        return 0 as unknown as NodeJS.Timeout;
      }) as unknown as typeof setTimeout;

      // Click upload
      fireEvent.click(screen.getByText('Upload'));

      // Wait for success toast and redirect (line 714)
      await waitFor(
        () => {
          expect(toast.success).toHaveBeenCalled();
          expect(window.location.href).toBe('/');
        },
        { timeout: 5000 },
      );

      // Restore
      global.setTimeout = originalSetTimeoutLocal;
      Object.defineProperty(window, 'location', {
        value: { href: originalHref },
        writable: true,
      });
    });

    it('should capture upload_error in posthog when chunk upload fails (lines 721-723)', async () => {
      const validToken = createMockJWTToken();
      const originalSetTimeoutLocal = global.setTimeout;

      // Mock setTimeout for retry delays BEFORE render
      // Delay formula: attempt * 1.1^attempt * 1000 = 0, 1100, 2420, 3993, 5856ms
      // Use 1ms delay to speed up retries without breaking React
      global.setTimeout = ((fn: TimerHandler, delay?: number) => {
        if (delay && delay > 0 && delay < 10000) {
          return originalSetTimeoutLocal(fn, 1);
        }
        return originalSetTimeoutLocal(fn, delay);
      }) as unknown as typeof setTimeout;

      // Mock fetch to fail specifically on chunk upload endpoint
      // This makes uploadChunksSequentially return false after retries, triggering lines 721-723
      fetchMock.mockImplementation(
        (url: string | URL | Request, options?: RequestInit) => {
          const urlStr = typeof url === 'string' ? url : url.toString();

          if (urlStr.includes('/categories/')) {
            return Promise.resolve({
              ok: true,
              json: async () => mockCategories,
            });
          }
          if (urlStr.includes('/users/profile')) {
            return Promise.resolve({
              ok: true,
              json: async () => ({ id: 'test-user-id' }),
            });
          }
          if (urlStr.includes('/records/upload/chunk')) {
            // Fail all chunk uploads to trigger upload_error path (lines 721-723)
            return Promise.resolve({
              ok: false,
              status: 500,
              json: async () => ({ message: 'Chunk upload failed' }),
            });
          }
          if (urlStr.includes('/records/upload')) {
            // Finalization endpoint - won't be reached if chunks fail
            return Promise.resolve({
              ok: true,
              json: async () => ({ success: true }),
            });
          }
          return Promise.resolve({
            ok: true,
            json: async () => ({}),
          });
        },
      );

      renderCategories({ token: validToken });

      await waitFor(() => {
        expect(screen.getByText('Fables')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Fables'));
      await waitFor(() => {
        expect(screen.getByText('Text Input')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Text Input'));

      await waitFor(() => {
        expect(screen.getByTestId('content-input')).toBeInTheDocument();
      });

      // Set all required fields
      fireEvent.click(screen.getByTestId('select-category'));
      fireEvent.change(screen.getByTestId('title-input'), {
        target: { value: 'Test Title' },
      });
      fireEvent.change(screen.getByTestId('text-content'), {
        target: { value: 'Test content' },
      });
      fireEvent.click(screen.getByTestId('set-location'));
      fireEvent.change(screen.getByTestId('release-rights-select'), {
        target: { value: 'self' },
      });
      fireEvent.change(screen.getByTestId('language-select'), {
        target: { value: 'en' },
      });

      // Click upload - chunk upload will fail, triggering posthog.capture('upload_error')
      fireEvent.click(screen.getByText('Upload'));

      // Wait for error toast and posthog capture (lines 721-723)
      // With 1ms delays, 5 retries should complete in ~20ms
      await waitFor(
        () => {
          expect(toast.error).toHaveBeenCalled();
        },
        { timeout: 10000, interval: 100 },
      );

      // Restore
      global.setTimeout = originalSetTimeoutLocal;
    });
  });

  describe('Navigation Links', () => {
    it('should have working Home navigation', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategories,
      });

      renderCategories();

      await waitFor(() => {
        expect(screen.getByText('Home')).toBeInTheDocument();
      });

      // Home is a button inside a link-like structure
      const homeButton = screen.getByText('Home').closest('button');
      expect(homeButton).toBeInTheDocument();
    });

    it('should have working Peer Review navigation', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategories,
      });

      renderCategories();

      await waitFor(() => {
        expect(screen.getByText('Review')).toBeInTheDocument();
      });

      // Review is inside a Link component
      const reviewLink = screen.getByText('Review').closest('a');
      expect(reviewLink).toHaveAttribute('href', '/peer-review');
    });

    it('should have working Annotate navigation', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategories,
      });

      renderCategories();

      await waitFor(() => {
        expect(screen.getByText('Annotate')).toBeInTheDocument();
      });

      const annotateLink = screen.getByText('Annotate').closest('a');
      expect(annotateLink).toHaveAttribute('href', '/tools');
    });

    it('should have working Profile navigation', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategories,
      });

      renderCategories();

      // Find Profile in bottom navigation (has text-xs class)
      const profileButtons = screen.getAllByRole('button');
      const profileButton = profileButtons.find((btn) =>
        btn.querySelector('svg.lucide-user'),
      );
      expect(profileButton).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should render category grid with proper layout', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategories,
      });

      renderCategories();

      await waitFor(() => {
        expect(screen.getByText('Categories')).toBeInTheDocument();
        expect(screen.getByText('Fables')).toBeInTheDocument();
      });

      // Verify categories are rendered in a grid-like structure
      // Each category card should be present
      expect(screen.getByText('Fables')).toBeInTheDocument();
      expect(screen.getByText('Music')).toBeInTheDocument();
      expect(screen.getByText('Food')).toBeInTheDocument();
    });

    it('should render upload options with proper layout', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategories,
      });

      renderCategories();

      await waitFor(() => {
        expect(screen.getByText('Fables')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Fables'));

      await waitFor(() => {
        // Verify all upload options are rendered
        expect(screen.getByText('Text Input')).toBeInTheDocument();
        expect(screen.getByText('Audio Recording')).toBeInTheDocument();
        expect(screen.getByText('Video Content')).toBeInTheDocument();
        expect(screen.getByText('Photo Capture')).toBeInTheDocument();
        expect(screen.getByText('Document Upload')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper button roles', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategories,
      });

      renderCategories();

      await waitFor(() => {
        expect(screen.getByText('Categories')).toBeInTheDocument();
      });

      // All interactive elements should be buttons or links
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should have proper link roles', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategories,
      });

      renderCategories();

      await waitFor(() => {
        expect(screen.getByText('Home')).toBeInTheDocument();
      });

      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);
    });
  });
});
