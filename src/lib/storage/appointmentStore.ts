import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { STUDIO_INFO, STUDIO_SERVICES, findPhotographer } from "../studio/config";
import type {
  Appointment,
  ConversationSession,
  WaitlistEntry,
} from "../studio/types";
import { formatLocalDate, getNextOpenStudioDates } from "../calendar/dateUtils";

interface StoreData {
  appointments: Appointment[];
  waitlist: WaitlistEntry[];
  sessions: Record<string, ConversationSession>;
  initializedAt: string;
}

const TMP_STORE_PATH = path.join(os.tmpdir(), "juntosxsiempre-studio-store-v1.json");

function createSeedAppointments(): Appointment[] {
  const todayStr = formatLocalDate(new Date());
  const openDates = getNextOpenStudioDates(todayStr, 5);
  const d1 = openDates[0] || todayStr;
  const d2 = openDates[1] || todayStr;
  const d3 = openDates[2] || todayStr;

  const nowIso = new Date().toISOString();

  return [
    {
      id: "apt-seed-1",
      bookingRef: "JXS-2041",
      clientName: "Mariana & Carlos Rivera",
      clientPhone: "+52 55 4910 2831",
      clientEmail: "mariana.rivera@gmail.com",
      serviceId: "pareja-juntos",
      serviceName: "Sesión Juntos x Siempre (Parejas & Compromiso)",
      date: d1,
      startTime: "10:00",
      endTime: "11:00",
      durationMinutes: 60,
      price: 4000,
      participants: 2,
      photographerName: "Sofía Morales",
      addOns: ["Maquillaje y Peinado Profesional (HMUA)"],
      prepGuideSent: true,
      notes: "Aniversario de novios; set de luz natural con flores secas y fondo rosa pastel.",
      status: "confirmed",
      createdAt: nowIso,
      updatedAt: nowIso,
      source: "sms",
    },
    {
      id: "apt-seed-2",
      bookingRef: "JXS-2048",
      clientName: "Familia Garza Salgado",
      clientPhone: "+52 55 8123 9044",
      clientEmail: "valeria.garza@hotmail.com",
      serviceId: "familia-maternidad",
      serviceName: "Sesión Familiar & Maternidad Cálida",
      date: d1,
      startTime: "14:00",
      endTime: "15:00",
      durationMinutes: 60,
      price: 3200,
      participants: 4,
      photographerName: "Valentina Ramos",
      addOns: [],
      prepGuideSent: true,
      notes: "Maternidad semana 32 + niña de 3 años; bata blanca de lino.",
      status: "confirmed",
      createdAt: nowIso,
      updatedAt: nowIso,
      source: "sms",
    },
    {
      id: "apt-seed-3",
      bookingRef: "JXS-2055",
      clientName: "Rodrigo Morales",
      clientPhone: "+52 55 6712 3490",
      clientEmail: "rodrigo@moralesarq.mx",
      serviceId: "retrato-editorial",
      serviceName: "Retrato Ejecutivo & Personal Branding",
      date: d2,
      startTime: "11:00",
      endTime: "11:35",
      durationMinutes: 35,
      price: 1650,
      participants: 1,
      photographerName: "Mateo Hernández",
      addOns: [],
      prepGuideSent: false,
      notes: "Foto de perfil para despacho de arquitectura; fondo cantera y ciclorama.",
      status: "confirmed",
      createdAt: nowIso,
      updatedAt: nowIso,
      source: "web",
    },
    {
      id: "apt-seed-4",
      bookingRef: "JXS-2062",
      clientName: "Mezcal Artesanal Santo Remedio",
      clientPhone: "+52 55 9812 7701",
      clientEmail: "contacto@mezcalsantoremedio.mx",
      serviceId: "campana-comercial",
      serviceName: "Producción Comercial & Catálogo de Marca",
      date: d3,
      startTime: "13:00",
      endTime: "15:00",
      durationMinutes: 120,
      price: 6900,
      participants: 3,
      photographerName: "Sofía Morales",
      addOns: ["Video Reel 4K Vertical Detrás de Cámaras"],
      prepGuideSent: true,
      notes: "Bodegón de botellas mezcaleras con textiles oaxaqueños + fotos con barista.",
      status: "confirmed",
      createdAt: nowIso,
      updatedAt: nowIso,
      source: "dashboard",
    },
  ];
}

