import { useState, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Music, Play, Pause, SkipForward, SkipBack, Volume2, VolumeX,
  Search, Plus, X, Clock, Heart, Shuffle, Repeat,
  ListMusic, User, Disc3, Link, ExternalLink, Upload, Loader2, Youtube,
} from "lucide-react";
import { GradientButton } from "@/components/ui/gradient-button";
import kirtanHero from "@/assets/kirtan-hero.jpg";
import {
  useKirtanTracksQuery,
  useCreateKirtanTrackMutation,
  useToggleFavoriteMutation,
  useDeleteKirtanTrackMutation,
  useUploadKirtanAudioMutation,
} from "@/lib/api/endpoints/kirtan";
import type { KirtanTrackResponse, CreateKirtanTrackRequest } from "@/types";
import { useMediaPlayer, type MediaTrack } from "@/context/MediaPlayerContext";

/* ── Types ── */
interface KirtanTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: string;
  durationSeconds: number;
  category: string;
  isFavorite: boolean;
  coverUrl: string | null;
  audio_url: string | null;
  external_link: string | null;
}

type CategoryFilter = "all" | "bhajan" | "aarti" | "kirtan" | "dhun" | "stuti" | "other";

/* ── Constants ── */
const CATEGORIES: { value: CategoryFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "bhajan", label: "Bhajan" },
  { value: "aarti", label: "Aarti" },
  { value: "kirtan", label: "Kirtan" },
  { value: "dhun", label: "Dhun" },
  { value: "stuti", label: "Stuti" },
];

/* ── Helpers ── */
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Extract YouTube video ID from various YouTube URL formats. Returns null if not YT. */
function extractYouTubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return u.pathname.slice(1).split("?")[0];
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return v;
      // Handle /embed/ID and /shorts/ID
      const m = u.pathname.match(/\/(embed|shorts)\/([^/?]+)/);
      if (m) return m[2];
    }
  } catch {
    /* ignore invalid URLs */
  }
  return null;
}

function mapApiTrack(t: KirtanTrackResponse): KirtanTrack {
  return {
    id: t.id,
    title: t.title,
    artist: t.artist ?? "",
    album: t.album ?? "",
    duration: t.duration_seconds ? formatTime(t.duration_seconds) : "0:00",
    durationSeconds: t.duration_seconds ?? 0,
    category: t.category,
    isFavorite: t.is_favorite,
    coverUrl: t.cover_url ?? null,
    audio_url: t.audio_url ?? null,
    external_link: t.external_link ?? null,
  };
}

/* ── Add Song Modal ── */
interface AddSongModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateKirtanTrackRequest) => void;
  isLoading?: boolean;
}

