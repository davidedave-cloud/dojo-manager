import React, { useState } from "react";
import { BELT_ORDER } from "./adminConstants.js";

export default function EsamiTab({ athletes, exams, supabase, onReload, BeltBadge, BELT_ORDER }) {
  const [showNewEvent, setShowNewEvent] = useState(false);
  const [showCandidates, setShowCandidates] = useState(null);
  const [eventType, setEventType] = useState("Esame Cinture"); // "Esame Cinture" | "Gara" | "Seminario"
  const [eventForm, setEventForm] = useState({ date: "", location: "", notes: "" });
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  // Gara: specialità per ogni atleta
  const [garaSpecialita, setGaraSpecialita] = useState({}); // { athleteId: { kata: bool, kataSquadra: bool, kumite: bool, kumiteSquadra: bool, compagniKata: [], compagniKumite: [] } }
  const [results, setResults] = useState({});
  const [saving, setSaving] = useState(false);
  const [activeExam, setActiveExam] = useState(null);

  const approvedAthletes = athletes.filter(a => a.status === "approved" && !a.parent_athlete_id);
  const iS = { background: "#0d0d0d", border: "1px solid #2a2a1a", borderRadius: 8, padding: "10px 12px", color: "#e8e0d0", fontFamily: "inherit", fontSize: 13, width: "100%", boxSizing: "border-box" };

  const EVENT_TYPES = [
    { key: "Esame Cinture", icon: "🥋", color: "#daa520" },
    { key: "Gara", icon: "🏅", color: "#4a9eff" },
    { key: "Seminario", icon: "📚", color: "#c084fc" },
  ];

  function toggleSpecialita(athleteId, field) {
    setGaraSpecialita(prev => ({
      ...prev,
      [athleteId]: {
        kata: false, kataSquadra: false, kumite: false, kumiteSquadra: false, compagniKata: [], compagniKumite: [],
        ...(prev[athleteId] || {}),
        [field]: !(prev[athleteId]?.[field]),
      }
    }));
  }

  async function createEvent() {
    if (!eventForm.date) return;
    setSaving(true);
    const { data: event, error } = await supabase.from("events").insert({
      event_date: eventForm.date,
      event_type: eventType,
      location: eventForm.location,
      notes: eventForm.notes,
      is_public: true,
    }).select().single();

    if (error) { alert("Errore: " + error.message); setSaving(false); return; }

    if (event && selectedCandidates.length > 0) {
      const participants = selectedCandidates.map(id => {
        const spec = garaSpecialita[id] || {};
        const specialitaList = [];
        if (spec.kata) specialitaList.push("Kata");
        if (spec.kataSquadra) specialitaList.push("Kata a Squadre" + (spec.compagniKata?.length ? ` (con ${spec.compagniKata.join(", ")})` : ""));
        if (spec.kumite) specialitaList.push("Kumite");
        if (spec.kumiteSquadra) specialitaList.push("Kumite a Squadre" + (spec.compagniKumite?.length ? ` (con ${spec.compagniKumite.join(", ")})` : ""));
        return {
          event_id: event.id,
          athlete_id: id,
          status: "iscritto",
          ...(eventType === "Gara" && specialitaList.length > 0 ? { new_belt: specialitaList.join(" | ") } : {}),
        };
      });
      await supabase.from("event_participants").insert(participants);
    }
    await onReload();
    setShowNewEvent(false);
    setEventForm({ date: "", location: "", notes: "" });
    setSelectedCandidates([]);
    setGaraSpecialita({});
    setSaving(false);
  }

  async function saveResults(examId) {
    setSaving(true);
    const exam = exams.find(e => e.id === examId);
    for (const ep of exam.event_participants || []) {
      const result = results[ep.athlete_id];
      if (!result) continue;
      await supabase.from("event_participants").update({
        status: result.outcome,
        new_belt: result.outcome === "promosso" ? result.newBelt : null,
      }).eq("event_id", examId).eq("athlete_id", ep.athlete_id);
      if (result.outcome === "promosso" && result.newBelt) {
        await supabase.from("athletes").update({ belt: result.newBelt }).eq("id", ep.athlete_id);
      }
    }
    await onReload();
    setActiveExam(null);
    setResults({});
    setSaving(false);
  }

  function getNextBelt(currentBelt) {
    const idx = BELT_ORDER.indexOf(currentBelt);
    return idx < BELT_ORDER.length - 1 ? BELT_ORDER[idx + 1] : currentBelt;
  }

  // Vista risultati esame
  if (activeExam) {
    const exam = exams.find(e => e.id === activeExam);
    if (!exam) return null;
    return (
      <div>
        <button onClick={() => { setActiveExam(null); setResults({}); }} style={{ background: "none", border: "none", color: "#daa520", cursor: "pointer", fontSize: 13, fontFamily: "inherit", marginBottom: 16 }}>← Torna agli eventi</button>
        <h2 style={{ color: "#daa520", fontSize: 22, margin: "0 0 8px" }}>📝 Risultati Esame</h2>
        <div style={{ fontSize: 13, color: "#888", marginBottom: 24 }}>{new Date(exam.event_date).toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} · {exam.location}</div>
        {(exam.event_participants || []).map(ep => {
          const a = athletes.find(x => x.id === ep.athlete_id);
          if (!a) return null;
          const res = results[ep.athlete_id] || { outcome: ep.status !== "iscritto" ? ep.status : "", newBelt: ep.new_belt || getNextBelt(a.belt) };
          return (
            <div key={ep.athlete_id} style={{ background: "#1a1a0e", border: `1px solid ${res.outcome === "promosso" ? "rgba(34,197,94,0.3)" : res.outcome === "rimandato" ? "rgba(239,68,68,0.3)" : "#2a2a1a"}`, borderRadius: 12, padding: 20, marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#e8e0d0" }}>{a.first_name} {a.last_name}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                    <BeltBadge belt={a.belt} /><span style={{ color: "#555", fontSize: 12 }}>→</span><BeltBadge belt={res.newBelt || getNextBelt(a.belt)} />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  {["promosso","rimandato"].map(o => (
                    <button key={o} onClick={() => setResults(prev => ({ ...prev, [ep.athlete_id]: { ...res, outcome: o } }))}
                      style={{ background: res.outcome === o ? (o === "promosso" ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)") : "#141408", color: res.outcome === o ? (o === "promosso" ? "#22c55e" : "#ef4444") : "#666", border: `1px solid ${res.outcome === o ? (o === "promosso" ? "#22c55e" : "#ef4444") : "#2a2a1a"}`, borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 12, fontFamily: "inherit", fontWeight: res.outcome === o ? 700 : 400 }}>
                      {o === "promosso" ? "✓ Promosso" : "✗ Rimandato"}
                    </button>
                  ))}
                  {res.outcome === "promosso" && (
                    <select value={res.newBelt || getNextBelt(a.belt)} onChange={e => setResults(prev => ({ ...prev, [ep.athlete_id]: { ...res, newBelt: e.target.value } }))}
                      style={{ background: "#141408", border: "1px solid #22c55e", borderRadius: 8, padding: "8px 12px", color: "#22c55e", fontFamily: "inherit", fontSize: 12 }}>
                      {BELT_ORDER.filter((_, i) => i > BELT_ORDER.indexOf(a.belt)).map(b => <option key={b}>{b}</option>)}
                    </select>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <button onClick={() => saveResults(activeExam)} disabled={saving} style={{ background: "linear-gradient(135deg,#b8860b,#daa520)", color: "#0d0d0d", border: "none", borderRadius: 10, padding: "14px 40px", cursor: "pointer", fontWeight: 700, fontSize: 15, fontFamily: "inherit", marginTop: 8, opacity: saving ? 0.7 : 1 }}>
          {saving ? "Salvataggio..." : "✓ Salva Risultati e Aggiorna Cinture"}
        </button>
      </div>
    );
  }

  const typeColor = { "Esame Cinture": "#daa520", "Gara": "#4a9eff", "Seminario": "#c084fc" };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ color: "#daa520", fontSize: 22 }}>🏆 Eventi</h2>
        <button onClick={() => setShowNewEvent(true)} style={{ background: "linear-gradient(135deg,#b8860b,#daa520)", color: "#0d0d0d", border: "none", borderRadius: 8, padding: "10px 20px", cursor: "pointer", fontWeight: 700, fontSize: 13, fontFamily: "inherit" }}>+ Nuovo Evento</button>
      </div>

      {exams.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "#555" }}><div style={{ fontSize: 36, marginBottom: 12 }}>🏆</div><div>Nessun evento. Clicca "+ Nuovo Evento" per iniziare!</div></div>
      ) : exams.map(e => {
        const color = typeColor[e.event_type] || "#888";
        const hasResults = e.event_participants?.some(ep => ep.status !== "iscritto");
        const promossi = e.event_participants?.filter(ep => ep.status === "promosso").length || 0;
        const rimandati = e.event_participants?.filter(ep => ep.status === "rimandato").length || 0;
        return (
          <div key={e.id} style={{ background: "#1a1a0e", border: `1px solid ${color}44`, borderRadius: 12, padding: 24, marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <span style={{ background: `${color}20`, color, border: `1px solid ${color}`, borderRadius: 99, padding: "2px 12px", fontSize: 11, fontWeight: 700 }}>{e.event_type}</span>
                </div>
                <div style={{ fontSize: 13, color: "#888", marginTop: 2 }}>{new Date(e.event_date).toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}{e.location ? ` · ${e.location}` : ""}</div>
                {e.notes && <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>{e.notes}</div>}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {e.event_type === "Esame Cinture" && !hasResults && <button onClick={() => setActiveExam(e.id)} style={{ background: "rgba(218,165,32,0.15)", color: "#daa520", border: "1px solid #daa520", borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>📝 Risultati</button>}
                {e.event_type === "Esame Cinture" && hasResults && <button onClick={() => setActiveExam(e.id)} style={{ background: "rgba(74,158,255,0.15)", color: "#4a9eff", border: "1px solid #4a9eff", borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>✏️ Modifica</button>}
              </div>
            </div>
            {hasResults && (
              <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                <span style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e", border: "1px solid #22c55e", borderRadius: 99, padding: "3px 12px", fontSize: 11, fontWeight: 700 }}>✓ {promossi} promossi</span>
                {rimandati > 0 && <span style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid #ef4444", borderRadius: 99, padding: "3px 12px", fontSize: 11, fontWeight: 700 }}>✗ {rimandati} rimandati</span>}
              </div>
            )}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {e.event_participants?.map(ep => {
                const a = athletes.find(x => x.id === ep.athlete_id);
                if (!a) return null;
                return (
                  <div key={ep.athlete_id} style={{ background: "#141408", borderRadius: 10, padding: "8px 12px", border: `1px solid ${ep.status === "promosso" ? "rgba(34,197,94,0.3)" : ep.status === "rimandato" ? "rgba(239,68,68,0.3)" : "#2a2a1a"}` }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#e8e0d0" }}>{a.first_name} {a.last_name}</div>
                    {e.event_type === "Esame Cinture" && (
                      <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                        <BeltBadge belt={a.belt} />
                        {ep.status === "promosso" && ep.new_belt && <><span style={{ color: "#22c55e", fontSize: 10 }}>→</span><BeltBadge belt={ep.new_belt} /></>}
                        {ep.status === "rimandato" && <span style={{ fontSize: 10, color: "#ef4444" }}>✗</span>}
                      </div>
                    )}
                    {e.event_type === "Gara" && ep.new_belt && <div style={{ fontSize: 10, color: "#4a9eff", marginTop: 3 }}>{ep.new_belt}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* MODAL NUOVO EVENTO */}
      {showNewEvent && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
          <div style={{ background: "#1a1a0e", border: "1px solid #b8860b", borderRadius: 16, padding: 32, width: 580, maxWidth: "100%", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <h3 style={{ color: "#daa520", margin: 0 }}>Nuovo Evento</h3>
              <button onClick={() => setShowNewEvent(false)} style={{ background: "none", border: "none", color: "#666", fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>

            {/* Tipo evento */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: "#777", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>Tipo Evento</div>
              <div style={{ display: "flex", gap: 8 }}>
                {EVENT_TYPES.map(t => (
                  <button key={t.key} onClick={() => setEventType(t.key)} style={{ flex: 1, background: eventType === t.key ? `${t.color}20` : "#141408", color: eventType === t.key ? t.color : "#666", border: `1px solid ${eventType === t.key ? t.color : "#2a2a1a"}`, borderRadius: 8, padding: "10px 8px", cursor: "pointer", fontSize: 12, fontFamily: "inherit", fontWeight: eventType === t.key ? 700 : 400 }}>{t.icon} {t.key}</button>
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div><label style={{ display: "block", fontSize: 11, color: "#777", marginBottom: 4 }}>DATA *</label><input type="date" style={iS} value={eventForm.date} onChange={e => setEventForm(p => ({ ...p, date: e.target.value }))} /></div>
              <div><label style={{ display: "block", fontSize: 11, color: "#777", marginBottom: 4 }}>LUOGO</label><input style={iS} value={eventForm.location} onChange={e => setEventForm(p => ({ ...p, location: e.target.value }))} placeholder="Es: Palazzetto Argenta, Bologna..." /></div>
            </div>
            <div style={{ marginBottom: 16 }}><label style={{ display: "block", fontSize: 11, color: "#777", marginBottom: 4 }}>NOTE</label><input style={iS} value={eventForm.notes} onChange={e => setEventForm(p => ({ ...p, notes: e.target.value }))} placeholder="Informazioni aggiuntive..." /></div>

            {/* Selezione partecipanti */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: "#777", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>Partecipanti ({selectedCandidates.length} selezionati)</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, maxHeight: 200, overflowY: "auto", marginBottom: 8 }}>
                {approvedAthletes.map(a => {
                  const selected = selectedCandidates.includes(a.id);
                  return (
                    <div key={a.id} onClick={() => setSelectedCandidates(prev => selected ? prev.filter(id => id !== a.id) : [...prev, a.id])}
                      style={{ background: selected ? "rgba(34,197,94,0.1)" : "#141408", border: `1px solid ${selected ? "#22c55e" : "#2a2a1a"}`, borderRadius: 8, padding: "8px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 20, height: 20, borderRadius: "50%", background: selected ? "#22c55e" : "#2a2a1a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, flexShrink: 0 }}>{selected ? "✓" : ""}</div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: selected ? "#22c55e" : "#e8e0d0" }}>{a.first_name} {a.last_name}</div>
                        <BeltBadge belt={a.belt} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Specialità gara - solo per tipo Gara */}
            {eventType === "Gara" && selectedCandidates.length > 0 && (
              <div style={{ marginBottom: 16, background: "rgba(74,158,255,0.05)", border: "1px solid rgba(74,158,255,0.2)", borderRadius: 10, padding: 16 }}>
                <div style={{ fontSize: 11, color: "#4a9eff", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>🏅 Specialità per atleta</div>
                {selectedCandidates.map(id => {
                  const a = athletes.find(x => x.id === id);
                  if (!a) return null;
                  const spec = garaSpecialita[id] || {};
                  return (
                    <div key={id} style={{ background: "#141408", borderRadius: 8, padding: 12, marginBottom: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#e8e0d0", marginBottom: 8 }}>{a.first_name} {a.last_name}</div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
                        {[["kata","Kata"],["kataSquadra","Kata Squadre"],["kumite","Kumite"],["kumiteSquadra","Kumite Squadre"]].map(([field, label]) => (
                          <button key={field} onClick={() => toggleSpecialita(id, field)} style={{ background: spec[field] ? "rgba(74,158,255,0.2)" : "#1a1a0e", color: spec[field] ? "#4a9eff" : "#666", border: `1px solid ${spec[field] ? "#4a9eff" : "#2a2a1a"}`, borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 11, fontFamily: "inherit", fontWeight: spec[field] ? 700 : 400 }}>{label}</button>
                        ))}
                      </div>
                      {spec.kataSquadra && (
                        <div style={{ marginBottom: 4 }}>
                          <input style={{ ...iS, fontSize: 11, padding: "6px 10px" }} value={(spec.compagniKata || []).join(", ")} onChange={e => setGaraSpecialita(prev => ({ ...prev, [id]: { ...prev[id], compagniKata: e.target.value.split(",").map(s => s.trim()).filter(Boolean) } }))} placeholder="Nomi compagni di squadra (separati da virgola)" />
                        </div>
                      )}
                      {spec.kumiteSquadra && (
                        <div>
                          <input style={{ ...iS, fontSize: 11, padding: "6px 10px" }} value={(spec.compagniKumite || []).join(", ")} onChange={e => setGaraSpecialita(prev => ({ ...prev, [id]: { ...prev[id], compagniKumite: e.target.value.split(",").map(s => s.trim()).filter(Boolean) } }))} placeholder="Nomi compagni di squadra (separati da virgola)" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={createEvent} disabled={saving || !eventForm.date} style={{ flex: 1, background: "linear-gradient(135deg,#b8860b,#daa520)", color: "#0d0d0d", border: "none", borderRadius: 10, padding: 14, cursor: "pointer", fontWeight: 700, fontSize: 14, fontFamily: "inherit", opacity: saving || !eventForm.date ? 0.6 : 1 }}>
                {saving ? "Creando..." : "✓ Crea Evento"}
              </button>
              <button onClick={() => setShowNewEvent(false)} style={{ background: "#2a2a1a", color: "#888", border: "1px solid #3a3a2a", borderRadius: 10, padding: "14px 18px", cursor: "pointer", fontFamily: "inherit" }}>Annulla</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// ============================================================
// COMPONENTE BILANCIO
// ============================================================
