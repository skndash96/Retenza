import { useState, useEffect } from 'react';

// Extend Navigator interface for iOS Safari standalone mode
declare global {
    interface Navigator {
        standalone?: boolean;
    }
}

interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{
        outcome: 'accepted' | 'dismissed';
        platform: string;
    }>;
    prompt(): Promise<void>;
}

export const usePWAInstall = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isInstalled, setIsInstalled] = useState(false);
    const [isInstallable, setIsInstallable] = useState(false);

    useEffect(() => {
        // Check if the app is already installed
        const checkIfInstalled = () => {
            if (window.matchMedia('(display-mode: standalone)').matches) {
                setIsInstalled(true);
                setIsInstallable(false);
            } else if (window.navigator.standalone) {
                // iOS Safari
                setIsInstalled(true);
                setIsInstallable(false);
            } else {
                setIsInstalled(false);
            }
        };

        // Listen for the beforeinstallprompt event
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            setIsInstallable(true);
        };

        // Listen for app installed event
        const handleAppInstalled = () => {
            setIsInstalled(true);
            setIsInstallable(false);
            setDeferredPrompt(null);
        };

        // Check initial state
        checkIfInstalled();

        // Add event listeners
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        // Cleanup
        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const installPWA = async (): Promise<boolean> => {
        if (!deferredPrompt) {
            console.log('No install prompt available');
            return false;
        }

        try {
            // Show the install prompt
            void deferredPrompt.prompt();

            // Wait for the user to respond to the prompt
            const { outcome } = await deferredPrompt.userChoice;

            if (outcome === 'accepted') {
                console.log('User accepted the install prompt');
                setDeferredPrompt(null);
                setIsInstallable(false);
                return true;
            } else {
                console.log('User dismissed the install prompt');
                return false;
            }
        } catch (error) {
            console.error('Error during PWA installation:', error);
            return false;
        }
    };

    return {
        isInstalled,
        isInstallable,
        installPWA,
    };
}; 