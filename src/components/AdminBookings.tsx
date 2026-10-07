import { useEffect, useState } from "react";

type Status = "pending" | "waiting_confirmation" | "confirmed";

interface Booking {
  id: number;
  name: string;
  email: string;
  phone: string;
  activity: string;
  eventType: string | null;
  eventDate: string;
  guests: number;
  message: string | null;
  status: Status;
  createdAt: string;
}

const order: Status[] = ["pending", "waiting_confirmation", "confirmed"];

const labels: Record<Status, string> = {
  pending: "Pending",
  waiting_confirmation: "Waiting confirmation",
  confirmed: "Confirmed",
};

const badges: Record<Status, string> = {
  pending: "bg-sun text-ink",
  waiting_confirmation: "bg-royal text-white",
  confirmed: "bg-leaf text-ink",
};

const select =
  "mt-1 w-full rounded-2xl border-2 border-ink/20 bg-white px-4 py-2.5 text-base font-semibold text-ink focus:border-royal focus:outline-none focus:ring-2 focus:ring-royal/30";

function day(value: string, withWeekday: boolean) {
  return new Date(value.length === 10 ? `${value}T00:00:00` : value).toLocaleDateString("en-GB", {
    weekday: withWeekday ? "short" : undefined,
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<"all" | Status>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/bookings")
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error ?? "Could not load bookings.");
        setBookings(data.bookings);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function changeStatus(id: number, status: Status) {
    const previous = bookings;
    setBookings(bookings.map((b) => (b.id === id ? { ...b, status } : b)));
    setError("");
    try {
      const res = await fetch("/api/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setBookings(previous);
      setError("Could not update that booking. Please try again.");
    }
  }

  async function removeBooking(id: number) {
    const previous = bookings;
    setBookings(bookings.filter((b) => b.id !== id));
    setConfirming(null);
    setError("");
    try {
      const res = await fetch(`/api/bookings?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
    } catch {
      setBookings(previous);
      setError("Could not delete that booking. Please try again.");
    }
  }

  const count = (s: Status) => bookings.filter((b) => b.status === s).length;
  const shown = filter === "all" ? bookings : bookings.filter((b) => b.status === filter);

  const tabs: { key: "all" | Status; label: string; total: number }[] = [
    { key: "all", label: "All", total: bookings.length },
    ...order.map((s) => ({ key: s, label: labels[s], total: count(s) })),
  ];

  return (
    <section className="mx-auto max-w-6xl px-5 py-12 sm:px-10 sm:py-16">
      <h1 className="text-4xl font-extrabold leading-tight sm:text-6xl">Booking requests</h1>
      <p className="mt-3 max-w-2xl text-lg text-ink/80 sm:text-xl">
        Every request from the site, newest first. Change a status as you work through each one.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setFilter(t.key)}
            aria-pressed={filter === t.key}
            className={`rounded-full border-2 border-ink px-5 py-2 text-base font-bold transition ${
              filter === t.key ? "bg-ink text-white" : "text-ink hover:bg-ink hover:text-white"
            }`}
          >
            {t.label} ({t.total})
          </button>
        ))}
      </div>

      {error && (
        <p role="alert" className="mt-6 rounded-xl bg-pink px-4 py-3 font-semibold text-white">
          {error}
        </p>
      )}

      {loading ? (
        <p className="mt-10 text-xl font-semibold">Loading bookings</p>
      ) : shown.length === 0 ? (
        <p className="mt-10 text-xl font-semibold text-ink/70">No bookings to show here yet.</p>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {shown.map((b) => (
            <article key={b.id} className="rounded-3xl border border-ink/10 bg-white/80 p-6 shadow-xl backdrop-blur-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-extrabold">{b.name}</h2>
                  <p className="text-lg font-bold text-royal">{b.activity}</p>
                </div>
                <span className={`rounded-full px-4 py-1.5 text-sm font-bold ${badges[b.status]}`}>{labels[b.status]}</span>
              </div>

              <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 text-base">
                <div>
                  <dt className="font-semibold text-ink/60">Event date</dt>
                  <dd className="font-bold">{day(b.eventDate, true)}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-ink/60">Guests</dt>
                  <dd className="font-bold">{b.guests}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-ink/60">Type of event</dt>
                  <dd className="font-bold">{b.eventType ?? "Not given"}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-ink/60">Requested</dt>
                  <dd className="font-bold">{day(b.createdAt, false)}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-ink/60">Phone</dt>
                  <dd className="font-bold">
                    <a href={`tel:${b.phone}`} className="text-royal hover:text-pink">
                      {b.phone}
                    </a>
                  </dd>
                </div>
                <div className="min-w-0">
                  <dt className="font-semibold text-ink/60">Email</dt>
                  <dd className="truncate font-bold">
                    <a href={`mailto:${b.email}`} className="text-royal hover:text-pink">
                      {b.email}
                    </a>
                  </dd>
                </div>
              </dl>

              {b.message && (
                <p className="mt-4 rounded-2xl bg-ink/5 px-4 py-3 text-base text-ink/90">{b.message}</p>
              )}

              <div className="mt-5 flex flex-wrap items-end gap-4">
                <label className="block min-w-[12rem] flex-1 text-base font-bold">
                  Mark as
                  <select
                    value={b.status}
                    onChange={(e) => changeStatus(b.id, e.target.value as Status)}
                    className={select}
                  >
                    {order.map((s) => (
                      <option key={s} value={s}>
                        {labels[s]}
                      </option>
                    ))}
                  </select>
                </label>
                {confirming === b.id ? (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => removeBooking(b.id)}
                      className="rounded-full bg-pink px-5 py-2.5 text-base font-bold text-white"
                    >
                      Yes, delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirming(null)}
                      className="rounded-full border-2 border-ink px-5 py-2.5 text-base font-bold text-ink transition hover:bg-ink hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirming(b.id)}
                    className="rounded-full border-2 border-pink px-5 py-2.5 text-base font-bold text-pink transition hover:bg-pink hover:text-white"
                  >
                    Delete
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}