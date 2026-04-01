import React, { useState, useEffect } from "react";
import { emptyMember, BELT_ORDER, COURSES, LOCATIONS, inputStyle, labelStyle, StepIndicator } from "./athleteConstants.jsx";

export default function AddMemberModal({ onClose, onSave, parentAthlete }) {
  const [m, setM] = useState(emptyMember);
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const setF = (k, v) => setM(prev => ({ ...prev, [k]: v }));

  useEffect(() => {
    if (m.birthDate) {
      const age = (new Date() - new Date(m.birthDate)) / (1000 * 60 * 60 * 24 * 365.25);
      setF("isMinor", age < 18);
    }
  }, [m.birthDate]);

  function validate() {
    if (step === 0 && (!m.firstName || !m.lastName || !m.birthDate || !m.birthPlace)) return "Compila tutti i campi obbligatori (*)";
    if (step === 1 && (!m.course || !m.location)) return "Seleziona corso e sede";
    if (step === 2 && !m.medicalExpiry) return "Inserisci la data di scadenza del certificato";
    return null;
  }

  async function handleSave() {
    const err = validate();
    if (err) { setError(err); return; }
    if (step < 2) { setStep(s => s + 1); setError(""); return; }
    setSaving(true);
    await onSave(m);
    setSaving(false);
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "linear-gradient(135deg,#131008,#0d0c07)", border: "1px solid #2a2010", borderRadius: 20, padding: "36px 32px", width: 500, maxWidth: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.8)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#daa520" }}>👨‍👩‍👦 Aggiungi Familiare</div>
            <div style={{ fontSize: 12, color: "#5a5040", marginTop: 3 }}>Passo {step + 1} di 3</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#5a5040", fontSize: 20, cursor: "pointer" }}>✕</button>
        </div>
        <StepIndicator step={step} total={3} />

        {step === 0 && (
          <div>
            <SectionTitle icon="👤" title="Dati Anagrafici" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div><label style={labelStyle}>Nome *</label><input style={inputStyle} value={m.firstName} onChange={e => setF("firstName", e.target.value)} placeholder="Mario" /></div>
              <div><label style={labelStyle}>Cognome *</label><input style={inputStyle} value={m.lastName} onChange={e => setF("lastName", e.target.value)} placeholder="Rossi" /></div>
            </div>
            <div style={{ marginTop: 12 }}><label style={labelStyle}>Data di nascita *</label><input type="date" style={inputStyle} value={m.birthDate} onChange={e => setF("birthDate", e.target.value)} /></div>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 10, marginTop: 12 }}>
              <div><label style={labelStyle}>Comune di nascita *</label><input style={inputStyle} value={m.birthPlace} onChange={e => setF("birthPlace", e.target.value)} placeholder="Ferrara" /></div>
              <div><label style={labelStyle}>Prov.</label><input style={inputStyle} value={m.birthProvince} onChange={e => setF("birthProvince", e.target.value)} placeholder="FE" maxLength={2} /></div>
            </div>
            <div style={{ marginTop: 12 }}><label style={labelStyle}>Stato di nascita</label><input style={inputStyle} value={m.birthCountry} onChange={e => setF("birthCountry", e.target.value)} placeholder="Italia" /></div>
            <div style={{ marginTop: 12 }}><label style={labelStyle}>Codice Fiscale</label><input style={{ ...inputStyle, textTransform: "uppercase" }} value={m.fiscalCode} onChange={e => setF("fiscalCode", e.target.value.toUpperCase())} placeholder="RSSMRI80A01D548X" maxLength={16} /></div>
            <div style={{ marginTop: 12 }}><label style={labelStyle}>Note</label><textarea style={{ ...inputStyle, height: 60, resize: "vertical" }} value={m.notes} onChange={e => setF("notes", e.target.value)} placeholder="Infortuni, allergie..." /></div>
          </div>
        )}

        {step === 1 && (
          <div>
            <SectionTitle icon="🥋" title="Corso & Sede" />
            <div style={{ marginBottom: 14 }}><label style={labelStyle}>Corso *</label><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>{COURSES.map(c => <button key={c} onClick={() => setF("course", c)} style={{ background: m.course === c ? "linear-gradient(135deg,#b8860b,#daa520)" : "#0d0c07", color: m.course === c ? "#0a0905" : "#8a7a6a", border: `1px solid ${m.course === c ? "#daa520" : "#2a2010"}`, borderRadius: 8, padding: "10px 6px", cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>{c}</button>)}</div></div>
            <div style={{ marginBottom: 14 }}><label style={labelStyle}>Sede *</label><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>{LOCATIONS.map(l => <button key={l} onClick={() => setF("location", l)} style={{ background: m.location === l ? "linear-gradient(135deg,#b8860b,#daa520)" : "#0d0c07", color: m.location === l ? "#0a0905" : "#8a7a6a", border: `1px solid ${m.location === l ? "#daa520" : "#2a2010"}`, borderRadius: 8, padding: "12px", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>{l}</button>)}</div></div>
            <div><label style={labelStyle}>Cintura attuale</label><select style={inputStyle} value={m.belt} onChange={e => setF("belt", e.target.value)}>{BELT_ORDER.map(b => <option key={b}>{b}</option>)}</select></div>
          </div>
        )}

        {step === 2 && (
          <div>
            <SectionTitle icon="🏥" title="Certificato Medico" />
            <div style={{ marginBottom: 12, padding: "10px 14px", background: "rgba(218,165,32,0.08)", border: "1px solid rgba(218,165,32,0.2)", borderRadius: 8, fontSize: 12, color: "#daa520" }}>
              Genitore/tutore: <strong>{parentAthlete?.first_name} {parentAthlete?.last_name}</strong> · {parentAthlete?.email}
            </div>
            <label style={labelStyle}>Data di scadenza *</label>
            <input type="date" style={inputStyle} value={m.medicalExpiry} onChange={e => setF("medicalExpiry", e.target.value)} />
            {m.medicalExpiry && new Date(m.medicalExpiry) > new Date() && <div style={{ marginTop: 6, fontSize: 11, color: "#22c55e", padding: "4px 8px", background: "rgba(34,197,94,0.08)", borderRadius: 4 }}>✓ Certificato valido</div>}
            <div style={{ marginTop: 16, padding: "12px 16px", background: "#0d0c07", border: "1px solid #1a1408", borderRadius: 8, fontSize: 12, color: "#5a5040", lineHeight: 1.8 }}>
              <div>👤 <strong style={{ color: "#8a7a6a" }}>{m.firstName} {m.lastName}</strong></div>
              <div>🥋 {m.course} · {m.location} · Cintura {m.belt}</div>
            </div>
          </div>
        )}

        {error && <div style={{ marginTop: 14, color: "#ef4444", fontSize: 12, padding: "10px 14px", background: "rgba(239,68,68,0.08)", borderRadius: 8, border: "1px solid rgba(239,68,68,0.2)" }}>⚠️ {error}</div>}
        <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
          {step > 0 && <button onClick={() => { setStep(s => s - 1); setError(""); }} style={{ background: "#1a1408", color: "#8a7a6a", border: "1px solid #2a2010", borderRadius: 10, padding: "12px 18px", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>← Indietro</button>}
          <button onClick={handleSave} disabled={saving} style={{ flex: 1, background: "linear-gradient(135deg,#b8860b,#daa520)", color: "#0a0905", border: "none", borderRadius: 10, padding: "14px", cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "inherit", opacity: saving ? 0.7 : 1 }}>
            {saving ? "Salvataggio..." : step === 2 ? "✓ Aggiungi Familiare" : "Avanti →"}
          </button>
        </div>
      </div>
    </div>
  );
}

