import { NextResponse } from "next/server";
import { google } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"];

function getJwtClient() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!clientEmail || !privateKey) {
    throw new Error("Missing GOOGLE_CLIENT_EMAIL or GOOGLE_PRIVATE_KEY env vars");
  }

  // Handle both single-line and multi-line keys
  const parsedKey = privateKey.replace(/\\n/g, "\n");

  return new google.auth.JWT({
    email: clientEmail,
    key: parsedKey,
    scopes: SCOPES,
  });
}

export async function GET() {
  try {
    const calendarId = process.env.GOOGLE_CALENDAR_ID;

    if (!calendarId) {
      return NextResponse.json(
        { error: "GOOGLE_CALENDAR_ID not configured" },
        { status: 500 }
      );
    }

    const auth = getJwtClient();
    const calendar = google.calendar({ version: "v3", auth });

    const now = new Date();
    const timeMin = now.toISOString();

    // Example: next 24 hours
    const timeMaxDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const timeMax = timeMaxDate.toISOString();

    const res = await calendar.events.list({
      calendarId,
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: "startTime",
    });

    const events = res.data.items || [];

    const meetings = events
      .filter((event) => !!event.start)
      .map((event) => {
        const start = event.start?.dateTime || event.start?.date || "";
        const end = event.end?.dateTime || event.end?.date || "";

        // Prefer the hangout/meet link; fall back to htmlLink if needed
        const meetLink =
          (event.conferenceData?.entryPoints || [])
            .find((e) => e.uri)?.uri ||
          event.hangoutLink ||
          event.htmlLink ||
          "";

        return {
          id: event.id,
          title: event.summary || "Untitled meeting",
          start,
          end,
          link: meetLink,
          location: event.location || "",
        };
      });

    return NextResponse.json({ meetings });
  } catch (error: any) {
    console.error("Error fetching calendar events:", error);
    return NextResponse.json(
      { error: "Failed to fetch meetings" },
      { status: 500 }
    );
  }
}