import { useEffect, useRef, useState } from 'react';
import { cn } from '@/shared/utils';

type TitleProps = {
  title: string;
  onCommit: (next: string) => void;
  className?: string;
};

export function Title({
  title,
  onCommit,
  className,
}: TitleProps) {
  const [localTitle, setLocalTitle] = useState<string>(title);
  useEffect(() => {
    // Keep local title in sync when external title changes
    setLocalTitle(title);
  }, [title]);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [snapshot, setSnapshot] = useState<string>(title);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      const el = inputRef.current;
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    }
  }, [isEditing]);

  const handleBlur = () => {
    const next = (localTitle || '').trim();
    setLocalTitle(next);
    setIsEditing(false);
    if (next !== snapshot) onCommit?.(next);
  };



  return (
    <div>
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={localTitle}
          onChange={(e) => setLocalTitle(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.currentTarget.blur();
            } else if (e.key === 'Escape') {
              setLocalTitle(snapshot);
              setIsEditing(false);
            }
          }}
          title="Enter to save · Esc to cancel"
          className="h-8 rounded-md border border-border bg-background px-2 text-center text-sm font-medium text-foreground/90 shadow-sm outline-none transition-colors duration-150 md:text-base focus-visible:ring-primary focus-visible:border-primary"
          aria-label="Edit title"
        />
      ) : (
        <button
          type="button"
          className={cn("w-full truncate text-center text-sm px-2 py-1 rounded-lg font-medium text-foreground/90 hover:bg-accent md:text-base", className)}
          onClick={() => {
            setSnapshot(localTitle);
            setIsEditing(true);
          }}
          title="Click to edit title"
          aria-label="Title. Click to edit."
        >
          {localTitle}
        </button>)}
    </div>
  );
}

