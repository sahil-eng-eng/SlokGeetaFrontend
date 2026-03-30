import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";

export interface MediaTrack {
  id: string;
  title: string;
  artist: string;
  audio_url: string | null;
  youtube_url: string | null;
  /** Duration string like "5:30" */
  duration: string;
  durationSeconds: number;
}

interface MediaPlayerState {
  currentTrack: MediaTrack | null;
  queue: MediaTrack[];
  isPlaying: boolean;
  progress: number; // 0-100
  isMuted: boolean;
  volume: number; // 0-1
}

interface MediaPlayerActions {
  playTrack: (track: MediaTrack, queue?: MediaTrack[]) => void;
  pauseTrack: () => void;
  togglePlay: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  seekTo: (pct: number) => void;
  toggleMute: () => void;
  setVolume: (v: number) => void;
  stopPlayer: () => void;
  /** Ref to the hidden <audio> element (for direct access) */
  audioRef: React.RefObject<HTMLAudioElement>;
}

type MediaPlayerContextValue = MediaPlayerState & MediaPlayerActions;

const MediaPlayerContext = createContext<MediaPlayerContextValue | null>(null);

export function MediaPlayerProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<MediaPlayerState>({
    currentTrack: null,
    queue: [],
    isPlaying: false,
    progress: 0,
    isMuted: false,
    volume: 1,
  });

  const audioRef = useRef<HTMLAudioElement>(null);
  // YouTube player state — only used for YT tracks
  const ytProgressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Track whether current track is YT
  const isYT = !!(state.currentTrack?.youtube_url && !state.currentTrack.audio_url);

  // Wire up real <audio> element events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      if (!audio.duration) return;
      setState((s) => ({ ...s, progress: (audio.currentTime / audio.duration) * 100 }));
    };
    const onEnded = () => setState((s) => ({ ...s, isPlaying: false, progress: 100 }));
    const onPlay = () => setState((s) => ({ ...s, isPlaying: true }));
    const onPause = () => setState((s) => ({ ...s, isPlaying: false }));

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
    };
  }, []);

  // Simulate progress for YouTube tracks (no direct API access without iframe)
  useEffect(() => {
    if (!isYT) {
      if (ytProgressRef.current) { clearInterval(ytProgressRef.current); ytProgressRef.current = null; }
      return;
    }
    if (state.isPlaying && state.currentTrack) {
      const dur = state.currentTrack.durationSeconds || 300;
      ytProgressRef.current = setInterval(() => {
        setState((s) => {
          const next = s.progress + (100 / dur);
          if (next >= 100) {
            clearInterval(ytProgressRef.current!);
            ytProgressRef.current = null;
            return { ...s, isPlaying: false, progress: 100 };
          }
          return { ...s, progress: next };
        });
      }, 1000);
    } else {
      if (ytProgressRef.current) { clearInterval(ytProgressRef.current); ytProgressRef.current = null; }
    }
    return () => { if (ytProgressRef.current) { clearInterval(ytProgressRef.current); ytProgressRef.current = null; } };
  }, [state.isPlaying, isYT, state.currentTrack]);

  const stopYtProgress = useCallback(() => {
    if (ytProgressRef.current) { clearInterval(ytProgressRef.current); ytProgressRef.current = null; }
  }, []);

  const playTrack = useCallback((track: MediaTrack, queue?: MediaTrack[]) => {
    stopYtProgress();
    const audio = audioRef.current;
    if (audio) { audio.pause(); }
    setState((s) => ({ ...s, currentTrack: track, queue: queue ?? s.queue, isPlaying: true, progress: 0 }));
    if (track.audio_url && audio) {
      audio.src = track.audio_url;
      audio.muted = state.isMuted;
      audio.volume = state.volume;
      audio.currentTime = 0;
      audio.play().catch(() => {});
    }
    // YT progress starts via useEffect watching isPlaying+isYT
  }, [stopYtProgress, state.isMuted, state.volume]);

  const pauseTrack = useCallback(() => {
    stopYtProgress();
    audioRef.current?.pause();
    setState((s) => ({ ...s, isPlaying: false }));
  }, [stopYtProgress]);

  const togglePlay = useCallback(() => {
    setState((s) => {
      if (s.isPlaying) {
        stopYtProgress();
        audioRef.current?.pause();
        return { ...s, isPlaying: false };
      } else {
        if (audioRef.current && s.currentTrack?.audio_url) {
          audioRef.current.play().catch(() => {});
        }
        return { ...s, isPlaying: true };
      }
    });
  }, [stopYtProgress]);

  const nextTrack = useCallback(() => {
    setState((s) => {
      if (!s.currentTrack || s.queue.length === 0) return s;
      const idx = s.queue.findIndex((t) => t.id === s.currentTrack!.id);
      const next = s.queue[(idx + 1) % s.queue.length];
      if (!next) return s;
      stopYtProgress();
      const audio = audioRef.current;
      if (audio) audio.pause();
      if (next.audio_url && audio) {
        audio.src = next.audio_url;
        audio.currentTime = 0;
        audio.play().catch(() => {});
      }
      return { ...s, currentTrack: next, isPlaying: true, progress: 0 };
    });
  }, [stopYtProgress]);

  const prevTrack = useCallback(() => {
    setState((s) => {
      if (!s.currentTrack || s.queue.length === 0) return s;
      const idx = s.queue.findIndex((t) => t.id === s.currentTrack!.id);
      const prev = s.queue[(idx - 1 + s.queue.length) % s.queue.length];
      if (!prev) return s;
      stopYtProgress();
      const audio = audioRef.current;
      if (audio) audio.pause();
      if (prev.audio_url && audio) {
        audio.src = prev.audio_url;
        audio.currentTime = 0;
        audio.play().catch(() => {});
      }
      return { ...s, currentTrack: prev, isPlaying: true, progress: 0 };
    });
  }, [stopYtProgress]);

  const seekTo = useCallback((pct: number) => {
    setState((s) => ({ ...s, progress: pct }));
    const audio = audioRef.current;
    if (audio && audio.duration) {
      audio.currentTime = (pct / 100) * audio.duration;
    }
  }, []);

  const toggleMute = useCallback(() => {
    setState((s) => {
      if (audioRef.current) audioRef.current.muted = !s.isMuted;
      return { ...s, isMuted: !s.isMuted };
    });
  }, []);

  const setVolume = useCallback((v: number) => {
    setState((s) => {
      if (audioRef.current) audioRef.current.volume = v;
      return { ...s, volume: v };
    });
  }, []);

  const stopPlayer = useCallback(() => {
    stopYtProgress();
    audioRef.current?.pause();
    setState({ currentTrack: null, queue: [], isPlaying: false, progress: 0, isMuted: false, volume: 1 });
  }, [stopYtProgress]);

  return (
    <MediaPlayerContext.Provider value={{ ...state, playTrack, pauseTrack, togglePlay, nextTrack, prevTrack, seekTo, toggleMute, setVolume, stopPlayer, audioRef }}>
      {/* Persistent hidden audio element — never unmounts */}
      <audio ref={audioRef} style={{ display: "none" }} />
      {children}
    </MediaPlayerContext.Provider>
  );
}

export function useMediaPlayer() {
  const ctx = useContext(MediaPlayerContext);
  if (!ctx) throw new Error("useMediaPlayer must be used inside MediaPlayerProvider");
  return ctx;
}
