import { formatAmount } from '@nuwa-ai/payment-kit';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@/shared/components/ui/table';
import type { PaymentTransaction } from '../types';

const formatCost = (cost: bigint | undefined) => {
  if (!cost) return null;
  if (typeof cost === 'bigint') return `$${formatAmount(cost, 12)}`;
  if (cost !== undefined && cost !== null) {
    return `$${formatAmount(BigInt(String(cost)), 12)}`;
  }
  return null;
};

const formatDate = (timestamp: number) => {
  if (!timestamp) return 'undefined';
  const localString = new Date(timestamp).toLocaleString();
  return `${timestamp} (${localString})`;
};

const formatDuration = (durationMs: number | undefined) => {
  if (!durationMs) return null;
  if (durationMs < 1000) return `${durationMs}ms`;
  return `${(durationMs / 1000).toFixed(2)}s`;
};

interface CopyableCellProps {
  value: string | number | boolean | null;
  isNested?: boolean;
}

function CopyableCell({ value, isNested = false }: CopyableCellProps) {
  const [copied, setCopied] = useState(false);

  const displayValue = value === null ? 'null' : String(value);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(displayValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <TableCell
      className={`cursor-pointer hover:bg-muted/50 transition-colors font-mono text-xs break-all ${value === null ? 'text-muted-foreground italic' : ''
        } ${isNested ? 'pl-8' : ''}`}
      onClick={handleCopy}
      title="Click to copy"
    >
      {copied ? <span className="text-green-600">Copied!</span> : displayValue}
    </TableCell>
  );
}

interface TableRowItemProps {
  label: string;
  value: string | number | boolean | null;
  isNested?: boolean;
}

function TableRowItem({ label, value, isNested = false }: TableRowItemProps) {
  return (
    <TableRow>
      <TableCell className={`font-medium text-sm ${isNested ? 'pl-8' : ''}`}>
        {label}
      </TableCell>
      <CopyableCell value={value} isNested={isNested} />
    </TableRow>
  );
}

interface TransactionDetailsModalProps {
  transaction: PaymentTransaction | null;
  onClose: () => void;
}

export function TransactionDetailsModal({
  transaction,
  onClose,
}: TransactionDetailsModalProps) {
  if (!transaction) return null;

  const details = transaction.details;
  const payment = details?.payment;

  return (
    <Dialog open={!!transaction} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Transaction Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Table>
            <TableBody>
              {/* Basic Information */}
              <TableRow className="bg-muted/30">
                <TableCell colSpan={2} className="font-semibold text-sm">
                  Basic Information
                </TableCell>
              </TableRow>
              <TableRowItem
                label="Context ID"
                value={transaction.info.ctxId}
                isNested
              />
              <TableRowItem
                label="Payment Type"
                value={transaction.info.type}
                isNested
              />
              <TableRowItem
                label="Chat Timestamp"
                value={formatDate(transaction.info.timestamp)}
                isNested
              />
              <TableRowItem
                label="Message"
                value={transaction.info.message || null}
                isNested
              />

              {/* Transaction Details */}
              <TableRow className="bg-muted/30">
                <TableCell colSpan={2} className="font-semibold text-sm">
                  Transaction Details
                </TableCell>
              </TableRow>
              <TableRowItem
                label="Client Transaction Reference"
                value={details?.clientTxRef || null}
                isNested
              />
              <TableRowItem
                label="Transaction Timestamp"
                value={details ? formatDate(details.timestamp) : null}
                isNested
              />
              <TableRowItem
                label="Protocol"
                value={details?.protocol || null}
                isNested
              />
              <TableRowItem
                label="Method"
                value={details?.method || null}
                isNested
              />
              <TableRowItem
                label="URL or Target"
                value={details?.urlOrTarget || null}
                isNested
              />
              <TableRowItem
                label="Operation"
                value={details?.operation || null}
                isNested
              />
              <TableRowItem
                label="Request Body Hash"
                value={details?.requestBodyHash || null}
                isNested
              />
              <TableRowItem
                label="Stream"
                value={details?.stream || null}
                isNested
              />
              <TableRowItem
                label="Channel ID"
                value={details?.channelId || null}
                isNested
              />
              <TableRowItem
                label="VM ID Fragment"
                value={details?.vmIdFragment || null}
                isNested
              />
              <TableRowItem
                label="Asset ID"
                value={details?.assetId || null}
                isNested
              />
              <TableRowItem
                label="Status Code"
                value={details?.statusCode || null}
                isNested
              />
              <TableRowItem
                label="Duration (ms)"
                value={formatDuration(details?.durationMs)}
                isNested
              />
              <TableRowItem
                label="Status"
                value={details?.status || null}
                isNested
              />
              <TableRowItem
                label="Error Code"
                value={details?.errorCode || null}
                isNested
              />
              <TableRowItem
                label="Error Message"
                value={details?.errorMessage || null}
                isNested
              />

              {/* Payment Information */}
              <TableRow className="bg-muted/30">
                <TableCell colSpan={2} className="font-semibold text-sm">
                  Payment Information
                </TableCell>
              </TableRow>
              <TableRowItem
                label="Cost (Native Units)"
                value={payment?.cost?.toString() || null}
                isNested
              />
              <TableRowItem
                label="Cost (USD)"
                value={formatCost(payment?.costUsd)}
                isNested
              />
              <TableRowItem
                label="Nonce"
                value={payment?.nonce?.toString() || null}
                isNested
              />
              <TableRowItem
                label="Service Transaction Reference"
                value={payment?.serviceTxRef || null}
                isNested
              />

              {/* Headers Summary */}
              {details?.headersSummary && (
                <>
                  <TableRow className="bg-muted/30">
                    <TableCell colSpan={2} className="font-semibold text-sm">
                      Headers Summary
                    </TableCell>
                  </TableRow>
                  {Object.entries(details.headersSummary).map(
                    ([key, value]) => (
                      <TableRowItem
                        key={key}
                        label={key}
                        value={value}
                        isNested
                      />
                    ),
                  )}
                </>
              )}

              {/* Metadata */}
              {details?.meta && (
                <>
                  <TableRow className="bg-muted/30">
                    <TableCell colSpan={2} className="font-semibold text-sm">
                      Metadata
                    </TableCell>
                  </TableRow>
                  {Object.entries(details.meta).map(([key, value]) => (
                    <TableRowItem
                      key={key}
                      label={key}
                      value={
                        typeof value === 'object'
                          ? JSON.stringify(value, null, 2)
                          : String(value)
                      }
                      isNested
                    />
                  ))}
                </>
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
