import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SREFCard from '@/components/sref/SREFCard';
import { testSREFData } from '@/lib/data/sref-data';

describe('SREFCard Component', () => {
  const mockSREF = testSREFData[0];

  beforeEach(() => {
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn(() => Promise.resolve()),
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders SREF card with all required elements', () => {
    render(<SREFCard sref={mockSREF} />);
    
    // Check if SREF title is displayed
    expect(screen.getByText(mockSREF.title)).toBeInTheDocument();
    
    // Check if SREF code is displayed
    expect(screen.getByText(mockSREF.code)).toBeInTheDocument();
    
    // Check if categories are displayed
    if (mockSREF.categories && mockSREF.categories.length > 0) {
      expect(screen.getByText(mockSREF.categories[0])).toBeInTheDocument();
    }
    
    // Check if images are rendered
    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(mockSREF.images.length);
  });

  it('displays correct stats (likes, bookmarks, etc.)', () => {
    render(<SREFCard sref={mockSREF} />);
    
    // Check if like count is displayed
    if (mockSREF.stats.likes > 0) {
      expect(screen.getByText(mockSREF.stats.likes.toString())).toBeInTheDocument();
    }
    
    // Check if bookmark count is displayed  
    if (mockSREF.stats.bookmarks > 0) {
      expect(screen.getByText(mockSREF.stats.bookmarks.toString())).toBeInTheDocument();
    }
  });

  it('handles copy to clipboard functionality', async () => {
    render(<SREFCard sref={mockSREF} />);
    
    const copyButton = screen.getByRole('button', { name: /copy/i });
    expect(copyButton).toBeInTheDocument();
    
    fireEvent.click(copyButton);
    
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockSREF.code);
    });
  });

  it('handles like button functionality', () => {
    render(<SREFCard sref={mockSREF} />);
    
    const likeButton = screen.getByRole('button', { name: /like/i });
    expect(likeButton).toBeInTheDocument();
    
    fireEvent.click(likeButton);
    
    // Should toggle the like state
    expect(likeButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('handles bookmark functionality', () => {
    render(<SREFCard sref={mockSREF} />);
    
    const bookmarkButton = screen.getByRole('button', { name: /bookmark/i });
    expect(bookmarkButton).toBeInTheDocument();
    
    fireEvent.click(bookmarkButton);
    
    // Should toggle the bookmark state
    expect(bookmarkButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('navigates to SREF detail page when clicked', () => {
    render(<SREFCard sref={mockSREF} />);
    
    const cardLink = screen.getByRole('link');
    expect(cardLink).toHaveAttribute('href', `/sref/${mockSREF.code}`);
  });

  it('displays featured badge for featured SREFs', () => {
    const featuredSREF = { ...mockSREF, featured: true };
    render(<SREFCard sref={featuredSREF} />);
    
    expect(screen.getByText(/featured/i)).toBeInTheDocument();
  });

  it('displays correct image with alt text', () => {
    render(<SREFCard sref={mockSREF} />);
    
    const image = screen.getByAltText(`${mockSREF.title} - SREF ${mockSREF.code}`);
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', expect.stringContaining(mockSREF.images[0].url));
  });

  it('handles loading states correctly', () => {
    render(<SREFCard sref={mockSREF} priority={true} />);
    
    // Check if high priority images are loaded first
    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('loading', 'eager');
  });

  it('is accessible with proper ARIA attributes', () => {
    render(<SREFCard sref={mockSREF} />);
    
    const copyButton = screen.getByRole('button', { name: /copy/i });
    const likeButton = screen.getByRole('button', { name: /like/i });
    const bookmarkButton = screen.getByRole('button', { name: /bookmark/i });
    
    expect(copyButton).toHaveAttribute('aria-label');
    expect(likeButton).toHaveAttribute('aria-label');
    expect(bookmarkButton).toHaveAttribute('aria-label');
  });

  it('handles error states gracefully', () => {
    const invalidSREF = {
      ...mockSREF,
      images: [],
    };
    
    render(<SREFCard sref={invalidSREF} />);
    
    // Should still render the card without breaking
    expect(screen.getByText(invalidSREF.title)).toBeInTheDocument();
  });
});