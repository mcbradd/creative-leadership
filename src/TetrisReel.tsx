import { useEffect, useRef, useState } from "react";
import {
  ArrowCounterClockwise,
  ArrowSquareOut,
  Pause,
  Play,
  SpeakerHigh,
  SpeakerSlash,
} from "@phosphor-icons/react";
import "./tetris-reel.css";

const VIDEO_ID = "-jCIo480M90";
const CLIP_START_SECONDS = 433;
const CLIP_END_SECONDS = 460;
const WATCH_URL = "https://youtu.be/-jCIo480M90?t=433";

type VideoByIdOptions = {
  videoId: string;
  startSeconds: number;
  endSeconds: number;
};

type YouTubePlayer = {
  destroy: () => void;
  getIframe: () => HTMLIFrameElement;
  loadVideoById: (options: VideoByIdOptions) => void;
  mute: () => void;
  pauseVideo: () => void;
  playVideo: () => void;
  unMute: () => void;
};

type YouTubePlayerEvent = {
  target: YouTubePlayer;
};

type YouTubeStateEvent = YouTubePlayerEvent & {
  data: number;
};

type YouTubePlayerOptions = {
  events: {
    onError: () => void;
    onReady: (event: YouTubePlayerEvent) => void;
    onStateChange: (event: YouTubeStateEvent) => void;
  };
};

type YouTubeApi = {
  Player: new (element: HTMLIFrameElement, options: YouTubePlayerOptions) => YouTubePlayer;
  PlayerState: {
    ENDED: number;
    PAUSED: number;
    PLAYING: number;
  };
};

declare global {
  interface Navigator {
    connection?: {
      saveData?: boolean;
    };
  }

  interface Window {
    YT?: YouTubeApi;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let youtubeApiPromise: Promise<YouTubeApi> | null = null;

function loadYouTubeApi(): Promise<YouTubeApi> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (youtubeApiPromise) return youtubeApiPromise;

  youtubeApiPromise = new Promise<YouTubeApi>((resolve, reject) => {
    const selector = 'script[data-tetris-youtube-api="true"]';
    let script = document.querySelector<HTMLScriptElement>(selector);
    const previousReady = window.onYouTubeIframeAPIReady;
    let settled = false;

    const finish = () => {
      if (settled || !window.YT?.Player) return;
      settled = true;
      window.clearTimeout(timeoutId);
      script?.removeEventListener("error", fail);
      resolve(window.YT);
    };

    const fail = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      script?.removeEventListener("error", fail);
      script?.remove();
      youtubeApiPromise = null;
      reject(new Error("The YouTube player could not be loaded."));
    };

    window.onYouTubeIframeAPIReady = () => {
      previousReady?.();
      finish();
    };

    if (!script) {
      script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      script.dataset.tetrisYoutubeApi = "true";
      document.head.appendChild(script);
    }

    script.addEventListener("error", fail, { once: true });
    const timeoutId = window.setTimeout(fail, 12_000);
    finish();
  });

  return youtubeApiPromise;
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const update = () => setMatches(mediaQuery.matches);
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, [query]);

  return matches;
}

function createPlayerIframe() {
  const iframe = document.createElement("iframe");
  const origin = encodeURIComponent(window.location.origin);
  iframe.src =
    `https://www.youtube-nocookie.com/embed/${VIDEO_ID}` +
    `?enablejsapi=1&origin=${origin}&playsinline=1&controls=0&disablekb=1&fs=0&rel=0`;
  iframe.title = "Tetris Beat gameplay excerpt from 7:13 to 7:40";
  iframe.tabIndex = -1;
  iframe.allow = "autoplay; encrypted-media; picture-in-picture";
  iframe.referrerPolicy = "strict-origin-when-cross-origin";
  return iframe;
}

export type TetrisReelProps = {
  active: boolean;
  posterSrc: string;
  posterAlt: string;
  className?: string;
  compact?: boolean;
};

