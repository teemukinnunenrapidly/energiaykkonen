import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Code, Hash, Type, Calendar, DollarSign, Percent, Edit } from 'lucide-react';
import type { PDFShortcode } from '@/lib/pdf/database-pdf-processor';

interface ShortcodeListProps {
  shortcodes: PDFShortcode[];
  onSelect: (shortcode: PDFShortcode) => void;
  loading?: boolean;
}

export function ShortcodeList({ shortcodes, onSelect, loading }: ShortcodeListProps) {
  const [search, setSearch] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);

  // Get unique categories
  const categories = React.useMemo(() => {
    const cats = new Set(shortcodes.map(sc => sc.category));
    return Array.from(cats).sort();
  }, [shortcodes]);

  // Filter shortcodes
  const filteredShortcodes = React.useMemo(() => {
    return shortcodes.filter(sc => {
      const matchesSearch = !search || 
        sc.code.toLowerCase().includes(search.toLowerCase()) ||
        sc.name.toLowerCase().includes(search.toLowerCase()) ||
        sc.description?.toLowerCase().includes(search.toLowerCase());
      
      const matchesCategory = !selectedCategory || sc.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [shortcodes, search, selectedCategory]);

  // Group by category
  const groupedShortcodes = React.useMemo(() => {
    const groups: Record<string, PDFShortcode[]> = {};
    filteredShortcodes.forEach(sc => {
      if (!groups[sc.category]) {
        groups[sc.category] = [];
      }
      groups[sc.category].push(sc);
    });
    return groups;
  }, [filteredShortcodes]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'field': return <Hash className="w-4 h-4" />;
      case 'formula': return <Code className="w-4 h-4" />;
      case 'static': return <Type className="w-4 h-4" />;
      default: return null;
    }
  };

  const getFormatIcon = (format?: string) => {
    switch (format) {
      case 'currency': return <DollarSign className="w-3 h-3" />;
      case 'percentage': return <Percent className="w-3 h-3" />;
      case 'date': return <Calendar className="w-3 h-3" />;
      default: return null;
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      customer: 'bg-blue-100 text-blue-800',
      property: 'bg-green-100 text-green-800',
      calculation: 'bg-purple-100 text-purple-800',
      heating: 'bg-orange-100 text-orange-800',
      system: 'bg-gray-100 text-gray-800',
      custom: 'bg-pink-100 text-pink-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="grid gap-2">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Hae shortcodea..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={selectedCategory === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            Kaikki
          </Button>
          {categories.map(cat => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {/* Shortcode list grouped by category */}
      {Object.entries(groupedShortcodes).map(([category, items]) => (
        <Card key={category}>
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Badge className={getCategoryColor(category)} variant="secondary">
                {category}
              </Badge>
              <span className="text-muted-foreground">({items.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {items.map(sc => (
                <div
                  key={sc.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors cursor-pointer"
                  onClick={() => onSelect(sc)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(sc.source_type)}
                      {getFormatIcon(sc.format_type)}
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono bg-muted px-2 py-0.5 rounded">
                          {sc.code}
                        </code>
                        <span className="text-sm font-medium">{sc.name}</span>
                        {!sc.is_active && (
                          <Badge variant="outline" className="text-xs">
                            Pois käytöstä
                          </Badge>
                        )}
                      </div>
                      {sc.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {sc.description}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <Button size="sm" variant="ghost">
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {filteredShortcodes.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {search || selectedCategory 
              ? 'Ei hakutuloksia. Kokeile eri hakuehtoja.'
              : 'Ei shortcodeja. Luo uusi shortcode aloittaaksesi.'}
          </CardContent>
        </Card>
      )}
    </div>
  );
}