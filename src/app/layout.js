import { Plus_Jakarta_Sans, DM_Sans } from "next/font/google";
import "./globals.css";
import LayoutWrapper from "@/components/LayoutWrapper";
import { Analytics } from "@vercel/analytics/next";
import PushNotificationProvider from "@/components/PushNotification";
import { SwRegistration } from "./providers";
import ProfileGateProvider from "@/components/ProfileGateProvider";
import ProfileCompletionBar from "@/components/ProfileCompletionBar";

const plusJakarta = Plus_Jakarta_Sans({
    variable: "--font-plus-jakarta",
    subsets: ["latin"],
    weight: ["400", "500", "600", "700", "800"],
    display: "swap",
});

const dmSans = DM_Sans({
    variable: "--font-dm-sans",
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
    display: "swap",
});

export const metadata = {
    metadataBase: new URL("https://mvp-1-pi.vercel.app/"),
    title: {
        default: "Camp Connect 🏕️ - NYSC Camp Gist & Updates",
        template: "%s | Camp Connect 🏕️",
    },
    description:
        "Stay updated with camp life. Share gists, vote in polls, rate food, and report issues with fellow corpers in camp.",
};

export const viewport = {
    themeColor: "#F97316",
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
};

export default function RootLayout({ children }) {
    return (
        <html
            lang="en"
            className={`${plusJakarta.variable} ${dmSans.variable} h-full antialiased`}
        >
            <head>
                <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
            </head>

            <body
                className="min-h-full flex flex-col"
                style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
            >
                <SwRegistration />

                <ProfileGateProvider>
                    <LayoutWrapper>
                        <PushNotificationProvider>
                            {children}
                        </PushNotificationProvider>

                        <ProfileCompletionBar />
                    </LayoutWrapper>
                </ProfileGateProvider>

                <Analytics />
            </body>
        </html>
    );
}
