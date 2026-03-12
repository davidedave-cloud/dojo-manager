import { useState, useEffect } from "react";

const DEMO_ATHLETES = [
  {
    id: 1, firstName: "Marco", lastName: "Rossi", email: "marco@email.com", password: "demo123",
    phone: "333-1234567", mobile: "333-1234567", belt: "Verde", joinDate: "2022-03-15", birthDate: "2005-07-12",
    birthPlace: "Ferrara", fiscalCode: "RSSMRC05L12D548X", address: "Via Roma 12", city: "Argenta", zip: "44011",
    course: "Karate Adulti", location: "Argenta", discipline: "Entrambe",
    medicalExpiry: "2025-12-01", medicalUploaded: true,
    parentName: "", parentPhone: "", parentEmail: "",
    howFound: "Passaparola", gdpr: true,
    quota: 60, paid: true, lastPayment: "2025-03-01",
    lessons: [
      { date: "2025-03-10", type: "Kata", present: true },
      { date: "2025-03-12", type: "Kumite", present: true },
      { date: "2025-03-07", type: "Kata", present: false },
    ],
    receipts: [
      { id: "RCV-001", date: "2025-03-01", amount: 60, period: "Marzo 2025" },
      { id: "RCV-002", date: "2025-02-01", amount: 60, period: "Febbraio 2025" },
    ],
    exams: [{ date: "2025-04-15", type: "Esame Cintura", status: "Iscritto" }],
    news: [
      { id: 1, date: "2025-03-08", title: "Chiusura pasquale", text: "Il dojo sarà chiuso dal 18 al 22 aprile.", important: true },
      { id: 2, date: "2025-03-01", title: "Nuovi orari primaverili", text: "Da aprile le lezioni del venerdì iniziano alle 17:30.", important: false },
    ],
  },
];

const BELT_COLORS = {
  "Bianca": "#f0ede6", "Gialla": "#FFD700", "Arancione": "#FF8C00",
  "Verde": "#228B22", "Blu": "#1E3A8A", "Marrone": "#8B4513", "Nera (1° Dan)": "#1a1a1a",
};
const BELT_ORDER = Object.keys(BELT_COLORS);
const COURSES = ["Karate Adulti", "Karate Bambini", "Psicomotricità"];
const LOCATIONS = ["Argenta", "S.M. Codifiume"];
const DISCIPLINES = ["Kata", "Kumite", "Entrambe"];
const HOW_FOUND = ["Passaparola (amici/famiglia)", "Facebook / Instagram", "Google / Internet", "Volantino / Locandina", "Ho passato davanti alla palestra", "Scuola / Insegnante", "Altro"];

const emptyReg = {
  firstName: "", lastName: "", birthDate: "", birthPlace: "", fiscalCode: "",
  address: "", city: "", zip: "", province: "",
  email: "", phone: "", mobile: "",
  course: "", location: "", belt: "Bianca", discipline: "",
  isMinor: false, parentName: "", parentPhone: "", parentEmail: "", parentFiscalCode: "",
  medicalExpiry: "", medicalFile: null,
  howFound: "", howFoundOther: "", notes: "",
  password: "", confirm: "",
  gdpr: false, gdprMarketing: false,
};

const inputStyle = { width: "100%", background: "#0a0905", border: "1px solid #2a2010", borderRadius: 8, padding: "10px 14px", color: "#e8e0d0", fontFamily: "inherit", fontSize: 13, boxSizing: "border-box", outline: "none" };
const labelStyle = { display: "block", fontSize: 11, color: "#8a7a6a", marginBottom: 5, letterSpacing: "0.08em", textTransform: "uppercase" };

const SectionTitle = ({ icon, title }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "24px 0 14px", paddingBottom: 8, borderBottom: "1px solid #2a2010" }}>
    <span style={{ fontSize: 16 }}>{icon}</span>
    <span style={{ fontSize: 14, fontWeight: 700, color: "#daa520" }}>{title}</span>
  </div>
);

const BeltBadge = ({ belt, large }) => {
  const isWhite = belt === "Bianca";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", background: BELT_COLORS[belt] || "#333", color: (isWhite || belt === "Gialla" || belt === "Arancione") ? "#222" : "#fff", border: isWhite ? "1px solid #bbb" : "none", borderRadius: 99, padding: large ? "6px 18px" : "3px 12px", fontSize: large ? 14 : 11, fontWeight: 700 }}>{belt}</span>
  );
};

const BeltProgress = ({ belt }) => {
  const idx = BELT_ORDER.indexOf(belt);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 12, color: "#8a7a6a" }}>
        <span>Progressione cintura</span><span>{idx + 1} / {BELT_ORDER.length}</span>
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        {BELT_ORDER.map((b, i) => (
          <div key={b} title={b} style={{ flex: 1, height: 8, borderRadius: 4, background: i <= idx ? (BELT_COLORS[b] === "#f0ede6" ? "#ccc" : BELT_COLORS[b]) : "#2a261e", border: i === idx ? "2px solid #daa520" : "none" }} />
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 10, color: "#5a5040" }}>
        <span>Bianca</span><span>Nera</span>
      </div>
    </div>
  );
};

const StepIndicator = ({ step, total }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 28 }}>
    {Array.from({ length: total }).map((_, i) => (
      <div key={i} style={{ display: "flex", alignItems: "center" }}>
        <div style={{ width: 30, height: 30, borderRadius: "50%", background: i < step ? "linear-gradient(135deg,#b8860b,#daa520)" : i === step ? "#1a1408" : "#0d0c07", border: i === step ? "2px solid #daa520" : i < step ? "none" : "1px solid #2a2010", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: i < step ? "#0a0905" : i === step ? "#daa520" : "#3a3020" }}>
          {i < step ? "✓" : i + 1}
        </div>
        {i < total - 1 && <div style={{ width: 28, height: 1, background: i < step ? "#b8860b" : "#1a1408" }} />}
      </div>
    ))}
  </div>
);

