import { useState, useEffect, useCallback } from "react";

const BELT_COLORS = {
  "Bianca": "#f8f8f8", "Gialla": "#FFD700", "Arancione": "#FF8C00",
  "Verde": "#228B22", "Blu": "#1E3A8A",
  "Marrone 3° Kyu": "#8B4513", "Marrone 2° Kyu": "#7a3a10", "Marrone 1° Kyu": "#6b2f0c",
  "Nera (1° Dan)": "#1a1a1a", "Nera (2° Dan)": "#1a1a1a", "Nera (3° Dan)": "#1a1a1a",
  "Nera (4° Dan)": "#1a1a1a", "Nera (5° Dan)": "#1a1a1a",
};
const BELT_ORDER = Object.keys(BELT_COLORS);
const COURSES = ["Karate Adulti", "Karate Bambini", "Psicomotricità"];
const LOCATIONS = ["Argenta", "S.M. Codifiume"];
const HOW_FOUND = ["Passaparola (amici/famiglia)", "Facebook / Instagram", "Google / Internet", "Volantino / Locandina", "Sono passato davanti alla palestra", "Scuola / Insegnante", "Altro"];
const TABS = ["Dashboard", "Atleti", "Lezioni", "Pagamenti", "Esami & Gare", "Bacheca", "📊 Marketing"];

