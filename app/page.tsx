"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RefreshCcw } from "lucide-react";

const GMEET_URL = "https://meet.google.com/dxf-xuav-yim";
const ZOOM_URL =
  "https://us02web.zoom.us/j/84074848779?pwd=3i06P8qEiyesAnbq3b1Qh60TyKkqsp.1";

type Meeting = {
  id: string;
  title: string;
  start: string;
  end: string;
  link: string;
  location: string;
};

export default function Home() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverTime, setServerTime] = useState<string | null>(null);

  const handleJoin = (url: string) => {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/meetings");
      if (!res.ok) {
        throw new Error("Failed to fetch meetings");
      }

      const data = await res.json();
      setMeetings(data.meetings || []);
      setServerTime(
        new Date().toLocaleTimeString("en-PH", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    } catch (err: any) {
      console.error(err);
      setError("Could not load upcoming meetings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  const formatTimeRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);

    if (!start || !end || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return "";
    }

    const dateStr = startDate.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

    const startTimeStr = startDate.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });

    const endTimeStr = endDate.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });

    return `${dateStr} · ${startTimeStr} – ${endTimeStr}`;
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-slate-950 px-4">
      <h1 className="text-6xl md:text-6xl font-semibold mb-10 text-center text-slate-50">
        iRipple + MySuki Boardroom
      </h1>

      <h1 className="text-2xl md:text-2xl font-light mb-10 -mt-6 text-center text-slate-50">
        https://boardroom.iripple.com
      </h1>


      <div className="flex flex-col gap-4 w-1/3 mx-auto pt-16">
        {/* GMeet */}
        <Button
          asChild
          variant="outline"
          className="text-base py-8 bg-slate-900/60 border-slate-700 text-slate-50 hover:bg-slate-800 hover:text-slate-400"
        >
          <a href={GMEET_URL} target="_blank" rel="noopener noreferrer">
            Use Boardroom Gmeet Link
          </a>
        </Button>

        {/* Zoom */}
        <Button
          asChild
          variant="outline"
          className="text-base py-8 bg-slate-900/60 border-slate-700 text-slate-50 hover:bg-slate-800 hover:text-slate-400"
        >
          <a href={ZOOM_URL} target="_blank" rel="noopener noreferrer">
            Use Boardroom Zoom Link
          </a>
        </Button>

        {/* Own invite link with modal */}
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="link"
              className="text-base py-6  text-slate-50  hover:text-slate-400"
            >
              Use your own link
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-950 border-slate-800 text-slate-50">
            <DialogHeader>
              <DialogTitle>
                Add <span className="font-mono">iems@iripple.com</span> to your calendar invite.
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Your meeting will appear below once it&apos;s on the boardroom calendar.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-3">
              {loading && (
                <div className="text-sm text-slate-400">
                  Loading upcoming meetings...
                </div>
              )}

              {error && (
                <div className="text-sm text-red-400">
                  {error}
                </div>
              )}

              {!loading && !error && meetings.filter((m) => m.id != "4u6bvhn87ev59t47tcc5hs6ouc_20251205").length === 0 && (
                <div className="text-sm text-slate-400">
                  No upcoming meetings found in the next 24 hours.
                </div>
              )}

              {!loading &&
                !error &&
                meetings
                  .filter((m) => m.id != "4u6bvhn87ev59t47tcc5hs6ouc_20251205")
                  .map((meeting) => (
                  <div
                    key={meeting.id}
                    className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-100 px-4 py-3"
                  >
                    <div>
                      <div className="font-bold text-slate-900">
                        {meeting.title}
                      </div>
                      <div className="text-sm text-slate-600">
                        {formatTimeRange(meeting.start, meeting.end)}
                      </div>
                      {meeting.location && (
                        <div className="text-xs text-slate-500">
                          {meeting.location}
                        </div>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-slate-700 bg-slate-600 text-slate-50 hover:bg-slate-800 hover:text-slate-200"
                      disabled={!meeting.link}
                      onClick={() => handleJoin(meeting.link)}
                    >
                      {meeting.link ? "Join" : "View"}
                    </Button>
                  </div>
                ))}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                {/*Server time: {serverTime ?? "--:--:--"}*/}
              </span>
              <Button
                size="icon"
                variant="outline"
                className="border-slate-700 bg-slate-900 text-slate-50 hover:bg-slate-800 hover:text-slate-200"
                onClick={fetchMeetings}
                disabled={loading}
              >
                <RefreshCcw className="h-4 w-4" />
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  );
}