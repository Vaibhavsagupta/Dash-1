import TeacherDetailedAnalytics from '@/components/TeacherDetailedAnalytics';

export default async function TeacherDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return (
        <TeacherDetailedAnalytics teacherId={id} />
    );
}
