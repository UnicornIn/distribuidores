import * as React from 'react';
import { DayPicker } from 'react-day-picker';

import { cn } from '../../lib/utils';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, ...props }: CalendarProps) {
  return (
    <DayPicker
      captionLayout="dropdown" // Corregido
      className={cn('p-3', className)}
      {...props}
    />
  );
}

Calendar.displayName = 'Calendar';

export { Calendar };
