import type {
  DaySchedule,
  StudioAddOn,
  StudioPhotographer,
  StudioService,
} from "./types";

export const STUDIO_INFO = {
  name: "juntosxsiempre",
  tagline: "Estudio Fotográfico Mexicano • Recuerdos para Siempre",
  coordinatorName: "Camila",
  phone: "+52 631 313 8920",
  email: "citas@juntosxsiempre.mx",
  address: "Av. Álvaro Obregón 354, Col. Fundo Legal, 84000 Nogales, Sonora, México",
  parkingInfo:
    "Estacionamiento exclusivo para clientes y convenio a 50m sobre Av. Álvaro Obregón y Calle Campillo.",
  bufferMinutes: 15, // 15-min reset de luces y ambientación entre sesiones
  cancellationPolicy:
    "Cancelación o reprogramación sin penalización con 24 horas de anticipación. El anticipo es 100% transferible a cualquier fecha disponible.",
  turnaroundPolicy:
    "Galería previa de selección en 48 horas; fotografías finales en alta resolución con retoque fino entregadas en 5 días hábiles.",
  wardrobeTips:
    "Para nuestra iluminación cálida y fondos crema-rosa, recomendamos prendas en tonos neutros (marfil, arena, terracota, lino y rosa empolvado). Evita microestampados o logotipos llamativos.",
};

export const STUDIO_BACKDROPS = [
  "Rosa Pastel Editorial (Firma Juntos x Siempre)",
  "Lienzo Terracota Artesanal de Oaxaca",
  "Ciclorama Blanco Puro Infinito",
  "Cantera & Muro Colonial Texturizado",
  "Luz Natural con Ventanales Estilo Nogales (Atardecer Sonorense)",
  "Lienzo Arena Cálido & Marfil",
];

export const STUDIO_PHOTOGRAPHERS: StudioPhotographer[] = [
  {
    id: "photo-sofia",
    name: "Sofía Morales",
    role: "Directora Creativa & Especialista en Parejas y Bodas",
    specialties: ["Sesión Pareja", "Compromiso & Boda", "Retrato Romántico"],
    bio: "10+ años capturando historias de amor con estética editorial, tonos cálidos y luz natural en el corazón de Nogales, Sonora.",
    assignedRoom: "Set A — Galería Nogales & Ventanales de Luz Natural",
  },
  {
    id: "photo-mateo",
    name: "Mateo Hernández",
    role: "Especialista en Retrato Editorial, Quinceañeras y Moda",
    specialties: ["Retrato Ejecutivo", "Quinceañeras", "Moda & Branding"],
    bio: "Experto en dirección de poses naturales y esquemas de iluminación Profoto para retratos que transmiten autenticidad y poder.",
    assignedRoom: "Set B — Ciclorama Infinito & Estudio Strobe",
  },
  {
    id: "photo-valentina",
    name: "Valentina Ramos",
    role: "Fotógrafa de Familia, Maternidad y Bebés",
    specialties: ["Familia & Maternidad", "Smash Cake", "Graduaciones"],
    bio: "Especializada en crear un ambiente relajado, tierno y divertido para familias completas, futuras mamás y recién nacidos.",
    assignedRoom: "Set C — Lifestyle Cálido & Textura Cantera",
  },
];

export const STUDIO_ADDONS: StudioAddOn[] = [
  {
    id: "maquillaje-peinado",
    name: "Maquillaje y Peinado Profesional (HMUA)",
    price: 1200,
    extraMinutes: 30,
    description: "Preparación profesional en el camerino del estudio antes de la sesión para acabado impecable en cámara.",
  },
  {
    id: "fotos-extra-5",
    name: "5 Fotos Extra con Retoque Fino de Revista",
    price: 950,
    extraMinutes: 0,
    description: "Paquete de 5 fotografías adicionales en alta resolución con edición de piel y colorimetría profesional.",
  },
  {
    id: "entrega-express",
    name: "Entrega Express 24 Horas",
    price: 850,
    extraMinutes: 0,
    description: "Entrega prioritaria de tus fotos finales retocadas en menos de 24 horas para eventos o anuncios urgentes.",
  },
  {
    id: "video-reel",
    name: "Video Reel 4K Vertical Detrás de Cámaras",
    price: 1100,
    extraMinutes: 0,
    description: "Edición dinámica en formato vertical 4K con música y momentos espontáneos para Instagram y TikTok.",
  },
  {
    id: "asesoria-vestuario",
    name: "Asesoría de Vestuario & Planchado a Vapor",
    price: 600,
    extraMinutes: 0,
    description: "Vaporizado en estudio de hasta 3 cambios de ropa y asesoría de combinación de texturas con el set.",
  },
];