function createSeedWaitlist(): WaitlistEntry[] {
  const todayStr = formatLocalDate(new Date());
  const openDates = getNextOpenStudioDates(todayStr, 5);
  const d1 = openDates[0] || todayStr;

  return [
    {
      id: "wl-seed-1",
      waitlistRef: "WTL-8104",
      clientName: "Lucía Benítez",
      clientPhone: "+52 55 3419 8820",
      clientEmail: "lucia.benitez@outlook.com",
      serviceId: "pareja-juntos",
      serviceName: "Sesión Juntos x Siempre (Parejas & Compromiso)",
      preferredDate: d1,
      preferredTimeWindow: "Mañana (10:00 AM preferido)",
      notes: "Esperando si se abre un horario matutino para sesión de compromiso.",
      status: "waiting",
      createdAt: new Date().toISOString(),
    },
  ];
}

declare global {
  var __JUNTOSXSIEMPRE_STUDIO_STORE__: StoreData | undefined;
}

function loadStore(): StoreData {
  if (globalThis.__JUNTOSXSIEMPRE_STUDIO_STORE__) {
    if (!Array.isArray(globalThis.__JUNTOSXSIEMPRE_STUDIO_STORE__.waitlist)) {
      globalThis.__JUNTOSXSIEMPRE_STUDIO_STORE__.waitlist = createSeedWaitlist();
    }
    return globalThis.__JUNTOSXSIEMPRE_STUDIO_STORE__;
  }

  try {
    if (fs.existsSync(TMP_STORE_PATH)) {
      const raw = fs.readFileSync(TMP_STORE_PATH, "utf-8");
      const parsed = JSON.parse(raw) as StoreData;
      if (parsed && Array.isArray(parsed.appointments)) {
        if (!Array.isArray(parsed.waitlist)) {
          parsed.waitlist = createSeedWaitlist();
        }
        globalThis.__JUNTOSXSIEMPRE_STUDIO_STORE__ = parsed;
        return parsed;
      }
    }
  } catch {
    // Ephemeral /tmp fallback ignored if unavailable
  }

  const initial: StoreData = {
    appointments: createSeedAppointments(),
    waitlist: createSeedWaitlist(),
    sessions: {},
    initializedAt: new Date().toISOString(),
  };

  globalThis.__JUNTOSXSIEMPRE_STUDIO_STORE__ = initial;
  persistStore(initial);
  return initial;
}

function persistStore(store: StoreData): void {
  globalThis.__JUNTOSXSIEMPRE_STUDIO_STORE__ = store;
  try {
    fs.writeFileSync(TMP_STORE_PATH, JSON.stringify(store, null, 2), "utf-8");
  } catch {
    // Ignore write errors in restricted serverless environments
  }
}

export function getAllAppointments(): Appointment[] {
  const store = loadStore();
  return [...store.appointments].sort((a, b) => {
    const cmpDate = a.date.localeCompare(b.date);
    if (cmpDate !== 0) return cmpDate;
    return a.startTime.localeCompare(b.startTime);
  });
}

export function getAllWaitlistEntries(): WaitlistEntry[] {
  const store = loadStore();
  return [...store.waitlist].sort((a, b) =>
    a.preferredDate.localeCompare(b.preferredDate),
  );
}

export function getAppointmentsByDate(dateStr: string): Appointment[] {
  return getAllAppointments().filter(
    (apt) => apt.date === dateStr && apt.status !== "cancelled",
  );
}