export default function TetrisReel({
  active,
  posterSrc,
  posterAlt,
  className = "",
  compact = false,
}: TetrisReelProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const userPausedRef = useRef(false);
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const saveData = Boolean(navigator.connection?.saveData);
  const [motionOverride, setMotionOverride] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  const preferenceFallback = reducedMotion || saveData;
  const shouldLoad = active && !loadError && (!preferenceFallback || motionOverride);
  const effectiveReady = shouldLoad && isReady;
  const effectivePlaying = effectiveReady && isPlaying;
  const effectiveSoundOn = effectiveReady && soundOn;

  useEffect(() => {
    if (!shouldLoad) return;

    let cancelled = false;
    let player: YouTubePlayer | null = null;
    const mount = mountRef.current;

    loadYouTubeApi()
      .then((youtube) => {
        if (cancelled || !mount) return;

        const iframe = createPlayerIframe();
        mount.replaceChildren(iframe);
        player = new youtube.Player(iframe, {
          events: {
            onReady: (event) => {
              if (cancelled) return;
              const frame = event.target.getIframe();
              frame.title = "Tetris Beat gameplay excerpt from 7:13 to 7:40";
              frame.tabIndex = -1;
              event.target.mute();
              event.target.loadVideoById({
                videoId: VIDEO_ID,
                startSeconds: CLIP_START_SECONDS,
                endSeconds: CLIP_END_SECONDS,
              });
              if (document.hidden) event.target.pauseVideo();
              setSoundOn(false);
              setIsReady(true);
            },
            onStateChange: (event) => {
              if (cancelled) return;
              if (event.data === youtube.PlayerState.ENDED) {
                event.target.loadVideoById({
                  videoId: VIDEO_ID,
                  startSeconds: CLIP_START_SECONDS,
                  endSeconds: CLIP_END_SECONDS,
                });
              } else if (event.data === youtube.PlayerState.PLAYING) {
                if (document.hidden) {
                  event.target.pauseVideo();
                  setIsPlaying(false);
                } else {
                  setIsPlaying(true);
                }
              } else if (event.data === youtube.PlayerState.PAUSED) {
                setIsPlaying(false);
              }
            },
            onError: () => {
              if (!cancelled) setLoadError(true);
            },
          },
        });
        playerRef.current = player;
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });

    return () => {
      cancelled = true;
      player?.pauseVideo();
      player?.destroy();
      if (playerRef.current === player) playerRef.current = null;
      mount?.replaceChildren();
      setIsReady(false);
      setIsPlaying(false);
      setSoundOn(false);
    };
  }, [retryKey, shouldLoad]);

  useEffect(() => {
    const onVisibilityChange = () => {
      const player = playerRef.current;
      if (!player) return;
      if (document.hidden) {
        player.pauseVideo();
        setIsPlaying(false);
      } else if (active && !userPausedRef.current) {
        player.playVideo();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [active]);

  const togglePlayback = () => {
    if (loadError) {
      setLoadError(false);
      setRetryKey((value) => value + 1);
      userPausedRef.current = false;
      return;
    }

    if (!shouldLoad) {
      setMotionOverride(true);
      userPausedRef.current = false;
      return;
    }

    const player = playerRef.current;
    if (!player || !effectiveReady) return;
    if (effectivePlaying) {
      userPausedRef.current = true;
      player.pauseVideo();
      setIsPlaying(false);
    } else {
      userPausedRef.current = false;
      player.playVideo();
      setIsPlaying(true);
    }
  };

  const toggleSound = () => {
    const player = playerRef.current;
    if (!player || !effectiveReady) return;
    if (effectiveSoundOn) {
      player.mute();
      setSoundOn(false);
    } else {
      player.unMute();
      setSoundOn(true);
    }
  };

  const reloadClip = () => {
    const player = playerRef.current;
    if (!player || !effectiveReady) return;
    player.loadVideoById({
      videoId: VIDEO_ID,
      startSeconds: CLIP_START_SECONDS,
      endSeconds: CLIP_END_SECONDS,
    });
    userPausedRef.current = false;
    setIsPlaying(true);
  };

  const playbackLabel = loadError
    ? "Retry clip"
    : !shouldLoad
      ? "Play clip"
      : !effectiveReady
        ? "Loading clip"
        : effectivePlaying
          ? "Pause clip"
          : "Play clip";

  const classes = [
    "tetris-reel",
    compact ? "tetris-reel--compact" : "",
    className,
  ].filter(Boolean).join(" ");

  return (
    <figure
      className={classes}
      data-ready={effectiveReady ? "true" : "false"}
      data-playing={effectivePlaying ? "true" : "false"}
    >
      <div className="tetris-reel__stage">
        <div
          className="tetris-reel__poster-backdrop"
          aria-hidden="true"
          style={{ backgroundImage: `url("${posterSrc}")` }}
        />
        <img className="tetris-reel__poster" src={posterSrc} alt={posterAlt} />
        <div className="tetris-reel__player" ref={mountRef} />
        <div className="tetris-reel__controls" role="group" aria-label="Tetris Beat gameplay controls">
          <button
            type="button"
            onClick={togglePlayback}
            disabled={shouldLoad && !effectiveReady && !loadError}
            aria-pressed={effectivePlaying}
          >
            {effectivePlaying ? <Pause weight="fill" aria-hidden="true" /> : <Play weight="fill" aria-hidden="true" />}
            <span>{playbackLabel}</span>
          </button>
          <button
            type="button"
            onClick={toggleSound}
            disabled={!effectiveReady}
            aria-pressed={effectiveSoundOn}
          >
            {effectiveSoundOn ? <SpeakerHigh weight="fill" aria-hidden="true" /> : <SpeakerSlash weight="fill" aria-hidden="true" />}
            <span>{effectiveSoundOn ? "Sound on" : "Sound off"}</span>
          </button>
          <button type="button" onClick={reloadClip} disabled={!effectiveReady}>
            <ArrowCounterClockwise weight="bold" aria-hidden="true" />
            <span>Reload clip</span>
          </button>
        </div>
        {loadError ? (
          <p className="tetris-reel__error" role="status">
            Stream unavailable. Use the full walkthrough link.
          </p>
        ) : null}
      </div>
      <figcaption>
        <span>TETRIS BEAT GAMEPLAY · 07:13 TO 07:40</span>
        <a href={WATCH_URL} target="_blank" rel="noreferrer">
          FULL WALKTHROUGH
          <ArrowSquareOut weight="bold" aria-hidden="true" />
        </a>
      </figcaption>
    </figure>
  );
}