export const STUDIO_SERVICES: StudioService[] = [
  {
    id: "pareja-juntos",
    name: "Sesión Juntos x Siempre (Parejas & Compromiso)",
    shortName: "Pareja & Compromiso",
    durationMinutes: 60,
    price: 2800,
    depositAmount: 800,
    maxParticipants: 2,
    category: "portrait",
    description:
      "Nuestra sesión insignia para celebrar historias de amor, aniversarios y compromisos con estética cinematográfica y tonos cálidos.",
    includes: [
      "60 minutos de sesión guiada en estudio y luz natural",
      "Hasta 3 cambios de vestuario y 2 fondos temáticos",
      "12 fotografías en alta resolución con retoque fino",
      "Galería privada digital descargable sin caducidad",
    ],
  },
  {
    id: "retrato-editorial",
    name: "Retrato Ejecutivo & Personal Branding",
    shortName: "Retrato Profesional",
    durationMinutes: 35,
    price: 1650,
    depositAmount: 500,
    maxParticipants: 1,
    category: "portrait",
    description:
      "Retratos de alto impacto para perfiles ejecutivos, LinkedIn, conferencistas, artistas y fundadores con revisión en vivo.",
    includes: [
      "35 minutos de sesión dirigida con coaching de poses",
      "2 fondos de estudio (ciclorama o lienzo editorial)",
      "4 fotografías en alta resolución con retoque profesional",
      "Entrega digital en 48 horas lista para web y prensa",
    ],
  },
  {
    id: "familia-maternidad",
    name: "Sesión Familiar & Maternidad Cálida",
    shortName: "Familia & Maternidad",
    durationMinutes: 60,
    price: 3200,
    depositAmount: 900,
    maxParticipants: 6,
    category: "family",
    description:
      "Momentos espontáneos y tiernos en familia o la dulce espera de maternidad con batas y telas de seda del estudio incluidas.",
    includes: [
      "60 minutos de sesión para hasta 6 integrantes (¡mascotas bienvenidas!)",
      "Uso de batas de maternidad, telas y mobiliario del estudio",
      "15 fotografías digitales en alta resolución con retoque fino",
      "1 ampliación impresa de recuerdo 8x10 en papel fine-art",
    ],
  },
  {
    id: "quince-graduacion",
    name: "Quinceañera & Graduación de Ensueño",
    shortName: "Quince & Graduación",
    durationMinutes: 75,
    price: 3450,
    depositAmount: 1000,
    maxParticipants: 2,
    category: "milestone",
    description:
      "Celebra tus quince años o tu graduación universitaria con fotografías editoriales, vestido de gala, togas y estilo moderno.",
    includes: [
      "75 minutos en set interior + área colonial con cantera",
      "Hasta 3 cambios de vestuario (vestido de quince/toga + casual)",
      "14 fotografías en alta resolución con retoque de piel editorial",
      "Galería digital interactiva para compartir con invitados y familia",
    ],
  },
  {
    id: "campana-comercial",
    name: "Producción Comercial & Catálogo de Marca",
    shortName: "Comercial & Marcas",
    durationMinutes: 120,
    price: 5800,
    depositAmount: 1500,
    maxParticipants: 5,
    category: "commercial",
    description:
      "Producción integral para marcas mexicanas, creadores de contenido y diseñadores combinando modelos, producto y lifestyle.",
    includes: [
      "120 minutos de producción completa en estudio",
      "Moodboard previo de iluminación y dirección de arte",
      "25 fotografías comerciales con licencia de uso publicitario",
      "Entrega en alta resolución para ecommerce y redes sociales",
    ],
  },
];

export const STUDIO_HOURS: DaySchedule[] = [
  { dayOfWeek: 0, dayName: "Domingo", isOpen: false, openTime: "00:00", closeTime: "00:00" },
  { dayOfWeek: 1, dayName: "Lunes", isOpen: false, openTime: "00:00", closeTime: "00:00" },
  { dayOfWeek: 2, dayName: "Martes", isOpen: true, openTime: "09:00", closeTime: "18:00" },
  { dayOfWeek: 3, dayName: "Miércoles", isOpen: true, openTime: "09:00", closeTime: "18:00" },
  { dayOfWeek: 4, dayName: "Jueves", isOpen: true, openTime: "09:00", closeTime: "18:00" },
  { dayOfWeek: 5, dayName: "Viernes", isOpen: true, openTime: "09:00", closeTime: "18:00" },
  { dayOfWeek: 6, dayName: "Sábado", isOpen: true, openTime: "10:00", closeTime: "17:00" },
];

