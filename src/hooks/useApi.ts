import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

// Generic hook for API calls with loading and error states
export function useApi<T = any>(
  apiCall: () => Promise<T>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiCall();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An error occurred'));
    } finally {
      setLoading(false);
    }
  }, dependencies);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// Hook for fetching SREFs
export function useSrefs(params?: {
  page?: number;
  limit?: number;
  category?: string;
  tag?: string;
  search?: string;
  featured?: boolean;
  premium?: boolean;
}) {
  return useApi(() => api.getSrefs(params), [JSON.stringify(params)]);
}

// Hook for fetching a single SREF
export function useSref(id: string) {
  return useApi(() => api.getSref(id), [id]);
}

// Hook for user profile
export function useUserProfile() {
  return useApi(() => api.getUserProfile(), []);
}

// Hook for categories
export function useCategories() {
  return useApi(() => api.getCategories(), []);
}

// Hook for tags
export function useTags() {
  return useApi(() => api.getTags(), []);
}

// Hook for search with debouncing
export function useSearch(query: string, delay: number = 300) {
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [query, delay]);
  
  return useApi(
    () => debouncedQuery ? api.search(debouncedQuery) : Promise.resolve(null),
    [debouncedQuery]
  );
}

// Hook for mutations (create, update, delete)
export function useMutation<TData = any, TVariables = any>(
  mutationFn: (variables: TVariables) => Promise<TData>
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<TData | null>(null);

  const mutate = useCallback(async (variables: TVariables) => {
    try {
      setLoading(true);
      setError(null);
      const result = await mutationFn(variables);
      setData(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An error occurred');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [mutationFn]);

  return { mutate, data, loading, error };
}

// Specific mutation hooks
export function useCreateSref() {
  return useMutation(api.createSref.bind(api));
}

export function useUpdateSref(id: string) {
  return useMutation((data: Parameters<typeof api.updateSref>[1]) => 
    api.updateSref(id, data)
  );
}

export function useDeleteSref(id: string) {
  return useMutation(() => api.deleteSref(id));
}

export function useLikeSref(id: string) {
  return useMutation(() => api.likeSref(id));
}

export function useFavoriteSref(id: string) {
  return useMutation(() => api.favoriteSref(id));
}

export function useUpdateProfile() {
  return useMutation(api.updateUserProfile.bind(api));
}