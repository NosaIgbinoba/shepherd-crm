import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  ArrowRight,
  Menu,
  X,
  Users,
  Building2,
  Calendar,
  Sparkles,
  Copy,
  UserPlus,
  ClipboardCheck,
  MessageCircle,
  Check,
  Minus,
  ChevronDown,
} from "lucide-react";
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
  { name: "Pricing", to: "#pricing" },
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

const howItWorks = [
  {
    icon: Copy,
    title: "Share a join link",
    description: "An admin copies a department's join link and pastes it into that group's WhatsApp chat.",
  },
  {
    icon: UserPlus,
    title: "A member requests to join",
    description: "They fill out a short public form — name, phone, date of birth, department. No account needed.",
  },
  {
    icon: ClipboardCheck,
    title: "Admin approves",
    description: "One click creates the real member record and assigns them to the department.",
  },
  {
    icon: Sparkles,
    title: "Automations take over",
    description:
      "Newcomer welcomes, birthday shoutouts, and event reminders go out on WhatsApp automatically — no manual follow-up.",
  },
];

const comparisonRows = [
  {
    label: "Pricing model",
    shepherd: "Single price per tier, everything included",
    planningCenter: "Modular — separate products, priced per app",
    churchTrac: "Tiered by feature set",
  },
  {
    label: "WhatsApp automation",
    shepherd: true,
    planningCenter: false,
    churchTrac: false,
  },
  {
    label: "Built for",
    shepherd: "Congregations that already coordinate over WhatsApp",
    planningCenter: "Larger, multi-site churches needing modular tools",
    churchTrac: "Small churches wanting a single budget-friendly tool",
  },
];

type PricingTier = {
  name: string;
  memberRange: string;
  monthly: number;
};

const PRICING_TIERS: PricingTier[] = [
  { name: "Starter", memberRange: "Up to 100 members", monthly: 19 },
  { name: "Growth", memberRange: "100–300 members", monthly: 39 },
  { name: "Established", memberRange: "300+ members", monthly: 69 },
];

const faqs = [
  {
    question: "Is there a free trial? How do I get started?",
    answer:
      "There's no self-serve signup yet — every church is currently set up directly. Contact options for new churches are coming soon.",
  },
  {
    question: "How is our member data kept private?",
    answer:
      "Every church's data is isolated at the database level — row-level security scopes every record to your organization, so no other church using Shepherd CRM can ever see your members, departments, or records.",
  },
  {
    question: "Does WhatsApp cost anything extra for our church?",
    answer: "No — WhatsApp messaging is included at every tier, no extra fee.",
  },
  {
    question: "Can members without smartphones still be tracked?",
    answer:
      "Yes — admins can add and manage any member manually from the dashboard, whether or not they ever use the public join link or have WhatsApp.",
  },
];

