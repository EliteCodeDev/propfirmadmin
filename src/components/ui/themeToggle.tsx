"use client";
import { SunIcon, MoonIcon } from "@heroicons/react/24/outline";
import { useTheme } from "../../hooks/useTheme";

interface ThemeToggleProps {
  variant?: 'default' | 'minimal' | 'button';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ 
  variant = 'default', 
  size = 'md', 
  className = '',
  showLabel = false 
}: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  const sizeClasses = {
    sm: 'p-1.5 h-8 w-8',
    md: 'p-2 h-10 w-10',
    lg: 'p-3 h-12 w-12'
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  const variants = {
    default: `rounded-full bg-white dark:bg-slate-800 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200 dark:border-slate-700`,
    minimal: `rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200`,
    button: `rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200`
  };

  const buttonClasses = `${variants[variant]} ${sizeClasses[size]} ${className} flex items-center justify-center group`;

  return (
    <button
      onClick={toggleTheme}
      className={buttonClasses}
      aria-label={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
      title={theme === 'light' ? 'Modo oscuro' : 'Modo claro'}
      type="button"
    >
      <div className="relative flex items-center">
        {theme === 'light' ? (
          <MoonIcon className={`${iconSizes[size]} text-slate-600 group-hover:text-slate-800 transition-colors`} />
        ) : (
          <SunIcon className={`${iconSizes[size]} text-yellow-500 group-hover:text-yellow-400 transition-colors`} />
        )}
      </div>
      
      {showLabel && (
        <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          {theme === 'light' ? 'Oscuro' : 'Claro'}
        </span>
      )}
    </button>
  );
}