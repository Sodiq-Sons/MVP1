import "@fontsource/plus-jakarta-sans";
import "@fontsource/dm-sans";
import "./globals.css";
import LayoutWrapper from "@/components/LayoutWrapper";
import { Analytics } from "@vercel/analytics/next";
import PushNotificationProvider from "@/components/PushNotification";
import { SwRegistration } from "./providers";

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
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "Camp Connect",
    },
    formatDetection: {
        telephone: false,
    },
    openGraph: {
        title: "Camp Connect 🏕️ - NYSC Camp Gist & Updates",
        description:
            "Join fellow corpers to share gists, vote in polls, rate camp food, and discuss issues in real time.",
        url: "https://mvp-1-pi.vercel.app/",
        siteName: "Camp Connect 🏕️",
        locale: "en_NG",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Camp Connect 🏕️",
        description:
            "Gists, polls, food ratings, and issues — all happening live in camp.",
    },
    robots: {
        index: true,
        follow: true,
    },
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
                <link
                    rel="apple-touch-icon"
                    sizes="152x152"
                    href="/icons/icon-152x152.png"
                />
                <link
                    rel="apple-touch-icon"
                    sizes="180x180"
                    href="/icons/icon-192x192.png"
                />
                <link
                    rel="apple-touch-icon"
                    sizes="167x167"
                    href="/icons/icon-192x192.png"
                />
                <link
                    rel="apple-touch-startup-image"
                    href="/splash/apple-splash-2048-2732.png"
                    media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)"
                />
                <link
                    rel="apple-touch-startup-image"
                    href="/splash/apple-splash-1125-2436.png"
                    media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)"
                />
                <link
                    rel="apple-touch-startup-image"
                    href="/splash/apple-splash-750-1334.png"
                    media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)"
                />
            </head>
            <body
                className="min-h-full flex flex-col"
                style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
            >
                <SwRegistration />
                <LayoutWrapper>
                    <PushNotificationProvider>
                        {children}
                    </PushNotificationProvider>
                </LayoutWrapper>
                <Analytics />
            </body>
        </html>
    );
}
