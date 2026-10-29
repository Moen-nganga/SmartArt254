import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const SITE = {
  url: "https://smartart254.org",
  name: "SmartArt254",
  locale: "en_KE",
  image: "/images/home/art-workshops.jpg",
  imageAlt: "Children and adults enjoying a SmartArt254 art workshop",
  description:
    "SmartArt254 brings hands-on art workshops, school art programmes and creative events to schools, families and groups across Kenya.",
};

interface RouteSeo {
  path: string;
  label: string;
  title: string;
  description: string;
  heading: string;
  intro: string;
  index: boolean;
  nav?: boolean;
  image?: string;
  imageAlt?: string;
  schema?: string;
  priority?: string;
  changefreq?: string;
  offers?: string[];
}

const routes: RouteSeo[] = [
  {
    path: "/",
    label: "Home",
    title: "SmartArt254 | Art Workshops, School Programmes & Events in Kenya",
    description:
      "SmartArt254 brings fun, hands-on art to schools, families and groups across Kenya, with workshops, school programmes, parties and events.",
    heading: "Art workshops, school programmes and creative events in Kenya",
    intro:
      "SmartArt254 brings hands-on art to schools, families, corporate teams and celebrations across Kenya.",
    index: true,
    nav: true,
    priority: "1.0",
    changefreq: "weekly",
  },
  {
    path: "/schools",
    label: "Schools",
    title: "School Art Programmes & Art Lessons in Kenya | SmartArt254",
    description:
      "Bring SmartArt254 to your school for art lessons, digital art classes, art challenges, competitions and school art fun days across Kenya.",
    heading: "Art programmes for schools",
    intro:
      "Art lessons, digital art classes, art challenges, competitions and fun days designed for schools in Kenya.",
    index: true,
    nav: true,
    image: "/images/schools/school-art-lessons.jpg",
    imageAlt: "Pupils taking part in a SmartArt254 school art lesson",
    priority: "0.9",
    changefreq: "monthly",
    offers: [
      "School Art Lessons",
      "Computer and Digital Art Lessons",
      "Art Challenge",
      "Art Competition",
      "School Art Fun Day",
    ],
  },
  {
    path: "/workshops",
    label: "Workshops",
    title: "Creative Art Workshops in Kenya | SmartArt254",
    description:
      "Join hands-on art workshops in Kenya: canvas painting, resin and eco art, bottle art, mirror art, slime making, tote bag painting and more.",
    heading: "Creative art workshops",
    intro:
      "Canvas painting, resin and eco art, bottle art, mirror art, cutout art, slime making, t-shirt and dera art, and tote bag painting.",
    index: true,
    nav: true,
    image: "/images/workshops/canvas-painting.jpg",
    imageAlt: "Participants painting on canvas at a SmartArt254 workshop",
    priority: "0.9",
    changefreq: "monthly",
    offers: [
      "Canvas Painting",
      "Resin and Eco Art",
      "Bottle Art",
      "Mirror Art",
      "Cutout Art",
      "Slime Making",
      "T-Shirt and Dera Art",
      "Tote Bag Painting",
    ],
  },
  {
    path: "/events",
    label: "Events",
    title: "Art Events for Birthdays, Teams & Weddings | SmartArt254",
    description:
      "Add creative fun to birthday parties, corporate team days, family days and weddings with SmartArt254 art experiences across Kenya.",
    heading: "Art experiences for events",
    intro:
      "Birthday parties, corporate team days, family days and weddings, made memorable with guided creative activities.",
    index: true,
    nav: true,
    image: "/images/events/family-days.jpg",
    imageAlt: "Families enjoying an art activity at a SmartArt254 event",
    priority: "0.9",
    changefreq: "monthly",
    offers: ["Birthday Parties", "Corporate Team Days", "Family Days", "Weddings"],
  },
  {
    path: "/highlights",
    label: "Highlights",
    title: "Highlights from Our Art Sessions | SmartArt254",
    description:
      "See highlights from SmartArt254 art workshops, school programmes and events across Kenya.",
    heading: "Highlights",
    intro: "Moments from SmartArt254 workshops, school programmes and events.",
    index: true,
    nav: true,
    priority: "0.6",
    changefreq: "weekly",
  },
  {
    path: "/book",
    label: "Book",
    title: "Book an Art Workshop, School Programme or Event | SmartArt254",
    description:
      "Book SmartArt254 for a school art programme, creative workshop, birthday party, team day or family event in Kenya.",
    heading: "Book SmartArt254",
    intro:
      "Request a school programme, workshop, party or event and our team will get back to you.",
    index: true,
    nav: true,
    schema: "ContactPage",
    priority: "0.9",
    changefreq: "monthly",
  },
  {
    path: "/blog",
    label: "Blog",
    title: "Blog: Creative Art Ideas, Tips & News | SmartArt254",
    description:
      "Read art ideas, creative tips and news from SmartArt254, the team behind art workshops, school programmes and events in Kenya.",
    heading: "SmartArt254 blog",
    intro: "Creative ideas, tips and news from the SmartArt254 team.",
    index: true,
    nav: true,
    schema: "CollectionPage",
    priority: "0.7",
    changefreq: "weekly",
  },
  {
    path: "/jobs",
    label: "Jobs",
    title: "Jobs & Opportunities | SmartArt254",
    description:
      "Explore job and opportunity listings at SmartArt254 and join the team making art fun for schools and families in Kenya.",
    heading: "Jobs and opportunities",
    intro: "Opportunities to join the SmartArt254 team.",
    index: true,
    schema: "CollectionPage",
    priority: "0.5",
    changefreq: "weekly",
  },
  {
    path: "/privacy",
    label: "Privacy",
    title: "Privacy Policy | SmartArt254",
    description:
      "How SmartArt254 collects, uses and protects your personal information.",
    heading: "Privacy policy",
    intro: "How SmartArt254 collects, uses and protects your personal information.",
    index: true,
    priority: "0.3",
    changefreq: "yearly",
  },
  {
    path: "/terms",
    label: "Terms",
    title: "Terms and Conditions | SmartArt254",
    description: "The terms and conditions for using the SmartArt254 website and services.",
    heading: "Terms and conditions",
    intro: "The terms and conditions for using the SmartArt254 website and services.",
    index: true,
    priority: "0.3",
    changefreq: "yearly",
  },
  {
    path: "/signin",
    label: "Sign in",
    title: "Sign In | SmartArt254",
    description: "Sign in to your SmartArt254 account.",
    heading: "Sign in",
    intro: "",
    index: false,
  },
  {
    path: "/signup",
    label: "Sign up",
    title: "Create an Account | SmartArt254",
    description: "Create your SmartArt254 account.",
    heading: "Sign up",
    intro: "",
    index: false,
  },
  {
    path: "/member",
    label: "Member",
    title: "My Account | SmartArt254",
    description: "Your SmartArt254 member area.",
    heading: "My account",
    intro: "",
    index: false,
  },
  {
    path: "/talk",
    label: "Talk",
    title: "Messages | SmartArt254",
    description: "Your SmartArt254 conversations.",
    heading: "Messages",
    intro: "",
    index: false,
  },
];

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const abs = (p: string) => `${SITE.url}${p}`;

