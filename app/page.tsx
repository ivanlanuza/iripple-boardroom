import { Button } from "@/components/ui/button";

const GMEET_URL = "https://meet.google.com/dxf-xuav-yim";
const ZOOM_URL =
  "https://us02web.zoom.us/j/84074848779?pwd=3i06P8qEiyesAnbq3b1Qh60TyKkqsp.1";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-slate-950 px-4">
      <h1 className="text-3xl md:text-4xl font-semibold mb-10 text-center text-slate-50">
        Welcome to iRipple Boardroom
      </h1>

      <div className="flex flex-col md:flex-row gap-4 w-full max-w-md">
        {/* GMeet */}
        <Button
          asChild
          className="flex-1 text-base py-6"
        >
          <a
            href={GMEET_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Use Boardroom Gmeet Link
          </a>
        </Button>

        {/* Zoom */}
        <Button
          asChild
          variant="outline"
          className="flex-1 text-base py-6 bg-slate-900/60 border-slate-700 text-slate-50 hover:bg-slate-800"
        >
          <a
            href={ZOOM_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Use Boardroom Zoom Link
          </a>
        </Button>
      </div>
    </main>
  );
}