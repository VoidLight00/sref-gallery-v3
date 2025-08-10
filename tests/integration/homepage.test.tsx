import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import HomePage from '@/app/page';
import { testSREFData } from '@/lib/data/sref-data';

// Mock the data to ensure consistent testing
jest.mock('@/lib/data/sref-data', () => ({
  testSREFData: [
    {
      id: 'sref-test-1',
      code: '1234567890',
      title: 'Test SREF 1',
      description: 'Test description 1',
      featured: true,
      categories: ['anime', 'art'],
      images: [{
        id: 'img-1',
        url: '/test-image-1.webp',
        filename: 'test-1.webp',
        width: 1024,
        height: 1024
      }],
      stats: {
        likes: 150,
        bookmarks: 75,
        views: 2500,
        downloads: 120
      },
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z'
    },
    {
      id: 'sref-test-2',
      code: '2345678901',
      title: 'Test SREF 2',
      description: 'Test description 2',
      featured: true,
      categories: ['photography'],
      images: [{
        id: 'img-2',
        url: '/test-image-2.webp',
        filename: 'test-2.webp',
        width: 1024,
        height: 1024
      }],
      stats: {
        likes: 200,
        bookmarks: 100,
        views: 3000,
        downloads: 150
      },
      createdAt: '2024-01-16T10:00:00Z',
      updatedAt: '2024-01-16T10:00:00Z'
    }
  ]
}));

describe('HomePage Integration Tests', () => {
  beforeEach(() => {
    // Mock IntersectionObserver for image lazy loading
    global.IntersectionObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the complete homepage layout', async () => {
    render(<HomePage />);
    
    // Check header is present
    expect(screen.getByRole('banner')).toBeInTheDocument();
    
    // Check hero section
    expect(screen.getByText(/SREF Gallery/i)).toBeInTheDocument();
    
    // Check featured SREFs section
    expect(screen.getByText('⭐ Featured SREF Codes')).toBeInTheDocument();
    expect(screen.getByText('Hand-picked style references that deliver exceptional results')).toBeInTheDocument();
    
    // Check newest SREFs section
    expect(screen.getByText('🆕 Newest SREF Codes')).toBeInTheDocument();
    expect(screen.getByText('Latest additions to our SREF collection')).toBeInTheDocument();
    
    // Check footer
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('displays featured SREF cards correctly', async () => {
    render(<HomePage />);
    
    await waitFor(() => {
      // Should display featured SREFs
      expect(screen.getByText('Test SREF 1')).toBeInTheDocument();
      expect(screen.getByText('Test SREF 2')).toBeInTheDocument();
    });
    
    // Check SREF codes are displayed
    expect(screen.getByText('1234567890')).toBeInTheDocument();
    expect(screen.getByText('2345678901')).toBeInTheDocument();
  });

  it('displays newest SREF cards correctly', async () => {
    render(<HomePage />);
    
    await waitFor(() => {
      // Newest should be sorted by createdAt desc
      // Test SREF 2 was created after Test SREF 1, so should appear first in newest
      const newestSection = screen.getByText('🆕 Newest SREF Codes').parentElement;
      expect(newestSection).toBeInTheDocument();
    });
  });

  it('has functional navigation links', () => {
    render(<HomePage />);
    
    // Check "View All" links
    const viewAllLinks = screen.getAllByText('View All');
    expect(viewAllLinks.length).toBeGreaterThan(0);
    
    // Check that links have correct href attributes
    const discoverLink = screen.getByRole('link', { name: /view all featured srefs/i });
    expect(discoverLink).toHaveAttribute('href', '/discover');
    
    const newestLink = screen.getByRole('link', { name: /view all newest srefs/i });
    expect(newestLink).toHaveAttribute('href', '/discover?sort=newest');
  });

  it('has working footer navigation', () => {
    render(<HomePage />);
    
    // Check footer links
    expect(screen.getByRole('link', { name: 'Discover' })).toHaveAttribute('href', '/discover');
    expect(screen.getByRole('link', { name: 'Categories' })).toHaveAttribute('href', '/categories');
  });

  it('displays category grid component', () => {
    render(<HomePage />);
    
    // CategoryGrid component should be rendered
    // This test ensures the component integration is working
    const categorySection = screen.getByText(/categories/i).closest('section');
    expect(categorySection).toBeInTheDocument();
  });

  it('shows correct meta information', () => {
    render(<HomePage />);
    
    // Check copyright notice
    expect(screen.getByText(/© 2024 SREF Gallery/)).toBeInTheDocument();
    expect(screen.getByText(/Made with ❤️ for the Midjourney community/)).toBeInTheDocument();
  });

  it('is responsive with mobile-specific elements', () => {
    render(<HomePage />);
    
    // Check mobile-specific "View All" buttons exist
    const mobileViewAllButtons = screen.getAllByText(/View All.*SREFs/);
    expect(mobileViewAllButtons.length).toBeGreaterThan(0);
  });

  it('loads images with correct optimization settings', async () => {
    render(<HomePage />);
    
    await waitFor(() => {
      const images = screen.getAllByRole('img');
      expect(images.length).toBeGreaterThan(0);
      
      // Check first few images have priority loading
      images.slice(0, 3).forEach(img => {
        expect(img).toHaveAttribute('loading', 'eager');
      });
    });
  });

  it('handles empty or error states gracefully', () => {
    // Mock empty data
    const originalData = require('@/lib/data/sref-data').testSREFData;
    require('@/lib/data/sref-data').testSREFData = [];
    
    render(<HomePage />);
    
    // Should still render layout without crashing
    expect(screen.getByText('⭐ Featured SREF Codes')).toBeInTheDocument();
    expect(screen.getByText('🆕 Newest SREF Codes')).toBeInTheDocument();
    
    // Restore original data
    require('@/lib/data/sref-data').testSREFData = originalData;
  });

  it('has proper semantic HTML structure', () => {
    render(<HomePage />);
    
    // Check semantic HTML elements
    expect(screen.getByRole('banner')).toBeInTheDocument(); // header
    expect(screen.getByRole('main')).toBeInTheDocument(); // main content
    expect(screen.getByRole('contentinfo')).toBeInTheDocument(); // footer
    
    // Check section headings
    const headings = screen.getAllByRole('heading');
    expect(headings.length).toBeGreaterThan(0);
  });

  it('supports dark mode classes', () => {
    render(<HomePage />);
    
    const mainContainer = screen.getByText('⭐ Featured SREF Codes').closest('div');
    expect(mainContainer).toHaveClass('min-h-screen', 'bg-gray-50', 'dark:bg-gray-900');
  });
});