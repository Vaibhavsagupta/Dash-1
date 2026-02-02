import StudentDetailedAnalytics from '@/components/StudentDetailedAnalytics';

export default async function StudentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return (
        <StudentDetailedAnalytics studentId={id} />
    );
}
