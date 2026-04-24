export default function TeacherDashboardLoading() {
    return (
        <div className="min-h-screen bg-[#F8F9FA] animate-pulse">
            {/* Hero skeleton */}
            <div className="w-full h-52 md:h-64 bg-gradient-to-br from-[#071a0e] via-[#0d2416] to-[#1a3a2a]" />
            <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-5 space-y-4">
                <div className="grid grid-cols-3 gap-3 sm:gap-4">
                    {[0, 1, 2].map(i => (
                        <div key={i} className="h-24 rounded-2xl bg-white border border-gray-100" />
                    ))}
                </div>
                <div className="h-48 rounded-2xl bg-white border border-gray-100" />
                <div className="h-64 rounded-2xl bg-white border border-gray-100" />
            </div>
        </div>
    );
}
