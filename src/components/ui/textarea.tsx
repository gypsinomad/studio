import * as React from 'react';

import {cn} from '@/lib/utils';

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<'textarea'>>(
  ({className, ...props}, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-lg border border-stone-300 bg-white px-4 py-3 text-base ring-offset-background placeholder:text-stone-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-spice-500 focus-visible:border-transparent transition-all md:text-sm',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export {Textarea};
