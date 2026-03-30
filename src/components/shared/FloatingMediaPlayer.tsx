import { useRef, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, X, Music, Youtube } from "lucide-react";
import { useMediaPlayer } from "@/context/MediaPlayerContext";

const KIRTAN_PATH = "/dashboard/kirtan";

/* ── Helpers ── */
function extractYouTubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return u.pathname.slice(1).split("?")[0];
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return v;
      const m = u.pathname.match(/\/(embed|shorts)\/([^/?]+)/);
      if (m) return m[2];
    }
  } catch { /* ignore */ }
  return null;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/* ── Component ──
  The card is always rendered when currentTrack is set.
  On the Kirtan page we use visibility:hidden so the iframe stays in the DOM
  (display:none would pause the video; visibility:hidden keeps it playing).
*/
export function FloatingMediaPlayer() {
  const location = useLocation();
  const {
    currentTrack, isPlaying, progress, isMuted,
    togglePlay, nextTrack, prevTrack, seekTo, toggleMute, stopPlayer,
  } = useMediaPlayer();

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const loadedYtIdRef = useRef<string | null>(null);

  const isOnKirtanPage = location.pathname === KIRTAN_PATH;
  const ytId = extractYouTubeId(currentTrack?.youtube_url ?? null);
  const isYouTube = !!ytId && !currentTrack?.audio_url;

  const sendYtCommand = useCallback((func: "playVideo" | "pauseVideo") => {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: "command", func }), "*"
    );
  }, []);

  // Load new YouTube video when ytId changes
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    if (ytId && ytId !== loadedYtIdRef.current) {
      loadedYtIdRef.current = ytId;
      iframe.src = `https://www.youtube.com/embed/${ytId}?enablejsapi=1&autoplay=1&rel=0&modestbranding=1`;
    } else if (!ytId && loadedYtIdRef.current) {
      loadedYtIdRef.current = null;
      iframe.src = "about:blank";
    }
  }, [ytId]);

  // Sync play/pause state to iframe
  useEffect(() => {
    if (!isYouTube) return;
    const t = setTimeout(() => sendYtCommand(isPlaying ? "playVideo" : "pauseVideo"), 400);
    return () => clearTimeout(t);
  }, [isPlaying, isYouTube, sendYtCommand]);

  if (!currentTrack) return null;

  const elapsed = (progress / 100) * (currentTrack.durationSeconds ?? 0);

  return (
    /*
      Always rendered when currentTrack is set.
      On the Kirtan page we slide the card off-screen to the RIGHT using transform.
      This keeps the iframe in the document, fully painted (not visibility:hidden),
      so the browser does NOT suspend YouTube playback. When the user navigates
      to any other route, the transform is removed and the card slides back into view.
      display:none / visibility:hidden would pause the YouTube iframe.
    */
    <div
      className="fixed bottom-4 right-4 z-50 w-72 surface rounded-xl border border-border shadow-elevated overflow-hidden"
      style={{
        transform: isOnKirtanPage ? "translateX(calc(100% + 2rem))" : "translateX(0)",
        transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
        pointerEvents: isOnKirtanPage ? "none" : undefined,
      }}
    >
      {/* YouTube video preview inside the card */}
      {isYouTube && (
        <div className="relative w-full" style={{ paddingBottom: "42%" }}>
          <iframe
            ref={iframeRef}
            src="about:blank"
            title="YouTube Player"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
            style={{ border: "none" }}
          />
        </div>
      )}

      <div className="p-3">
        {/* Track info */}
        <div className="flex items-center gap-2.5 mb-2.5">
          <div className="w-8 h-8 rounded-md bg-accent/10 flex items-center justify-center shrink-0">
            {isYouTube
              ? <Youtube className="w-4 h-4 text-red-500" />
              : <Music className="w-4 h-4 text-accent" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-foreground truncate leading-tight">
              {currentTrack.title}
            </p>
            <p className="text-[11px] text-muted-foreground truncate">{currentTrack.artist}</p>
          </div>
          <button
            onClick={stopPlayer}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
            aria-label="Close player"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Progress */}
        <div className="mb-2">
          <input
            type="range" min={0} max={100} step={0.1} value={progress}
            onChange={(e) => seekTo(Number(e.target.value))}
            className="w-full h-1 rounded-full appearance-none cursor-pointer bg-border accent-accent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent"
            aria-label="Seek"
          />
          <div className="flex justify-between mt-0.5">
            <span className="text-[10px] text-muted-foreground">{formatTime(elapsed)}</span>
            <span className="text-[10px] text-muted-foreground">{currentTrack.duration}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <button onClick={toggleMute} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground transition-colors" aria-label={isMuted ? "Unmute" : "Mute"}>
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          <div className="flex items-center gap-1.5">
            <button onClick={prevTrack} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground transition-colors" aria-label="Previous">
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              onClick={togglePlay}
              className="w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center hover:bg-accent-glow transition-colors"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
            </button>
            <button onClick={nextTrack} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground transition-colors" aria-label="Next">
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          <div className="w-7" />
        </div>
      </div>
    </div>
  );
}
