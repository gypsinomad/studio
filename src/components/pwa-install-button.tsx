
'use client';

import { Download, MonitorSmartphone } from 'lucide-react';
import { Button } from './ui/button';
import { usePWAInstall } from '@/hooks/use-pwa-install';

/**
 * A button that allows the user to install the app as a PWA (Progressive Web App).
 */
export function PWAInstallButton() {
  const { isInstallable, handleInstallClick } = usePWAInstall();

  // If the browser hasn't triggered the install prompt yet, we don't show the button
  if (!isInstallable) {
    return null;
  }

  return (
    <Button 
      variant="default" 
      size="sm" 
      onClick={handleInstallClick} 
      className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white border-none shadow-md animate-in fade-in slide-in-from-top-2"
    >
      <MonitorSmartphone className="h-4 w-4" />
      <span className="hidden lg:inline">Install CRM App</span>
      <span className="lg:hidden">Install</span>
    </Button>
  );
}
