import { type CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import grinchHero from "@/assets/grinch-streamer-hero.jpg";
import cam01Profile from "@/assets/cam-01-profile.png";
import kickProfile from "@/assets/kick-profile.png";
import youtubeTwitchProfile from "@/assets/youtube-twitch-profile.jpg";
import discordProfile from "@/assets/discord-profile.png";

const DISCORD_INVITE = "https://discord.com/invite/zVJu4jtuYP";
const DEFAULT_VIDEO_ID = "5yduAcML59c";
const AUDIO_FADE_STEP_MS = 80;
const AUDIO_FADE_DURATION_MS = 900;

const links = [
  {
    label: "MannyTheGrinch",
    tag: "VOD vault",
    href: "https://www.youtube.com/@MannyTheGrinchLive",
    code: "YT",
    image: youtubeTwitchProfile,
    accent: "0 100% 50%",
    base: "0 0% 4%",
  },
  {
    label: "Kick",
    tag: "unfiltered live",
    href: "https://kick.com/grinch",
    code: "K",
    image: kickProfile,
    accent: "106 97% 50%",
    base: "0 0% 4%",
    subscribe: "https://kick.com/grinch/subscribe",
  },
  {
    label: "Twitch",
    tag: "main broadcast",
    href: "https://www.twitch.tv/grinch",
    code: "TV",
    image: youtubeTwitchProfile,
    accent: "271 100% 64%",
    base: "0 0% 4%",
    subscribe: "https://www.twitch.tv/subs/grinch",
  },
  {
    label: "The Grinches",
    tag: "the lair",
    href: DISCORD_INVITE,
    code: "DC",
    image: discordProfile,
    accent: "235 86% 64%",
    base: "0 0% 4%",
  },
  {
    label: "4kmanny",
    tag: "off-stream drops",
    href: "https://www.instagram.com/4kmanny/",
    code: "IG",
    image: cam01Profile,
    accent: "330 100% 60%",
    base: "0 0% 4%",
  },
];

const AUDIO_STATE_STORAGE_KEY = "grinch:audio-state";

const readStoredAudioState = (): { isPlaying: boolean; volume: number } => {
  if (typeof window === "undefined") return { isPlaying: true, volume: 40 };
  try {
    const raw = window.localStorage.getItem(AUDIO_STATE_STORAGE_KEY);
    if (!raw) return { isPlaying: true, volume: 40 };
    const parsed = JSON.parse(raw) as { isPlaying?: boolean; volume?: number };
    const volume = typeof parsed.volume === "number" ? Math.min(100, Math.max(0, parsed.volume)) : 40;
    const isPlaying = typeof parsed.isPlaying === "boolean" ? parsed.isPlaying : true;
    return { isPlaying, volume };
  } catch {
    return { isPlaying: true, volume: 40 };
  }
};

const Index = () => {
  const [copiedDiscord, setCopiedDiscord] = useState(false);
  const initialAudioState = useMemo(readStoredAudioState, []);
  const [isAudioPlaying, setIsAudioPlaying] = useState(initialAudioState.isPlaying);
  const [audioVolume, setAudioVolume] = useState(initialAudioState.volume);
  const videoFrameRef = useRef<HTMLIFrameElement | null>(null);
  const activeVolumeRef = useRef(0);
  const fadeIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        AUDIO_STATE_STORAGE_KEY,
        JSON.stringify({ isPlaying: isAudioPlaying, volume: audioVolume }),
      );
    } catch {
      /* ignore quota errors */
    }
  }, [audioVolume, isAudioPlaying]);

  const postVideoCommand = useCallback((func: string, args: unknown[] = []) => {
    const frameWindow = videoFrameRef.current?.contentWindow;
    if (!frameWindow) return;

    frameWindow.postMessage(JSON.stringify({ event: "command", func, args }), "https://www.youtube.com");
  }, []);

  const copyDiscordInvite = async () => {
    await navigator.clipboard.writeText(DISCORD_INVITE);
    setCopiedDiscord(true);
    window.setTimeout(() => setCopiedDiscord(false), 1800);
  };

  const clearAudioFade = useCallback(() => {
    if (!fadeIntervalRef.current) return;
    window.clearInterval(fadeIntervalRef.current);
    fadeIntervalRef.current = null;
  }, []);

  const fadeBackgroundVolume = useCallback(
    (targetVolume: number, onComplete?: () => void) => {
      clearAudioFade();
      const startVolume = activeVolumeRef.current;
      const steps = Math.max(1, Math.round(AUDIO_FADE_DURATION_MS / AUDIO_FADE_STEP_MS));
      let currentStep = 0;

      fadeIntervalRef.current = window.setInterval(() => {
        currentStep += 1;
        const progress = Math.min(currentStep / steps, 1);
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        const nextVolume = Math.round(startVolume + (targetVolume - startVolume) * easedProgress);

        activeVolumeRef.current = nextVolume;
        postVideoCommand("setVolume", [nextVolume]);

        if (progress < 1) return;

        clearAudioFade();
        activeVolumeRef.current = targetVolume;
        postVideoCommand("setVolume", [targetVolume]);
        onComplete?.();
      }, AUDIO_FADE_STEP_MS);
    },
    [clearAudioFade, postVideoCommand],
  );

  const toggleBackgroundPlayback = () => {
    if (isAudioPlaying) {
      setIsAudioPlaying(false);
      fadeBackgroundVolume(0, () => {
        postVideoCommand("mute");
      });
      return;
    }

    clearAudioFade();
    activeVolumeRef.current = 0;
    postVideoCommand("playVideo");
    postVideoCommand("unMute");
    postVideoCommand("setVolume", [0]);
    setIsAudioPlaying(true);
    fadeBackgroundVolume(audioVolume);
  };

  const updateBackgroundVolume = (value: string) => {
    const nextVolume = Number(value);
    setAudioVolume(nextVolume);

    if (isAudioPlaying && nextVolume > 0) {
      clearAudioFade();
      activeVolumeRef.current = nextVolume;
      postVideoCommand("setVolume", [nextVolume]);
      postVideoCommand("unMute");
    } else if (isAudioPlaying) {
      clearAudioFade();
      activeVolumeRef.current = 0;
      postVideoCommand("setVolume", [0]);
      postVideoCommand("mute");
    }
  };

  const embedSrc = useMemo(
    () => {
      const origin = typeof window === "undefined" ? "" : window.location.origin;
      return `https://www.youtube.com/embed/${DEFAULT_VIDEO_ID}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&iv_load_policy=3&playsinline=1&enablejsapi=1&origin=${encodeURIComponent(origin)}`;
    },
    [],
  );

  const initializeBackgroundLoop = useCallback(() => {
    postVideoCommand("addEventListener", ["onStateChange"]);
    postVideoCommand("playVideo");
    if (isAudioPlaying) {
      activeVolumeRef.current = 0;
      postVideoCommand("setVolume", [0]);
      postVideoCommand("unMute");
      fadeBackgroundVolume(audioVolume);
    } else {
      activeVolumeRef.current = 0;
      postVideoCommand("setVolume", [0]);
      postVideoCommand("mute");
    }
  }, [audioVolume, fadeBackgroundVolume, isAudioPlaying, postVideoCommand]);

  useEffect(() => {
    const keepVideoLooping = (event: MessageEvent) => {
      if (event.origin !== "https://www.youtube.com" || typeof event.data !== "string") return;

      try {
        const payload = JSON.parse(event.data) as { event?: string; info?: number };
        if (payload.event !== "onStateChange" || payload.info !== 0) return;

        postVideoCommand("seekTo", [0, true]);
        postVideoCommand("playVideo");
        postVideoCommand(isAudioPlaying && audioVolume > 0 ? "unMute" : "mute");
        postVideoCommand("setVolume", [isAudioPlaying ? audioVolume : 0]);
      } catch {
        return;
      }
    };

    window.addEventListener("message", keepVideoLooping);

    return () => {
      window.removeEventListener("message", keepVideoLooping);
    };
  }, [audioVolume, isAudioPlaying, postVideoCommand]);

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-background">
        <iframe
          ref={videoFrameRef}
          src={embedSrc}
          title="YouTube video background"
          className="youtube-bg-frame"
          onLoad={initializeBackgroundLoop}
          allow="autoplay; encrypted-media; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
      <div className="pointer-events-none fixed inset-0 z-[1] bg-background/45" />
      <div className="pointer-events-none fixed inset-0 z-40 scanlines opacity-40" />
      <div className="pointer-events-none fixed inset-0 z-0 noise-field opacity-30" />

      <header className="relative z-30 border-b border-border/70 bg-background/85 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-4 md:px-8 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
          <div className="flex items-center justify-between">
            <a
              href="#top"
              className="font-display text-xl font-extrabold uppercase tracking-normal text-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
            >
              Grinch
            </a>
            <div className="hidden items-center gap-6 font-mono text-xs uppercase text-muted-foreground md:flex lg:hidden">
              <a className="transition-colors hover:text-primary" href="#links">
                Links
              </a>
              <a className="transition-colors hover:text-primary" href="#schedule">
                Schedule
              </a>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 font-mono text-xs uppercase text-muted-foreground lg:gap-6">
            <a className="transition-colors hover:text-primary" href="#links">
              Links
            </a>
            <a className="transition-colors hover:text-primary" href="#schedule">
              Schedule
            </a>
            <button
              type="button"
              onClick={toggleBackgroundPlayback}
              aria-pressed={isAudioPlaying}
              aria-label={isAudioPlaying ? "Pause background music" : "Play background music"}
              title={isAudioPlaying ? "Pause" : "Play"}
              className="grid size-10 place-items-center border border-border bg-card text-card-foreground transition-colors hover:border-primary hover:text-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
            >
              {isAudioPlaying ? <Pause className="size-4" fill="currentColor" /> : <Play className="size-4" fill="currentColor" />}
            </button>
            <label className="flex min-w-44 items-center gap-3 border border-border bg-card px-3 py-2 font-mono text-xs font-bold uppercase text-card-foreground">
              <span>Volume</span>
              <input
                type="range"
                min="0"
                max="100"
                value={audioVolume}
                onChange={(event) => updateBackgroundVolume(event.target.value)}
                aria-label="Background audio volume"
                className="h-2 w-24 accent-primary"
              />
              <span className="w-8 text-right text-muted-foreground">{audioVolume}</span>
            </label>
            <span className="animate-flicker text-secondary">● live soon</span>
          </div>
        </nav>
      </header>

      <section
        id="top"
        className="relative z-10 mx-auto grid min-h-[86vh] max-w-7xl items-center gap-10 px-5 py-14 sm:px-6 sm:py-16 md:grid-cols-[1.05fr_0.95fr] md:gap-14 md:px-10 md:py-20 lg:gap-20 lg:px-12 lg:py-24"
      >
        <div className="space-y-8">
          <div className="space-y-5">
            <h1 className="font-display text-5xl font-extrabold uppercase leading-[0.82] tracking-normal text-foreground sm:text-6xl md:text-7xl lg:text-8xl">
              Grinch
              <span className="block bg-signal bg-clip-text text-transparent">goes live</span>
            </h1>
            <p className="max-w-xl text-lg leading-8 text-muted-foreground md:text-xl">
              "If you ain't grinchin you ain't winning" - Manny
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href="https://www.twitch.tv/grinch"
              target="_blank"
              rel="noreferrer"
              className="group inline-flex min-h-12 items-center justify-center border-2 border-primary bg-primary px-6 font-mono text-sm font-bold uppercase text-primary-foreground transition-transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
            >
              Watch live <span className="ml-3 transition-transform group-hover:translate-x-1">→</span>
            </a>
            <a
              href={DISCORD_INVITE}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-12 items-center justify-center border-2 border-border bg-card px-6 font-mono text-sm font-bold uppercase text-card-foreground transition-colors hover:border-primary hover:text-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
            >
              Join The Grinches
            </a>
            <button
              type="button"
              onClick={copyDiscordInvite}
              className="inline-flex min-h-12 items-center justify-center border-2 border-secondary bg-secondary px-6 font-mono text-sm font-bold uppercase text-secondary-foreground transition-transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
            >
              {copiedDiscord ? "Copied" : "Copy Discord Invite"}
            </button>
          </div>
        </div>

        <div className="relative animate-float motion-reduce:animate-none [--cam-accent:106_97%_50%] [--cam-base:0_0%_4%]">
          <div className="absolute -inset-2 bg-[linear-gradient(135deg,hsl(var(--cam-base))_0%,hsl(var(--cam-accent))_100%)] opacity-25 blur-2xl" />
          <div className="relative overflow-hidden border-4 border-[hsl(var(--cam-accent))] bg-[hsl(var(--cam-base))] shadow-[0_0_40px_hsl(var(--cam-accent)/0.45)]">
            <img
              src={cam01Profile}
              alt="Grinch cam 01 profile portrait"
              width={1280}
              height={896}
              className="aspect-[10/9] h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--cam-base))] via-[hsl(var(--cam-base)/0.1)] to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between border border-[hsl(var(--cam-accent)/0.6)] bg-[hsl(var(--cam-base)/0.85)] px-4 py-3 font-mono text-xs uppercase text-[hsl(var(--cam-accent))] backdrop-blur">
              <span>grinch</span>
              <span>rec ●</span>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 overflow-hidden bg-transparent py-5 md:py-7">
        <div className="flex w-max animate-marquee-reverse whitespace-nowrap motion-reduce:animate-none">
          {Array.from({ length: 6 }).map((_, index) => (
            <p
              key={index}
              className="px-8 text-center font-mono text-2xl font-black uppercase tracking-wide text-primary md:text-4xl"
            >
              If You Aint Grinchin You Aint Winning
            </p>
          ))}
        </div>
      </section>

      <section id="links" className="relative z-10 mx-auto max-w-7xl px-5 py-16 sm:px-6 md:px-10 md:py-20 lg:px-12 lg:py-24">
        <div className="mb-10 flex flex-col justify-between gap-4 md:mb-14 md:flex-row md:items-end">
          <div>
            <p className="font-mono text-xs font-bold uppercase text-primary">all access points</p>
            <h2 className="mt-2 font-display text-4xl font-extrabold uppercase md:text-6xl">Follow the Grinch</h2>
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 md:gap-6 lg:grid-cols-4 lg:gap-7">
          {links.map((link, index) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              style={
                {
                  "--platform-accent": link.accent,
                  "--platform-base": link.base,
                } as CSSProperties
              }
              className="group relative flex min-h-72 flex-col border-2 border-[hsl(var(--platform-accent)/0.5)] bg-[linear-gradient(155deg,hsl(var(--platform-base))_0%,hsl(var(--platform-base))_64%,hsl(var(--platform-accent)/0.18)_100%)] p-5 sm:p-6 md:p-7 transition-all hover:-translate-y-2 hover:border-[hsl(var(--platform-accent))] hover:shadow-[0_0_34px_hsl(var(--platform-accent)/0.34)] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="font-mono text-xs uppercase text-muted-foreground">
                  00{index + 1} // {link.tag}
                </span>
                <span className="grid size-10 place-items-center border-2 border-[hsl(var(--platform-accent))] bg-[hsl(var(--platform-accent))] font-mono text-sm font-bold text-black transition-transform group-hover:rotate-6 group-hover:scale-110">
                  {link.code}
                </span>
              </div>
              <div className="mx-auto mt-6 size-24 overflow-hidden rounded-full border-4 border-[hsl(var(--platform-accent))] bg-muted shadow-[0_0_24px_hsl(var(--platform-accent)/0.3)] transition-transform duration-300 group-hover:scale-105 sm:mt-8 sm:size-28">
                <img
                  src={link.image}
                  alt={`${link.label} profile picture for Grinch`}
                  width={128}
                  height={128}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>
              {link.subscribe && (
                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    window.open(link.subscribe, "_blank", "noopener,noreferrer");
                  }}
                  className="relative z-10 mt-6 inline-flex w-full items-center justify-center border-2 border-[hsl(var(--platform-accent))] bg-[hsl(var(--platform-accent))] px-4 py-2.5 font-mono text-xs font-bold uppercase text-black transition-transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
                >
                  Subscribe
                </button>
              )}
              <div className="mt-auto flex items-end justify-between gap-4 pt-6">
                <div className="min-w-0">
                  <span
                    className="block max-w-full truncate whitespace-nowrap font-display text-[clamp(1.1rem,2.2vw,1.45rem)] font-extrabold uppercase leading-[1] text-card-foreground transition-colors group-hover:text-[hsl(var(--platform-accent))]"
                  >
                    {link.label}
                  </span>
                  <span className="mt-2 block font-mono text-xs uppercase text-muted-foreground">open channel</span>
                </div>
                <span className="font-mono text-2xl text-[hsl(var(--platform-accent))] transition-transform group-hover:translate-x-1">→</span>
              </div>
            </a>
          ))}
        </div>
      </section>
    </main>
  );
};

export default Index;
