import { Suspense } from "react";
import NewView from "@/components/NewView";

export default function Page() {
  return (
    <Suspense>
      <NewView />
    </Suspense>
  );
}
