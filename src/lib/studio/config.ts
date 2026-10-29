import type { DaySchedule, StudioService } from "./types";

export const STUDIO_INFO = {
  name: "Lumina Portrait & Creative Studio",
  coordinatorName: "Maya",
  phone: "(555) 234-8910",
  email: "bookings@luminastudio.co",
  address: "742 Evergreen Arts District, Suite 3B, Austin, TX 78701",
  parkingInfo: "Free validated parking in the Arts District Garage right behind Building B.",
  bufferMinutes: 15, // 15-min studio reset & lighting transition between sessions
  cancellationPolicy:
    "Free rescheduling or cancellation with at least 24 hours' notice. Deposits are transferable to any new date.",
  turnaroundPolicy:
    "Online proofing gallery delivered within 48 hours; final retouched high-res images delivered within 5 business days.",
  wardrobeTips:
    "Solid mid-tones, textured knits, and layered neutrals photograph best under studio strobes. Avoid neon colors or micro-stripes.",
};

export const STUDIO_SERVICES: StudioService[] = [
  {
    id: "headshot-express",
    name: "Express Headshot Session",
    shortName: "Express Headshot",
    durationMinutes: 30,
    price: 149,
    depositAmount: 50,
    maxParticipants: 1,
    category: "portrait",
    description:
      "Fast, polished studio headshots for executives, actors, LinkedIn, and speaker profiles with live tethered review.",
    includes: [
      "30-minute guided studio session",
      "Up to 2 backdrop looks & 2 outfit changes",
      "3 retouched high-resolution digital portraits",
      "Same-day proofing gallery",
    ],
  },
  {
    id: "portrait-signature",
    name: "Signature Portrait & Editorial Session",
    shortName: "Signature Portrait",
    durationMinutes: 60,
    price: 275,
    depositAmount: 75,
    maxParticipants: 2,
    category: "portrait",
    description:
      "Full-hour creative portrait experience for individuals, couples, or artists wanting dramatic studio and natural-light looks.",
    includes: [
      "60-minute studio & daylight loft session",
      "Up to 3 outfit changes & custom lighting setups",
      "8 retouched high-resolution digital images",
      "Print release + private online gallery",
    ],
  },
  {
    id: "family-maternity",
    name: "Family & Maternity Keepsake Session",
    shortName: "Family / Maternity",
    durationMinutes: 60,
    price: 325,
    depositAmount: 100,
    maxParticipants: 6,
    category: "family",
    description:
      "Warm, relaxed family or maternity portrait session in our cyclorama & lifestyle sets with studio wardrobe wraps included.",
    includes: [
      "60-minute session for up to 6 family members",
      "Access to maternity gowns, wraps & studio stools",
      "12 retouched high-resolution digital images",
      "Complimentary 8x10 fine-art lustre print",
    ],
  },
  {
    id: "graduation-senior",
    name: "Graduation & Milestone Session",
    shortName: "Graduation / Senior",
    durationMinutes: 75,
    price: 295,
    depositAmount: 75,
    maxParticipants: 2,
    category: "milestone",
    description:
      "Celebrate graduation or milestone achievements with cap-and-gown portraits plus casual & formal studio sets.",
    includes: [
      "75-minute indoor studio + architectural courtyard shoot",
      "Cap & gown + 2 casual/formal outfit looks",
      "10 retouched high-resolution digital images",
      "48-hour express gallery delivery",
    ],
  },
  {
    id: "commercial-brand",
    name: "Commercial & Personal Brand Story",
    shortName: "Brand / Commercial",
    durationMinutes: 120,
    price: 550,
    depositAmount: 150,
    maxParticipants: 5,
    category: "commercial",
    description:
      "Comprehensive visual branding session for founders, creatives, and small teams—combining headshots, workspace lifestyle, and product flat-lays.",
    includes: [
      "120-minute multi-set studio production",
      "Pre-shoot lighting & moodboard consultation",
      "20 retouched commercial-grade digital assets",
      "Full commercial & social media usage license",
    ],
  },
];

export const STUDIO_HOURS: DaySchedule[] = [
  { dayOfWeek: 0, dayName: "Sunday", isOpen: false, openTime: "00:00", closeTime: "00:00" },
  { dayOfWeek: 1, dayName: "Monday", isOpen: false, openTime: "00:00", closeTime: "00:00" },
  { dayOfWeek: 2, dayName: "Tuesday", isOpen: true, openTime: "09:00", closeTime: "18:00" },
  { dayOfWeek: 3, dayName: "Wednesday", isOpen: true, openTime: "09:00", closeTime: "18:00" },
  { dayOfWeek: 4, dayName: "Thursday", isOpen: true, openTime: "09:00", closeTime: "18:00" },
  { dayOfWeek: 5, dayName: "Friday", isOpen: true, openTime: "09:00", closeTime: "18:00" },
  { dayOfWeek: 6, dayName: "Saturday", isOpen: true, openTime: "10:00", closeTime: "17:00" },
];

export function findStudioService(queryOrId: string): StudioService | undefined {
  if (!queryOrId) return undefined;
  const q = queryOrId.toLowerCase().trim();
  // Exact ID match
  const exact = STUDIO_SERVICES.find((s) => s.id.toLowerCase() === q);
  if (exact) return exact;
  // Substring match on id, name, shortName, or category
  return STUDIO_SERVICES.find(
    (s) =>
      s.id.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q) ||
      s.shortName.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q) ||
      (q.includes("headshot") && s.id === "headshot-express") ||
      (q.includes("portrait") && s.id === "portrait-signature") ||
      ((q.includes("family") || q.includes("maternity") || q.includes("baby")) &&
        s.id === "family-maternity") ||
      ((q.includes("grad") || q.includes("senior")) && s.id === "graduation-senior") ||
      ((q.includes("brand") || q.includes("commercial") || q.includes("product")) &&
        s.id === "commercial-brand"),
  );
}
