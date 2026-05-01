import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import LayoutWrapper from "@/components/LayoutWrapper";
import { Analytics } from "@vercel/analytics/next";
import PushNotificationProvider from "@/components/PushNotification";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata = {
    metadataBase: new URL("https://mvp-1-pi.vercel.app/"),
    title: {
        default: "Camp Connect 🏕️ - NYSC Camp Gist & Updates",
        template: "%s | Camp Connect 🏕️",
    },
    description:
        "Stay updated with camp life. Share gists, vote in polls, rate food, and report issues with fellow corpers in camp.",
    keywords: [
        "NYSC camp gist",
        "camp updates Nigeria",
        "corpers community",
        "NYSC polls",
        "camp food ratings",
        "platoon gist",
    ],
    authors: [{ name: "Camp Connect" }],
    creator: "Camp Connect",

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

export default function RootLayout({ children }) {
    return (
        <html
            lang="en"
            className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
        >
            <body className="min-h-full flex flex-col">
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