export function findStudioService(queryOrId: string): StudioService | undefined {
  if (!queryOrId) return undefined;
  const q = queryOrId.toLowerCase().trim();

  // Direct ID matches
  const exact = STUDIO_SERVICES.find((s) => s.id.toLowerCase() === q);
  if (exact) return exact;

  // Aliases for legacy IDs
  if (q === "headshot-express" || q.includes("headshot") || q.includes("ejecutivo") || q.includes("branding")) {
    return STUDIO_SERVICES[1]; // retrato-editorial
  }
  if (
    q === "portrait-signature" ||
    q.includes("pareja") ||
    q.includes("boda") ||
    q.includes("amor") ||
    q.includes("compromiso") ||
    q.includes("juntos")
  ) {
    return STUDIO_SERVICES[0]; // pareja-juntos
  }
  if (q === "family-maternity" || q.includes("familia") || q.includes("maternidad") || q.includes("bebe") || q.includes("embarazo")) {
    return STUDIO_SERVICES[2]; // familia-maternidad
  }
  if (q === "graduation-senior" || q.includes("quince") || q.includes("graduacion") || q.includes("grad") || q.includes("15")) {
    return STUDIO_SERVICES[3]; // quince-graduacion
  }
  if (q === "commercial-brand" || q.includes("comercial") || q.includes("marca") || q.includes("producto") || q.includes("catalogo")) {
    return STUDIO_SERVICES[4]; // campana-comercial
  }

  return STUDIO_SERVICES.find(
    (s) =>
      s.id.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q) ||
      s.shortName.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q),
  );
}

export function findStudioAddOns(queries: string[] | string): StudioAddOn[] {
  const rawList = Array.isArray(queries)
    ? queries
    : queries
        .split(/[,;+]/)
        .map((s) => s.trim())
        .filter(Boolean);

  const matched = new Map<string, StudioAddOn>();

  for (const item of rawList) {
    const q = item.toLowerCase();
    for (const addon of STUDIO_ADDONS) {
      if (
        addon.id.toLowerCase() === q ||
        addon.id.toLowerCase().includes(q) ||
        addon.name.toLowerCase().includes(q) ||
        ((q.includes("maquillaje") || q.includes("peinado") || q.includes("makeup") || q.includes("hmua") || q.includes("hair")) &&
          addon.id === "maquillaje-peinado") ||
        ((q.includes("retocada") || q.includes("retouch") || q.includes("extra photo") || q.includes("extra digital") || q.includes("fotos extra")) &&
          addon.id === "fotos-extra-5") ||
        ((q.includes("express") || q.includes("rush") || q.includes("24h") || q.includes("24")) &&
          addon.id === "entrega-express") ||
        ((q.includes("reel") || q.includes("video") || q.includes("bts") || q.includes("tiktok") || q.includes("instagram")) &&
          addon.id === "video-reel") ||
        ((q.includes("vestuario") || q.includes("vapor") || q.includes("planchado") || q.includes("wardrobe") || q.includes("styling")) &&
          addon.id === "asesoria-vestuario")
      ) {
        matched.set(addon.id, addon);
      }
    }
  }

  return Array.from(matched.values());
}

export function findPhotographer(queryOrServiceId?: string): StudioPhotographer {
  if (!queryOrServiceId) return STUDIO_PHOTOGRAPHERS[0];
  const q = queryOrServiceId.toLowerCase();
  const byName = STUDIO_PHOTOGRAPHERS.find(
    (p) => p.id.toLowerCase() === q || p.name.toLowerCase().includes(q),
  );
  if (byName) return byName;

  if (q.includes("sofia") || q.includes("pareja") || q.includes("boda") || q.includes("compromiso") || q.includes("juntos")) {
    return STUDIO_PHOTOGRAPHERS[0]; // Sofía Morales
  }
  if (q.includes("mateo") || q.includes("quince") || q.includes("retrato") || q.includes("ejecutivo") || q.includes("moda")) {
    return STUDIO_PHOTOGRAPHERS[1]; // Mateo Hernández
  }
  if (q.includes("valentina") || q.includes("familia") || q.includes("maternidad") || q.includes("bebe") || q.includes("grad")) {
    return STUDIO_PHOTOGRAPHERS[2]; // Valentina Ramos
  }
  return STUDIO_PHOTOGRAPHERS[0];
}
