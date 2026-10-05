export type Accent = "pink" | "sun" | "leaf" | "royal";

export interface Offer {
  title: string;
  text: string;
  accent: Accent;
}

export const schoolOffers: Offer[] = [
  { title: "School art lessons", text: "Weekly or termly art classes planned around your curriculum.", accent: "pink" },
  { title: "Computer and digital art lessons", text: "Learners create digital art on computers while building basic computer skills.", accent: "sun" },
  { title: "School art fun day", text: "A whole-school day of stations, colour and games.", accent: "leaf" },
  { title: "Art challenge", text: "Themed class or house challenges with a showcase at the end.", accent: "royal" },
  { title: "Art competition", text: "We run the brief, judging and prizes for a school art competition.", accent: "pink" },
];

export const workshopOffers: Offer[] = [
  { title: "Canvas painting", text: "Guided step by step, so beginners finish a real painting.", accent: "pink" },
  { title: "Slime making", text: "Colourful, safe slime with glitter and add-ins.", accent: "sun" },
  { title: "Resin and eco art", text: "Keepsakes made with resin and recycled or natural materials.", accent: "leaf" },
  { title: "Tote bag painting", text: "Design and paint a bag you will use every day.", accent: "royal" },
  { title: "T-shirt and dera art", text: "Fabric painting on T-shirts and dera.", accent: "pink" },
  { title: "Bottle art", text: "Turn old bottles into decorated pieces for the home.", accent: "sun" },
  { title: "Mirror art", text: "Paint and decorate mirrors with your own pattern.", accent: "leaf" },
  { title: "Cutout art", text: "Layered paper and shape cutouts for bold wall art.", accent: "royal" },
];

export const eventOffers: Offer[] = [
  { title: "Birthday parties", text: "A host, supplies and a creative activity for every guest.", accent: "sun" },
  { title: "Weddings", text: "Guest art stations and a keepsake canvas for the couple.", accent: "pink" },
  { title: "Family days", text: "Relaxed sessions for parents and children to create together.", accent: "leaf" },
  { title: "Corporate team days", text: "Team-building around a shared art project.", accent: "royal" },
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