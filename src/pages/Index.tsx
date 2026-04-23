import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import grinchHero from "@/assets/grinch-streamer-hero.jpg";
import cam01Profile from "@/assets/cam-01-profile.png";
import kickProfile from "@/assets/kick-profile.png";
import youtubeTwitchProfile from "@/assets/youtube-twitch-profile.jpg";
import discordProfile from "@/assets/discord-profile.png";

const DISCORD_INVITE = "https://discord.com/invite/zVJu4jtuYP";
const DEFAULT_VIDEO_ID = "jfKfPfyJRdk";
const VIDEO_FUNCTION_PATH = "/.netlify/functions/background-video";

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
  },
  {
    label: "Twitch",
    tag: "main broadcast",
    href: "https://www.twitch.tv/grinch",
    code: "TV",
    image: youtubeTwitchProfile,
    accent: "271 100% 64%",
    base: "0 0% 4%",
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
];

const YOUTUBE_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;

const extractVideoId = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (YOUTUBE_ID_PATTERN.test(trimmed)) return trimmed;

  try {
    const url = new URL(trimmed);

    if (url.hostname === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id && YOUTUBE_ID_PATTERN.test(id) ? id : null;
    }

    if (url.hostname.includes("youtube.com")) {
      const watchId = url.searchParams.get("v");
      if (watchId && YOUTUBE_ID_PATTERN.test(watchId)) return watchId;

      const pathParts = url.pathname.split("/").filter(Boolean);
      const embedOrShortsId = pathParts[1];
      if (
        (pathParts[0] === "embed" || pathParts[0] === "shorts") &&
        embedOrShortsId &&
        YOUTUBE_ID_PATTERN.test(embedOrShortsId)
      ) {
        return embedOrShortsId;
      }
    }
  } catch {
    return null;
  }

  return null;
};

