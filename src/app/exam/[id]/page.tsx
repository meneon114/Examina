import ExamWrapper from "@/components/ExamWrapper";

export default async function ExamPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <ExamWrapper examId={resolvedParams.id} />;
}
