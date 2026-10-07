import Layout from "./Layout";

interface Props {
  title: string;
  intro: string;
  sections: { heading: string; body: string }[];
}

export default function TextPage({ title, intro, sections }: Props) {
  return (
    <Layout>
      <article className="mx-auto max-w-3xl px-5 pb-16 pt-4 sm:px-10">
        <h1 className="text-4xl font-extrabold sm:text-6xl">{title}</h1>
        <p className="mt-3 text-lg text-ink/80 sm:text-xl">{intro}</p>
        <div className="mt-10 grid gap-8">
          {sections.map((s) => (
            <section key={s.heading}>
              <h2 className="text-2xl font-bold">{s.heading}</h2>
              <p className="mt-2 text-lg leading-relaxed text-ink/80">{s.body}</p>
            </section>
          ))}
        </div>
      </article>
    </Layout>
  );
}