function AddSongModal({ open, onClose, onSubmit, isLoading }: AddSongModalProps) {
  const [form, setForm] = useState({
    title: "",
    artist: "",
    album: "",
    duration: "",
    category: "bhajan" as Exclude<CategoryFilter, "all">,
    audio_url: "",
    external_link: "",
  });

  const handleSubmit = () => {
    if (!form.title) return;
    const parts = form.duration.split(":").map(Number);
    const duration_seconds = parts.length === 2 ? parts[0] * 60 + (parts[1] || 0) : undefined;
    onSubmit({
      title: form.title,
      artist: form.artist || null,
      album: form.album || null,
      duration_seconds: duration_seconds || null,
      category: form.category as CreateKirtanTrackRequest["category"],
      audio_url: form.audio_url || null,
      external_link: form.external_link || null,
    });
    setForm({ title: "", artist: "", album: "", duration: "", category: "bhajan", audio_url: "", external_link: "" });
    onClose();
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="surface rounded border border-border p-6 w-full max-w-md shadow-elevated"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-heading text-foreground flex items-center gap-2">
              <Music className="w-4 h-4 text-accent" /> Add Song
            </h2>
            <button onClick={onClose} className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-small font-medium text-foreground mb-1 block">Title *</label>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Song title"
                className="w-full h-9 px-3 rounded border border-border bg-muted/40 text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
              />
            </div>
            <div>
              <label className="text-small font-medium text-foreground mb-1 block">Artist</label>
              <input
                value={form.artist}
                onChange={(e) => setForm((f) => ({ ...f, artist: e.target.value }))}
                placeholder="Artist name"
                className="w-full h-9 px-3 rounded border border-border bg-muted/40 text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
              />
            </div>
            <div>
              <label className="text-small font-medium text-foreground mb-1 block">Album</label>
              <input
                value={form.album}
                onChange={(e) => setForm((f) => ({ ...f, album: e.target.value }))}
                placeholder="Album name"
                className="w-full h-9 px-3 rounded border border-border bg-muted/40 text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-small font-medium text-foreground mb-1 block">Duration</label>
                <input
                  value={form.duration}
                  onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
                  placeholder="e.g. 5:30"
                  className="w-full h-9 px-3 rounded border border-border bg-muted/40 text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                />
              </div>
              <div>
                <label className="text-small font-medium text-foreground mb-1 block">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as Exclude<CategoryFilter, "all"> }))}
                  className="w-full h-9 px-3 rounded border border-border bg-muted/40 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                >
                  {CATEGORIES.filter((c) => c.value !== "all").map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-small font-medium text-foreground mb-1 block flex items-center gap-1.5">
                <Link className="w-3 h-3 text-accent" /> Audio URL <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <input
                value={form.audio_url}
                onChange={(e) => setForm((f) => ({ ...f, audio_url: e.target.value }))}
                placeholder="https://… direct audio link"
                className="w-full h-9 px-3 rounded border border-border bg-muted/40 text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
              />
            </div>
            <div>
              <label className="text-small font-medium text-foreground mb-1 block flex items-center gap-1.5">
                <ExternalLink className="w-3 h-3 text-accent" /> External Link <span className="text-muted-foreground font-normal">(YouTube / optional)</span>
              </label>
              <input
                value={form.external_link}
                onChange={(e) => setForm((f) => ({ ...f, external_link: e.target.value }))}
                placeholder="https://youtube.com/…"
                className="w-full h-9 px-3 rounded border border-border bg-muted/40 text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
              />
            </div>
          </div>

          <div className="flex gap-2 mt-5">
            <button onClick={onClose} className="flex-1 h-9 rounded border border-border text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              Cancel
            </button>
            <GradientButton onClick={handleSubmit} disabled={isLoading || !form.title} className="flex-1 h-9 text-[13px]">
              {isLoading ? "Adding…" : "Add Song"}
            </GradientButton>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ── Track Detail Panel ── */
interface TrackDetailProps {
  track: KirtanTrack;
  onClose: () => void;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
  onUploadAudio: (trackId: string, file: File) => void;
  isUploadingAudio: boolean;
}

function TrackDetailPanel({ track, onClose, onToggleFavorite, onDelete, onUploadAudio, isUploadingAudio }: TrackDetailProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="surface rounded border border-border p-5 space-y-4"
    >
      <div className="flex items-start justify-between">
        <h3 className="text-heading text-foreground">Track Details</h3>
        <button onClick={onClose} className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded bg-accent/10 flex items-center justify-center shrink-0">
          <Disc3 className="w-8 h-8 text-accent" />
        </div>
        <div className="min-w-0">
          <p className="text-body font-semibold text-foreground truncate">{track.title}</p>
          <p className="text-small text-muted-foreground">{track.artist || "—"}</p>
          <p className="text-small text-muted-foreground">{track.album || "—"}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded bg-muted/30 border border-border">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Duration</p>
          <p className="text-body font-medium text-foreground flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-accent" /> {track.duration}
          </p>
        </div>
        <div className="p-3 rounded bg-muted/30 border border-border">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Category</p>
          <p className="text-body font-medium text-foreground capitalize">{track.category}</p>
        </div>
      </div>

      {track.audio_url && (
        <div className="p-3 rounded bg-muted/30 border border-border">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Audio Preview</p>
          <audio controls src={track.audio_url} className="w-full h-8" />
        </div>
      )}

      <div className="p-3 rounded bg-muted/30 border border-border">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
          {track.audio_url ? "Replace Audio File" : "Upload Audio File"}
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUploadAudio(track.id, file);
            e.target.value = "";
          }}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploadingAudio}
          className="w-full h-8 rounded border border-border text-[12px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploadingAudio ? (
            <><Loader2 className="w-3 h-3 animate-spin" /> Uploading…</>
          ) : (
            <><Upload className="w-3 h-3" /> {track.audio_url ? "Replace File" : "Choose File"}</>
          )}
        </button>
      </div>

      {track.external_link && (() => {
        const ytId = extractYouTubeId(track.external_link);
        if (ytId) {
          return (
            <div className="rounded overflow-hidden border border-border">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground px-3 pt-3 mb-2">YouTube</p>
              <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src={`https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1`}
                  title={track.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
            </div>
          );
        }
        return (
          <a
            href={track.external_link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 p-3 rounded bg-accent/5 border border-accent/20 text-accent text-[13px] font-medium hover:bg-accent/10 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{track.external_link}</span>
          </a>
        );
      })()}

      <button
        onClick={() => onToggleFavorite(track.id)}
        className={`w-full h-9 rounded border text-[13px] font-medium flex items-center justify-center gap-2 transition-colors ${
          track.isFavorite
            ? "border-red-500/30 bg-red-500/5 text-red-500 hover:bg-red-500/10"
            : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
        }`}
      >
        <Heart className={`w-3.5 h-3.5 ${track.isFavorite ? "fill-current" : ""}`} />
        {track.isFavorite ? "Remove from Favorites" : "Add to Favorites"}
      </button>

      <button
        onClick={() => onDelete(track.id)}
        className="w-full h-9 rounded border border-destructive/30 bg-destructive/5 text-destructive text-[13px] font-medium flex items-center justify-center gap-2 hover:bg-destructive/10 transition-colors"
      >
        <X className="w-3.5 h-3.5" /> Delete Track
      </button>
    </motion.div>
  );
}

