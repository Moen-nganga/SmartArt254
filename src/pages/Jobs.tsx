import Layout from "../components/Layout";
import Highlight from "../components/Highlight";
import Icon from "../components/Icon";
import Reveal from "../components/Reveal";
import WhatsAppMenu from "../components/WhatsAppMenu";
import { link } from "../navigate";

const dots = ["bg-pink", "bg-sun", "bg-leaf", "bg-royal"];

const tiles = [
  "bg-pink text-white",
  "bg-sun text-ink",
  "bg-leaf text-ink",
  "bg-royal text-white",
];

const jobs = [
  {
    icon: "palette" as const,
    title: "Art Host",
    type: "Part time",
    location: "Nairobi and surrounding areas",
    text: "Lead hands-on art sessions at birthdays, weddings and family days. You set up, guide every guest step by step and keep the mood fun.",
    needs: ["Confident with groups", "Experience in painting or crafts", "Reliable and punctual"],
  },
  {
    icon: "school" as const,
    title: "School Art Facilitator",
    type: "Part time",
    location: "Schools across Kenya",
    text: "Deliver art lessons, art fun days and competitions to learners of different ages, from simple drawing to canvas painting.",
    needs: ["Patience with children", "Art or education background", "Able to plan a lesson"],
  },
  {
    icon: "palette" as const,
    title: "Resin and Eco Art Instructor",
    type: "Contract",
    location: "Nairobi",
    text: "Teach resin art, recycled material projects and bottle and mirror art in workshops for groups and corporate teams.",
    needs: ["Resin or upcycling skills", "Safe handling of materials", "Clear step by step teaching"],
  },
  {
    icon: "gift" as const,
    title: "Digital Art Tutor",
    type: "Part time",
    location: "Schools and online",
    text: "Introduce learners to drawing and design on tablets and computers, with fun projects they can finish and share.",
    needs: ["Digital illustration skills", "Comfortable with tablets", "Friendly teaching style"],
  },
  {
    icon: "calendar" as const,
    title: "Workshop Assistant",
    type: "Casual",
    location: "Event days",
    text: "Help our hosts set up, hand out supplies, support guests during the session and pack up afterwards.",
    needs: ["Energetic and helpful", "Available on weekends", "No experience required"],
  },
  {
    icon: "gift" as const,
    title: "Creative Content Creator",
    type: "Contract",
    location: "Nairobi",
    text: "Photograph and film our sessions and artwork, and turn them into posts and short videos for our social channels.",
    needs: ["Photo and video skills", "Basic editing", "An eye for colour"],
  },
];

export default function Jobs() {
  return (
    <Layout>
      <section className="mx-auto max-w-6xl px-5 pb-16 pt-6 sm:px-10 sm:pt-14">
        <p className="flex items-center gap-3 text-sm font-semibold uppercase tracking-widest text-ink/70">
          <span className="h-1 w-8 rounded-full bg-sun" />
          Jobs
        </p>
        <h1 className="mt-4 max-w-4xl text-4xl font-extrabold leading-[1.05] sm:text-7xl">
          Make art your <Highlight>day job.</Highlight>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-ink/80 sm:text-xl">
          Join the SmartArt254 team and help people across Kenya create something they are proud to take home. Have a
          look at the roles below and get in touch.
        </p>
        <div className="mt-7 flex gap-3" aria-hidden="true">
          {dots.map((d) => (
            <span key={d} className={`h-9 w-9 rounded-full ${d}`} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-24 sm:px-10">
        <div className="grid gap-8 md:grid-cols-2">
          {jobs.map((j, i) => (
            <Reveal key={j.title} from="up" delay={(i % 2) * 120}>
              <article className="flex h-full flex-col rounded-3xl border border-ink/10 bg-white/80 p-7 shadow-xl backdrop-blur-sm sm:p-9">
                <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${tiles[i % tiles.length]}`}>
                  <Icon name={j.icon} />
                </div>
                <h2 className="mt-5 text-3xl font-bold">{j.title}</h2>
                <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm font-semibold uppercase tracking-widest text-ink/70">
                  <span>{j.type}</span>
                  <span aria-hidden="true">/</span>
                  <span>{j.location}</span>
                </p>
                <p className="mt-4 text-lg leading-relaxed text-ink/80">{j.text}</p>
                <ul className="mt-5 grid gap-2 border-t border-ink/15 pt-5">
                  {j.needs.map((n) => (
                    <li key={n} className="flex items-center gap-3 text-base font-semibold">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-sun" />
                      {n}
                    </li>
                  ))}
                </ul>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-16 sm:px-10">
        <Reveal from="up">
          <div className="rounded-3xl bg-ink p-8 text-center text-white shadow-2xl sm:p-14">
            <h2 className="text-3xl font-extrabold sm:text-5xl">Interested in joining us?</h2>
            <p className="mx-auto mt-3 max-w-xl text-lg text-white/85">
              Tell us which role you like and a little about your art experience, and we will get back to you.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <WhatsAppMenu
                label="Apply on WhatsApp"
                buttonClassName="rounded-full bg-sun px-7 py-3 text-lg font-bold text-ink"
                menuClassName="left-1/2 -translate-x-1/2"
              />
              <a
                href="/"
                onClick={link("/")}
                className="rounded-full border-2 border-white px-7 py-3 text-lg font-bold text-white transition hover:bg-white/10"
              >
                Back to home
              </a>
            </div>
          </div>
        </Reveal>
      </section>
    </Layout>
  );
}