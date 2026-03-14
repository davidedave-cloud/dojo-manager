import { useState, useEffect } from "react";

const BELT_COLORS = {
  "Bianca": "#f8f8f8",
  "Gialla": "#FFD700",
  "Arancione": "#FF8C00",
  "Verde": "#228B22",
  "Blu": "#1E3A8A",
  "Marrone 3° Kyu": "#8B4513",
  "Marrone 2° Kyu": "#7a3a10",
  "Marrone 1° Kyu": "#6b2f0c",
  "Nera (1° Dan)": "#1a1a1a",
  "Nera (2° Dan)": "#1a1a1a",
  "Nera (3° Dan)": "#1a1a1a",
  "Nera (4° Dan)": "#1a1a1a",
  "Nera (5° Dan)": "#1a1a1a",
};

const BELT_ORDER = Object.keys(BELT_COLORS);
const TABS = ["Dashboard", "Atleti", "Lezioni", "Pagamenti", "Esami & Gare", "Bacheca"];

export default function AdminPanel({ session, supabase }) {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [athletes, setAthletes] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [exams, setExams] = useState([]);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAthlete, setSelectedAthlete] = useState(null);
  const [showReceipt, setShowReceipt] = useState(null);
  const [search, setSearch] = useState("");
  const [filterBelt, setFilterBelt] = useState("Tutte");
  const [filterStatus, setFilterStatus] = useState("Tutti");

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const [a, l, e, n] = await Promise.all([
      supabase.from("athletes").select("*").order("last_name"),
      supabase.from("lessons").select("*, attendances(athlete_id)").order("lesson_date", { ascending: false }),
      supabase.from("events").select("*, event_participants(athlete_id, status)").order("event_date"),
      supabase.from("news").select("*").order("published_at", { ascending: false }),
    ]);
    setAthletes(a.data || []);
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
    const { data } = await supabase.from("payments").insert({
      athlete_id: athleteId,
      amount: athletes.find(a => a.id === athleteId)?.monthly_fee || 60,
      period_month: now.getMonth() + 1,
      period_year: now.getFullYear(),
      paid_at: now.toISOString(),
      payment_method: "contanti",
      receipt_number: receiptNum,
      status: "paid",
    }).select().single();
    await loadData();
    return data;
  }

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  const pendingAthletes = athletes.filter(a => a.status === "pending" && !a.parent_athlete_id);
  const approvedAthletes = athletes.filter(a => a.status === "approved" && !a.parent_athlete_id);

  const filteredAthletes = athletes.filter(a => {
    if (a.parent_athlete_id) return false;
    const matchSearch = `${a.first_name} ${a.last_name}`.toLowerCase().includes(search.toLowerCase()) || (a.email || "").toLowerCase().includes(search.toLowerCase());
    const matchBelt = filterBelt === "Tutte" || a.belt === filterBelt;
    const matchStatus = filterStatus === "Tutti" || a.status === filterStatus;
    return matchSearch && matchBelt && matchStatus;
  });

  const BeltBadge = ({ belt }) => {
    if (!belt) return null;
    const isBlack = belt.startsWith("Nera");
    const isBrown = belt.startsWith("Marrone");
    return (
      <span style={{
        display: "inline-flex", alignItems: "center",
        background: isBlack ? "#1a1a1a" : isBrown ? "#8B4513" : BELT_COLORS[belt] || "#333",
        color: (belt === "Bianca" || belt === "Gialla" || belt === "Arancione") ? "#333" : "#fff",
        border: belt === "Bianca" ? "1px solid #ccc" : "none",
        borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 600,
      }}>{belt}</span>
    );
  };

  const StatusBadge = ({ status }) => {
    const map = { approved: ["✓ Approvato", "#22c55e"], pending: ["⏳ In attesa", "#daa520"], suspended: ["✗ Sospeso", "#ef4444"] };
    const [label, color] = map[status] || ["—", "#888"];
    return <span style={{ background: `${color}20`, color, border: `1px solid ${color}`, borderRadius: 99, padding: "2px 10px", fontSize: 11, fontWeight: 600 }}>{label}</span>;
  };

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

            {/* Alert iscrizioni in attesa */}
            {pendingAthletes.length > 0 && (
              <div style={{ background: "rgba(218,165,32,0.08)", border: "1px solid rgba(218,165,32,0.3)", borderRadius: 12, padding: "14px 20px", marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ color: "#daa520", fontSize: 14 }}>⚡ <strong>{pendingAthletes.length}</strong> nuova iscrizione{pendingAthletes.length > 1 ? "i" : ""} in attesa di approvazione</div>
                <button onClick={() => { setActiveTab("Atleti"); setFilterStatus("pending"); }} style={{ background: "linear-gradient(135deg,#b8860b,#daa520)", color: "#0d0d0d", border: "none", borderRadius: 8, padding: "7px 16px", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "inherit" }}>Approva ora</button>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 32 }}>
              {[
                { label: "Atleti Attivi", value: approvedAthletes.length, icon: "👥", color: "#4a9eff" },
                { label: "In Attesa", value: pendingAthletes.length, icon: "⏳", color: "#daa520" },
                { label: "Lezioni Registrate", value: lessons.length, icon: "📅", color: "#22c55e" },
                { label: "Comunicazioni", value: news.length, icon: "📢", color: "#c084fc" },
              ].map(stat => (
                <div key={stat.label} style={{ background: "linear-gradient(135deg,#1a1a0e,#141408)", border: "1px solid #2a2a1a", borderRadius: 12, padding: 20 }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{stat.icon}</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: stat.color }}>{stat.value}</div>
                  <div style={{ fontSize: 12, color: "#777", marginTop: 4 }}>{stat.label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {/* Ultime iscrizioni */}
              <div style={{ background: "#1a1a0e", border: "1px solid #2a2a1a", borderRadius: 12, padding: 20 }}>
                <h3 style={{ color: "#daa520", marginBottom: 16, fontSize: 15 }}>👥 Ultimi Iscritti</h3>
                {athletes.filter(a => !a.parent_athlete_id).slice(0, 5).map(a => (
                  <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #2a2a1a" }}>
                    <div>
                      <div style={{ fontSize: 13, color: "#e8e0d0" }}>{a.first_name} {a.last_name}</div>
                      <div style={{ fontSize: 11, color: "#777" }}>{a.course} · {a.location}</div>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <BeltBadge belt={a.belt} />
                      <StatusBadge status={a.status} />
                    </div>
                  </div>
                ))}
                {athletes.length === 0 && <div style={{ color: "#555", fontSize: 13 }}>Nessun atleta iscritto ancora.</div>}
              </div>

              {/* Distribuzione cinture */}
              <div style={{ background: "#1a1a0e", border: "1px solid #2a2a1a", borderRadius: 12, padding: 20 }}>
                <h3 style={{ color: "#daa520", marginBottom: 16, fontSize: 15 }}>🥋 Distribuzione Cinture</h3>
                {BELT_ORDER.map(belt => {
                  const count = athletes.filter(a => a.belt === belt && !a.parent_athlete_id).length;
                  if (!count) return null;
                  return (
                    <div key={belt} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <div style={{ width: 14, height: 14, borderRadius: 2, background: BELT_COLORS[belt], border: belt === "Bianca" ? "1px solid #666" : "none", flexShrink: 0 }} />
                      <div style={{ flex: 1, fontSize: 12, color: "#ccc" }}>{belt}</div>
                      <div style={{ background: "#2a2a1a", borderRadius: 20, height: 8, flex: 2 }}>
                        <div style={{ background: "#daa520", height: "100%", borderRadius: 20, width: `${(count / athletes.length) * 100}%` }} />
                      </div>
                      <div style={{ fontSize: 12, color: "#daa520", width: 20, textAlign: "right" }}>{count}</div>
                    </div>
                  );
                })}
                {athletes.length === 0 && <div style={{ color: "#555", fontSize: 13 }}>Nessun dato disponibile.</div>}
              </div>

              {/* Prossimi eventi */}
              <div style={{ background: "#1a1a0e", border: "1px solid #2a2a1a", borderRadius: 12, padding: 20 }}>
                <h3 style={{ color: "#daa520", marginBottom: 16, fontSize: 15 }}>🏆 Prossimi Esami & Gare</h3>
                {exams.filter(e => new Date(e.event_date) >= new Date()).slice(0, 3).map(e => (
                  <div key={e.id} style={{ padding: "10px 0", borderBottom: "1px solid #2a2a1a" }}>
                    <div style={{ fontSize: 14, color: "#e8e0d0", fontWeight: 600 }}>{e.event_type}</div>
                    <div style={{ fontSize: 12, color: "#daa520", margin: "2px 0" }}>{new Date(e.event_date).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })}</div>
                    <div style={{ fontSize: 12, color: "#777" }}>{e.event_participants?.length || 0} partecipanti</div>
                  </div>
                ))}
                {exams.length === 0 && <div style={{ color: "#555", fontSize: 13 }}>Nessun evento in programma.</div>}
              </div>

              {/* Bacheca */}
              <div style={{ background: "#1a1a0e", border: "1px solid #2a2a1a", borderRadius: 12, padding: 20 }}>
                <h3 style={{ color: "#daa520", marginBottom: 16, fontSize: 15 }}>📢 Ultime Comunicazioni</h3>
                {news.slice(0, 3).map(n => (
                  <div key={n.id} style={{ padding: "10px 0", borderBottom: "1px solid #2a2a1a" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      {n.important && <span style={{ background: "#b91c1c", color: "#fff", fontSize: 10, padding: "1px 6px", borderRadius: 10 }}>IMPORTANTE</span>}
                      <span style={{ fontSize: 13, color: "#e8e0d0", fontWeight: 600 }}>{n.title}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "#777" }}>{n.body?.substring(0, 80)}...</div>
                  </div>
                ))}
                {news.length === 0 && <div style={{ color: "#555", fontSize: 13 }}>Nessuna comunicazione.</div>}
              </div>
            </div>
          </div>
        )}

        {/* ATLETI */}
        {activeTab === "Atleti" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ color: "#daa520", fontSize: 22 }}>Gestione Atleti ({filteredAthletes.length})</h2>
            </div>

            <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cerca per nome o email..."
                style={{ flex: 1, minWidth: 200, background: "#1a1a0e", border: "1px solid #2a2a1a", borderRadius: 8, padding: "10px 14px", color: "#e8e0d0", fontFamily: "inherit", fontSize: 13 }} />
              <select value={filterBelt} onChange={e => setFilterBelt(e.target.value)}
                style={{ background: "#1a1a0e", border: "1px solid #2a2a1a", borderRadius: 8, padding: "10px 14px", color: "#e8e0d0", fontFamily: "inherit", fontSize: 13 }}>
                <option>Tutte</option>
                {BELT_ORDER.map(b => <option key={b}>{b}</option>)}
              </select>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                style={{ background: "#1a1a0e", border: "1px solid #2a2a1a", borderRadius: 8, padding: "10px 14px", color: "#e8e0d0", fontFamily: "inherit", fontSize: 13 }}>
                <option value="Tutti">Tutti gli stati</option>
                <option value="approved">Approvati</option>
                <option value="pending">In attesa</option>
                <option value="suspended">Sospesi</option>
              </select>
            </div>

            {filteredAthletes.length === 0 ? (
              <div style={{ textAlign: "center", padding: 60, color: "#555" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>👥</div>
                <div>Nessun atleta trovato.</div>
              </div>
            ) : (
              <div style={{ background: "#1a1a0e", border: "1px solid #2a2a1a", borderRadius: 12, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #2a2a1a" }}>
                      {["Atleta", "Cintura", "Corso & Sede", "Stato", "Azioni"].map(h => (
                        <th key={h} style={{ padding: "14px 16px", textAlign: "left", fontSize: 11, color: "#777", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAthletes.map(a => {
                      // Conta membri famiglia
                      const familyCount = athletes.filter(x => x.parent_athlete_id === a.id).length;
                      return (
                        <tr key={a.id} style={{ borderBottom: "1px solid #141408" }}
                          onMouseEnter={e => e.currentTarget.style.background = "#141408"}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                          <td style={{ padding: "14px 16px" }}>
                            <div style={{ fontWeight: 600, color: "#e8e0d0", fontSize: 14 }}>{a.first_name} {a.last_name}</div>
                            <div style={{ fontSize: 11, color: "#777", marginTop: 2 }}>{a.email}</div>
                            {familyCount > 0 && <div style={{ fontSize: 11, color: "#daa520", marginTop: 2 }}>👨‍👩‍👦 {familyCount} familiare{familyCount > 1 ? "i" : ""}</div>}
                            {a.is_minor && <div style={{ fontSize: 11, color: "#888" }}>👤 Genitore: {a.parent_name}</div>}
                          </td>
                          <td style={{ padding: "14px 16px" }}><BeltBadge belt={a.belt} /></td>
                          <td style={{ padding: "14px 16px" }}>
                            <div style={{ fontSize: 13, color: "#ccc" }}>{a.course}</div>
                            <div style={{ fontSize: 11, color: "#777" }}>📍 {a.location} · {a.discipline}</div>
                          </td>
                          <td style={{ padding: "14px 16px" }}><StatusBadge status={a.status} /></td>
                          <td style={{ padding: "14px 16px" }}>
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                              <button onClick={() => setSelectedAthlete(a)} style={{ background: "#2a2a1a", color: "#daa520", border: "1px solid #3a3a2a", borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>Dettagli</button>
                              {a.status === "pending" && (
                                <button onClick={() => approveAthlete(a.id)} style={{ background: "rgba(34,197,94,0.2)", color: "#22c55e", border: "1px solid #22c55e", borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>✓ Approva</button>
                              )}
                              {a.status === "approved" && (
                                <button onClick={() => { markPaid(a.id); }} style={{ background: "rgba(74,158,255,0.15)", color: "#4a9eff", border: "1px solid #4a9eff", borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>💶 Pagamento</button>
                              )}
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
            {lessons.length === 0 ? (
              <div style={{ textAlign: "center", padding: 60, color: "#555" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>📅</div>
                <div>Nessuna lezione registrata.</div>
              </div>
            ) : lessons.map(l => (
              <div key={l.id} style={{ background: "#1a1a0e", border: "1px solid #2a2a1a", borderRadius: 12, padding: 20, marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#daa520" }}>{l.lesson_type}</div>
                    <div style={{ fontSize: 13, color: "#888", marginTop: 2 }}>Istruttore: {l.instructor} · {l.location}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 14, color: "#e8e0d0" }}>{new Date(l.lesson_date).toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })}</div>
                    <div style={{ fontSize: 13, color: "#daa520" }}>{l.lesson_time?.slice(0, 5)}</div>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: "#666", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Presenti ({l.attendances?.length || 0})
                </div>
                {l.attendances?.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {l.attendances.map(att => {
                      const a = athletes.find(x => x.id === att.athlete_id);
                      return a ? (
                        <div key={att.athlete_id} style={{ background: "#2a2a1a", borderRadius: 20, padding: "4px 12px", fontSize: 12, color: "#ccc" }}>
                          {a.first_name} {a.last_name}
                        </div>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* PAGAMENTI */}
        {activeTab === "Pagamenti" && (
          <div>
            <h2 style={{ color: "#daa520", marginBottom: 24, fontSize: 22 }}>Gestione Pagamenti</h2>
            {athletes.filter(a => !a.parent_athlete_id && a.status === "approved").length === 0 ? (
              <div style={{ textAlign: "center", padding: 60, color: "#555" }}>Nessun atleta approvato.</div>
            ) : (
              <div style={{ background: "#1a1a0e", border: "1px solid #2a2a1a", borderRadius: 12, overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid #2a2a1a", fontSize: 14, color: "#888" }}>
                  Atleti approvati — {new Date().toLocaleDateString("it-IT", { month: "long", year: "numeric" })}
                </div>
                {athletes.filter(a => !a.parent_athlete_id && a.status === "approved").map(a => (
                  <div key={a.id} style={{ display: "flex", alignItems: "center", padding: "14px 20px", borderBottom: "1px solid #141408", gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: "#e8e0d0" }}>{a.first_name} {a.last_name}</div>
                      <div style={{ fontSize: 12, color: "#666" }}>{a.email}</div>
                    </div>
                    <BeltBadge belt={a.belt} />
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => markPaid(a.id)} style={{ background: "rgba(34,197,94,0.2)", color: "#22c55e", border: "1px solid #22c55e", borderRadius: 6, padding: "5px 12px", cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>
                        + Registra Pagamento
                      </button>
                      <button onClick={() => setShowReceipt(a)} style={{ background: "rgba(74,158,255,0.15)", color: "#4a9eff", border: "1px solid #4a9eff", borderRadius: 6, padding: "5px 12px", cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>
                        📄 Ricevuta
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ESAMI & GARE */}
        {activeTab === "Esami & Gare" && (
          <div>
            <h2 style={{ color: "#daa520", marginBottom: 24, fontSize: 22 }}>Esami & Gare</h2>
            {exams.length === 0 ? (
              <div style={{ textAlign: "center", padding: 60, color: "#555" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🏆</div>
                <div>Nessun evento in programma.</div>
              </div>
            ) : exams.map(e => (
              <div key={e.id} style={{ background: "#1a1a0e", border: "1px solid #2a2a1a", borderRadius: 12, padding: 24, marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#daa520" }}>{e.event_type}</div>
                    {e.notes && <div style={{ fontSize: 13, color: "#888", marginTop: 4 }}>{e.notes}</div>}
                  </div>
                  <div style={{ background: "#2a2a1a", borderRadius: 8, padding: "8px 16px", textAlign: "center" }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#e8e0d0" }}>{new Date(e.event_date).toLocaleDateString("it-IT", { day: "numeric", month: "short" }).toUpperCase()}</div>
                    <div style={{ fontSize: 11, color: "#777" }}>{new Date(e.event_date).getFullYear()}</div>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: "#666", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>Partecipanti ({e.event_participants?.length || 0})</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {e.event_participants?.map(ep => {
                    const a = athletes.find(x => x.id === ep.athlete_id);
                    return a ? (
                      <div key={ep.athlete_id} style={{ background: "#2a2a1a", borderRadius: 8, padding: "8px 14px" }}>
                        <div style={{ fontSize: 13, color: "#e8e0d0", fontWeight: 600 }}>{a.first_name} {a.last_name}</div>
                        <BeltBadge belt={a.belt} />
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* BACHECA */}
        {activeTab === "Bacheca" && (
          <div>
            <h2 style={{ color: "#daa520", marginBottom: 24, fontSize: 22 }}>Bacheca Comunicazioni</h2>
            {news.length === 0 ? (
              <div style={{ textAlign: "center", padding: 60, color: "#555" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>📢</div>
                <div>Nessuna comunicazione.</div>
              </div>
            ) : news.map(n => (
              <div key={n.id} style={{ background: "#1a1a0e", border: `1px solid ${n.important ? "#b91c1c" : "#2a2a1a"}`, borderRadius: 12, padding: 24, marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      {n.important && <span style={{ background: "#b91c1c", color: "#fff", fontSize: 10, padding: "2px 8px", borderRadius: 10, fontWeight: 700 }}>⚡ IMPORTANTE</span>}
                      <h3 style={{ color: "#e8e0d0", fontSize: 17, margin: 0 }}>{n.title}</h3>
                    </div>
                    <p style={{ color: "#999", fontSize: 14, margin: 0, lineHeight: 1.6 }}>{n.body}</p>
                  </div>
                  <div style={{ fontSize: 12, color: "#555", marginLeft: 20, flexShrink: 0 }}>{new Date(n.published_at).toLocaleDateString("it-IT")}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL: Dettaglio Atleta */}
      {selectedAthlete && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={() => setSelectedAthlete(null)}>
          <div style={{ background: "#1a1a0e", border: "1px solid #b8860b", borderRadius: 16, padding: 32, width: 500, maxWidth: "90vw", maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
              <div>
                <h2 style={{ color: "#daa520", margin: 0, fontSize: 20 }}>{selectedAthlete.first_name} {selectedAthlete.last_name}</h2>
                <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center" }}>
                  <BeltBadge belt={selectedAthlete.belt} />
                  <StatusBadge status={selectedAthlete.status} />
                </div>
              </div>
              <button onClick={() => setSelectedAthlete(null)} style={{ background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: 20 }}>✕</button>
            </div>
            {[
              ["📧 Email", selectedAthlete.email],
              ["📞 Cellulare", selectedAthlete.mobile],
              ["🎂 Data di nascita", selectedAthlete.birth_date ? new Date(selectedAthlete.birth_date).toLocaleDateString("it-IT") : "—"],
              ["🏠 Città", selectedAthlete.city],
              ["🥋 Corso", selectedAthlete.course],
              ["📍 Sede", selectedAthlete.location],
              ["🎯 Disciplina", selectedAthlete.discipline],
              ["🏥 Cert. medico scadenza", selectedAthlete.medical_expiry ? new Date(selectedAthlete.medical_expiry).toLocaleDateString("it-IT") : "—"],
              ...(selectedAthlete.is_minor ? [["👨‍👩‍👦 Genitore", selectedAthlete.parent_name], ["📞 Tel. genitore", selectedAthlete.parent_phone]] : []),
              ...(selectedAthlete.notes ? [["📝 Note", selectedAthlete.notes]] : []),
            ].map(([label, val]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #2a2a1a" }}>
                <span style={{ fontSize: 13, color: "#777" }}>{label}</span>
                <span style={{ fontSize: 13, color: "#e8e0d0" }}>{val || "—"}</span>
              </div>
            ))}
            {/* Familiari */}
            {athletes.filter(a => a.parent_athlete_id === selectedAthlete.id).length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 12, color: "#777", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>Familiari iscritti</div>
                {athletes.filter(a => a.parent_athlete_id === selectedAthlete.id).map(m => (
                  <div key={m.id} style={{ background: "#2a2a1a", borderRadius: 8, padding: "10px 14px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 13, color: "#e8e0d0" }}>{m.first_name} {m.last_name}</div>
                      <div style={{ fontSize: 11, color: "#777" }}>{m.course} · {m.location}</div>
                    </div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <BeltBadge belt={m.belt} />
                      <StatusBadge status={m.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              {selectedAthlete.status === "pending" && (
                <button onClick={() => { approveAthlete(selectedAthlete.id); setSelectedAthlete(null); }} style={{ flex: 1, background: "rgba(34,197,94,0.2)", color: "#22c55e", border: "1px solid #22c55e", borderRadius: 8, padding: "10px", cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>✓ Approva Iscrizione</button>
              )}
              {selectedAthlete.status === "approved" && (
                <button onClick={() => { markPaid(selectedAthlete.id); setSelectedAthlete(null); }} style={{ flex: 1, background: "rgba(74,158,255,0.15)", color: "#4a9eff", border: "1px solid #4a9eff", borderRadius: 8, padding: "10px", cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>💶 Registra Pagamento</button>
              )}
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
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: "#666" }}>N° Ricevuta</span>
                <span style={{ fontSize: 12, fontWeight: 600 }}>RCV-{Date.now().toString().slice(-6)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, color: "#666" }}>Data</span>
                <span style={{ fontSize: 12, fontWeight: 600 }}>{new Date().toLocaleDateString("it-IT")}</span>
              </div>
            </div>
            {[
              ["Intestatario", `${showReceipt.first_name} ${showReceipt.last_name}`],
              ["Email", showReceipt.email],
              ["Periodo", new Date().toLocaleDateString("it-IT", { month: "long", year: "numeric" })],
              ["Descrizione", "Quota mensile associativa"],
              ["Cintura", showReceipt.belt],
              ["Corso", showReceipt.course],
              ["Sede", showReceipt.location],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #eee" }}>
                <span style={{ fontSize: 13, color: "#666" }}>{k}</span>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{v}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20, padding: 16, background: "#b8860b", borderRadius: 8, color: "#fff" }}>
              <span style={{ fontSize: 16, fontWeight: 700 }}>TOTALE</span>
              <span style={{ fontSize: 20, fontWeight: 700 }}>€{showReceipt.monthly_fee || 60},00</span>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={() => window.print()} style={{ flex: 1, background: "#b8860b", color: "#fff", border: "none", borderRadius: 8, padding: 12, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>🖨️ Stampa</button>
              <button onClick={() => setShowReceipt(null)} style={{ flex: 1, background: "#f0f0f0", color: "#333", border: "none", borderRadius: 8, padding: 12, cursor: "pointer", fontSize: 13 }}>Chiudi</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
