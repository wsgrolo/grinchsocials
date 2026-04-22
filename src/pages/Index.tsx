import grinchHero from "@/assets/grinch-streamer-hero.jpg";
import cam01Profile from "@/assets/cam-01-profile.png";
import kickProfile from "@/assets/kick-profile.png";
import youtubeTwitchProfile from "@/assets/youtube-twitch-profile.jpg";

const links = [
  { label: "MannyTheGrinch", tag: "VOD vault", href: "https://www.youtube.com/@MannyTheGrinchLive", code: "YT", image: youtubeTwitchProfile, compactTitle: true },
  { label: "Kick", tag: "unfiltered live", href: "https://kick.com/grinch", code: "K", image: kickProfile },
  { label: "Twitch", tag: "main broadcast", href: "https://www.twitch.tv/grinch", code: "TV", image: youtubeTwitchProfile },
  { label: "The Grinches", tag: "the lair", href: "https://discord.com/invite/zVJu4jtuYP", code: "DC", image: grinchHero },
];

const Index = () => {
  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 z-40 scanlines opacity-40" />
      <div className="pointer-events-none fixed inset-0 z-0 noise-field opacity-30" />

      <header className="relative z-30 border-b border-border/70 bg-background/85 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
          <a href="#top" className="font-display text-xl font-extrabold uppercase tracking-normal text-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background">
            Grinch
          </a>
          <div className="hidden items-center gap-6 font-mono text-xs uppercase text-muted-foreground md:flex">
            <a className="transition-colors hover:text-primary" href="#links">Links</a>
            <a className="transition-colors hover:text-primary" href="#schedule">Schedule</a>
            <span className="animate-flicker text-secondary">● live soon</span>
          </div>
        </nav>
      </header>

      <section id="top" className="relative z-10 mx-auto grid min-h-[86vh] max-w-7xl items-center gap-10 px-5 py-12 md:grid-cols-[1.05fr_0.95fr] md:px-8 lg:py-16">
        <div className="space-y-8">
          <div className="space-y-5">
            <h1 className="font-display text-5xl font-extrabold uppercase leading-[0.82] tracking-normal text-foreground sm:text-6xl md:text-7xl lg:text-8xl">
              Grinch
              <span className="block bg-signal bg-clip-text text-transparent">goes live</span>
            </h1>
            <p className="max-w-xl text-lg leading-8 text-muted-foreground md:text-xl">
              “If you ain't grinchin you ain't winning” - Manny
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a href="https://www.twitch.tv/grinch" target="_blank" rel="noreferrer" className="group inline-flex min-h-12 items-center justify-center border-2 border-primary bg-primary px-6 font-mono text-sm font-bold uppercase text-primary-foreground transition-transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background">
              Watch live <span className="ml-3 transition-transform group-hover:translate-x-1">→</span>
            </a>
            <a href="https://discord.com/invite/zVJu4jtuYP" target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center border-2 border-border bg-card px-6 font-mono text-sm font-bold uppercase text-card-foreground transition-colors hover:border-primary hover:text-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background">
              Join The Grinches
            </a>
          </div>
        </div>

        <div className="relative animate-float motion-reduce:animate-none">
          <div className="absolute -inset-2 bg-signal opacity-20 blur-2xl" />
          <div className="relative overflow-hidden border-4 border-primary bg-card shadow-hard">
            <img src={cam01Profile} alt="Grinch cam 01 profile portrait" width={1280} height={896} className="aspect-[10/9] h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/10 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between border border-primary/50 bg-background/80 px-4 py-3 font-mono text-xs uppercase backdrop-blur">
              <span>grinch</span>
              <span className="text-primary">rec ●</span>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 border-y border-border bg-card/60 py-4">
        <div className="flex w-[200%] animate-marquee gap-8 font-mono text-sm font-bold uppercase text-primary motion-reduce:animate-none">
          {Array.from({ length: 12 }).map((_, index) => (
            <span key={index}>new clips • live streams • discord raids • grinch energy •</span>
          ))}
        </div>
      </section>

      <section id="links" className="relative z-10 mx-auto max-w-7xl px-5 py-16 md:px-8">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="font-mono text-xs font-bold uppercase text-primary">all access points</p>
            <h2 className="font-display text-4xl font-extrabold uppercase md:text-6xl">Follow the chaos</h2>
          </div>
          <p className="max-w-md text-muted-foreground">Use these cards as the main link hub. Replace the placeholder URLs with Grinch’s exact channels whenever you have them.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {links.map((link, index) => (
            <a key={link.label} href={link.href} target="_blank" rel="noreferrer" className="group relative min-h-72 overflow-hidden border-2 border-border bg-card p-6 transition-all hover:-translate-y-2 hover:border-primary hover:shadow-signal focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background">
              <div className="flex items-start justify-between gap-4">
                <span className="font-mono text-xs uppercase text-muted-foreground">00{index + 1} // {link.tag}</span>
                <span className="grid size-10 place-items-center border-2 border-primary bg-primary font-mono text-sm font-bold text-primary-foreground transition-transform group-hover:rotate-6 group-hover:scale-110">{link.code}</span>
              </div>
              <div className="mx-auto mt-8 size-28 overflow-hidden rounded-full border-4 border-primary bg-muted shadow-signal transition-transform duration-300 group-hover:scale-105">
                <img src={link.image} alt={`${link.label} profile picture for Grinch`} width={128} height={128} loading="lazy" className="h-full w-full object-cover" />
              </div>
              <div className="mt-8 flex items-end justify-between gap-4">
                <div>
                  <span className={`block font-display font-extrabold uppercase text-card-foreground transition-colors group-hover:text-primary ${link.compactTitle ? "text-2xl md:text-3xl" : "text-4xl"}`}>{link.label}</span>
                  <span className="mt-2 block font-mono text-xs uppercase text-muted-foreground">open channel</span>
                </div>
                <span className="font-mono text-2xl text-primary transition-transform group-hover:translate-x-1">→</span>
              </div>
            </a>
          ))}
        </div>
      </section>

    </main>
  );
};

export default Index;
