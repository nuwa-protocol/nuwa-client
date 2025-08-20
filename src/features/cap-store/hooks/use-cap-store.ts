import { useCapKit } from '@/shared/hooks';
import { useCurrentCap } from '@/shared/hooks/use-current-cap';
import { CapStateStore } from '../stores';

/**
 * Hook for managing the installed caps
 */
export const useCapStore = () => {
  const { installedCaps, addInstalledCap, updateInstalledCap } =
    CapStateStore();
  const { capKit } = useCapKit();
  const { setCurrentCap } = useCurrentCap();

  const downloadCap = async (capCid: string) => {
    if (!capKit) {
      throw new Error('CapKit not initialized');
    }

    const capData = await capKit.downloadCapWithCID(capCid, 'utf8');

    return capData;
  };

  const addCapToFavorite = async (capId: string, capCid?: string) => {
    const installedCap = installedCaps[capId];
    if (!installedCap) {
      if (!capCid) {
        throw new Error('Cap CID is required for downloading cap');
      }
      const capData = await downloadCap(capCid);
      addInstalledCap({
        cid: capCid,
        capData,
        isFavorite: true,
        lastUsedAt: null,
      });
    } else {
      updateInstalledCap(capId, {
        isFavorite: true,
      });
    }
  };

  const removeCapFromFavorite = (capId: string) => {
    const installedCap = installedCaps[capId];
    if (!installedCap) {
      throw new Error('Cap is not installed');
    }
    updateInstalledCap(capId, {
      isFavorite: false,
    });
  };

  const runCap = async (capId: string, capCid?: string) => {
    const installedCap = installedCaps[capId];

    if (!installedCap) {
      if (!capCid) {
        throw new Error('Cap CID is required for downloading cap');
      }
      const capData = await downloadCap(capCid);
      addInstalledCap({
        cid: capCid,
        capData,
        isFavorite: false,
        lastUsedAt: Date.now(),
      });
      setCurrentCap(capData);
    } else {
      updateInstalledCap(capId, {
        lastUsedAt: Date.now(),
      });

      setCurrentCap(installedCap.capData);
    }
  };

  const getRecentCaps = () => {
    return Object.values(installedCaps)
      .filter((cap) => cap.lastUsedAt !== null)
      .sort((a, b) => {
        if (a.lastUsedAt && b.lastUsedAt) {
          return b.lastUsedAt - a.lastUsedAt;
        }
        return 0;
      })
      .map((cap) => cap.capData);
  };

  const getFavoriteCaps = () => {
    return Object.values(installedCaps)
      .filter((cap) => cap.isFavorite)
      .sort((a, b) => {
        if (a.lastUsedAt && b.lastUsedAt) {
          return b.lastUsedAt - a.lastUsedAt;
        }
        return 0;
      })
      .map((cap) => cap.capData);
  };

  const removeCapFromRecents = (capId: string) => {
    const installedCap = installedCaps[capId];
    if (!installedCap) {
      throw new Error('Cap is not installed');
    }
    updateInstalledCap(capId, {
      ...installedCap,
      lastUsedAt: null,
    });
  };

  const isCapFavorite = (capId: string) => {
    const installedCap = installedCaps[capId];
    return installedCap?.isFavorite;
  };

  return {
    installedCaps,
    runCap,
    getFavoriteCaps,
    addCapToFavorite,
    removeCapFromFavorite,
    getRecentCaps,
    removeCapFromRecents,
    isCapFavorite,
  };
};
