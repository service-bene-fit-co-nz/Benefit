"use client";

import { Suspense } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { UserRole } from "@prisma/client";
import { Loading } from "@/components/ui/loading";
import { FindClient } from "@/components/dashboard/trainer/summary/FindClient";

const Summary = () => {
  return (
    <ProtectedRoute
      requiredRoles={[UserRole.Trainer, UserRole.Admin, UserRole.SystemAdmin]}
    >
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold text-center mb-4">
          Trainer Dashboard
        </h1>

        <FindClient />
      </div>
    </ProtectedRoute>
  );
};

export default function SummaryWrapper() {
  return (
    <Suspense
      fallback={
        <Loading
          title="Loading Trainer Dashboard"
          description="Preparing your trainer view..."
        />
      }
    >
      <Summary />
    </Suspense>
  );
}
