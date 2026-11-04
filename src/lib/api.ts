/**
 * REST client for the Mama na Mtoto+ API.
 *
 * All endpoints now point directly to the live Railway backend.
 * No mock data or fallback logic. Errors will be thrown loudly.
 */
export const API_BASE = "https://mama-na-mtoto-api-production-523a.up.railway.app/api";

export const ENDPOINTS = {
  // These are for mothers (not used by dashboard, but keep for safety)
  requestOtp: "/auth/otp/request",
  verifyOtp: "/auth/otp/verify",

  // CHV Dashboard endpoints
  me: "/auth/me", // Added above
  stats: "/chv/stats", // Already exists

  // Mothers CRUD (your existing ones)
  registerMother: "/mothers",
  searchMothers: "/mothers/search",
  mother: (id: string) => `/mothers/id/${id}`,
  visits: (id: string) => `/mothers/${id}/visits`,
  labs: (id: string) => `/mothers/${id}/labs`,
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
export async function createVisit(id: string, body: any) {
  return request<any>(`/mothers/${id}/visits`, { method: "POST", body });
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
  registrationCode?: string;
  age?: number;
  nationalId?: string;
  village?: string;
  lmp?: string;
  edd?: string | null;
  gravida?: string | number;
  parity?: string | number;
  riskLevel?: "low" | "medium" | "high";
  nextAppointment?: string | null;
  createdAt?: string;

  // 🛡️ Nurse + facility fields (used in dashboard lists)
  county?: string;
  idNumber?: string;
  weeksPregnantAtRegistration?: number;
  nurseName?: string;
  nursePhone?: string;
  facilityName?: string;
  facilityCode?: string;
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
  motherId?: string;
  motherPhone?: string;
  motherName?: string;
  dangerSign?: string;
  symptom?: string;
  message?: string;
  severity?: "critical" | "urgent" | "watch" | string;
  status: "open" | "acknowledged" | "resolved" | string;
  alertType?: string;
  nursePhone?: string;
  partnerPhone?: string;
  smsSent?: boolean;
  firedAt?: string;
  createdAt?: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
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
  registerMother: (input: {
    name: string;
    phone: string;
    age: number;
    nationalId?: string;
    village?: string;
    lmp?: string;
    edd?: string;
    gravida?: string | number;
    parity?: string | number;
    nurse_name?: string;
    nurse_phone?: string;
    facility_name?: string;
    facility_code?: string;
    nextAppointment?: string | null;
  }) =>
    request<{ mother: Mother; smsSent: boolean }>(ENDPOINTS.registerMother, {
      method: "POST",
      body: input,
    }),
  chvLogin: (phone: string, pin: string) =>
    request<{ token: string; user: Nurse }>("/nurses/login", {
      method: "POST",
      body: { phone, pin },
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
  changePin: (currentPin: string, newPin: string) =>
    request<{ message: string }>("/nurses/change-pin", {
      method: "POST",
      body: { currentPin, newPin },
    }),
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
