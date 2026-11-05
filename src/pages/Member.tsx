import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import Footer from "../components/Footer";
import FeatureList from "../components/FeatureList";
import AdminBookings from "../components/AdminBookings";
import MyBookings from "../components/MyBookings";
import Chat from "../components/Chat";
import Notifications from "../components/Notifications";
import { eventOffers, needOptions, schoolOffers, workshopOffers } from "../data";
import { getUser, signOut } from "../auth";
import type { User } from "../auth";
import { link } from "../navigate";

type View = "welcome" | "services" | "book" | "mybookings" | "bookings" | "chat";

interface FormState {
  name: string;
  email: string;
  phone: string;
  activity: string;
  eventType: string;
  eventDate: string;
  guests: string;
  message: string;
}

const eventTypeOptions = ["School", "Kids birthday", "Adult birthday", "Wedding", "Family fun day", "Other"];

const dots = ["bg-pink", "bg-sun", "bg-leaf", "bg-royal"];

const whatsappLines = [
  { display: "0757 848 911", number: "254757848911" },
  { display: "0704 537 582", number: "254704537582" },
];

const field =
  "mt-2 w-full rounded-2xl border-2 border-ink/20 bg-white px-5 py-3.5 text-lg font-semibold text-ink placeholder:text-ink/40 focus:border-royal focus:outline-none focus:ring-2 focus:ring-royal/30";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

function Welcome({ user }: { user: User }) {
  return (
    <section className="py-10 sm:py-14">
      <h1 className="text-4xl font-extrabold leading-[1.05] sm:text-6xl">Welcome back, {user.name.split(" ")[0]}.</h1>
      <p className="mt-6 max-w-2xl text-lg text-ink/80 sm:text-xl">
        Ready for your next creative day? Browse what we offer, or send us your booking details and we will confirm a
        host for your date.
      </p>
      <div className="mt-8 flex gap-4" aria-hidden="true">
        {dots.map((d) => (
          <span key={d} className={`h-10 w-10 rounded-full ${d}`} />
        ))}
      </div>
    </section>
  );
}

function Sidebar({
  user,
  view,
  onNavigate,
  onSignOut,
}: {
  user: User;
  view: View;
  onNavigate: (view: View) => void;
  onSignOut: () => void;
}) {
  const outline = (v: View) =>
    `w-full rounded-full border-2 px-5 py-3 text-base font-bold transition ${
      view === v ? "border-ink bg-ink text-white" : "border-ink text-ink hover:bg-ink hover:text-white"
    }`;

  return (
    <aside className="lg:sticky lg:top-6 lg:self-start">
      <div className="rounded-3xl border border-ink/10 bg-white/80 p-6 shadow-xl backdrop-blur-sm">
        <p className="text-2xl font-extrabold">{user.name}</p>
        <div className="mt-5 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => onNavigate("book")}
            className="w-full rounded-full bg-sun px-5 py-3 text-base font-bold text-ink transition hover:brightness-105"
          >
            Book an activity
          </button>
          <button type="button" onClick={() => onNavigate("chat")} className={outline("chat")}>
            {user.isAdmin ? "Talk to a user" : "Talk to a host"}
          </button>
          <button type="button" onClick={() => onNavigate("services")} className={outline("services")}>
            Browse services
          </button>
        </div>
        <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-ink/15 pt-5">
          <div>
            <dt className="text-sm text-ink/70">Account</dt>
            <dd className="mt-1 text-base font-bold">{user.isAdmin ? "Admin" : "Member"}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-sm text-ink/70">Contact</dt>
            <dd className="mt-1 truncate text-base font-bold">{user.email ?? user.phone}</dd>
          </div>
        </dl>
        <div className="mt-5 border-t border-ink/15 pt-5">
          <button
            type="button"
            onClick={onSignOut}
            className="w-full rounded-full border-2 border-ink px-5 py-2.5 text-base font-bold text-ink transition hover:bg-ink hover:text-white"
          >
            Sign out
          </button>
        </div>
      </div>
      <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 px-2 text-sm text-ink/70">
        <a href="/privacy" onClick={link("/privacy")} className="hover:text-pink">
          Privacy
        </a>
        <a href="/terms" onClick={link("/terms")} className="hover:text-pink">
          Terms
        </a>
        <span>© {new Date().getFullYear()} SmartArt254</span>
      </p>
    </aside>
  );
}

