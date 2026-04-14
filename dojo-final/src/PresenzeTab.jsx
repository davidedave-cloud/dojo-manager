import React, { useState } from "react";

const COURSE_OPTIONS = {
  "Argenta": ["Karate Bambini", "Karate Adulti"],
  "S.M. Codifiume": ["Karate Bambini", "Karate Adulti", "Psicomotricità"],
};

export default function PresenzeTab({ athletes, lessons, supabase, onReload, BeltBadge }) {
  const [showNewLesson, setShowNewLesson] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [presenze, setPresenze] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [lessonForm, setLessonForm] = useState({
    date: new Date().toISOString().split("T")[0],
    time: "18:00", course: "Karate Bambini", instructor: "", location: "Argenta",
  });

  // Atleti filtrati per sede e corso della lezione selezionata
  function athletesForLesson(lesson) {
    if (!lesson) return [];
    const loc = lesson.location;
    const type = lesson.lesson_type;
    return athletes.filter(a =>
      a.status === "approved" &&
      a.location === loc &&
      a.course === type
    );
  }

  const [editLesson, setEditLesson] = useState(null);
  const [editLessonForm, setEditLessonForm] = useState({});
  const [deletingLesson, setDeletingLesson] = useState(null);

  async function openLesson(lesson) {
    setSelectedLesson(lesson);
    const presMap = {};
    (lesson.attendances || []).forEach(a => { presMap[a.athlete_id] = true; });
    setPresenze(presMap);
  }

  async function saveEditLesson() {
    setSaving(true);
    const { error } = await supabase.from("lessons").update({
      lesson_date: editLessonForm.date,
      lesson_time: editLessonForm.time,
      lesson_type: editLessonForm.course,
      location: editLessonForm.location,
      instructor: editLessonForm.instructor,
    }).eq("id", editLesson.id);
    if (error) { alert("Errore: " + error.message); setSaving(false); return; }
    await onReload();
    setEditLesson(null);
    setSaving(false);
  }

  async function deleteLesson(lesson) {
    if (!window.confirm(`Eliminare la lezione del ${new Date(lesson.lesson_date).toLocaleDateString("it-IT")}? Verranno eliminate anche le presenze.`)) return;
    setDeletingLesson(lesson.id);
    await supabase.from("attendances").delete().eq("lesson_id", lesson.id);
    await supabase.from("lessons").delete().eq("id", lesson.id);
    await onReload();
    setDeletingLesson(null);
  }

  function togglePresenza(athleteId) {
    setPresenze(prev => ({ ...prev, [athleteId]: !prev[athleteId] }));
  }

  async function savePresenze() {
    setSaving(true);
    const { error: delErr } = await supabase.from("attendances").delete().eq("lesson_id", selectedLesson.id);
    if (delErr) { alert("Errore: " + delErr.message); setSaving(false); return; }
    const toInsert = Object.entries(presenze)
      .filter(([, present]) => present)
      .map(([athlete_id]) => ({ lesson_id: selectedLesson.id, athlete_id, present: true }));
    if (toInsert.length > 0) {
      const { error: insErr } = await supabase.from("attendances").insert(toInsert);
      if (insErr) { alert("Errore: " + insErr.message); setSaving(false); return; }
    }
    await onReload();
    setSelectedLesson(null);
    setSaving(false);
  }

  async function createLesson() {
    setSaving(true);
    setSaveError("");
    const { error } = await supabase.from("lessons").insert({
      lesson_date: lessonForm.date,
      lesson_time: lessonForm.time,
      lesson_type: lessonForm.course,
      instructor: lessonForm.instructor,
      location: lessonForm.location,
    });
    if (error) {
      setSaveError("Errore: " + error.message);
      setSaving(false);
      return;
    }
    await onReload();
    setShowNewLesson(false);
    setSaving(false);
  }

  const today = new Date().toISOString().split("T")[0];
  const todayLessons = lessons.filter(l => l.lesson_date === today);
  const pastLessons = lessons.filter(l => l.lesson_date !== today);

  const iStyle2 = { background: "#0d0d0d", border: "1px solid #2a2a1a", borderRadius: 8, padding: "10px 12px", color: "#e8e0d0", fontFamily: "inherit", fontSize: 13 };

  if (selectedLesson) {
    const lessonAthletes = athletesForLesson(selectedLesson);
    return (
      <div>
        <button onClick={() => setSelectedLesson(null)} style={{ background: "none", border: "none", color: "#daa520", cursor: "pointer", fontSize: 13, fontFamily: "inherit", marginBottom: 16 }}>← Torna alle lezioni</button>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <h2 style={{ color: "#daa520", fontSize: 22, margin: 0 }}>{selectedLesson.lesson_type} — {selectedLesson.location}</h2>
            <div style={{ fontSize: 13, color: "#888", marginTop: 4 }}>{new Date(selectedLesson.lesson_date).toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })} · {selectedLesson.lesson_time?.slice(0,5)}</div>
          </div>
          <div style={{ fontSize: 14, color: "#daa520", fontWeight: 700 }}>{Object.values(presenze).filter(Boolean).length} / {lessonAthletes.length} presenti</div>
        </div>
        {lessonAthletes.length === 0 && (
          <div style={{ padding: 20, background: "#1a1a0e", borderRadius: 10, color: "#777", fontSize: 13, marginBottom: 20 }}>
            ⚠️ Nessun atleta trovato per <strong>{selectedLesson.lesson_type}</strong> a <strong>{selectedLesson.location}</strong>. Verifica che gli atleti abbiano sede e corso corretti nel loro profilo.
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10, marginBottom: 24 }}>
          {lessonAthletes.map(a => {
            const isPresent = presenze[a.id];
            return (
              <div key={a.id} onClick={() => togglePresenza(a.id)} style={{ background: isPresent ? "rgba(34,197,94,0.15)" : "#1a1a0e", border: `2px solid ${isPresent ? "#22c55e" : "#2a2a1a"}`, borderRadius: 12, padding: "14px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, transition: "all 0.15s" }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: isPresent ? "#22c55e" : "#2a2a1a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                  {isPresent ? "✓" : ""}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: isPresent ? "#22c55e" : "#e8e0d0" }}>{a.first_name} {a.last_name}</div>
                  <div style={{ marginTop: 3 }}><BeltBadge belt={a.belt} /></div>
                </div>
              </div>
            );
          })}
        </div>
        <button onClick={savePresenze} disabled={saving} style={{ background: "linear-gradient(135deg,#b8860b,#daa520)", color: "#0d0d0d", border: "none", borderRadius: 10, padding: "14px 40px", cursor: "pointer", fontWeight: 700, fontSize: 15, fontFamily: "inherit", opacity: saving ? 0.7 : 1 }}>
          {saving ? "Salvataggio..." : "✓ Salva Presenze"}
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ color: "#daa520", fontSize: 22 }}>📋 Registro Presenze</h2>
        <button onClick={() => setShowNewLesson(true)} style={{ background: "linear-gradient(135deg,#b8860b,#daa520)", color: "#0d0d0d", border: "none", borderRadius: 8, padding: "10px 20px", cursor: "pointer", fontWeight: 700, fontSize: 13, fontFamily: "inherit" }}>+ Nuova Lezione</button>
      </div>

      {todayLessons.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 12, color: "#daa520", fontWeight: 700, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.1em" }}>Oggi</div>
          {todayLessons.map(l => (
            <div key={l.id} style={{ background: "#1a1a0e", border: "2px solid #b8860b", borderRadius: 12, padding: 18, marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div onClick={() => openLesson(l)} style={{ flex: 1, cursor: "pointer" }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#daa520" }}>{l.lesson_type} — {l.location}</div>
                <div style={{ fontSize: 12, color: "#888", marginTop: 3 }}>{l.lesson_time?.slice(0,5)} · {l.instructor}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13, color: "#22c55e" }}>{l.attendances?.length || 0} presenti</span>
                <button onClick={() => openLesson(l)} style={{ background: "rgba(218,165,32,0.15)", color: "#daa520", border: "1px solid #daa520", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>✏️ Presenze</button>
                <button onClick={() => { setEditLesson(l); setEditLessonForm({ date: l.lesson_date, time: l.lesson_time?.slice(0,5) || "18:00", course: l.lesson_type, location: l.location, instructor: l.instructor || "" }); }} style={{ background: "rgba(74,158,255,0.15)", color: "#4a9eff", border: "1px solid #4a9eff", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>🔧 Modifica</button>
                <button onClick={() => deleteLesson(l)} disabled={deletingLesson === l.id} style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>{deletingLesson === l.id ? "..." : "🗑️"}</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div>
        <div style={{ fontSize: 12, color: "#777", fontWeight: 700, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.1em" }}>Lezioni precedenti</div>
        {pastLessons.length === 0 && todayLessons.length === 0 && (
          <div style={{ textAlign: "center", padding: 60, color: "#555" }}><div style={{ fontSize: 36, marginBottom: 12 }}>📋</div><div>Nessuna lezione ancora. Clicca "+ Nuova Lezione" per iniziare!</div></div>
        )}
        {(() => {
          // Raggruppa per data
          const byDate = {};
          pastLessons.slice(0, 30).forEach(l => {
            const d = l.lesson_date;
            if (!byDate[d]) byDate[d] = [];
            byDate[d].push(l);
          });
          return Object.keys(byDate).sort((a, b) => b.localeCompare(a)).map(date => (
            <div key={date} style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 12, color: "#daa520", fontWeight: 700, marginBottom: 8, paddingBottom: 4, borderBottom: "1px solid #2a2a1a" }}>
                📅 {new Date(date).toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </div>
              {byDate[date].sort((a, b) => (a.lesson_time || "").localeCompare(b.lesson_time || "")).map(l => (
                <div key={l.id} style={{ background: "#1a1a0e", border: "1px solid #2a2a1a", borderRadius: 12, padding: 14, marginBottom: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                    <div onClick={() => openLesson(l)} style={{ cursor: "pointer" }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#e8e0d0" }}>{l.location} — {l.lesson_type}</div>
                      <div style={{ fontSize: 12, color: "#777", marginTop: 2 }}>🕐 {l.lesson_time?.slice(0,5)} · {l.instructor} · {l.attendances?.length || 0} presenti</div>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      <button onClick={() => openLesson(l)} style={{ background: "rgba(218,165,32,0.15)", color: "#daa520", border: "1px solid #daa520", borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>✏️ Presenze</button>
                      <button onClick={() => { setEditLesson(l); setEditLessonForm({ date: l.lesson_date, time: l.lesson_time?.slice(0,5) || "18:00", course: l.lesson_type, location: l.location, instructor: l.instructor || "" }); }} style={{ background: "rgba(74,158,255,0.15)", color: "#4a9eff", border: "1px solid #4a9eff", borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>🔧</button>
                      <button onClick={() => deleteLesson(l)} disabled={deletingLesson === l.id} style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>{deletingLesson === l.id ? "..." : "🗑️"}</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ));
        })()}
      </div>

      {/* MODAL MODIFICA LEZIONE */}
      {editLesson && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#1a1a0e", border: "1px solid #4a9eff", borderRadius: 16, padding: 32, width: 440, maxWidth: "90vw" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <h3 style={{ color: "#4a9eff", margin: 0 }}>🔧 Modifica Lezione</h3>
              <button onClick={() => setEditLesson(null)} style={{ background: "none", border: "none", color: "#666", fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div><label style={{ display: "block", fontSize: 11, color: "#777", marginBottom: 4 }}>DATA</label><input type="date" style={{ ...iStyle2, width: "100%", boxSizing: "border-box" }} value={editLessonForm.date} onChange={e => setEditLessonForm(p => ({ ...p, date: e.target.value }))} /></div>
              <div><label style={{ display: "block", fontSize: 11, color: "#777", marginBottom: 4 }}>ORA</label><input type="time" style={{ ...iStyle2, width: "100%", boxSizing: "border-box" }} value={editLessonForm.time} onChange={e => setEditLessonForm(p => ({ ...p, time: e.target.value }))} /></div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 11, color: "#777", marginBottom: 4 }}>SEDE</label>
              <div style={{ display: "flex", gap: 8 }}>
                {["Argenta", "S.M. Codifiume"].map(loc => (
                  <button key={loc} onClick={() => setEditLessonForm(p => ({ ...p, location: loc, course: COURSE_OPTIONS[loc][0] }))} style={{ flex: 1, background: editLessonForm.location === loc ? "linear-gradient(135deg,#b8860b,#daa520)" : "#141408", color: editLessonForm.location === loc ? "#0d0d0d" : "#888", border: `1px solid ${editLessonForm.location === loc ? "#daa520" : "#2a2a1a"}`, borderRadius: 8, padding: "10px", cursor: "pointer", fontSize: 13, fontFamily: "inherit", fontWeight: editLessonForm.location === loc ? 700 : 400 }}>{loc}</button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 11, color: "#777", marginBottom: 4 }}>CORSO</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {(COURSE_OPTIONS[editLessonForm.location] || []).map(c => (
                  <button key={c} onClick={() => setEditLessonForm(p => ({ ...p, course: c }))} style={{ flex: 1, background: editLessonForm.course === c ? "linear-gradient(135deg,#1E3A8A,#4a9eff)" : "#141408", color: editLessonForm.course === c ? "#fff" : "#888", border: `1px solid ${editLessonForm.course === c ? "#4a9eff" : "#2a2a1a"}`, borderRadius: 8, padding: "10px", cursor: "pointer", fontSize: 12, fontFamily: "inherit", fontWeight: editLessonForm.course === c ? 700 : 400, whiteSpace: "nowrap" }}>{c}</button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 20 }}><label style={{ display: "block", fontSize: 11, color: "#777", marginBottom: 4 }}>ISTRUTTORE</label><input style={{ ...iStyle2, width: "100%", boxSizing: "border-box" }} value={editLessonForm.instructor} onChange={e => setEditLessonForm(p => ({ ...p, instructor: e.target.value }))} placeholder="Nome istruttore" /></div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={saveEditLesson} disabled={saving} style={{ flex: 1, background: "linear-gradient(135deg,#1E3A8A,#4a9eff)", color: "#fff", border: "none", borderRadius: 10, padding: 14, cursor: "pointer", fontWeight: 700, fontSize: 14, fontFamily: "inherit" }}>
                {saving ? "Salvataggio..." : "✓ Salva Modifiche"}
              </button>
              <button onClick={() => setEditLesson(null)} style={{ background: "#2a2a1a", color: "#888", border: "1px solid #3a3a2a", borderRadius: 10, padding: "14px 18px", cursor: "pointer", fontFamily: "inherit" }}>Annulla</button>
            </div>
          </div>
        </div>
      )}

      {showNewLesson && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#1a1a0e", border: "1px solid #b8860b", borderRadius: 16, padding: 32, width: 440, maxWidth: "90vw" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <h3 style={{ color: "#daa520", margin: 0 }}>Nuova Lezione</h3>
              <button onClick={() => setShowNewLesson(false)} style={{ background: "none", border: "none", color: "#666", fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div><label style={{ display: "block", fontSize: 11, color: "#777", marginBottom: 4 }}>DATA</label><input type="date" style={{ ...iStyle2, width: "100%", boxSizing: "border-box" }} value={lessonForm.date} onChange={e => setLessonForm(p => ({ ...p, date: e.target.value }))} /></div>
              <div><label style={{ display: "block", fontSize: 11, color: "#777", marginBottom: 4 }}>ORA</label><input type="time" style={{ ...iStyle2, width: "100%", boxSizing: "border-box" }} value={lessonForm.time} onChange={e => setLessonForm(p => ({ ...p, time: e.target.value }))} /></div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 11, color: "#777", marginBottom: 4 }}>SEDE</label>
              <div style={{ display: "flex", gap: 8 }}>
                {["Argenta", "S.M. Codifiume"].map(loc => (
                  <button key={loc} onClick={() => setLessonForm(p => ({ ...p, location: loc, course: COURSE_OPTIONS[loc][0] }))} style={{ flex: 1, background: lessonForm.location === loc ? "linear-gradient(135deg,#b8860b,#daa520)" : "#141408", color: lessonForm.location === loc ? "#0d0d0d" : "#888", border: `1px solid ${lessonForm.location === loc ? "#daa520" : "#2a2a1a"}`, borderRadius: 8, padding: "10px", cursor: "pointer", fontSize: 13, fontFamily: "inherit", fontWeight: lessonForm.location === loc ? 700 : 400 }}>{loc}</button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 11, color: "#777", marginBottom: 4 }}>CORSO</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {(COURSE_OPTIONS[lessonForm.location] || []).map(c => (
                  <button key={c} onClick={() => setLessonForm(p => ({ ...p, course: c }))} style={{ flex: 1, background: lessonForm.course === c ? "linear-gradient(135deg,#1E3A8A,#4a9eff)" : "#141408", color: lessonForm.course === c ? "#fff" : "#888", border: `1px solid ${lessonForm.course === c ? "#4a9eff" : "#2a2a1a"}`, borderRadius: 8, padding: "10px", cursor: "pointer", fontSize: 12, fontFamily: "inherit", fontWeight: lessonForm.course === c ? 700 : 400, whiteSpace: "nowrap" }}>{c}</button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 20 }}><label style={{ display: "block", fontSize: 11, color: "#777", marginBottom: 4 }}>ISTRUTTORE</label><input style={{ ...iStyle2, width: "100%", boxSizing: "border-box" }} value={lessonForm.instructor} onChange={e => setLessonForm(p => ({ ...p, instructor: e.target.value }))} placeholder="Nome istruttore" /></div>
            {saveError && <div style={{ color: "#ef4444", fontSize: 12, padding: "10px 14px", background: "rgba(239,68,68,0.08)", borderRadius: 8, border: "1px solid rgba(239,68,68,0.2)", marginBottom: 14 }}>⚠️ {saveError}</div>}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={createLesson} disabled={saving} style={{ flex: 1, background: "linear-gradient(135deg,#b8860b,#daa520)", color: "#0d0d0d", border: "none", borderRadius: 10, padding: 14, cursor: "pointer", fontWeight: 700, fontSize: 14, fontFamily: "inherit" }}>
                {saving ? "Creando..." : "✓ Crea Lezione"}
              </button>
              <button onClick={() => setShowNewLesson(false)} style={{ background: "#2a2a1a", color: "#888", border: "1px solid #3a3a2a", borderRadius: 10, padding: "14px 18px", cursor: "pointer", fontFamily: "inherit" }}>Annulla</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// COMPONENTE BACHECA ADMIN
// ============================================================
