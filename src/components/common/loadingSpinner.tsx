import React, { useState, useEffect } from 'react';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    text?: string;
    subtitle?: string;
    className?: string;
    showProgress?: boolean;
    steps?: string[];
}

export default function LoadingSpinner({
    size = 'md',
    text = 'Cargando Dashboard',
    subtitle = 'Obteniendo información de la cuenta...',
    className = '',
    showProgress = true,
    steps = [
        'Verificando credenciales...',
        'Cargando información de la cuenta...',
        'Procesando balances...',
        'Finalizando carga...'
    ]
}: LoadingSpinnerProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const stepInterval = setInterval(() => {
            setCurrentStep(prev => (prev + 1) % steps.length);
        }, 1500);

        const progressInterval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 95) return 95;
                return prev + Math.random() * 15;
            });
        }, 300);

        return () => {
            clearInterval(stepInterval);
            clearInterval(progressInterval);
        };
    }, [steps.length]);

    const sizeClasses = {
        sm: 'h-8 w-8',
        md: 'h-12 w-12',
        lg: 'h-16 w-16'
    };

    const textSizeClasses = {
        sm: 'text-lg',
        md: 'text-xl',
        lg: 'text-2xl'
    };

    const subtitleSizeClasses = {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg'
    };

    return (
        <div className={`fixed inset-0 bg-white dark:bg-gray-900 flex items-center justify-center z-50 ${className}`}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 border border-gray-100 dark:border-gray-700">
                {/* Spinner */}
                <div className="flex justify-center mb-6">
                    <div className="relative">
                        <div className={`${sizeClasses[size]} rounded-full border-4 border-gray-200 dark:border-gray-700`}></div>
                        <div className={`${sizeClasses[size]} rounded-full border-4 border-transparent border-t-blue-500 border-r-blue-500 animate-spin absolute top-0 left-0`}></div>
                        <div className={`${sizeClasses[size]} rounded-full border-4 border-transparent border-b-blue-300 border-l-blue-300 animate-spin absolute top-0 left-0`} style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                    </div>
                </div>

                {/* Title */}
                <h2 className={`text-center font-semibold text-gray-900 dark:text-white mb-2 ${textSizeClasses[size]}`}>
                    {text}
                </h2>

                {/* Subtitle */}
                <p className={`text-center text-gray-600 dark:text-gray-400 mb-6 ${subtitleSizeClasses[size]}`}>
                    {subtitle}
                </p>

                {/* Progress Bar */}
                {showProgress && (
                    <div className="mb-6">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500 ease-out relative overflow-hidden"
                                style={{ width: `${progress}%` }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Current Step */}
                <div className="text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">
                        {steps[currentStep]}
                    </p>
                </div>

                {/* Decorative dots */}
                <div className="flex justify-center space-x-1 mt-4">
                    {[0, 1, 2].map((i) => (
                        <div
                            key={i}
                            className={`h-2 w-2 rounded-full transition-all duration-300 ${i === currentStep % 3
                                    ? 'bg-blue-500 scale-125'
                                    : 'bg-gray-300 dark:bg-gray-600'
                                }`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}