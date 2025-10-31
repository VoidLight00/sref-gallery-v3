// API client for frontend to backend communication

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

interface ApiOptions extends RequestInit {
  params?: Record<string, string>;
}

class ApiClient {
  private async request<T = any>(
    endpoint: string,
    options: ApiOptions = {}
  ): Promise<T> {
    const { params, ...fetchOptions } = options;
    
    let url = `${API_BASE_URL}${endpoint}`;
    if (params) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams.toString()}`;
    }

    const response = await fetch(url, {
      ...fetchOptions,
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // SREF endpoints
  async getSrefs(params?: {
    page?: number;
    limit?: number;
    category?: string;
    tag?: string;
    search?: string;
    featured?: boolean;
    premium?: boolean;
  }) {
    return this.request('/api/sref', {
      params: params as any,
    });
  }

  async getSref(id: string) {
    return this.request(`/api/sref/${id}`);
  }

  async createSref(data: {
    code: string;
    title: string;
    description?: string;
    promptExamples?: string[];
    categoryIds?: string[];
    tagIds?: string[];
    imageUrls?: string[];
    premium?: boolean;
  }) {
    return this.request('/api/sref', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSref(id: string, data: Partial<{
    title: string;
    description: string;
    promptExamples: string[];
    categoryIds: string[];
    tagIds: string[];
    imageUrls: string[];
    featured: boolean;
    premium: boolean;
    status: string;
  }>) {
    return this.request(`/api/sref/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteSref(id: string) {
    return this.request(`/api/sref/${id}`, {
      method: 'DELETE',
    });
  }

  // Interaction endpoints
  async likeSref(id: string) {
    return this.request(`/api/sref/${id}/like`, {
      method: 'POST',
    });
  }

  async favoriteSref(id: string) {
    return this.request(`/api/sref/${id}/favorite`, {
      method: 'POST',
    });
  }

  // User endpoints
  async getUserProfile() {
    return this.request('/api/user/profile');
  }

  async updateUserProfile(data: {
    name?: string;
    bio?: string;
    website?: string;
    avatar?: string;
    currentPassword?: string;
    newPassword?: string;
  }) {
    return this.request('/api/user/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Search endpoint
  async search(query: string, options?: {
    type?: 'all' | 'sref' | 'category' | 'tag' | 'user';
    limit?: number;
  }) {
    return this.request('/api/search', {
      params: {
        q: query,
        ...options,
      } as any,
    });
  }

  async advancedSearch(data: {
    query?: string;
    categories?: string[];
    tags?: string[];
    minViews?: number;
    maxViews?: number;
    minLikes?: number;
    featured?: boolean;
    premium?: boolean;
    dateFrom?: string;
    dateTo?: string;
  }) {
    return this.request('/api/search', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Category endpoints
  async getCategories() {
    return this.request('/api/categories');
  }

  // Tag endpoints
  async getTags() {
    return this.request('/api/tags');
  }

  // Auth helper
  async getCurrentUser() {
    const response = await fetch('/api/auth/session');
    const session = await response.json();
    return session?.user || null;
  }
}

export const api = new ApiClient();