export function findAppointmentByQuery(query: string): Appointment[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const digitsOnly = q.replace(/\D/g, "");

  return getAllAppointments().filter((apt) => {
    const phoneDigits = apt.clientPhone.replace(/\D/g, "");
    return (
      apt.bookingRef.toLowerCase() === q ||
      apt.bookingRef.toLowerCase().includes(q) ||
      apt.clientName.toLowerCase().includes(q) ||
      apt.clientEmail.toLowerCase().includes(q) ||
      (digitsOnly.length >= 4 && phoneDigits.includes(digitsOnly)) ||
      // Legacy compatibility LUM-2041 -> JXS-2041
      (q.includes("2041") && apt.bookingRef.includes("2041")) ||
      (q.includes("2048") && apt.bookingRef.includes("2048")) ||
      (q.includes("2055") && apt.bookingRef.includes("2055")) ||
      (q.includes("2062") && apt.bookingRef.includes("2062"))
    );
  });
}

export function createBookingRecord(input: {
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  serviceId: string;
  date: string;
  startTime: string;
  endTime: string;
  participants?: number;
  photographerName?: string;
  addOns?: string[];
  extraPrice?: number;
  notes?: string;
  source?: "sms" | "web" | "dashboard";
}): Appointment {
  const store = loadStore();
  const service =
    STUDIO_SERVICES.find((s) => s.id === input.serviceId) || STUDIO_SERVICES[0];
  const assignedPhoto =
    input.photographerName || findPhotographer(service.id).name;

  const randomCode = Math.floor(3000 + Math.random() * 6999);
  const bookingRef = `JXS-${randomCode}`;
  const nowIso = new Date().toISOString();

  const newApt: Appointment = {
    id: `apt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    bookingRef,
    clientName: input.clientName.trim(),
    clientPhone: input.clientPhone.trim(),
    clientEmail: input.clientEmail.trim(),
    serviceId: service.id,
    serviceName: service.name,
    date: input.date,
    startTime: input.startTime,
    endTime: input.endTime,
    durationMinutes: service.durationMinutes,
    price: service.price + (input.extraPrice || 0),
    participants: input.participants || 1,
    photographerName: assignedPhoto,
    addOns: input.addOns || [],
    prepGuideSent: false,
    notes: input.notes?.trim() || "",
    status: "confirmed",
    createdAt: nowIso,
    updatedAt: nowIso,
    source: input.source || "sms",
  };

  store.appointments.push(newApt);
  persistStore(store);
  return newApt;
}

export function createWaitlistRecord(input: {
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  serviceId: string;
  preferredDate: string;
  preferredTimeWindow: string;
  notes?: string;
}): WaitlistEntry {
  const store = loadStore();
  const service =
    STUDIO_SERVICES.find((s) => s.id === input.serviceId) || STUDIO_SERVICES[0];
  const randomCode = Math.floor(8110 + Math.random() * 1800);
  const entry: WaitlistEntry = {
    id: `wl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    waitlistRef: `WTL-${randomCode}`,
    clientName: input.clientName.trim(),
    clientPhone: input.clientPhone.trim(),
    clientEmail: input.clientEmail.trim(),
    serviceId: service.id,
    serviceName: service.name,
    preferredDate: input.preferredDate,
    preferredTimeWindow: input.preferredTimeWindow || "Cualquier horario disponible",
    notes: input.notes?.trim() || "",
    status: "waiting",
    createdAt: new Date().toISOString(),
  };

  store.waitlist.push(entry);
  persistStore(store);
  return entry;
}

