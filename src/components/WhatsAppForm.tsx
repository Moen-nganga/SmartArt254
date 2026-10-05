import { useState } from "react";
import type { ChangeEvent } from "react";
import { eventTypes, needOptions, whatsappNumber } from "../data";

const field = "mt-1 w-full rounded-xl border-2 border-white/60 bg-[#0f0b3a] px-3 py-3 text-base text-white";

export default function WhatsAppForm() {
  const [form, setForm] = useState({
    name: "",
    need: needOptions[0],
    eventType: eventTypes[0],
    date: "",
    people: "",
  });

  const update = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const send = () => {
    const text = `Hello SmartArt254, my name is ${form.name}. I need: ${form.need}. Type of event: ${form.eventType}. Date: ${form.date || "not decided yet"}. Number of people: ${form.people || "not sure yet"}.`;
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div className="mt-6 grid max-w-2xl gap-4 rounded-3xl border-2 border-white bg-ink p-6 sm:p-8">
      <label className="block text-lg font-semibold">
        Your name
        <input name="name" value={form.name} onChange={update} autoComplete="name" className={field} />
      </label>
      <label className="block text-lg font-semibold">
        What do you need?
        <select name="need" value={form.need} onChange={update} className={field}>
          {needOptions.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-lg font-semibold">
        Type of event
        <select name="eventType" value={form.eventType} onChange={update} className={field}>
          {eventTypes.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-lg font-semibold">
        Date
        <input name="date" type="date" value={form.date} onChange={update} className={field} />
      </label>
      <label className="block text-lg font-semibold">
        Number of people
        <input name="people" type="number" min={1} value={form.people} onChange={update} className={field} />
      </label>
      <button
        type="button"
        onClick={send}
        disabled={!form.name}
        className="rounded-full bg-sun px-6 py-3 text-lg font-bold text-ink disabled:opacity-50"
      >
        Send on WhatsApp
      </button>
    </div>
  );
}