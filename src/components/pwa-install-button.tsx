'use client';

import { Download } from 'lucide-react';
import { Button } from './ui/button';
import { usePWAInstall } from '@/hooks/use-pwa-install';

/**
 * A button that allows the user to install the app as a PWA (Progressive Web App).
 */
export function PWAInstallButton() {
  const { isInstallable, handleInstallClick } = usePWAInstall();

  if (!isInstallable) return null;

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleInstallClick} 
      className="flex items-center gap-2 bg-spice-50 border-spice-200 text-spice-700 hover:bg-spice-100 animate-in fade-in slide-in-from-top-2"
    >
      <Download className="h-4 w-4" />
      <span className="hidden lg:inline">Install CRM</span>
      <span className="lg:hidden">Install</span>
    </Button>
  );
}
