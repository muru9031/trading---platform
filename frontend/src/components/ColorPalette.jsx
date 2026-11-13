import React from 'react';
import { Check } from 'lucide-react';

const PREDEFINED_COLORS = [
  '#ef4444', // Red
  '#f97316', // Orange
  '#f59e0b', // Amber
  '#eab308', // Yellow
  '#84cc16', // Lime
  '#22c55e', // Green
  '#10b981', // Emerald
  '#14b8a6', // Teal
  '#06b6d4', // Cyan
  '#0ea5e9', // Sky
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#a855f7', // Purple
  '#d946ef', // Fuchsia
  '#ec4899', // Pink
  '#f43f5e', // Rose
  '#ffffff', // White
  '#94a3b8', // Slate
  '#131722', // Dark background
];

export default function ColorPalette({ selectedColor, onSelect }) {
  return (
    <div className="grid grid-cols-5 gap-1.5 p-1 bg-gray-50 dark:bg-slate-900/50 rounded-lg border border-gray-300 dark:border-slate-700/50">
      {PREDEFINED_COLORS.map((color) => {
        const isSelected = selectedColor?.toLowerCase() === color.toLowerCase() || 
                           (selectedColor?.slice(0, 7).toLowerCase() === color.toLowerCase()); // Handle hex opacity
        return (
          <button
            key={color}
            onClick={() => onSelect(color)}
            className={`w-6 h-6 rounded flex items-center justify-center transition-all ${
              isSelected ? 'ring-2 ring-blue-500 scale-110 shadow-lg z-10' : 'hover:scale-110 hover:shadow border border-gray-300 dark:border-slate-700/50 hover:border-slate-500'
            }`}
            style={{ backgroundColor: color }}
            title={color}
          >
            {isSelected && (
              <Check size={12} className={['#ffffff', '#f0fdf4'].includes(color.toLowerCase()) ? 'text-slate-900' : 'text-white'} />
            )}
          </button>
        );
      })}
    </div>
  );
}

export function ColorPickerDropdown({ color, onChange }) {
  const [open, setOpen] = React.useState(false);
  
  return (
    <div className="relative">
      <button 
        onClick={() => setOpen(!open)}
        className="w-8 h-8 rounded border border-gray-300 dark:border-slate-600 flex items-center justify-center transition-transform hover:scale-105"
        style={{ backgroundColor: color }}
      >
        <Check size={14} className={['#ffffff', '#f0fdf4'].includes(color?.toLowerCase()) ? 'text-slate-900 opacity-100' : 'text-white opacity-0'} />
      </button>
      {open && (
        <div className="absolute top-10 right-0 z-[100]">
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="relative z-50 animate-fade-in shadow-2xl">
            <ColorPalette selectedColor={color} onSelect={(c) => { onChange(c); setOpen(false); }} />
          </div>
        </div>
      )}
    </div>
  )
}
