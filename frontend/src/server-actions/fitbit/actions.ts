"use server";

import { PrismaClient, ClientNoteType } from "@prisma/client";
import { encrypt, decrypt } from "@/lib/encryption";
import { Api, ApiConfig } from "@/lib/fitbit/20250801/api/client";
import { addDays, endOfDay, format, startOfDay } from "date-fns";
import { JsonObject } from "@prisma/client/runtime/library";
import { Buffer } from "buffer";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import { createClientNote } from "@/server-actions/client/notes/actions";
import { ActionResult } from "@/types/server-action-results";

interface FitbitActivityData {
  startDate: string;
  endDate: string;
  // Add other relevant Fitbit data fields here
}

const prisma = new PrismaClient();

interface FitbitClientSetting extends JsonObject {
  id: string;
  type: string;
  properties: FitbitSettingProperty[];
}

interface FitbitSettingProperty extends JsonObject {
  name: string;
  value: string;
  encrypted?: boolean;
}

export async function getClientActivities(
  clientId: string,
  startDate: Date,
  endDate: Date
): Promise<ActionResult<any[]>> {
  startDate = startOfDay(startDate);
  endDate = endOfDay(endDate);
  console.log(`Fetching activities for clientId: ${clientId}`);
  console.log(`Start ${startDate}`);
  console.log(`End   ${endDate}`);

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { settings: true },
  });

  if (!client || !client.settings) {
    console.error("Client or client settings not found.");
    return {
      success: false,
      message: "Client or client settings not found.",
      code: "CLIENT_NOT_FOUND",
    };
  }

  if (typeof client.settings !== "object" || client.settings === null) {
    console.error("Client settings are not a valid object.");
    return {
      success: false,
      message: "Client settings are not a valid object.",
      code: "INVALID_CLIENT_SETTINGS",
    };
  }

  const fitbitClientSettings = client.settings as FitbitClientSetting[];

  if (!fitbitClientSettings || fitbitClientSettings.length === 0) {
    console.error(
      "Fitbit settings not found or is empty for client:" + clientId
    );
    return {
      success: false,
      message: "Fitbit is not connected for this client.",
      code: "FITBIT_NOT_CONNECTED",
    };
  }

  let accessToken: string | undefined;
  let refreshToken: string | undefined;
  let expiresAt: string | undefined;
  let scopes: string | undefined;
  let fitbitUserId: string | undefined; // Add fitbitUserId variable

  const fitbitConfig = fitbitClientSettings.find(
    (setting) => setting.type === "Fitbit"
  );

  if (fitbitConfig) {
    accessToken = fitbitConfig.properties.find(
      (p) => p.name === "accessToken"
    )?.value;
    refreshToken = fitbitConfig.properties.find(
      (p) => p.name === "refreshToken"
    )?.value;
    expiresAt = fitbitConfig.properties.find(
      (p) => p.name === "expiresAt"
    )?.value;
    scopes = fitbitConfig.properties.find((p) => p.name === "scopes")?.value;
    fitbitUserId = fitbitConfig.properties.find(
      (p) => p.name === "userId"
    )?.value; // Retrieve Fitbit userId
  }

  if (!accessToken || !refreshToken || !expiresAt || !fitbitUserId) {
    console.error(
      "Missing Fitbit tokens, expiry information, or userId for client:" +
        clientId
    );
    return {
      success: false,
      message: "Missing Fitbit connection details. Please re-connect Fitbit.",
      code: "MISSING_FITBIT_DETAILS",
    };
  }

  accessToken = decrypt(accessToken);
  refreshToken = decrypt(refreshToken);
  const isTokenExpired = new Date() > new Date(expiresAt);

  if (isTokenExpired) {
    console.log("Fitbit access token expired, attempting to refresh...");
    try {
      const clientIdEnv = process.env.FITBIT_CLIENT_ID;
      const clientSecretEnv = process.env.FITBIT_CLIENT_SECRET;

      if (!clientIdEnv || !clientSecretEnv) {
        return {
          success: false,
          message: "Fitbit client environment variables not defined.",
          code: "MISSING_ENV_VARS",
        };
      }

      const credentials = `${clientIdEnv}:${clientSecretEnv}`;
      const encodedCredentials = Buffer.from(credentials, "utf-8").toString(
        "base64"
      );

      const response = await fetch("https://api.fitbit.com/oauth2/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${encodedCredentials}`,
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: refreshToken, // Use the decrypted refresh token from DB
        }).toString(),
      });

      const newTokens = await response.json();

      if (!response.ok) {
        console.error(
          "Failed to refresh Fitbit token. Status:",
          response.status
        );
        console.error("Error response:", newTokens);

        // If refresh token is invalid, clear it from DB and prompt re-auth
        if (
          response.status === 400 &&
          newTokens.errors &&
          newTokens.errors.some((err: any) => err.errorType === "invalid_grant")
        ) {
          console.error(
            "Invalid refresh token detected. Clearing Fitbit tokens for client:",
            clientId
          );
          // Clear Fitbit tokens from the client's settings
          const updatedFitbitProperties =
            fitbitConfig?.properties.filter(
              (p) =>
                p.name !== "accessToken" &&
                p.name !== "refreshToken" &&
                p.name !== "expiresAt"
            ) || [];

          const updatedFitbitConfig = {
            ...fitbitConfig,
            properties: updatedFitbitProperties,
          };

          const newSettings = fitbitClientSettings.map((s) =>
            s.id === fitbitConfig!.id ? updatedFitbitConfig : s
          );

          await prisma.client.update({
            where: { id: clientId },
            data: { settings: newSettings as any },
          });
          // Return an empty array, the UI will show "Fitbit not connected"
          return {
            success: false,
            message: "Fitbit connection requires re-authorization.",
            code: "FITBIT_REAUTH_REQUIRED",
          };
        }
        return {
          success: false,
          message: "Failed to refresh Fitbit token.",
          code: "FITBIT_REFRESH_FAILED",
        }; // For other refresh failures
      }

      if (!newTokens.access_token || !newTokens.expires_in) {
        console.error(
          "Failed to refresh Fitbit token: missing access_token or expires_in.",
          newTokens
        );
        return {
          success: false,
          message: "Fitbit token refresh response incomplete.",
          code: "FITBIT_REFRESH_INCOMPLETE",
        };
      }

      // Update accessToken and expiresAt. Only update refreshToken if a new one is provided.
      accessToken = newTokens.access_token;
      expiresAt = new Date(
        Date.now() + newTokens.expires_in * 1000
      ).toISOString();

      // Use the new refresh token if provided, otherwise keep the old one (though Fitbit usually rotates)
      const newRefreshToken = newTokens.refresh_token || refreshToken;

      const updatedFitbitProperties =
        fitbitConfig?.properties.map((prop) => {
          if (prop.name === "accessToken")
            return { ...prop, value: encrypt(accessToken as string) };
          if (prop.name === "refreshToken")
            return { ...prop, value: encrypt(newRefreshToken as string) }; // Store the new refresh token
          if (prop.name === "expiresAt")
            return { ...prop, value: expiresAt as string };
          return prop;
        }) || [];

      const updatedFitbitConfig = {
        ...fitbitConfig,
        properties: updatedFitbitProperties,
      };

      const newSettings = fitbitClientSettings.map((s) =>
        s.id === fitbitConfig!.id ? updatedFitbitConfig : s
      );

      await prisma.client.update({
        where: { id: clientId },
        data: { settings: newSettings as any },
      });

      // Update the local refreshToken variable for subsequent use in this function call
      refreshToken = newRefreshToken;
    } catch (error) {
      console.error(
        "Error refreshing Fitbit token for client:" + clientId,
        error
      );
      return {
        success: false,
        message: "Error refreshing Fitbit token.",
        code: "FITBIT_REFRESH_ERROR",
      };
    }
  }

  const fitbitClient = new Api({
    securityWorker: (token) => {
      return { headers: { Authorization: `Bearer ${accessToken}` } };
    },
  });

  const activities: { date: string; summary: any }[] = [];
  const activityTypeSummaries: { [key: string]: any } = {}; // Change to activityTypeSummaries

  // Fetch all activity log entries for the last 7 days using direct request with userId
  let activityLogListResponse;
  try {
    activityLogListResponse = await fitbitClient.request({
      path: `/1/user/${fitbitUserId}/activities/list.json`,
      method: "GET",
      query: {
        beforeDate: format(addDays(endDate, 1), "yyyy-MM-dd"),
        sort: "desc",
        limit: 100,
        offset: 0,
      },
      secure: true,
      format: "json", // Explicitly set format to json
    });
  } catch (error) {
    console.error("Error fetching Fitbit activity log list:", error);
    return {
      success: false,
      message: "Error fetching Fitbit activities.",
      code: "FITBIT_API_ERROR",
    };
  }

  if (!activityLogListResponse.data) {
    console.error("No data received from Fitbit activity log list API.");
    return {
      success: false,
      message: "No data received from Fitbit activities.",
      code: "FITBIT_API_NO_DATA",
    };
  }

  if (activityLogListResponse.data && activityLogListResponse.data.activities) {
    const filterStartDate = startDate;

    activityLogListResponse.data.activities.forEach((activity: any) => {
      const activityDate = new Date(activity.startTime);
      if (activityDate < filterStartDate) {
        return; // Skip activities older than 7 days
      }

      const specificActivityTypes = [
        "Workout",
        "Run",
        "Walk",
        "Bike",
        "Swimming",
      ];
      const activityType = specificActivityTypes.includes(activity.activityName)
        ? activity.activityName
        : "Others";

      if (!activityTypeSummaries[activityType]) {
        activityTypeSummaries[activityType] = {
          caloriesOut: 0,
          distances: [],
          steps: 0,
          count: 0,
          totalDuration: 0,
          iconName: (() => {
            switch (activityType) {
              case "Workout":
                return "Dumbbell";
              case "Run":
                return "Footprints"; // Corrected icon name
              case "Walk":
                return "Footprints"; // Corrected icon name
              case "Bike":
                return "Bike";
              case "Swimming":
                return "Waves"; // Corrected icon name
              default:
                return "Activity";
            }
          })(),
        };
      }

      // Aggregate activity data into activity type summaries
      activityTypeSummaries[activityType].caloriesOut += activity.calories || 0;
      activityTypeSummaries[activityType].steps += activity.steps || 0;
      activityTypeSummaries[activityType].count += 1;
      activityTypeSummaries[activityType].totalDuration +=
        activity.duration || 0; // Aggregate duration

      // Simple aggregation for distance - ideally, this would handle different distance units
      let existingDistance = activityTypeSummaries[activityType].distances.find(
        (d: any) => d.activity === "total"
      );
      if (existingDistance) {
        existingDistance.distance += activity.distance || 0;
      } else {
        activityTypeSummaries[activityType].distances.push({
          activity: "total",
          distance: activity.distance || 0,
          unit: activity.distanceUnit || "km",
        });
      }
    });
  }

  // Convert activity type summaries into the desired array format and round distance
  Object.keys(activityTypeSummaries).forEach((activityType) => {
    const summary = activityTypeSummaries[activityType];
    summary.distances = summary.distances.map((d: any) => ({
      ...d,
      distance: parseFloat(d.distance.toFixed(2)),
    })); // Round distance
    activities.push({
      date: activityType, // Reuse 'date' field to store activity type for display
      summary: summary,
    });
  });

  // Calculate and add a "Totals" entry
  let totalCount = 0;
  let totalDuration = 0;
  let totalSteps = 0;
  let totalCaloriesOut = 0;

  Object.values(activityTypeSummaries).forEach((summary: any) => {
    totalCount += summary.count || 0;
    totalDuration += summary.totalDuration || 0;
    totalSteps += summary.steps || 0;
    totalCaloriesOut += summary.caloriesOut || 0;
  });

  if (totalCount > 0) {
    activities.push({
      date: "Totals",
      summary: {
        count: totalCount,
        totalDuration: totalDuration,
        steps: totalSteps,
        caloriesOut: totalCaloriesOut,
        distances: [],
        iconName: "Calculator", // Corrected icon name for Totals
      },
    });
  }

  return {
    success: true,
    data: activities.sort((a, b) => {
      if (a.date === "Others") return 1;
      if (b.date === "Others") return -1;
      // Place "Totals" at the very end
      if (a.date === "Totals") return 1;
      if (b.date === "Totals") return -1;
      return a.date.localeCompare(b.date);
    }),
  };
}

