import { Plus_Jakarta_Sans, DM_Sans } from "next/font/google";
import "./globals.css";
import LayoutWrapper from "@/components/LayoutWrapper";
import { Analytics } from "@vercel/analytics/next";
import PushNotificationProvider from "@/components/PushNotification";
import { SwRegistration } from "./providers";
import ProfileGateProvider from "@/components/ProfileGateProvider";
import ProfileCompletionBar from "@/components/ProfileCompletionBar";
import { ThemeProvider } from "@/context/ThemeContext";

const plusJakarta = Plus_Jakarta_Sans({
    variable: "--font-plus-jakarta",
    subsets: ["latin"],
    weight: ["400", "500", "600", "700", "800"],
    display: "swap",
    preload: true,
});

const dmSans = DM_Sans({
    variable: "--font-dm-sans",
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
    display: "swap",
    preload: true,
});

const BASE_URL = "https://mvp-1-pi.vercel.app";

export const metadata = {
    metadataBase: new URL(BASE_URL),
    title: {
        default: "Camp Connect — NYSC Camp Gists, Issues & Polls",
        template: "%s | Camp Connect",
    },
    description:
        "The real-time social platform for NYSC corps members. Share camp gists, report issues, vote in polls, and connect with your platoon.",
    keywords: [
        "NYSC", "camp connect", "corps members", "camp gist", "NYSC issues",
        "Nigeria youth service", "camp life", "platoon", "corper",
    ],
    authors: [{ name: "Camp Connect" }],
    creator: "Camp Connect",
    publisher: "Camp Connect",
    robots: {
        index: true,
        follow: true,
        googleBot: { index: true, follow: true, "max-image-preview": "large" },
    },
    openGraph: {
        type: "website",
        locale: "en_NG",
        url: BASE_URL,
        siteName: "Camp Connect",
        title: "Camp Connect — NYSC Camp Gists, Issues & Polls",
        description:
            "The real-time social platform for NYSC corps members. Share camp gists, report issues, vote in polls, and connect with your platoon.",
        images: [
            {
                url: "/icons/icon-512x512.png",
                width: 512,
                height: 512,
                alt: "Camp Connect — NYSC social platform",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "Camp Connect — NYSC Camp Gists, Issues & Polls",
        description:
            "The real-time social platform for NYSC corps members. Share camp gists, report issues, and connect with your platoon.",
        images: ["/icons/icon-512x512.png"],
    },
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "Camp Connect",
    },
};

// Allow pinch-zoom — userScalable:false is a WCAG 1.4.4 violation
export const viewport = {
    themeColor: "#F97316",
    width: "device-width",
    initialScale: 1,
    minimumScale: 1,
};

export default function RootLayout({ children }) {
    return (
        <html
            lang="en"
            className={`${plusJakarta.variable} ${dmSans.variable} h-full antialiased font-sans`}
        >
            <head>
                <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
                {/* Preconnect to third-party origins to reduce latency */}
                <link rel="preconnect" href="https://res.cloudinary.com" />
                <link rel="preconnect" href="https://firestore.googleapis.com" />
                <link rel="preconnect" href="https://identitytoolkit.googleapis.com" />
                <link rel="dns-prefetch" href="https://firebasestorage.googleapis.com" />
            </head>

            <body className="min-h-full flex flex-col">
                {/* Keyboard / screen-reader shortcut */}
                <a href="#main-content" className="skip-link">
                    Skip to main content
                </a>

                {/* SW update listener — next-pwa handles registration */}
                <SwRegistration />

                <ThemeProvider>
                    <ProfileGateProvider>
                        <PushNotificationProvider>
                            <LayoutWrapper>
                                {children}
                                <ProfileCompletionBar />
                            </LayoutWrapper>
                        </PushNotificationProvider>
                    </ProfileGateProvider>
                </ThemeProvider>

                <Analytics />
            </body>
        </html>
    );
}
