export type ClinicalFlag = {
  severity: "critical" | "warning" | "info";
  condition: string;
  finding: string;
  action: string;
};

export function analyseANCVisit(data: {
  bpSystolic: number;
  bpDiastolic: number;
  weight: number;
  previousWeight?: number;
  fundalHeight: number;
  fetalHeartRate: number;
  urineProtein: string;
  gestationalWeek: number;
  age: number;
  conditions: string[];
}): ClinicalFlag[] {
  const flags: ClinicalFlag[] = [];

  // ── Blood pressure ──────────────────────────────────────────────────────
  if (data.bpSystolic >= 160 || data.bpDiastolic >= 110) {
    flags.push({
      severity: "critical",
      condition: "Severe Hypertension / Possible Eclampsia",
      finding: `BP ${data.bpSystolic}/${data.bpDiastolic} mmHg — severely elevated`,
      action:
        "ADMIT IMMEDIATELY. MgSO4 4g IV loading dose. Antihypertensives stat. Call doctor. Do not discharge.",
    });
  } else if (data.bpSystolic >= 140 || data.bpDiastolic >= 90) {
    const hasProtein = data.urineProtein && data.urineProtein.toLowerCase() !== "negative";
    flags.push({
      severity: "warning",
      condition: hasProtein
        ? "Preeclampsia (hypertension + proteinuria)"
        : "Gestational Hypertension",
      finding: `BP ${data.bpSystolic}/${data.bpDiastolic} mmHg${
        hasProtein ? " with proteinuria" : ""
      }`,
      action: hasProtein
        ? "Refer to hospital. 24h urine protein. MgSO4 prophylaxis. Deliver if ≥ 37 weeks."
        : "Recheck BP in 30 minutes. 24h urine. Antihypertensives if persistent.",
    });
  }

  // ── Foetal heart rate ───────────────────────────────────────────────────
  if (data.fetalHeartRate > 0) {
    if (data.fetalHeartRate < 110) {
      flags.push({
        severity: "critical",
        condition: "Foetal Bradycardia",
        finding: `FHR ${data.fetalHeartRate} bpm — below normal (110–160)`,
        action: "URGENT: Left lateral position. Give oxygen. Refer immediately for CTG monitoring.",
      });
    } else if (data.fetalHeartRate > 160) {
      flags.push({
        severity: "warning",
        condition: "Foetal Tachycardia",
        finding: `FHR ${data.fetalHeartRate} bpm — above normal (110–160)`,
        action:
          "Check maternal temperature. Rule out infection. CTG recommended. Recheck in 30 min.",
      });
    }
  }

  // ── Weight ──────────────────────────────────────────────────────────────
  if (data.previousWeight && data.weight < data.previousWeight - 1) {
    flags.push({
      severity: "warning",
      condition: "Unexplained Weight Loss",
      finding: `Weight reduced from ${data.previousWeight}kg to ${data.weight}kg`,
      action:
        "Assess for hyperemesis, poor nutrition or illness. Dietary counselling. Consider admission if severe.",
    });
  }

  if (data.weight > 0 && data.weight < 45) {
    flags.push({
      severity: "warning",
      condition: "Low Maternal Weight",
      finding: `Weight ${data.weight}kg — nutritional assessment required`,
      action: "Nutritional counselling. Consider food supplementation programme. Monitor for IUGR.",
    });
  }

  // ── Fundal height ───────────────────────────────────────────────────────
  if (data.fundalHeight > 0 && data.gestationalWeek > 20) {
    const diff = data.fundalHeight - data.gestationalWeek;
    if (Math.abs(diff) > 3) {
      flags.push({
        severity: "warning",
        condition:
          diff > 0
            ? "Large for gestational age (possible macrosomia/polyhydramnios)"
            : "Small for gestational age (possible IUGR)",
        finding: `Fundal height ${data.fundalHeight}cm — expected ~${data.gestationalWeek}cm at week ${data.gestationalWeek}`,
        action:
          diff > 0
            ? "Ultrasound recommended. Screen for gestational diabetes. Plan hospital delivery."
            : "Ultrasound for growth assessment. Doppler studies. Nutrition review. Increase monitoring.",
      });
    }
  }

  // ── Proteinuria ─────────────────────────────────────────────────────────
  const proteinStr = (data.urineProtein || "").toLowerCase();
  if (proteinStr === "++" || proteinStr === "+++" || proteinStr === "2+" || proteinStr === "3+") {
    flags.push({
      severity: "critical",
      condition: "Significant Proteinuria",
      finding: `Urine protein ${data.urineProtein} — possible severe preeclampsia`,
      action:
        "Refer urgently. 24h urine collection. Check BP. Assess for preeclampsia. Do not delay.",
    });
  }

  return flags;
}
