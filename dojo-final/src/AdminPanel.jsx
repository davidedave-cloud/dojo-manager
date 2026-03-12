import { useState } from "react";

const BELT_COLORS = {
  "Bianca": "#f8f8f8",
  "Gialla": "#FFD700",
  "Arancione": "#FF8C00",
  "Verde": "#228B22",
  "Blu": "#1E3A8A",
  "Marrone": "#8B4513",
  "Nera (1° Dan)": "#1a1a1a",
  "Nera (2° Dan)": "#1a1a1a",
  "Nera (3° Dan)": "#1a1a1a",
};

const initialAthletes = [
  { id: 1, name: "Marco Rossi", email: "marco@email.com", phone: "333-1234567", belt: "Verde", joinDate: "2022-03-15", birthDate: "2005-07-12", quota: 60, paid: true, lastPayment: "2025-03-01", notes: "Ottima progressione", parent: "" },
  { id: 2, name: "Sofia Bianchi", email: "sofia@email.com", phone: "333-9876543", belt: "Blu", joinDate: "2020-09-01", birthDate: "2003-11-20", quota: 60, paid: false, lastPayment: "2025-02-01", notes: "", parent: "" },
  { id: 3, name: "Luca Ferrari", email: "luca@email.com", phone: "347-1112233", belt: "Arancione", joinDate: "2023-01-10", birthDate: "2014-05-03", quota: 50, paid: true, lastPayment: "2025-03-05", notes: "Minorenne - genitore: Paolo Ferrari", parent: "Paolo Ferrari" },
  { id: 4, name: "Giulia Marino", email: "giulia@email.com", phone: "340-5556677", belt: "Nera (1° Dan)", joinDate: "2018-06-20", birthDate: "1998-02-14", quota: 70, paid: true, lastPayment: "2025-03-02", notes: "Istruttrice assistente", parent: "" },
  { id: 5, name: "Alessandro Conti", email: "ale@email.com", phone: "339-8887766", belt: "Bianca", joinDate: "2025-01-15", birthDate: "2010-09-30", quota: 50, paid: false, lastPayment: "", notes: "Nuovo iscritto", parent: "Maria Conti" },
];

const initialLessons = [
  { id: 1, date: "2025-03-10", time: "18:00", type: "Kata", instructor: "Giulia Marino", attendees: [1, 2, 4] },
  { id: 2, date: "2025-03-12", time: "18:00", type: "Kumite", instructor: "Sensei Tanaka", attendees: [1, 3, 4] },
  { id: 3, date: "2025-03-14", time: "10:00", type: "Kata", instructor: "Sensei Tanaka", attendees: [2, 3, 5] },
];

const initialExams = [
  { id: 1, date: "2025-04-15", type: "Esame Cinture", candidates: [3, 5], notes: "Passaggio da bianca a gialla e arancione a verde" },
  { id: 2, date: "2025-05-20", type: "Gara Regionale", candidates: [1, 2, 4], notes: "Campionato Regionale Lombardia" },
];

const initialNews = [
  { id: 1, date: "2025-03-08", title: "Chiusura pasquale", text: "Il dojo sarà chiuso dal 18 al 22 aprile per le festività pasquali.", important: true },
  { id: 2, date: "2025-03-01", title: "Nuovi orari primaverili", text: "Da aprile le lezioni del venerdì inizieranno alle 17:30.", important: false },
];

const TABS = ["Dashboard", "Atleti", "Lezioni", "Pagamenti", "Esami & Gare", "Bacheca"];

