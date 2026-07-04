import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CompleteProfileInternPage from '../../../src/pages/CompleteProfileInternPage';
import { MemoryRouter } from 'react-router-dom';

/* Mock Dependencies */
const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...(actual as object),
    useNavigate: () => navigateMock,
    useLocation: () => ({ state: { fromEdit: false } }),
  };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('@/lib/institutionApi', () => ({
  fetchEnums: vi.fn().mockResolvedValue({
    academic_streams: ['Engineering', 'Arts', 'Science'],
  }),
  fetchInstitution: vi.fn().mockResolvedValue({
    name: 'Test Institution',
    academic_stream: 'Engineering',
  }),
  fetchUniversityNames: vi.fn().mockResolvedValue(['Test University']),
  fetchCollegeNames: vi.fn().mockResolvedValue(['Test College']),
  fetchInstitutions: vi
    .fn()
    .mockResolvedValue([{ id: 'inst1', name: 'Test Institution' }]),
}));

// We mock the child components minimally to verify prop references
const mockInstitutionSelectorOnChange = vi.fn();
vi.mock('@/components/InstitutionSelector', () => {
  return {
    default: ({
      onChange,
      academicStream,
    }: {
      onChange: (id: string) => void;
      academicStream?: string | null;
    }) => {
      // simulate an effect that runs once properly or catches stable/unstable refs
      mockInstitutionSelectorOnChange(onChange);
      return (
        <div data-testid="institution-selector">
          Institution Selector - Stream: {academicStream}
        </div>
      );
    },
  };
});

describe('CompleteProfileInternPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('token', 'fake-token');

    // Mock global fetch
    global.fetch = vi.fn((url: string | URL | Request) => {
      const urlStr = url.toString();
      if (urlStr.includes('/auth/me')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: 'user-1' }),
        } as Response);
      }
      if (urlStr.includes('/users/')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              id: 'user-1',
              academic_stream: 'Engineering',
              institution_id: 'inst1',
            }),
        } as Response);
      }
      return Promise.reject(new Error('not mocked'));
    });
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <CompleteProfileInternPage />
      </MemoryRouter>,
    );
  };

  it('renders correctly after fetching data', async () => {
    renderComponent();

    // Verify it passes loading state
    await waitFor(() => {
      expect(screen.queryByTestId('institution-selector')).toBeInTheDocument();
    });

    expect(screen.getByText(/nav.completeYourProfile/i)).toBeInTheDocument();
  });

  it('provides a stable callback for InstitutionSelector onChange to prevent render loops', async () => {
    const { rerender } = renderComponent();

    await waitFor(() => {
      expect(screen.queryByTestId('institution-selector')).toBeInTheDocument();
    });

    // Record the first reference of the mapped onChange callback
    expect(mockInstitutionSelectorOnChange).toHaveBeenCalled();
    const firstCallbackRef = mockInstitutionSelectorOnChange.mock.calls[0][0];

    // Force a re-render
    rerender(
      <MemoryRouter>
        <CompleteProfileInternPage />
      </MemoryRouter>,
    );

    // After re-render, verify it uses the SAME exact callback reference
    const secondCallbackRef = mockInstitutionSelectorOnChange.mock.calls[1][0];

    // This is the core fix to prevent the infinite loop:
    expect(firstCallbackRef).toBe(secondCallbackRef);
  });
});
