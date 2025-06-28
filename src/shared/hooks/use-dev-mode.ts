import { SettingsStateStore } from '@/features/settings/stores';

export function useDevMode() {
  return SettingsStateStore((s) => s.settings.devMode);
}

export default useDevMode; 