export async function getFitbitConnectionStatus(): Promise<
  ActionResult<{ status: string; message: string }>
> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return {
        success: false,
        message: "User not authenticated.",
        code: "UNAUTHENTICATED",
      };
    }

    const client = await prisma.client.findUnique({
      where: { authId: session.user.id },
      select: { id: true, settings: true },
    });

    if (!client) {
      return {
        success: false,
        message: "Client not found.",
        code: "CLIENT_NOT_FOUND",
      };
    }

    const clientId = client.id;

    // Attempt to get activities for a single day to trigger token check/refresh
    // We don't care about the activities themselves, just the success of the call
    const today = new Date();
    const result = await getClientActivities(clientId, today, today);

    if (result.success) {
      return {
        success: true,
        data: {
          status: "connected",
          message: "Connected correctly to Fitbit.",
        },
      };
    } else {
      if (result.code === "FITBIT_REAUTH_REQUIRED") {
        return {
          success: true,
          data: {
            status: "reauth_required",
            message: "Fitbit connection requires re-authorization.",
          },
        };
      } else if (
        result.code === "FITBIT_NOT_CONNECTED" ||
        result.code === "MISSING_FITBIT_DETAILS"
      ) {
        return {
          success: true,
          data: {
            status: "not_connected",
            message: "Fitbit is not connected.",
          },
        };
      } else {
        return {
          success: true,
          data: {
            status: "error",
            message:
              result.message ||
              "An unknown error occurred with Fitbit connection.",
          },
        };
      }
    }
  } catch (error: any) {
    console.error("Error in getFitbitConnectionStatus:", error);
    return {
      success: false,
      message: error.message || "An unexpected error occurred.",
      code: "UNEXPECTED_ERROR",
    };
  }
}

