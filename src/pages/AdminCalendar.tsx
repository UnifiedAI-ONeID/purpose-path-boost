import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import AdminShell from '@/components/admin/AdminShell';
import { supabase } from '@/db';
import { invokeApi } from '@/lib/api-client';

type ItemType = 'event' | 'post' | 'social';

interface CalendarItem {
  type: ItemType;
  id: string;
  title: string;
  start: string;
  end: string;
  url: string;
  status?: string;
}

type ViewMode = 'week' | 'month';
type Timezone = 'America/Vancouver' | 'Asia/Shanghai';

export default function AdminCalendar() {
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [view, setView] = useState<ViewMode>('week');
  const [tz, setTz] = useState<Timezone>('America/Vancouver');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCalendar();
  }, []);

  async function loadCalendar() {
    try {
      const { data, error } = await supabase.functions.invoke('api-admin-calendar-feed');
      
      if (error) throw error;
      setItems(data?.bookings || []);
    } catch (e) {
      toast.error('Failed to load calendar');
    } finally {
      setLoading(false);
    }
  }

  // Group items by date
  const itemsByDate = useMemo(() => {
    const map: Record<string, CalendarItem[]> = {};
    
    items.forEach(item => {
      const dateStr = new Date(item.start)
        .toLocaleDateString('en-CA', { timeZone: tz });
      
      if (!map[dateStr]) map[dateStr] = [];
      map[dateStr].push(item);
    });
    
    return map;
  }, [items, tz]);

  // Build calendar grid
  const grid = useMemo(() => {
    return buildCalendarGrid(currentDate, view, tz);
  }, [currentDate, view, tz]);

  async function handleDrop(itemId: string, itemType: ItemType, fromDate: string, toDate: string) {
    if (fromDate === toDate) return;

    try {
      const item = items.find(i => i.id === itemId && i.type === itemType);
      if (!item) return;

      // Create new date at 9:00 AM in target timezone
      const [year, month, day] = toDate.split('-').map(Number);
      const date = new Date(year, month - 1, day, 9, 0, 0);
      
      const newStart = date.toISOString();
      const newEnd = item.type === 'event' 
        ? new Date(date.getTime() + (new Date(item.end).getTime() - new Date(item.start).getTime())).toISOString()
        : newStart;

      const result = await invokeApi('/api/calendar/update', {
        method: 'POST',
        body: {
          type: itemType,
          id: itemId,
          start: newStart,
          end: newEnd
        }
      });

      if (!result.ok) throw new Error('Update failed');

      toast.success('Date updated successfully');
      await loadCalendar();
    } catch (e) {
      toast.error('Failed to update date');
    }
  }

  function navigateWeek(direction: 'prev' | 'next') {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentDate(newDate);
  }

  function navigateMonth(direction: 'prev' | 'next') {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  }

  if (loading) {
    return (
      <AdminShell>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent"></div>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div>
      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <CalendarIcon className="h-6 w-6" />
          <h1 className="text-3xl font-serif font-bold">Content Calendar</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <select
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={tz}
            onChange={(e) => setTz(e.target.value as Timezone)}
          >
            <option value="America/Vancouver">🇨🇦 Vancouver</option>
            <option value="Asia/Shanghai">🇨🇳 Shanghai</option>
          </select>
          
          <select
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={view}
            onChange={(e) => setView(e.target.value as ViewMode)}
          >
            <option value="week">Week</option>
            <option value="month">Month</option>
          </select>
        </div>
      </header>

      {/* Navigation */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => view === 'week' ? navigateWeek('prev') : navigateMonth('prev')}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <div className="text-lg font-medium">
          {currentDate.toLocaleDateString('en-US', { 
            month: 'long', 
            year: 'numeric',
            timeZone: tz
          })}
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => view === 'week' ? navigateWeek('next') : navigateMonth('next')}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Calendar Grid */}
      <Card className="p-4">
        <div 
          className="grid gap-2"
          style={{ gridTemplateColumns: `repeat(${grid.cols}, 1fr)` }}
        >
          {grid.cells.map(cell => (
            <div
              key={cell.key}
              className="border border-border rounded-lg p-3 min-h-[120px] bg-card"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                const data = e.dataTransfer.getData('text/plain');
                if (!data) return;
                
                const [type, id, fromDate] = data.split('|');
                handleDrop(id, type as ItemType, fromDate, cell.dateStr);
              }}
            >
              <div className="text-xs font-medium text-muted-foreground mb-2">
                {cell.label}
              </div>
              
              <div className="space-y-1">
                {(itemsByDate[cell.dateStr] || []).map(item => (
                  <a
                    key={`${item.type}-${item.id}`}
                    href={item.url}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', `${item.type}|${item.id}|${cell.dateStr}`);
                    }}
                    className={`block text-xs rounded-md px-2 py-1 border cursor-move hover:opacity-80 transition ${getTypeColor(item.type)}`}
                  >
                    {item.title}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <div className={`w-4 h-4 rounded border ${getTypeColor('event')}`} />
          <span>Events</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-4 h-4 rounded border ${getTypeColor('post')}`} />
          <span>Blog Posts</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-4 h-4 rounded border ${getTypeColor('social')}`} />
          <span>Social Posts</span>
        </div>
      </div>
      </div>
    </AdminShell>
  );
}


function getTypeColor(type: ItemType): string {
  switch (type) {
    case 'event':
      return 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300';
    case 'post':
      return 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300';
    case 'social':
      return 'border-amber-500 bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300';
    default:
      return 'border-border bg-muted';
  }
}

function buildCalendarGrid(
  baseDate: Date,
  view: ViewMode,
  tz: Timezone
): { cols: number; cells: Array<{ key: string; dateStr: string; label: string }> } {
  const cells: Array<{ key: string; dateStr: string; label: string }> = [];
  
  // Get start of week/month in target timezone
  const start = new Date(baseDate);
  
  if (view === 'week') {
    // Start from Sunday of current week
    start.setDate(start.getDate() - start.getDay());
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      
      const dateStr = date.toLocaleDateString('en-CA', { timeZone: tz });
      const label = date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric',
        timeZone: tz
      });
      
      cells.push({ key: dateStr, dateStr, label });
    }
    
    return { cols: 7, cells };
  } else {
    // Month view - 5 weeks (35 days)
    start.setDate(1);
    start.setDate(start.getDate() - start.getDay());
    
    for (let i = 0; i < 35; i++) {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      
      const dateStr = date.toLocaleDateString('en-CA', { timeZone: tz });
      const label = date.toLocaleDateString('en-US', { 
        day: 'numeric',
        timeZone: tz
      });
      
      cells.push({ key: dateStr, dateStr, label });
    }
    
    return { cols: 7, cells };
  }
}
