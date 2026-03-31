// app/privacy/page.tsx
import Link from "next/link";

export const metadata = {
    title: "Privacy Policy | We The People NG",
    description:
        "Privacy policy for We The People NG - Nigeria's civic engagement platform",
};

export default function PrivacyPolicyPage() {
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

            {/* Content */}
            <main className="max-w-3xl mx-auto px-4 py-8">
                <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 shadow-sm">
                    <h1
                        className="text-2xl font-bold text-gray-900 mb-6"
                        style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
                    >
                        Privacy Policy
                    </h1>

                    <div
                        className="space-y-6 text-sm text-gray-600"
                        style={{ fontFamily: "DM Sans, sans-serif" }}
                    >
                        <p className="text-gray-500">
                            Last updated: March 28, 2026
                        </p>

                        <section>
                            <h2 className="text-lg font-bold text-gray-900 mb-3">
                                1. Introduction
                            </h2>
                            <p className="leading-relaxed">
                                We The People NG (&quot;we,&quot;
                                &quot;our,&quot; or &quot;us&quot;) is committed
                                to protecting your privacy. This Privacy Policy
                                explains how we collect, use, disclose, and
                                safeguard your information when you use our
                                civic engagement platform.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-bold text-gray-900 mb-3">
                                2. Information We Collect
                            </h2>
                            <p className="leading-relaxed mb-3">
                                We collect information in the following ways:
                            </p>
                            <ul className="list-disc pl-5 space-y-2 leading-relaxed">
                                <li>
                                    <strong>Anonymous Usage Data:</strong> We
                                    use anonymous authentication to provide core
                                    functionality. Your user ID is randomly
                                    generated and not linked to personal
                                    information.
                                </li>
                                <li>
                                    <strong>Issue Reports:</strong> When you
                                    report an issue, we collect the title,
                                    description, category, location, and any
                                    media you provide.
                                </li>
                                <li>
                                    <strong>Votes and Comments:</strong> We
                                    store your votes on issues and any comments
                                    you make.
                                </li>
                                <li>
                                    <strong>Technical Data:</strong> We collect
                                    IP addresses, browser type, and device
                                    information for security and analytics
                                    purposes.
                                </li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-lg font-bold text-gray-900 mb-3">
                                3. How We Use Your Information
                            </h2>
                            <p className="leading-relaxed mb-3">
                                We use the collected information to:
                            </p>
                            <ul className="list-disc pl-5 space-y-2 leading-relaxed">
                                <li>
                                    Provide and maintain our platform services
                                </li>
                                <li>
                                    Display community issues and facilitate
                                    civic engagement
                                </li>
                                <li>
                                    Prevent fraud and ensure platform security
                                </li>
                                <li>
                                    Analyze usage patterns to improve user
                                    experience
                                </li>
                                <li>
                                    Communicate important updates about the
                                    platform
                                </li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-lg font-bold text-gray-900 mb-3">
                                4. Data Storage and Security
                            </h2>
                            <p className="leading-relaxed">
                                We use Firebase (Google Cloud) to store data
                                securely. All data is encrypted in transit and
                                at rest. We implement appropriate technical and
                                organizational measures to protect your
                                information against unauthorized access,
                                alteration, disclosure, or destruction.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-bold text-gray-900 mb-3">
                                5. Data Sharing and Disclosure
                            </h2>
                            <p className="leading-relaxed">
                                We do not sell your personal information. We may
                                share anonymous, aggregated data with research
                                partners or government agencies to help address
                                community issues. Individual reports may be
                                shared with relevant authorities when necessary
                                for public safety or legal compliance.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-bold text-gray-900 mb-3">
                                6. Your Rights
                            </h2>
                            <p className="leading-relaxed mb-3">
                                You have the right to:
                            </p>
                            <ul className="list-disc pl-5 space-y-2 leading-relaxed">
                                <li>
                                    Access the information you&apos;ve provided
                                </li>
                                <li>Request deletion of your content</li>
                                <li>Opt out of non-essential communications</li>
                                <li>Report privacy concerns to our team</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-lg font-bold text-gray-900 mb-3">
                                7. Cookies and Local Storage
                            </h2>
                            <p className="leading-relaxed">
                                We use local storage to remember your voting
                                preferences and authentication state. This helps
                                provide a seamless experience without requiring
                                account registration. You can clear this data at
                                any time through your browser settings.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-bold text-gray-900 mb-3">
                                8. Children&apos;s Privacy
                            </h2>
                            <p className="leading-relaxed">
                                Our platform is not intended for children under
                                13. We do not knowingly collect information from
                                children under 13. If you are a parent or
                                guardian and believe your child has provided us
                                with information, please contact us immediately.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-bold text-gray-900 mb-3">
                                9. Changes to This Policy
                            </h2>
                            <p className="leading-relaxed">
                                We may update this Privacy Policy from time to
                                time. We will notify you of any changes by
                                posting the new policy on this page and updating
                                the &quot;Last updated&quot; date.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-bold text-gray-900 mb-3">
                                10. Contact Us
                            </h2>
                            <p className="leading-relaxed">
                                If you have any questions about this Privacy
                                Policy, please contact us at:{" "}
                                <a
                                    href="mailto:privacy@wethepeople.ng"
                                    className="text-[#F97316] hover:underline"
                                >
                                    privacy@wethepeople.ng
                                </a>
                            </p>
                        </section>
                    </div>
                </div>

                {/* Back Button */}
                <div className="mt-6 text-center">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#F97316] transition-colors"
                    >
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="w-4 h-4"
                        >
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                        Back to Home
                    </Link>
                </div>
            </main>
        </div>
    );
}
