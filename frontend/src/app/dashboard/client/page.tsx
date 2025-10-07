"use client";

import { ProfileCard } from "@/components/cards/profile-card";
import { FitbitStatusCard } from "@/components/cards/fitbit-status-card";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { Loading } from "@/components/ui/loading";

const Client = () => {
  const { data: session, status } = useSession();
  const [auth_id, setAuth_id] = useState<string>("UNDEFINED");

  useEffect(() => {
    if (session?.user?.id) {
      setAuth_id(session.user.id);
    } else {
      setAuth_id("UNDEFINED");
    }
  }, [session]);

  if (status === "loading") {
    return (
      <Loading
        title="Loading Client Dashboard"
        description="Setting up client-specific data..."
        size="lg"
      />
    );
  }

  return (
    <>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl h-full">
            <ProfileCard auth_id={auth_id} />
          </div>
          <div className="rounded-xl h-full">
            <FitbitStatusCard />
          </div>
          <div className="rounded-xl border h-full" />
        </div>
        <div className="min-h-[100vh] flex-1 rounded-xl md:min-h-min border" />
      </div>
    </>
  );
};
export default Client;