/* ── Mini Player ── */
interface MiniPlayerProps {
  track: KirtanTrack | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  progress: number;
  onSeek: (value: number) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  isShuffled: boolean;
  onToggleShuffle: () => void;
  repeatMode: "off" | "all" | "one";
  onToggleRepeat: () => void;
}

function MiniPlayer({
  track,
  isPlaying,
  onTogglePlay,
  onNext,
  onPrev,
  progress,
  onSeek,
  isMuted,
  onToggleMute,
  isShuffled,
  onToggleShuffle,
  repeatMode,
  onToggleRepeat,
}: MiniPlayerProps) {
  if (!track) return null;

  const elapsed = (progress / 100) * track.durationSeconds;

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="surface rounded border border-border p-4"
    >
      {/* Track info */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded bg-accent/10 flex items-center justify-center shrink-0">
          <Music className="w-4 h-4 text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-body font-medium text-foreground truncate">{track.title}</p>
          <p className="text-small text-muted-foreground truncate">{track.artist}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <input
          type="range"
          min={0}
          max={100}
          value={progress}
          onChange={(e) => onSeek(Number(e.target.value))}
          className="w-full h-1 rounded-full appearance-none cursor-pointer bg-border accent-accent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent"
        />
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-muted-foreground">{formatTime(elapsed)}</span>
          <span className="text-[10px] text-muted-foreground">{track.duration}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <button
          onClick={onToggleShuffle}
          className={`p-1.5 rounded transition-colors ${isShuffled ? "text-accent" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Shuffle className="w-3.5 h-3.5" />
        </button>

        <div className="flex items-center gap-2">
          <button onClick={onPrev} className="p-2 rounded text-muted-foreground hover:text-foreground transition-colors">
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            onClick={onTogglePlay}
            className="w-10 h-10 rounded-full bg-accent text-accent-foreground flex items-center justify-center hover:bg-accent-glow transition-colors"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>
          <button onClick={onNext} className="p-2 rounded text-muted-foreground hover:text-foreground transition-colors">
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onToggleRepeat}
            className={`p-1.5 rounded transition-colors relative ${repeatMode !== "off" ? "text-accent" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Repeat className="w-3.5 h-3.5" />
            {repeatMode === "one" && (
              <span className="absolute -top-0.5 -right-0.5 text-[8px] font-bold text-accent">1</span>
            )}
          </button>
          <button onClick={onToggleMute} className="p-1.5 rounded text-muted-foreground hover:text-foreground transition-colors">
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function toMediaTrack(t: KirtanTrack): MediaTrack {
  return {
    id: t.id,
    title: t.title,
    artist: t.artist,
    audio_url: t.audio_url,
    youtube_url: t.external_link,
    duration: t.duration,
    durationSeconds: t.durationSeconds,
  };
}

/* ── Main Page ── */
export default function KirtanLibraryPage() {
  /* API */
  const { data: tracksData, isLoading } = useKirtanTracksQuery();
  const createTrack = useCreateKirtanTrackMutation();
  const toggleFavorite = useToggleFavoriteMutation();
  const deleteTrack = useDeleteKirtanTrackMutation();
  const uploadAudioMutation = useUploadKirtanAudioMutation();

  /* Derive local tracks from API data */
  const tracks: KirtanTrack[] = useMemo(
    () => (tracksData?.data ?? []).map(mapApiTrack),
    [tracksData]
  );

  /* State */
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);

  /* Player state — delegate to MediaPlayerContext */
  const {
    currentTrack: ctxTrack,
    isPlaying,
    progress,
    isMuted,
    playTrack,
    togglePlay: handleTogglePlay,
    seekTo,
    toggleMute,
  } = useMediaPlayer();

  /* Local-only player extras: shuffle, repeat */
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<"off" | "all" | "one">("off");

  // Map context track back to local KirtanTrack for MiniPlayer display
  const currentTrack = useMemo(
    () => (ctxTrack ? tracks.find((t) => t.id === ctxTrack.id) ?? null : null),
    [tracks, ctxTrack]
  );

  const currentTrackId = ctxTrack?.id ?? null;
  const selectedTrack = useMemo(
    () => tracks.find((t) => t.id === selectedTrackId) ?? null,
    [tracks, selectedTrackId]
  );

  const filteredTracks = useMemo(() => {
    let result = tracks;
    if (activeCategory !== "all") {
      result = result.filter((t) => t.category === activeCategory);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.artist.toLowerCase().includes(q) ||
          t.album.toLowerCase().includes(q)
      );
    }
    return result;
  }, [tracks, activeCategory, searchQuery]);

  const totalDuration = useMemo(
    () => formatTime(tracks.reduce((s, t) => s + t.durationSeconds, 0)),
    [tracks]
  );

  const favoriteCount = useMemo(
    () => tracks.filter((t) => t.isFavorite).length,
    [tracks]
  );

  /* Player handlers */
  const handlePlayTrack = useCallback(
    (trackId: string) => {
      const track = tracks.find((t) => t.id === trackId);
      if (!track) return;
      if (ctxTrack?.id === trackId) {
        handleTogglePlay();
      } else {
        playTrack(toMediaTrack(track), filteredTracks.map(toMediaTrack));
      }
    },
    [tracks, filteredTracks, ctxTrack, playTrack, handleTogglePlay]
  );

  const handleNext = useCallback(() => {
    if (!currentTrackId) return;
    const idx = filteredTracks.findIndex((t) => t.id === currentTrackId);
    const nextIdx = isShuffled
      ? Math.floor(Math.random() * filteredTracks.length)
      : (idx + 1) % filteredTracks.length;
    const next = filteredTracks[nextIdx];
    if (next) playTrack(toMediaTrack(next), filteredTracks.map(toMediaTrack));
  }, [currentTrackId, filteredTracks, isShuffled, playTrack]);

  const handlePrev = useCallback(() => {
    if (!currentTrackId) return;
    const idx = filteredTracks.findIndex((t) => t.id === currentTrackId);
    const prevIdx = idx <= 0 ? filteredTracks.length - 1 : idx - 1;
    const prev = filteredTracks[prevIdx];
    if (prev) playTrack(toMediaTrack(prev), filteredTracks.map(toMediaTrack));
  }, [currentTrackId, filteredTracks, playTrack]);

  const handleSeek = useCallback((value: number) => { seekTo(value); }, [seekTo]);

  const handleToggleRepeat = useCallback(() => {
    setRepeatMode((prev) => {
      if (prev === "off") return "all";
      if (prev === "all") return "one";
      return "off";
    });
  }, []);

  const handleToggleFavorite = useCallback((id: string) => {
    toggleFavorite.mutate(id);
  }, [toggleFavorite]);

  const handleDeleteTrack = useCallback((id: string) => {
    deleteTrack.mutate(id);
    setSelectedTrackId(null);
  }, [deleteTrack]);

  const handleAddTrack = useCallback(
    (data: CreateKirtanTrackRequest) => {
      createTrack.mutate(data);
    },
    [createTrack]
  );

  const handleUploadAudio = useCallback(
    (trackId: string, file: File) => {
      uploadAudioMutation.mutate({ trackId, file });
    },
    [uploadAudioMutation]
  );

  return (
    <div className="space-y-5">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative rounded overflow-hidden h-36"
      >
        <img src={kirtanHero} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/60 via-foreground/30 to-transparent" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 h-full px-6 pb-5">
          <div className="mt-auto">
            <h1 className="text-[1.35rem] font-display font-bold text-white flex items-center gap-2">
              <ListMusic className="w-5 h-5" /> Kirtan Library
            </h1>
            <p className="text-[13px] text-white/70 mt-1">Your collection of devotional music and chants</p>
          </div>
          <GradientButton onClick={() => setAddModalOpen(true)} className="h-9 text-[13px] shrink-0">
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Song
          </GradientButton>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Tracks", value: tracks.length.toString(), icon: Music, color: "text-accent", bg: "bg-accent/10" },
          { label: "Total Duration", value: totalDuration, icon: Clock, color: "text-success", bg: "bg-success/10" },
          { label: "Favorites", value: favoriteCount.toString(), icon: Heart, color: "text-red-500", bg: "bg-red-500/10" },
          { label: "Categories", value: new Set(tracks.map((t) => t.category)).size.toString(), icon: Disc3, color: "text-warning", bg: "bg-warning/10" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="surface rounded border border-border p-4"
          >
            <div className={`w-8 h-8 rounded ${stat.bg} flex items-center justify-center mb-3`}>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <p className="text-display text-foreground">{stat.value}</p>
            <p className="text-small text-muted-foreground mt-0.5">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search songs, artists, albums..."
            className="w-full h-9 pl-9 pr-3 rounded border border-border bg-muted/40 text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={`px-3 py-1.5 rounded text-[12px] font-medium whitespace-nowrap transition-colors ${
                activeCategory === cat.value
                  ? "bg-accent text-accent-foreground"
                  : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Track List */}
        <div className={`${selectedTrackId ? "lg:col-span-2" : "lg:col-span-3"}`}>
          <div className="surface rounded border border-border overflow-hidden">
            {/* List header */}
            <div className="px-4 py-3 border-b border-border flex items-center gap-3 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
              <span className="w-8 text-center">#</span>
              <span className="flex-1">Title</span>
              <span className="hidden sm:block w-32">Album</span>
              <span className="hidden sm:block w-20">Category</span>
              <span className="w-12 text-right">
                <Clock className="w-3 h-3 inline" />
              </span>
              <span className="w-8" />
            </div>

            {/* Tracks */}
            <div className="divide-y divide-border">
              {isLoading ? (
                <div className="px-4 py-12 text-center">
                  <Music className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3 animate-pulse" />
                  <p className="text-body text-muted-foreground">Loading tracks…</p>
                </div>
              ) : filteredTracks.length === 0 ? (
                <div className="px-4 py-12 text-center">
                  <Music className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-body text-muted-foreground">No tracks found</p>
                  <p className="text-small text-muted-foreground/60 mt-1">Try adjusting your search or filters</p>
                </div>
              ) : (
                filteredTracks.map((track, i) => {
                  const isCurrentlyPlaying = currentTrackId === track.id && isPlaying;
                  const isSelected = selectedTrackId === track.id;
                  return (
                    <motion.div
                      key={track.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      onClick={() => setSelectedTrackId(isSelected ? null : track.id)}
                      className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors group ${
                        isSelected ? "bg-accent/5" : "hover:bg-muted/50"
                      }`}
                    >
                      {/* Number / Play button */}
                      <div className="w-8 text-center relative">
                        <span className={`text-small group-hover:hidden ${isCurrentlyPlaying ? "hidden" : ""} ${isSelected ? "text-accent font-medium" : "text-muted-foreground"}`}>
                          {i + 1}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlayTrack(track.id);
                          }}
                          className={`${isCurrentlyPlaying ? "" : "hidden group-hover:block"} text-accent`}
                        >
                          {isCurrentlyPlaying ? (
                            <Pause className="w-3.5 h-3.5 mx-auto" />
                          ) : (
                            <Play className="w-3.5 h-3.5 mx-auto" />
                          )}
                        </button>
                      </div>

                      {/* Title + Artist */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <p className={`text-body font-medium truncate ${isCurrentlyPlaying ? "text-accent" : "text-foreground"}`}>
                            {track.title}
                          </p>
                          {extractYouTubeId(track.external_link) && (
                            <Youtube className="w-3 h-3 text-red-500 shrink-0" aria-label="Has YouTube video" />
                          )}
                        </div>
                        <p className="text-small text-muted-foreground flex items-center gap-1 truncate">
                          <User className="w-3 h-3 shrink-0" /> {track.artist}
                        </p>
                      </div>

                      {/* Album */}
                      <span className="hidden sm:block w-32 text-small text-muted-foreground truncate">
                        {track.album}
                      </span>

                      {/* Category */}
                      <span className="hidden sm:block w-20">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground capitalize">
                          {track.category}
                        </span>
                      </span>

                      {/* Duration */}
                      <span className="w-12 text-right text-small text-muted-foreground">
                        {track.duration}
                      </span>

                      {/* Favorite */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleFavorite(track.id);
                        }}
                        className={`w-8 p-1 rounded transition-colors ${
                          track.isFavorite
                            ? "text-red-500"
                            : "text-transparent group-hover:text-muted-foreground hover:text-red-500"
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 mx-auto ${track.isFavorite ? "fill-current" : ""}`} />
                      </button>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Track Detail Sidebar */}
        <AnimatePresence>
          {selectedTrack && (
            <div className="lg:col-span-1 space-y-4">
              <TrackDetailPanel
                track={selectedTrack}
                onClose={() => setSelectedTrackId(null)}
                onToggleFavorite={handleToggleFavorite}
                onDelete={handleDeleteTrack}
                onUploadAudio={handleUploadAudio}
                isUploadingAudio={uploadAudioMutation.isPending}
              />
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Mini Player */}
      <div className="sticky bottom-0 z-30">
        <MiniPlayer
          track={currentTrack}
          isPlaying={isPlaying}
          onTogglePlay={handleTogglePlay}
          onNext={handleNext}
          onPrev={handlePrev}
          progress={progress}
          onSeek={handleSeek}
          isMuted={isMuted}
          onToggleMute={() => toggleMute()}
          isShuffled={isShuffled}
          onToggleShuffle={() => setIsShuffled((s) => !s)}
          repeatMode={repeatMode}
          onToggleRepeat={handleToggleRepeat}
        />
      </div>

      {/* Add Song Modal */}
      <AddSongModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSubmit={handleAddTrack}
        isLoading={createTrack.isPending}
      />
    </div>
  );
}
