import React, { useState, useEffect, useRef } from 'react';

export default function AssetSearchSelect({ value, onChange, disabled }) {
  const [query, setQuery] = useState(value || '');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Sync query if parent changes value (e.g., initial load or clear)
  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  // Debounced Search
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      // Only search if they are typing something different from the securely selected value
      if (query.length > 1 && query !== value && isOpen) {
        try {
          const res = await fetch(`http://localhost:8000/api/search?q=${query}`);
          if (res.ok) {
            const data = await res.json();
            setResults(data.slice(0, 5));
          } else {
            setResults([]);
          }
        } catch (e) {
          console.error("Search failed", e);
          setResults([]);
        }
      } else {
        setResults([]);
      }
    }, 250);

    return () => clearTimeout(delayDebounceFn);
  }, [query, isOpen, value]);

  const handleSelect = (symbol) => {
    setQuery(symbol);
    setIsOpen(false);
    onChange(symbol);
  };

  const handleBlur = () => {
    // Small delay to allow onMouseDown on the dropdown to fire first
    setTimeout(() => {
      setIsOpen(false);
      if (query !== value) {
        // If they typed but didn't select, revert to the last securely selected value
        setQuery(value || '');
        onChange(value || ''); // Ensure parent knows we reverted
      }
    }, 150);
  };

  // Determine border color: Red if query exists but no valid backend value is selected
  const hasError = query && query.length > 0 && query !== value;

  return (
    <div className="relative w-full" ref={containerRef}>
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
          onChange(''); // Immediately invalidate parent value until a strict selection is made
        }}
        onFocus={() => {
          if (!disabled) setIsOpen(true);
        }}
        onBlur={handleBlur}
        disabled={disabled}
        placeholder="e.g. HDFCBANK.NS"
        className={`w-full bg-[#0f172a] border rounded-lg p-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 ${
          hasError ? 'border-red-500 focus:border-red-500' : 'border-slate-700 focus:border-blue-500'
        }`}
      />
      
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-[#1e293b] border border-slate-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
          {results.map((t) => (
            <div
              key={t.symbol}
              className="p-2 text-sm text-slate-300 hover:bg-blue-600 hover:text-white cursor-pointer"
              onMouseDown={(e) => {
                e.preventDefault(); // crucial to prevent the input from losing focus immediately
                handleSelect(t.symbol);
              }}
            >
              {t.symbol} - {t.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
