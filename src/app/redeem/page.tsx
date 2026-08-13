import { Suspense } from "react";
import RedemptionForm from "./RedemptionForm";

export default function RedeemPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
          <RedemptionForm />
        </Suspense>
      </div>
    </div>
  );
}
