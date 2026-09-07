/**
 * REST client for the Mama na Mtoto+ API.
 *
 * All endpoints now point directly to the live Railway backend.
 * No mock data or fallback logic. Errors will be thrown loudly.
 */
export const API_BASE = "https://mama-na-mtoto-api-production.up.railway.app/api";

export const ENDPOINTS = {
  // Use the same OTP endpoints as the mobile app (they exist)
  requestOtp: "/auth/otp/request",
  verifyOtp: "/auth/otp/verify",
  me: "/auth/me", // now exists
  stats: "/chv/stats", // now exists
  registerMother: "/mothers",
  searchMothers: "/mothers/search",
  mother: (id: string) => `/mothers/${id}`,
  visits: (id: string) => `/mothers/${id}/anc-visits`,
  labs: (id: string) => `/mothers/${id}/lab-results`,
  vaccinations: (id: string) => `/mothers/${id}/vaccinations`,
  alerts: "/alerts",
};

const TOKEN_KEY = "mnm_token";
const USER_KEY = "mnm_user";

export type Nurse = { id: string; name: string; phone: string; facility: string; role: string };

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): Nurse | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Nurse;
  } catch {
    return null;
  }
}

export function setSession(token: string, user: Nurse) {
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}

// We remove the offline/fallback logic entirely.
export function isOffline() {
  return false;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
  });

  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    /* non-json */
  }

  const payload = json as {
    success?: boolean;
    data?: unknown;
    error?: { message?: string };
  } | null;

  if (!res.ok || payload?.success === false) {
    throw new ApiError(payload?.error?.message ?? `Request failed (${res.status})`, res.status);
  }
  return (payload && "data" in payload ? payload.data : payload) as T;
}

/* ---------------------------------- types --------------------------------- */

export type Mother = {
  id: string;
  name: string;
  phone: string;
  registrationCode: string;
  age: number;
  nationalId?: string;
  village: string;
  lmp: string;
  edd: string;
  gravida: number;
  parity: number;
  riskLevel: "low" | "medium" | "high";
  nextAppointment?: string | null;
  createdAt: string;
};
export type AncVisit = {
  id: string;
  motherId: string;
  visitDate: string;
  gestationWeeks?: number | null;
  bpSystolic: number;
  bpDiastolic: number;
  weightKg: number;
  fundalHeightCm?: number | null;
  fetalHeartRate?: number | null;
  urineProtein: string;
  urineGlucose: string;
  notes?: string;
  nextAppointment?: string | null;
  flags: string[];
};
export type LabResult = {
  id: string;
  motherId: string;
  testDate: string;
  bloodGroup?: string;
  hb?: number | null;
  hivStatus?: string;
  urinalysis?: string;
  bloodSugar?: number | null;
  syphilis?: string;
  flags: string[];
};
export type Vaccination = {
  id: string;
  motherId: string;
  vaccine: string;
  dose: string;
  givenDate: string;
  batchNumber?: string;
  administeredBy?: string;
  nextDueDate?: string | null;
};
export type Alert = {
  id: string;
  motherId: string;
  motherName: string;
  motherPhone: string;
  dangerSign: string;
  severity: "critical" | "urgent" | "watch";
  message: string;
  status: "open" | "acknowledged" | "resolved";
  createdAt: string;
};
export type Stats = {
  mothersRegistered: number;
  ancVisitsThisMonth: number;
  openAlerts: number;
  appointmentsToday: number;
  highRiskMothers: number;
  vaccinationsThisMonth: number;
};

/* ---------------------------------- api ----------------------------------- */

export const api = {
  requestOtp: (phone: string) =>
    request<{ sent: boolean }>(ENDPOINTS.requestOtp, { method: "POST", body: { phone } }),
  verifyOtp: (phone: string, code: string) =>
    request<{ token: string; user: Nurse }>(ENDPOINTS.verifyOtp, {
      method: "POST",
      body: { phone, code },
    }),
  stats: () => request<Stats>(ENDPOINTS.stats, {}),
  registerMother: (input: Omit<Mother, "id" | "registrationCode" | "createdAt" | "riskLevel">) =>
    request<{ mother: Mother; smsSent: boolean }>(ENDPOINTS.registerMother, {
      method: "POST",
      body: input,
    }),
  searchMothers: (q: string) =>
    request<Mother[]>(`${ENDPOINTS.searchMothers}?q=${encodeURIComponent(q)}`, {}),
  mother: (id: string) => request<Mother>(ENDPOINTS.mother(id), {}),
  visits: (id: string) => request<AncVisit[]>(ENDPOINTS.visits(id), {}),
  createVisit: (id: string, body: Omit<AncVisit, "id" | "motherId" | "flags">) =>
    request<AncVisit>(ENDPOINTS.visits(id), { method: "POST", body }),
  labs: (id: string) => request<LabResult[]>(ENDPOINTS.labs(id), {}),
  createLab: (id: string, body: Omit<LabResult, "id" | "motherId" | "flags">) =>
    request<LabResult>(ENDPOINTS.labs(id), { method: "POST", body }),
  vaccinations: (id: string) => request<Vaccination[]>(ENDPOINTS.vaccinations(id), {}),
  createVaccination: (id: string, body: Omit<Vaccination, "id" | "motherId">) =>
    request<Vaccination>(ENDPOINTS.vaccinations(id), { method: "POST", body }),
  alerts: () => request<Alert[]>(ENDPOINTS.alerts, {}),
  updateAlert: (id: string, status: Alert["status"]) =>
    request<Alert>(`${ENDPOINTS.alerts}/${id}`, { method: "PATCH", body: { status } }),
};

/* ------------------------------ shared helpers ----------------------------- */

export function flagVisit(v: {
  bpSystolic: number;
  bpDiastolic: number;
  fetalHeartRate?: number | null;
  urineProtein: string;
  urineGlucose: string;
}): string[] {
  const flags: string[] = [];
  if (v.bpSystolic >= 140 || v.bpDiastolic >= 90) flags.push("High blood pressure");
  if (v.bpSystolic && v.bpSystolic < 90) flags.push("Low blood pressure");
  if (v.fetalHeartRate && (v.fetalHeartRate < 110 || v.fetalHeartRate > 160))
    flags.push("Abnormal fetal heart rate");
  if (v.urineProtein && v.urineProtein !== "negative") flags.push("Proteinuria");
  if (v.urineGlucose && v.urineGlucose !== "negative") flags.push("Glycosuria");
  return flags;
}

export function flagLab(l: {
  hb?: number | null;
  hivStatus?: string;
  bloodSugar?: number | null;
  syphilis?: string;
  urinalysis?: string;
}): string[] {
  const flags: string[] = [];
  if (l.hb != null && l.hb < 7) flags.push("Severe anaemia (Hb < 7)");
  else if (l.hb != null && l.hb < 11) flags.push("Anaemia (Hb < 11)");
  if (l.hivStatus === "positive") flags.push("HIV positive — start/continue ART");
  if (l.syphilis === "reactive") flags.push("Syphilis reactive");
  if (l.bloodSugar != null && l.bloodSugar >= 7.8) flags.push("Raised blood sugar");
  if (l.urinalysis && l.urinalysis !== "normal") flags.push("Abnormal urinalysis");
  return flags;
}

export function generateRegistrationCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 8; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}