const jsonLd = (r: RouteSeo) => {
  const url = abs(r.path);
  const orgId = `${SITE.url}/#organization`;
  const siteId = `${SITE.url}/#website`;
  const kenya = { "@type": "Country", name: "Kenya" };
  const graph: Record<string, unknown>[] = [
    {
      "@type": "Organization",
      "@id": orgId,
      name: SITE.name,
      url: `${SITE.url}/`,
      image: abs(SITE.image),
      description: SITE.description,
      areaServed: kenya,
    },
    {
      "@type": "WebSite",
      "@id": siteId,
      url: `${SITE.url}/`,
      name: SITE.name,
      inLanguage: "en-KE",
      publisher: { "@id": orgId },
    },
    {
      "@type": r.schema ?? "WebPage",
      "@id": `${url}#webpage`,
      url,
      name: r.title,
      description: r.description,
      inLanguage: "en-KE",
      isPartOf: { "@id": siteId },
      primaryImageOfPage: { "@type": "ImageObject", url: abs(r.image ?? SITE.image) },
    },
  ];
  if (r.path !== "/") {
    graph.push({
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${SITE.url}/` },
        { "@type": "ListItem", position: 2, name: r.label, item: url },
      ],
    });
  }
  if (r.offers?.length) {
    graph.push({
      "@type": "ItemList",
      name: r.heading,
      itemListElement: r.offers.map((name, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: { "@type": "Service", name, provider: { "@id": orgId }, areaServed: kenya },
      })),
    });
  }
  const json = JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(/</g, "\\u003c");
  return `<script type="application/ld+json">${json}</script>`;
};

const headBlock = (r: RouteSeo) => {
  const lines = [
    `<title>${esc(r.title)}</title>`,
    `<meta name="description" content="${esc(r.description)}" />`,
  ];
  if (!r.index) {
    lines.push('<meta name="robots" content="noindex, nofollow" />');
    return lines.join("\n    ");
  }
  const url = abs(r.path);
  const image = abs(r.image ?? SITE.image);
  const alt = esc(r.imageAlt ?? SITE.imageAlt);
  lines.push(
    '<meta name="robots" content="index, follow, max-image-preview:large" />',
    `<link rel="canonical" href="${url}" />`,
    '<meta property="og:type" content="website" />',
    `<meta property="og:site_name" content="${SITE.name}" />`,
    `<meta property="og:locale" content="${SITE.locale}" />`,
    `<meta property="og:title" content="${esc(r.title)}" />`,
    `<meta property="og:description" content="${esc(r.description)}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:image" content="${image}" />`,
    `<meta property="og:image:alt" content="${alt}" />`,
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${esc(r.title)}" />`,
    `<meta name="twitter:description" content="${esc(r.description)}" />`,
    `<meta name="twitter:image" content="${image}" />`,
    `<meta name="twitter:image:alt" content="${alt}" />`,
    jsonLd(r)
  );
  return lines.join("\n    ");
};

const fallback = (r: RouteSeo) => {
  if (!r.index) return "";
  const links = routes
    .filter((x) => x.index && x.nav)
    .map((x) => `<a href="${x.path}">${esc(x.label)}</a>`)
    .join(" ");
  const offers = r.offers?.length
    ? `<ul>${r.offers.map((o) => `<li>${esc(o)}</li>`).join("")}</ul>`
    : "";
  return `<noscript><main><h1>${esc(r.heading)}</h1><p>${esc(r.intro)}</p>${offers}<nav>${links}</nav></main></noscript>`;
};

const render = (template: string, r: RouteSeo) =>
  template
    .replace(/<title>[\s\S]*?<\/title>/, () => headBlock(r))
    .replace('<div id="root"></div>', () => `<div id="root"></div>\n    ${fallback(r)}`);

const sitemap = () => {
  const day = new Date().toISOString().slice(0, 10);
  const urls = routes
    .filter((r) => r.index)
    .map(
      (r) =>
        `  <url>\n    <loc>${abs(r.path === "/" ? "/" : r.path)}</loc>\n    <lastmod>${day}</lastmod>\n    <changefreq>${r.changefreq ?? "monthly"}</changefreq>\n    <priority>${r.priority ?? "0.5"}</priority>\n  </url>`
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
};

const seoPlugin = (): Plugin => ({
  name: "smartart254-seo",
  apply: "build",
  enforce: "post",
  generateBundle(_, bundle) {
    const entry = bundle["index.html"];
    if (!entry || entry.type !== "asset") return;
    const template = String(entry.source);
    for (const r of routes) {
      const html = render(template, r);
      if (r.path === "/") {
        entry.source = html;
      } else {
        this.emitFile({ type: "asset", fileName: `${r.path.slice(1)}/index.html`, source: html });
      }
    }
    this.emitFile({ type: "asset", fileName: "sitemap.xml", source: sitemap() });
  },
});

export default defineConfig({
  plugins: [react(), tailwindcss(), seoPlugin()],
});