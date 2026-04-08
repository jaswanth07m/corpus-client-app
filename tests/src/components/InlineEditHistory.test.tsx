import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

import { InlineEditHistory } from '@/components/InlineEditHistory';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

type MockFetch = ReturnType<typeof vi.fn>;

const recordId = 'record-123';
const token = 'token-abc';

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

function mockOkResponse(data: unknown): Response {
  return {
    ok: true,
    json: vi.fn().mockResolvedValue(data),
  } as unknown as Response;
}

describe('InlineEditHistory', () => {
  let fetchMock: MockFetch;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('shows a loader initially and fetches edit history with the expected request', async () => {
    const deferred = createDeferred<Response>();
    fetchMock.mockReturnValueOnce(deferred.promise);

    render(<InlineEditHistory recordId={recordId} token={token} />);

    expect(screen.getByText('common.editHistory')).toBeInTheDocument();
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      'undefined/history/record/record-123/history',
      {
        headers: {
          Authorization: 'Bearer token-abc',
        },
      },
    );

    deferred.resolve(mockOkResponse([]));

    await waitFor(() => {
      expect(
        screen.getByText('common.noEditHistoryFoundForThisRecord'),
      ).toBeInTheDocument();
    });
  });

  it('renders edit history details, fallback values, and toggles entries open and closed', async () => {
    const createdAt = '2026-01-15T10:30:00.000Z';
    fetchMock.mockResolvedValueOnce(
      mockOkResponse([
        {
          uid: 'entry-1',
          version_number: 3,
          created_at: createdAt,
          field_changes: {},
        },
        {
          uid: 'entry-2',
          version_number: 4,
          created_at: createdAt,
          changed_by: '',
          change_type: '',
          change_source: undefined,
          field_changes: {
            beneficiary_name: {
              old_value: 'Alice',
              new_value: 'Bob',
            },
            is_active: {
              old_value: true,
              new_value: false,
            },
            notes: {
              old_value: null,
              new_value: undefined,
            },
          },
        },
      ]),
    );

    render(<InlineEditHistory recordId={recordId} token={token} />);

    const versionThreeButton = await screen.findByRole('button', {
      name: /Version 3/i,
    });
    const versionFourButton = screen.getByRole('button', {
      name: /Version 4/i,
    });

    expect(screen.getByText(`Version 3`)).toBeInTheDocument();
    expect(screen.getByText(`Version 4`)).toBeInTheDocument();
    expect(
      screen.getAllByText(new Date(createdAt).toLocaleString(), {
        exact: false,
      }),
    ).toHaveLength(2);

    fireEvent.click(versionThreeButton);

    const firstEntry = versionThreeButton.closest('li');
    expect(firstEntry).not.toBeNull();
    expect(
      within(firstEntry as HTMLElement).getByText('categories.changeType'),
    ).toBeInTheDocument();
    expect(within(firstEntry as HTMLElement).getAllByText('N/A')).toHaveLength(
      3,
    );
    expect(
      within(firstEntry as HTMLElement).queryByText('common.field.changes'),
    ).not.toBeInTheDocument();

    fireEvent.click(versionThreeButton);

    await waitFor(() => {
      expect(
        screen.queryByText('categories.changeType'),
      ).not.toBeInTheDocument();
    });

    fireEvent.click(versionFourButton);

    expect(screen.getByText('common.field.changes')).toBeInTheDocument();
    expect(screen.getByText('Beneficiary Name')).toBeInTheDocument();
    expect(screen.getByText('Is Active')).toBeInTheDocument();
    expect(screen.getByText('Notes')).toBeInTheDocument();
    expect(screen.getAllByText('common.old')).toHaveLength(3);
    expect(screen.getAllByText('common.new')).toHaveLength(3);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('true')).toBeInTheDocument();
    expect(screen.getByText('false')).toBeInTheDocument();

    const notesItem = screen.getByText('Notes').closest('li');
    expect(notesItem).not.toBeNull();
    expect(within(notesItem as HTMLElement).getAllByText('N/A')).toHaveLength(
      2,
    );
  });

  it('shows the empty state when the API returns no history entries', async () => {
    fetchMock.mockResolvedValueOnce(mockOkResponse([]));

    render(<InlineEditHistory recordId={recordId} token={token} />);

    expect(
      await screen.findByText('common.noEditHistoryFoundForThisRecord'),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Version /i)).not.toBeInTheDocument();
  });

  it('shows an error when the API responds with a non-ok status', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: vi.fn(),
    } as unknown as Response);

    render(<InlineEditHistory recordId={recordId} token={token} />);

    expect(
      await screen.findByText('Failed to fetch edit history'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('common.noEditHistoryFoundForThisRecord'),
    ).not.toBeInTheDocument();
  });

  it('shows a generic error when the fetch rejection is not an Error instance', async () => {
    fetchMock.mockRejectedValueOnce('network down');

    render(<InlineEditHistory recordId={recordId} token={token} />);

    expect(
      await screen.findByText('An unknown error occurred.'),
    ).toBeInTheDocument();
  });
});
