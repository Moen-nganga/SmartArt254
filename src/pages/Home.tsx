import Layout from "../components/Layout";
import Highlight from "../components/Highlight";
import Icon from "../components/Icon";
import Photo from "../components/Photo";
import Reveal from "../components/Reveal";
import { whatsappNumber } from "../data";
import { link } from "../navigate";

const dots = ["bg-pink", "bg-sun", "bg-leaf", "bg-royal", "bg-white"];

const facts = [
  { title: "Across Kenya", text: "Schools, homes and venues" },
  { title: "Supplies included", text: "Nothing to buy or bring" },
  { title: "Guided by a host", text: "Step by step for everyone" },
];

const services = [
  {
    icon: "school" as const,
    tile: "bg-pink text-white",
    title: "School programmes",
    text: "Art lessons, digital art, fun days, challenges and competitions for every learner.",
    path: "/schools",
    cta: "See school programmes",
  },
  {
    icon: "palette" as const,
    tile: "bg-sun text-ink",
    title: "Art workshops",
    text: "Canvas, slime, resin, tote bags, T-shirts, bottles, mirrors and cutout art.",
    path: "/workshops",
    cta: "See workshops",
  },
  {
    icon: "calendar" as const,
    tile: "bg-leaf text-ink",
    title: "Events and parties",
    text: "Birthdays, weddings, family days and team events, hosted from set up to finish.",
    path: "/events",
    cta: "See events",
  },
  {
    icon: "gift" as const,
    tile: "bg-royal text-white",
    title: "Supplies included",
    text: "Our hosts bring the materials and guide every guest, so everyone leaves with something they made.",
    path: "/book",
    cta: "Book now",
  },
];

export default function Home() {
  return (
    <Layout>
      <section className="mx-auto max-w-6xl px-5 pb-20 pt-6 sm:px-10 sm:pt-14">
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

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-24 sm:px-10 md:grid-cols-2 md:gap-16">
        <Reveal from="left">
          <p className="flex items-center gap-3 text-sm font-semibold uppercase tracking-widest text-white/75">
            <span className="h-1 w-8 rounded-full bg-sun" />
            Who we are
          </p>
          <h2 className="mt-4 text-3xl font-extrabold leading-tight sm:text-5xl">
            A team of art hosts who <Highlight>love seeing people create.</Highlight>
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-white/90">
            SmartArt254 brings hands-on art sessions to schools, birthdays, weddings and family days across Kenya. Our
            hosts set up, guide every guest step by step and bring all the supplies, so you only need to show up and
            enjoy making something.
          </p>
          <ul className="mt-6 grid grid-cols-1 gap-4 border-t border-white/25 pt-6 sm:grid-cols-3">
            {facts.map((f) => (
              <li key={f.title}>
                <p className="font-bold">{f.title}</p>
                <p className="text-sm text-white/75">{f.text}</p>
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal from="right" delay={150}>
          <Photo
            src="/images/home/who-we-are.jpg"
            alt="SmartArt254 host guiding guests through an art session"
            className="aspect-[4/3] w-full shadow-2xl"
          />
        </Reveal>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-24 sm:px-10">
        <Reveal from="up">
          <h2 className="mx-auto max-w-3xl text-center text-3xl font-extrabold leading-tight sm:text-5xl">
            Everything you need for a creative day, <Highlight>all in one place.</Highlight>
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((s, i) => (
            <Reveal key={s.title} from="up" delay={i * 120}>
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${s.tile}`}>
                <Icon name={s.icon} />
              </div>
              <h3 className="mt-5 text-xl font-bold">{s.title}</h3>
              <p className="mt-2 text-base leading-relaxed text-white/85">{s.text}</p>
              <a href={s.path} onClick={link(s.path)} className="mt-3 inline-block font-bold text-sun">
                {s.cta}
              </a>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-16 sm:px-10">
        <Reveal from="up">
          <div className="rounded-3xl border-2 border-white bg-ink p-8 text-center sm:p-14">
            <h2 className="text-3xl font-extrabold sm:text-5xl">Ready to make something?</h2>
            <p className="mx-auto mt-3 max-w-xl text-lg text-white/85">
              Tell us your date and group size and we will confirm a host.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <a href="/book" onClick={link("/book")} className="rounded-full bg-sun px-7 py-3 text-lg font-bold text-ink">
                Book an activity
              </a>
              <a
                href={`https://wa.me/${whatsappNumber}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border-2 border-white px-7 py-3 text-lg font-bold"
              >
                Chat on WhatsApp
              </a>
            </div>
          </div>
        </Reveal>
      </section>
    </Layout>
  );
}