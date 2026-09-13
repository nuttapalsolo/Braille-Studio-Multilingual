import React from 'react';
import { DotButton } from './DotButton';

interface BrailleCellProps {
  selectedDots: number[];
  onToggleDot: (dotNumber: number) => void;
  mode?: '6-dot' | '8-dot';
  readOnly?: boolean;
}

export const BrailleCell: React.FC<BrailleCellProps> = ({
  selectedDots,
  onToggleDot,
  mode = '6-dot',
  readOnly = false,
}) => {
  const dotPositions: Record<number, string> = {
    1: 'Top Left',
    2: 'Middle Left',
    3: 'Bottom Left',
    4: 'Top Right',
    5: 'Middle Right',
    6: 'Bottom Right',
    7: 'Lower Left (8-dot)',
    8: 'Lower Right (8-dot)',
  };

  const isSelected = (dot: number) => selectedDots.includes(dot);

  return (
    <div
      role="group"
      aria-label={`Interactive Braille Cell Matrix (${mode})`}
      className="bg-slate-900/90 border-2 border-slate-700/80 rounded-2xl p-6 shadow-2xl backdrop-blur-md flex flex-col items-center justify-center max-w-md mx-auto"
    >
      <div className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" aria-hidden="true" />
        {mode} Matrix Standard Grid
      </div>

      {/* Grid Layout: 2 Columns */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-5 my-2">
        {/* Row 1: Dot 1 (Left) & Dot 4 (Right) */}
        <DotButton
          dotNumber={1}
          isSelected={isSelected(1)}
          onToggle={onToggleDot}
          positionLabel={dotPositions[1]}
          disabled={readOnly}
        />
        <DotButton
          dotNumber={4}
          isSelected={isSelected(4)}
          onToggle={onToggleDot}
          positionLabel={dotPositions[4]}
          disabled={readOnly}
        />

        {/* Row 2: Dot 2 (Left) & Dot 5 (Right) */}
        <DotButton
          dotNumber={2}
          isSelected={isSelected(2)}
          onToggle={onToggleDot}
          positionLabel={dotPositions[2]}
          disabled={readOnly}
        />
        <DotButton
          dotNumber={5}
          isSelected={isSelected(5)}
          onToggle={onToggleDot}
          positionLabel={dotPositions[5]}
          disabled={readOnly}
        />

        {/* Row 3: Dot 3 (Left) & Dot 6 (Right) */}
        <DotButton
          dotNumber={3}
          isSelected={isSelected(3)}
          onToggle={onToggleDot}
          positionLabel={dotPositions[3]}
          disabled={readOnly}
        />
        <DotButton
          dotNumber={6}
          isSelected={isSelected(6)}
          onToggle={onToggleDot}
          positionLabel={dotPositions[6]}
          disabled={readOnly}
        />

        {/* Optional Row 4: Dot 7 (Left) & Dot 8 (Right) for 8-dot mode */}
        {mode === '8-dot' && (
          <>
            <DotButton
              dotNumber={7}
              isSelected={isSelected(7)}
              onToggle={onToggleDot}
              positionLabel={dotPositions[7]}
              disabled={readOnly}
            />
            <DotButton
              dotNumber={8}
              isSelected={isSelected(8)}
              onToggle={onToggleDot}
              positionLabel={dotPositions[8]}
              disabled={readOnly}
            />
          </>
        )}
      </div>
    </div>
  );
};
