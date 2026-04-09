import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock MediaTypeWheel component - must be before the Index import
vi.mock('@/components/MediaTypeWheel', () => ({
  default: vi.fn(({ onSelect, selectedType }) => (
    <div data-testid="media-type-wheel">
      <span data-testid="selected-type">{selectedType}</span>
      <button data-testid="select-image" onClick={() => onSelect('image')}>
        Select Image
      </button>
      <button data-testid="select-text" onClick={() => onSelect('text')}>
        Select Text
      </button>
      <button data-testid="select-audio" onClick={() => onSelect('audio')}>
        Select Audio
      </button>
      <button data-testid="select-video" onClick={() => onSelect('video')}>
        Select Video
      </button>
      <button
        data-testid="select-document"
        onClick={() => onSelect('document')}
      >
        Select Document
      </button>
    </div>
  )),
}));

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
}));

import Index from '@/pages/Index';
import { useNavigate } from 'react-router-dom';

describe('Index', () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
  });

  it('renders without crashing', () => {
    render(<Index />);
    expect(screen.getByTestId('media-type-wheel')).toBeInTheDocument();
  });

  it('passes null as selectedType to MediaTypeWheel', () => {
    render(<Index />);
    expect(screen.getByTestId('selected-type')).toHaveTextContent('');
  });

  it('navigates to image upload page when image is selected', () => {
    render(<Index />);
    screen.getByTestId('select-image').click();
    expect(mockNavigate).toHaveBeenCalledWith('/upload/image');
  });

  it('navigates to text upload page when text is selected', () => {
    render(<Index />);
    screen.getByTestId('select-text').click();
    expect(mockNavigate).toHaveBeenCalledWith('/upload/text');
  });

  it('navigates to audio upload page when audio is selected', () => {
    render(<Index />);
    screen.getByTestId('select-audio').click();
    expect(mockNavigate).toHaveBeenCalledWith('/upload/audio');
  });

  it('navigates to video upload page when video is selected', () => {
    render(<Index />);
    screen.getByTestId('select-video').click();
    expect(mockNavigate).toHaveBeenCalledWith('/upload/video');
  });

  it('navigates to document upload page when document is selected', () => {
    render(<Index />);
    screen.getByTestId('select-document').click();
    expect(mockNavigate).toHaveBeenCalledWith('/upload/document');
  });
});