const STEP_LABELS = ["Anagrafica", "Residenza & Contatti", "Corso", "Genitore", "Certificato", "Account"];
const TOTAL_STEPS = 6;

export default function AthletePortal() {
  const [screen, setScreen] = useState("home");
  const [athlete, setAthlete] = useState(null);
  const [activeTab, setActiveTab] = useState("profilo");
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [reg, setReg] = useState(emptyReg);
  const [regStep, setRegStep] = useState(0);
  const [regError, setRegError] = useState("");
  const [regSuccess, setRegSuccess] = useState(false);
  const [showReceipt, setShowReceipt] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setTimeout(() => setMounted(true), 50); }, []);

  const setField = (key, val) => setReg(prev => ({ ...prev, [key]: val }));

  useEffect(() => {
    if (reg.birthDate) {
      const age = (new Date() - new Date(reg.birthDate)) / (1000 * 60 * 60 * 24 * 365.25);
      setField("isMinor", age < 18);
    }
  }, [reg.birthDate]);

  function validateStep() {
    if (regStep === 0 && (!reg.firstName || !reg.lastName || !reg.birthDate || !reg.birthPlace || !reg.fiscalCode)) return "Compila tutti i campi obbligatori (*)";
    if (regStep === 1 && (!reg.address || !reg.city || !reg.email || !reg.mobile)) return "Compila tutti i campi obbligatori (*)";
    if (regStep === 2 && (!reg.course || !reg.location || !reg.discipline)) return "Seleziona corso, sede e disciplina";
    if (regStep === 3 && reg.isMinor && (!reg.parentName || !reg.parentPhone || !reg.parentEmail)) return "I dati del genitore/tutore sono obbligatori per i minorenni";
    if (regStep === 4 && !reg.medicalExpiry) return "Inserisci la data di scadenza del certificato medico";
    if (regStep === 5) {
      if (!reg.password || !reg.confirm) return "Inserisci e conferma la password";
      if (reg.password !== reg.confirm) return "Le password non coincidono";
      if (reg.password.length < 6) return "La password deve avere almeno 6 caratteri";
      if (!reg.gdpr) return "Devi accettare il trattamento dei dati personali per procedere";
    }
    return null;
  }

  function nextStep() {
    const err = validateStep();
    if (err) { setRegError(err); return; }
    setRegError("");
    if (regStep === TOTAL_STEPS - 1) { setRegSuccess(true); return; }
    setRegStep(s => s + 1);
  }

  function handleLogin() {
    const found = DEMO_ATHLETES.find(a => a.email === loginData.email && a.password === loginData.password);
    if (found) { setAthlete(found); setScreen("dashboard"); setLoginError(""); }
    else setLoginError("Email o password non corretti.");
  }

  function handleLogout() { setAthlete(null); setScreen("home"); setActiveTab("profilo"); }

  const attendanceRate = athlete ? Math.round((athlete.lessons.filter(l => l.present).length / athlete.lessons.length) * 100) : 0;

  const BASE = { fontFamily: "'Palatino Linotype','Book Antiqua',Palatino,serif", background: "#0a0905", minHeight: "100vh", color: "#e8e0d0" };

  // HOME
  if (screen === "home") return (
    <div style={{ ...BASE, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
      {[600,400,200].map(s => <div key={s} style={{ position:"absolute", width:s, height:s, borderRadius:"50%", border:"1px solid #1a1408", top:"50%", left:"50%", transform:"translate(-50%,-50%)", background: s===200?"radial-gradient(circle,rgba(184,134,11,0.07) 0%,transparent 70%)":"transparent" }} />)}
      <div style={{ textAlign:"center", zIndex:1, opacity:mounted?1:0, transform:mounted?"translateY(0)":"translateY(20px)", transition:"all 0.8s ease" }}>
        <div style={{ fontSize:72, marginBottom:8, filter:"drop-shadow(0 0 30px rgba(184,134,11,0.4))" }}>🥋</div>
        <div style={{ fontSize:36, fontWeight:700, color:"#daa520", letterSpacing:"0.12em", textTransform:"uppercase" }}>Dojo Karate</div>
        <div style={{ fontSize:13, color:"#5a5040", letterSpacing:"0.3em", textTransform:"uppercase", marginBottom:48 }}>Portale Atleti</div>
        <div style={{ fontSize:15, color:"#8a7a6a", maxWidth:340, margin:"0 auto 48px", lineHeight:1.7 }}>Accedi alla tua area personale per seguire progressi, presenze e pagamenti.</div>
        <div style={{ display:"flex", gap:16, justifyContent:"center", flexWrap:"wrap" }}>
          <button onClick={() => setScreen("login")} style={{ background:"linear-gradient(135deg,#b8860b,#daa520)", color:"#0a0905", border:"none", borderRadius:10, padding:"14px 40px", cursor:"pointer", fontSize:15, fontWeight:700, fontFamily:"inherit", boxShadow:"0 4px 24px rgba(184,134,11,0.35)" }}>Accedi</button>
          <button onClick={() => setScreen("register")} style={{ background:"transparent", color:"#daa520", border:"1px solid #b8860b", borderRadius:10, padding:"14px 40px", cursor:"pointer", fontSize:15, fontFamily:"inherit" }}>Iscriviti</button>
        </div>
        <div style={{ marginTop:60, fontSize:11, color:"#3a3020", letterSpacing:"0.15em" }}>精神統一 · SEISHIN TOITSU</div>
      </div>
    </div>
  );

  // LOGIN
  if (screen === "login") return (
    <div style={{ ...BASE, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ background:"linear-gradient(135deg,#131008,#0d0c07)", border:"1px solid #2a2010", borderRadius:20, padding:"48px 40px", width:400, maxWidth:"90vw", boxShadow:"0 20px 60px rgba(0,0,0,0.6)" }}>
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ fontSize:40, marginBottom:10 }}>🥋</div>
          <div style={{ fontSize:22, fontWeight:700, color:"#daa520" }}>Bentornato</div>
          <div style={{ fontSize:13, color:"#5a5040", marginTop:4 }}>Accedi alla tua area personale</div>
        </div>
        <div style={{ marginBottom:14 }}><label style={labelStyle}>Email</label><input type="email" value={loginData.email} onChange={e => setLoginData({...loginData, email:e.target.value})} placeholder="la-tua@email.com" style={inputStyle} /></div>
        <div style={{ marginBottom:10 }}><label style={labelStyle}>Password</label><input type="password" value={loginData.password} onChange={e => setLoginData({...loginData, password:e.target.value})} onKeyDown={e => e.key==="Enter"&&handleLogin()} placeholder="••••••••" style={inputStyle} /></div>
        {loginError && <div style={{ color:"#ef4444", fontSize:12, marginBottom:12, padding:"8px 12px", background:"rgba(239,68,68,0.08)", borderRadius:6, border:"1px solid rgba(239,68,68,0.2)" }}>{loginError}</div>}
        <div style={{ fontSize:11, color:"#5a5040", marginBottom:18, textAlign:"right", cursor:"pointer" }}>Password dimenticata?</div>
        <button onClick={handleLogin} style={{ width:"100%", background:"linear-gradient(135deg,#b8860b,#daa520)", color:"#0a0905", border:"none", borderRadius:10, padding:"14px", cursor:"pointer", fontSize:15, fontWeight:700, fontFamily:"inherit" }}>Accedi</button>
        <div style={{ textAlign:"center", marginTop:20, fontSize:13, color:"#5a5040" }}>Non hai un account? <span onClick={() => setScreen("register")} style={{ color:"#daa520", cursor:"pointer", textDecoration:"underline" }}>Iscriviti</span></div>
        <button onClick={() => setScreen("home")} style={{ display:"block", margin:"16px auto 0", background:"none", border:"none", color:"#4a3a2a", fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>← Home</button>
        <div style={{ marginTop:20, padding:12, background:"#0d0c07", border:"1px dashed #2a2010", borderRadius:8, fontSize:11, color:"#5a5040", textAlign:"center" }}>Demo: <span style={{color:"#8a7a6a"}}>marco@email.com</span> / <span style={{color:"#8a7a6a"}}>demo123</span></div>
      </div>
    </div>
  );

  // REGISTER
  if (screen === "register") return (
    <div style={{ ...BASE, display:"flex", alignItems:"center", justifyContent:"center", padding:"40px 20px" }}>
      <div style={{ background:"linear-gradient(135deg,#131008,#0d0c07)", border:"1px solid #2a2010", borderRadius:20, padding:"36px 32px", width:520, maxWidth:"100%", boxShadow:"0 20px 60px rgba(0,0,0,0.6)" }}>
        {!regSuccess ? (
          <>
            <div style={{ textAlign:"center", marginBottom:20 }}>
              <div style={{ fontSize:34, marginBottom:8 }}>⛩️</div>
              <div style={{ fontSize:20, fontWeight:700, color:"#daa520" }}>Iscrizione al Dojo</div>
              <div style={{ fontSize:12, color:"#5a5040", marginTop:4 }}>{STEP_LABELS[regStep]} — Passo {regStep+1} di {TOTAL_STEPS}</div>
            </div>
            <StepIndicator step={regStep} total={TOTAL_STEPS} />

            {regStep === 0 && (
              <div>
                <SectionTitle icon="👤" title="Dati Anagrafici" />
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                  <div><label style={labelStyle}>Nome *</label><input style={inputStyle} value={reg.firstName} onChange={e=>setField("firstName",e.target.value)} placeholder="Mario" /></div>
                  <div><label style={labelStyle}>Cognome *</label><input style={inputStyle} value={reg.lastName} onChange={e=>setField("lastName",e.target.value)} placeholder="Rossi" /></div>
                </div>
                <div style={{ marginTop:12 }}>
                  <label style={labelStyle}>Data di nascita *</label>
                  <input type="date" style={inputStyle} value={reg.birthDate} onChange={e=>setField("birthDate",e.target.value)} />
                  {reg.isMinor && <div style={{ marginTop:6, fontSize:11, color:"#daa520", padding:"4px 8px", background:"rgba(218,165,32,0.1)", borderRadius:4 }}>⚠️ Atleta minorenne — saranno richiesti i dati del genitore/tutore</div>}
                </div>
                <div style={{ marginTop:12 }}><label style={labelStyle}>Luogo di nascita *</label><input style={inputStyle} value={reg.birthPlace} onChange={e=>setField("birthPlace",e.target.value)} placeholder="Ferrara" /></div>
                <div style={{ marginTop:12 }}><label style={labelStyle}>Codice Fiscale *</label><input style={{...inputStyle,textTransform:"uppercase"}} value={reg.fiscalCode} onChange={e=>setField("fiscalCode",e.target.value.toUpperCase())} placeholder="RSSMRI80A01D548X" maxLength={16} /></div>
              </div>
            )}

            {regStep === 1 && (
              <div>
                <SectionTitle icon="🏠" title="Indirizzo di Residenza" />
                <div style={{ marginBottom:12 }}><label style={labelStyle}>Via / Piazza *</label><input style={inputStyle} value={reg.address} onChange={e=>setField("address",e.target.value)} placeholder="Via Roma 12" /></div>
                <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr", gap:10 }}>
                  <div><label style={labelStyle}>Città *</label><input style={inputStyle} value={reg.city} onChange={e=>setField("city",e.target.value)} placeholder="Argenta" /></div>
                  <div><label style={labelStyle}>CAP</label><input style={inputStyle} value={reg.zip} onChange={e=>setField("zip",e.target.value)} placeholder="44011" maxLength={5} /></div>
                  <div><label style={labelStyle}>Prov.</label><input style={inputStyle} value={reg.province} onChange={e=>setField("province",e.target.value)} placeholder="FE" maxLength={2} /></div>
                </div>
                <SectionTitle icon="📞" title="Contatti" />
                <div style={{ marginBottom:12 }}><label style={labelStyle}>Email *</label><input type="email" style={inputStyle} value={reg.email} onChange={e=>setField("email",e.target.value)} placeholder="mario@email.com" /></div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  <div><label style={labelStyle}>Cellulare *</label><input type="tel" style={inputStyle} value={reg.mobile} onChange={e=>setField("mobile",e.target.value)} placeholder="333 1234567" /></div>
                  <div><label style={labelStyle}>Tel. fisso</label><input type="tel" style={inputStyle} value={reg.phone} onChange={e=>setField("phone",e.target.value)} placeholder="0532 123456" /></div>
                </div>
              </div>
            )}

            {regStep === 2 && (
              <div>
                <SectionTitle icon="🥋" title="Corso & Disciplina" />
                <div style={{ marginBottom:14 }}>
                  <label style={labelStyle}>Corso *</label>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
                    {COURSES.map(c => <button key={c} onClick={()=>setField("course",c)} style={{ background:reg.course===c?"linear-gradient(135deg,#b8860b,#daa520)":"#0d0c07", color:reg.course===c?"#0a0905":"#8a7a6a", border:`1px solid ${reg.course===c?"#daa520":"#2a2010"}`, borderRadius:8, padding:"10px 6px", cursor:"pointer", fontSize:11, fontFamily:"inherit", fontWeight:reg.course===c?700:400 }}>{c}</button>)}
                  </div>
                </div>
                <div style={{ marginBottom:14 }}>
                  <label style={labelStyle}>Sede *</label>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                    {LOCATIONS.map(l => <button key={l} onClick={()=>setField("location",l)} style={{ background:reg.location===l?"linear-gradient(135deg,#b8860b,#daa520)":"#0d0c07", color:reg.location===l?"#0a0905":"#8a7a6a", border:`1px solid ${reg.location===l?"#daa520":"#2a2010"}`, borderRadius:8, padding:"12px", cursor:"pointer", fontSize:13, fontFamily:"inherit", fontWeight:reg.location===l?700:400 }}>{l}</button>)}
                  </div>
                </div>
                <div style={{ marginBottom:14 }}>
                  <label style={labelStyle}>Disciplina *</label>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
                    {DISCIPLINES.map(d => <button key={d} onClick={()=>setField("discipline",d)} style={{ background:reg.discipline===d?"linear-gradient(135deg,#b8860b,#daa520)":"#0d0c07", color:reg.discipline===d?"#0a0905":"#8a7a6a", border:`1px solid ${reg.discipline===d?"#daa520":"#2a2010"}`, borderRadius:8, padding:"10px 6px", cursor:"pointer", fontSize:12, fontFamily:"inherit", fontWeight:reg.discipline===d?700:400 }}>{d}</button>)}
                  </div>
                </div>
                <div style={{ marginBottom:14 }}><label style={labelStyle}>Cintura attuale</label><select style={inputStyle} value={reg.belt} onChange={e=>setField("belt",e.target.value)}>{BELT_ORDER.map(b=><option key={b}>{b}</option>)}</select></div>
                <SectionTitle icon="📣" title="Come ci hai conosciuto?" />
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:7 }}>
                  {HOW_FOUND.map(h => <button key={h} onClick={()=>setField("howFound",h)} style={{ background:reg.howFound===h?"rgba(184,134,11,0.15)":"#0d0c07", color:reg.howFound===h?"#daa520":"#6a6050", border:`1px solid ${reg.howFound===h?"#b8860b":"#1a1408"}`, borderRadius:8, padding:"8px 10px", cursor:"pointer", fontSize:11, fontFamily:"inherit", textAlign:"left" }}>{h}</button>)}
                </div>
                {reg.howFound==="Altro" && <div style={{marginTop:10}}><input style={inputStyle} value={reg.howFoundOther} onChange={e=>setField("howFoundOther",e.target.value)} placeholder="Specifica..." /></div>}
                <div style={{marginTop:14}}><label style={labelStyle}>Note (infortuni, allergie, esigenze particolari)</label><textarea style={{...inputStyle,height:65,resize:"vertical"}} value={reg.notes} onChange={e=>setField("notes",e.target.value)} placeholder="Es: problema al ginocchio destro..." /></div>
              </div>
            )}

            {regStep === 3 && (
              <div>
                {reg.isMinor ? (
                  <>
                    <SectionTitle icon="👨‍👩‍👦" title="Dati Genitore / Tutore Legale" />
                    <div style={{marginBottom:10,padding:"10px 14px",background:"rgba(218,165,32,0.08)",border:"1px solid rgba(218,165,32,0.2)",borderRadius:8,fontSize:12,color:"#daa520"}}>L'atleta è minorenne. I dati del genitore/tutore sono obbligatori.</div>
                    <div style={{marginBottom:12}}><label style={labelStyle}>Nome e Cognome *</label><input style={inputStyle} value={reg.parentName} onChange={e=>setField("parentName",e.target.value)} placeholder="Paolo Rossi" /></div>
                    <div style={{marginBottom:12}}><label style={labelStyle}>Codice Fiscale</label><input style={{...inputStyle,textTransform:"uppercase"}} value={reg.parentFiscalCode} onChange={e=>setField("parentFiscalCode",e.target.value.toUpperCase())} placeholder="RSSLGI70A01D548X" maxLength={16} /></div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                      <div><label style={labelStyle}>Cellulare *</label><input type="tel" style={inputStyle} value={reg.parentPhone} onChange={e=>setField("parentPhone",e.target.value)} placeholder="333 9876543" /></div>
                      <div><label style={labelStyle}>Email *</label><input type="email" style={inputStyle} value={reg.parentEmail} onChange={e=>setField("parentEmail",e.target.value)} placeholder="genitore@email.com" /></div>
                    </div>
                  </>
                ) : (
                  <div style={{textAlign:"center",padding:"48px 20px"}}>
                    <div style={{fontSize:48,marginBottom:14}}>✅</div>
                    <div style={{fontSize:16,color:"#22c55e",fontWeight:600}}>Atleta maggiorenne</div>
                    <div style={{fontSize:13,color:"#5a5040",marginTop:8}}>Non sono richiesti dati del genitore. Puoi procedere.</div>
                  </div>
                )}
              </div>
            )}

            {regStep === 4 && (
              <div>
                <SectionTitle icon="🏥" title="Certificato Medico Agonistico" />
                <div style={{marginBottom:14,padding:"12px 16px",background:"rgba(74,158,255,0.06)",border:"1px solid rgba(74,158,255,0.2)",borderRadius:8,fontSize:12,color:"#7ab8f5",lineHeight:1.6}}>Il certificato medico è obbligatorio per legge per praticare attività sportiva.</div>
                <div style={{marginBottom:16}}>
                  <label style={labelStyle}>Data di scadenza *</label>
                  <input type="date" style={inputStyle} value={reg.medicalExpiry} onChange={e=>setField("medicalExpiry",e.target.value)} />
                  {reg.medicalExpiry && new Date(reg.medicalExpiry)<new Date() && <div style={{marginTop:6,fontSize:11,color:"#ef4444",padding:"4px 8px",background:"rgba(239,68,68,0.08)",borderRadius:4}}>⚠️ Certificato scaduto</div>}
                  {reg.medicalExpiry && new Date(reg.medicalExpiry)>new Date() && <div style={{marginTop:6,fontSize:11,color:"#22c55e",padding:"4px 8px",background:"rgba(34,197,94,0.08)",borderRadius:4}}>✓ Certificato valido</div>}
                </div>
                <div>
                  <label style={labelStyle}>Carica il certificato (foto o PDF)</label>
                  <div style={{border:"2px dashed #2a2010",borderRadius:10,padding:"24px",textAlign:"center",cursor:"pointer",background:reg.medicalFile?"rgba(34,197,94,0.05)":"#0a0905"}} onClick={()=>document.getElementById("medFile").click()}>
                    {reg.medicalFile ? (
                      <div><div style={{fontSize:24,marginBottom:6}}>✅</div><div style={{fontSize:12,color:"#22c55e"}}>{reg.medicalFile.name}</div><div style={{fontSize:11,color:"#5a5040",marginTop:4}}>Clicca per cambiare</div></div>
                    ) : (
                      <div><div style={{fontSize:28,marginBottom:6}}>📎</div><div style={{fontSize:12,color:"#8a7a6a"}}>Clicca per caricare</div><div style={{fontSize:11,color:"#5a5040",marginTop:4}}>JPG, PNG o PDF — max 5MB</div></div>
                    )}
                    <input id="medFile" type="file" accept=".jpg,.jpeg,.png,.pdf" style={{display:"none"}} onChange={e=>setField("medicalFile",e.target.files[0]||null)} />
                  </div>
                  <div style={{fontSize:11,color:"#5a5040",marginTop:8}}>Se non hai il certificato ora, puoi inviarlo in seguito alla prima lezione.</div>
                </div>
              </div>
            )}

            {regStep === 5 && (
              <div>
                <SectionTitle icon="🔐" title="Crea il tuo Account" />
                <div style={{marginBottom:12}}><label style={labelStyle}>Password *</label><input type="password" style={inputStyle} value={reg.password} onChange={e=>setField("password",e.target.value)} placeholder="Minimo 6 caratteri" /></div>
                <div style={{marginBottom:4}}>
                  <label style={labelStyle}>Conferma Password *</label>
                  <input type="password" style={inputStyle} value={reg.confirm} onChange={e=>setField("confirm",e.target.value)} placeholder="Ripeti la password" />
                </div>
                {reg.password&&reg.confirm&&reg.password!==reg.confirm&&<div style={{fontSize:11,color:"#ef4444",marginBottom:10}}>Le password non coincidono</div>}
                {reg.password&&reg.confirm&&reg.password===reg.confirm&&reg.password.length>=6&&<div style={{fontSize:11,color:"#22c55e",marginBottom:10}}>✓ Password valida</div>}
                <SectionTitle icon="📋" title="Privacy & Consensi" />
                <div style={{display:"flex",flexDirection:"column",gap:14}}>
                  <label style={{display:"flex",alignItems:"flex-start",gap:12,cursor:"pointer"}}>
                    <input type="checkbox" checked={reg.gdpr} onChange={e=>setField("gdpr",e.target.checked)} style={{width:18,height:18,marginTop:2,accentColor:"#daa520",flexShrink:0}} />
                    <span style={{fontSize:12,color:"#8a7a6a",lineHeight:1.6}}><strong style={{color:"#e8e0d0"}}>Consenso obbligatorio *</strong><br />Accetto il trattamento dei miei dati personali ai sensi del GDPR (Reg. UE 2016/679) per la gestione dell'iscrizione e delle attività sportive del dojo.</span>
                  </label>
                  <label style={{display:"flex",alignItems:"flex-start",gap:12,cursor:"pointer"}}>
                    <input type="checkbox" checked={reg.gdprMarketing} onChange={e=>setField("gdprMarketing",e.target.checked)} style={{width:18,height:18,marginTop:2,accentColor:"#daa520",flexShrink:0}} />
                    <span style={{fontSize:12,color:"#8a7a6a",lineHeight:1.6}}><strong style={{color:"#e8e0d0"}}>Consenso facoltativo</strong><br />Accetto di ricevere comunicazioni promozionali su eventi, gare e offerte speciali via email e WhatsApp.</span>
                  </label>
                </div>
                <div style={{marginTop:18,padding:"12px 16px",background:"#0d0c07",border:"1px solid #1a1408",borderRadius:8,fontSize:11,color:"#5a5040",lineHeight:1.6}}>
                  Riepilogo: <strong style={{color:"#8a7a6a"}}>{reg.firstName} {reg.lastName}</strong> · {reg.course} · Sede {reg.location} · <BeltBadge belt={reg.belt} />
                </div>
              </div>
            )}

            {regError && <div style={{marginTop:14,color:"#ef4444",fontSize:12,padding:"10px 14px",background:"rgba(239,68,68,0.08)",borderRadius:8,border:"1px solid rgba(239,68,68,0.2)"}}>⚠️ {regError}</div>}

            <div style={{display:"flex",gap:10,marginTop:22}}>
              {regStep>0&&<button onClick={()=>{setRegStep(s=>s-1);setRegError("");}} style={{background:"#1a1408",color:"#8a7a6a",border:"1px solid #2a2010",borderRadius:10,padding:"12px 18px",cursor:"pointer",fontSize:13,fontFamily:"inherit"}}>← Indietro</button>}
              <button onClick={nextStep} style={{flex:1,background:"linear-gradient(135deg,#b8860b,#daa520)",color:"#0a0905",border:"none",borderRadius:10,padding:"14px",cursor:"pointer",fontSize:14,fontWeight:700,fontFamily:"inherit"}}>
                {regStep===TOTAL_STEPS-1?"✓ Invia Iscrizione":"Avanti →"}
              </button>
            </div>
            <div style={{textAlign:"center",marginTop:16,fontSize:12,color:"#3a3020"}}>
              Hai già un account? <span onClick={()=>setScreen("login")} style={{color:"#daa520",cursor:"pointer",textDecoration:"underline"}}>Accedi</span>
            </div>
            <button onClick={()=>setScreen("home")} style={{display:"block",margin:"10px auto 0",background:"none",border:"none",color:"#3a3020",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>← Home</button>
          </>
        ) : (
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:60,marginBottom:14}}>🎌</div>
            <div style={{fontSize:22,fontWeight:700,color:"#daa520",marginBottom:10}}>Iscrizione Inviata!</div>
            <div style={{fontSize:14,color:"#8a7a6a",lineHeight:1.8,marginBottom:18}}>
              Ciao <strong style={{color:"#e8e0d0"}}>{reg.firstName}</strong>!<br/>
              La tua richiesta per il corso di <strong style={{color:"#daa520"}}>{reg.course}</strong> (sede {reg.location}) è stata ricevuta.
            </div>
            <div style={{background:"#0d0c07",border:"1px solid #2a2010",borderRadius:12,padding:"16px 20px",marginBottom:22,fontSize:13,color:"#5a5040",lineHeight:1.8,textAlign:"left"}}>
              <div>📧 Riceverai conferma a <strong style={{color:"#8a7a6a"}}>{reg.email}</strong></div>
              <div style={{marginTop:6}}>⏱️ Il Sensei approverà entro 24 ore</div>
              <div style={{marginTop:6}}>🔐 Poi potrai accedere con email e password</div>
              {!reg.medicalFile&&<div style={{marginTop:6,color:"#daa520"}}>⚠️ Porta il certificato medico alla prima lezione</div>}
            </div>
            <button onClick={()=>setScreen("login")} style={{background:"linear-gradient(135deg,#b8860b,#daa520)",color:"#0a0905",border:"none",borderRadius:10,padding:"12px 32px",cursor:"pointer",fontSize:14,fontWeight:700,fontFamily:"inherit"}}>Vai al Login</button>
          </div>
        )}
      </div>
    </div>
  );

  // DASHBOARD
  if (screen === "dashboard" && athlete) {
    const TABS = [{ key:"profilo",label:"Profilo",icon:"👤" },{ key:"presenze",label:"Presenze",icon:"📅" },{ key:"pagamenti",label:"Pagamenti",icon:"💶" },{ key:"esami",label:"Esami & Gare",icon:"🏆" },{ key:"notizie",label:"Bacheca",icon:"📢" }];
    return (
      <div style={BASE}>
        <div style={{background:"linear-gradient(135deg,#0d0c07,#131008)",borderBottom:"1px solid #2a2010",padding:"0 28px"}}>
          <div style={{maxWidth:900,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{display:"flex",alignItems:"center",gap:14,padding:"18px 0"}}>
              <div style={{fontSize:26}}>🥋</div>
              <div><div style={{fontSize:16,fontWeight:700,color:"#daa520"}}>DOJO KARATE</div><div style={{fontSize:11,color:"#5a5040",letterSpacing:"0.15em"}}>AREA ATLETA</div></div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{textAlign:"right"}}><div style={{fontSize:13,color:"#e8e0d0"}}>{athlete.firstName} {athlete.lastName}</div><div style={{marginTop:2}}><BeltBadge belt={athlete.belt} /></div></div>
              <button onClick={handleLogout} style={{background:"transparent",color:"#5a5040",border:"1px solid #2a2010",borderRadius:8,padding:"7px 14px",cursor:"pointer",fontSize:12,fontFamily:"inherit"}}>Esci</button>
            </div>
          </div>
          <div style={{maxWidth:900,margin:"0 auto",display:"flex",gap:2,overflowX:"auto"}}>
            {TABS.map(t=><button key={t.key} onClick={()=>setActiveTab(t.key)} style={{background:activeTab===t.key?"linear-gradient(135deg,#b8860b,#daa520)":"transparent",color:activeTab===t.key?"#0a0905":"#5a5040",border:"none",borderRadius:"6px 6px 0 0",padding:"10px 14px",cursor:"pointer",fontSize:12,fontWeight:activeTab===t.key?700:400,fontFamily:"inherit",whiteSpace:"nowrap"}}>{t.icon} {t.label}</button>)}
          </div>
        </div>

        <div style={{maxWidth:900,margin:"0 auto",padding:"28px"}}>
          {activeTab==="profilo" && (
            <div>
              <div style={{background:"linear-gradient(135deg,#131008,#1a1408)",border:"1px solid #2a2010",borderRadius:16,padding:26,marginBottom:18}}>
                <div style={{display:"flex",gap:18,alignItems:"flex-start",flexWrap:"wrap"}}>
                  <div style={{width:68,height:68,borderRadius:"50%",background:"linear-gradient(135deg,#b8860b,#daa520)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:30,flexShrink:0}}>🥋</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:20,fontWeight:700,color:"#e8e0d0"}}>{athlete.firstName} {athlete.lastName}</div>
                    <div style={{margin:"6px 0"}}><BeltBadge belt={athlete.belt} large /></div>
                    <div style={{fontSize:12,color:"#5a5040"}}>{athlete.course} · {athlete.location} · {athlete.discipline}</div>
                    <div style={{display:"flex",gap:16,marginTop:6,fontSize:12,color:"#8a7a6a",flexWrap:"wrap"}}>
                      <span>📧 {athlete.email}</span><span>📞 {athlete.mobile}</span>
                    </div>
                  </div>
                </div>
                <div style={{marginTop:18}}><BeltProgress belt={athlete.belt} /></div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
                {[
                  {icon:"💶",label:"Quota mensile",value:`€${athlete.quota}`,sub:athlete.paid?"✓ Pagato":"✗ Non pagato",color:athlete.paid?"#22c55e":"#ef4444"},
                  {icon:"📅",label:"Presenze",value:`${attendanceRate}%`,sub:`${athlete.lessons.filter(l=>l.present).length} su ${athlete.lessons.length}`,color:"#daa520"},
                  {icon:"🏥",label:"Certificato",value:athlete.medicalExpiry?new Date(athlete.medicalExpiry).toLocaleDateString("it-IT"):"—",sub:"Scadenza",color:"#4a9eff"},
                ].map(c=><div key={c.label} style={{background:"#131008",border:"1px solid #2a2010",borderRadius:12,padding:16}}><div style={{fontSize:20,marginBottom:8}}>{c.icon}</div><div style={{fontSize:10,color:"#5a5040",textTransform:"uppercase",letterSpacing:"0.08em"}}>{c.label}</div><div style={{fontSize:17,fontWeight:700,color:c.color,marginTop:4}}>{c.value}</div><div style={{fontSize:11,color:"#5a5040",marginTop:2}}>{c.sub}</div></div>)}
              </div>
            </div>
          )}

          {activeTab==="presenze" && (
            <div>
              <h2 style={{color:"#daa520",marginBottom:8,fontSize:20}}>Le Mie Presenze</h2>
              <div style={{fontSize:13,color:"#5a5040",marginBottom:18}}>{attendanceRate}% · {athlete.lessons.filter(l=>l.present).length}/{athlete.lessons.length} lezioni</div>
              <div style={{background:"#131008",border:"1px solid #2a2010",borderRadius:99,height:10,marginBottom:20,overflow:"hidden"}}><div style={{background:"linear-gradient(90deg,#b8860b,#daa520)",height:"100%",width:`${attendanceRate}%`,borderRadius:99}} /></div>
              {athlete.lessons.map((l,i)=>(
                <div key={i} style={{background:"#131008",border:`1px solid ${l.present?"#2a3a1a":"#2a1a1a"}`,borderRadius:12,padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                  <div><div style={{fontSize:14,fontWeight:600,color:"#e8e0d0"}}>{l.type}</div><div style={{fontSize:12,color:"#5a5040",marginTop:2}}>{new Date(l.date).toLocaleDateString("it-IT",{weekday:"long",day:"numeric",month:"long"})}</div></div>
                  <span style={{background:l.present?"rgba(34,197,94,0.15)":"rgba(239,68,68,0.1)",color:l.present?"#22c55e":"#ef4444",border:`1px solid ${l.present?"#22c55e":"#ef4444"}`,borderRadius:99,padding:"4px 14px",fontSize:11,fontWeight:700}}>{l.present?"✓ Presente":"✗ Assente"}</span>
                </div>
              ))}
            </div>
          )}

          {activeTab==="pagamenti" && (
            <div>
              <h2 style={{color:"#daa520",marginBottom:18,fontSize:20}}>Pagamenti & Ricevute</h2>
              <div style={{background:athlete.paid?"rgba(34,197,94,0.06)":"rgba(239,68,68,0.06)",border:`1px solid ${athlete.paid?"rgba(34,197,94,0.3)":"rgba(239,68,68,0.3)"}`,borderRadius:14,padding:20,marginBottom:22,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div><div style={{fontSize:15,fontWeight:700,color:athlete.paid?"#22c55e":"#ef4444"}}>{athlete.paid?"✓ Quota di questo mese pagata":"✗ Quota non pagata"}</div><div style={{fontSize:12,color:"#5a5040",marginTop:4}}>{athlete.lastPayment?`Ultimo pagamento: ${new Date(athlete.lastPayment).toLocaleDateString("it-IT")}`:"Nessun pagamento"}</div></div>
                <div style={{fontSize:26,fontWeight:700,color:"#daa520"}}>€{athlete.quota}</div>
              </div>
              <div style={{fontSize:11,color:"#5a5040",marginBottom:10,textTransform:"uppercase",letterSpacing:"0.1em"}}>Storico ricevute</div>
              {athlete.receipts.map(r=>(
                <div key={r.id} style={{background:"#131008",border:"1px solid #2a2010",borderRadius:12,padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                  <div><div style={{fontSize:14,fontWeight:600,color:"#e8e0d0"}}>{r.period}</div><div style={{fontSize:11,color:"#5a5040",marginTop:2}}>{r.id} · {new Date(r.date).toLocaleDateString("it-IT")}</div></div>
                  <div style={{display:"flex",alignItems:"center",gap:12}}>
                    <span style={{fontSize:16,fontWeight:700,color:"#daa520"}}>€{r.amount}</span>
                    <button onClick={()=>setShowReceipt(r)} style={{background:"rgba(74,158,255,0.12)",color:"#4a9eff",border:"1px solid rgba(74,158,255,0.3)",borderRadius:8,padding:"5px 12px",cursor:"pointer",fontSize:11,fontFamily:"inherit"}}>📄 Ricevuta</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab==="esami" && (
            <div>
              <h2 style={{color:"#daa520",marginBottom:18,fontSize:20}}>Esami & Gare</h2>
              {athlete.exams.map((e,i)=>(
                <div key={i} style={{background:"#131008",border:"1px solid #2a2010",borderRadius:14,padding:20,marginBottom:14,display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div><div style={{fontSize:17,fontWeight:700,color:"#daa520"}}>{e.type}</div><div style={{fontSize:12,color:"#5a5040",marginTop:4}}>{new Date(e.date).toLocaleDateString("it-IT",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</div></div>
                  <span style={{background:"rgba(74,158,255,0.15)",color:"#4a9eff",border:"1px solid rgba(74,158,255,0.3)",borderRadius:99,padding:"4px 14px",fontSize:11,fontWeight:700}}>{e.status}</span>
                </div>
              ))}
            </div>
          )}

          {activeTab==="notizie" && (
            <div>
              <h2 style={{color:"#daa520",marginBottom:18,fontSize:20}}>Bacheca</h2>
              {athlete.news.map(n=>(
                <div key={n.id} style={{background:"#131008",border:`1px solid ${n.important?"rgba(185,28,28,0.4)":"#2a2010"}`,borderRadius:14,padding:20,marginBottom:14}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                    {n.important&&<span style={{background:"#b91c1c",color:"#fff",fontSize:10,padding:"2px 8px",borderRadius:99,fontWeight:700}}>⚡ IMPORTANTE</span>}
                    <div style={{fontSize:15,fontWeight:700,color:"#e8e0d0"}}>{n.title}</div>
                    <div style={{marginLeft:"auto",fontSize:11,color:"#3a3020"}}>{new Date(n.date).toLocaleDateString("it-IT")}</div>
                  </div>
                  <div style={{fontSize:13,color:"#8a7a6a",lineHeight:1.7}}>{n.text}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {showReceipt && (
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000}} onClick={()=>setShowReceipt(null)}>
            <div style={{background:"#fff",borderRadius:16,padding:34,width:370,maxWidth:"90vw",color:"#111"}} onClick={e=>e.stopPropagation()}>
              <div style={{textAlign:"center",borderBottom:"2px solid #b8860b",paddingBottom:16,marginBottom:18}}><div style={{fontSize:28}}>🥋</div><div style={{fontSize:16,fontWeight:700,color:"#b8860b"}}>DOJO KARATE</div><div style={{fontSize:10,letterSpacing:"0.15em",color:"#888"}}>RICEVUTA DI PAGAMENTO</div></div>
              {[["N° Ricevuta",showReceipt.id],["Data",new Date(showReceipt.date).toLocaleDateString("it-IT")],["Intestatario",`${athlete.firstName} ${athlete.lastName}`],["Periodo",showReceipt.period],["Descrizione","Quota mensile associativa"]].map(([k,v])=>(
                <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid #f0f0f0",fontSize:12}}><span style={{color:"#888"}}>{k}</span><span style={{fontWeight:500}}>{v}</span></div>
              ))}
              <div style={{display:"flex",justifyContent:"space-between",background:"#b8860b",color:"#fff",borderRadius:8,padding:"12px 16px",marginTop:14,fontWeight:700,fontSize:15}}><span>TOTALE</span><span>€{showReceipt.amount},00</span></div>
              <div style={{display:"flex",gap:8,marginTop:12}}>
                <button onClick={()=>window.print()} style={{flex:1,background:"#b8860b",color:"#fff",border:"none",borderRadius:8,padding:"10px",cursor:"pointer",fontSize:12,fontWeight:600}}>🖨️ Stampa</button>
                <button onClick={()=>setShowReceipt(null)} style={{flex:1,background:"#f0f0f0",color:"#333",border:"none",borderRadius:8,padding:"10px",cursor:"pointer",fontSize:12}}>Chiudi</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
  return null;
}
