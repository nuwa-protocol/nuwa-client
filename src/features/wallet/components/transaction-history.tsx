import {
  CalendarArrowDown,
  CalendarArrowUp,
  CalendarIcon,
  ListFilter,
  SortAsc,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Calendar } from '@/shared/components/ui/calendar';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/components/ui/popover';
import { useChatTransactionInfo } from '../hooks/use-chat-transaction-info';
import type { PaymentTransaction } from '../types';
import { ChatItem } from './chat-item';
import { TransactionDetailsModal } from './transaction-details-modal';

type SortOption = 'time-desc' | 'time-asc' | 'amount-desc' | 'amount-asc';

export function TransactionHistory() {
  const { chatRecords, error } = useChatTransactionInfo();
  const [selectedTransaction, setSelectedTransaction] =
    useState<PaymentTransaction | null>(null);
  const [openChats, setOpenChats] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<SortOption>('time-desc');
  const [filterDate, setFilterDate] = useState<Date | undefined>(undefined);

  const toggleChat = (chatId: string) => {
    const newOpenChats = new Set<string>();
    if (!openChats.has(chatId)) {
      newOpenChats.add(chatId);
    }
    setOpenChats(newOpenChats);
  };

  const filteredAndSortedChatRecords = useMemo(() => {
    // Always sort transactions within each chat by time (earliest first)
    const chatsWithSortedTransactions = chatRecords.map((chatRecord) => ({
      ...chatRecord,
      transactions: [...chatRecord.transactions].sort(
        (a, b) => a.info.timestamp - b.info.timestamp,
      ),
    }));

    let filtered = chatsWithSortedTransactions;

    // Filter by date if a date is selected - filter entire chats
    if (filterDate) {
      const filterDateStart = new Date(filterDate);
      filterDateStart.setHours(0, 0, 0, 0);
      const filterDateEnd = new Date(filterDate);
      filterDateEnd.setHours(23, 59, 59, 999);

      filtered = chatsWithSortedTransactions.filter((chatRecord) => {
        // Check if any transaction in the chat falls within the selected date
        return chatRecord.transactions.some((transaction) => {
          const transactionDate = new Date(transaction.info.timestamp);
          return (
            transactionDate >= filterDateStart &&
            transactionDate <= filterDateEnd
          );
        });
      });
    }

    // Sort chats based on selected criteria
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'time-asc': {
          const oldestA = a.transactions[0]?.info.timestamp || 0;
          const oldestB = b.transactions[0]?.info.timestamp || 0;
          return oldestA - oldestB;
        }
        case 'time-desc': {
          const mostRecentA =
            a.transactions[a.transactions.length - 1]?.info.timestamp || 0;
          const mostRecentB =
            b.transactions[b.transactions.length - 1]?.info.timestamp || 0;
          return mostRecentB - mostRecentA;
        }
        case 'amount-asc': {
          const totalA = a.transactions.reduce(
            (sum, t) => sum + Number(t.details?.payment?.costUsd || 0),
            0,
          );
          const totalB = b.transactions.reduce(
            (sum, t) => sum + Number(t.details?.payment?.costUsd || 0),
            0,
          );
          return totalA - totalB;
        }
        case 'amount-desc': {
          const totalA = a.transactions.reduce(
            (sum, t) => sum + Number(t.details?.payment?.costUsd || 0),
            0,
          );
          const totalB = b.transactions.reduce(
            (sum, t) => sum + Number(t.details?.payment?.costUsd || 0),
            0,
          );
          return totalB - totalA;
        }
        default: {
          const mostRecentA =
            a.transactions[a.transactions.length - 1]?.info.timestamp || 0;
          const mostRecentB =
            b.transactions[b.transactions.length - 1]?.info.timestamp || 0;
          return mostRecentB - mostRecentA;
        }
      }
    });
  }, [chatRecords, sortBy, filterDate]);

  const clearDateFilter = () => {
    setFilterDate(undefined);
  };

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">Error loading transactions: {error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Payment Transactions</CardTitle>
          <div className="flex items-center gap-2">
            {/* Combined filter and sort dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-10">
                  <ListFilter className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setSortBy('time-desc')}>
                  <CalendarArrowDown className="h-4 w-4 mr-2" />
                  Latest
                  {sortBy === 'time-desc' && <span className="ml-auto">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('time-asc')}>
                  <CalendarArrowUp className="h-4 w-4 mr-2" />
                  Earliest
                  {sortBy === 'time-asc' && <span className="ml-auto">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('amount-desc')}>
                  <SortAsc className="h-4 w-4 mr-2" />
                  Most Cost
                  {sortBy === 'amount-desc' && (
                    <span className="ml-auto">✓</span>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('amount-asc')}>
                  <SortAsc className="h-4 w-4 rotate-180 mr-2" />
                  Least Cost
                  {sortBy === 'amount-asc' && (
                    <span className="ml-auto">✓</span>
                  )}
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuLabel>Filter by date</DropdownMenuLabel>
                <div className="px-2 py-1">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filterDate
                          ? filterDate.toLocaleDateString()
                          : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto p-0"
                      align="end"
                      side="right"
                    >
                      <Calendar
                        mode="single"
                        selected={filterDate}
                        onSelect={setFilterDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {filterDate && (
                  <DropdownMenuItem onClick={clearDateFilter}>
                    <X className="h-4 w-4 mr-2" />
                    Clear date filter
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredAndSortedChatRecords.length === 0 ? (
              <p className="text-muted-foreground">
                {filterDate
                  ? 'No transactions found for selected date'
                  : 'No transactions found'}
              </p>
            ) : (
              filteredAndSortedChatRecords.map((chatRecord) => (
                <ChatItem
                  key={chatRecord.chatId}
                  chatRecord={chatRecord}
                  isOpen={openChats.has(chatRecord.chatId)}
                  onToggle={toggleChat}
                  onSelectTransaction={setSelectedTransaction}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <TransactionDetailsModal
        transaction={selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
      />
    </>
  );
}
