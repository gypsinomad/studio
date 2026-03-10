'use client';

import * as React from 'react';
import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useGlobalSearch } from '@/hooks/use-global-search';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const router = useRouter();
  const [searchData, setSearchData] = React.useState<any[]>([]);
  const { query, setQuery, results, isSearching, clearSearch } = useGlobalSearch(searchData);

  // Load search data when component mounts
  React.useEffect(() => {
    if (open) {
      // This would fetch data from API or use cached data
      // For now, using mock data
      const mockData = [
        { id: '1', type: 'lead', fullName: 'John Doe', email: 'john@example.com', companyName: 'ABC Corp' },
        { id: '2', type: 'customer', name: 'XYZ Company', email: 'info@xyz.com', website: 'xyz.com' },
        { id: '3', type: 'task', title: 'Follow up with client', description: 'Call about new order' },
        { id: '4', type: 'document', title: 'Contract Agreement', description: 'Q1 2024 contract' },
        { id: '5', type: 'exportOrder', title: 'Export Order #123', totalValue: 50000 }
      ];
      setSearchData(mockData);
    }
  }, [open]);

  const handleResultClick = (result: any) => {
    router.push(result.url);
    onOpenChange(false);
    clearSearch();
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      lead: 'bg-blue-100 text-blue-800',
      customer: 'bg-green-100 text-green-800',
      task: 'bg-purple-100 text-purple-800',
      document: 'bg-orange-100 text-orange-800',
      exportOrder: 'bg-red-100 text-red-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      lead: '👤',
      customer: '🏢',
      task: '📋',
      document: '📄',
      exportOrder: '🚢'
    };
    return icons[type] || '📌';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Global Search</DialogTitle>
        </DialogHeader>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search leads, customers, tasks, documents..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
            autoFocus
          />
        </div>

        <ScrollArea className="max-h-[400px]">
          {isSearching ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : query && results.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No results found for "{query}"
            </div>
          ) : !query ? (
            <div className="text-center py-8 text-muted-foreground">
              Start typing to search...
            </div>
          ) : (
            <div className="space-y-2">
              {results.map((result) => (
                <Button
                  key={result.id}
                  variant="ghost"
                  className="w-full justify-start h-auto p-3"
                  onClick={() => handleResultClick(result)}
                >
                  <div className="flex items-start gap-3 w-full">
                    <div className="text-2xl">{getTypeIcon(result.type)}</div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{result.title}</span>
                        <Badge variant="secondary" className={cn("text-xs", getTypeColor(result.type))}>
                          {result.type}
                        </Badge>
                      </div>
                      {result.description && (
                        <p className="text-sm text-muted-foreground">{result.description}</p>
                      )}
                      {(result.email || result.companyName) && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {result.email && `${result.email}`}
                          {result.email && result.companyName && ' • '}
                          {result.companyName && result.companyName}
                        </p>
                      )}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="flex justify-between items-center pt-2 border-t">
          <div className="text-xs text-muted-foreground">
            Press <kbd className="px-1 py-0.5 bg-muted rounded">Esc</kbd> to close
          </div>
          <Button variant="outline" size="sm" onClick={clearSearch}>
            Clear
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Keyboard shortcut hook
export function useGlobalSearchShortcut() {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  return { open, setOpen };
}
