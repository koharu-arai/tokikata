"use client";
import { Suspense } from "react";
import { useParams } from "next/navigation";
import ProblemView from "@/components/ProblemView";

export default function Page() {
  const params = useParams<{ id: string }>();
  return (
    <Suspense>
      <ProblemView id={params.id} />
    </Suspense>
  );
}