export default function DojoApp() {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [athletes, setAthletes] = useState(initialAthletes);
  const [lessons] = useState(initialLessons);
  const [exams] = useState(initialExams);
  const [news] = useState(initialNews);
  const [selectedAthlete, setSelectedAthlete] = useState(null);
  const [showAddAthlete, setShowAddAthlete] = useState(false);
  const [showReceipt, setShowReceipt] = useState(null);
  const [search, setSearch] = useState("");
  const [filterBelt, setFilterBelt] = useState("Tutte");

  const paidCount = athletes.filter(a => a.paid).length;
  const unpaidCount = athletes.filter(a => !a.paid).length;
  const totalRevenue = athletes.filter(a => a.paid).reduce((s, a) => s + a.quota, 0);

  const filteredAthletes = athletes.filter(a => {
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) || a.email.toLowerCase().includes(search.toLowerCase());
    const matchBelt = filterBelt === "Tutte" || a.belt === filterBelt;
    return matchSearch && matchBelt;
  });

  function markPaid(id) {
    setAthletes(prev => prev.map(a => a.id === id ? { ...a, paid: true, lastPayment: new Date().toISOString().split("T")[0] } : a));
  }

  function generateReceipt(athlete) {
    setShowReceipt(athlete);
  }

  const BeltBadge = ({ belt }) => {
    const isBlack = belt.startsWith("Nera");
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: "5px",
        background: isBlack ? "#1a1a1a" : BELT_COLORS[belt],
        color: (belt === "Bianca" || belt === "Gialla" || belt === "Arancione") ? "#333" : "#fff",
        border: belt === "Bianca" ? "1px solid #ccc" : "none",
        borderRadius: "20px", padding: "2px 10px", fontSize: "12px", fontWeight: 600,
      }}>
        {belt}
      </span>
    );
  };

  return (
    <div style={{ fontFamily: "'Georgia', 'Times New Roman', serif", background: "#0d0d0d", minHeight: "100vh", color: "#e8e0d0" }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #0d0d0d 0%, #1a1008 50%, #0d0d0d 100%)",
        borderBottom: "1px solid #b8860b",
        padding: "0 24px",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 0" }}>
            <div style={{
              width: 48, height: 48, borderRadius: "50%",
              background: "linear-gradient(135deg, #b8860b, #daa520)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 24, boxShadow: "0 0 20px rgba(184,134,11,0.4)"
            }}>🥋</div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#daa520", letterSpacing: "0.05em" }}>DOJO MANAGER</div>
              <div style={{ fontSize: 11, color: "#888", letterSpacing: "0.15em", textTransform: "uppercase" }}>Sistema Gestionale Karate</div>
            </div>
          </div>
          <div style={{ fontSize: 13, color: "#888" }}>
            {new Date().toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </div>
        </div>

        {/* Nav */}
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", gap: 4 }}>
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              background: activeTab === tab ? "linear-gradient(135deg, #b8860b, #daa520)" : "transparent",
              color: activeTab === tab ? "#0d0d0d" : "#999",
              border: "none", borderRadius: "6px 6px 0 0",
              padding: "10px 18px", cursor: "pointer",
              fontSize: 13, fontWeight: activeTab === tab ? 700 : 400,
              fontFamily: "inherit", letterSpacing: "0.03em",
              transition: "all 0.2s",
            }}>{tab}</button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 24px" }}>

        {/* DASHBOARD */}
        {activeTab === "Dashboard" && (
          <div>
            <h2 style={{ color: "#daa520", marginBottom: 24, fontSize: 22 }}>Panoramica Dojo</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
              {[
                { label: "Atleti Totali", value: athletes.length, icon: "👥", color: "#4a9eff" },
                { label: "Quote Pagate", value: paidCount, icon: "✅", color: "#22c55e" },
                { label: "Quote Mancanti", value: unpaidCount, icon: "⚠️", color: "#ef4444" },
                { label: "Incasso Mese", value: `€${totalRevenue}`, icon: "💶", color: "#daa520" },
              ].map(stat => (
                <div key={stat.label} style={{
                  background: "linear-gradient(135deg, #1a1a0e, #141408)",
                  border: "1px solid #2a2a1a", borderRadius: 12, padding: "20px",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.3)"
                }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{stat.icon}</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: stat.color }}>{stat.value}</div>
                  <div style={{ fontSize: 12, color: "#777", marginTop: 4 }}>{stat.label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {/* Prossime lezioni */}
              <div style={{ background: "#1a1a0e", border: "1px solid #2a2a1a", borderRadius: 12, padding: 20 }}>
                <h3 style={{ color: "#daa520", marginBottom: 16, fontSize: 15 }}>📅 Prossime Lezioni</h3>
                {lessons.slice(0, 3).map(l => (
                  <div key={l.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #2a2a1a" }}>
                    <div>
                      <div style={{ fontSize: 14, color: "#e8e0d0" }}>{l.type}</div>
                      <div style={{ fontSize: 12, color: "#777" }}>{l.instructor}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 12, color: "#daa520" }}>{new Date(l.date).toLocaleDateString("it-IT")}</div>
                      <div style={{ fontSize: 12, color: "#777" }}>{l.time} · {l.attendees.length} atleti</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Ultime notizie */}
              <div style={{ background: "#1a1a0e", border: "1px solid #2a2a1a", borderRadius: 12, padding: 20 }}>
                <h3 style={{ color: "#daa520", marginBottom: 16, fontSize: 15 }}>📢 Bacheca</h3>
                {news.map(n => (
                  <div key={n.id} style={{ padding: "10px 0", borderBottom: "1px solid #2a2a1a" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      {n.important && <span style={{ background: "#b91c1c", color: "#fff", fontSize: 10, padding: "1px 6px", borderRadius: 10 }}>IMPORTANTE</span>}
                      <span style={{ fontSize: 14, color: "#e8e0d0", fontWeight: 600 }}>{n.title}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "#777" }}>{n.text}</div>
                  </div>
                ))}
              </div>

              {/* Cinture distribuzione */}
              <div style={{ background: "#1a1a0e", border: "1px solid #2a2a1a", borderRadius: 12, padding: 20 }}>
                <h3 style={{ color: "#daa520", marginBottom: 16, fontSize: 15 }}>🥋 Distribuzione Cinture</h3>
                {Object.keys(BELT_COLORS).map(belt => {
                  const count = athletes.filter(a => a.belt === belt).length;
                  if (!count) return null;
                  return (
                    <div key={belt} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <div style={{ width: 14, height: 14, borderRadius: 2, background: BELT_COLORS[belt], border: belt === "Bianca" ? "1px solid #666" : "none", flexShrink: 0 }} />
                      <div style={{ flex: 1, fontSize: 13, color: "#ccc" }}>{belt}</div>
                      <div style={{ background: "#2a2a1a", borderRadius: 20, height: 8, flex: 2 }}>
                        <div style={{ background: "#daa520", height: "100%", borderRadius: 20, width: `${(count / athletes.length) * 100}%` }} />
                      </div>
                      <div style={{ fontSize: 13, color: "#daa520", width: 20, textAlign: "right" }}>{count}</div>
                    </div>
                  );
                })}
              </div>

              {/* Prossimi eventi */}
              <div style={{ background: "#1a1a0e", border: "1px solid #2a2a1a", borderRadius: 12, padding: 20 }}>
                <h3 style={{ color: "#daa520", marginBottom: 16, fontSize: 15 }}>🏆 Esami & Gare</h3>
                {exams.map(e => (
                  <div key={e.id} style={{ padding: "10px 0", borderBottom: "1px solid #2a2a1a" }}>
                    <div style={{ fontSize: 14, color: "#e8e0d0", fontWeight: 600 }}>{e.type}</div>
                    <div style={{ fontSize: 12, color: "#daa520", margin: "2px 0" }}>{new Date(e.date).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })}</div>
                    <div style={{ fontSize: 12, color: "#777" }}>{e.candidates.length} candidati · {e.notes}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ATLETI */}
        {activeTab === "Atleti" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ color: "#daa520", fontSize: 22 }}>Gestione Atleti</h2>
              <button onClick={() => setShowAddAthlete(true)} style={{
                background: "linear-gradient(135deg, #b8860b, #daa520)", color: "#0d0d0d",
                border: "none", borderRadius: 8, padding: "10px 20px",
                cursor: "pointer", fontWeight: 700, fontSize: 13, fontFamily: "inherit",
              }}>+ Nuovo Atleta</button>
            </div>

            <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cerca per nome o email..."
                style={{ flex: 1, background: "#1a1a0e", border: "1px solid #2a2a1a", borderRadius: 8, padding: "10px 14px", color: "#e8e0d0", fontFamily: "inherit", fontSize: 13 }} />
              <select value={filterBelt} onChange={e => setFilterBelt(e.target.value)}
                style={{ background: "#1a1a0e", border: "1px solid #2a2a1a", borderRadius: 8, padding: "10px 14px", color: "#e8e0d0", fontFamily: "inherit", fontSize: 13 }}>
                <option>Tutte</option>
                {Object.keys(BELT_COLORS).map(b => <option key={b}>{b}</option>)}
              </select>
            </div>

            <div style={{ background: "#1a1a0e", border: "1px solid #2a2a1a", borderRadius: 12, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #2a2a1a" }}>
                    {["Atleta", "Cintura", "Contatti", "Quota", "Stato", "Azioni"].map(h => (
                      <th key={h} style={{ padding: "14px 16px", textAlign: "left", fontSize: 11, color: "#777", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredAthletes.map(a => (
                    <tr key={a.id} style={{ borderBottom: "1px solid #1a1a0e", transition: "background 0.15s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#141408"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontWeight: 600, color: "#e8e0d0", fontSize: 14 }}>{a.name}</div>
                        {a.parent && <div style={{ fontSize: 11, color: "#888" }}>👨‍👩‍👦 {a.parent}</div>}
                        <div style={{ fontSize: 11, color: "#666" }}>Iscritto: {new Date(a.joinDate).toLocaleDateString("it-IT")}</div>
                      </td>
                      <td style={{ padding: "14px 16px" }}><BeltBadge belt={a.belt} /></td>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontSize: 12, color: "#aaa" }}>{a.email}</div>
                        <div style={{ fontSize: 12, color: "#888" }}>{a.phone}</div>
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: 14, color: "#daa520", fontWeight: 600 }}>€{a.quota}/mese</td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{
                          background: a.paid ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                          color: a.paid ? "#22c55e" : "#ef4444",
                          border: `1px solid ${a.paid ? "#22c55e" : "#ef4444"}`,
                          borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600,
                        }}>{a.paid ? "✓ Pagato" : "✗ Da Pagare"}</span>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => setSelectedAthlete(a)} style={{
                            background: "#2a2a1a", color: "#daa520", border: "1px solid #3a3a2a",
                            borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 11, fontFamily: "inherit",
                          }}>Dettagli</button>
                          {!a.paid && (
                            <button onClick={() => markPaid(a.id)} style={{
                              background: "rgba(34,197,94,0.2)", color: "#22c55e", border: "1px solid #22c55e",
                              borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 11, fontFamily: "inherit",
                            }}>Paga</button>
                          )}
                          {a.paid && (
                            <button onClick={() => generateReceipt(a)} style={{
                              background: "rgba(74,158,255,0.15)", color: "#4a9eff", border: "1px solid #4a9eff",
                              borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 11, fontFamily: "inherit",
                            }}>Ricevuta</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* LEZIONI */}
        {activeTab === "Lezioni" && (
          <div>
            <h2 style={{ color: "#daa520", marginBottom: 24, fontSize: 22 }}>Lezioni & Presenze</h2>
            <div style={{ display: "grid", gap: 16 }}>
              {lessons.map(l => (
                <div key={l.id} style={{ background: "#1a1a0e", border: "1px solid #2a2a1a", borderRadius: 12, padding: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: "#daa520" }}>{l.type}</div>
                      <div style={{ fontSize: 13, color: "#888", marginTop: 2 }}>Istruttore: {l.instructor}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 14, color: "#e8e0d0" }}>{new Date(l.date).toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })}</div>
                      <div style={{ fontSize: 13, color: "#daa520" }}>{l.time}</div>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "#666", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>Presenti ({l.attendees.length})</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {l.attendees.map(id => {
                        const a = athletes.find(x => x.id === id);
                        return a ? (
                          <div key={id} style={{ background: "#2a2a1a", borderRadius: 20, padding: "4px 12px", fontSize: 12, color: "#ccc", display: "flex", alignItems: "center", gap: 6 }}>
                            <div style={{ width: 8, height: 8, borderRadius: "50%", background: BELT_COLORS[a.belt], border: a.belt === "Bianca" ? "1px solid #666" : "none" }} />
                            {a.name}
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PAGAMENTI */}
        {activeTab === "Pagamenti" && (
          <div>
            <h2 style={{ color: "#daa520", marginBottom: 24, fontSize: 22 }}>Gestione Pagamenti</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 28 }}>
              {[
                { label: "Incassato questo mese", value: `€${totalRevenue}`, color: "#22c55e" },
                { label: "Da incassare", value: `€${athletes.filter(a => !a.paid).reduce((s, a) => s + a.quota, 0)}`, color: "#ef4444" },
                { label: "Totale atteso", value: `€${athletes.reduce((s, a) => s + a.quota, 0)}`, color: "#daa520" },
              ].map(s => (
                <div key={s.label} style={{ background: "#1a1a0e", border: "1px solid #2a2a1a", borderRadius: 12, padding: 20 }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: "#777", marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div style={{ background: "#1a1a0e", border: "1px solid #2a2a1a", borderRadius: 12, overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #2a2a1a", fontSize: 14, color: "#888" }}>
                Stato pagamenti — {new Date().toLocaleDateString("it-IT", { month: "long", year: "numeric" })}
              </div>
              {athletes.map(a => (
                <div key={a.id} style={{ display: "flex", alignItems: "center", padding: "14px 20px", borderBottom: "1px solid #141408", gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: "#e8e0d0" }}>{a.name}</div>
                    <div style={{ fontSize: 12, color: "#666" }}>{a.lastPayment ? `Ultimo pagamento: ${new Date(a.lastPayment).toLocaleDateString("it-IT")}` : "Nessun pagamento registrato"}</div>
                  </div>
                  <BeltBadge belt={a.belt} />
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#daa520" }}>€{a.quota}</div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{
                      background: a.paid ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                      color: a.paid ? "#22c55e" : "#ef4444",
                      border: `1px solid ${a.paid ? "#22c55e" : "#ef4444"}`,
                      borderRadius: 20, padding: "3px 12px", fontSize: 11, fontWeight: 600,
                    }}>{a.paid ? "✓ Pagato" : "✗ Non pagato"}</span>
                    {!a.paid && (
                      <button onClick={() => markPaid(a.id)} style={{
                        background: "rgba(34,197,94,0.2)", color: "#22c55e", border: "1px solid #22c55e",
                        borderRadius: 6, padding: "5px 12px", cursor: "pointer", fontSize: 11, fontFamily: "inherit",
                      }}>Segna pagato</button>
                    )}
                    {a.paid && (
                      <button onClick={() => generateReceipt(a)} style={{
                        background: "rgba(74,158,255,0.15)", color: "#4a9eff", border: "1px solid #4a9eff",
                        borderRadius: 6, padding: "5px 12px", cursor: "pointer", fontSize: 11, fontFamily: "inherit",
                      }}>📄 Ricevuta</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ESAMI & GARE */}
        {activeTab === "Esami & Gare" && (
          <div>
            <h2 style={{ color: "#daa520", marginBottom: 24, fontSize: 22 }}>Esami & Gare</h2>
            <div style={{ display: "grid", gap: 16 }}>
              {exams.map(e => (
                <div key={e.id} style={{ background: "#1a1a0e", border: "1px solid #2a2a1a", borderRadius: 12, padding: 24 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                    <div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: "#daa520" }}>{e.type}</div>
                      <div style={{ fontSize: 13, color: "#888", marginTop: 4 }}>{e.notes}</div>
                    </div>
                    <div style={{ background: "#2a2a1a", borderRadius: 8, padding: "8px 16px", textAlign: "center" }}>
                      <div style={{ fontSize: 20, fontWeight: 700, color: "#e8e0d0" }}>
                        {new Date(e.date).toLocaleDateString("it-IT", { day: "numeric", month: "short" }).toUpperCase()}
                      </div>
                      <div style={{ fontSize: 11, color: "#777" }}>{new Date(e.date).getFullYear()}</div>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "#666", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>Candidati ({e.candidates.length})</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {e.candidates.map(id => {
                        const a = athletes.find(x => x.id === id);
                        return a ? (
                          <div key={id} style={{ background: "#2a2a1a", borderRadius: 8, padding: "8px 14px" }}>
                            <div style={{ fontSize: 13, color: "#e8e0d0", fontWeight: 600 }}>{a.name}</div>
                            <BeltBadge belt={a.belt} />
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BACHECA */}
        {activeTab === "Bacheca" && (
          <div>
            <h2 style={{ color: "#daa520", marginBottom: 24, fontSize: 22 }}>Bacheca Comunicazioni</h2>
            <div style={{ display: "grid", gap: 16 }}>
              {news.map(n => (
                <div key={n.id} style={{
                  background: "#1a1a0e", border: `1px solid ${n.important ? "#b91c1c" : "#2a2a1a"}`,
                  borderRadius: 12, padding: 24,
                  boxShadow: n.important ? "0 0 20px rgba(185,28,28,0.1)" : "none",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                        {n.important && <span style={{ background: "#b91c1c", color: "#fff", fontSize: 10, padding: "2px 8px", borderRadius: 10, fontWeight: 700 }}>⚡ IMPORTANTE</span>}
                        <h3 style={{ color: "#e8e0d0", fontSize: 17, margin: 0 }}>{n.title}</h3>
                      </div>
                      <p style={{ color: "#999", fontSize: 14, margin: 0, lineHeight: 1.6 }}>{n.text}</p>
                    </div>
                    <div style={{ fontSize: 12, color: "#555", marginLeft: 20, flexShrink: 0 }}>
                      {new Date(n.date).toLocaleDateString("it-IT")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MODAL: Dettaglio Atleta */}
      {selectedAthlete && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
          onClick={() => setSelectedAthlete(null)}>
          <div style={{ background: "#1a1a0e", border: "1px solid #b8860b", borderRadius: 16, padding: 32, width: 480, maxWidth: "90vw" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
              <div>
                <h2 style={{ color: "#daa520", margin: 0, fontSize: 20 }}>{selectedAthlete.name}</h2>
                <div style={{ marginTop: 8 }}><BeltBadge belt={selectedAthlete.belt} /></div>
              </div>
              <button onClick={() => setSelectedAthlete(null)} style={{ background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: 20 }}>✕</button>
            </div>
            {[
              ["📧 Email", selectedAthlete.email],
              ["📞 Telefono", selectedAthlete.phone],
              ["🎂 Data di nascita", new Date(selectedAthlete.birthDate).toLocaleDateString("it-IT")],
              ["📅 Iscritto dal", new Date(selectedAthlete.joinDate).toLocaleDateString("it-IT")],
              ["💶 Quota mensile", `€${selectedAthlete.quota}`],
              ["💳 Stato pagamento", selectedAthlete.paid ? "✓ Pagato" : "✗ Non pagato"],
              ...(selectedAthlete.parent ? [["👨‍👩‍👦 Genitore", selectedAthlete.parent]] : []),
              ...(selectedAthlete.notes ? [["📝 Note", selectedAthlete.notes]] : []),
            ].map(([label, val]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #2a2a1a" }}>
                <span style={{ fontSize: 13, color: "#777" }}>{label}</span>
                <span style={{ fontSize: 13, color: "#e8e0d0" }}>{val}</span>
              </div>
            ))}
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              {!selectedAthlete.paid && (
                <button onClick={() => { markPaid(selectedAthlete.id); setSelectedAthlete(null); }} style={{
                  flex: 1, background: "rgba(34,197,94,0.2)", color: "#22c55e", border: "1px solid #22c55e",
                  borderRadius: 8, padding: "10px", cursor: "pointer", fontFamily: "inherit", fontSize: 13,
                }}>Segna come Pagato</button>
              )}
              {selectedAthlete.paid && (
                <button onClick={() => { generateReceipt(selectedAthlete); setSelectedAthlete(null); }} style={{
                  flex: 1, background: "rgba(74,158,255,0.15)", color: "#4a9eff", border: "1px solid #4a9eff",
                  borderRadius: 8, padding: "10px", cursor: "pointer", fontFamily: "inherit", fontSize: 13,
                }}>Emetti Ricevuta</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Ricevuta */}
      {showReceipt && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
          onClick={() => setShowReceipt(null)}>
          <div style={{ background: "#fff", borderRadius: 12, padding: 40, width: 480, maxWidth: "90vw", color: "#111" }}
            onClick={e => e.stopPropagation()}>
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
              ["Intestatario", showReceipt.name],
              ["Email", showReceipt.email],
              ["Periodo", new Date().toLocaleDateString("it-IT", { month: "long", year: "numeric" })],
              ["Descrizione", "Quota mensile associativa"],
              ["Cintura", showReceipt.belt],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #eee" }}>
                <span style={{ fontSize: 13, color: "#666" }}>{k}</span>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{v}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20, padding: "16px", background: "#b8860b", borderRadius: 8, color: "#fff" }}>
              <span style={{ fontSize: 16, fontWeight: 700 }}>TOTALE</span>
              <span style={{ fontSize: 20, fontWeight: 700 }}>€{showReceipt.quota},00</span>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={() => window.print()} style={{
                flex: 1, background: "#b8860b", color: "#fff", border: "none",
                borderRadius: 8, padding: "12px", cursor: "pointer", fontWeight: 600, fontSize: 13,
              }}>🖨️ Stampa</button>
              <button onClick={() => setShowReceipt(null)} style={{
                flex: 1, background: "#f0f0f0", color: "#333", border: "none",
                borderRadius: 8, padding: "12px", cursor: "pointer", fontSize: 13,
              }}>Chiudi</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Nuovo Atleta */}
      {showAddAthlete && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
          onClick={() => setShowAddAthlete(false)}>
          <div style={{ background: "#1a1a0e", border: "1px solid #b8860b", borderRadius: 16, padding: 32, width: 480, maxWidth: "90vw" }}
            onClick={e => e.stopPropagation()}>
            <h2 style={{ color: "#daa520", marginBottom: 24 }}>Nuovo Atleta</h2>
            {["Nome completo", "Email", "Telefono", "Data di nascita", "Genitore (se minorenne)"].map(field => (
              <div key={field} style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 11, color: "#777", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>{field}</label>
                <input type={field.includes("nascita") ? "date" : "text"} style={{
                  width: "100%", background: "#0d0d0d", border: "1px solid #2a2a1a", borderRadius: 8,
                  padding: "10px 12px", color: "#e8e0d0", fontFamily: "inherit", fontSize: 13, boxSizing: "border-box",
                }} />
              </div>
            ))}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 11, color: "#777", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>Cintura</label>
              <select style={{ width: "100%", background: "#0d0d0d", border: "1px solid #2a2a1a", borderRadius: 8, padding: "10px 12px", color: "#e8e0d0", fontFamily: "inherit", fontSize: 13 }}>
                {Object.keys(BELT_COLORS).map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
              <button onClick={() => setShowAddAthlete(false)} style={{
                flex: 1, background: "linear-gradient(135deg, #b8860b, #daa520)", color: "#0d0d0d",
                border: "none", borderRadius: 8, padding: "12px", cursor: "pointer", fontWeight: 700, fontFamily: "inherit",
              }}>Salva Atleta</button>
              <button onClick={() => setShowAddAthlete(false)} style={{
                background: "#2a2a1a", color: "#888", border: "1px solid #3a3a2a",
                borderRadius: 8, padding: "12px 20px", cursor: "pointer", fontFamily: "inherit",
              }}>Annulla</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