const Index = () => {
  const [copiedDiscord, setCopiedDiscord] = useState(false);
  const [videoId, setVideoId] = useState(DEFAULT_VIDEO_ID);
  const videoFrameRef = useRef<HTMLIFrameElement | null>(null);

  const copyDiscordInvite = async () => {
    await navigator.clipboard.writeText(DISCORD_INVITE);
    setCopiedDiscord(true);
    window.setTimeout(() => setCopiedDiscord(false), 1800);
  };

  useEffect(() => {
    const hydratePageState = async () => {
      try {
        const response = await fetch(VIDEO_FUNCTION_PATH, {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) return;

        const payload = (await response.json()) as { videoId?: string };
        const persistedVideoId = extractVideoId(payload.videoId ?? "");
        if (!persistedVideoId) return;

        setVideoId(persistedVideoId);
      } catch {
        return;
      }
    };

    void hydratePageState();
  }, []);

  const embedSrc = useMemo(
    () => {
      const origin = typeof window === "undefined" ? "" : window.location.origin;
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoId}&modestbranding=1&rel=0&iv_load_policy=3&playsinline=1&enablejsapi=1&origin=${encodeURIComponent(origin)}`;
    },
    [videoId],
  );

  useEffect(() => {
    let interactionHandled = false;

    const postCommand = (func: string, args: unknown[] = []) => {
      const frameWindow = videoFrameRef.current?.contentWindow;
      if (!frameWindow) return;

      frameWindow.postMessage(JSON.stringify({ event: "command", func, args }), "https://www.youtube.com");
    };

    const keepVideoLooping = (event: MessageEvent) => {
      if (event.origin !== "https://www.youtube.com" || typeof event.data !== "string") return;

      try {
        const payload = JSON.parse(event.data) as { event?: string; info?: number };
        if (payload.event !== "onStateChange" || payload.info !== 0) return;

        postCommand("seekTo", [0, true]);
        postCommand("playVideo");
      } catch {
        return;
      }
    };

    const tryEnableAudio = () => {
      if (interactionHandled) return;

      postCommand("playVideo");
      postCommand("unMute");
      postCommand("setVolume", [100]);

      interactionHandled = true;
      window.removeEventListener("pointerdown", tryEnableAudio);
      window.removeEventListener("keydown", tryEnableAudio);
      window.removeEventListener("touchstart", tryEnableAudio);
    };

    window.addEventListener("message", keepVideoLooping);
    window.addEventListener("pointerdown", tryEnableAudio);
    window.addEventListener("keydown", tryEnableAudio);
    window.addEventListener("touchstart", tryEnableAudio);

    const subscribeToPlayerState = window.setTimeout(() => {
      postCommand("addEventListener", ["onStateChange"]);
    }, 1000);

    return () => {
      window.clearTimeout(subscribeToPlayerState);
      window.removeEventListener("message", keepVideoLooping);
      window.removeEventListener("pointerdown", tryEnableAudio);
      window.removeEventListener("keydown", tryEnableAudio);
      window.removeEventListener("touchstart", tryEnableAudio);
    };
  }, [videoId]);

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-background">
        <iframe
          ref={videoFrameRef}
          src={embedSrc}
          title="YouTube video background"
          className="youtube-bg-frame"
          allow="autoplay; encrypted-media; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
      <div className="pointer-events-none fixed inset-0 z-[1] bg-background/72" />
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

          <div className="hidden items-center gap-6 font-mono text-xs uppercase text-muted-foreground lg:flex">
            <a className="transition-colors hover:text-primary" href="#links">
              Links
            </a>
            <a className="transition-colors hover:text-primary" href="#schedule">
              Schedule
            </a>
            <span className="animate-flicker text-secondary">● live soon</span>
          </div>
        </nav>
      </header>

      <section
        id="top"
        className="relative z-10 mx-auto grid min-h-[86vh] max-w-7xl items-center gap-10 px-5 py-12 md:grid-cols-[1.05fr_0.95fr] md:px-8 lg:py-16"
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

        <div className="relative animate-float motion-reduce:animate-none">
          <div className="absolute -inset-2 bg-signal opacity-20 blur-2xl" />
          <div className="relative overflow-hidden border-4 border-primary bg-card shadow-hard">
            <img
              src={cam01Profile}
              alt="Grinch cam 01 profile portrait"
              width={1280}
              height={896}
              className="aspect-[10/9] h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/10 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between border border-primary/50 bg-background/80 px-4 py-3 font-mono text-xs uppercase backdrop-blur">
              <span>grinch</span>
              <span className="text-primary">rec ●</span>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 overflow-hidden border-y border-border bg-card/60 py-6">
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

      <section id="links" className="relative z-10 mx-auto max-w-7xl px-5 py-16 md:px-8">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="font-mono text-xs font-bold uppercase text-primary">all access points</p>
            <h2 className="font-display text-4xl font-extrabold uppercase md:text-6xl">Follow the Grinch</h2>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
              className="group relative min-h-72 overflow-hidden border-2 border-[hsl(var(--platform-accent)/0.5)] bg-[linear-gradient(155deg,hsl(var(--platform-base))_0%,hsl(var(--platform-base))_64%,hsl(var(--platform-accent)/0.18)_100%)] p-6 transition-all hover:-translate-y-2 hover:border-[hsl(var(--platform-accent))] hover:shadow-[0_0_34px_hsl(var(--platform-accent)/0.34)] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="font-mono text-xs uppercase text-muted-foreground">
                  00{index + 1} // {link.tag}
                </span>
                <span className="grid size-10 place-items-center border-2 border-[hsl(var(--platform-accent))] bg-[hsl(var(--platform-accent))] font-mono text-sm font-bold text-black transition-transform group-hover:rotate-6 group-hover:scale-110">
                  {link.code}
                </span>
              </div>
              <div className="mx-auto mt-8 size-28 overflow-hidden rounded-full border-4 border-[hsl(var(--platform-accent))] bg-muted shadow-[0_0_24px_hsl(var(--platform-accent)/0.3)] transition-transform duration-300 group-hover:scale-105">
                <img
                  src={link.image}
                  alt={`${link.label} profile picture for Grinch`}
                  width={128}
                  height={128}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="mt-8 flex items-end justify-between gap-4">
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
