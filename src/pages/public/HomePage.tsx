import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { ArrowRight, Menu, X, Users, Building2, Calendar, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedGroup } from "@/components/ui/animated-group";
import { cn } from "@/lib/utils";
import { useAuth } from "../../lib/auth/AuthContext";

const transitionVariants = {
  item: {
    hidden: {
      opacity: 0,
      filter: "blur(12px)",
      y: 12,
    },
    visible: {
      opacity: 1,
      filter: "blur(0px)",
      y: 0,
      transition: {
        type: "spring" as const,
        bounce: 0.3,
        duration: 1.5,
      },
    },
  },
};

const navItems = [
  { name: "Features", to: "#features" },
  { name: "Preview", to: "#preview" },
];

const features = [
  {
    icon: Users,
    title: "Member records",
    description: "Track every member, tag newcomers, and see who's in which department at a glance.",
  },
  {
    icon: Building2,
    title: "Departments",
    description: "Assign leaders, add members, and share a join link straight into a WhatsApp group.",
  },
  {
    icon: Calendar,
    title: "Events & RSVPs",
    description: "Public event pages members can RSVP to without creating an account.",
  },
  {
    icon: Sparkles,
    title: "WhatsApp automations",
    description: "Birthday shoutouts, event reminders, and newcomer welcomes — sent automatically.",
  },
];

