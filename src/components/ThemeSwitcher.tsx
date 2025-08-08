'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { SunIcon, MoonIcon } from '@heroicons/react/24/solid';

export function ThemeSwitcher() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Render a placeholder or null on the server to avoid hydration mismatch
    return null;
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
      aria-label="Toggle Dark Mode"
    >
      {theme === 'dark' ? (
        <SunIcon className="w-6 h-6 text-yellow-500" />
      ) : (
        <MoonIcon className="w-6 h-6 text-gray-800" />
      )}
    </button>
  );
}