export async function fetchRawFitbitDatabyDate(
  clientId: string,
  startDate: Date,
  endDate: Date
): Promise<ActionResult<any[]>> {
  startDate = startOfDay(startDate);
  endDate = endOfDay(endDate);
  console.log(`Fetching activities for clientId: ${clientId}`);
  console.log(`Start ${startDate}`);
  console.log(`End   ${endDate}`);

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { settings: true },
  });

  if (!client || !client.settings) {
    console.error("Client or client settings not found.");
    return {
      success: false,
      message: "Client or client settings not found.",
      code: "CLIENT_NOT_FOUND",
    };
  }

  if (typeof client.settings !== "object" || client.settings === null) {
    console.error("Client settings are not a valid object.");
    return {
      success: false,
      message: "Client settings are not a valid object.",
      code: "INVALID_CLIENT_SETTINGS",
    };
  }

  const fitbitClientSettings = client.settings as FitbitClientSetting[];

  if (!fitbitClientSettings || fitbitClientSettings.length === 0) {
    console.error(
      "Fitbit settings not found or is empty for client:" + clientId
    );
    return {
      success: false,
      message: "Fitbit is not connected for this client.",
      code: "FITBIT_NOT_CONNECTED",
    };
  }

  let accessToken: string | undefined;
  let refreshToken: string | undefined;
  let expiresAt: string | undefined;
  let scopes: string | undefined;
  let fitbitUserId: string | undefined; // Add fitbitUserId variable

  const fitbitConfig = fitbitClientSettings.find(
    (setting) => setting.type === "Fitbit"
  );

  if (fitbitConfig) {
    accessToken = fitbitConfig.properties.find(
      (p) => p.name === "accessToken"
    )?.value;
    refreshToken = fitbitConfig.properties.find(
      (p) => p.name === "refreshToken"
    )?.value;
    expiresAt = fitbitConfig.properties.find(
      (p) => p.name === "expiresAt"
    )?.value;
    scopes = fitbitConfig.properties.find((p) => p.name === "scopes")?.value;
    fitbitUserId = fitbitConfig.properties.find(
      (p) => p.name === "userId"
    )?.value; // Retrieve Fitbit userId
  }

  if (!accessToken || !refreshToken || !expiresAt || !fitbitUserId) {
    console.error(
      "Missing Fitbit tokens, expiry information, or userId for client:" +
        clientId
    );
    return {
      success: false,
      message: "Missing Fitbit connection details. Please re-connect Fitbit.",
      code: "MISSING_FITBIT_DETAILS",
    };
  }

  accessToken = decrypt(accessToken);
  refreshToken = decrypt(refreshToken);
  const isTokenExpired = new Date() > new Date(expiresAt);

  if (isTokenExpired) {
    console.log("Fitbit access token expired, attempting to refresh...");
    try {
      const clientIdEnv = process.env.FITBIT_CLIENT_ID;
      const clientSecretEnv = process.env.FITBIT_CLIENT_SECRET;

      if (!clientIdEnv || !clientSecretEnv) {
        return {
          success: false,
          message: "Fitbit client environment variables not defined.",
          code: "MISSING_ENV_VARS",
        };
      }

      const credentials = `${clientIdEnv}:${clientSecretEnv}`;
      const encodedCredentials = Buffer.from(credentials, "utf-8").toString(
        "base64"
      );

      const response = await fetch("https://api.fitbit.com/oauth2/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${encodedCredentials}`,
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: refreshToken, // Use the decrypted refresh token from DB
        }).toString(),
      });

      const newTokens = await response.json();

      if (!response.ok) {
        console.error(
          "Failed to refresh Fitbit token. Status:",
          response.status
        );
        console.error("Error response:", newTokens);

        // If refresh token is invalid, clear it from DB and prompt re-auth
        if (
          response.status === 400 &&
          newTokens.errors &&
          newTokens.errors.some((err: any) => err.errorType === "invalid_grant")
        ) {
          console.error(
            "Invalid refresh token detected. Clearing Fitbit tokens for client:",
            clientId
          );
          // Clear Fitbit tokens from the client's settings
          const updatedFitbitProperties =
            fitbitConfig?.properties.filter(
              (p) =>
                p.name !== "accessToken" &&
                p.name !== "refreshToken" &&
                p.name !== "expiresAt"
            ) || [];

          const updatedFitbitConfig = {
            ...fitbitConfig,
            properties: updatedFitbitProperties,
          };

          const newSettings = fitbitClientSettings.map((s) =>
            s.id === fitbitConfig!.id ? updatedFitbitConfig : s
          );

          await prisma.client.update({
            where: { id: clientId },
            data: { settings: newSettings as any },
          });
          // Return an empty array, the UI will show "Fitbit not connected"
          return {
            success: false,
            message: "Fitbit connection requires re-authorization.",
            code: "FITBIT_REAUTH_REQUIRED",
          };
        }
        return {
          success: false,
          message: "Failed to refresh Fitbit token.",
          code: "FITBIT_REFRESH_FAILED",
        }; // For other refresh failures
      }

      if (!newTokens.access_token || !newTokens.expires_in) {
        console.error(
          "Failed to refresh Fitbit token: missing access_token or expires_in.",
          newTokens
        );
        return {
          success: false,
          message: "Fitbit token refresh response incomplete.",
          code: "FITBIT_REFRESH_INCOMPLETE",
        };
      }

      // Update accessToken and expiresAt. Only update refreshToken if a new one is provided.
      accessToken = newTokens.access_token;
      expiresAt = new Date(
        Date.now() + newTokens.expires_in * 1000
      ).toISOString();

      // Use the new refresh token if provided, otherwise keep the old one (though Fitbit usually rotates)
      const newRefreshToken = newTokens.refresh_token || refreshToken;

      const updatedFitbitProperties =
        fitbitConfig?.properties.map((prop) => {
          if (prop.name === "accessToken")
            return { ...prop, value: encrypt(accessToken as string) };
          if (prop.name === "refreshToken")
            return { ...prop, value: encrypt(newRefreshToken as string) }; // Store the new refresh token
          if (prop.name === "expiresAt")
            return { ...prop, value: expiresAt as string };
          return prop;
        }) || [];

      const updatedFitbitConfig = {
        ...fitbitConfig,
        properties: updatedFitbitProperties,
      };

      const newSettings = fitbitClientSettings.map((s) =>
        s.id === fitbitConfig!.id ? updatedFitbitConfig : s
      );

      await prisma.client.update({
        where: { id: clientId },
        data: { settings: newSettings as any },
      });

      // Update the local refreshToken variable for subsequent use in this function call
      refreshToken = newRefreshToken;
    } catch (error) {
      console.error(
        "Error refreshing Fitbit token for client:" + clientId,
        error
      );
      return {
        success: false,
        message: "Error refreshing Fitbit token.",
        code: "FITBIT_REFRESH_ERROR",
      };
    }
  }

  const fitbitClient = new Api({
    securityWorker: (token) => {
      return { headers: { Authorization: `Bearer ${accessToken}` } };
    },
  });

  const activities: { date: string; summary: any }[] = [];
  const activityTypeSummaries: { [key: string]: any } = {}; // Change to activityTypeSummaries

  // Fetch all activity log entries for the last 7 days using direct request with userId
  let activityLogListResponseList: any[] = [];
  try {
    let currentDate = new Date(startDate.getTime());

    while (currentDate.getTime() <= endDate.getTime()) {
      const formmatedDate = format(currentDate, "yyyy-MM-dd");

      const path = `/1/user/~/activities/date/${formmatedDate}.json`;
      console.log("Fetching Fitbit activities from path:", path);

      // const activityLogListResponse = await fitbitClient.request({
      //   path: `/1/user/${fitbitUserId}/activities/${formmatedDate}.json`,
      //   method: "GET",
      //   secure: true,
      //   format: "json", // Explicitly set format to json
      // });

      const activityLogListResponse = await fitbitClient.v1.getActivitiesByDate(
        formmatedDate
      );

      console.log(JSON.stringify(activityLogListResponse, null, 2));

      if (activityLogListResponse.data) {
        activityLogListResponseList.push(
          ...activityLogListResponse.data.activities
        );
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }
  } catch (error) {
    console.error("Error fetching Fitbit activity log list:");
    console.error(JSON.stringify(error, null, 2));
    return {
      success: false,
      message: "Error fetching Fitbit activities.",
      code: "FITBIT_API_ERROR",
    };
  }

  return {
    success: true,
    data: activityLogListResponseList || [],
  };
}

