"use client";

import { Folder, Package, Search, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CapStoreModal } from "@/features/cap/components";
import { SearchModal } from "@/features/search/components";
import { SettingsModal } from "@/features/settings/components";
import { useSidebarSettings } from "@/features/settings/hooks/use-settings-sidebar";
import { Logo } from "@/shared/components";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  useSidebar,
} from "@/shared/components/ui";
import { useLanguage } from "@/shared/hooks/use-language";
import { cn } from "@/shared/utils";
import { useFloatingSidebar } from "./floating-sidebar";
import { SidebarButton } from "./sidebar-button";
import { SidebarHistory } from "./sidebar-history";
import { SidebarToggle } from "./sidebar-toggle";
import { useDevMode } from "@/shared/hooks";

export function AppSidebar() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { setOpenMobile } = useSidebar();
  const { mode: sidebarMode } = useSidebarSettings();
  const floatingContext = useFloatingSidebar();
  const sidebarVariant = sidebarMode === "floating" ? "floating" : "sidebar";
  const isDevMode = useDevMode();

  const handleNewChat = () => {
    setOpenMobile(false);
    navigate("/chat");
  };

  const handleMouseEnter = () => {
    if (sidebarMode === "floating" && floatingContext) {
      floatingContext.setIsHovering(true);
    }
  };

  const handleMouseLeave = () => {
    if (sidebarMode === "floating" && floatingContext) {
      floatingContext.setIsHovering(false);
    }
  };

  return (
    <>
      <Sidebar
        className={cn(
          "group-data-[side=left]:border-r-0 min-w-[250px]",
          // Add smooth transition animations
          "transition-all duration-300 ease-in-out"
        )}
        variant={sidebarVariant}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <SidebarHeader>
          <SidebarMenu>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <Logo />
                <SidebarToggle />
              </div>
              <SidebarButton
                text={t("nav.sidebar.new")}
                onClick={handleNewChat}
                variant="primary"
                className="my-2"
              />
              <SearchModal>
                <SidebarButton
                  icon={Search}
                  text={t("nav.sidebar.search")}
                  variant="secondary"
                />
              </SearchModal>
              <CapStoreModal>
                <SidebarButton
                  icon={Package}
                  text={t("nav.sidebar.capStore")}
                  variant="secondary"
                />
              </CapStoreModal>
              {isDevMode && (<SidebarButton
                icon={Folder}
                text={t("nav.sidebar.artifact")}
                onClick={() => {}}
                variant="secondary"
              />)}
            </div>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent className="mt-2">
          <SidebarHistory />
        </SidebarContent>
        <SidebarFooter>
          <SettingsModal>
            <SidebarButton
              icon={Settings}
              text={t("nav.sidebar.settings")}
              variant="secondary"
            />
          </SettingsModal>
        </SidebarFooter>
      </Sidebar>
    </>
  );
}
