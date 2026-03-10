'use client';

import { useState, useEffect, useMemo } from 'react';
import Fuse from 'fuse.js';

interface SearchResult {
  id: string;
  type: 'lead' | 'customer' | 'contact' | 'task' | 'document' | 'exportOrder';
  title: string;
  description: string;
  url: string;
  score: number;
  email?: string;
  companyName?: string;
  fullName?: string;
}

export const useGlobalSearch = (data: any[]) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Fuse.js configuration for fuzzy search
  const fuse = useMemo(() => {
    const options = {
      keys: [
        { name: 'title', weight: 0.7 },
        { name: 'description', weight: 0.5 },
        { name: 'fullName', weight: 0.6 },
        { name: 'companyName', weight: 0.6 },
        { name: 'email', weight: 0.4 },
        { name: 'phone', weight: 0.4 }
      ],
      threshold: 0.3,
      includeScore: true,
      minMatchCharLength: 2
    };

    return new Fuse(data, options);
  }, [data]);

  // Search function with debouncing
  const search = useMemo(() => {
    return (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        return;
      }

      setIsSearching(true);
      
      const searchResults = fuse.search(searchQuery).map(result => ({
        id: result.item.id,
        type: result.item.type || 'unknown',
        title: result.item.title || result.item.fullName || result.item.companyName || 'Unknown',
        description: result.item.description || result.item.email || result.item.phone || '',
        url: getResultUrl(result.item),
        score: result.score || 0,
        email: result.item.email,
        companyName: result.item.companyName,
        fullName: result.item.fullName
      }));

      setResults(searchResults.slice(0, 10)); // Limit to 10 results
      setIsSearching(false);
    };
  }, [fuse]);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      search(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, search]);

  // Helper function to determine result URL
  const getResultUrl = (item: any): string => {
    switch (item.type) {
      case 'lead':
        return `/leads/${item.id}`;
      case 'customer':
        return `/companies/${item.id}`;
      case 'contact':
        return `/contacts#${item.id}`;
      case 'task':
        return `/tasks#${item.id}`;
      case 'document':
        return `/documents#${item.id}`;
      case 'exportOrder':
        return `/export-orders/${item.id}`;
      default:
        return '/';
    }
  };

  return {
    query,
    setQuery,
    results,
    isSearching,
    clearSearch: () => {
      setQuery('');
      setResults([]);
    }
  };
};