export async function fetchRawFitbitData(
  clientId: string,
  startDate: Date,
  endDate: Date
): Promise<ActionResult<any[]>> {
  startDate = startOfDay(startDate);
  endDate = endOfDay(endDate);
  console.log(`Fetching activities for clientId: ${clientId}`);
  console.log(`Start ${startDate}`);
  console.log(`End   ${endDate}`);

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { settings: true },
  });

  if (!client || !client.settings) {
    console.error("Client or client settings not found.");
    return {
      success: false,
      message: "Client or client settings not found.",
      code: "CLIENT_NOT_FOUND",
    };
  }

  if (typeof client.settings !== "object" || client.settings === null) {
    console.error("Client settings are not a valid object.");
    return {
      success: false,
      message: "Client settings are not a valid object.",
      code: "INVALID_CLIENT_SETTINGS",
    };
  }

  const fitbitClientSettings = client.settings as FitbitClientSetting[];

  if (!fitbitClientSettings || fitbitClientSettings.length === 0) {
    console.error(
      "Fitbit settings not found or is empty for client:" + clientId
    );
    return {
      success: false,
      message: "Fitbit is not connected for this client.",
      code: "FITBIT_NOT_CONNECTED",
    };
  }

  let accessToken: string | undefined;
  let refreshToken: string | undefined;
  let expiresAt: string | undefined;
  let scopes: string | undefined;
  let fitbitUserId: string | undefined; // Add fitbitUserId variable

  const fitbitConfig = fitbitClientSettings.find(
    (setting) => setting.type === "Fitbit"
  );

  if (fitbitConfig) {
    accessToken = fitbitConfig.properties.find(
      (p) => p.name === "accessToken"
    )?.value;
    refreshToken = fitbitConfig.properties.find(
      (p) => p.name === "refreshToken"
    )?.value;
    expiresAt = fitbitConfig.properties.find(
      (p) => p.name === "expiresAt"
    )?.value;
    scopes = fitbitConfig.properties.find((p) => p.name === "scopes")?.value;
    fitbitUserId = fitbitConfig.properties.find(
      (p) => p.name === "userId"
    )?.value; // Retrieve Fitbit userId
  }

  if (!accessToken || !refreshToken || !expiresAt || !fitbitUserId) {
    console.error(
      "Missing Fitbit tokens, expiry information, or userId for client:" +
        clientId
    );
    return {
      success: false,
      message: "Missing Fitbit connection details. Please re-connect Fitbit.",
      code: "MISSING_FITBIT_DETAILS",
    };
  }

  accessToken = decrypt(accessToken);
  refreshToken = decrypt(refreshToken);
  const isTokenExpired = new Date() > new Date(expiresAt);

  if (isTokenExpired) {
    console.log("Fitbit access token expired, attempting to refresh...");
    try {
      const clientIdEnv = process.env.FITBIT_CLIENT_ID;
      const clientSecretEnv = process.env.FITBIT_CLIENT_SECRET;

      if (!clientIdEnv || !clientSecretEnv) {
        return {
          success: false,
          message: "Fitbit client environment variables not defined.",
          code: "MISSING_ENV_VARS",
        };
      }

      const credentials = `${clientIdEnv}:${clientSecretEnv}`;
      const encodedCredentials = Buffer.from(credentials, "utf-8").toString(
        "base64"
      );

      const response = await fetch("https://api.fitbit.com/oauth2/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${encodedCredentials}`,
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: refreshToken, // Use the decrypted refresh token from DB
        }).toString(),
      });

      const newTokens = await response.json();

      if (!response.ok) {
        console.error(
          "Failed to refresh Fitbit token. Status:",
          response.status
        );
        console.error("Error response:", newTokens);

        // If refresh token is invalid, clear it from DB and prompt re-auth
        if (
          response.status === 400 &&
          newTokens.errors &&
          newTokens.errors.some((err: any) => err.errorType === "invalid_grant")
        ) {
          console.error(
            "Invalid refresh token detected. Clearing Fitbit tokens for client:",
            clientId
          );
          // Clear Fitbit tokens from the client's settings
          const updatedFitbitProperties =
            fitbitConfig?.properties.filter(
              (p) =>
                p.name !== "accessToken" &&
                p.name !== "refreshToken" &&
                p.name !== "expiresAt"
            ) || [];

          const updatedFitbitConfig = {
            ...fitbitConfig,
            properties: updatedFitbitProperties,
          };

          const newSettings = fitbitClientSettings.map((s) =>
            s.id === fitbitConfig!.id ? updatedFitbitConfig : s
          );

          await prisma.client.update({
            where: { id: clientId },
            data: { settings: newSettings as any },
          });
          // Return an empty array, the UI will show "Fitbit not connected"
          return {
            success: false,
            message: "Fitbit connection requires re-authorization.",
            code: "FITBIT_REAUTH_REQUIRED",
          };
        }
        return {
          success: false,
          message: "Failed to refresh Fitbit token.",
          code: "FITBIT_REFRESH_FAILED",
        }; // For other refresh failures
      }

      if (!newTokens.access_token || !newTokens.expires_in) {
        console.error(
          "Failed to refresh Fitbit token: missing access_token or expires_in.",
          newTokens
        );
        return {
          success: false,
          message: "Fitbit token refresh response incomplete.",
          code: "FITBIT_REFRESH_INCOMPLETE",
        };
      }

      // Update accessToken and expiresAt. Only update refreshToken if a new one is provided.
      accessToken = newTokens.access_token;
      expiresAt = new Date(
        Date.now() + newTokens.expires_in * 1000
      ).toISOString();

      // Use the new refresh token if provided, otherwise keep the old one (though Fitbit usually rotates)
      const newRefreshToken = newTokens.refresh_token || refreshToken;

      const updatedFitbitProperties =
        fitbitConfig?.properties.map((prop) => {
          if (prop.name === "accessToken")
            return { ...prop, value: encrypt(accessToken as string) };
          if (prop.name === "refreshToken")
            return { ...prop, value: encrypt(newRefreshToken as string) }; // Store the new refresh token
          if (prop.name === "expiresAt")
            return { ...prop, value: expiresAt as string };
          return prop;
        }) || [];

      const updatedFitbitConfig = {
        ...fitbitConfig,
        properties: updatedFitbitProperties,
      };

      const newSettings = fitbitClientSettings.map((s) =>
        s.id === fitbitConfig!.id ? updatedFitbitConfig : s
      );

      await prisma.client.update({
        where: { id: clientId },
        data: { settings: newSettings as any },
      });

      // Update the local refreshToken variable for subsequent use in this function call
      refreshToken = newRefreshToken;
    } catch (error) {
      console.error(
        "Error refreshing Fitbit token for client:" + clientId,
        error
      );
      return {
        success: false,
        message: "Error refreshing Fitbit token.",
        code: "FITBIT_REFRESH_ERROR",
      };
    }
  }

  const fitbitClient = new Api({
    securityWorker: (token) => {
      return { headers: { Authorization: `Bearer ${accessToken}` } };
    },
  });

  const activities: { date: string; summary: any }[] = [];
  const activityTypeSummaries: { [key: string]: any } = {}; // Change to activityTypeSummaries

  // Fetch all activity log entries for the last 7 days using direct request with userId
  let activityLogListResponse;
  try {
    activityLogListResponse = await fitbitClient.request({
      path: `/1/user/${fitbitUserId}/activities/list.json`,
      method: "GET",
      query: {
        afterDate: format(startDate, "yyyy-MM-dd"),
        sort: "desc",
        offset: 0,
        limit: 100,
      },
      secure: true,
      format: "json", // Explicitly set format to json
    });
  } catch (error) {
    console.error("Error fetching Fitbit activity log list:", error);
    return {
      success: false,
      message: "Error fetching Fitbit activities.",
      code: "FITBIT_API_ERROR",
    };
  }

  if (!activityLogListResponse.data) {
    console.error("No data received from Fitbit activity log list API.");
    return {
      success: false,
      message: "No data received from Fitbit activities.",
      code: "FITBIT_API_NO_DATA",
    };
  }

  return {
    success: true,
    data: activityLogListResponse.data.activities || [],
  };
}

export async function saveFitbitRawData(
  clientId: string,
  startDate: string,
  endDate: string,
  rawData: any[]
): Promise<ActionResult<any>> {
  try {
    await createClientNote(
      clientId,
      ClientNoteType.FitnessTrackerEntry,
      {
        type: "fitbit",
        startDate: startDate,
        endDate: endDate,
      },
      {
        data: rawData,
      }
    );
    return {
      success: true,
      data: null,
      message: "Fitbit raw data saved successfully.",
    };
  } catch (error) {
    console.error("Error saving Fitbit raw data:", error);
    return {
      success: false,
      message: "Failed to save Fitbit raw data.",
      code: "SAVE_ERROR",
    };
  }
}
