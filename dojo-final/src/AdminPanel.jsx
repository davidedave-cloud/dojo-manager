import React, { useState, useEffect } from "react";
import { supabase } from "./supabase.js";
import { printModuloTesseramento } from "./printModulo.js";
import {
  BELT_COLORS, BELT_ORDER, COURSES, LOCATIONS, HOW_FOUND, TABS,
  MONTHS_IT, inputStyle, labelStyle, calcFamilyTotal, getMonthlyFee, emptyAthlete
} from "./adminConstants.js";
import PaymentsTab from "./PaymentsTab.jsx";
import PresenzeTab from "./PresenzeTab.jsx";
import BachecaTab from "./BachecaTab.jsx";
import RisorseTab from "./RisorseTab.jsx";
import EsamiTab from "./EsamiTab.jsx";
import BilancioTab from "./BilancioTab.jsx";

export default function AdminPanel({ session, supabase }) {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [athletes, setAthletes] = useState([]);
  const [payments, setPayments] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [exams, setExams] = useState([]);
  const [news, setNews] = useState([]);
  const [resources, setResources] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAthlete, setSelectedAthlete] = useState(null);
  const [athleteAttendances, setAthleteAttendances] = useState([]);
  const [showReceipt, setShowReceipt] = useState(null);
  const [search, setSearch] = useState("");
  const [filterBelt, setFilterBelt] = useState("Tutte");
  const [filterStatus, setFilterStatus] = useState("active");
  const [showAddAthlete, setShowAddAthlete] = useState(false);
  const [addMode, setAddMode] = useState("nuovo"); // "nuovo" | "familiare"
  const [parentId, setParentId] = useState(null);
  const [newAthlete, setNewAthlete] = useState(emptyAthlete);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [statsYear, setStatsYear] = useState(new Date().getFullYear());
  const [stagione, setStagione] = useState("2025/2026");
  const [editAthlete, setEditAthlete] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [bulkSelected, setBulkSelected] = useState(new Set());
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkForm, setBulkForm] = useState({ field: "belt", value: "" });
  const [bulkSaving, setBulkSaving] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData(silent = false) {
    if (!silent) setLoading(true);
    const [a, p, l, e, n, r, ex] = await Promise.all([
      supabase.from("athletes").select("*").order("last_name"),
      supabase.from("payments").select("*").order("created_at", { ascending: false }),
      supabase.from("lessons").select("*, attendances(athlete_id)").order("lesson_date", { ascending: false }),
      supabase.from("events").select("*, event_participants(athlete_id, status)").order("event_date"),
      supabase.from("news").select("*").order("published_at", { ascending: false }),
      supabase.from("resources").select("*").order("created_at", { ascending: false }),
      supabase.from("expenses").select("*").order("period_year", { ascending: false }),
    ]);
    setAthletes(a.data || []);
    setPayments(p.data || []);
    setLessons(l.data || []);
    setExams(e.data || []);
    setNews(n.data || []);
    setResources(r.data || []);
    setExpenses(ex.data || []);
    setLoading(false);
  }

  async function approveAthlete(id) {
    await supabase.from("athletes").update({ status: "approved" }).eq("id", id);
    setAthletes(prev => prev.map(a => a.id === id ? { ...a, status: "approved" } : a));
    // Manda email di benvenuto via EmailJS
    const athlete = athletes.find(a => a.id === id);
    if (athlete?.email && !athlete.email.includes("@dojo.local")) {
      try {
        const ORARI_MAP = {
          "Karate": {
            "Argenta": "Martedì: Bambini 17:15-18:15 / Adulti 20:30-21:30\nVenerdì: Bambini 17:15-18:15 / Adulti 19:00-20:00\nPresso: Argenta GymH24, Via Nervi 4",
            "S.M. Codifiume": "Lunedì e Giovedì: Bambini 17:00-18:00 / Adulti 19:00-20:00\nPresso: PalaCodifiume, Via Verga 16",
          },
          "Psicomotricità": {
            "S.M. Codifiume": "Lunedì e Giovedì: 18:00-18:45\nPresso: PalaCodifiume, Via Verga 16",
          },
        };
        const courseKey = athlete.course?.startsWith("Karate") ? "Karate" : "Psicomotricità";
        const orari = ORARI_MAP[courseKey]?.[athlete.location] || "Contatta il Sensei per gli orari";
        const monthlyFee = athlete.lessons_per_month === 4 ? (courseKey === "Karate" ? "€35,00/mese" : "€25,00/mese") : (courseKey === "Karate" ? "€50,00/mese" : "€40,00/mese");
        const year = new Date().getFullYear();
        await window.emailjs.send("dojo_service", "template_ev24aes", {
          to_email: athlete.email,
          email: athlete.email,
          athlete_name: `${athlete.first_name} ${athlete.last_name}`,
          course: athlete.course,
          location: athlete.location,
          orari,
          monthly_fee: monthlyFee,
          causale: `Prima quota + Tessera ${year} — ${athlete.first_name} ${athlete.last_name}`,
        });
      } catch(e) { console.warn("Email benvenuto non inviata:", e); }
    }
  }

  async function suspendAthlete(id) {
    await supabase.from("athletes").update({ status: "suspended" }).eq("id", id);
    setAthletes(prev => prev.map(a => a.id === id ? { ...a, status: "suspended" } : a));
    setSelectedAthlete(null);
  }

  async function reactivateAthlete(id) {
    await supabase.from("athletes").update({ status: "approved" }).eq("id", id);
    setAthletes(prev => prev.map(a => a.id === id ? { ...a, status: "approved" } : a));
    setSelectedAthlete(null);
  }

  async function saveBulkEdit() {
    if (bulkSelected.size === 0 || !bulkForm.value) return;
    setBulkSaving(true);
    const ids = Array.from(bulkSelected);
    await supabase.from("athletes").update({ [bulkForm.field]: bulkForm.value }).in("id", ids);
    await loadData();
    setBulkSelected(new Set());
    setBulkMode(false);
    setBulkSaving(false);
  }

  async function saveEditAthlete() {
    const { error } = await supabase.from("athletes").update({
      first_name: editForm.first_name,
      last_name: editForm.last_name,
      email: editForm.email,
      mobile: editForm.mobile,
      city: editForm.city,
      address: editForm.address,
      zip: editForm.zip,
      birth_date: editForm.birth_date || null,
      fiscal_code: editForm.fiscal_code,
      belt: editForm.belt,
      course: editForm.course,
      location: editForm.location,
      lessons_per_month: Number(editForm.lessons_per_month) || 8,
      medical_expiry: editForm.medical_expiry || null,
      parent_name: editForm.parent_name,
      parent_phone: editForm.parent_phone,
      parent_email: editForm.parent_email,
      notes: editForm.notes,
      start_date: editForm.start_date || null,
    }).eq("id", editAthlete.id);
    if (!error) { await loadData(); setEditAthlete(null); }
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
  const pendingAthletes = mainAthletes.filter(a => a.status === "pending" && a.status !== "suspended");
  const approvedAthletes = athletes.filter(a => a.status === "approved" && a.status !== "suspended");

  const filteredAthletes = athletes.filter(a => {
    const matchSearch = `${a.first_name} ${a.last_name}`.toLowerCase().includes(search.toLowerCase()) || (a.email || "").toLowerCase().includes(search.toLowerCase());
    const matchBelt = filterBelt === "Tutte" || a.belt === filterBelt;
    const matchStatus = filterStatus === "Tutti" || (filterStatus === "active" && a.status !== "suspended") || a.status === filterStatus;
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
    return <span style={{ display: "inline-flex", alignItems: "center", background: isBlack ? "#1a1a1a" : isBrown ? "#8B4513" : BELT_COLORS[belt] || "#333", color: (belt === "Bianca" || belt === "Bianca/Gialla" || belt === "Gialla" || belt === "Arancione") ? "#333" : "#fff", border: belt === "Bianca" ? "1px solid #ccc" : "none", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 600 }}>{belt}</span>;
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
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 11, color: "#555" }}>Stagione:</span>
              <select value={stagione} onChange={e => setStagione(e.target.value)} style={{ background: "#1a1408", border: "1px solid #2a2a1a", borderRadius: 6, padding: "4px 8px", color: "#daa520", fontFamily: "inherit", fontSize: 11, fontWeight: 700 }}>
                {["2024/2025","2025/2026","2026/2027","2027/2028"].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
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
              <div style={{ background: "rgba(218,165,32,0.08)", border: "1px solid rgba(218,165,32,0.3)", borderRadius: 12, padding: "14px 20px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ color: "#daa520", fontSize: 14 }}>⚡ <strong>{pendingAthletes.length}</strong> nuova iscrizione{pendingAthletes.length > 1 ? "i" : ""} in attesa di approvazione</div>
                <button onClick={() => { setActiveTab("Atleti"); setFilterStatus("pending"); }} style={{ background: "linear-gradient(135deg,#b8860b,#daa520)", color: "#0d0d0d", border: "none", borderRadius: 8, padding: "7px 16px", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "inherit" }}>Approva ora</button>
              </div>
            )}
            {payments.filter(p => p.status === "pending_verification").length > 0 && (
              <div style={{ background: "rgba(74,158,255,0.08)", border: "1px solid rgba(74,158,255,0.3)", borderRadius: 12, padding: "14px 20px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ color: "#4a9eff", fontSize: 14 }}>💶 <strong>{payments.filter(p => p.status === "pending_verification").length}</strong> pagamento{payments.filter(p => p.status === "pending_verification").length > 1 ? "i" : ""} da verificare</div>
                <button onClick={() => setActiveTab("Pagamenti")} style={{ background: "linear-gradient(135deg,#1E3A8A,#4a9eff)", color: "#fff", border: "none", borderRadius: 8, padding: "7px 16px", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "inherit" }}>Verifica ora</button>
              </div>
            )}
            {/* Alert certificati caricati da verificare */}
            {(() => {
              const daVerificare = athletes.filter(a => (a.medical_file || a.medical_file_anagrafica) && !a.medical_verified && a.status !== "suspended");
              if (daVerificare.length === 0) return null;
              return (
                <div style={{ background: "rgba(192,132,252,0.08)", border: "1px solid rgba(192,132,252,0.3)", borderRadius: 12, padding: "14px 20px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ color: "#c084fc", fontSize: 14, fontWeight: 700, marginBottom: 6 }}>📋 {daVerificare.length} certificato{daVerificare.length > 1 ? "i" : ""} da verificare</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{daVerificare.map(a => <span key={a.id} style={{ fontSize: 12, color: "#c084fc", background: "rgba(192,132,252,0.1)", padding: "3px 10px", borderRadius: 99 }}>{a.first_name} {a.last_name}</span>)}</div>
                  </div>
                  <button onClick={() => setActiveTab("Atleti")} style={{ background: "linear-gradient(135deg,#7c3aed,#c084fc)", color: "#fff", border: "none", borderRadius: 8, padding: "7px 16px", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "inherit", flexShrink: 0 }}>Verifica</button>
                </div>
              );
            })()}
            {/* Alert certificati in scadenza */}
            {(() => {
              const today = new Date();
              const in30 = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
              const expiring = athletes.filter(a => a.medical_expiry && new Date(a.medical_expiry) <= in30 && new Date(a.medical_expiry) >= today && a.status !== "suspended");
              const expired = athletes.filter(a => a.medical_expiry && new Date(a.medical_expiry) < today && a.status !== "suspended");
              return (
                <>
                  {expired.length > 0 && (
                    <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 12, padding: "14px 20px", marginBottom: 16 }}>
                      <div style={{ color: "#ef4444", fontSize: 14, fontWeight: 700, marginBottom: 6 }}>🚨 {expired.length} certificato{expired.length > 1 ? "i" : ""} SCADUTO{expired.length > 1 ? "I" : ""}</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{expired.map(a => <span key={a.id} style={{ fontSize: 12, color: "#ef4444", background: "rgba(239,68,68,0.1)", padding: "3px 10px", borderRadius: 99 }}>{a.first_name} {a.last_name} · scad. {new Date(a.medical_expiry).toLocaleDateString("it-IT")}</span>)}</div>
                    </div>
                  )}
                  {expiring.length > 0 && (
                    <div style={{ background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.3)", borderRadius: 12, padding: "14px 20px", marginBottom: 16 }}>
                      <div style={{ color: "#eab308", fontSize: 14, fontWeight: 700, marginBottom: 6 }}>⚠️ {expiring.length} certificato{expiring.length > 1 ? "i" : ""} in scadenza entro 30 giorni</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{expiring.map(a => <span key={a.id} style={{ fontSize: 12, color: "#eab308", background: "rgba(234,179,8,0.1)", padding: "3px 10px", borderRadius: 99 }}>{a.first_name} {a.last_name} · scad. {new Date(a.medical_expiry).toLocaleDateString("it-IT")}</span>)}</div>
                    </div>
                  )}
                </>
              );
            })()}
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
                  const count = mainAthletes.filter(a => a.belt === belt && a.course !== "Psicomotricità").length;
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 10 }}>
              <h2 style={{ color: "#daa520", fontSize: 22 }}>Gestione Atleti ({filteredAthletes.length} — di cui {athletes.filter(a => a.parent_athlete_id).length} familiari)</h2>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => { setBulkMode(!bulkMode); setBulkSelected(new Set()); }} style={{ background: bulkMode ? "rgba(218,165,32,0.2)" : "#1a1a0e", color: bulkMode ? "#daa520" : "#888", border: `1px solid ${bulkMode ? "#daa520" : "#2a2a1a"}`, borderRadius: 8, padding: "10px 16px", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>
                  {bulkMode ? `✓ ${bulkSelected.size} selezionati` : "☑️ Modifica multipla"}
                </button>
                {bulkMode && bulkSelected.size > 0 && (
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <select value={bulkForm.field} onChange={e => setBulkForm(p => ({...p, field: e.target.value, value: ""}))} style={{ background: "#1a1a0e", border: "1px solid #2a2a1a", borderRadius: 8, padding: "10px 12px", color: "#e8e0d0", fontFamily: "inherit", fontSize: 13 }}>
                      <option value="belt">Cintura</option>
                      <option value="course">Corso</option>
                      <option value="location">Sede</option>
                      <option value="lessons_per_month">Lezioni/mese</option>
                      <option value="status">Stato</option>
                    </select>
                    {bulkForm.field === "belt" && <select value={bulkForm.value} onChange={e => setBulkForm(p => ({...p, value: e.target.value}))} style={{ background: "#1a1a0e", border: "1px solid #b8860b", borderRadius: 8, padding: "10px 12px", color: "#daa520", fontFamily: "inherit", fontSize: 13 }}><option value="">Seleziona...</option>{BELT_ORDER.map(b => <option key={b}>{b}</option>)}</select>}
                    {bulkForm.field === "course" && <select value={bulkForm.value} onChange={e => setBulkForm(p => ({...p, value: e.target.value}))} style={{ background: "#1a1a0e", border: "1px solid #b8860b", borderRadius: 8, padding: "10px 12px", color: "#daa520", fontFamily: "inherit", fontSize: 13 }}><option value="">Seleziona...</option>{COURSES.map(c => <option key={c}>{c}</option>)}</select>}
                    {bulkForm.field === "location" && <select value={bulkForm.value} onChange={e => setBulkForm(p => ({...p, value: e.target.value}))} style={{ background: "#1a1a0e", border: "1px solid #b8860b", borderRadius: 8, padding: "10px 12px", color: "#daa520", fontFamily: "inherit", fontSize: 13 }}><option value="">Seleziona...</option>{LOCATIONS.map(l => <option key={l}>{l}</option>)}</select>}
                    {bulkForm.field === "lessons_per_month" && <select value={bulkForm.value} onChange={e => setBulkForm(p => ({...p, value: e.target.value}))} style={{ background: "#1a1a0e", border: "1px solid #b8860b", borderRadius: 8, padding: "10px 12px", color: "#daa520", fontFamily: "inherit", fontSize: 13 }}><option value="">Seleziona...</option><option value="4">4 lezioni</option><option value="8">8 lezioni</option></select>}
                    {bulkForm.field === "status" && <select value={bulkForm.value} onChange={e => setBulkForm(p => ({...p, value: e.target.value}))} style={{ background: "#1a1a0e", border: "1px solid #b8860b", borderRadius: 8, padding: "10px 12px", color: "#daa520", fontFamily: "inherit", fontSize: 13 }}><option value="">Seleziona...</option><option value="approved">Approvato</option><option value="suspended">Sospeso</option></select>}
                    <button onClick={saveBulkEdit} disabled={bulkSaving || !bulkForm.value} style={{ background: "linear-gradient(135deg,#b8860b,#daa520)", color: "#0d0d0d", border: "none", borderRadius: 8, padding: "10px 18px", cursor: "pointer", fontWeight: 700, fontSize: 13, fontFamily: "inherit", opacity: bulkSaving || !bulkForm.value ? 0.6 : 1 }}>
                      {bulkSaving ? "..." : "✓ Applica"}
                    </button>
                  </div>
                )}
                <button onClick={() => openAddAthlete("nuovo")} style={{ background: "linear-gradient(135deg,#b8860b,#daa520)", color: "#0d0d0d", border: "none", borderRadius: 8, padding: "10px 20px", cursor: "pointer", fontWeight: 700, fontSize: 13, fontFamily: "inherit" }}>+ Nuovo Atleta</button>
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cerca per nome o email..." style={{ flex: 1, minWidth: 200, background: "#1a1a0e", border: "1px solid #2a2a1a", borderRadius: 8, padding: "10px 14px", color: "#e8e0d0", fontFamily: "inherit", fontSize: 13 }} />
              <select value={filterBelt} onChange={e => setFilterBelt(e.target.value)} style={{ background: "#1a1a0e", border: "1px solid #2a2a1a", borderRadius: 8, padding: "10px 14px", color: "#e8e0d0", fontFamily: "inherit", fontSize: 13 }}>
                <option>Tutte</option>{BELT_ORDER.map(b => <option key={b}>{b}</option>)}
              </select>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ background: "#1a1a0e", border: "1px solid #2a2a1a", borderRadius: 8, padding: "10px 14px", color: "#e8e0d0", fontFamily: "inherit", fontSize: 13 }}>
                <option value="active">Attivi (no sospesi)</option>
                <option value="Tutti">Tutti gli stati</option>
                <option value="approved">Solo approvati</option>
                <option value="pending">In attesa</option>
                <option value="suspended">Sospesi</option>
              </select>
            </div>
            {filteredAthletes.length === 0 ? (
              <div style={{ textAlign: "center", padding: 60, color: "#555" }}><div style={{ fontSize: 36, marginBottom: 12 }}>👥</div><div>Nessun atleta trovato.</div></div>
            ) : (
              <div style={{ background: "#1a1a0e", border: "1px solid #2a2a1a", borderRadius: 12, overflow: "hidden", overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
                  <thead><tr style={{ borderBottom: "1px solid #2a2a1a" }}>
                    {[...(bulkMode ? [""] : []), "Atleta", "Cintura", "Corso & Sede", "Stato", "Azioni"].map(h => (
                      <th key={h} style={{ padding: "14px 16px", textAlign: "left", fontSize: 11, color: "#777", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {filteredAthletes.map(a => {
                      const familyCount = athletes.filter(x => x.parent_athlete_id === a.id).length;
                      return (
                        <tr key={a.id} style={{ borderBottom: "1px solid #141408", background: bulkSelected.has(a.id) ? "rgba(218,165,32,0.05)" : "transparent" }}
                          onMouseEnter={e => { if (!bulkSelected.has(a.id)) e.currentTarget.style.background = "#141408"; }}
                          onMouseLeave={e => { if (!bulkSelected.has(a.id)) e.currentTarget.style.background = "transparent"; }}>
                          {bulkMode && <td style={{ padding: "14px 16px", width: 40 }}><input type="checkbox" checked={bulkSelected.has(a.id)} onChange={() => { const s = new Set(bulkSelected); s.has(a.id) ? s.delete(a.id) : s.add(a.id); setBulkSelected(s); }} style={{ width: 18, height: 18, accentColor: "#daa520", cursor: "pointer" }} /></td>}
                          <td style={{ padding: "14px 16px" }}>
                            <div style={{ fontWeight: 600, color: "#e8e0d0", fontSize: 14 }}>{a.first_name} {a.last_name}</div>
                            <div style={{ fontSize: 11, color: "#777", marginTop: 2 }}>{a.email}</div>
                            {familyCount > 0 && <div style={{ fontSize: 11, color: "#daa520", marginTop: 2 }}>👨‍👩‍👦 {familyCount} familiare{familyCount > 1 ? "i" : ""}</div>}
                            {a.parent_athlete_id && (() => { const parent = athletes.find(x => x.id === a.parent_athlete_id); return parent ? <div style={{ fontSize: 11, color: "#c084fc", marginTop: 2 }}>👤 Familiare di {parent.first_name} {parent.last_name}</div> : null; })()}
                            {a.is_volunteer && <div style={{ fontSize: 11, color: "#22c55e", marginTop: 2 }}>🤝 Volontario — esonero quota</div>}
                          </td>
                          <td style={{ padding: "14px 16px" }}>{a.course !== "Psicomotricità" && <BeltBadge belt={a.belt} />}</td>
                          <td style={{ padding: "14px 16px" }}>
                            <div style={{ fontSize: 13, color: "#ccc" }}>{a.course}</div>
                            <div style={{ fontSize: 11, color: "#777" }}>📍 {a.location}</div>
                          </td>
                          <td style={{ padding: "14px 16px", minWidth: 160, whiteSpace: "nowrap" }}><StatusBadge status={a.status} /></td>
                          <td style={{ padding: "14px 16px", minWidth: 420, whiteSpace: "nowrap" }}>
                            <div style={{ display: "flex", gap: 6, flexWrap: "nowrap", alignItems: "center" }}>
                              <button onClick={async () => {
                          setSelectedAthlete(a);
                          const { data: att } = await supabase
                            .from("attendances")
                            .select("*, lessons(lesson_date, lesson_type, location)")
                            .eq("athlete_id", a.id)
                            .eq("present", true)
                            .order("created_at", { ascending: false });
                          setAthleteAttendances(att || []);
                        }} style={{ background: "#2a2a1a", color: "#daa520", border: "1px solid #3a3a2a", borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>Dettagli</button>
                              {a.status === "pending" && <button onClick={() => approveAthlete(a.id)} style={{ background: "rgba(34,197,94,0.2)", color: "#22c55e", border: "1px solid #22c55e", borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>✓ Approva</button>}
                              {a.status === "approved" && <button onClick={() => setActiveTab("Pagamenti")} style={{ background: "rgba(74,158,255,0.15)", color: "#4a9eff", border: "1px solid #4a9eff", borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>💶 Pagamento</button>}
                              <button onClick={() => openAddAthlete("familiare", a.id)} style={{ background: "rgba(192,132,252,0.15)", color: "#c084fc", border: "1px solid #c084fc", borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>+ Familiare</button>
                              <button onClick={async () => { await supabase.from("athletes").update({ is_volunteer: !a.is_volunteer }).eq("id", a.id); loadData(); }} style={{ background: a.is_volunteer ? "rgba(34,197,94,0.2)" : "rgba(100,100,100,0.1)", color: a.is_volunteer ? "#22c55e" : "#666", border: `1px solid ${a.is_volunteer ? "#22c55e" : "#444"}`, borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>🤝 {a.is_volunteer ? "Volontario ✓" : "Volontario"}</button>
                              <button onClick={() => printModuloTesseramento(a, stagione)} style={{ background: "rgba(234,179,8,0.1)", color: "#eab308", border: "1px solid #eab308", borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>🖨️ Modulo</button>
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

        {/* PRESENZE */}
        {activeTab === "📋 Presenze" && (
          <PresenzeTab athletes={athletes} lessons={lessons} supabase={supabase} onReload={loadData} BeltBadge={BeltBadge} />
        )}

        {/* PAGAMENTI */}
        {activeTab === "Pagamenti" && (
          <PaymentsTab
            athletes={athletes}
            payments={payments}
            supabase={supabase}
            onReload={() => loadData(true)}
            setShowReceipt={setShowReceipt}
            BeltBadge={BeltBadge}
          />
        )}

        {/* BILANCIO */}
        {activeTab === "💸 Bilancio" && (
          <BilancioTab payments={payments} expenses={expenses} supabase={supabase} onReload={loadData} />
        )}

        {/* ESAMI & GARE */}
        {activeTab === "🏆 Eventi" && (
          <EsamiTab athletes={athletes} exams={exams} supabase={supabase} onReload={loadData} BeltBadge={BeltBadge} BELT_ORDER={BELT_ORDER} />
        )}

        {/* RISORSE */}
        {activeTab === "📚 Risorse" && (
          <RisorseTab resources={resources} supabase={supabase} onReload={loadData} />
        )}

        {/* BACHECA */}
        {activeTab === "📢 Bacheca" && (
          <BachecaTab news={news} supabase={supabase} onReload={loadData} athletes={athletes} />
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
                <div style={{ marginTop: 8, display: "flex", gap: 8 }}>{selectedAthlete.course !== "Psicomotricità" && <BeltBadge belt={selectedAthlete.belt} />}<StatusBadge status={selectedAthlete.status} /></div>
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
              ...(selectedAthlete.is_volunteer ? [["🤝 Stato", "Volontario — esonero quota mensile"]] : []),
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
            {/* Sezione certificati */}
            {(selectedAthlete.medical_file || selectedAthlete.medical_file_anagrafica) && (
              <div style={{ marginTop: 16, background: "rgba(192,132,252,0.06)", border: "1px solid rgba(192,132,252,0.2)", borderRadius: 10, padding: "14px 16px" }}>
                <div style={{ fontSize: 12, color: "#c084fc", fontWeight: 700, marginBottom: 10 }}>📋 Documenti caricati dall'atleta</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {selectedAthlete.medical_file_anagrafica && (
                    <button onClick={async () => {
                      const { data } = await supabase.storage.from("pagamenti").createSignedUrl(selectedAthlete.medical_file_anagrafica, 60);
                      if (data?.signedUrl) window.open(data.signedUrl, "_blank");
                    }} style={{ fontSize: 12, color: "#c084fc", textDecoration: "none", background: "rgba(192,132,252,0.1)", padding: "6px 12px", borderRadius: 6, display: "inline-block", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                      📋 Pagina anagrafica libretto verde →
                    </button>
                  )}
                  {selectedAthlete.medical_file && (
                    <button onClick={async () => {
                      const { data } = await supabase.storage.from("pagamenti").createSignedUrl(selectedAthlete.medical_file, 60);
                      if (data?.signedUrl) window.open(data.signedUrl, "_blank");
                    }} style={{ fontSize: 12, color: "#c084fc", textDecoration: "none", background: "rgba(192,132,252,0.1)", padding: "6px 12px", borderRadius: 6, display: "inline-block", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                      🏥 Certificato medico →
                    </button>
                  )}
                </div>
                <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 10 }}>
                  {selectedAthlete.medical_verified
                    ? <span style={{ fontSize: 12, color: "#22c55e" }}>✅ Verificato</span>
                    : <button onClick={async () => {
                        await supabase.from("athletes").update({ medical_verified: true }).eq("id", selectedAthlete.id);
                        await loadData();
                        setSelectedAthlete(prev => ({...prev, medical_verified: true}));
                      }} style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e", border: "1px solid #22c55e", borderRadius: 6, padding: "6px 14px", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>
                        ✓ Segna come verificato
                      </button>
                  }
                  {selectedAthlete.medical_verified && (
                    <button onClick={async () => {
                      await supabase.from("athletes").update({ medical_verified: false }).eq("id", selectedAthlete.id);
                      await loadData();
                      setSelectedAthlete(prev => ({...prev, medical_verified: false}));
                    }} style={{ background: "none", border: "none", color: "#555", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>
                      Annulla verifica
                    </button>
                  )}
                </div>
              </div>
            )}
            {/* Sezione presenze */}
            <div style={{ marginTop: 16, background: "#0d0c07", border: "1px solid #2a2010", borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ fontSize: 12, color: "#daa520", fontWeight: 700, marginBottom: 10 }}>📋 Presenze ({athleteAttendances.length} totali)</div>
              {athleteAttendances.length === 0 ? (
                <div style={{ fontSize: 12, color: "#555" }}>Nessuna presenza registrata.</div>
              ) : (() => {
                const byMonth = {};
                athleteAttendances.forEach(a => {
                  if (!a.lessons?.lesson_date) return;
                  const d = new Date(a.lessons.lesson_date);
                  const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
                  if (!byMonth[key]) byMonth[key] = [];
                  byMonth[key].push(a);
                });
                const MONTHS = ["","Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"];
                return Object.keys(byMonth).sort((a,b) => b.localeCompare(a)).map(key => {
                  const [year, month] = key.split("-");
                  return (
                    <div key={key} style={{ marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #1a1a0e" }}>
                      <span style={{ fontSize: 12, color: "#8a7a6a" }}>{MONTHS[parseInt(month)]} {year}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#22c55e" }}>{byMonth[key].length} lezioni</span>
                    </div>
                  );
                });
              })()}
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              {selectedAthlete.status === "pending" && <button onClick={() => { approveAthlete(selectedAthlete.id); setSelectedAthlete(null); }} style={{ flex: 1, background: "rgba(34,197,94,0.2)", color: "#22c55e", border: "1px solid #22c55e", borderRadius: 8, padding: 10, cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>✓ Approva Iscrizione</button>}
              <button onClick={() => printModuloTesseramento(selectedAthlete, stagione)} style={{ flex: 1, background: "rgba(218,165,32,0.15)", color: "#daa520", border: "1px solid #daa520", borderRadius: 8, padding: 10, cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>🖨️ Stampa Modulo</button>
              {selectedAthlete.status === "approved" && <button onClick={() => { setActiveTab("Pagamenti"); setSelectedAthlete(null); }} style={{ flex: 1, background: "rgba(74,158,255,0.15)", color: "#4a9eff", border: "1px solid #4a9eff", borderRadius: 8, padding: 10, cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>💶 Vai ai Pagamenti</button>}
              <button onClick={() => { openAddAthlete("familiare", selectedAthlete.id); setSelectedAthlete(null); }} style={{ flex: 1, background: "rgba(192,132,252,0.15)", color: "#c084fc", border: "1px solid #c084fc", borderRadius: 8, padding: 10, cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>+ Familiare</button>
              <button onClick={() => { setEditForm({...selectedAthlete, lessons_per_month: selectedAthlete.lessons_per_month || 8}); setEditAthlete(selectedAthlete); setSelectedAthlete(null); }} style={{ flex: 1, background: "rgba(74,158,255,0.15)", color: "#4a9eff", border: "1px solid #4a9eff", borderRadius: 8, padding: 10, cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>✏️ Modifica</button>
              {selectedAthlete.status !== "suspended" && <button onClick={() => suspendAthlete(selectedAthlete.id)} style={{ flex: 1, background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid #ef4444", borderRadius: 8, padding: 10, cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>⏸ Sospendi</button>}
              {selectedAthlete.status === "suspended" && <button onClick={() => reactivateAthlete(selectedAthlete.id)} style={{ flex: 1, background: "rgba(34,197,94,0.2)", color: "#22c55e", border: "1px solid #22c55e", borderRadius: 8, padding: 10, cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>▶ Riattiva</button>}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Modifica Atleta */}
      {editAthlete && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
          <div style={{ background: "#1a1a0e", border: "1px solid #b8860b", borderRadius: 16, padding: 32, width: 560, maxWidth: "100%", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ color: "#daa520", margin: 0, fontSize: 20 }}>✏️ Modifica Atleta</h2>
              <button onClick={() => setEditAthlete(null)} style={{ background: "none", border: "none", color: "#666", fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div><label style={labelStyle}>Nome</label><input style={inputStyle} value={editForm.first_name || ""} onChange={e => setEditForm(p => ({...p, first_name: e.target.value}))} /></div>
              <div><label style={labelStyle}>Cognome</label><input style={inputStyle} value={editForm.last_name || ""} onChange={e => setEditForm(p => ({...p, last_name: e.target.value}))} /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div><label style={labelStyle}>Data di nascita</label><input type="date" style={inputStyle} value={editForm.birth_date ? editForm.birth_date.slice(0,10) : ""} onChange={e => setEditForm(p => ({...p, birth_date: e.target.value}))} /></div>
              <div><label style={labelStyle}>Codice Fiscale</label><input style={{...inputStyle, textTransform: "uppercase"}} value={editForm.fiscal_code || ""} onChange={e => setEditForm(p => ({...p, fiscal_code: e.target.value.toUpperCase()}))} /></div>
            </div>
            <div style={{ marginBottom: 12 }}><label style={labelStyle}>Email</label><input type="email" style={inputStyle} value={editForm.email?.includes("@dojo.local") ? "" : (editForm.email || "")} onChange={e => setEditForm(p => ({...p, email: e.target.value}))} placeholder="email@esempio.com" /></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div><label style={labelStyle}>Cellulare</label><input style={inputStyle} value={editForm.mobile || ""} onChange={e => setEditForm(p => ({...p, mobile: e.target.value}))} /></div>
              <div><label style={labelStyle}>Città</label><input style={inputStyle} value={editForm.city || ""} onChange={e => setEditForm(p => ({...p, city: e.target.value}))} /></div>
            </div>
            <div style={{ marginBottom: 12 }}><label style={labelStyle}>Indirizzo</label><input style={inputStyle} value={editForm.address || ""} onChange={e => setEditForm(p => ({...p, address: e.target.value}))} /></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
              <div>
                <label style={labelStyle}>Corso</label>
                <select style={inputStyle} value={editForm.course || ""} onChange={e => setEditForm(p => ({...p, course: e.target.value}))}>
                  {COURSES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Sede</label>
                <select style={inputStyle} value={editForm.location || ""} onChange={e => setEditForm(p => ({...p, location: e.target.value}))}>
                  {LOCATIONS.map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Lezioni/mese</label>
                <select style={inputStyle} value={editForm.lessons_per_month || 8} onChange={e => setEditForm(p => ({...p, lessons_per_month: e.target.value}))}>
                  <option value={8}>8 lezioni</option>
                  <option value={4}>4 lezioni</option>
                </select>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <label style={labelStyle}>Cintura</label>
                <select style={inputStyle} value={editForm.belt || "Bianca"} onChange={e => setEditForm(p => ({...p, belt: e.target.value}))}>
                  {BELT_ORDER.map(b => <option key={b}>{b}</option>)}
                </select>
              </div>
              <div><label style={labelStyle}>Scad. cert. medico</label><input type="date" style={inputStyle} value={editForm.medical_expiry ? editForm.medical_expiry.slice(0,10) : ""} onChange={e => setEditForm(p => ({...p, medical_expiry: e.target.value}))} /></div>
              <div><label style={labelStyle}>Inizio pratica (MM/AAAA)</label><input style={inputStyle} value={editForm.start_date || ""} onChange={e => setEditForm(p => ({...p, start_date: e.target.value}))} placeholder="es. 09/2023" maxLength={7} /></div>
            </div>
            {editForm.is_minor && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: "#daa520", marginBottom: 8 }}>👨‍👩‍👦 Dati Genitore</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div><label style={labelStyle}>Nome genitore</label><input style={inputStyle} value={editForm.parent_name || ""} onChange={e => setEditForm(p => ({...p, parent_name: e.target.value}))} /></div>
                  <div><label style={labelStyle}>Tel. genitore</label><input style={inputStyle} value={editForm.parent_phone || ""} onChange={e => setEditForm(p => ({...p, parent_phone: e.target.value}))} /></div>
                </div>
              </div>
            )}
            <div style={{ marginBottom: 20 }}><label style={labelStyle}>Note</label><textarea style={{...inputStyle, height: 60, resize: "vertical"}} value={editForm.notes || ""} onChange={e => setEditForm(p => ({...p, notes: e.target.value}))} /></div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={saveEditAthlete} style={{ flex: 1, background: "linear-gradient(135deg,#b8860b,#daa520)", color: "#0d0d0d", border: "none", borderRadius: 10, padding: 14, cursor: "pointer", fontWeight: 700, fontSize: 14, fontFamily: "inherit" }}>✓ Salva Modifiche</button>
              <button onClick={() => setEditAthlete(null)} style={{ background: "#2a2a1a", color: "#888", border: "1px solid #3a3a2a", borderRadius: 10, padding: "14px 20px", cursor: "pointer", fontFamily: "inherit" }}>Annulla</button>
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
