// settings-store.ts
// Store for managing user settings and UI preferences

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { NuwaIdentityKit } from "@/features/auth/services";
import type { Locale } from "@/shared/locales";
import { createPersistConfig, db } from "@/storage";

// get current DID
const getCurrentDID = async () => {
  const { getDid } = await NuwaIdentityKit();
  return await getDid();
};

const settingsDB = db;

// ================= Interfaces ================= //

// user settings interface
interface UserSettings {
  language: Locale;
  name: string;
  avatar: string | null;
  devMode: boolean;
}

// settings interface
interface SettingsState {
  // grouped user settings
  settings: UserSettings;
  setSettings: (settings: UserSettings) => void;
  setSetting: <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ) => void;

  // sidebar state
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  sidebarMode: "pinned" | "floating";
  setSidebarMode: (mode: "pinned" | "floating") => void;

  // reset settings
  resetSettings: () => void;

  // Data persistence
  loadFromDB: () => Promise<void>;
  saveToDB: () => Promise<void>;
}

// ================= Persist Configuration ================= //

const persistConfig = createPersistConfig<SettingsState>({
  name: "settings-storage",
  getCurrentDID: getCurrentDID,
  partialize: (state) => ({
    settings: state.settings,
    sidebarCollapsed: state.sidebarCollapsed,
    sidebarMode: state.sidebarMode,
  }),
  onRehydrateStorage: () => (state?: SettingsState) => {
    if (state) {
      state.loadFromDB();
    }
  },
});

// ================= Store Definition ================= //

export const SettingsStateStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      // User settings
      settings: {
        language: "en",
        name: "",
        avatar: null,
        devMode: false,
      },
      setSettings: (settings: UserSettings) => {
        set({ settings });
        get().saveToDB();
      },
      setSetting: (key, value) => {
        set((state) => ({
          settings: {
            ...state.settings,
            [key]: value,
          },
        }));
        get().saveToDB();
      },

      // Sidebar state
      sidebarCollapsed: false,
      setSidebarCollapsed: (collapsed: boolean) => {
        set({ sidebarCollapsed: collapsed });
      },
      sidebarMode: "pinned",
      setSidebarMode: (mode: "pinned" | "floating") => {
        set({ sidebarMode: mode });
      },

      // Reset functionality
      resetSettings: () => {
        set({
          settings: {
            language: "en",
            name: "",
            avatar: null,
            devMode: false,
          },
          sidebarCollapsed: false,
          sidebarMode: "pinned",
        });
        get().saveToDB();
      },

      // Data persistence methods
      loadFromDB: async () => {
        const currentDID = await getCurrentDID();
        if (typeof window === "undefined" || !currentDID) return;

        try {
          const userSettings = await settingsDB.settings.get(currentDID);

          if (userSettings) {
            set({
              settings: userSettings.settings,
              sidebarCollapsed: userSettings.sidebarCollapsed,
              sidebarMode: userSettings.sidebarMode,
            });
          }
        } catch (error) {
          console.error("Failed to load settings from DB:", error);
        }
      },

      saveToDB: async () => {
        const currentDID = await getCurrentDID();
        if (typeof window === "undefined" || !currentDID) return;

        try {
          const { settings, sidebarCollapsed, sidebarMode } = get();
          await settingsDB.settings.put({
            settings,
            sidebarCollapsed,
            sidebarMode,
          });
        } catch (error) {
          console.error("Failed to save settings to DB:", error);
        }
      },
    }),
    persistConfig
  )
);
