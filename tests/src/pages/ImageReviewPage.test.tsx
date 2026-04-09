import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock ReviewPageBase component - must be before the ImageReviewPage import
vi.mock('@/components/ReviewPageBase', () => ({
  default: vi.fn(({ title, description, mediaTypes }) => (
    <div data-testid="review-page-base">
      <h1 data-testid="title">{title}</h1>
      <p data-testid="description">{description}</p>
      <span data-testid="media-types">{JSON.stringify(mediaTypes)}</span>
    </div>
  )),
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue: string) => defaultValue,
  }),
}));

import ImageReviewPage from '@/pages/ImageReviewPage';

describe('ImageReviewPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<ImageReviewPage />);
    expect(screen.getByTestId('review-page-base')).toBeInTheDocument();
  });

  it('displays the correct title for image annotation', () => {
    render(<ImageReviewPage />);
    const titleElement = screen.getByTestId('title');
    expect(titleElement).toHaveTextContent('Image Annotation');
  });

  it('displays the correct description for image annotation', () => {
    render(<ImageReviewPage />);
    const descriptionElement = screen.getByTestId('description');
    expect(descriptionElement).toHaveTextContent(
      'Annotate objects, regions, and patterns in images.',
    );
  });

  it('passes image as the media type', () => {
    render(<ImageReviewPage />);
    const mediaTypesElement = screen.getByTestId('media-types');
    expect(mediaTypesElement).toHaveTextContent(JSON.stringify(['image']));
  });

  it('uses ReviewPageBase component with correct props', () => {
    render(<ImageReviewPage />);

    expect(screen.getByTestId('review-page-base')).toBeInTheDocument();
    expect(screen.getByTestId('title')).toHaveTextContent('Image Annotation');
    expect(screen.getByTestId('description')).toHaveTextContent(
      'Annotate objects, regions, and patterns in images.',
    );
    expect(screen.getByTestId('media-types')).toHaveTextContent(
      JSON.stringify(['image']),
    );
  });
});
