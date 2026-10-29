import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { STUDIO_SERVICES } from "../studio/config";
import type { Appointment, ConversationSession } from "../studio/types";
import { formatLocalDate, getNextOpenStudioDates } from "../calendar/dateUtils";

interface StoreData {
  appointments: Appointment[];
  sessions: Record<string, ConversationSession>;
  initializedAt: string;
}

const TMP_STORE_PATH = path.join(os.tmpdir(), "lumina-studio-pilot-store-v1.json");

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
      bookingRef: "LUM-2041",
      clientName: "Elena Rostova",
      clientPhone: "(555) 391-0482",
      clientEmail: "elena.rostova@atelier.io",
      serviceId: "headshot-express",
      serviceName: "Express Headshot Session",
      date: d1,
      startTime: "10:00",
      endTime: "10:30",
      durationMinutes: 30,
      price: 149,
      participants: 1,
      notes: "Charcoal and warm bone backdrops for keynote speaker bio.",
      status: "confirmed",
      createdAt: nowIso,
      updatedAt: nowIso,
      source: "sms",
    },
    {
      id: "apt-seed-2",
      bookingRef: "LUM-2048",
      clientName: "Marcus & Priya Vance",
      clientPhone: "(555) 842-1930",
      clientEmail: "mvance@gmail.com",
      serviceId: "family-maternity",
      serviceName: "Family & Maternity Keepsake Session",
      date: d1,
      startTime: "14:00",
      endTime: "15:00",
      durationMinutes: 60,
      price: 325,
      participants: 3,
      notes: "Maternity + toddler shoot; requesting ivory linen studio wrap.",
      status: "confirmed",
      createdAt: nowIso,
      updatedAt: nowIso,
      source: "sms",
    },
    {
      id: "apt-seed-3",
      bookingRef: "LUM-2055",
      clientName: "Devon Brooks",
      clientPhone: "(555) 619-7741",
      clientEmail: "devon.brooks@utexas.edu",
      serviceId: "graduation-senior",
      serviceName: "Graduation & Milestone Session",
      date: d2,
      startTime: "11:00",
      endTime: "12:15",
      durationMinutes: 75,
      price: 295,
      participants: 1,
      notes: "Bringing architecture portfolio props + regalia.",
      status: "confirmed",
      createdAt: nowIso,
      updatedAt: nowIso,
      source: "web",
    },
    {
      id: "apt-seed-4",
      bookingRef: "LUM-2062",
      clientName: "Solstice Roasters Co.",
      clientPhone: "(555) 908-3312",
      clientEmail: "hello@solsticeroasters.com",
      serviceId: "commercial-brand",
      serviceName: "Commercial & Personal Brand Story",
      date: d3,
      startTime: "13:00",
      endTime: "15:00",
      durationMinutes: 120,
      price: 550,
      participants: 3,
      notes: "Founder portraits + espresso packaging tabletop lighting.",
      status: "confirmed",
      createdAt: nowIso,
      updatedAt: nowIso,
      source: "dashboard",
    },
  ];
}

declare global {
  var __LUMINA_STUDIO_STORE__: StoreData | undefined;
}

function loadStore(): StoreData {
  if (globalThis.__LUMINA_STUDIO_STORE__) {
    return globalThis.__LUMINA_STUDIO_STORE__;
  }

  try {
    if (fs.existsSync(TMP_STORE_PATH)) {
      const raw = fs.readFileSync(TMP_STORE_PATH, "utf-8");
      const parsed = JSON.parse(raw) as StoreData;
      if (parsed && Array.isArray(parsed.appointments)) {
        globalThis.__LUMINA_STUDIO_STORE__ = parsed;
        return parsed;
      }
    }
  } catch {
    // Ephemeral /tmp fallback ignored if unavailable
  }

  const initial: StoreData = {
    appointments: createSeedAppointments(),
    sessions: {},
    initializedAt: new Date().toISOString(),
  };

  globalThis.__LUMINA_STUDIO_STORE__ = initial;
  persistStore(initial);
  return initial;
}

function persistStore(store: StoreData): void {
  globalThis.__LUMINA_STUDIO_STORE__ = store;
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
      (digitsOnly.length >= 4 && phoneDigits.includes(digitsOnly))
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
  notes?: string;
  source?: "sms" | "web" | "dashboard";
}): Appointment {
  const store = loadStore();
  const service =
    STUDIO_SERVICES.find((s) => s.id === input.serviceId) || STUDIO_SERVICES[0];

  const randomCode = Math.floor(3000 + Math.random() * 6999);
  const bookingRef = `LUM-${randomCode}`;
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
    price: service.price,
    participants: input.participants || 1,
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

export function updateBookingRecord(
  bookingRefOrId: string,
  updates: Partial<
    Pick<
      Appointment,
      "date" | "startTime" | "endTime" | "status" | "notes" | "serviceId" | "serviceName" | "durationMinutes" | "price"
    >
  >,
): Appointment | null {
  const store = loadStore();
  const q = bookingRefOrId.trim().toLowerCase();
  const idx = store.appointments.findIndex(
    (a) => a.bookingRef.toLowerCase() === q || a.id.toLowerCase() === q,
  );
  if (idx === -1) return null;

  store.appointments[idx] = {
    ...store.appointments[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  persistStore(store);
  return store.appointments[idx];
}

export function getOrCreateSession(
  sessionId: string,
  clientPhone: string = "(555) 019-2834",
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
    sessions: {},
    initializedAt: new Date().toISOString(),
  };
  persistStore(fresh);
  return fresh;
}

/**
 * Ensures serverless cold-start instances on Vercel Free Tier stay 100% synchronized
 * with the browser's active demo state before running tools or slot calculations.
 */
export function syncStoreFromClient(payload: {
  appointments?: Appointment[];
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

  if (payload.sessionId && Array.isArray(payload.history)) {
    const existing = store.sessions[payload.sessionId];
    store.sessions[payload.sessionId] = {
      sessionId: payload.sessionId,
      clientPhone: payload.clientPhone || existing?.clientPhone || "(555) 019-2834",
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