export function updateBookingRecord(
  bookingRefOrId: string,
  updates: Partial<
    Pick<
      Appointment,
      | "date"
      | "startTime"
      | "endTime"
      | "status"
      | "notes"
      | "serviceId"
      | "serviceName"
      | "durationMinutes"
      | "price"
      | "participants"
      | "photographerName"
      | "addOns"
      | "prepGuideSent"
    >
  >,
): Appointment | null {
  const store = loadStore();
  const q = bookingRefOrId.trim().toLowerCase();
  const idx = store.appointments.findIndex(
    (a) =>
      a.bookingRef.toLowerCase() === q ||
      a.id.toLowerCase() === q ||
      (q.includes("2041") && a.bookingRef.includes("2041")) ||
      (q.includes("2048") && a.bookingRef.includes("2048")) ||
      (q.includes("2055") && a.bookingRef.includes("2055")) ||
      (q.includes("2062") && a.bookingRef.includes("2062")),
  );
  if (idx === -1) return null;

  const previousDate = store.appointments[idx].date;
  store.appointments[idx] = {
    ...store.appointments[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  // If cancelled or rescheduled away from previousDate, automatically mark matching waitlist entries as slot_opened!
  if (
    updates.status === "cancelled" ||
    (updates.date && updates.date !== previousDate)
  ) {
    for (const wl of store.waitlist) {
      if (wl.preferredDate === previousDate && wl.status === "waiting") {
        wl.status = "slot_opened";
      }
    }
  }

  persistStore(store);
  return store.appointments[idx];
}

export function updateWaitlistRecord(
  idOrRef: string,
  updates:
    | Partial<Pick<WaitlistEntry, "status" | "notes" | "preferredDate" | "preferredTimeWindow">>
    | WaitlistEntry["status"],
): WaitlistEntry | null {
  const store = loadStore();
  const q = idOrRef.trim().toLowerCase();
  const idx = store.waitlist.findIndex(
    (w) =>
      w.id.toLowerCase() === q ||
      w.waitlistRef.toLowerCase() === q ||
      (q.includes("8104") && w.waitlistRef.includes("8104")),
  );
  if (idx === -1) return null;

  const patch = typeof updates === "string" ? { status: updates } : updates;

  store.waitlist[idx] = {
    ...store.waitlist[idx],
    ...patch,
  };
  persistStore(store);
  return store.waitlist[idx];
}

export const updateWaitlistStatus = updateWaitlistRecord;

export function getOrCreateSession(
  sessionId: string,
  clientPhone: string = STUDIO_INFO.phone,
): ConversationSession {
  const store = loadStore();
  if (!store.sessions[sessionId]) {
    store.sessions[sessionId] = {
      sessionId,
      clientPhone,
      history: [],
      uiMessages: [],
      updatedAt: new Date().toISOString(),
    };
    persistStore(store);
  }
  return store.sessions[sessionId];
}

export function saveSession(session: ConversationSession): void {
  const store = loadStore();
  store.sessions[session.sessionId] = {
    ...session,
    updatedAt: new Date().toISOString(),
  };
  persistStore(store);
}

export function resetDemoStore(): StoreData {
  const fresh: StoreData = {
    appointments: createSeedAppointments(),
    waitlist: createSeedWaitlist(),
    sessions: {},
    initializedAt: new Date().toISOString(),
  };
  persistStore(fresh);
  return fresh;
}

export function syncStoreFromClient(payload: {
  appointments?: Appointment[];
  waitlist?: WaitlistEntry[];
  sessionId?: string;
  clientPhone?: string;
  history?: ConversationSession["history"];
}): void {
  const store = loadStore();
  let mutated = false;

  if (Array.isArray(payload.appointments) && payload.appointments.length > 0) {
    store.appointments = payload.appointments;
    mutated = true;
  }

  if (Array.isArray(payload.waitlist) && payload.waitlist.length > 0) {
    store.waitlist = payload.waitlist;
    mutated = true;
  }

  if (payload.sessionId && Array.isArray(payload.history)) {
    const existing = store.sessions[payload.sessionId];
    store.sessions[payload.sessionId] = {
      sessionId: payload.sessionId,
      clientPhone: payload.clientPhone || existing?.clientPhone || STUDIO_INFO.phone,
      history: payload.history,
      uiMessages: existing?.uiMessages || [],
      updatedAt: new Date().toISOString(),
    };
    mutated = true;
  }

  if (mutated) {
    persistStore(store);
  }
}
