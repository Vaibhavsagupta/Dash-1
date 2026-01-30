import TeacherDetailedAnalytics from '@/components/TeacherDetailedAnalytics';

export default async function TeacherDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-100 p-8">
            <TeacherDetailedAnalytics teacherId={id} />
        </div>
    );
}