const inputStyle = { width: "100%", background: "#0d0d0d", border: "1px solid #2a2a1a", borderRadius: 8, padding: "10px 12px", color: "#e8e0d0", fontFamily: "inherit", fontSize: 13, boxSizing: "border-box" };
const labelStyle = { display: "block", fontSize: 11, color: "#777", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" };

const ANNUAL_FEE = 35;
const MONTHLY_FEES = {
  "Karate Adulti-8": 50, "Karate Adulti-4": 35,
  "Karate Bambini-8": 50, "Karate Bambini-4": 35,
  "Psicomotricità-8": 40, "Psicomotricità-4": 25,
};
const FAMILY_DISCOUNTS = { 1: 0, 2: 10, 3: 15, 4: 20 };

function getMonthlyFee(athlete) {
  const lessons = athlete.lessons_per_month || 8;
  const key = `${athlete.course}-${lessons}`;
  return MONTHLY_FEES[key] || 50;
}

function calcFamilyTotal(mainAthlete, allAthletes) {
  const members = [mainAthlete, ...allAthletes.filter(a => a.parent_athlete_id === mainAthlete.id)];
  const total = members.reduce((s, m) => s + getMonthlyFee(m), 0);
  const discountPct = FAMILY_DISCOUNTS[Math.min(members.length, 4)] || 20;
  const discount = members.length > 1 ? Math.round(total * discountPct / 100) : 0;
  return { members, total, discount, final: total - discount, discountPct };
}

const MONTHS_IT = ["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"];
const SEASON_MONTHS = [9,10,11,12,1,2,3,4,5,6]; // Settembre-Giugno

function PaymentsTab({ athletes, payments, supabase, onReload, setShowReceipt, BeltBadge }) {
  const now = new Date();
  const [selMonth, setSelMonth] = useState(now.getMonth() + 1);
  const [selYear, setSelYear] = useState(now.getFullYear());
  const [showPayModal, setShowPayModal] = useState(null);
  const [payForm, setPayForm] = useState({ type: "mensile", month: now.getMonth()+1, year: now.getFullYear(), amount: "", note: "" });
  const [saving, setSaving] = useState(false);
  const [activeView, setActiveView] = useState("mese"); // "mese" | "storico" | "export"

  const mainAthletes = athletes.filter(a => !a.parent_athlete_id && a.status === "approved");

  // Pagamenti del mese selezionato
  const monthPayments = payments.filter(p => p.period_month === selMonth && p.period_year === selYear && p.status === "paid");
  const paidIds = new Set(monthPayments.map(p => p.athlete_id));
  const unpaid = mainAthletes.filter(a => !paidIds.has(a.id));
  const paid = mainAthletes.filter(a => paidIds.has(a.id));
  const totalMonth = monthPayments.reduce((s, p) => s + Number(p.amount), 0);

  // Annuale
  const annualPaid = payments.filter(p => p.payment_type === "annuale" && p.period_year === selYear);
  const annualPaidIds = new Set(annualPaid.map(p => p.athlete_id));

  async function registerPayment() {
    setSaving(true);
    const a = showPayModal;
    const family = calcFamilyTotal(a, athletes);
    const amount = payForm.amount || family.final;
    const now2 = new Date();
    const receiptNum = `RCV-${selYear}-${String(selMonth).padStart(2,"0")}-${String(Date.now()).slice(-4)}`;
    await supabase.from("payments").insert({
      athlete_id: a.id,
      amount: Number(amount),
      period_month: payForm.type === "annuale" ? null : selMonth,
      period_year: selYear,
      paid_at: now2.toISOString(),
      payment_method: "bonifico",
      receipt_number: receiptNum,
      status: "paid",
      payment_type: payForm.type,
      notes: payForm.note || null,
    });
    await onReload();
    setShowPayModal(null);
    setSaving(false);
  }

  // Export CSV per commercialista
  function exportCSV() {
    const yearPayments = payments.filter(p => p.period_year === selYear && p.status === "paid");
    const rows = [["Data", "Atleta", "Email", "Tipo", "Periodo", "Importo", "N° Ricevuta"]];
    yearPayments.forEach(p => {
      const a = athletes.find(x => x.id === p.athlete_id);
      rows.push([
        p.paid_at ? new Date(p.paid_at).toLocaleDateString("it-IT") : "",
        a ? `${a.first_name} ${a.last_name}` : "—",
        a?.email || "—",
        p.payment_type || "mensile",
        p.payment_type === "annuale" ? `Anno ${p.period_year}` : `${MONTHS_IT[(p.period_month||1)-1]} ${p.period_year}`,
        `€${p.amount}`,
        p.receipt_number || "—",
      ]);
    });
    const csv = rows.map(r => r.join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a2 = document.createElement("a");
    a2.href = url; a2.download = `pagamenti-${selYear}.csv`; a2.click();
  }

  const iStyle = { ...inputStyle, padding: "8px 10px", fontSize: 12 };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ color: "#daa520", fontSize: 22 }}>💶 Gestione Pagamenti</h2>
        <div style={{ display: "flex", gap: 8 }}>
          {["mese","storico","export"].map(v => (
            <button key={v} onClick={() => setActiveView(v)} style={{ background: activeView === v ? "linear-gradient(135deg,#b8860b,#daa520)" : "#1a1a0e", color: activeView === v ? "#0d0d0d" : "#888", border: "1px solid #2a2a1a", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 12, fontFamily: "inherit", fontWeight: activeView === v ? 700 : 400 }}>
              {v === "mese" ? "📅 Mese" : v === "storico" ? "📋 Storico" : "📤 Esporta"}
            </button>
          ))}
        </div>
      </div>

      {/* Selettore mese/anno */}
      <div style={{ display: "flex", gap: 10, marginBottom: 24, alignItems: "center" }}>
        <select value={selMonth} onChange={e => setSelMonth(Number(e.target.value))} style={{ background: "#1a1a0e", border: "1px solid #2a2a1a", borderRadius: 8, padding: "10px 14px", color: "#daa520", fontFamily: "inherit", fontSize: 13, fontWeight: 700 }}>
          {SEASON_MONTHS.map(m => <option key={m} value={m}>{MONTHS_IT[m-1]}</option>)}
        </select>
        <select value={selYear} onChange={e => setSelYear(Number(e.target.value))} style={{ background: "#1a1a0e", border: "1px solid #2a2a1a", borderRadius: 8, padding: "10px 14px", color: "#daa520", fontFamily: "inherit", fontSize: 13, fontWeight: 700 }}>
          {[2024,2025,2026].map(y => <option key={y}>{y}</option>)}
        </select>
        <div style={{ fontSize: 13, color: "#555", marginLeft: 8 }}>
          {paid.length}/{mainAthletes.length} pagati · Incassato: <strong style={{ color: "#22c55e" }}>€{totalMonth}</strong>
        </div>
      </div>

      {/* VISTA MESE */}
      {activeView === "mese" && (
        <div>
          {/* Da pagare */}
          {unpaid.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 13, color: "#ef4444", fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ background: "#ef4444", color: "#fff", borderRadius: 99, padding: "2px 10px", fontSize: 11 }}>{unpaid.length}</span>
                Non hanno ancora pagato {MONTHS_IT[selMonth-1]} {selYear}
              </div>
              {unpaid.map(a => {
                const family = calcFamilyTotal(a, athletes);
                const annualeOk = annualPaidIds.has(a.id);
                return (
                  <div key={a.id} style={{ background: "#1a1a0e", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, padding: "14px 18px", marginBottom: 8, display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: "#e8e0d0", fontSize: 14 }}>{a.first_name} {a.last_name}</div>
                      <div style={{ fontSize: 11, color: "#777", marginTop: 2 }}>
                        {a.course} · {a.location} · {a.lessons_per_month || 8} lez/mese
                        {family.members.length > 1 && <span style={{ color: "#c084fc", marginLeft: 6 }}>👨‍👩‍👦 {family.members.length} membri (-{family.discountPct}%)</span>}
                      </div>
                      {!annualeOk && <div style={{ fontSize: 11, color: "#daa520", marginTop: 2 }}>⚠️ Iscrizione annuale €{ANNUAL_FEE} non pagata</div>}
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: "#ef4444" }}>€{family.final}</div>
                      {family.members.length > 1 && <div style={{ fontSize: 10, color: "#555" }}>Tot. {family.total} - sconto {family.discount}</div>}
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => { setShowPayModal(a); setPayForm({ type: "mensile", month: selMonth, year: selYear, amount: family.final, note: "" }); }} style={{ background: "rgba(34,197,94,0.2)", color: "#22c55e", border: "1px solid #22c55e", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontSize: 12, fontFamily: "inherit", fontWeight: 600 }}>✓ Registra</button>
                      {!annualeOk && <button onClick={() => { setShowPayModal(a); setPayForm({ type: "annuale", month: selMonth, year: selYear, amount: ANNUAL_FEE, note: "Iscrizione annuale" }); }} style={{ background: "rgba(218,165,32,0.15)", color: "#daa520", border: "1px solid #daa520", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>🎫 Tessera</button>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Già pagato */}
          {paid.length > 0 && (
            <div>
              <div style={{ fontSize: 13, color: "#22c55e", fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ background: "#22c55e", color: "#fff", borderRadius: 99, padding: "2px 10px", fontSize: 11 }}>{paid.length}</span>
                Hanno pagato {MONTHS_IT[selMonth-1]} {selYear}
              </div>
              {paid.map(a => {
                const p = monthPayments.find(x => x.athlete_id === a.id);
                return (
                  <div key={a.id} style={{ background: "#1a1a0e", border: "1px solid rgba(34,197,94,0.15)", borderRadius: 12, padding: "14px 18px", marginBottom: 8, display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: "#e8e0d0", fontSize: 14 }}>{a.first_name} {a.last_name}</div>
                      <div style={{ fontSize: 11, color: "#777", marginTop: 2 }}>{a.course} · {a.location} · {p?.paid_at ? new Date(p.paid_at).toLocaleDateString("it-IT") : ""}</div>
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#22c55e" }}>€{p?.amount}</div>
                    <button onClick={() => setShowReceipt({ ...a, receiptData: p })} style={{ background: "rgba(74,158,255,0.15)", color: "#4a9eff", border: "1px solid #4a9eff", borderRadius: 8, padding: "7px 12px", cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>📄 Ricevuta</button>
                  </div>
                );
              })}
            </div>
          )}

          {mainAthletes.length === 0 && <div style={{ textAlign: "center", padding: 60, color: "#555" }}>Nessun atleta approvato.</div>}
        </div>
      )}

      {/* STORICO */}
      {activeView === "storico" && (
        <div>
          <div style={{ background: "#1a1a0e", border: "1px solid #2a2a1a", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #2a2a1a", fontSize: 13, color: "#888" }}>
              Tutti i pagamenti registrati — {selYear}
            </div>
            {payments.filter(p => p.period_year === selYear && p.status === "paid").length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: "#555" }}>Nessun pagamento per {selYear}.</div>
            ) : payments.filter(p => p.period_year === selYear && p.status === "paid").sort((a,b) => new Date(b.paid_at) - new Date(a.paid_at)).map(p => {
              const a = athletes.find(x => x.id === p.athlete_id);
              return (
                <div key={p.id} style={{ display: "flex", alignItems: "center", padding: "12px 20px", borderBottom: "1px solid #141408", gap: 14 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#e8e0d0" }}>{a ? `${a.first_name} ${a.last_name}` : "—"}</div>
                    <div style={{ fontSize: 11, color: "#666", marginTop: 1 }}>{p.receipt_number} · {p.paid_at ? new Date(p.paid_at).toLocaleDateString("it-IT") : ""}</div>
                  </div>
                  <span style={{ fontSize: 11, background: p.payment_type === "annuale" ? "rgba(218,165,32,0.15)" : "rgba(74,158,255,0.1)", color: p.payment_type === "annuale" ? "#daa520" : "#4a9eff", border: `1px solid ${p.payment_type === "annuale" ? "#daa520" : "#4a9eff"}`, borderRadius: 99, padding: "2px 8px" }}>
                    {p.payment_type === "annuale" ? "🎫 Tessera" : `📅 ${MONTHS_IT[(p.period_month||1)-1]}`}
                  </span>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#22c55e" }}>€{p.amount}</div>
                </div>
              );
            })}
            <div style={{ padding: "14px 20px", background: "#141408", display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 700 }}>
              <span style={{ color: "#777" }}>Totale {selYear}</span>
              <span style={{ color: "#22c55e" }}>€{payments.filter(p => p.period_year === selYear && p.status === "paid").reduce((s,p) => s + Number(p.amount), 0)}</span>
            </div>
          </div>
        </div>
      )}

      {/* EXPORT */}
      {activeView === "export" && (
        <div>
          <div style={{ background: "#1a1a0e", border: "1px solid #2a2a1a", borderRadius: 12, padding: 28, textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#daa520", marginBottom: 8 }}>Esporta dati per il Commercialista</div>
            <div style={{ fontSize: 13, color: "#777", marginBottom: 24, lineHeight: 1.7 }}>
              Genera un file CSV con tutti i pagamenti dell'anno {selYear}.<br />
              Include: data, atleta, tipo pagamento, importo, numero ricevuta.
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 28, maxWidth: 500, margin: "0 auto 28px" }}>
              {[
                { label: "Pagamenti mensili", value: payments.filter(p => p.period_year === selYear && p.payment_type !== "annuale" && p.status === "paid").length },
                { label: "Tessere annuali", value: payments.filter(p => p.period_year === selYear && p.payment_type === "annuale" && p.status === "paid").length },
                { label: "Totale incassato", value: `€${payments.filter(p => p.period_year === selYear && p.status === "paid").reduce((s,p) => s + Number(p.amount), 0)}` },
              ].map(s => (
                <div key={s.label} style={{ background: "#141408", borderRadius: 10, padding: 16 }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "#daa520" }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: "#555", marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>
            <button onClick={exportCSV} style={{ background: "linear-gradient(135deg,#b8860b,#daa520)", color: "#0d0d0d", border: "none", borderRadius: 10, padding: "14px 40px", cursor: "pointer", fontSize: 15, fontWeight: 700, fontFamily: "inherit" }}>
              ⬇️ Scarica CSV — {selYear}
            </button>
            <div style={{ fontSize: 11, color: "#444", marginTop: 12 }}>Il file si apre con Excel, Numbers o Google Fogli</div>
          </div>
        </div>
      )}

      {/* MODAL REGISTRA PAGAMENTO */}
      {showPayModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#1a1a0e", border: "1px solid #b8860b", borderRadius: 16, padding: 32, width: 460, maxWidth: "90vw" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#daa520" }}>Registra Pagamento</div>
                <div style={{ fontSize: 13, color: "#777", marginTop: 2 }}>{showPayModal.first_name} {showPayModal.last_name}</div>
              </div>
              <button onClick={() => setShowPayModal(null)} style={{ background: "none", border: "none", color: "#666", fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>

            {/* Riepilogo famiglia */}
            {(() => {
              const fam = calcFamilyTotal(showPayModal, athletes);
              return fam.members.length > 1 ? (
                <div style={{ background: "#141408", borderRadius: 10, padding: "12px 16px", marginBottom: 16 }}>
                  <div style={{ fontSize: 12, color: "#777", marginBottom: 8 }}>Nucleo familiare — sconto {fam.discountPct}%</div>
                  {fam.members.map(m => (
                    <div key={m.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#ccc", marginBottom: 4 }}>
                      <span>{m.first_name} {m.last_name} · {m.course} · {m.lessons_per_month || 8} lez</span>
                      <span>€{getMonthlyFee(m)}</span>
                    </div>
                  ))}
                  <div style={{ borderTop: "1px solid #2a2a1a", marginTop: 8, paddingTop: 8, display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                    <span style={{ color: "#777" }}>Totale - sconto ({fam.discount})</span>
                    <span style={{ color: "#daa520", fontWeight: 700 }}>€{fam.final}</span>
                  </div>
                </div>
              ) : null;
            })()}

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Tipo pagamento</label>
              <div style={{ display: "flex", gap: 8 }}>
                {["mensile","annuale"].map(t => (
                  <button key={t} onClick={() => setPayForm(p => ({ ...p, type: t, amount: t === "annuale" ? ANNUAL_FEE : calcFamilyTotal(showPayModal, athletes).final }))} style={{ flex: 1, background: payForm.type === t ? "linear-gradient(135deg,#b8860b,#daa520)" : "#141408", color: payForm.type === t ? "#0d0d0d" : "#888", border: `1px solid ${payForm.type === t ? "#daa520" : "#2a2a1a"}`, borderRadius: 8, padding: "10px", cursor: "pointer", fontSize: 13, fontFamily: "inherit", fontWeight: payForm.type === t ? 700 : 400 }}>
                    {t === "mensile" ? `📅 Quota mensile` : `🎫 Tessera annuale`}
                  </button>
                ))}
              </div>
            </div>

            {payForm.type === "mensile" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                <div>
                  <label style={labelStyle}>Mese</label>
                  <select value={payForm.month} onChange={e => setPayForm(p => ({ ...p, month: Number(e.target.value) }))} style={iStyle}>
                    {SEASON_MONTHS.map(m => <option key={m} value={m}>{MONTHS_IT[m-1]}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Anno</label>
                  <select value={payForm.year} onChange={e => setPayForm(p => ({ ...p, year: Number(e.target.value) }))} style={iStyle}>
                    {[2024,2025,2026].map(y => <option key={y}>{y}</option>)}
                  </select>
                </div>
              </div>
            )}

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Importo (€)</label>
              <input type="number" style={inputStyle} value={payForm.amount} onChange={e => setPayForm(p => ({ ...p, amount: e.target.value }))} placeholder="0" />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Note (opzionale)</label>
              <input style={inputStyle} value={payForm.note} onChange={e => setPayForm(p => ({ ...p, note: e.target.value }))} placeholder="Es: bonifico del 15/03/2025" />
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={registerPayment} disabled={saving} style={{ flex: 1, background: "linear-gradient(135deg,#b8860b,#daa520)", color: "#0d0d0d", border: "none", borderRadius: 10, padding: 14, cursor: "pointer", fontWeight: 700, fontSize: 14, fontFamily: "inherit", opacity: saving ? 0.7 : 1 }}>
                {saving ? "Salvataggio..." : "✓ Conferma Pagamento"}
              </button>
              <button onClick={() => setShowPayModal(null)} style={{ background: "#2a2a1a", color: "#888", border: "1px solid #3a3a2a", borderRadius: 10, padding: "14px 20px", cursor: "pointer", fontFamily: "inherit" }}>Annulla</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const emptyAthlete = {
  firstName: "", lastName: "", birthDate: "", birthPlace: "", fiscalCode: "",
  address: "", city: "", zip: "", province: "",
  email: "", mobile: "", phone: "",
  course: "", location: "", belt: "Bianca",
  isMinor: false, parentName: "", parentPhone: "", parentEmail: "",
  medicalExpiry: "", howFound: "", notes: "",
  status: "approved",
};

export default function AdminPanel({ session, supabase }) {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [athletes, setAthletes] = useState([]);
  const [payments, setPayments] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [exams, setExams] = useState([]);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAthlete, setSelectedAthlete] = useState(null);
  const [showReceipt, setShowReceipt] = useState(null);
  const [search, setSearch] = useState("");
  const [filterBelt, setFilterBelt] = useState("Tutte");
  const [filterStatus, setFilterStatus] = useState("Tutti");
  const [showAddAthlete, setShowAddAthlete] = useState(false);
  const [addMode, setAddMode] = useState("nuovo"); // "nuovo" | "familiare"
  const [parentId, setParentId] = useState(null);
  const [newAthlete, setNewAthlete] = useState(emptyAthlete);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [statsYear, setStatsYear] = useState(new Date().getFullYear());

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const [a, p, l, e, n] = await Promise.all([
      supabase.from("athletes").select("*").order("last_name"),
      supabase.from("payments").select("*").order("created_at", { ascending: false }),
      supabase.from("lessons").select("*, attendances(athlete_id)").order("lesson_date", { ascending: false }),
      supabase.from("events").select("*, event_participants(athlete_id, status)").order("event_date"),
      supabase.from("news").select("*").order("published_at", { ascending: false }),
    ]);
    setAthletes(a.data || []);
    setPayments(p.data || []);
    setLessons(l.data || []);
    setExams(e.data || []);
    setNews(n.data || []);
    setLoading(false);
  }

  async function approveAthlete(id) {
    await supabase.from("athletes").update({ status: "approved" }).eq("id", id);
    setAthletes(prev => prev.map(a => a.id === id ? { ...a, status: "approved" } : a));
  }

  async function markPaid(athleteId) {
    const now = new Date();
    const receiptNum = `RCV-${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(Date.now()).slice(-4)}`;
    await supabase.from("payments").insert({
      athlete_id: athleteId,
      amount: 60,
      period_month: now.getMonth() + 1,
      period_year: now.getFullYear(),
      paid_at: now.toISOString(),
      payment_method: "contanti",
      receipt_number: receiptNum,
      status: "paid",
    });
    await loadData();
  }

  async function saveNewAthlete() {
    setSaving(true); setSaveError("");
    const a = newAthlete;
    if (!a.firstName || !a.lastName || !a.birthDate || !a.course || !a.location) {
      setSaveError("Compila i campi obbligatori: nome, cognome, data nascita, corso, sede."); setSaving(false); return;
    }
    const payload = {
      first_name: a.firstName, last_name: a.lastName,
      birth_date: a.birthDate, birth_place: a.birthPlace, fiscal_code: a.fiscalCode || `ADMIN-${Date.now()}`,
      address: a.address, city: a.city, zip: a.zip, province: a.province,
      email: a.email || `noemail-${Date.now()}@dojo.local`,
      mobile: a.mobile, phone: a.phone,
      belt: a.belt, course: a.course, location: a.location,
      is_minor: a.isMinor,
      parent_name: a.parentName, parent_phone: a.parentPhone, parent_email: a.parentEmail,
      medical_expiry: a.medicalExpiry || null,
      how_found: a.howFound, notes: a.notes,
      status: a.status,
      gdpr_consent: true,
      parent_athlete_id: addMode === "familiare" ? parentId : null,
    };
    const { error } = await supabase.from("athletes").insert(payload);
    if (error) { setSaveError("Errore: " + error.message); setSaving(false); return; }
    await loadData();
    setShowAddAthlete(false);
    setNewAthlete(emptyAthlete);
    setSaving(false);
  }

  function openAddAthlete(mode = "nuovo", pid = null) {
    setAddMode(mode); setParentId(pid);
    setNewAthlete({ ...emptyAthlete, status: "approved" });
    setSaveError(""); setShowAddAthlete(true);
  }

  const setF = (k, v) => setNewAthlete(prev => ({ ...prev, [k]: v }));

  async function handleLogout() { await supabase.auth.signOut(); }

  const mainAthletes = athletes.filter(a => !a.parent_athlete_id);
  const pendingAthletes = mainAthletes.filter(a => a.status === "pending");
  const approvedAthletes = mainAthletes.filter(a => a.status === "approved");

  const filteredAthletes = mainAthletes.filter(a => {
    const matchSearch = `${a.first_name} ${a.last_name}`.toLowerCase().includes(search.toLowerCase()) || (a.email || "").toLowerCase().includes(search.toLowerCase());
    const matchBelt = filterBelt === "Tutte" || a.belt === filterBelt;
    const matchStatus = filterStatus === "Tutti" || a.status === filterStatus;
    return matchSearch && matchBelt && matchStatus;
  });

  // ---- STATISTICHE MARKETING ----
  const statsAthletes = mainAthletes;

  // Provenienza
  const howFoundStats = HOW_FOUND.reduce((acc, h) => {
    acc[h] = statsAthletes.filter(a => a.how_found === h).length; return acc;
  }, {});
  const howFoundTotal = Object.values(howFoundStats).reduce((s, v) => s + v, 0);

  // Iscrizioni per mese (anno selezionato)
  const monthlySignups = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    label: new Date(2000, i).toLocaleDateString("it-IT", { month: "short" }),
    count: statsAthletes.filter(a => {
      const d = new Date(a.created_at);
      return d.getFullYear() === statsYear && d.getMonth() === i;
    }).length,
  }));

  // Distribuzione età
  const now = new Date();
  const ageGroups = {
    "< 8 anni": statsAthletes.filter(a => a.birth_date && (now - new Date(a.birth_date)) / (1000*60*60*24*365.25) < 8).length,
    "8-12 anni": statsAthletes.filter(a => { const age = (now - new Date(a.birth_date)) / (1000*60*60*24*365.25); return age >= 8 && age < 13; }).length,
    "13-17 anni": statsAthletes.filter(a => { const age = (now - new Date(a.birth_date)) / (1000*60*60*24*365.25); return age >= 13 && age < 18; }).length,
    "18-30 anni": statsAthletes.filter(a => { const age = (now - new Date(a.birth_date)) / (1000*60*60*24*365.25); return age >= 18 && age < 31; }).length,
    "31-50 anni": statsAthletes.filter(a => { const age = (now - new Date(a.birth_date)) / (1000*60*60*24*365.25); return age >= 31 && age < 51; }).length,
    "> 50 anni": statsAthletes.filter(a => a.birth_date && (now - new Date(a.birth_date)) / (1000*60*60*24*365.25) >= 51).length,
  };

  // Distribuzione corsi
  const courseStats = COURSES.reduce((acc, c) => {
    acc[c] = statsAthletes.filter(a => a.course === c).length; return acc;
  }, {});

  // Distribuzione sedi
  const locationStats = LOCATIONS.reduce((acc, l) => {
    acc[l] = statsAthletes.filter(a => a.location === l).length; return acc;
  }, {});

  // Dati economici anno
  const yearPayments = payments.filter(p => p.period_year === statsYear && p.status === "paid");
  const monthlyRevenue = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    label: new Date(2000, i).toLocaleDateString("it-IT", { month: "short" }),
    amount: yearPayments.filter(p => p.period_month === i + 1).reduce((s, p) => s + Number(p.amount), 0),
  }));
  const totalYearRevenue = yearPayments.reduce((s, p) => s + Number(p.amount), 0);
  const maxMonthRevenue = Math.max(...monthlyRevenue.map(m => m.amount), 1);

  // Famiglie multi-iscritte
  const familyAthletes = mainAthletes.filter(a => athletes.some(x => x.parent_athlete_id === a.id));

  // Atleti a rischio (iscritti da > 2 mesi con status pending)
  const atRisk = mainAthletes.filter(a => {
    const daysSince = (now - new Date(a.created_at)) / (1000*60*60*24);
    return a.status === "pending" && daysSince > 60;
  });

  // ---- UI COMPONENTS ----
  const BeltBadge = ({ belt }) => {
    if (!belt) return null;
    const isBlack = belt.startsWith("Nera"); const isBrown = belt.startsWith("Marrone");
    return <span style={{ display: "inline-flex", alignItems: "center", background: isBlack ? "#1a1a1a" : isBrown ? "#8B4513" : BELT_COLORS[belt] || "#333", color: (belt === "Bianca" || belt === "Gialla" || belt === "Arancione") ? "#333" : "#fff", border: belt === "Bianca" ? "1px solid #ccc" : "none", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 600 }}>{belt}</span>;
  };

  const StatusBadge = ({ status }) => {
    const map = { approved: ["✓ Approvato", "#22c55e"], pending: ["⏳ In attesa", "#daa520"], suspended: ["✗ Sospeso", "#ef4444"] };
    const [label, color] = map[status] || ["—", "#888"];
    return <span style={{ background: `${color}20`, color, border: `1px solid ${color}`, borderRadius: 99, padding: "2px 10px", fontSize: 11, fontWeight: 600 }}>{label}</span>;
  };

  const StatCard = ({ icon, label, value, color, sub }) => (
    <div style={{ background: "linear-gradient(135deg,#1a1a0e,#141408)", border: "1px solid #2a2a1a", borderRadius: 12, padding: 20 }}>
      <div style={{ fontSize: 26, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: color || "#daa520" }}>{value}</div>
      <div style={{ fontSize: 12, color: "#777", marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>{sub}</div>}
    </div>
  );

  if (loading) return (
    <div style={{ background: "#0d0d0d", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#daa520", fontSize: 32 }}>🥋</div>
    </div>
  );

  return (
    <div style={{ fontFamily: "'Georgia','Times New Roman',serif", background: "#0d0d0d", minHeight: "100vh", color: "#e8e0d0" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#0d0d0d 0%,#1a1008 50%,#0d0d0d 100%)", borderBottom: "1px solid #b8860b", padding: "0 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 0" }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg,#b8860b,#daa520)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, boxShadow: "0 0 20px rgba(184,134,11,0.4)" }}>🥋</div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#daa520", letterSpacing: "0.05em" }}>DOJO MANAGER</div>
              <div style={{ fontSize: 11, color: "#888", letterSpacing: "0.15em", textTransform: "uppercase" }}>Pannello Admin</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ fontSize: 13, color: "#888" }}>{new Date().toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div>
            <div style={{ fontSize: 12, color: "#daa520" }}>{session?.user?.email}</div>
            <button onClick={handleLogout} style={{ background: "transparent", color: "#888", border: "1px solid #2a2a1a", borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>Esci</button>
          </div>
        </div>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", gap: 4, overflowX: "auto" }}>
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{ background: activeTab === tab ? "linear-gradient(135deg,#b8860b,#daa520)" : "transparent", color: activeTab === tab ? "#0d0d0d" : "#999", border: "none", borderRadius: "6px 6px 0 0", padding: "10px 18px", cursor: "pointer", fontSize: 13, fontWeight: activeTab === tab ? 700 : 400, fontFamily: "inherit", whiteSpace: "nowrap" }}>{tab}</button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 24px" }}>

        {/* DASHBOARD */}
        {activeTab === "Dashboard" && (
          <div>
            <h2 style={{ color: "#daa520", marginBottom: 24, fontSize: 22 }}>Panoramica Dojo</h2>
            {pendingAthletes.length > 0 && (
              <div style={{ background: "rgba(218,165,32,0.08)", border: "1px solid rgba(218,165,32,0.3)", borderRadius: 12, padding: "14px 20px", marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ color: "#daa520", fontSize: 14 }}>⚡ <strong>{pendingAthletes.length}</strong> nuova iscrizione{pendingAthletes.length > 1 ? "i" : ""} in attesa di approvazione</div>
                <button onClick={() => { setActiveTab("Atleti"); setFilterStatus("pending"); }} style={{ background: "linear-gradient(135deg,#b8860b,#daa520)", color: "#0d0d0d", border: "none", borderRadius: 8, padding: "7px 16px", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "inherit" }}>Approva ora</button>
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 32 }}>
              <StatCard icon="👥" label="Atleti Attivi" value={approvedAthletes.length} color="#4a9eff" />
              <StatCard icon="⏳" label="In Attesa" value={pendingAthletes.length} color="#daa520" />
              <StatCard icon="👨‍👩‍👦" label="Famiglie Multi-Iscritte" value={familyAthletes.length} color="#c084fc" />
              <StatCard icon="💶" label={`Incasso ${new Date().getFullYear()}`} value={`€${payments.filter(p => p.status === "paid" && p.period_year === new Date().getFullYear()).reduce((s, p) => s + Number(p.amount), 0)}`} color="#22c55e" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div style={{ background: "#1a1a0e", border: "1px solid #2a2a1a", borderRadius: 12, padding: 20 }}>
                <h3 style={{ color: "#daa520", marginBottom: 16, fontSize: 15 }}>👥 Ultimi Iscritti</h3>
                {mainAthletes.slice(0, 5).map(a => (
                  <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #2a2a1a" }}>
                    <div><div style={{ fontSize: 13, color: "#e8e0d0" }}>{a.first_name} {a.last_name}</div><div style={{ fontSize: 11, color: "#777" }}>{a.course} · {a.location}</div></div>
                    <div style={{ display: "flex", gap: 8 }}><BeltBadge belt={a.belt} /><StatusBadge status={a.status} /></div>
                  </div>
                ))}
                {mainAthletes.length === 0 && <div style={{ color: "#555", fontSize: 13 }}>Nessun atleta ancora.</div>}
              </div>
              <div style={{ background: "#1a1a0e", border: "1px solid #2a2a1a", borderRadius: 12, padding: 20 }}>
                <h3 style={{ color: "#daa520", marginBottom: 16, fontSize: 15 }}>🥋 Distribuzione Cinture</h3>
                {BELT_ORDER.map(belt => {
                  const count = mainAthletes.filter(a => a.belt === belt).length;
                  if (!count) return null;
                  return (
                    <div key={belt} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <div style={{ width: 12, height: 12, borderRadius: 2, background: BELT_COLORS[belt], border: belt === "Bianca" ? "1px solid #666" : "none", flexShrink: 0 }} />
                      <div style={{ flex: 1, fontSize: 12, color: "#ccc" }}>{belt}</div>
                      <div style={{ background: "#2a2a1a", borderRadius: 20, height: 6, flex: 2 }}><div style={{ background: "#daa520", height: "100%", borderRadius: 20, width: `${(count / mainAthletes.length) * 100}%` }} /></div>
                      <div style={{ fontSize: 12, color: "#daa520", width: 20, textAlign: "right" }}>{count}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ATLETI */}
        {activeTab === "Atleti" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ color: "#daa520", fontSize: 22 }}>Gestione Atleti ({filteredAthletes.length})</h2>
              <button onClick={() => openAddAthlete("nuovo")} style={{ background: "linear-gradient(135deg,#b8860b,#daa520)", color: "#0d0d0d", border: "none", borderRadius: 8, padding: "10px 20px", cursor: "pointer", fontWeight: 700, fontSize: 13, fontFamily: "inherit" }}>+ Nuovo Atleta</button>
            </div>
            <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cerca per nome o email..." style={{ flex: 1, minWidth: 200, background: "#1a1a0e", border: "1px solid #2a2a1a", borderRadius: 8, padding: "10px 14px", color: "#e8e0d0", fontFamily: "inherit", fontSize: 13 }} />
              <select value={filterBelt} onChange={e => setFilterBelt(e.target.value)} style={{ background: "#1a1a0e", border: "1px solid #2a2a1a", borderRadius: 8, padding: "10px 14px", color: "#e8e0d0", fontFamily: "inherit", fontSize: 13 }}>
                <option>Tutte</option>{BELT_ORDER.map(b => <option key={b}>{b}</option>)}
              </select>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ background: "#1a1a0e", border: "1px solid #2a2a1a", borderRadius: 8, padding: "10px 14px", color: "#e8e0d0", fontFamily: "inherit", fontSize: 13 }}>
                <option value="Tutti">Tutti gli stati</option>
                <option value="approved">Approvati</option>
                <option value="pending">In attesa</option>
                <option value="suspended">Sospesi</option>
              </select>
            </div>
            {filteredAthletes.length === 0 ? (
              <div style={{ textAlign: "center", padding: 60, color: "#555" }}><div style={{ fontSize: 36, marginBottom: 12 }}>👥</div><div>Nessun atleta trovato.</div></div>
            ) : (
              <div style={{ background: "#1a1a0e", border: "1px solid #2a2a1a", borderRadius: 12, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead><tr style={{ borderBottom: "1px solid #2a2a1a" }}>
                    {["Atleta", "Cintura", "Corso & Sede", "Stato", "Azioni"].map(h => (
                      <th key={h} style={{ padding: "14px 16px", textAlign: "left", fontSize: 11, color: "#777", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {filteredAthletes.map(a => {
                      const familyCount = athletes.filter(x => x.parent_athlete_id === a.id).length;
                      return (
                        <tr key={a.id} style={{ borderBottom: "1px solid #141408" }}
                          onMouseEnter={e => e.currentTarget.style.background = "#141408"}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                          <td style={{ padding: "14px 16px" }}>
                            <div style={{ fontWeight: 600, color: "#e8e0d0", fontSize: 14 }}>{a.first_name} {a.last_name}</div>
                            <div style={{ fontSize: 11, color: "#777", marginTop: 2 }}>{a.email}</div>
                            {familyCount > 0 && <div style={{ fontSize: 11, color: "#daa520", marginTop: 2 }}>👨‍👩‍👦 {familyCount} familiare{familyCount > 1 ? "i" : ""}</div>}
                          </td>
                          <td style={{ padding: "14px 16px" }}><BeltBadge belt={a.belt} /></td>
                          <td style={{ padding: "14px 16px" }}>
                            <div style={{ fontSize: 13, color: "#ccc" }}>{a.course}</div>
                            <div style={{ fontSize: 11, color: "#777" }}>📍 {a.location}</div>
                          </td>
                          <td style={{ padding: "14px 16px" }}><StatusBadge status={a.status} /></td>
                          <td style={{ padding: "14px 16px" }}>
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                              <button onClick={() => setSelectedAthlete(a)} style={{ background: "#2a2a1a", color: "#daa520", border: "1px solid #3a3a2a", borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>Dettagli</button>
                              {a.status === "pending" && <button onClick={() => approveAthlete(a.id)} style={{ background: "rgba(34,197,94,0.2)", color: "#22c55e", border: "1px solid #22c55e", borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>✓ Approva</button>}
                              {a.status === "approved" && <button onClick={() => markPaid(a.id)} style={{ background: "rgba(74,158,255,0.15)", color: "#4a9eff", border: "1px solid #4a9eff", borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>💶 Pagamento</button>}
                              <button onClick={() => openAddAthlete("familiare", a.id)} style={{ background: "rgba(192,132,252,0.15)", color: "#c084fc", border: "1px solid #c084fc", borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>+ Familiare</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* LEZIONI */}
        {activeTab === "Lezioni" && (
          <div>
            <h2 style={{ color: "#daa520", marginBottom: 24, fontSize: 22 }}>Lezioni & Presenze</h2>
            {lessons.length === 0 ? <div style={{ textAlign: "center", padding: 60, color: "#555" }}><div style={{ fontSize: 36, marginBottom: 12 }}>📅</div><div>Nessuna lezione registrata.</div></div>
              : lessons.map(l => (
                <div key={l.id} style={{ background: "#1a1a0e", border: "1px solid #2a2a1a", borderRadius: 12, padding: 20, marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                    <div><div style={{ fontSize: 18, fontWeight: 700, color: "#daa520" }}>{l.lesson_type}</div><div style={{ fontSize: 13, color: "#888", marginTop: 2 }}>Istruttore: {l.instructor} · {l.location}</div></div>
                    <div style={{ textAlign: "right" }}><div style={{ fontSize: 14, color: "#e8e0d0" }}>{new Date(l.lesson_date).toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })}</div><div style={{ fontSize: 13, color: "#daa520" }}>{l.lesson_time?.slice(0, 5)}</div></div>
                  </div>
                  <div style={{ fontSize: 11, color: "#666", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>Presenti ({l.attendances?.length || 0})</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {l.attendances?.map(att => { const a = athletes.find(x => x.id === att.athlete_id); return a ? <div key={att.athlete_id} style={{ background: "#2a2a1a", borderRadius: 20, padding: "4px 12px", fontSize: 12, color: "#ccc" }}>{a.first_name} {a.last_name}</div> : null; })}
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* PAGAMENTI */}
        {activeTab === "Pagamenti" && (
          <PaymentsTab
            athletes={athletes}
            payments={payments}
            supabase={supabase}
            onReload={loadData}
            setShowReceipt={setShowReceipt}
            BeltBadge={BeltBadge}
          />
        )}

        {/* ESAMI & GARE */}
        {activeTab === "Esami & Gare" && (
          <div>
            <h2 style={{ color: "#daa520", marginBottom: 24, fontSize: 22 }}>Esami & Gare</h2>
            {exams.length === 0 ? <div style={{ textAlign: "center", padding: 60, color: "#555" }}><div style={{ fontSize: 36, marginBottom: 12 }}>🏆</div><div>Nessun evento in programma.</div></div>
              : exams.map(e => (
                <div key={e.id} style={{ background: "#1a1a0e", border: "1px solid #2a2a1a", borderRadius: 12, padding: 24, marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                    <div><div style={{ fontSize: 20, fontWeight: 700, color: "#daa520" }}>{e.event_type}</div>{e.notes && <div style={{ fontSize: 13, color: "#888", marginTop: 4 }}>{e.notes}</div>}</div>
                    <div style={{ background: "#2a2a1a", borderRadius: 8, padding: "8px 16px", textAlign: "center" }}><div style={{ fontSize: 20, fontWeight: 700, color: "#e8e0d0" }}>{new Date(e.event_date).toLocaleDateString("it-IT", { day: "numeric", month: "short" }).toUpperCase()}</div><div style={{ fontSize: 11, color: "#777" }}>{new Date(e.event_date).getFullYear()}</div></div>
                  </div>
                  <div style={{ fontSize: 11, color: "#666", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>Partecipanti ({e.event_participants?.length || 0})</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {e.event_participants?.map(ep => { const a = athletes.find(x => x.id === ep.athlete_id); return a ? <div key={ep.athlete_id} style={{ background: "#2a2a1a", borderRadius: 8, padding: "8px 14px" }}><div style={{ fontSize: 13, color: "#e8e0d0", fontWeight: 600 }}>{a.first_name} {a.last_name}</div><BeltBadge belt={a.belt} /></div> : null; })}
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* BACHECA */}
        {activeTab === "Bacheca" && (
          <div>
            <h2 style={{ color: "#daa520", marginBottom: 24, fontSize: 22 }}>Bacheca Comunicazioni</h2>
            {news.length === 0 ? <div style={{ textAlign: "center", padding: 60, color: "#555" }}><div style={{ fontSize: 36, marginBottom: 12 }}>📢</div><div>Nessuna comunicazione.</div></div>
              : news.map(n => (
                <div key={n.id} style={{ background: "#1a1a0e", border: `1px solid ${n.important ? "#b91c1c" : "#2a2a1a"}`, borderRadius: 12, padding: 24, marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>{n.important && <span style={{ background: "#b91c1c", color: "#fff", fontSize: 10, padding: "2px 8px", borderRadius: 10, fontWeight: 700 }}>⚡ IMPORTANTE</span>}<h3 style={{ color: "#e8e0d0", fontSize: 17, margin: 0 }}>{n.title}</h3></div>
                      <p style={{ color: "#999", fontSize: 14, margin: 0, lineHeight: 1.6 }}>{n.body}</p>
                    </div>
                    <div style={{ fontSize: 12, color: "#555", marginLeft: 20, flexShrink: 0 }}>{new Date(n.published_at).toLocaleDateString("it-IT")}</div>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* MARKETING & STATISTICHE */}
        {activeTab === "📊 Marketing" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ color: "#daa520", fontSize: 22 }}>📊 Marketing & Statistiche</h2>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <label style={{ fontSize: 12, color: "#777" }}>Anno:</label>
                <select value={statsYear} onChange={e => setStatsYear(Number(e.target.value))} style={{ background: "#1a1a0e", border: "1px solid #2a2a1a", borderRadius: 8, padding: "8px 12px", color: "#daa520", fontFamily: "inherit", fontSize: 13, fontWeight: 700 }}>
                  {[2023, 2024, 2025, 2026].map(y => <option key={y}>{y}</option>)}
                </select>
              </div>
            </div>

            {/* KPI principali */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 28 }}>
              <StatCard icon="👥" label="Atleti Totali" value={mainAthletes.length} color="#4a9eff" sub={`${approvedAthletes.length} approvati`} />
              <StatCard icon="👨‍👩‍👦" label="Famiglie Multi-Iscritte" value={familyAthletes.length} color="#c084fc" sub="Alto valore" />
              <StatCard icon="💶" label={`Incasso ${statsYear}`} value={`€${totalYearRevenue}`} color="#22c55e" sub={`${yearPayments.length} pagamenti`} />
              <StatCard icon="📈" label="Media Mensile" value={`€${Math.round(totalYearRevenue / 12)}`} color="#daa520" sub="Media annuale" />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>

              {/* Provenienza iscritti */}
              <div style={{ background: "#1a1a0e", border: "1px solid #2a2a1a", borderRadius: 12, padding: 20 }}>
                <h3 style={{ color: "#daa520", marginBottom: 4, fontSize: 15 }}>📣 Da dove arrivano i nuovi iscritti</h3>
                <div style={{ fontSize: 11, color: "#555", marginBottom: 16 }}>Utile per capire dove investire in marketing</div>
                {HOW_FOUND.map(h => {
                  const count = howFoundStats[h] || 0;
                  const pct = howFoundTotal > 0 ? Math.round((count / howFoundTotal) * 100) : 0;
                  return (
                    <div key={h} style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 12, color: "#ccc" }}>{h}</span>
                        <span style={{ fontSize: 12, color: "#daa520", fontWeight: 700 }}>{count} ({pct}%)</span>
                      </div>
                      <div style={{ background: "#2a2a1a", borderRadius: 99, height: 6 }}>
                        <div style={{ background: "linear-gradient(90deg,#b8860b,#daa520)", height: "100%", borderRadius: 99, width: `${pct}%`, transition: "width 0.5s" }} />
                      </div>
                    </div>
                  );
                })}
                {howFoundTotal === 0 && <div style={{ color: "#555", fontSize: 13 }}>Dati non ancora disponibili.</div>}
              </div>

              {/* Distribuzione età */}
              <div style={{ background: "#1a1a0e", border: "1px solid #2a2a1a", borderRadius: 12, padding: 20 }}>
                <h3 style={{ color: "#daa520", marginBottom: 4, fontSize: 15 }}>🎂 Distribuzione per Età</h3>
                <div style={{ fontSize: 11, color: "#555", marginBottom: 16 }}>Utile per calibrare i corsi offerti</div>
                {Object.entries(ageGroups).map(([label, count]) => {
                  const total = Object.values(ageGroups).reduce((s, v) => s + v, 0);
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  return (
                    <div key={label} style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 12, color: "#ccc" }}>{label}</span>
                        <span style={{ fontSize: 12, color: "#4a9eff", fontWeight: 700 }}>{count} ({pct}%)</span>
                      </div>
                      <div style={{ background: "#2a2a1a", borderRadius: 99, height: 6 }}>
                        <div style={{ background: "linear-gradient(90deg,#1E3A8A,#4a9eff)", height: "100%", borderRadius: 99, width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Iscrizioni per mese */}
              <div style={{ background: "#1a1a0e", border: "1px solid #2a2a1a", borderRadius: 12, padding: 20 }}>
                <h3 style={{ color: "#daa520", marginBottom: 4, fontSize: 15 }}>📅 Nuove Iscrizioni per Mese — {statsYear}</h3>
                <div style={{ fontSize: 11, color: "#555", marginBottom: 16 }}>Picchi stagionali — quando fare campagne promozionali</div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 120 }}>
                  {monthlySignups.map(m => {
                    const max = Math.max(...monthlySignups.map(x => x.count), 1);
                    const h = Math.max((m.count / max) * 100, m.count > 0 ? 8 : 2);
                    return (
                      <div key={m.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                        <div style={{ fontSize: 10, color: "#daa520" }}>{m.count > 0 ? m.count : ""}</div>
                        <div style={{ width: "100%", height: `${h}%`, background: m.count > 0 ? "linear-gradient(180deg,#daa520,#b8860b)" : "#2a2a1a", borderRadius: "4px 4px 0 0", minHeight: 3 }} />
                        <div style={{ fontSize: 9, color: "#555" }}>{m.label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Distribuzione corsi e sedi */}
              <div style={{ background: "#1a1a0e", border: "1px solid #2a2a1a", borderRadius: 12, padding: 20 }}>
                <h3 style={{ color: "#daa520", marginBottom: 4, fontSize: 15 }}>🥋 Corsi & Sedi</h3>
                <div style={{ fontSize: 11, color: "#555", marginBottom: 16 }}>Dove concentrare risorse e istruttori</div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, color: "#888", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>Per Corso</div>
                  {Object.entries(courseStats).map(([course, count]) => {
                    const pct = mainAthletes.length > 0 ? Math.round((count / mainAthletes.length) * 100) : 0;
                    return (
                      <div key={course} style={{ marginBottom: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                          <span style={{ fontSize: 12, color: "#ccc" }}>{course}</span>
                          <span style={{ fontSize: 12, color: "#22c55e", fontWeight: 700 }}>{count} ({pct}%)</span>
                        </div>
                        <div style={{ background: "#2a2a1a", borderRadius: 99, height: 5 }}><div style={{ background: "linear-gradient(90deg,#166534,#22c55e)", height: "100%", borderRadius: 99, width: `${pct}%` }} /></div>
                      </div>
                    );
                  })}
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#888", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>Per Sede</div>
                  {Object.entries(locationStats).map(([loc, count]) => {
                    const pct = mainAthletes.length > 0 ? Math.round((count / mainAthletes.length) * 100) : 0;
                    return (
                      <div key={loc} style={{ marginBottom: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                          <span style={{ fontSize: 12, color: "#ccc" }}>{loc}</span>
                          <span style={{ fontSize: 12, color: "#c084fc", fontWeight: 700 }}>{count} ({pct}%)</span>
                        </div>
                        <div style={{ background: "#2a2a1a", borderRadius: 99, height: 5 }}><div style={{ background: "linear-gradient(90deg,#7e22ce,#c084fc)", height: "100%", borderRadius: 99, width: `${pct}%` }} /></div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bilancio economico annuale */}
            <div style={{ background: "#1a1a0e", border: "1px solid #2a2a1a", borderRadius: 12, padding: 20, marginBottom: 20 }}>
              <h3 style={{ color: "#daa520", marginBottom: 4, fontSize: 15 }}>💶 Bilancio Economico — {statsYear}</h3>
              <div style={{ fontSize: 11, color: "#555", marginBottom: 20 }}>Andamento incassi mensili per bilancio annuale di attività</div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 140, marginBottom: 12 }}>
                {monthlyRevenue.map(m => {
                  const h = Math.max((m.amount / maxMonthRevenue) * 100, m.amount > 0 ? 6 : 2);
                  return (
                    <div key={m.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      <div style={{ fontSize: 10, color: "#22c55e", fontWeight: 700 }}>{m.amount > 0 ? `€${m.amount}` : ""}</div>
                      <div style={{ width: "100%", height: `${h}%`, background: m.amount > 0 ? "linear-gradient(180deg,#22c55e,#166534)" : "#2a2a1a", borderRadius: "4px 4px 0 0", minHeight: 3 }} />
                      <div style={{ fontSize: 9, color: "#555" }}>{m.label}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginTop: 16 }}>
                {[
                  { label: `Totale incassato ${statsYear}`, value: `€${totalYearRevenue}`, color: "#22c55e" },
                  { label: "Mese con più incassi", value: monthlyRevenue.reduce((a, b) => b.amount > a.amount ? b : a, { amount: 0, label: "—" }).label, color: "#daa520" },
                  { label: "Media mensile", value: `€${Math.round(totalYearRevenue / 12)}`, color: "#4a9eff" },
                ].map(s => (
                  <div key={s.label} style={{ background: "#141408", borderRadius: 10, padding: "14px 16px", textAlign: "center" }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: "#555", marginTop: 4 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Atleti a rischio */}
            {atRisk.length > 0 && (
              <div style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, padding: 20 }}>
                <h3 style={{ color: "#ef4444", marginBottom: 12, fontSize: 15 }}>⚠️ Situazioni da Verificare</h3>
                <div style={{ fontSize: 12, color: "#777", marginBottom: 12 }}>Iscritti da più di 60 giorni ancora in attesa di approvazione</div>
                {atRisk.map(a => (
                  <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid rgba(239,68,68,0.1)" }}>
                    <div><div style={{ fontSize: 13, color: "#e8e0d0" }}>{a.first_name} {a.last_name}</div><div style={{ fontSize: 11, color: "#777" }}>{a.email} · {a.course}</div></div>
                    <button onClick={() => approveAthlete(a.id)} style={{ background: "rgba(34,197,94,0.2)", color: "#22c55e", border: "1px solid #22c55e", borderRadius: 6, padding: "5px 12px", cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>✓ Approva</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL: Dettaglio Atleta */}
      {selectedAthlete && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={() => setSelectedAthlete(null)}>
          <div style={{ background: "#1a1a0e", border: "1px solid #b8860b", borderRadius: 16, padding: 32, width: 520, maxWidth: "90vw", maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
              <div>
                <h2 style={{ color: "#daa520", margin: 0, fontSize: 20 }}>{selectedAthlete.first_name} {selectedAthlete.last_name}</h2>
                <div style={{ marginTop: 8, display: "flex", gap: 8 }}><BeltBadge belt={selectedAthlete.belt} /><StatusBadge status={selectedAthlete.status} /></div>
              </div>
              <button onClick={() => setSelectedAthlete(null)} style={{ background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: 20 }}>✕</button>
            </div>
            {[
              ["📧 Email", selectedAthlete.email], ["📞 Cellulare", selectedAthlete.mobile],
              ["🎂 Data nascita", selectedAthlete.birth_date ? new Date(selectedAthlete.birth_date).toLocaleDateString("it-IT") : "—"],
              ["🏠 Città", selectedAthlete.city], ["🥋 Corso", selectedAthlete.course],
              ["📍 Sede", selectedAthlete.location], ["🏥 Cert. medico", selectedAthlete.medical_expiry ? new Date(selectedAthlete.medical_expiry).toLocaleDateString("it-IT") : "—"],
              ...(selectedAthlete.is_minor ? [["👨‍👩‍👦 Genitore", selectedAthlete.parent_name], ["📞 Tel. genitore", selectedAthlete.parent_phone]] : []),
              ...(selectedAthlete.notes ? [["📝 Note", selectedAthlete.notes]] : []),
            ].map(([label, val]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #2a2a1a" }}>
                <span style={{ fontSize: 13, color: "#777" }}>{label}</span>
                <span style={{ fontSize: 13, color: "#e8e0d0" }}>{val || "—"}</span>
              </div>
            ))}
            {athletes.filter(a => a.parent_athlete_id === selectedAthlete.id).length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 12, color: "#777", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>Familiari</div>
                {athletes.filter(a => a.parent_athlete_id === selectedAthlete.id).map(m => (
                  <div key={m.id} style={{ background: "#2a2a1a", borderRadius: 8, padding: "10px 14px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div><div style={{ fontSize: 13, color: "#e8e0d0" }}>{m.first_name} {m.last_name}</div><div style={{ fontSize: 11, color: "#777" }}>{m.course} · {m.location}</div></div>
                    <div style={{ display: "flex", gap: 6 }}><BeltBadge belt={m.belt} /><StatusBadge status={m.status} /></div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              {selectedAthlete.status === "pending" && <button onClick={() => { approveAthlete(selectedAthlete.id); setSelectedAthlete(null); }} style={{ flex: 1, background: "rgba(34,197,94,0.2)", color: "#22c55e", border: "1px solid #22c55e", borderRadius: 8, padding: 10, cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>✓ Approva Iscrizione</button>}
              {selectedAthlete.status === "approved" && <button onClick={() => { markPaid(selectedAthlete.id); setSelectedAthlete(null); }} style={{ flex: 1, background: "rgba(74,158,255,0.15)", color: "#4a9eff", border: "1px solid #4a9eff", borderRadius: 8, padding: 10, cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>💶 Registra Pagamento</button>}
              <button onClick={() => { openAddAthlete("familiare", selectedAthlete.id); setSelectedAthlete(null); }} style={{ flex: 1, background: "rgba(192,132,252,0.15)", color: "#c084fc", border: "1px solid #c084fc", borderRadius: 8, padding: 10, cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>+ Aggiungi Familiare</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Ricevuta */}
      {showReceipt && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={() => setShowReceipt(null)}>
          <div style={{ background: "#fff", borderRadius: 12, padding: 40, width: 480, maxWidth: "90vw", color: "#111" }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: "center", marginBottom: 24, borderBottom: "2px solid #b8860b", paddingBottom: 20 }}>
              <div style={{ fontSize: 28, marginBottom: 4 }}>🥋</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#b8860b" }}>DOJO KARATE</div>
              <div style={{ fontSize: 11, color: "#888", letterSpacing: "0.1em" }}>RICEVUTA DI PAGAMENTO</div>
            </div>
            <div style={{ background: "#f9f6f0", borderRadius: 8, padding: 16, marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span style={{ fontSize: 12, color: "#666" }}>N° Ricevuta</span><span style={{ fontSize: 12, fontWeight: 600 }}>RCV-{Date.now().toString().slice(-6)}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: 12, color: "#666" }}>Data</span><span style={{ fontSize: 12, fontWeight: 600 }}>{new Date().toLocaleDateString("it-IT")}</span></div>
            </div>
            {[["Intestatario", `${showReceipt.first_name} ${showReceipt.last_name}`], ["Email", showReceipt.email], ["Periodo", new Date().toLocaleDateString("it-IT", { month: "long", year: "numeric" })], ["Descrizione", "Quota mensile associativa"], ["Cintura", showReceipt.belt], ["Corso", showReceipt.course], ["Sede", showReceipt.location]].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #eee" }}><span style={{ fontSize: 13, color: "#666" }}>{k}</span><span style={{ fontSize: 13, fontWeight: 500 }}>{v}</span></div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20, padding: 16, background: "#b8860b", borderRadius: 8, color: "#fff" }}><span style={{ fontSize: 16, fontWeight: 700 }}>TOTALE</span><span style={{ fontSize: 20, fontWeight: 700 }}>€60,00</span></div>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={() => window.print()} style={{ flex: 1, background: "#b8860b", color: "#fff", border: "none", borderRadius: 8, padding: 12, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>🖨️ Stampa</button>
              <button onClick={() => setShowReceipt(null)} style={{ flex: 1, background: "#f0f0f0", color: "#333", border: "none", borderRadius: 8, padding: 12, cursor: "pointer", fontSize: 13 }}>Chiudi</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Aggiungi Atleta / Familiare */}
      {showAddAthlete && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
          <div style={{ background: "#1a1a0e", border: "1px solid #b8860b", borderRadius: 16, padding: 32, width: 560, maxWidth: "100%", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div>
                <h2 style={{ color: "#daa520", margin: 0, fontSize: 20 }}>{addMode === "familiare" ? "👨‍👩‍👦 Aggiungi Familiare" : "👤 Nuovo Atleta"}</h2>
                {addMode === "familiare" && parentId && (
                  <div style={{ fontSize: 12, color: "#777", marginTop: 4 }}>
                    Collegato a: {athletes.find(a => a.id === parentId)?.first_name} {athletes.find(a => a.id === parentId)?.last_name}
                  </div>
                )}
              </div>
              <button onClick={() => setShowAddAthlete(false)} style={{ background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: 20 }}>✕</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div><label style={labelStyle}>Nome *</label><input style={inputStyle} value={newAthlete.firstName} onChange={e => setF("firstName", e.target.value)} placeholder="Mario" /></div>
              <div><label style={labelStyle}>Cognome *</label><input style={inputStyle} value={newAthlete.lastName} onChange={e => setF("lastName", e.target.value)} placeholder="Rossi" /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div><label style={labelStyle}>Data di nascita *</label><input type="date" style={inputStyle} value={newAthlete.birthDate} onChange={e => setF("birthDate", e.target.value)} /></div>
              <div><label style={labelStyle}>Luogo di nascita</label><input style={inputStyle} value={newAthlete.birthPlace} onChange={e => setF("birthPlace", e.target.value)} placeholder="Ferrara" /></div>
            </div>
            <div style={{ marginBottom: 12 }}><label style={labelStyle}>Codice Fiscale</label><input style={{ ...inputStyle, textTransform: "uppercase" }} value={newAthlete.fiscalCode} onChange={e => setF("fiscalCode", e.target.value.toUpperCase())} placeholder="RSSMRI80A01D548X" maxLength={16} /></div>

            {addMode === "nuovo" && (
              <>
                <div style={{ marginBottom: 12 }}><label style={labelStyle}>Email</label><input type="email" style={inputStyle} value={newAthlete.email} onChange={e => setF("email", e.target.value)} placeholder="mario@email.com" /></div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                  <div><label style={labelStyle}>Cellulare</label><input style={inputStyle} value={newAthlete.mobile} onChange={e => setF("mobile", e.target.value)} placeholder="333 1234567" /></div>
                  <div><label style={labelStyle}>Tel. fisso</label><input style={inputStyle} value={newAthlete.phone} onChange={e => setF("phone", e.target.value)} placeholder="0532 123456" /></div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
                  <div><label style={labelStyle}>Città</label><input style={inputStyle} value={newAthlete.city} onChange={e => setF("city", e.target.value)} placeholder="Argenta" /></div>
                  <div><label style={labelStyle}>CAP</label><input style={inputStyle} value={newAthlete.zip} onChange={e => setF("zip", e.target.value)} placeholder="44011" maxLength={5} /></div>
                  <div><label style={labelStyle}>Prov.</label><input style={inputStyle} value={newAthlete.province} onChange={e => setF("province", e.target.value)} placeholder="FE" maxLength={2} /></div>
                </div>
              </>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
              <div>
                <label style={labelStyle}>Corso *</label>
                <select style={inputStyle} value={newAthlete.course} onChange={e => setF("course", e.target.value)}>
                  <option value="">Seleziona...</option>
                  {COURSES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Sede *</label>
                <select style={inputStyle} value={newAthlete.location} onChange={e => setF("location", e.target.value)}>
                  <option value="">Seleziona...</option>
                  {LOCATIONS.map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <label style={labelStyle}>Cintura</label>
                <select style={inputStyle} value={newAthlete.belt} onChange={e => setF("belt", e.target.value)}>
                  {BELT_ORDER.map(b => <option key={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Stato iscrizione</label>
                <select style={inputStyle} value={newAthlete.status} onChange={e => setF("status", e.target.value)}>
                  <option value="approved">Approvato</option>
                  <option value="pending">In attesa</option>
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div><label style={labelStyle}>Scadenza cert. medico</label><input type="date" style={inputStyle} value={newAthlete.medicalExpiry} onChange={e => setF("medicalExpiry", e.target.value)} /></div>
              <div>
                <label style={labelStyle}>Come ci ha trovati</label>
                <select style={inputStyle} value={newAthlete.howFound} onChange={e => setF("howFound", e.target.value)}>
                  <option value="">Seleziona...</option>
                  {HOW_FOUND.map(h => <option key={h}>{h}</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}><label style={labelStyle}>Note</label><textarea style={{ ...inputStyle, height: 70, resize: "vertical" }} value={newAthlete.notes} onChange={e => setF("notes", e.target.value)} placeholder="Infortuni, allergie, note particolari..." /></div>

            {saveError && <div style={{ color: "#ef4444", fontSize: 12, padding: "10px 14px", background: "rgba(239,68,68,0.08)", borderRadius: 8, border: "1px solid rgba(239,68,68,0.2)", marginBottom: 14 }}>⚠️ {saveError}</div>}

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={saveNewAthlete} disabled={saving} style={{ flex: 1, background: "linear-gradient(135deg,#b8860b,#daa520)", color: "#0d0d0d", border: "none", borderRadius: 10, padding: 14, cursor: "pointer", fontWeight: 700, fontSize: 14, fontFamily: "inherit", opacity: saving ? 0.7 : 1 }}>
                {saving ? "Salvataggio..." : addMode === "familiare" ? "✓ Aggiungi Familiare" : "✓ Salva Atleta"}
              </button>
              <button onClick={() => setShowAddAthlete(false)} style={{ background: "#2a2a1a", color: "#888", border: "1px solid #3a3a2a", borderRadius: 10, padding: "14px 20px", cursor: "pointer", fontFamily: "inherit" }}>Annulla</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
