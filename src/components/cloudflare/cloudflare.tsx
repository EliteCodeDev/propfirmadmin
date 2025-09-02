"use client"

import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { SITE_KEY_CLOUDFLARE } from '@/config';

// Interface para las funciones que expondremos via ref
export interface RecaptchaRef {
    reset: () => void;
    getResponse: () => string | null;
    isLoaded: () => boolean;
}

interface RecaptchaProps {
    onVerify: (token: string) => void;
}

const Recaptcha = forwardRef<RecaptchaRef, RecaptchaProps>(({ onVerify }, ref) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [widgetId, setWidgetId] = useState<string | null>(null);

    // Exponemos las funciones via ref
    useImperativeHandle(ref, () => ({
        reset: () => {
            if ((window as any).turnstile && widgetId) {
                (window as any).turnstile.reset(widgetId);
            }
        },
        getResponse: () => {
            if ((window as any).turnstile && widgetId) {
                return (window as any).turnstile.getResponse(widgetId);
            }
            return null;
        },
        isLoaded: () => isLoaded
    }), [widgetId, isLoaded]);

    useEffect(() => {
        if (isLoaded) return;

        const loadTurnstile = () => {
            if ((window as any).turnstile) {
                try {
                    const container = document.getElementById('turnstile-container');
                    if (!container) return;
                    
                    // Explicitly check that the site key is available and valid
                    const siteKey = SITE_KEY_CLOUDFLARE;
                    if (!siteKey) {
                        console.error('Turnstile site key is missing');
                        return;
                    }
                    
                    // Add error handling to the Turnstile render y capturar widgetId
                    const id = (window as any).turnstile.render('#turnstile-container', {
                        sitekey: siteKey,
                        theme: 'auto',
                        language : "en",
                        callback: (token: string) => {
                            onVerify(token);
                        },
                        'error-callback': (error: any) => {
                            console.error('Turnstile error:', error);
                            // Opcional: resetear después de un error
                            // setTimeout(() => {
                            //     if ((window as any).turnstile && id) {
                            //         (window as any).turnstile.reset(id);
                            //     }
                            // }, 2000);
                        },
                        retry: 'auto',        // Can be 'auto' or 'never'
                        'retry-interval': 5000 // Retry every 5 seconds if needed
                    });
                    
                    setWidgetId(id);
                    setIsLoaded(true);
                } catch (error) {
                    console.error('Error rendering Turnstile:', error);
                }
            }
        };

        // Check if script is already loaded
        const scriptExists = document.querySelector('script[src="https://challenges.cloudflare.com/turnstile/v0/api.js"]');
        
        if (!scriptExists) {
            const script = document.createElement('script');
            script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
            script.async = true;
            script.defer = true;
            
            script.onload = loadTurnstile;
            script.onerror = (error) => {
                console.error('Failed to load Turnstile script:', error);
            };
            
            document.head.appendChild(script);
        } else {
            loadTurnstile();
        }

        // Cleanup function
        return () => {
            // Optional: cleanup code if needed when component unmounts
        };
    }, [isLoaded, onVerify]);

    return <div id="turnstile-container"></div>;
});

// Asignar displayName para debugging
Recaptcha.displayName = 'Recaptcha';

export default Recaptcha;