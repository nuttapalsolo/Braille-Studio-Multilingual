import React from 'react';

interface DotButtonProps {
  dotNumber: number;
  isSelected: boolean;
  onToggle: (dotNumber: number) => void;
  positionLabel: string;
  isFocused?: boolean;
  disabled?: boolean;
}

export const DotButton: React.FC<DotButtonProps> = ({
  dotNumber,
  isSelected,
  onToggle,
  positionLabel,
  disabled = false,
}) => {
  const ariaLabel = `Dot ${dotNumber}, ${positionLabel}, ${isSelected ? 'selected (enabled)' : 'unselected (disabled)'}. Press key ${dotNumber} or space to toggle.`;

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={isSelected}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onToggle(dotNumber)}
      className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-full flex flex-col items-center justify-center transition-all duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 shadow-lg ${
        isSelected
          ? 'bg-gradient-to-tr from-indigo-500 to-purple-600 border-2 border-indigo-300 text-white shadow-indigo-500/40 scale-105 ring-2 ring-indigo-400/50'
          : 'bg-slate-800/90 border-2 border-slate-600 text-slate-400 hover:border-slate-400 hover:text-slate-200 hover:bg-slate-700/80'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span className={`text-xl sm:text-2xl font-black ${isSelected ? 'text-white' : 'text-slate-300'}`}>
        {dotNumber}
      </span>
      <span className="text-[10px] uppercase font-bold tracking-wider opacity-75">
        Key [{dotNumber}]
      </span>

      {/* Visual Dot indicator */}
      <span
        className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 transition-colors ${
          isSelected ? 'bg-emerald-400' : 'bg-slate-600'
        }`}
        aria-hidden="true"
      />
    </button>
  );
};
