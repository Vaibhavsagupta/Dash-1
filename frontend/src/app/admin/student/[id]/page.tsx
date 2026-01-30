import StudentDetailedAnalytics from '@/components/StudentDetailedAnalytics';

export default async function StudentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-100 p-8">
            <StudentDetailedAnalytics studentId={id} />
        </div>
    );
}
