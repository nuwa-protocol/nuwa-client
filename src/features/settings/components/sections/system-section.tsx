import { useState } from 'react';
import { toast } from 'sonner';
import { useSettings } from '@/features/settings/hooks/use-settings';
import { useLanguage } from '@/shared/hooks/use-language';
import { useStorage } from '@/shared/hooks/use-storage';
import { DangerActionCard, SwitchCard } from '../cards';

export function SystemSection() {
  const { t } = useLanguage();
  const [isClearing, setIsClearing] = useState(false);
  const { clearAllStorage } = useStorage();
  const { settings, setSetting } = useSettings();
  const isDevMode = settings.devMode;

  // Clear all storage logic
  const handleClearStorage = async () => {
    setIsClearing(true);
    try {
      await clearAllStorage();
      toast.success(t('settings.system.clearAllStorage.success'));
      window.location.reload();
    } catch (error) {
      console.error('Failed to clear storage:', error);
      toast.error(t('settings.system.clearAllStorage.error'));
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          {t('settings.sections.system.title')}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t('settings.sections.system.subtitle')}
        </p>
      </div>

      <SwitchCard
        title={t('settings.system.devMode.title') || 'Developer Mode'}
        description={
          t('settings.system.devMode.description') ||
          'Enable or disable developer mode.'
        }
        checked={settings.devMode}
        onChange={(checked: boolean) => setSetting('devMode', checked)}
        disabled={false}
      />

      {isDevMode && (
        <DangerActionCard
          title={t('settings.system.clearAllStorage.title')}
          description={t('settings.system.clearAllStorage.description')}
          buttonLabel={t('settings.system.clearAllStorage.button')}
          onClick={handleClearStorage}
          disabled={isClearing}
          confirmationTitle={t('settings.system.clearAllStorage.confirmTitle')}
          confirmationDescription={t(
            'settings.system.clearAllStorage.confirmDescription',
          )}
          confirmationButtonLabel={t(
            'settings.system.clearAllStorage.confirmButton',
          )}
          cancelButtonLabel={t('settings.system.clearAllStorage.cancel')}
        />
      )}
    </div>
  );
}
