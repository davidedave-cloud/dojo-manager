import React, { useState, useEffect } from "react";
import {
  COURSES, LOCATIONS, HOW_FOUND, STEP_LABELS, TOTAL_STEPS,
  emptyReg, inputStyle, labelStyle, StepIndicator, SectionTitle
} from "./AthleteComponents.jsx";

export function ScreenHome({ setScreen, mounted }) {
  return (
    <div style={{ fontFamily: "'Palatino Linotype','Book Antiqua',Palatino,serif", background: "#0a0905", minHeight: "100vh", color: "#e8e0d0", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
      {[600, 400, 200].map(s => <div key={s} style={{ position: "absolute", width: s, height: s, borderRadius: "50%", border: "1px solid #1a1408", top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: s === 200 ? "radial-gradient(circle,rgba(184,134,11,0.07) 0%,transparent 70%)" : "transparent" }} />)}
      <div style={{ textAlign: "center", zIndex: 1, opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(20px)", transition: "all 0.8s ease" }}>
        <img src="https://ccllvcdtehvbjroawomz.supabase.co/storage/v1/object/public/assets/Karate%20Do%20w.png" alt="Cinque Cerchi ASD" style={{ width: 160, height: 160, objectFit: "contain", marginBottom: 8, mixBlendMode: "lighten" }} />
        <div style={{ fontSize: 36, fontWeight: 700, color: "#daa520", letterSpacing: "0.12em", textTransform: "uppercase" }}>Cinque Cerchi ASD</div>
        <div style={{ fontSize: 12, color: "#8a7a6a", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 4 }}>Sezione Karate-do Tradizionale</div>
        <div style={{ fontSize: 11, color: "#5a5040", letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 48 }}>Portale Atleti</div>
        <div style={{ fontSize: 15, color: "#8a7a6a", maxWidth: 340, margin: "0 auto 48px", lineHeight: 1.7 }}>Accedi alla tua area personale per seguire progressi, presenze e pagamenti.</div>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={() => setScreen("login")} style={{ background: "linear-gradient(135deg,#b8860b,#daa520)", color: "#0a0905", border: "none", borderRadius: 10, padding: "14px 40px", cursor: "pointer", fontSize: 15, fontWeight: 700, fontFamily: "inherit", boxShadow: "0 4px 24px rgba(184,134,11,0.35)" }}>Accedi</button>
          <button onClick={() => setScreen("register")} style={{ background: "transparent", color: "#daa520", border: "1px solid #b8860b", borderRadius: 10, padding: "14px 40px", cursor: "pointer", fontSize: 15, fontFamily: "inherit" }}>Iscriviti</button>
        </div>
        <div style={{ marginTop: 16 }}>
          <button onClick={() => setScreen("already-member")} style={{ background: "transparent", color: "#8a7a6a", border: "1px solid #3a3020", borderRadius: 10, padding: "12px 32px", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>Sei già iscritto al dojo? Crea il tuo accesso</button>
        </div>
        <div style={{ marginTop: 24 }}>
          <a href="https://www.patreon.com/cw/DavideTemporin" target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", background: "transparent", color: "#8a7a6a", border: "1px solid #3a3020", borderRadius: 10, padding: "10px 28px", cursor: "pointer", fontSize: 13, fontFamily: "inherit", textDecoration: "none" }}>📚 Approfondisci lo studio</a>
        </div>
        <div style={{ marginTop: 32, fontSize: 11, color: "#3a3020", letterSpacing: "0.15em" }}>精神統一 · SEISHIN TOITSU</div>
      </div>
    </div>
  );
}

export function ScreenLogin({ supabase, setScreen }) {
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const BASE = { fontFamily: "'Palatino Linotype','Book Antiqua',Palatino,serif", background: "#0a0905", minHeight: "100vh", color: "#e8e0d0" };

  async function handleLogin() {
    setLoginLoading(true); setLoginError("");
    const { error } = await supabase.auth.signInWithPassword({ email: loginData.email, password: loginData.password });
    if (error) { setLoginError("Email o password non corretti."); setLoginLoading(false); }
  }

  async function handleResetPassword() {
    if (!loginData.email) { setLoginError("Inserisci prima la tua email."); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(loginData.email, { redirectTo: window.location.origin });
    if (!error) setResetSent(true);
    else setLoginError("Errore nell'invio email. Verifica l'indirizzo.");
  }

  return (
    <div style={{ ...BASE, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "linear-gradient(135deg,#131008,#0d0c07)", border: "1px solid #2a2010", borderRadius: 20, padding: "48px 40px", width: 400, maxWidth: "90vw", boxShadow: "0 20px 60px rgba(0,0,0,0.6)" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🥋</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#daa520" }}>Bentornato</div>
          <div style={{ fontSize: 13, color: "#5a5040", marginTop: 4 }}>Accedi alla tua area personale</div>
        </div>
        <div style={{ marginBottom: 14 }}><label style={labelStyle}>Email</label><input type="email" value={loginData.email} onChange={e => setLoginData({ ...loginData, email: e.target.value })} placeholder="la-tua@email.com" style={inputStyle} /></div>
        <div style={{ marginBottom: 10 }}><label style={labelStyle}>Password</label><input type="password" value={loginData.password} onChange={e => setLoginData({ ...loginData, password: e.target.value })} onKeyDown={e => e.key === "Enter" && handleLogin()} placeholder="••••••••" style={inputStyle} /></div>
        {loginError && <div style={{ color: "#ef4444", fontSize: 12, marginBottom: 12, padding: "8px 12px", background: "rgba(239,68,68,0.08)", borderRadius: 6, border: "1px solid rgba(239,68,68,0.2)" }}>{loginError}</div>}
        <button onClick={handleLogin} disabled={loginLoading} style={{ width: "100%", background: "linear-gradient(135deg,#b8860b,#daa520)", color: "#0a0905", border: "none", borderRadius: 10, padding: "14px", cursor: "pointer", fontSize: 15, fontWeight: 700, fontFamily: "inherit", opacity: loginLoading ? 0.7 : 1 }}>
          {loginLoading ? "Accesso in corso..." : "Accedi"}
        </button>
        {!resetSent ? (
          <div style={{ textAlign: "center", marginTop: 14 }}>
            <span onClick={handleResetPassword} style={{ fontSize: 12, color: "#8a7a6a", cursor: "pointer", textDecoration: "underline" }}>Password dimenticata?</span>
          </div>
        ) : (
          <div style={{ marginTop: 14, padding: "10px 14px", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 8, fontSize: 12, color: "#22c55e", textAlign: "center" }}>
            ✓ Email di reset inviata a <strong>{loginData.email}</strong>
          </div>
        )}
        <div style={{ textAlign: "center", marginTop: 14, fontSize: 13, color: "#5a5040" }}>Non hai un account? <span onClick={() => setScreen("register")} style={{ color: "#daa520", cursor: "pointer", textDecoration: "underline" }}>Iscriviti</span></div>
        <button onClick={() => setScreen("home")} style={{ display: "block", margin: "16px auto 0", background: "none", border: "none", color: "#4a3a2a", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>← Home</button>
      </div>
    </div>
  );
}

export function ScreenAlreadyMember({ supabase, setScreen, setMustChangePassword }) {
  const [state, setState] = useState({ email: "", error: "", loading: false, success: false });
  const BASE = { fontFamily: "'Palatino Linotype','Book Antiqua',Palatino,serif", background: "#0a0905", minHeight: "100vh", color: "#e8e0d0" };

  async function handleSubmit() {
    if (!state.email) { setState(p => ({...p, error: "Inserisci la tua email."})); return; }
    setState(p => ({...p, loading: true, error: ""}));

    const res = await fetch("/api/claim-account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: state.email.trim() }),
    });
    const data = await res.json();

    if (!data.success) {
      setState(p => ({...p, loading: false, error: data.error || "Errore imprevisto."}));
      return;
    }

    const { error: loginErr } = await supabase.auth.signInWithPassword({
      email: state.email.trim(),
      password: "Cinquecerchikarate",
    });

    if (loginErr) {
      setState(p => ({...p, loading: false, error: "Account creato ma login fallito. Contatta la segreteria."}));
      return;
    }

    setMustChangePassword(true);
    setState(p => ({...p, loading: false, success: true}));
  }

  return (
    <div style={{ ...BASE, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "linear-gradient(135deg,#131008,#0d0c07)", border: "1px solid #2a2010", borderRadius: 20, padding: "48px 40px", width: 420, maxWidth: "90vw", boxShadow: "0 20px 60px rgba(0,0,0,0.6)" }}>
        {!state.success ? (
          <>
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>🥋</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#daa520" }}>Sei già iscritto?</div>
              <div style={{ fontSize: 13, color: "#5a5040", marginTop: 8, lineHeight: 1.6 }}>Se la segreteria ti ha già registrato, inserisci la tua email per accedere al portale.</div>
            </div>
            <div style={{ marginBottom: 20 }}><label style={labelStyle}>La tua email *</label><input type="email" style={inputStyle} value={state.email} onChange={e => setState(p => ({...p, email: e.target.value}))} onKeyDown={e => e.key === "Enter" && handleSubmit()} placeholder="la-tua@email.com" /></div>
            <div style={{ marginBottom: 20, padding: "10px 14px", background: "rgba(218,165,32,0.06)", border: "1px solid rgba(218,165,32,0.2)", borderRadius: 8, fontSize: 12, color: "#8a7a6a", lineHeight: 1.6 }}>
              ℹ️ Accederai con la password temporanea <strong style={{color:"#daa520"}}>Cinquecerchikarate</strong>. Al primo accesso potrai cambiarla nelle Impostazioni.
            </div>
            {state.error && <div style={{ marginBottom: 16, padding: "10px 14px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, fontSize: 12, color: "#ef4444" }}>⚠️ {state.error}</div>}
            <button onClick={handleSubmit} disabled={state.loading} style={{ width: "100%", background: "linear-gradient(135deg,#b8860b,#daa520)", color: "#0a0905", border: "none", borderRadius: 10, padding: "14px", cursor: "pointer", fontSize: 15, fontWeight: 700, fontFamily: "inherit", opacity: state.loading ? 0.7 : 1 }}>
              {state.loading ? "Verifica in corso..." : "✓ Accedi al portale"}
            </button>
            <button onClick={() => setScreen("home")} style={{ display: "block", margin: "16px auto 0", background: "none", border: "none", color: "#4a3a2a", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>← Home</button>
          </>
        ) : (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🎌</div>
            <div style={{ fontSize: 18, color: "#daa520", fontWeight: 700 }}>Accesso creato!</div>
            <div style={{ fontSize: 13, color: "#8a7a6a", marginTop: 10 }}>Imposta la tua password personale per continuare.</div>
          </div>
        )}
      </div>
    </div>
  );
}

export function ScreenChangePassword({ supabase, setMustChangePassword }) {
  const [form, setForm] = useState({ newPassword: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!form.newPassword || form.newPassword.length < 8) { setError("La password deve avere almeno 8 caratteri."); return; }
    if (form.newPassword !== form.confirmPassword) { setError("Le password non coincidono."); return; }
    setSaving(true); setError("");
    const { error: err } = await supabase.auth.updateUser({ password: form.newPassword });
    if (err) { setError("Errore: " + err.message); setSaving(false); return; }
    setMustChangePassword(false);
    setSaving(false);
  }

  return (
    <div style={{ fontFamily: "'Palatino Linotype','Book Antiqua',Palatino,serif", background: "#0a0905", minHeight: "100vh", color: "#e8e0d0", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "linear-gradient(135deg,#131008,#0d0c07)", border: "1px solid #b8860b", borderRadius: 20, padding: "48px 40px", width: 420, maxWidth: "90vw", boxShadow: "0 20px 60px rgba(0,0,0,0.6)" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🔐</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#daa520" }}>Imposta la tua password</div>
          <div style={{ fontSize: 13, color: "#5a5040", marginTop: 8, lineHeight: 1.6 }}>Scegli una password personale prima di accedere.</div>
        </div>
        <div style={{ marginBottom: 14 }}><label style={labelStyle}>Nuova password *</label><input type="password" style={inputStyle} value={form.newPassword} onChange={e => setForm(p => ({...p, newPassword: e.target.value}))} placeholder="Minimo 8 caratteri" /></div>
        <div style={{ marginBottom: 20 }}><label style={labelStyle}>Conferma password *</label><input type="password" style={inputStyle} value={form.confirmPassword} onChange={e => setForm(p => ({...p, confirmPassword: e.target.value}))} placeholder="Ripeti la password" /></div>
        {error && <div style={{ marginBottom: 14, padding: "10px 14px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, fontSize: 12, color: "#ef4444" }}>⚠️ {error}</div>}
        <button disabled={saving} onClick={handleSave} style={{ width: "100%", background: "linear-gradient(135deg,#b8860b,#daa520)", color: "#0a0905", border: "none", borderRadius: 10, padding: "14px", cursor: "pointer", fontSize: 15, fontWeight: 700, fontFamily: "inherit", opacity: saving ? 0.7 : 1 }}>
          {saving ? "Salvataggio..." : "✓ Salva e Accedi"}
        </button>
      </div>
    </div>
  );
}

export function ScreenRegister({ supabase, setScreen }) {
  const [reg, setReg] = useState(emptyReg);
  const [regStep, setRegStep] = useState(0);
  const [regError, setRegError] = useState("");
  const [regSuccess, setRegSuccess] = useState(false);
  const setField = (key, val) => setReg(prev => ({ ...prev, [key]: val }));
  const BASE = { fontFamily: "'Palatino Linotype','Book Antiqua',Palatino,serif", background: "#0a0905", minHeight: "100vh", color: "#e8e0d0" };

  useEffect(() => {
    if (reg.birthDate) {
      const age = (new Date() - new Date(reg.birthDate)) / (1000 * 60 * 60 * 24 * 365.25);
      setField("isMinor", age < 18);
    }
  }, [reg.birthDate]);

  function validateStep() {
    if (regStep === 0 && (!reg.firstName || !reg.lastName || !reg.birthDate || !reg.birthPlace)) return "Compila tutti i campi obbligatori (*)";
    if (regStep === 1 && (!reg.address || !reg.city || !reg.email || !reg.mobile)) return "Compila tutti i campi obbligatori (*)";
    if (regStep === 2 && (!reg.course || !reg.location)) return "Seleziona corso e sede";
    if (regStep === 3 && reg.isMinor && (!reg.parentName || !reg.parentPhone || !reg.parentEmail)) return "Dati genitore obbligatori per minorenni";
    if (regStep === 4 && !reg.medicalExpiry) return "Inserisci la data di scadenza del certificato";
    if (regStep === 5) {
      if (!reg.password || !reg.confirm) return "Inserisci e conferma la password";
      if (reg.password !== reg.confirm) return "Le password non coincidono";
      if (reg.password.length < 6) return "La password deve avere almeno 6 caratteri";
      if (!reg.gdpr) return "Devi accettare il trattamento dei dati personali";
    }
    return null;
  }

  async function nextStep() {
    const err = validateStep();
    if (err) { setRegError(err); return; }
    setRegError("");
    if (regStep < TOTAL_STEPS - 1) { setRegStep(s => s + 1); return; }
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({ email: reg.email, password: reg.password });
      if (authError) throw authError;
      const { error: dbError } = await supabase.from("athletes").insert({
        user_id: authData.user?.id,
        first_name: reg.firstName, last_name: reg.lastName,
        birth_date: reg.birthDate, birth_place: reg.birthPlace,
        fiscal_code: reg.fiscalCode || `REG-${Date.now()}`,
        address: reg.address, city: reg.city, zip: reg.zip, province: reg.province,
        email: reg.email, mobile: reg.mobile, phone: reg.phone,
        belt: reg.belt, course: reg.course, location: reg.location,
        is_minor: reg.isMinor, parent_name: reg.parentName, parent_phone: reg.parentPhone,
        parent_email: reg.parentEmail, parent_cf: reg.parentFiscalCode,
        medical_expiry: reg.medicalExpiry,
        how_found: reg.howFound === "Altro" ? reg.howFoundOther : reg.howFound,
        notes: reg.notes, status: "pending", gdpr_consent: reg.gdpr, gdpr_marketing: reg.gdprMarketing,
      });
      if (dbError) throw dbError;
      setRegSuccess(true);
    } catch (e) { setRegError("Errore: " + e.message); }
  }

  if (regSuccess) return (
    <div style={{ ...BASE, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
      <div style={{ background: "linear-gradient(135deg,#131008,#0d0c07)", border: "1px solid #2a2010", borderRadius: 20, padding: "36px 32px", width: 520, maxWidth: "100%", textAlign: "center" }}>
        <div style={{ fontSize: 60, marginBottom: 14 }}>🎌</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: "#daa520", marginBottom: 10 }}>Iscrizione Inviata!</div>
        <div style={{ fontSize: 14, color: "#8a7a6a", lineHeight: 1.8, marginBottom: 18 }}>
          Ciao <strong style={{ color: "#e8e0d0" }}>{reg.firstName}</strong>!<br />
          La tua richiesta per <strong style={{ color: "#daa520" }}>{reg.course}</strong> (sede {reg.location}) è stata ricevuta.
        </div>
        <div style={{ background: "#0d0c07", border: "1px solid #2a2010", borderRadius: 12, padding: "16px 20px", marginBottom: 22, fontSize: 13, color: "#5a5040", lineHeight: 1.8, textAlign: "left" }}>
          <div>📧 Riceverai conferma a <strong style={{ color: "#8a7a6a" }}>{reg.email}</strong></div>
          <div style={{ marginTop: 6 }}>⏱️ Il Sensei approverà la tua iscrizione entro 24 ore</div>
          <div style={{ marginTop: 6 }}>🔐 Poi potrai accedere con email e password</div>
        </div>
        <button onClick={() => setScreen("login")} style={{ background: "linear-gradient(135deg,#b8860b,#daa520)", color: "#0a0905", border: "none", borderRadius: 10, padding: "12px 32px", cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "inherit" }}>Vai al Login</button>
      </div>
    </div>
  );

  return (
    <div style={{ ...BASE, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
      <div style={{ background: "linear-gradient(135deg,#131008,#0d0c07)", border: "1px solid #2a2010", borderRadius: 20, padding: "36px 32px", width: 520, maxWidth: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.6)" }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 34, marginBottom: 8 }}>⛩️</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#daa520" }}>Iscrizione al Dojo</div>
          <div style={{ fontSize: 12, color: "#5a5040", marginTop: 4 }}>{STEP_LABELS[regStep]} — Passo {regStep + 1} di {TOTAL_STEPS}</div>
        </div>
        <StepIndicator step={regStep} total={TOTAL_STEPS} />

        {regStep === 0 && (
          <div>
            <SectionTitle icon="👤" title="Dati Anagrafici" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div><label style={labelStyle}>Nome *</label><input style={inputStyle} value={reg.firstName} onChange={e => setField("firstName", e.target.value)} placeholder="Mario" /></div>
              <div><label style={labelStyle}>Cognome *</label><input style={inputStyle} value={reg.lastName} onChange={e => setField("lastName", e.target.value)} placeholder="Rossi" /></div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Data di nascita *</label>
              <input type="date" style={inputStyle} value={reg.birthDate} onChange={e => setField("birthDate", e.target.value)} />
              {reg.isMinor && <div style={{ marginTop: 6, fontSize: 11, color: "#daa520", padding: "4px 8px", background: "rgba(218,165,32,0.1)", borderRadius: 4 }}>⚠️ Atleta minorenne — saranno richiesti i dati del genitore/tutore</div>}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 10, marginBottom: 12 }}>
              <div><label style={labelStyle}>Comune di nascita *</label><input style={inputStyle} value={reg.birthPlace} onChange={e => setField("birthPlace", e.target.value)} placeholder="Ferrara" /></div>
              <div><label style={labelStyle}>Provincia</label><input style={inputStyle} value={reg.birthProvince} onChange={e => setField("birthProvince", e.target.value)} placeholder="FE" maxLength={2} /></div>
            </div>
            <div style={{ marginBottom: 12 }}><label style={labelStyle}>Stato di nascita</label><input style={inputStyle} value={reg.birthCountry} onChange={e => setField("birthCountry", e.target.value)} placeholder="Italia" /></div>
            <div><label style={labelStyle}>Codice Fiscale</label><input style={{ ...inputStyle, textTransform: "uppercase" }} value={reg.fiscalCode} onChange={e => setField("fiscalCode", e.target.value.toUpperCase())} placeholder="RSSMRI80A01D548X (opzionale per stranieri)" maxLength={16} /></div>
          </div>
        )}

        {regStep === 1 && (
          <div>
            <SectionTitle icon="🏠" title="Residenza" />
            <div style={{ marginBottom: 12 }}><label style={labelStyle}>Via / Piazza *</label><input style={inputStyle} value={reg.address} onChange={e => setField("address", e.target.value)} placeholder="Via Roma 12" /></div>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
              <div><label style={labelStyle}>Città *</label><input style={inputStyle} value={reg.city} onChange={e => setField("city", e.target.value)} placeholder="Argenta" /></div>
              <div><label style={labelStyle}>CAP</label><input style={inputStyle} value={reg.zip} onChange={e => setField("zip", e.target.value)} placeholder="44011" maxLength={5} /></div>
              <div><label style={labelStyle}>Prov.</label><input style={inputStyle} value={reg.province} onChange={e => setField("province", e.target.value)} placeholder="FE" maxLength={2} /></div>
            </div>
            <SectionTitle icon="📞" title="Contatti" />
            <div style={{ marginBottom: 12 }}><label style={labelStyle}>Email *</label><input type="email" style={inputStyle} value={reg.email} onChange={e => setField("email", e.target.value)} placeholder="mario@email.com" /></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div><label style={labelStyle}>Cellulare *</label><input type="tel" style={inputStyle} value={reg.mobile} onChange={e => setField("mobile", e.target.value)} placeholder="333 1234567" /></div>
              <div><label style={labelStyle}>Tel. fisso</label><input type="tel" style={inputStyle} value={reg.phone} onChange={e => setField("phone", e.target.value)} placeholder="0532 123456" /></div>
            </div>
          </div>
        )}

        {regStep === 2 && (
          <div>
            <SectionTitle icon="🥋" title="Corso & Sede" />
            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>Corso *</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                {COURSES.map(c => (
                  <button key={c} onClick={() => setField("course", c)} style={{ background: reg.course === c ? "linear-gradient(135deg,#b8860b,#daa520)" : "#0d0c07", color: reg.course === c ? "#0a0905" : "#8a7a6a", border: `1px solid ${reg.course === c ? "#daa520" : "#2a2010"}`, borderRadius: 8, padding: "12px 6px", cursor: "pointer", fontSize: 11, fontFamily: "inherit", fontWeight: reg.course === c ? 700 : 400 }}>{c}</button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>Sede *</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {LOCATIONS.map(l => (
                  <button key={l} onClick={() => setField("location", l)} style={{ background: reg.location === l ? "linear-gradient(135deg,#b8860b,#daa520)" : "#0d0c07", color: reg.location === l ? "#0a0905" : "#8a7a6a", border: `1px solid ${reg.location === l ? "#daa520" : "#2a2010"}`, borderRadius: 8, padding: "14px", cursor: "pointer", fontSize: 13, fontFamily: "inherit", fontWeight: reg.location === l ? 700 : 400 }}>{l}</button>
                ))}
              </div>
            </div>
            <SectionTitle icon="📣" title="Come ci hai conosciuto?" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
              {HOW_FOUND.map(h => (
                <button key={h} onClick={() => setField("howFound", h)} style={{ background: reg.howFound === h ? "rgba(184,134,11,0.15)" : "#0d0c07", color: reg.howFound === h ? "#daa520" : "#6a6050", border: `1px solid ${reg.howFound === h ? "#b8860b" : "#1a1408"}`, borderRadius: 8, padding: "8px 10px", cursor: "pointer", fontSize: 11, fontFamily: "inherit", textAlign: "left" }}>{h}</button>
              ))}
            </div>
            {reg.howFound === "Altro" && <div style={{ marginTop: 10 }}><input style={inputStyle} value={reg.howFoundOther} onChange={e => setField("howFoundOther", e.target.value)} placeholder="Specifica..." /></div>}
            <div style={{ marginTop: 14 }}><label style={labelStyle}>Note</label><textarea style={{ ...inputStyle, height: 65, resize: "vertical" }} value={reg.notes} onChange={e => setField("notes", e.target.value)} placeholder="Es: problema al ginocchio destro..." /></div>
          </div>
        )}

        {regStep === 3 && (
          <div>
            {reg.isMinor ? (
              <>
                <SectionTitle icon="👨‍👩‍👦" title="Dati Genitore / Tutore Legale" />
                <div style={{ marginBottom: 10, padding: "10px 14px", background: "rgba(218,165,32,0.08)", border: "1px solid rgba(218,165,32,0.2)", borderRadius: 8, fontSize: 12, color: "#daa520" }}>L'atleta è minorenne. I dati del genitore/tutore sono obbligatori.</div>
                <div style={{ marginBottom: 12 }}><label style={labelStyle}>Nome e Cognome *</label><input style={inputStyle} value={reg.parentName} onChange={e => setField("parentName", e.target.value)} placeholder="Paolo Rossi" /></div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div><label style={labelStyle}>Cellulare *</label><input type="tel" style={inputStyle} value={reg.parentPhone} onChange={e => setField("parentPhone", e.target.value)} placeholder="333 9876543" /></div>
                  <div><label style={labelStyle}>Email *</label><input type="email" style={inputStyle} value={reg.parentEmail} onChange={e => setField("parentEmail", e.target.value)} placeholder="genitore@email.com" /></div>
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "48px 20px" }}>
                <div style={{ fontSize: 48, marginBottom: 14 }}>✅</div>
                <div style={{ fontSize: 16, color: "#22c55e", fontWeight: 600 }}>Atleta maggiorenne</div>
                <div style={{ fontSize: 13, color: "#5a5040", marginTop: 8 }}>Nessun dato aggiuntivo richiesto. Clicca Avanti.</div>
              </div>
            )}
          </div>
        )}

        {regStep === 4 && (
          <div>
            <SectionTitle icon="🏥" title="Certificato Medico" />
            <div style={{ marginBottom: 16, padding: "12px 16px", background: "rgba(218,165,32,0.06)", border: "1px solid rgba(218,165,32,0.2)", borderRadius: 8, fontSize: 12, color: "#8a7a6a", lineHeight: 1.7 }}>
              Per praticare attività sportiva è obbligatorio avere un certificato medico sportivo in corso di validità.
            </div>
            <div><label style={labelStyle}>Scadenza certificato medico *</label><input type="date" style={inputStyle} value={reg.medicalExpiry} onChange={e => setField("medicalExpiry", e.target.value)} /></div>
          </div>
        )}

        {regStep === 5 && (
          <div>
            <SectionTitle icon="🔐" title="Crea il tuo Account" />
            <div style={{ marginBottom: 12 }}><label style={labelStyle}>Email *</label><input type="email" style={inputStyle} value={reg.email} readOnly style={{ ...inputStyle, opacity: 0.6 }} /></div>
            <div style={{ marginBottom: 12 }}><label style={labelStyle}>Password *</label><input type="password" style={inputStyle} value={reg.password} onChange={e => setField("password", e.target.value)} placeholder="Minimo 6 caratteri" /></div>
            <div style={{ marginBottom: 20 }}><label style={labelStyle}>Conferma Password *</label><input type="password" style={inputStyle} value={reg.confirm} onChange={e => setField("confirm", e.target.value)} placeholder="Ripeti la password" /></div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <label style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer" }}>
                <input type="checkbox" checked={reg.gdpr} onChange={e => setField("gdpr", e.target.checked)} style={{ width: 18, height: 18, marginTop: 2, accentColor: "#daa520", flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "#8a7a6a", lineHeight: 1.6 }}><strong style={{ color: "#e8e0d0" }}>Consenso obbligatorio *</strong><br />Accetto il trattamento dei miei dati personali ai sensi del GDPR.</span>
              </label>
              <label style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer" }}>
                <input type="checkbox" checked={reg.gdprMarketing} onChange={e => setField("gdprMarketing", e.target.checked)} style={{ width: 18, height: 18, marginTop: 2, accentColor: "#daa520", flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "#8a7a6a", lineHeight: 1.6 }}><strong style={{ color: "#e8e0d0" }}>Consenso facoltativo</strong><br />Accetto di ricevere comunicazioni promozionali.</span>
              </label>
            </div>
            <div style={{ marginTop: 18, padding: "12px 16px", background: "#0d0c07", border: "1px solid #1a1408", borderRadius: 8, fontSize: 12, color: "#5a5040", lineHeight: 1.8 }}>
              Riepilogo: <strong style={{ color: "#8a7a6a" }}>{reg.firstName} {reg.lastName}</strong> · {reg.course} · Sede {reg.location}
            </div>
          </div>
        )}

        {regError && <div style={{ marginTop: 14, color: "#ef4444", fontSize: 12, padding: "10px 14px", background: "rgba(239,68,68,0.08)", borderRadius: 8, border: "1px solid rgba(239,68,68,0.2)" }}>⚠️ {regError}</div>}
        <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
          {regStep > 0 && <button onClick={() => { setRegStep(s => s - 1); setRegError(""); }} style={{ background: "#1a1408", color: "#8a7a6a", border: "1px solid #2a2010", borderRadius: 10, padding: "12px 18px", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>← Indietro</button>}
          <button onClick={nextStep} style={{ flex: 1, background: "linear-gradient(135deg,#b8860b,#daa520)", color: "#0a0905", border: "none", borderRadius: 10, padding: "14px", cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "inherit" }}>
            {regStep === TOTAL_STEPS - 1 ? "✓ Invia Iscrizione" : "Avanti →"}
          </button>
        </div>
        <div style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: "#3a3020" }}>Hai già un account? <span onClick={() => setScreen("login")} style={{ color: "#daa520", cursor: "pointer", textDecoration: "underline" }}>Accedi</span></div>
      </div>
    </div>
  );
}
