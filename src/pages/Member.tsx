import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import Footer from "../components/Footer";
import FeatureList from "../components/FeatureList";
import AdminBookings from "../components/AdminBookings";
import MyBookings from "../components/MyBookings";
import { eventOffers, needOptions, schoolOffers, workshopOffers } from "../data";
import { getUser, signOut } from "../auth";
import type { User } from "../auth";
import { link } from "../navigate";

type View = "welcome" | "services" | "book" | "mybookings" | "bookings";

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

function Welcome({
  user,
  onNavigate,
  onSignOut,
}: {
  user: User;
  onNavigate: (view: View) => void;
  onSignOut: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <section className="flex flex-1 flex-col items-center justify-center px-5 py-12 text-center sm:px-10">
        <h1 className="max-w-5xl text-5xl font-extrabold leading-[1.05] sm:text-8xl">
          Welcome back, {user.name.split(" ")[0]}.
        </h1>
        <p className="mt-8 max-w-3xl text-xl text-ink/80 sm:text-2xl">
          Ready for your next creative day? Browse what we offer, or send us your booking details and we will confirm
          a host for your date.
        </p>
        <div className="mt-9 flex justify-center gap-4" aria-hidden="true">
          {dots.map((d) => (
            <span key={d} className={`h-11 w-11 rounded-full ${d}`} />
          ))}
        </div>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <button
            type="button"
            onClick={() => onNavigate("book")}
            className="rounded-full bg-sun px-9 py-4 text-xl font-bold text-ink"
          >
            Book an activity
          </button>
          <button
            type="button"
            onClick={() => onNavigate("services")}
            className="rounded-full border-2 border-ink px-9 py-4 text-xl font-bold text-ink transition hover:bg-ink hover:text-white"
          >
            Browse services
          </button>
        </div>
      </section>

      <div className="flex justify-end px-5 pb-8 sm:px-10">
        <div className="flex w-full max-w-md flex-wrap items-center justify-between gap-4 rounded-3xl border border-ink/10 bg-white/80 p-6 shadow-xl backdrop-blur-sm">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-ink/70">Signed in as</p>
            <p className="mt-1 text-xl font-bold">{user.name}</p>
            <p className="text-base text-ink/80">{user.email}</p>
          </div>
          <button
            type="button"
            onClick={onSignOut}
            className="rounded-full border-2 border-ink px-6 py-2.5 text-base font-bold text-ink transition hover:bg-ink hover:text-white"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
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
    email: user.email,
    phone: "",
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
    <section className="mx-auto flex w-full max-w-xl flex-col items-center px-5 py-12 sm:py-16">
      <h1 className="text-center text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
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

  const tab = (v: View) => (view === v ? "text-pink" : "hover:text-pink");

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip">
      <header className="flex w-full flex-wrap items-center justify-between gap-x-8 gap-y-2 border-b border-ink/15 px-5 py-5 sm:px-10 sm:py-7">
        <button
          type="button"
          onClick={() => show("welcome")}
          className="text-4xl font-extrabold leading-none tracking-tight sm:text-6xl"
        >
          Smart<span className="text-pink">Art</span>254
        </button>
        <nav aria-label="Main" className="flex flex-wrap items-center gap-5 text-lg font-semibold sm:gap-10 sm:text-2xl">
          <a href="/" onClick={link("/")} className="hover:text-pink">
            Home
          </a>
          <button
            type="button"
            onClick={() => show("services")}
            aria-current={view === "services" ? "page" : undefined}
            className={tab("services")}
          >
            Services
          </button>
          <button
            type="button"
            onClick={() => show("book")}
            aria-current={view === "book" ? "page" : undefined}
            className={tab("book")}
          >
            Make a Booking
          </button>
          <button
            type="button"
            onClick={() => show("mybookings")}
            aria-current={view === "mybookings" ? "page" : undefined}
            className={tab("mybookings")}
          >
            Bookings made
          </button>
          {user?.isAdmin && (
            <button
              type="button"
              onClick={() => show("bookings")}
              aria-current={view === "bookings" ? "page" : undefined}
              className={tab("bookings")}
            >
              See bookings
            </button>
          )}
        </nav>
      </header>

      <main className={`flex-1 ${view === "welcome" ? "flex flex-col" : ""}`}>
        {!user ? (
          <p className="mx-auto w-full max-w-6xl px-5 py-16 text-xl font-semibold sm:px-10">Loading</p>
        ) : view === "welcome" ? (
          <Welcome user={user} onNavigate={show} onSignOut={handleSignOut} />
        ) : view === "services" ? (
          <Services />
        ) : view === "mybookings" ? (
          <MyBookings onBook={() => show("book")} />
        ) : view === "bookings" && user.isAdmin ? (
          <AdminBookings />
        ) : (
          <BookingForm user={user} />
        )}
      </main>

      <Footer />
    </div>
  );
}