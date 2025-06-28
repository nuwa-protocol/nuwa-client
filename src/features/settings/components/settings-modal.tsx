"use client";

import type { LucideIcon } from "lucide-react";
import { Monitor, PlayCircle, User } from "lucide-react";
import type React from "react";
import { useRef, useState } from "react";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useSettings } from "@/features/settings/hooks/use-settings";
import { toast } from "@/shared/components";
import * as Dialog from "@/shared/components/ui";
import { useLanguage } from "@/shared/hooks/use-language";
import { useStorage } from "@/shared/hooks/use-storage";
import type { SettingCardProps } from "./setting-card";
import { SettingSection } from "./setting-section";
import { SettingsNav } from "./settings-nav";
import { useDevMode } from "@/shared/hooks";

// Define the type for settingsSections
interface SettingsSection {
  id: string;
  icon: LucideIcon;
  name: string;
  description: string;
  cardItems: SettingCardProps[];
}

// Update props to support controlled and uncontrolled usage
interface SettingsModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

export function SettingsModal({
  open,
  onOpenChange,
  children,
}: SettingsModalProps) {
  const { t } = useLanguage();
  const [activeSectionIndex, setActiveSectionIndex] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isClearing, setIsClearing] = useState(false);
  const { clearAllStorage } = useStorage();
  const { settings, setSetting } = useSettings();
  const { did } = useAuth();
  const [tempName, setTempName] = useState(settings.name);
  const isDevMode = useDevMode();

  // Handlers for cards
  const handleDisplayNameChange = (value: string) => setTempName(value);
  const handleDisplayNameSave = () => setSetting("name", tempName);

  // Avatar/photo logic
  const handleAvatarButtonClick = () => fileInputRef.current?.click();
  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === "string") {
          setSetting("avatar", result);
        }
      };
      reader.readAsDataURL(file);
    }
  };
  const handleRemoveAvatar = () => {
    setSetting("avatar", null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Clear all storage logic
  const handleClearStorage = async () => {
    setIsClearing(true);
    try {
      await clearAllStorage();
      toast({
        type: "success",
        description: t("settings.system.clearAllStorage.success"),
      });
      window.location.reload();
    } catch (error) {
      console.error("Failed to clear storage:", error);
      toast({
        type: "error",
        description: t("settings.system.clearAllStorage.error"),
      });
    } finally {
      setIsClearing(false);
    }
  };

  // Settings sections using SettingCard variants
  const settingsSections: SettingsSection[] = [
    {
      id: "profile",
      icon: User,
      name: t("settings.sections.profile.title"),
      description: t("settings.sections.profile.subtitle"),
      cardItems: [
        {
          variant: "info",
          title: t("settings.profile.didInformation.title"),
          description: t("settings.profile.didInformation.description"),
          info: did || "",
          copyLabel: t("settings.profile.didInformation.copy"),
          copiedLabel: t("settings.profile.didInformation.copied"),
        },
        ...(
          isDevMode
            ? ([
                {
                  variant: "single-input" as const,
                  title: t("settings.profile.displayName.title"),
                  description: t("settings.profile.displayName.description"),
                  value: tempName,
                  onChange: handleDisplayNameChange,
                  placeholder: t("settings.profile.displayName.placeholder"),
                  buttonLabel: t("settings.profile.displayName.save"),
                  onButtonClick: handleDisplayNameSave,
                  disabled: tempName === settings.name && settings.name !== "",
                },
                {
                  variant: "avatar" as const,
                  title: t("settings.profile.photo.title"),
                  description: t("settings.profile.photo.description"),
                  avatarUrl: settings.avatar,
                  onAvatarChange: handleAvatarChange,
                  onRemoveAvatar: handleRemoveAvatar,
                  onUploadClick: handleAvatarButtonClick,
                  uploadLabel: t("settings.profile.photo.changePhoto"),
                  removeLabel: t("settings.profile.photo.remove"),
                  fileInputRef: fileInputRef as React.RefObject<HTMLInputElement>,
                  fileTypesHint: t("settings.profile.photo.fileTypes"),
                  fallbackUrl: did ? `https://avatar.vercel.sh/${did}` : undefined,
                },
              ] satisfies SettingCardProps[])
            : []
        ),
      ],
    },
    {
      id: "general",
      icon: Monitor,
      name: t("settings.sections.general.title") || "General",
      description: t("settings.sections.general.subtitle") || "General application settings.",
      cardItems: [
        {
          variant: "single-select",
          title: t("settings.system.language.title") || "Language",
          description: t("settings.system.language.description") || "Select your preferred language.",
          value: settings.language,
          onChange: (value: string) => setSetting("language", value as "en" | "cn"),
          options: [
            { label: t("language.english"), value: "en" },
            { label: t("language.chinese"), value: "cn" },
          ],
          disabled: false,
        },
      ],
    },
    {
      id: "system",
      icon: Monitor,
      name: t("settings.sections.system.title"),
      description: t("settings.sections.system.subtitle"),
      cardItems: [
        {
          variant: "switch",
          title: t("settings.system.devMode.title") || "Developer Mode",
          description: t("settings.system.devMode.description") || "Enable or disable developer mode.",
          checked: settings.devMode,
          onChange: (checked: boolean) => setSetting("devMode", checked),
          disabled: false,
        },
        {
          variant: "danger-action",
          title: t("settings.system.clearAllStorage.title"),
          description: t("settings.system.clearAllStorage.description"),
          buttonLabel: t("settings.system.clearAllStorage.button"),
          onClick: handleClearStorage,
          disabled: isClearing,
          confirmationTitle: t("settings.system.clearAllStorage.confirmTitle"),
          confirmationDescription: t(
            "settings.system.clearAllStorage.confirmDescription"
          ),
          confirmationButtonLabel: t(
            "settings.system.clearAllStorage.confirmButton"
          ),
          cancelButtonLabel: t("settings.system.clearAllStorage.cancel"),
        },
      ],
    },
    ...(
      isDevMode
        ? [
            {
              id: "placeholders",
              icon: PlayCircle,
              name: t("settings.sections.placeholders.title"),
              description: t("settings.sections.placeholders.subtitle"),
              cardItems: [
                {
                  variant: "single-input" as const,
                  title: "Single Input",
                  description: "A single input with a save button.",
                  value: "Mock value",
                  onChange: () => {},
                  placeholder: "Enter something...",
                  buttonLabel: "Save",
                  onButtonClick: () => {},
                  disabled: false,
                },
                {
                  variant: "single-select" as const,
                  title: "Single Select",
                  description: "A single select dropdown.",
                  value: "option1",
                  onChange: () => {},
                  options: [
                    { label: "Option 1", value: "option1" },
                    { label: "Option 2", value: "option2" },
                  ],
                  disabled: false,
                },
                {
                  variant: "switch" as const,
                  title: "Switch",
                  description: "A switch toggle.",
                  checked: true,
                  onChange: () => {},
                  disabled: false,
                },
                {
                  variant: "info" as const,
                  title: "Info",
                  description: "An info card with copy.",
                  info: "Mock info to copy",
                  copyLabel: "Click to copy",
                  copiedLabel: "Copied!",
                },
                {
                  variant: "danger-action" as const,
                  title: "Danger Action",
                  description: "A dangerous action with confirmation.",
                  buttonLabel: "Delete",
                  onClick: () => {},
                  disabled: false,
                  confirmationTitle: "Are you sure?",
                  confirmationDescription: "This cannot be undone.",
                  confirmationButtonLabel: "Delete",
                  cancelButtonLabel: "Cancel",
                },
                {
                  variant: "avatar" as const,
                  title: "Avatar",
                  description: "Upload or remove your avatar.",
                  avatarUrl: null,
                  onAvatarChange: () => {},
                  onRemoveAvatar: () => {},
                  onUploadClick: () => {},
                  uploadLabel: "Upload",
                  removeLabel: "Remove",
                  fileInputRef: fileInputRef as React.RefObject<HTMLInputElement>,
                  fileTypesHint: "PNG, JPG, GIF",
                  fallbackUrl: "https://avatar.vercel.sh/mock",
                },
              ],
            },
          ]
        : []
    ),
  ];

  const activeSection = settingsSections[activeSectionIndex];

  return (
    <Dialog.Dialog
      {...(open !== undefined && onOpenChange ? { open, onOpenChange } : {})}
    >
      {children && (
        <Dialog.DialogTrigger asChild>{children}</Dialog.DialogTrigger>
      )}
      <Dialog.DialogContent
        className="fixed left-1/2 top-1/2 z-50 grid -translate-x-1/2 -translate-y-1/2 gap-0 border bg-background p-0 shadow-lg sm:rounded-lg overflow-hidden"
        style={{
          width: "80vw",
          maxWidth: 800,
          height: "80vh",
          maxHeight: 700,
        }}
        aria-describedby={undefined}
      >
        <Dialog.DialogTitle className="sr-only">Settings</Dialog.DialogTitle>
        <div className="size-full overflow-auto hide-scrollbar">
          <div className="mx-auto w-full px-16 pb-8">
            <SettingsNav
              settingsSections={settingsSections}
              setActiveSectionIndex={setActiveSectionIndex}
              activeSectionIndex={activeSectionIndex}
            />
            <SettingSection
              key={activeSection.id}
              title={activeSection.name}
              description={activeSection.description}
              settingCards={activeSection.cardItems}
            />
          </div>
        </div>
      </Dialog.DialogContent>
    </Dialog.Dialog>
  );
}
