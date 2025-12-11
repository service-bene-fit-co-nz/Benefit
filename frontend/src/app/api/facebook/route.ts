// --- IMPORTS ---
import { NextResponse, NextRequest } from "next/server";

// --- CONFIGURATION ---
// Disables Next.js automatic body parsing, required for webhooks to read raw data
export const dynamic = "force-dynamic";
export const config = {
  api: {
    bodyParser: false,
  },
};

// --- TYPE DEFINITIONS ---
interface MessagingEvent {
  sender: { id: string };
  recipient: { id: string };
  timestamp: number;
  message?: {
    mid: string;
    text?: string;
    attachments?: {
      type: string;
      payload: {
        url: string;
        is_reusable?: boolean;
      };
    }[];
  };
}

interface WebhookPayload {
  object: string;
  entry: {
    id: string;
    time: number;
    messaging: MessagingEvent[];
  }[];
}

// --- ASYNCHRONOUS HANDLERS ---
function handleIncomingMessage(event: MessagingEvent) {
  const senderId = event.sender.id;
  const attachments = event.message?.attachments;

  if (attachments) {
    for (const attachment of attachments) {
      if (attachment.type === "audio") {
        const audioUrl = attachment.payload.url;
        console.log(`[AUDIO RECEIVED] Sender PSID: ${senderId}`);
        console.log(`[AUDIO URL] URL: ${audioUrl}`);

        // Start the long-running process asynchronously!
        startAudioProcessing(senderId, audioUrl);
        return;
      }
    }
  }

  if (event.message?.text) {
    console.log(
      `[TEXT MESSAGE] Sender: ${senderId}, Text: ${event.message.text}`
    );
  }
}

async function startAudioProcessing(senderId: string, audioUrl: string) {
  console.log(`--- Starting processing for sender ${senderId} ---`);
  // Your subsequent logic for download, transcribe, and reply will go here.
}

// --- 1. WEBHOOK VERIFICATION (GET) ---
export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get("hub.mode");
  const token = request.nextUrl.searchParams.get("hub.verify_token");
  const challenge = request.nextUrl.searchParams.get("hub.challenge");

  const MESSENGER_VERIFY_TOKEN = process.env.FACEBOOK_MESSENGER_VERIFY_TOKEN;

  if (mode && token && challenge) {
    if (mode === "subscribe" && token === MESSENGER_VERIFY_TOKEN) {
      console.log("WEBHOOK_VERIFIED");
      return new NextResponse(challenge, { status: 200 });
    } else {
      return new NextResponse("Invalid verification token", { status: 403 });
    }
  }

  return new NextResponse("Missing verification parameters", { status: 400 });
}

// --- 2. MESSAGE RECEIVING (POST) ---
export async function POST(request: NextRequest) {
  let payload: WebhookPayload;

  try {
    const rawBody = await request.text();

    console.log("--- RAW INCOMING POST BODY (First 500 chars) ---");
    console.log(rawBody.substring(0, 500) + "...");
    console.log("-----------------------------------------------");

    payload = JSON.parse(rawBody) as WebhookPayload;

    if (payload.object === "page") {
      for (const entry of payload.entry) {
        for (const event of entry.messaging) {
          console.log("--- RECEIVED MESSAGING EVENT ---");
          console.log(JSON.stringify(event, null, 2));
          console.log("-------------------------------");

          if (event.message) {
            handleIncomingMessage(event);
          }
        }
      }
    }
  } catch (error) {
    console.error("Failed to process incoming payload:", error);
  }

  // Always return a 200 OK immediately.
  return new NextResponse("EVENT_RECEIVED", { status: 200 });
}
