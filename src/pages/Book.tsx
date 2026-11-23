import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import Layout from "../components/Layout";
import { bookingOptions } from "../data";
import { getUser } from "../auth";

interface FormState {
  name: string;
  email: string;
  phone: string;
  activity: string;
  eventDate: string;
  guests: string;
  message: string;
}

const empty: FormState = {
  name: "",
  email: "",
  phone: "",
  activity: bookingOptions[0],
  eventDate: "",
  guests: "10",
  message: "",
};

const whatsappLines = [
  { display: "0757 848 911", number: "254757848911" },
  { display: "0704 537 582", number: "254704537582" },
];

const rateCard = [
  { activity: "Primed Canvas Painting", price: 500 },
  { activity: "Original Canvas Painting", price: 700 },
  { activity: "Slime Making", price: 500 },
  { activity: "Tote Bag Art", price: 700 },
  { activity: "Cutout Painting", price: 600 },
  { activity: "Face Painting", price: 200 },
  { activity: "T-Shirt Art", price: 1200 },
  { activity: "Hat Art", price: 700 },
  { activity: "Pot Painting", price: 800 },
  { activity: "Bottle Art", price: 500 },
  { activity: "Mirror Art", price: 600 },
  { activity: "String Board Art", price: 800 },
];

const field =
  "mt-1 w-full rounded-xl border-2 border-ink/20 bg-white px-3 py-2.5 text-base text-ink placeholder:text-ink/40 focus:border-royal focus:outline-none focus:ring-2 focus:ring-royal/30";

export default function Book() {
  const [form, setForm] = useState<FormState>(empty);
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    getUser().then((user) => {
      if (!user) {
        window.location.href = "/signin?next=/book";
        return;
      }
      setForm((f) => ({ ...f, name: user.name, email: user.email ?? "", phone: user.phone ?? "" }));
      setChecking(false);
    });
  }, []);

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
        window.location.href = "/signin?next=/book";
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setStatus("error");
        return;
      }
      setForm(empty);
      setStatus("done");
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
      setStatus("error");
    }
  };

  const whatsappLink = (number: string) =>
    `https://wa.me/${number}?text=${encodeURIComponent(`Hi SmartArt254, I would like to book ${form.activity}.`)}`;

  const ready = form.name && form.email && form.phone && form.eventDate && Number(form.guests) > 0;

  if (checking) {
    return (
      <Layout>
        <p className="mx-auto max-w-xl px-5 py-16 text-xl font-semibold">Checking your account</p>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="mx-auto max-w-xl px-5 pb-14 pt-6">
        <h1 className="text-3xl font-extrabold sm:text-4xl">Book an activity</h1>
        <p className="mt-2 text-ink/80">Tell us what you have in mind and we will confirm a host for your date.</p>

        {status === "done" && (
          <p role="status" className="mt-5 rounded-xl bg-leaf px-4 py-3 font-semibold text-ink">
            Booking received. We will contact you to confirm.
          </p>
        )}
        {status === "error" && (
          <p role="alert" className="mt-5 rounded-xl bg-pink px-4 py-3 font-semibold text-white">
            {error}
          </p>
        )}

        <div className="mt-6 grid gap-4 rounded-3xl border border-ink/10 bg-white/80 p-5 shadow-xl backdrop-blur-sm sm:p-8">
          <label className="block font-semibold">
            Full name
            <input name="name" value={form.name} onChange={update} autoComplete="name" className={field} />
          </label>
          <label className="block font-semibold">
            Email
            <input name="email" type="email" value={form.email} onChange={update} autoComplete="email" className={field} />
          </label>
          <label className="block font-semibold">
            Phone
            <input name="phone" type="tel" value={form.phone} onChange={update} autoComplete="tel" className={field} />
          </label>
          <label className="block font-semibold">
            Activity
            <select name="activity" value={form.activity} onChange={update} className={field}>
              {bookingOptions.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block font-semibold">
              Date
              <input name="eventDate" type="date" value={form.eventDate} onChange={update} className={field} />
            </label>
            <label className="block font-semibold">
              Guests
              <input name="guests" type="number" min={1} value={form.guests} onChange={update} className={field} />
            </label>
          </div>
          <label className="block font-semibold">
            Notes
            <textarea name="message" rows={3} value={form.message} onChange={update} className={field} />
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={submit}
              disabled={!ready || status === "sending"}
              className="w-full rounded-full bg-sun px-6 py-3 text-lg font-bold text-ink disabled:opacity-50"
            >
              {status === "sending" ? "Sending booking" : "Send booking"}
            </button>
            <a
              href={whatsappLink(whatsappLines[0].number)}
              target="_blank"
              rel="noreferrer"
              className="w-full rounded-full border-2 border-ink px-6 py-3 text-center text-lg font-bold text-ink transition hover:bg-ink hover:text-white"
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
        <div className="mt-6 overflow-hidden rounded-3xl border border-ink/10 bg-white/80 shadow-xl backdrop-blur-sm">
          <div className="bg-ink px-5 py-4 text-white sm:px-8">
            <h2 className="text-2xl font-extrabold">Rate card</h2>
            <p className="text-sm text-white/80">Fun, creative, memorable experiences for every occasion</p>
          </div>
          <table className="w-full text-left text-base">
            <caption className="sr-only">SmartArt254 creative art activities and prices in Kenya shillings</caption>
            <thead>
              <tr className="border-b border-ink/15 text-sm uppercase tracking-wide text-ink/70">
                <th scope="col" className="px-5 py-3 font-bold sm:px-8">
                  Activity
                </th>
                <th scope="col" className="px-5 py-3 text-right font-bold sm:px-8">
                  Price (KES)
                </th>
              </tr>
            </thead>
            <tbody>
              {rateCard.map((row) => (
                <tr key={row.activity} className="border-b border-ink/10 last:border-b-0 odd:bg-ink/5">
                  <th scope="row" className="px-5 py-3 font-semibold sm:px-8">
                    {row.activity}
                  </th>
                  <td className="px-5 py-3 text-right font-extrabold text-royal sm:px-8">
                    {row.price.toLocaleString("en-KE")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </Layout>
  );
}