/**
 * Local demo dataset used only when the live API endpoint is unreachable,
 * so the dashboard stays usable in the facility while the backend routes
 * are being finalised. Data persists in localStorage on the device.
 */
import type { AncVisit, Alert, LabResult, Mother, Nurse, Stats, Vaccination } from "./api";
import { flagLab, flagVisit, generateRegistrationCode } from "./api";

type DB = {
  mothers: Mother[];
  visits: AncVisit[];
  labs: LabResult[];
  vaccinations: Vaccination[];
  alerts: Alert[];
};

const KEY = "mnm_demo_db";

function today(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function seed(): DB {
  const mothers: Mother[] = [
    {
      id: "m1",
      name: "Amina Wanjiku",
      phone: "+254712345678",
      registrationCode: "K7H2M9QD",
      age: 27,
      village: "Kiambu Town",
      lmp: today(-180),
      edd: today(100),
      gravida: 2,
      parity: 1,
      riskLevel: "medium",
      nextAppointment: today(6),
      createdAt: today(-170),
    },
    {
      id: "m2",
      name: "Grace Achieng",
      phone: "+254720998877",
      registrationCode: "P4T8RB2N",
      age: 32,
      village: "Ndumberi",
      lmp: today(-240),
      edd: today(40),
      gravida: 4,
      parity: 3,
      riskLevel: "high",
      nextAppointment: today(0),
      createdAt: today(-230),
    },
    {
      id: "m3",
      name: "Faith Chebet",
      phone: "+254733112233",
      registrationCode: "Z9C3XW6K",
      age: 22,
      village: "Riabai",
      lmp: today(-90),
      edd: today(190),
      gravida: 1,
      parity: 0,
      riskLevel: "low",
      nextAppointment: today(14),
      createdAt: today(-80),
    },
  ];

  const visits: AncVisit[] = [
    {
      id: "v1",
      motherId: "m1",
      visitDate: today(-28),
      gestationWeeks: 22,
      bpSystolic: 118,
      bpDiastolic: 76,
      weightKg: 64.5,
      fundalHeightCm: 22,
      fetalHeartRate: 142,
      urineProtein: "negative",
      urineGlucose: "negative",
      notes: "Doing well. Iron and folate supplied.",
      nextAppointment: today(6),
      flags: [],
    },
    {
      id: "v2",
      motherId: "m2",
      visitDate: today(-14),
      gestationWeeks: 34,
      bpSystolic: 148,
      bpDiastolic: 96,
      weightKg: 78.2,
      fundalHeightCm: 33,
      fetalHeartRate: 136,
      urineProtein: "++",
      urineGlucose: "negative",
      notes: "Referred to clinician for review.",
      nextAppointment: today(0),
      flags: ["High blood pressure", "Proteinuria"],
    },
  ];

  const labs: LabResult[] = [
    {
      id: "l1",
      motherId: "m2",
      testDate: today(-14),
      bloodGroup: "O+",
      hb: 9.4,
      hivStatus: "negative",
      urinalysis: "protein present",
      bloodSugar: 5.2,
      syphilis: "non-reactive",
      flags: ["Anaemia (Hb < 11)", "Abnormal urinalysis"],
    },
  ];

  const vaccinations: Vaccination[] = [
    {
      id: "vac1",
      motherId: "m1",
      vaccine: "Tetanus-Diphtheria (TD)",
      dose: "TD2",
      givenDate: today(-28),
      batchNumber: "TD-2291",
      administeredBy: "Nurse on duty",
      nextDueDate: today(150),
    },
  ];

  const alerts: Alert[] = [
    {
      id: "a1",
      motherId: "m2",
      motherName: "Grace Achieng",
      motherPhone: "+254720998877",
      dangerSign: "Severe headache & blurred vision",
      severity: "critical",
      message: "Reported via USSD. Last BP 148/96 with proteinuria.",
      status: "open",
      createdAt: new Date(Date.now() - 3600_000).toISOString(),
    },
    {
      id: "a2",
      motherId: "m1",
      motherName: "Amina Wanjiku",
      motherPhone: "+254712345678",
      dangerSign: "Reduced fetal movement",
      severity: "urgent",
      message: "Mother reports fewer kicks since yesterday evening.",
      status: "open",
      createdAt: new Date(Date.now() - 26 * 3600_000).toISOString(),
    },
    {
      id: "a3",
      motherId: "m3",
      motherName: "Faith Chebet",
      motherPhone: "+254733112233",
      dangerSign: "Persistent vomiting",
      severity: "watch",
      message: "Advised on hydration, follow up in 48 hours.",
      status: "resolved",
      createdAt: new Date(Date.now() - 5 * 24 * 3600_000).toISOString(),
    },
  ];

  return { mothers, visits, labs, vaccinations, alerts };
}

function load(): DB {
  if (typeof window === "undefined") return seed();
  const raw = window.localStorage.getItem(KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as DB;
    } catch {
      /* fall through */
    }
  }
  const db = seed();
  save(db);
  return db;
}