function Services() {
  return (
    <>
      <FeatureList
        heading="For schools"
        intro="Programmes that fit the timetable and get every learner making."
        label="Schools"
        folder="schools"
        offers={schoolOffers}
      />
      <FeatureList
        heading="Art workshops and crafts"
        intro="Pick one activity or mix several in a single session."
        label="Workshops"
        folder="workshops"
        offers={workshopOffers}
      />
      <FeatureList
        heading="Events for every occasion"
        intro="We set up, guide the guests and keep it fun. Everyone leaves with something they made."
        label="Events"
        folder="events"
        offers={eventOffers}
      />
    </>
  );
}

function BookingForm({ user }: { user: User }) {
  const blank: FormState = {
    name: user.name,
    email: user.email ?? "",
    phone: user.phone ?? "",
    activity: needOptions[0],
    eventType: eventTypeOptions[0],
    eventDate: "",
    guests: "10",
    message: "",
  };

  const [form, setForm] = useState<FormState>(blank);
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const today = new Date().toISOString().slice(0, 10);

  const update = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async () => {
    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.status === 401) {
        window.location.href = "/signin?next=/member";
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setStatus("error");
        return;
      }
      setForm(blank);
      setStatus("done");
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
      setStatus("error");
    }
  };

  const whatsappLink = (number: string) =>
    `https://wa.me/${number}?text=${encodeURIComponent(`Hi SmartArt254, I would like to book ${form.activity}.`)}`;

  const ready = form.name && form.email && form.phone && form.eventDate && Number(form.guests) > 0;

  return (
    <section className="mx-auto flex w-full max-w-xl flex-col items-center py-8 sm:py-12">
      <h1 className="text-center text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
        Book an activity
      </h1>
      <p className="mt-4 max-w-md text-center text-lg font-semibold leading-relaxed text-ink/80 sm:text-xl">
        Tell us what you have in mind and we will confirm a host for your date.
      </p>

      <div className="mt-10 w-full rounded-3xl border border-ink/10 bg-white/80 p-6 shadow-xl backdrop-blur-sm sm:p-10">
        {status === "done" && (
          <p role="status" className="mb-5 rounded-xl bg-leaf px-4 py-3 font-semibold text-ink">
            Booking received. We will contact you to confirm.
          </p>
        )}
        {status === "error" && (
          <p role="alert" className="mb-5 rounded-xl bg-pink px-4 py-3 font-semibold text-white">
            {error}
          </p>
        )}

        <div className="grid gap-5">
          <label className="block text-base font-bold">
            Full name
            <input name="name" value={form.name} onChange={update} autoComplete="name" className={field} />
          </label>
          <label className="block text-base font-bold">
            Email
            <input name="email" type="email" value={form.email} onChange={update} autoComplete="email" className={field} />
          </label>
          <label className="block text-base font-bold">
            Phone
            <input
              name="phone"
              type="tel"
              value={form.phone}
              onChange={update}
              autoComplete="tel"
              placeholder="0712 345 678"
              className={field}
            />
          </label>
          <label className="block text-base font-bold">
            What do you need?
            <select name="activity" value={form.activity} onChange={update} className={field}>
              {needOptions.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-base font-bold">
            Type of event
            <select name="eventType" value={form.eventType} onChange={update} className={field}>
              {eventTypeOptions.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="block text-base font-bold">
              Date
              <input name="eventDate" type="date" min={today} value={form.eventDate} onChange={update} className={field} />
            </label>
            <label className="block text-base font-bold">
              Guests
              <input name="guests" type="number" min={1} value={form.guests} onChange={update} className={field} />
            </label>
          </div>
          <label className="block text-base font-bold">
            Notes
            <textarea
              name="message"
              rows={3}
              value={form.message}
              onChange={update}
              placeholder="Venue, theme or anything else we should know"
              className={field}
            />
          </label>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={submit}
              disabled={!ready || status === "sending"}
              className="w-full rounded-full bg-sun px-6 py-4 text-lg font-bold text-ink transition hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-royal/60 disabled:opacity-50"
            >
              {status === "sending" ? "Sending booking" : "Send booking"}
            </button>
            <a
              href={whatsappLink(whatsappLines[0].number)}
              target="_blank"
              rel="noreferrer"
              className="w-full rounded-full border-2 border-ink px-6 py-4 text-center text-lg font-bold text-ink transition hover:bg-ink hover:text-white focus:outline-none focus:ring-2 focus:ring-royal/60"
            >
              Chat on WhatsApp
            </a>
          </div>
          <p className="text-center text-base font-semibold text-ink/70">
            WhatsApp us on{" "}
            {whatsappLines.map((line, i) => (
              <span key={line.number}>
                {i > 0 ? " or " : ""}
                <a
                  href={whatsappLink(line.number)}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-royal hover:text-pink"
                >
                  {line.display}
                </a>
              </span>
            ))}
          </p>
        </div>
      </div>
    </section>
  );
}

export default function Member() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<View>("welcome");

  useEffect(() => {
    getUser().then((found) => {
      if (!found) {
        window.location.href = "/signin?next=/member";
        return;
      }
      setUser(found);
    });
  }, []);

  function show(next: View) {
    setView(next);
    window.scrollTo(0, 0);
  }

  async function handleSignOut() {
    await signOut();
    window.location.href = "/";
  }

  const tabs: { view: View; label: string }[] = [
    { view: "services", label: "Services" },
    { view: "book", label: "Make a Booking" },
    { view: "mybookings", label: "Bookings made" },
  ];
  if (user) tabs.push({ view: "chat", label: user.isAdmin ? "Talk to a user" : "Talk to a host" });
  if (user?.isAdmin) tabs.push({ view: "bookings", label: "See bookings" });

  const tabClass = (active: boolean) =>
    `shrink-0 rounded-full px-5 py-2.5 text-base font-bold transition sm:text-lg ${
      active ? "bg-ink text-white" : "text-ink hover:bg-ink/10"
    }`;

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip">
      <header className="flex w-full items-center justify-between gap-4 border-b border-ink/15 px-5 py-4 sm:px-10">
        <button type="button" onClick={() => show("welcome")} className="text-3xl font-extrabold leading-none tracking-tight sm:text-4xl">
          Smart<span className="text-pink">Art</span>254
        </button>
        {user && <Notifications />}
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-5 sm:px-10">
        {!user ? (
          <p className="py-16 text-xl font-semibold">Loading</p>
        ) : (
          <>
            <div className="flex items-center gap-5 pt-8 sm:gap-7 sm:pt-10">
              <button
                type="button"
                onClick={() => show("welcome")}
                aria-label="Back to overview"
                className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-royal text-3xl font-extrabold text-white sm:h-28 sm:w-28 sm:text-5xl"
              >
                {initials(user.name)}
              </button>
              <div className="min-w-0">
                <h2 className="truncate text-3xl font-extrabold sm:text-5xl">{user.name}</h2>
                <p className="mt-1 truncate text-base font-semibold text-ink/70 sm:text-lg">{user.email ?? user.phone}</p>
              </div>
            </div>

            <nav
              aria-label="Main"
              className="mt-6 flex items-center gap-2 overflow-x-auto border-b border-ink/15 pb-4 sm:mt-8"
            >
              <a href="/" onClick={link("/")} className={tabClass(false)}>
                Home
              </a>
              {tabs.map((t) => (
                <button
                  key={t.view}
                  type="button"
                  onClick={() => show(t.view)}
                  aria-current={view === t.view ? "page" : undefined}
                  className={tabClass(view === t.view)}
                >
                  {t.label}
                </button>
              ))}
            </nav>

            <div className="grid gap-10 pt-4 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-12 lg:pt-6">
              <div className="min-w-0">
                {view === "welcome" ? (
                  <Welcome user={user} />
                ) : view === "services" ? (
                  <Services />
                ) : view === "mybookings" ? (
                  <MyBookings onBook={() => show("book")} />
                ) : view === "chat" ? (
                  <Chat user={user} />
                ) : view === "bookings" && user.isAdmin ? (
                  <AdminBookings />
                ) : (
                  <BookingForm user={user} />
                )}
              </div>
              <Sidebar user={user} view={view} onNavigate={show} onSignOut={handleSignOut} />
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}