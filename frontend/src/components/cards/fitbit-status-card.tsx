"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/loading";
import { getFitbitConnectionStatus } from "@/server-actions/fitbit/actions";
import { initiateFitbitOAuth } from "@/server-actions/client/integrations/fitbit";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export const FitbitStatusCard = () => {
  const {
    data: fitbitStatus,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["fitbitConnectionStatus"],
    queryFn: getFitbitConnectionStatus,
  });

  const router = useRouter(); // Initialize router

  const handleConnectFitbit = async () => {
    const response = await initiateFitbitOAuth();
    if (response.success && response.authorizeUrl) {
      router.push(response.authorizeUrl);
    } else {
      toast.error("Fitbit Connection Failed", {
        description: response.error || "Could not initiate Fitbit OAuth process.",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fitbit Connection</CardTitle>
        </CardHeader>
        <CardContent>
          <Loading description="Checking Fitbit status..." size="sm" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    toast.error("Failed to load Fitbit connection status", {
      description: (error as Error).message,
    });
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fitbit Connection</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">Error: {(error as Error).message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Fitbit Connection</CardTitle>
      </CardHeader>
      <CardContent>
        {fitbitStatus?.success ? (
          <>
            <p>{fitbitStatus.data.message}</p>
            {(fitbitStatus.data.status === "not_connected" ||
              fitbitStatus.data.status === "reauth_required") && (
              <Button onClick={handleConnectFitbit} className="mt-4">
                Connect Fitbit
              </Button>
            )}
          </>
        ) : (
          <p className="text-red-500">
            Failed to retrieve Fitbit status: {fitbitStatus?.message || "Unknown error."}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
