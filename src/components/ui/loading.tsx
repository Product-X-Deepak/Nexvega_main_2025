
import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
  fullHeight?: boolean;
  className?: string;
}

export function Loading({
  size = 'medium',
  message = 'Loading...',
  fullHeight = false,
  className,
}: LoadingProps) {
  const sizeMap = {
    small: 'h-4 w-4',
    medium: 'h-8 w-8',
    large: 'h-12 w-12',
  };

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center',
        fullHeight && 'h-[calc(100vh-4rem)]',
        className
      )}
    >
      <Loader2 className={cn('text-primary animate-spin', sizeMap[size])} />
      {message && <p className="text-muted-foreground mt-2">{message}</p>}
    </div>
  );
}
