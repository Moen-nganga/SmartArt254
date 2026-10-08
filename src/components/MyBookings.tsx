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

function day(value: string, withWeekday: boolean) {
  return new Date(value.length === 10 ? `${value}T00:00:00` : value).toLocaleDateString("en-GB", {
    weekday: withWeekday ? "short" : undefined,
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function MyBookings({ onBook }: { onBook: () => void }) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/bookings?mine=1")
      .then(async (res) => {
        if (res.status === 401) {
          window.location.href = "/signin?next=/member";
          return;
        }
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error ?? "Could not load your bookings.");
        setBookings(data.bookings);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

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

  return (
    <section className="mx-auto max-w-6xl px-5 py-12 sm:px-10 sm:py-16">
      <h1 className="text-4xl font-extrabold leading-tight sm:text-6xl">Bookings made</h1>
      <p className="mt-3 max-w-2xl text-lg text-ink/80 sm:text-xl">
        Every activity you have booked with SmartArt254, newest first.
      </p>

      {error && (
        <p role="alert" className="mt-6 rounded-xl bg-pink px-4 py-3 font-semibold text-white">
          {error}
        </p>
      )}

      {loading ? (
        <p className="mt-10 text-xl font-semibold">Loading your bookings</p>
      ) : bookings.length === 0 ? (
        <div className="mt-10">
          <p className="text-xl font-semibold text-ink/70">You have not made any bookings yet.</p>
          <button
            type="button"
            onClick={onBook}
            className="mt-5 rounded-full bg-sun px-7 py-3 text-lg font-bold text-ink"
          >
            Book an activity
          </button>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {bookings.map((b) => (
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
                  <dd className="font-bold text-royal">{b.phone}</dd>
                </div>
                <div className="min-w-0">
                  <dt className="font-semibold text-ink/60">Email</dt>
                  <dd className="truncate font-bold text-royal">{b.email}</dd>
                </div>
              </dl>

              {b.message && (
                <p className="mt-4 rounded-2xl bg-ink/5 px-4 py-3 text-base text-ink/90">{b.message}</p>
              )}

              <div className="mt-5 flex flex-wrap gap-3">
                {confirming === b.id ? (
                  <>
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
                  </>
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