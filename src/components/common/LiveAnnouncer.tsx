import React from 'react';

interface LiveAnnouncerProps {
  message: string;
  politeness?: 'polite' | 'assertive';
}

export const LiveAnnouncer: React.FC<LiveAnnouncerProps> = ({
  message,
  politeness = 'polite',
}) => {
  return (
    <div
      aria-live={politeness}
      aria-atomic="true"
      tabIndex={-1}
      className="sr-only"
      id="a11y-live-announcer"
    >
      {message}
    </div>
  );
};