function save(db: DB) {
  if (typeof window !== "undefined") window.localStorage.setItem(KEY, JSON.stringify(db));
}

const id = () => Math.random().toString(36).slice(2, 10);
const wait = <T,>(v: T) => new Promise<T>((r) => setTimeout(() => r(v), 250));

export async function requestOtp(_phone: string) {
  return wait({ sent: true });
}

export async function verifyOtp(phone: string, code: string) {
  if (!/^\d{6}$/.test(code)) throw new Error("Enter the 6-digit code");
  const user: Nurse = {
    id: "n1",
    name: "Nurse Mercy Njeri",
    phone,
    facility: "Kiambu Level 4 Hospital",
    role: "Midwife",
  };
  return wait({ token: `demo.${id()}`, user });
}

export async function stats(): Promise<Stats> {
  const db = load();
  const month = new Date().toISOString().slice(0, 7);
  return wait({
    mothersRegistered: db.mothers.length,
    ancVisitsThisMonth: db.visits.filter((v) => v.visitDate.startsWith(month)).length,
    openAlerts: db.alerts.filter((a) => a.status === "open").length,
    appointmentsToday: db.mothers.filter((m) => m.nextAppointment === today()).length,
    highRiskMothers: db.mothers.filter((m) => m.riskLevel === "high").length,
    vaccinationsThisMonth: db.vaccinations.filter((v) => v.givenDate.startsWith(month)).length,
  });
}

export async function registerMother(
  input: Omit<Mother, "id" | "registrationCode" | "createdAt" | "riskLevel">,
) {
  const db = load();
  const mother: Mother = {
    ...input,
    id: id(),
    registrationCode: generateRegistrationCode(),
    riskLevel: input.age >= 35 || input.age < 18 || input.gravida >= 5 ? "high" : "low",
    createdAt: new Date().toISOString().slice(0, 10),
  };
  db.mothers.unshift(mother);
  save(db);
  return wait({ mother, smsSent: true });
}

export async function searchMothers(q: string) {
  const db = load();
  const needle = q.trim().toLowerCase();
  const results = !needle
    ? db.mothers
    : db.mothers.filter(
        (m) =>
          m.name.toLowerCase().includes(needle) ||
          m.phone.replace(/\s/g, "").includes(needle.replace(/\s/g, "")) ||
          m.registrationCode.toLowerCase() === needle,
      );
  return wait(results);
}

export async function mother(mid: string) {
  const found = load().mothers.find((m) => m.id === mid);
  if (!found) throw new Error("Mother not found");
  return wait(found);
}

export async function visits(mid: string) {
  return wait(
    load()
      .visits.filter((v) => v.motherId === mid)
      .sort((a, b) => b.visitDate.localeCompare(a.visitDate)),
  );
}

export async function createVisit(mid: string, body: Omit<AncVisit, "id" | "motherId" | "flags">) {
  const db = load();
  const visit: AncVisit = { ...body, id: id(), motherId: mid, flags: flagVisit(body) };
  db.visits.unshift(visit);
  const m = db.mothers.find((x) => x.id === mid);
  if (m) {
    m.nextAppointment = body.nextAppointment ?? m.nextAppointment ?? null;
    if (visit.flags.length) m.riskLevel = "high";
  }
  save(db);
  return wait(visit);
}

export async function labs(mid: string) {
  return wait(
    load()
      .labs.filter((l) => l.motherId === mid)
      .sort((a, b) => b.testDate.localeCompare(a.testDate)),
  );
}

export async function createLab(mid: string, body: Omit<LabResult, "id" | "motherId" | "flags">) {
  const db = load();
  const lab: LabResult = { ...body, id: id(), motherId: mid, flags: flagLab(body) };
  db.labs.unshift(lab);
  save(db);
  return wait(lab);
}

export async function vaccinations(mid: string) {
  return wait(
    load()
      .vaccinations.filter((v) => v.motherId === mid)
      .sort((a, b) => b.givenDate.localeCompare(a.givenDate)),
  );
}

export async function createVaccination(mid: string, body: Omit<Vaccination, "id" | "motherId">) {
  const db = load();
  const vac: Vaccination = { ...body, id: id(), motherId: mid };
  db.vaccinations.unshift(vac);
  save(db);
  return wait(vac);
}

export async function alerts() {
  return wait(
    load().alerts.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  );
}

export async function updateAlert(aid: string, status: Alert["status"]) {
  const db = load();
  const a = db.alerts.find((x) => x.id === aid);
  if (!a) throw new Error("Alert not found");
  a.status = status;
  save(db);
  return wait(a);
}
