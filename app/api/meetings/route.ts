import { NextResponse } from "next/server";
import { google } from "googleapis";
import type { calendar_v3 } from "googleapis";

export const runtime = "nodejs"; // ensure Node runtime, not Edge

const SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"];

type ServiceAccountCredentials = {
  client_email: string;
  private_key: string;
};

function getServiceAccountCredentials(): ServiceAccountCredentials {
  const base64 = process.env.GOOGLE_SERVICE_ACCOUNT_BASE64;
  if (!base64) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_BASE64 env var is missing");
  }

  const jsonStr = Buffer.from(base64, "base64").toString("utf-8");
  const parsed = JSON.parse(jsonStr);

  if (!parsed.client_email || !parsed.private_key) {
    throw new Error("Service account JSON missing client_email or private_key");
  }

  return {
    client_email: parsed.client_email,
    private_key: parsed.private_key,
  };
}

function getJwtClient() {
  const { client_email, private_key } = getServiceAccountCredentials();

  // If Google adds escaped \n inside the JSON, normalize just in case
  const key = private_key.replace(/\\n/g, "\n");

  return new google.auth.JWT({
    email: client_email,
    key,
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
    const calendar = google.calendar({ version: "v3", auth }) as calendar_v3.Calendar;

    const now = new Date();
    const timeMin = now.toISOString();

    // Next 24 hours — adjust if you want a wider range
    const timeMaxDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const timeMax = timeMaxDate.toISOString();

    const params = {
      calendarId,
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: "startTime",
      // Some googleapis TS defs don't include this even though the API supports it
      conferenceDataVersion: 1,
    } as any as calendar_v3.Params$Resource$Events$List;

    const res = (await calendar.events.list(
      params
    )) as unknown as { data: calendar_v3.Schema$Events };

    const events = (res.data.items ?? []) as calendar_v3.Schema$Event[];

    const ZOOM_REGEX =
      /https?:\/\/([a-z0-9-]+\.)?zoom\.us\/(j\/\d+|my\/[A-Za-z0-9._-]+)(\?[^ \n\r\t]*)?/i;

    const extractZoomLink = (text: string) => {
      if (!text) return "";
      const match = text.match(ZOOM_REGEX);
      return match ? match[0] : "";
    };

    const meetings = events
      .filter((event) => !!event.start)
      .map((event) => {
        const start = event.start?.dateTime || event.start?.date || "";
        const end = event.end?.dateTime || event.end?.date || "";

        const combinedText = [event.summary, event.location, event.description]
          .filter(Boolean)
          .join("\n");

        const zoomLink = extractZoomLink(combinedText);

        const meetLink =
          (event.conferenceData?.entryPoints || []).find((e) => e.uri)?.uri ||
          event.hangoutLink ||
          zoomLink ||
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

    const todayStr = new Date().toDateString();
    const filteredMeetings = meetings.filter((m) => {
      const d = new Date(m.start);
      return (
        !isNaN(d.getTime()) &&
        d.toDateString() === todayStr &&
        m.title !== "Boardroom Gmeet"
      );
    });

    return NextResponse.json({ meetings: filteredMeetings });
  } catch (error: any) {
    console.error("Error fetching calendar events:", error);
    return NextResponse.json(
      { error: "Failed to fetch meetings" },
      { status: 500 }
    );
  }
}