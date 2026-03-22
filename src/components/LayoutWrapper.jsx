"use client";

import { SidebarProvider, useSidebar } from "./SidebarContext";
import Navbar from "./Navbar";

function LayoutInner({ children }) {
    const { collapsed } = useSidebar();

    return (
        <div className="flex min-h-screen bg-[#F5F0EB]">
            <Navbar />

            <div
                className={`flex-1 min-w-0 min-h-screen transition-all duration-300 ${
                    collapsed ? "md:ml-18" : "md:ml-60"
                }`}
            >
                {children}
            </div>
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
