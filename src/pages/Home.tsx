import Layout from "../components/Layout";
import Section from "../components/Section";
import WhatsAppForm from "../components/WhatsAppForm";
import { eventTypes, schoolOffers, workshopOffers } from "../data";
import { link } from "../navigate";

const dots = ["bg-pink", "bg-sun", "bg-leaf", "bg-royal", "bg-white"];

export default function Home() {
  return (
    <Layout>
      <section className="mx-auto max-w-6xl px-5 pb-16 pt-6 sm:px-10 sm:pt-14">
        <h1 className="max-w-4xl text-4xl font-extrabold leading-[1.05] sm:text-7xl">
          Art activities that people actually finish and take home.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-white/90 sm:text-xl">
          We bring hands-on art to schools, birthdays, weddings and family days across Kenya. Canvas painting, tote
          bags, T-shirts, resin, bottles, mirrors and more, all supplies and guidance included.
        </p>
        <div className="mt-7 flex gap-3" aria-hidden="true">
          {dots.map((d) => (
            <span key={d} className={`h-9 w-9 rounded-full ${d}`} />
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="/book" onClick={link("/book")} className="rounded-full bg-sun px-7 py-3 text-lg font-bold text-ink">
            Book an activity
          </a>
          <a
            href="/workshops"
            onClick={link("/workshops")}
            className="rounded-full border-2 border-white px-7 py-3 text-lg font-bold"
          >
            See what we do
          </a>
        </div>
      </section>

      <Section
        heading="For schools"
        intro="Programmes that fit the timetable and get every learner making."
        offers={schoolOffers}
        cta={false}
      />

      <Section
        heading="Art workshops and crafts"
        intro="Pick one activity or mix several in a single session."
        offers={workshopOffers}
        cta={false}
      />

      <section className="mx-auto max-w-6xl px-5 pb-14 sm:px-10">
        <h2 className="text-3xl font-bold sm:text-4xl">Events for every occasion</h2>
        <p className="mt-2 max-w-xl text-base text-white/85 sm:text-lg">
          We set up, guide the guests and keep it fun. Everyone leaves with something they made.
        </p>
        <ul className="mt-6 flex flex-wrap gap-3">
          {eventTypes.map((t) => (
            <li key={t} className="rounded-full border-2 border-white bg-ink px-6 py-2.5 text-base font-semibold sm:text-lg">
              {t}
            </li>
          ))}
        </ul>
      </section>

      <section id="contact" className="mx-auto max-w-6xl px-5 pb-16 sm:px-10">
        <h2 className="text-3xl font-bold sm:text-4xl">Book or ask a question</h2>
        <p className="mt-2 max-w-xl text-base text-white/85 sm:text-lg">
          Fill this in and it opens WhatsApp with your message ready to send.
        </p>
        <WhatsAppForm />
      </section>
    </Layout>
  );
}