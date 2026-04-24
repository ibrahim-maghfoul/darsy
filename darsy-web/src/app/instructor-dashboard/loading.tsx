export default function InstructorDashboardLoading() {
    return (
        <div className="min-h-screen bg-[#F8F9FA] animate-pulse">
            {/* Hero skeleton */}
            <div className="w-full h-60 md:h-72 bg-gradient-to-br from-[#0a2a1a] to-[#166534]" />
            <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-5 space-y-4">
                <div className="flex gap-3">
                    <div className="h-10 w-36 rounded-xl bg-white border border-gray-100" />
                    <div className="h-10 w-36 rounded-xl bg-white border border-gray-100" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[0, 1, 2, 3].map(i => (
                        <div key={i} className="h-20 rounded-2xl bg-white border border-gray-100" />
                    ))}
                </div>
                <div className="h-52 rounded-2xl bg-white border border-gray-100" />
                <div className="h-64 rounded-2xl bg-white border border-gray-100" />
            </div>
        </div>
    );
}
