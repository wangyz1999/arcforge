"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import LoadingState from "../components/graph/LoadingState";

function CraftingTreeRedirect() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const itemName = searchParams.get("item") || "Power Rod";

  useEffect(() => {
    // Redirect to main page with graph parameter
    router.replace(`/?graph=${encodeURIComponent(itemName)}`);
  }, [itemName, router]);

  return <LoadingState />;
}

export default function CraftingTree() {
  return (
    <Suspense fallback={<LoadingState />}>
      <CraftingTreeRedirect />
    </Suspense>
  );
}
