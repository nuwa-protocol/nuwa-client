import { formatDistanceToNow, isSameDay, startOfDay } from 'date-fns';
import { MessageSquare, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Dialog from '@/shared/components/ui';
import { Button, Input } from '@/shared/components/ui';
import {
  MiniCalendar,
  MiniCalendarDay,
  MiniCalendarDays,
  MiniCalendarNavigation,
} from '@/shared/components/ui/shadcn-io/mini-calendar';
import { useLanguage } from '@/shared/hooks/use-language';
import { useSearch } from '../hooks/use-search';

export function SearchModal({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { sessionList, setQuery, query } = useSearch();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const filtered = useMemo(() => {
    let results = sessionList;

    // Filter by search query
    if (query.trim()) {
      results = results.filter((s) =>
        s.title.toLowerCase().includes(query.toLowerCase()),
      );
    }

    // Filter by selected date
    if (selectedDate) {
      results = results.filter((s) =>
        isSameDay(new Date(s.updatedAt), selectedDate),
      );
    }

    return results;
  }, [query, sessionList, selectedDate]);

  // Update calendar selection when scrolling through results
  useEffect(() => {
    if (!query.trim() && filtered.length > 0 && !selectedDate) {
      const latestDate = new Date(filtered[0].updatedAt);
      setSelectedDate(startOfDay(latestDate));
    }
  }, [filtered, query, selectedDate]);

  return (
    <Dialog.Dialog>
      <Dialog.DialogTrigger asChild>{children}</Dialog.DialogTrigger>
      <Dialog.DialogContent
        className="flex flex-col border bg-background p-6 shadow-lg sm:rounded-lg overflow-hidden"
        style={{
          width: '60vw',
          maxWidth: 500,
          height: '80vh',
          maxHeight: 700,
        }}
        aria-describedby={undefined}
      >
        <Dialog.DialogTitle className="sr-only">
          {t('search.searchHistory')}
        </Dialog.DialogTitle>
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Input
              autoFocus
              placeholder={t('search.searchPlaceholder')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-none border-0 border-b focus-visible:ring-0 focus-visible:border-primary pr-8"
            />
            {query && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-0 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                onClick={() => setQuery('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <MiniCalendar
            value={selectedDate}
            onValueChange={setSelectedDate}
            className="justify-center"
            days={7}
          >
            <MiniCalendarNavigation direction="prev" />
            <MiniCalendarDays>
              {(date) => (
                <MiniCalendarDay key={date.toISOString()} date={date} />
              )}
            </MiniCalendarDays>
            <MiniCalendarNavigation direction="next" />
          </MiniCalendar>
        </div>
        <div className="overflow-y-auto divide-y hide-scrollbar flex-1">
          {filtered.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              {t('search.noChatsHistory')}
            </div>
          ) : (
            filtered.map((session) => (
              <Dialog.DialogClose asChild key={session.id}>
                <button
                  type="button"
                  className="w-full px-1 py-3 hover:bg-muted rounded flex items-center justify-between border-none"
                  onClick={() => {
                    navigate(`/chat?cid=${session.id}`);
                  }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <MessageSquare
                      size={20}
                      className="text-muted-foreground shrink-0"
                    />
                    <span className="text-sm font-medium truncate">
                      {session.title}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0 ml-2">
                    {formatDistanceToNow(new Date(session.updatedAt), {
                      addSuffix: true,
                    })}
                  </span>
                </button>
              </Dialog.DialogClose>
            ))
          )}
        </div>
      </Dialog.DialogContent>
    </Dialog.Dialog>
  );
}
