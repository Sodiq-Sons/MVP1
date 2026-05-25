import dynamic from "next/dynamic";

const AdminDashboard = dynamic(() => import("@/components/admin/AdminDashboard"), {
    loading: () => (
        <div className="min-h-screen bg-page flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-muted border-t-cp animate-spin" />
        </div>
    ),
});

export const metadata = {
    title: "Admin Dashboard",
    robots: { index: false, follow: false },
};

export default function Page() {
    return (
        <main id="main-content">
            <AdminDashboard />
        </main>
    );
}
