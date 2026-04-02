import ResultWrapper from "@/components/ResultWrapper";

export default async function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <ResultWrapper resultId={resolvedParams.id} />;
}
