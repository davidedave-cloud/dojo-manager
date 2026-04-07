// Costanti e funzioni condivise tra i componenti Admin

export const BELT_COLORS = {
  "Bianca": "#f8f8f8", "Bianca/Gialla": "#FFF176", "Gialla": "#FFD700", "Arancione": "#FF8C00",
  "Verde": "#228B22", "Blu": "#1E3A8A",
  "Marrone 3° Kyu": "#8B4513", "Marrone 2° Kyu": "#7a3a10", "Marrone 1° Kyu": "#6b2f0c",
  "Nera (1° Dan)": "#1a1a1a", "Nera (2° Dan)": "#1a1a1a", "Nera (3° Dan)": "#1a1a1a",
  "Nera (4° Dan)": "#1a1a1a", "Nera (5° Dan)": "#1a1a1a",
};
export const BELT_ORDER = Object.keys(BELT_COLORS);
export const COURSES = ["Karate Adulti", "Karate Bambini", "Psicomotricità"];
export const LOCATIONS = ["Argenta", "S.M. Codifiume"];
export const HOW_FOUND = ["Passaparola (amici/famiglia)", "Facebook / Instagram", "Google / Internet", "Volantino / Locandina", "Sono passato davanti alla palestra", "Scuola / Insegnante", "Altro"];
export const TABS = ["Dashboard", "Atleti", "📋 Presenze", "Pagamenti", "💸 Bilancio", "🏆 Eventi", "📢 Bacheca", "📚 Risorse", "📊 Marketing"];
export const ANNUAL_FEE = 35;
export const MONTHLY_FEES = {
  "Karate Adulti-8": 50, "Karate Adulti-4": 35,
  "Karate Bambini-8": 50, "Karate Bambini-4": 35,
  "Psicomotricità-8": 40, "Psicomotricità-4": 25,
};
export const FAMILY_DISCOUNTS = { 1: 0, 2: 10, 3: 15, 4: 20 };
export const MONTHS_IT = ["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"];
export const SEASON_MONTHS = [9,10,11,12,1,2,3,4,5,6];

export const inputStyle = { width: "100%", background: "#0d0d0d", border: "1px solid #2a2a1a", borderRadius: 8, padding: "10px 12px", color: "#e8e0d0", fontFamily: "inherit", fontSize: 13, boxSizing: "border-box" };
export const labelStyle = { display: "block", fontSize: 11, color: "#777", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" };

export function getMonthlyFee(athlete) {
  const lessons = athlete.lessons_per_month || 8;
  const key = `${athlete.course}-${lessons}`;
  return MONTHLY_FEES[key] || 50;
}

export function calcFamilyTotal(mainAthlete, allAthletes) {
  const members = [mainAthlete, ...allAthletes.filter(a => a.parent_athlete_id === mainAthlete.id)];
  const membersEight = members.filter(m => (m.lessons_per_month || 8) === 8);
  const membersFour = members.filter(m => (m.lessons_per_month || 8) === 4);
  const totalEight = membersEight.reduce((s, m) => s + getMonthlyFee(m), 0);
  const totalFour = membersFour.reduce((s, m) => s + getMonthlyFee(m), 0);
  const discountPct = membersEight.length > 1 ? (FAMILY_DISCOUNTS[Math.min(membersEight.length, 4)] || 20) : 0;
  const discount = Math.round(totalEight * discountPct / 100);
  const total = totalEight + totalFour;
  const final = totalEight - discount + totalFour;
  return { members, total, discount, final, discountPct };
}

export const emptyAthlete = {
  first_name: "", last_name: "", email: "", mobile: "", phone: "",
  birth_date: "", birth_place: "", fiscal_code: "",
  address: "", city: "", zip: "", province: "",
  belt: "Bianca", course: "Karate Adulti", location: "Argenta",
  lessons_per_month: 8, is_minor: false,
  parent_name: "", parent_phone: "", parent_email: "", parent_cf: "",
  medical_expiry: "", notes: "", status: "approved",
  gdpr_consent: true, is_volunteer: false, start_date: "",
};
