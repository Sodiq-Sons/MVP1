import Link from "next/link";

export const metadata = {
    title: "About Us | We The People NG",
    description:
        "Learn about We The People NG - Nigeria's platform for civic engagement and community-driven change",
};

const teamMembers = [
    { name: "Adaobi N.", role: "Founder & CEO", emoji: "👩‍💼" },
    { name: "Chidi O.", role: "Head of Technology", emoji: "👨‍💻" },
    { name: "Fatima A.", role: "Community Lead", emoji: "🤝" },
    { name: "Emeka K.", role: "Policy Advisor", emoji: "📋" },
];

const values = [
    {
        title: "Transparency",
        description:
            "We believe in open governance and clear communication between citizens and leaders.",
        icon: "🔍",
    },
    {
        title: "Accountability",
        description:
            "We track issues from report to resolution, ensuring nothing falls through the cracks.",
        icon: "⚖️",
    },
    {
        title: "Inclusivity",
        description:
            "Every voice matters. Our platform is designed for all Nigerians, regardless of background.",
        icon: "🤲",
    },
    {
        title: "Impact",
        description:
            "We focus on real, measurable change in communities across Nigeria.",
        icon: "🎯",
    },
];

const features = [
    {
        title: "Report Issues",
        description:
            "Easily report local infrastructure, safety, and community issues with photos and location data.",
        icon: "📢",
    },
    {
        title: "Track Progress",
        description:
            "Follow your reported issues from submission through resolution with real-time updates.",
        icon: "📊",
    },
    {
        title: "Community Voting",
        description:
            "Upvote important issues and participate in polls to prioritize community needs.",
        icon: "🗳️",
    },
    {
        title: "Connect with Leaders",
        description:
            "Bridge the gap between citizens and local government officials for faster resolution.",
        icon: "🤝",
    },
];

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-[#FDF6EF]">
            {/* Header */}
            <header className="bg-[#F97316] px-4 py-4">
                <div className="max-w-3xl mx-auto flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                            <span className="text-base">✊</span>
                        </div>
                        <span
                            className="text-white font-bold text-base"
                            style={{
                                fontFamily: "Plus Jakarta Sans, sans-serif",
                            }}
                        >
                            We The People NG
                        </span>
                    </Link>
                </div>
            </header>

            {/* Hero Section */}
            <section className="bg-[#F97316] px-4 pb-12 pt-6">
                <div className="max-w-3xl mx-auto text-center">
                    <h1
                        className="text-3xl md:text-4xl font-bold text-white mb-4"
                        style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
                    >
                        Empowering Nigerians to Drive Change
                    </h1>
                    <p
                        className="text-white/80 text-lg max-w-2xl mx-auto"
                        style={{ fontFamily: "DM Sans, sans-serif" }}
                    >
                        We The People NG is a civic engagement platform that
                        connects citizens with their communities and government
                        to address local issues together.
                    </p>
                </div>
            </section>

            {/* Stats Section */}
            <section className="px-4 -mt-6">
                <div className="max-w-3xl mx-auto">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 grid grid-cols-3 gap-4">
                        <div className="text-center">
                            <div
                                className="text-2xl font-bold text-[#F97316]"
                                style={{
                                    fontFamily: "Plus Jakarta Sans, sans-serif",
                                }}
                            >
                                50K+
                            </div>
                            <div className="text-xs text-gray-500">
                                Issues Reported
                            </div>
                        </div>
                        <div className="text-center">
                            <div
                                className="text-2xl font-bold text-green-600"
                                style={{
                                    fontFamily: "Plus Jakarta Sans, sans-serif",
                                }}
                            >
                                12K+
                            </div>
                            <div className="text-xs text-gray-500">
                                Resolved
                            </div>
                        </div>
                        <div className="text-center">
                            <div
                                className="text-2xl font-bold text-blue-600"
                                style={{
                                    fontFamily: "Plus Jakarta Sans, sans-serif",
                                }}
                            >
                                100K+
                            </div>
                            <div className="text-xs text-gray-500">
                                Active Citizens
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Mission Section */}
            <section className="px-4 py-12">
                <div className="max-w-3xl mx-auto">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-2xl">🎯</span>
                            <h2
                                className="text-xl font-bold text-gray-900"
                                style={{
                                    fontFamily: "Plus Jakarta Sans, sans-serif",
                                }}
                            >
                                Our Mission
                            </h2>
                        </div>
                        <p
                            className="text-gray-600 leading-relaxed"
                            style={{ fontFamily: "DM Sans, sans-serif" }}
                        >
                            To create a more responsive and accountable
                            governance system in Nigeria by empowering citizens
                            to report issues, track resolutions, and engage
                            constructively with their elected representatives.
                            We believe that when citizens speak up and leaders
                            listen, communities thrive.
                        </p>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="px-4 pb-12">
                <div className="max-w-3xl mx-auto">
                    <h2
                        className="text-xl font-bold text-gray-900 text-center mb-6"
                        style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
                    >
                        What We Offer
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-[#F97316]/30 transition-colors"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-xl shrink-0">
                                        {feature.icon}
                                    </div>
                                    <div>
                                        <h3
                                            className="font-bold text-gray-900 mb-1"
                                            style={{
                                                fontFamily:
                                                    "Plus Jakarta Sans, sans-serif",
                                            }}
                                        >
                                            {feature.title}
                                        </h3>
                                        <p
                                            className="text-sm text-gray-500 leading-relaxed"
                                            style={{
                                                fontFamily:
                                                    "DM Sans, sans-serif",
                                            }}
                                        >
                                            {feature.description}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Values Section */}
            <section className="px-4 pb-12">
                <div className="max-w-3xl mx-auto">
                    <h2
                        className="text-xl font-bold text-gray-900 text-center mb-6"
                        style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
                    >
                        Our Core Values
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {values.map((value, index) => (
                            <div
                                key={index}
                                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
                            >
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-xl">
                                        {value.icon}
                                    </span>
                                    <h3
                                        className="font-bold text-gray-900"
                                        style={{
                                            fontFamily:
                                                "Plus Jakarta Sans, sans-serif",
                                        }}
                                    >
                                        {value.title}
                                    </h3>
                                </div>
                                <p
                                    className="text-sm text-gray-500 leading-relaxed"
                                    style={{
                                        fontFamily: "DM Sans, sans-serif",
                                    }}
                                >
                                    {value.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Team Section */}
            <section className="px-4 pb-12">
                <div className="max-w-3xl mx-auto">
                    <h2
                        className="text-xl font-bold text-gray-900 text-center mb-6"
                        style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
                    >
                        Meet the Team
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {teamMembers.map((member, index) => (
                            <div
                                key={index}
                                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center"
                            >
                                <div className="w-16 h-16 bg-linear-to-br from-orange-300 to-orange-500 rounded-full flex items-center justify-center text-2xl mx-auto mb-3">
                                    {member.emoji}
                                </div>
                                <h3
                                    className="font-bold text-gray-900 text-sm"
                                    style={{
                                        fontFamily:
                                            "Plus Jakarta Sans, sans-serif",
                                    }}
                                >
                                    {member.name}
                                </h3>
                                <p
                                    className="text-xs text-gray-500 mt-1"
                                    style={{
                                        fontFamily: "DM Sans, sans-serif",
                                    }}
                                >
                                    {member.role}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="px-4 pb-12">
                <div className="max-w-3xl mx-auto">
                    <div className="bg-[#F97316] rounded-2xl p-6 md:p-8 text-center">
                        <h2
                            className="text-2xl font-bold text-white mb-3"
                            style={{
                                fontFamily: "Plus Jakarta Sans, sans-serif",
                            }}
                        >
                            Join the Movement
                        </h2>
                        <p
                            className="text-white/80 mb-6 max-w-lg mx-auto"
                            style={{ fontFamily: "DM Sans, sans-serif" }}
                        >
                            Be part of the change you want to see in your
                            community. Report issues, vote on priorities, and
                            help build a better Nigeria.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Link
                                href="/create-issue"
                                className="bg-white text-[#F97316] px-6 py-3 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors"
                                style={{ fontFamily: "DM Sans, sans-serif" }}
                            >
                                Report an Issue
                            </Link>
                            <Link
                                href="/"
                                className="bg-white/20 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-white/30 transition-colors"
                                style={{ fontFamily: "DM Sans, sans-serif" }}
                            >
                                Browse Issues
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="px-4 py-6 border-t border-gray-200">
                <div className="max-w-3xl mx-auto text-center">
                    <p
                        className="text-sm text-gray-400"
                        style={{ fontFamily: "DM Sans, sans-serif" }}
                    >
                        © 2026 We The People NG. All rights reserved.
                    </p>
                    <div className="flex items-center justify-center gap-4 mt-3">
                        <Link
                            href="/"
                            className="text-xs text-gray-400 hover:text-[#F97316] transition-colors"
                        >
                            Home
                        </Link>
                        <Link
                            href="/create-issue"
                            className="text-xs text-gray-400 hover:text-[#F97316] transition-colors"
                        >
                            Report Issue
                        </Link>
                        <Link
                            href="/about"
                            className="text-xs text-gray-400 hover:text-[#F97316] transition-colors"
                        >
                            About
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
