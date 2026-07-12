import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { ArrowRight, Menu, X } from "lucide-react";
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
  { name: "Join a department", to: "/join" },
  { name: "Upcoming events", to: "/upcoming" },
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
                  <Link
                    to="/join"
                    className="group mx-auto flex w-fit items-center gap-4 rounded-full border border-border bg-muted p-1 pl-4 shadow-md shadow-black/5 transition-all duration-300 hover:bg-background"
                  >
                    <span className="text-sm text-foreground">New here? Request to join a department</span>
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
                  </Link>

                  <h1 className="mx-auto mt-8 max-w-4xl text-balance text-6xl md:text-7xl lg:mt-16 xl:text-[5.25rem]">
                    Join your church community, all in one place
                  </h1>
                  <p className="mx-auto mt-8 max-w-2xl text-balance text-lg text-muted-foreground">
                    Shepherd CRM keeps JPD Church connected — join a department, RSVP to upcoming
                    events, and never miss a birthday shoutout or event reminder on WhatsApp.
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
                      <Link to="/join">
                        <span className="text-nowrap">Join a department</span>
                      </Link>
                    </Button>
                  </div>
                  <Button asChild size="lg" variant="ghost" className="h-10.5 rounded-xl px-5">
                    <Link to="/upcoming">
                      <span className="text-nowrap">See upcoming events</span>
                    </Link>
                  </Button>
                </AnimatedGroup>
              </div>
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
                    <Link to={item.to} className="block text-muted-foreground duration-150 hover:text-accent-foreground">
                      <span>{item.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border border-border bg-background p-6 shadow-2xl md:flex-nowrap group-data-[state=active]:block lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none lg:group-data-[state=active]:flex">
              <div className="lg:hidden">
                <ul className="space-y-6 text-base">
                  {navItems.map((item) => (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        className="block text-muted-foreground duration-150 hover:text-accent-foreground"
                      >
                        <span>{item.name}</span>
                      </Link>
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
