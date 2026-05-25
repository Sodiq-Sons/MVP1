"use client";

import { SidebarProvider, useSidebar } from "./SidebarContext";
import Navbar from "./Navbar";
import ThemeToggler from "./ThemeToggler";
import WeeklyQuestionnaire from "./WeeklyQuestionnaire";
import RememberThis from "./RememberThis";
import ChatFAB from "./ChatFAB";
import PWAInstallPrompt from "./PWAInstallPrompt";
import EmergencyWatcher from "./EmergencyWatcher";

function LayoutInner({ children }) {
    const { collapsed } = useSidebar();

    return (
        <div className="flex min-h-screen" style={{ background: "var(--layout-bg)" }}>
            <Navbar />

            <div
                className={`flex-1 min-w-0 min-h-screen transition-all duration-300 ${
                    collapsed ? "md:ml-18" : "md:ml-60"
                }`}
            >
                {children}
            </div>

            <ThemeToggler />
            <WeeklyQuestionnaire />
            <RememberThis />
            <ChatFAB />
            <PWAInstallPrompt />
            <EmergencyWatcher />
        </div>
    );
}

export default function LayoutWrapper({ children }) {
    return (
        <SidebarProvider>
            <LayoutInner>{children}</LayoutInner>
        </SidebarProvider>
    );
}