export function HomePage() {
  const { user } = useAuth();
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
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

        <section id="how-it-works" className="bg-canvas py-20 md:py-28">
          <div className="mx-auto max-w-5xl px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">How it works</h2>
              <p className="mt-3 text-muted-foreground">
                From a shared link to an automatic WhatsApp welcome — no manual follow-up in
                between.
              </p>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {howItWorks.map((step, i) => (
                <div key={step.title} className="relative rounded-2xl bg-white p-6 ring-1 ring-black/5">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="grid size-8 shrink-0 place-items-center rounded-full bg-forest text-xs font-semibold text-white">
                      {i + 1}
                    </div>
                    <step.icon className="size-5 text-forest" />
                  </div>
                  <h3 className="text-sm font-semibold">{step.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="why-whatsapp" className="bg-canvas py-20 md:py-28">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <div className="mx-auto mb-5 grid size-12 place-items-center rounded-2xl bg-forest/10 text-forest">
              <MessageCircle className="size-6" />
            </div>
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Why WhatsApp</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Most congregations already coordinate over WhatsApp group chats — department
              updates, event announcements, prayer requests. Shepherd CRM automates within that
              same channel instead of asking your congregation to check email or install another
              app. Birthday shoutouts, event reminders, and newcomer welcomes just show up where
              people already are.
            </p>
          </div>
        </section>

        <section id="comparison" className="bg-canvas py-20 md:py-28">
          <div className="mx-auto max-w-4xl px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
                Shepherd vs. Planning Center &amp; ChurchTrac
              </h2>
              <p className="mt-3 text-muted-foreground">
                A fair, general comparison — not a claim about their current pricing or features,
                which can change.
              </p>
            </div>

            <div className="mt-10 overflow-x-auto rounded-2xl bg-white ring-1 ring-black/5">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="px-5 py-4 font-medium text-muted-foreground"></th>
                    <th className="px-5 py-4 font-semibold text-forest">Shepherd CRM</th>
                    <th className="px-5 py-4 font-medium text-muted-foreground">Planning Center</th>
                    <th className="px-5 py-4 font-medium text-muted-foreground">ChurchTrac</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row) => (
                    <tr key={row.label} className="border-b border-border last:border-0">
                      <td className="px-5 py-4 font-medium">{row.label}</td>
                      <ComparisonCell value={row.shepherd} accent />
                      <ComparisonCell value={row.planningCenter} />
                      <ComparisonCell value={row.churchTrac} />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section id="pricing" className="bg-canvas py-20 md:py-28">
          <div className="mx-auto max-w-5xl px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
                One price per tier, everything included
              </h2>
              <p className="mt-3 text-muted-foreground">
                Members, departments, events &amp; RSVPs, attendance tracking, and every WhatsApp
                automation — on every tier, no exceptions. Tiers scale with congregation size, not
                features.
              </p>
            </div>

            <div className="mt-8 flex justify-center">
              <div className="inline-flex rounded-lg border border-border bg-white p-1">
                <button
                  onClick={() => setBilling("monthly")}
                  className={cn(
                    "rounded-md px-4 py-1.5 text-sm font-medium transition",
                    billing === "monthly" ? "bg-forest text-white" : "text-ink/60 hover:bg-neutral-50"
                  )}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBilling("annual")}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-md px-4 py-1.5 text-sm font-medium transition",
                    billing === "annual" ? "bg-forest text-white" : "text-ink/60 hover:bg-neutral-50"
                  )}
                >
                  Annual
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                      billing === "annual" ? "bg-white/20" : "bg-amber-clay/15 text-amber-clay"
                    )}
                  >
                    2 months free
                  </span>
                </button>
              </div>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {PRICING_TIERS.map((tier) => {
                const price = billing === "monthly" ? tier.monthly : tier.monthly * 10;
                return (
                  <div key={tier.name} className="rounded-2xl bg-white p-6 ring-1 ring-black/5">
                    <h3 className="text-base font-semibold">{tier.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{tier.memberRange}</p>
                    <div className="mt-6 flex items-baseline gap-1">
                      <span className="text-4xl font-semibold tracking-tight">${price}</span>
                      <span className="text-sm text-muted-foreground">
                        /{billing === "monthly" ? "mo" : "yr"}
                      </span>
                    </div>
                    {billing === "annual" && (
                      <p className="mt-1 text-xs text-amber-clay">
                        2 months free vs. paying monthly
                      </p>
                    )}
                    <p className="mt-4 text-sm text-muted-foreground">
                      Everything included — no feature gating between tiers.
                    </p>
                    <Button disabled className="mt-6 w-full rounded-xl">
                      Contact us
                    </Button>
                  </div>
                );
              })}
            </div>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              No self-serve signup yet — contact options are coming soon.
            </p>
          </div>
        </section>

        <section id="faq" className="bg-canvas py-20 md:py-28">
          <div className="mx-auto max-w-2xl px-6">
            <div className="text-center">
              <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
                Frequently asked questions
              </h2>
            </div>

            <div className="mt-10 space-y-3">
              {faqs.map((faq, i) => {
                const open = openFaq === i;
                return (
                  <div key={faq.question} className="rounded-2xl bg-white ring-1 ring-black/5">
                    <button
                      onClick={() => setOpenFaq(open ? null : i)}
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                      aria-expanded={open}
                    >
                      <span className="text-sm font-medium">{faq.question}</span>
                      <ChevronDown
                        className={cn(
                          "size-4 shrink-0 text-muted-foreground transition-transform",
                          open && "rotate-180"
                        )}
                      />
                    </button>
                    {open && (
                      <p className="px-5 pb-4 text-sm text-muted-foreground">{faq.answer}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

function ComparisonCell({ value, accent }: { value: string | boolean; accent?: boolean }) {
  if (typeof value === "boolean") {
    return (
      <td className="px-5 py-4">
        {value ? (
          <Check className={cn("size-4", accent ? "text-forest" : "text-muted-foreground")} />
        ) : (
          <Minus className="size-4 text-muted-foreground/50" />
        )}
      </td>
    );
  }
  return (
    <td className={cn("px-5 py-4 text-sm", accent ? "font-medium text-ink" : "text-muted-foreground")}>
      {value}
    </td>
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
