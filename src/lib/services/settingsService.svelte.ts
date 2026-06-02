import { getApiUrl } from './hostConfig';

class SettingsService {
  isOpen = $state(false);
  currentApiUrl = $state(getApiUrl());

  open() {
    this.isOpen = true;
  }

  close() {
    this.isOpen = false;
  }

  saveHost(host: string | null) {
    if (host) {
      const sanitizedHost = host.trim().endsWith('/') ? host.trim().slice(0, -1) : host.trim();
      localStorage.setItem('iplan_api_host', sanitizedHost);
      console.log(`[Hostess PWA] API host saved to: ${sanitizedHost}`);
    } else {
      localStorage.removeItem('iplan_api_host');
      console.log('[Hostess PWA] API host reset to default.');
    }
    this.close();
    window.location.reload();
  }
}

export const settingsService = new SettingsService();
