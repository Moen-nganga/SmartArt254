export type Accent = "pink" | "sun" | "leaf" | "royal";

export interface Offer {
  title: string;
  text: string;
  accent: Accent;
}

export const schoolOffers: Offer[] = [
  { title: "School art lessons", text: "We provide weekly or termly art classes fixed around your curriculum, to suit the learners needs.", accent: "pink" },
  { title: "Computer and digital art lessons", text: "We also help learners create digital art on computers while helping them building basic computer skills.", accent: "sun" },
  { title: "School art fun day", text: "A whole organized school event of stations, colour and games for kids of all ages to create, explore and enjoy", accent: "leaf" },
  { title: "Art challenge", text: "We also provide themed classes and house challenges with showcases at the end.", accent: "royal" },
  { title: "Art competition", text: "We also run the brief, judging and prizes for a school art competition.", accent: "pink" },
];

export const workshopOffers: Offer[] = [
  { title: "Canvas painting", text: "Guided step by step, to help  beginners begin and finish a real painting.", accent: "pink" },
  { title: "Slime making", text: "Colourful, safe slime with glitter and add-ins.", accent: "sun" },
  { title: "Resin and eco art", text: "Keepsakes made with resin and recycled or natural materials.", accent: "leaf" },
  { title: "Tote bag painting", text: "You can design and paint a bag you will use every day.", accent: "royal" },
  { title: "T-shirt and dera art", text: "Fabric painting on T-shirts and dera.", accent: "pink" },
  { title: "Bottle art", text: "Turn old bottles into decorated pieces of decor for homes and offices.", accent: "sun" },
  { title: "Mirror art", text: "Paint and decorate mirrors with your own pattern.", accent: "leaf" },
  { title: "Cutout art", text: "Layered paper and shape cutouts for bold wall art.", accent: "royal" },
];

export const eventOffers: Offer[] = [
  { title: "Birthday parties", text: "We host, set up the supplies, and arrange a wide range of fun activites for all the guests.", accent: "sun" },
  { title: "Weddings", text: "We also organize guest art stations and a keepsake canvas for couples and wedding guests.", accent: "pink" },
  { title: "Family days", text: "We host relaxed sessions for parents and children to create together.", accent: "leaf" },
  { title: "Corporate team days", text: "We structure team buidling activities centered around shared art projects.", accent: "royal" },
];

export const bookingOptions: string[] = [
  ...schoolOffers.map((o) => o.title),
  ...workshopOffers.map((o) => o.title),
  ...eventOffers.map((o) => o.title),
];

export const eventTypes: string[] = [
  "Kids birthdays",
  "Adult birthdays",
  "Weddings",
  "Family fun events",
  "School events",
  "Team and community days",
];

export const needOptions: string[] = [
  ...schoolOffers.map((o) => o.title),
  ...workshopOffers.map((o) => o.title),
];

export const whatsappNumber = "254700000000";