export function HomePage() {
  const { user } = useAuth();
  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <>
      <HomeHeader />
      <main className="overflow-hidden bg-canvas">
        <div
          aria-hidden
          className="absolute inset-0 z-[2] hidden isolate contain-strict pointer-events-none opacity-50 lg:block"
        >
          <div className="absolute left-0 top-0 h-[80rem] w-[35rem] -translate-y-[350px] -rotate-45 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,hsla(0,0%,85%,.08)_0,hsla(0,0%,55%,.02)_50%,hsla(0,0%,45%,0)_80%)]" />
          <div className="absolute left-0 top-0 h-[80rem] w-56 -rotate-45 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.06)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)] [translate:5%_-50%]" />
          <div className="absolute left-0 top-0 h-[80rem] w-56 -translate-y-[350px] -rotate-45 bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.04)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)]" />
        </div>
        <section>
          <div className="relative pt-24 md:pt-36">
            <div
              aria-hidden
              className="absolute inset-0 -z-10 size-full [background:radial-gradient(125%_125%_at_50%_100%,transparent_0%,var(--background)_75%)]"
            />
            <div className="mx-auto max-w-7xl px-6">
              <div className="text-center sm:mx-auto lg:mr-auto lg:mt-0">
                <AnimatedGroup variants={transitionVariants}>
                  <a
                    href="#preview"
                    className="group mx-auto flex w-fit items-center gap-4 rounded-full border border-border bg-muted p-1 pl-4 shadow-md shadow-black/5 transition-all duration-300 hover:bg-background"
                  >
                    <span className="text-sm text-foreground">Now with WhatsApp reminders built in</span>
                    <span className="block h-4 w-0.5 border-l border-border bg-white"></span>
                    <div className="size-6 overflow-hidden rounded-full bg-background duration-500 group-hover:bg-muted">
                      <div className="flex w-12 -translate-x-1/2 duration-500 ease-in-out group-hover:translate-x-0">
                        <span className="flex size-6">
                          <ArrowRight className="m-auto size-3" />
                        </span>
                        <span className="flex size-6">
                          <ArrowRight className="m-auto size-3" />
                        </span>
                      </div>
                    </div>
                  </a>

                  <h1 className="mx-auto mt-8 max-w-4xl text-balance text-6xl md:text-7xl lg:mt-16 xl:text-[5.25rem]">
                    The church CRM that keeps everyone in the loop
                  </h1>
                  <p className="mx-auto mt-8 max-w-2xl text-balance text-lg text-muted-foreground">
                    Shepherd CRM helps JPD Church track members and departments, manage events and
                    RSVPs, and stay in touch automatically — birthday shoutouts and event reminders
                    sent straight to WhatsApp.
                  </p>
                </AnimatedGroup>

                <AnimatedGroup
                  variants={{
                    container: {
                      visible: {
                        transition: {
                          staggerChildren: 0.05,
                          delayChildren: 0.75,
                        },
                      },
                    },
                    ...transitionVariants,
                  }}
                  className="mt-12 flex flex-col items-center justify-center gap-2 md:flex-row"
                >
                  <div className="rounded-[14px] border border-foreground/10 bg-foreground/10 p-0.5">
                    <Button asChild size="lg" className="rounded-xl px-5 text-base">
                      <Link to="/login">
                        <span className="text-nowrap">Sign in to your dashboard</span>
                      </Link>
                    </Button>
                  </div>
                  <Button asChild size="lg" variant="ghost" className="h-10.5 rounded-xl px-5">
                    <a href="#preview">
                      <span className="text-nowrap">See how it works</span>
                    </a>
                  </Button>
                </AnimatedGroup>

                <AnimatedGroup variants={transitionVariants}>
                  <p className="mt-8 text-sm text-muted-foreground">
                    Part of JPD Church?{" "}
                    <Link to="/join" className="font-medium text-forest hover:underline">
                      Join a department
                    </Link>{" "}
                    or{" "}
                    <Link to="/upcoming" className="font-medium text-forest hover:underline">
                      check upcoming events
                    </Link>
                    .
                  </p>
                </AnimatedGroup>
              </div>
            </div>

            <AnimatedGroup
              variants={{
                container: {
                  visible: {
                    transition: {
                      staggerChildren: 0.05,
                      delayChildren: 0.75,
                    },
                  },
                },
                ...transitionVariants,
              }}
            >
              <div id="preview" className="relative mt-16 px-6 pt-8 sm:mt-20">
                <div className="relative mx-auto max-w-5xl overflow-hidden rounded-2xl bg-white p-3 shadow-lg shadow-black/5 ring-1 ring-black/5">
                  <img
                    src="/dashboard-preview.png"
                    alt="Shepherd CRM admin dashboard showing member stats, newcomer rate, upcoming events, and pending join requests"
                    className="w-full rounded-xl"
                    width="1400"
                    height="780"
                  />
                </div>
              </div>
            </AnimatedGroup>
          </div>
        </section>

        <section id="features" className="bg-canvas py-20 md:py-28">
          <div className="mx-auto max-w-5xl px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
                Everything a church office needs, nothing it doesn't
              </h2>
              <p className="mt-3 text-muted-foreground">
                Built for JPD Church's day-to-day — no bloated features borrowed from a sales CRM.
              </p>
            </div>

            <div className="mt-12 grid gap-5 sm:grid-cols-2">
              {features.map((feature) => (
                <div key={feature.title} className="rounded-2xl bg-white p-6 ring-1 ring-black/5">
                  <div className="grid size-10 place-items-center rounded-xl bg-forest/10 text-forest">
                    <feature.icon className="size-5" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold">{feature.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

function BrandMark() {
  return (
    <div className="flex items-center gap-2">
      <div className="grid size-7 place-items-center rounded-md bg-forest text-[11px] font-bold text-white">
        S
      </div>
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold leading-tight">Shepherd CRM</div>
        <div className="text-[10px] uppercase tracking-widest leading-tight text-ink/40">
          JPD Church
        </div>
      </div>
    </div>
  );
}

function HomeHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header>
      <nav data-state={menuOpen && "active"} className="group fixed z-20 w-full px-2">
        <div
          className={cn(
            "mx-auto mt-2 max-w-6xl px-6 transition-all duration-300 lg:px-12",
            isScrolled && "max-w-4xl rounded-2xl border border-border bg-background/50 backdrop-blur-lg lg:px-5"
          )}
        >
          <div className="relative flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
            <div className="flex w-full justify-between lg:w-auto">
              <Link to="/" aria-label="home" className="flex items-center space-x-2">
                <BrandMark />
              </Link>

              <button
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label={menuOpen ? "Close Menu" : "Open Menu"}
                className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden"
              >
                <Menu className="m-auto size-6 duration-200 group-data-[state=active]:scale-0 group-data-[state=active]:opacity-0" />
                <X className="absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200 group-data-[state=active]:rotate-0 group-data-[state=active]:scale-100 group-data-[state=active]:opacity-100" />
              </button>
            </div>

            <div className="absolute inset-0 m-auto hidden size-fit lg:block">
              <ul className="flex gap-8 text-sm">
                {navItems.map((item) => (
                  <li key={item.to}>
                    <a href={item.to} className="block text-muted-foreground duration-150 hover:text-accent-foreground">
                      <span>{item.name}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border border-border bg-background p-6 shadow-2xl md:flex-nowrap group-data-[state=active]:block lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none lg:group-data-[state=active]:flex">
              <div className="lg:hidden">
                <ul className="space-y-6 text-base">
                  {navItems.map((item) => (
                    <li key={item.to}>
                      <a
                        href={item.to}
                        onClick={() => setMenuOpen(false)}
                        className="block text-muted-foreground duration-150 hover:text-accent-foreground"
                      >
                        <span>{item.name}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit">
                <Button asChild variant="outline" size="sm">
                  <Link to="/login">
                    <span>Sign in</span>
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
