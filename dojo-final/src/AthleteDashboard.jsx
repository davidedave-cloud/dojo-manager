import React, { useState } from "react";
import { printModuloTesseramento } from "./printModulo.js";
import { BeltBadge, BeltProgress, inputStyle, labelStyle } from "./AthleteComponents.jsx";
import { AddMemberModal } from "./AthleteComponents.jsx";

export default function AthleteDashboard({ athlete, setAthlete, familyMembers, setFamilyMembers, payments, news, exams, resources, supabase, handleLogout }) {
  const [activeTab, setActiveTab] = useState("profilo");
  const [showAddMember, setShowAddMember] = useState(false);
  const [editProfile, setEditProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({});
  const [settingsForm, setSettingsForm] = useState({ newEmail: "", newPassword: "", confirmPassword: "" });
  const [settingsError, setSettingsError] = useState("");
  const [settingsSuccess, setSettingsSuccess] = useState("");
  const [settingsSaving, setSettingsSaving] = useState(false);

  const TABS = [
    { key: "profilo", label: "Profilo", icon: "👤" },
    { key: "famiglia", label: familyMembers.length > 0 ? `Famiglia (${familyMembers.length})` : "Famiglia", icon: "👨‍👩‍👦" },
    { key: "pagamenti", label: "Pagamenti", icon: "💶" },
    { key: "esami", label: "Eventi", icon: "🏆" },
    { key: "notizie", label: "Bacheca", icon: "📢" },
    { key: "risorse", label: "Risorse", icon: "📚" },
    { key: "impostazioni", label: "Impostazioni", icon: "⚙️" },
  ];

  async function handleAddMember(memberData) {
    const { error } = await supabase.from("athletes").insert({
      parent_athlete_id: athlete.id,
      first_name: memberData.firstName, last_name: memberData.lastName,
      birth_date: memberData.birthDate, birth_place: memberData.birthPlace,
      fiscal_code: memberData.fiscalCode || `FAM-${Date.now()}`,
      address: athlete.address, city: athlete.city, zip: athlete.zip, province: athlete.province,
      email: `fam-${Date.now()}@dojo.local`,
      mobile: athlete.mobile,
      belt: memberData.belt, course: memberData.course, location: memberData.location,
      is_minor: memberData.isMinor,
      parent_name: athlete.first_name + " " + athlete.last_name,
      parent_phone: athlete.mobile, parent_email: athlete.email,
      parent_cf: memberData.parentFiscalCode || athlete.fiscal_code,
      medical_expiry: memberData.medicalExpiry,
      notes: memberData.notes, status: "pending", gdpr_consent: true,
    });
    if (error) {
      alert("Errore nell'aggiunta del familiare: " + error.message);
      return;
    }
    const { data: fam } = await supabase.from("athletes").select("*").eq("parent_athlete_id", athlete.id);
    setFamilyMembers(fam || []);
    setShowAddMember(false);
  }

  async function saveProfile() {
    const { error } = await supabase.from("athletes").update({
      email: profileForm.email, mobile: profileForm.mobile, phone: profileForm.phone,
      address: profileForm.address, city: profileForm.city, zip: profileForm.zip,
    }).eq("id", athlete.id);
    if (!error) { setAthlete(prev => ({ ...prev, ...profileForm })); setEditProfile(false); }
  }

  const BASE = { fontFamily: "'Palatino Linotype','Book Antiqua',Palatino,serif", background: "#0a0905", minHeight: "100vh", color: "#e8e0d0" };

  return (
    <div style={BASE}>
      {showAddMember && <AddMemberModal onClose={() => setShowAddMember(false)} onSave={handleAddMember} parentAthlete={athlete} />}

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#0d0c07,#131008)", borderBottom: "1px solid #2a2010", padding: "0 28px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "18px 0" }}>
            <div style={{ fontSize: 26 }}>🥋</div>
            <div><div style={{ fontSize: 16, fontWeight: 700, color: "#daa520" }}>DOJO KARATE</div><div style={{ fontSize: 11, color: "#5a5040" }}>AREA ATLETA</div></div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ textAlign: "right" }}><div style={{ fontSize: 13, color: "#e8e0d0" }}>{athlete.first_name} {athlete.last_name}</div><div style={{ marginTop: 2 }}><BeltBadge belt={athlete.belt} /></div></div>
            <button onClick={handleLogout} style={{ background: "transparent", color: "#5a5040", border: "1px solid #2a2010", borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>Esci</button>
          </div>
        </div>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", gap: 2, overflowX: "auto", alignItems: "center" }}>
          {TABS.map(t => <button key={t.key} onClick={() => setActiveTab(t.key)} style={{ background: activeTab === t.key ? "linear-gradient(135deg,#b8860b,#daa520)" : "transparent", color: activeTab === t.key ? "#0a0905" : "#5a5040", border: "none", borderRadius: "6px 6px 0 0", padding: "10px 14px", cursor: "pointer", fontSize: 12, fontWeight: activeTab === t.key ? 700 : 400, fontFamily: "inherit", whiteSpace: "nowrap" }}>{t.icon} {t.label}</button>)}
          <a href="https://www.patreon.com/cw/DavideTemporin" target="_blank" rel="noopener noreferrer" style={{ marginLeft: "auto", background: "rgba(255,66,77,0.15)", color: "#ff424d", border: "1px solid rgba(255,66,77,0.3)", borderRadius: 8, padding: "6px 14px", fontSize: 11, fontFamily: "inherit", textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0 }}>📚 Approfondisci lo studio</a>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px" }}>

        {/* PROFILO */}
        {activeTab === "profilo" && (
          <div style={{ background: "linear-gradient(135deg,#131008,#1a1408)", border: "1px solid #2a2010", borderRadius: 16, padding: 26 }}>
            <div style={{ display: "flex", gap: 18, alignItems: "flex-start", flexWrap: "wrap" }}>
              <div style={{ width: 68, height: 68, borderRadius: "50%", background: "linear-gradient(135deg,#b8860b,#daa520)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, flexShrink: 0 }}>🥋</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#e8e0d0" }}>{athlete.first_name} {athlete.last_name}</div>
                <div style={{ margin: "6px 0" }}><BeltBadge belt={athlete.belt} large /></div>
                <div style={{ fontSize: 12, color: "#5a5040" }}>{athlete.course} · {athlete.location}</div>
                <div style={{ display: "flex", gap: 16, marginTop: 6, fontSize: 12, color: "#8a7a6a", flexWrap: "wrap" }}><span>📧 {athlete.email}</span><span>📞 {athlete.mobile}</span></div>
                {athlete.status === "pending" && <div style={{ marginTop: 10, padding: "6px 12px", background: "rgba(218,165,32,0.1)", border: "1px solid rgba(218,165,32,0.3)", borderRadius: 6, fontSize: 12, color: "#daa520" }}>⏳ Iscrizione in attesa di approvazione</div>}
              </div>
            </div>
            <div style={{ marginTop: 18 }}><BeltProgress belt={athlete.belt} /></div>
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #2a2010", display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button onClick={() => printModuloTesseramento(athlete, "2025/2026")} style={{ background: "rgba(218,165,32,0.1)", color: "#daa520", border: "1px solid rgba(218,165,32,0.3)", borderRadius: 8, padding: "10px 20px", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>🖨️ Stampa Modulo</button>
              <button onClick={() => { setProfileForm({ email: athlete.email, mobile: athlete.mobile, phone: athlete.phone, address: athlete.address, city: athlete.city, zip: athlete.zip }); setEditProfile(true); }} style={{ background: "rgba(74,158,255,0.1)", color: "#4a9eff", border: "1px solid rgba(74,158,255,0.3)", borderRadius: 8, padding: "10px 20px", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>✏️ Modifica dati</button>
            </div>
            {editProfile && (
              <div style={{ marginTop: 20, background: "#0d0c07", border: "1px solid #2a2010", borderRadius: 12, padding: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#daa520", marginBottom: 16 }}>✏️ Modifica i tuoi dati</div>
                <div style={{ marginBottom: 12 }}><label style={labelStyle}>Email</label><input type="email" style={inputStyle} value={profileForm.email || ""} onChange={e => setProfileForm(p => ({...p, email: e.target.value}))} /></div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                  <div><label style={labelStyle}>Cellulare</label><input type="tel" style={inputStyle} value={profileForm.mobile || ""} onChange={e => setProfileForm(p => ({...p, mobile: e.target.value}))} /></div>
                  <div><label style={labelStyle}>Tel. fisso</label><input type="tel" style={inputStyle} value={profileForm.phone || ""} onChange={e => setProfileForm(p => ({...p, phone: e.target.value}))} /></div>
                </div>
                <div style={{ marginBottom: 12 }}><label style={labelStyle}>Indirizzo</label><input style={inputStyle} value={profileForm.address || ""} onChange={e => setProfileForm(p => ({...p, address: e.target.value}))} /></div>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 10, marginBottom: 16 }}>
                  <div><label style={labelStyle}>Città</label><input style={inputStyle} value={profileForm.city || ""} onChange={e => setProfileForm(p => ({...p, city: e.target.value}))} /></div>
                  <div><label style={labelStyle}>CAP</label><input style={inputStyle} value={profileForm.zip || ""} onChange={e => setProfileForm(p => ({...p, zip: e.target.value}))} maxLength={5} /></div>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={saveProfile} style={{ flex: 1, background: "linear-gradient(135deg,#b8860b,#daa520)", color: "#0a0905", border: "none", borderRadius: 8, padding: "12px", cursor: "pointer", fontWeight: 700, fontSize: 13, fontFamily: "inherit" }}>✓ Salva</button>
                  <button onClick={() => setEditProfile(false)} style={{ background: "#1a1408", color: "#8a7a6a", border: "1px solid #2a2010", borderRadius: 8, padding: "12px 18px", cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>Annulla</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* FAMIGLIA */}
        {activeTab === "famiglia" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ color: "#daa520", fontSize: 20 }}>👨‍👩‍👦 Membri Famiglia</h2>
              <button onClick={() => setShowAddMember(true)} style={{ background: "linear-gradient(135deg,#b8860b,#daa520)", color: "#0a0905", border: "none", borderRadius: 10, padding: "10px 20px", cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "inherit" }}>+ Aggiungi Familiare</button>
            </div>
            <div style={{ background: "linear-gradient(135deg,#131008,#1a1408)", border: "2px solid #b8860b", borderRadius: 14, padding: 18, marginBottom: 12, display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg,#b8860b,#daa520)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🥋</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#e8e0d0" }}>{athlete.first_name} {athlete.last_name} <span style={{ fontSize: 11, color: "#daa520", background: "rgba(218,165,32,0.1)", padding: "2px 8px", borderRadius: 99, marginLeft: 6 }}>Titolare</span></div>
                <div style={{ fontSize: 12, color: "#5a5040", marginTop: 3 }}>{athlete.course} · {athlete.location}</div>
                <div style={{ marginTop: 4 }}><BeltBadge belt={athlete.belt} /></div>
              </div>
            </div>
            {familyMembers.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "#5a5040", background: "#0d0c07", borderRadius: 14, border: "1px dashed #2a2010" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>👶</div>
                <div style={{ fontSize: 14, marginBottom: 8 }}>Nessun familiare aggiunto</div>
                <div style={{ fontSize: 12, color: "#3a3020" }}>Clicca "Aggiungi Familiare" per iscrivere un figlio o altro membro della famiglia</div>
              </div>
            ) : familyMembers.map(m => (
              <div key={m.id} style={{ background: "#131008", border: "1px solid #2a2010", borderRadius: 14, padding: 18, marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#1a1408", border: "1px solid #2a2010", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>👦</div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#e8e0d0" }}>{m.first_name} {m.last_name}</div>
                    <div style={{ fontSize: 12, color: "#5a5040", marginTop: 3 }}>{m.course} · {m.location}</div>
                    <div style={{ display: "flex", gap: 8, marginTop: 4, alignItems: "center" }}>
                      <BeltBadge belt={m.belt} />
                      <span style={{ fontSize: 11, color: m.status === "approved" ? "#22c55e" : "#daa520" }}>{m.status === "approved" ? "✓ Approvato" : "⏳ In attesa"}</span>
                    </div>
                  </div>
                </div>
                {m.medical_expiry && <div style={{ fontSize: 12, color: "#5a5040" }}>🏥 {new Date(m.medical_expiry).toLocaleDateString("it-IT")}</div>}
              </div>
            ))}
            {familyMembers.length > 0 && <div style={{ marginTop: 16, padding: "12px 16px", background: "rgba(218,165,32,0.06)", border: "1px solid rgba(218,165,32,0.2)", borderRadius: 10, fontSize: 12, color: "#8a7a6a" }}>💶 Il pagamento della quota è unico per tutta la famiglia · Contatta il Sensei per info</div>}
          </div>
        )}

        {/* PAGAMENTI */}
        {activeTab === "pagamenti" && (
          <div>
            <h2 style={{ color: "#daa520", marginBottom: 18, fontSize: 20 }}>Pagamenti & Ricevute</h2>
            {payments.filter(p => p.status === "paid").length === 0
              ? <div style={{ textAlign: "center", padding: 60, color: "#5a5040" }}>Nessun pagamento registrato.</div>
              : payments.filter(p => p.status === "paid").map(p => {
                const MONTHS = ["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"];
                const label = p.payment_type === "annuale" ? `🎫 Tessera ${p.period_year}` : `📅 ${MONTHS[(p.period_month||1)-1]} ${p.period_year}`;
                return (
                  <div key={p.id} style={{ background: "#131008", border: "1px solid #2a2010", borderRadius: 12, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#e8e0d0" }}>{label}</div>
                      <div style={{ fontSize: 11, color: "#5a5040", marginTop: 2 }}>{p.receipt_number} · {p.paid_at ? new Date(p.paid_at).toLocaleDateString("it-IT") : ""}</div>
                    </div>
                    <span style={{ fontSize: 16, fontWeight: 700, color: "#daa520" }}>€{p.amount}</span>
                    <button onClick={() => {
                      const win = window.open("", "_blank");
                      const MONTHS2 = ["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"];
                      const mese = MONTHS2[(p.period_month||1)-1];
                      const anno = p.period_year;
                      const stagione = (p.period_month >= 9) ? (anno+"/"+(anno+1)) : ((anno-1)+"/"+anno);
                      const causale = p.payment_type === "annuale" ? "Tessera associativa anno "+anno : "Quota mensile "+mese+" "+anno;
                      const receiptNum = (p.receipt_number||"").replace("RCV-","").replace("UPLOAD-","") || (p.id||"").slice(0,6).toUpperCase();
                      const dataStr = new Date(p.paid_at||Date.now()).toLocaleDateString("it-IT");
                      const logoUrl = "https://ccllvcdtehvbjroawomz.supabase.co/storage/v1/object/public/assets/Karate%20Do%20copia.png";
                      win.document.write("<!DOCTYPE html><html lang='it'><head><meta charset='UTF-8'><title>Ricevuta "+receiptNum+"</title><style>@page{size:A4;margin:20mm}*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;font-size:11pt;color:#111;background:#fff}.page{max-width:700px;margin:0 auto;border:1px solid #ccc}.header{display:flex;align-items:center;padding:16px 20px;border-bottom:2px solid #1a1408;gap:16px}.logo-box{width:80px;height:80px;flex-shrink:0}.logo-box img{width:100%;height:100%;object-fit:contain}.org-info{font-size:9pt;color:#444;line-height:1.6}.org-name{font-weight:bold;font-size:10pt}.ricevuta-title{margin-left:auto;text-align:right}.ricevuta-title h1{font-size:28pt;font-weight:900;color:#111;letter-spacing:2px}.meta{display:flex;gap:30px;justify-content:flex-end;font-size:10pt;margin-top:4px}.body{padding:20px}table{width:100%;border-collapse:collapse}td{padding:8px 6px;border-bottom:1px solid #ddd;font-size:10pt}.label{color:#555;font-weight:bold;width:140px}.importo-box{background:#f5f5f5;border:1px solid #ddd;border-radius:4px;padding:12px 20px;margin:16px 0;text-align:center}.importo-lettere{font-size:14pt;font-style:italic;font-weight:bold}.totale{display:flex;justify-content:space-between;align-items:center;background:#1a1408;color:white;padding:14px 20px;margin-top:16px}.totale-label{font-size:13pt;font-weight:bold}.totale-value{font-size:16pt;font-weight:bold}.firma{display:flex;justify-content:flex-end;margin-top:30px;padding-right:20px}.firma-line{border-top:1px solid #333;width:200px;margin-top:40px}.firma-label{font-size:9pt;color:#555;margin-top:4px;text-align:center}</style></head><body><div class='page'><div class='header'><div class='logo-box'><img src='"+logoUrl+"' alt='Logo'/></div><div class='org-info'><div class='org-name'>Associazione Sportiva Dilettantistica</div><div class='org-name'>CINQUE CERCHI</div><div>Sezione Karate-do Tradizionale</div><div>cinquecerchikaratedo@gmail.com</div></div><div class='ricevuta-title'><h1>RICEVUTA</h1><div class='meta'><span>DATA <strong>"+dataStr+"</strong></span><span>N. <strong>"+receiptNum+"</strong></span></div></div></div><div class='body'><table><tr><td class='label'>RICEVUTO DA:</td><td>"+athlete.first_name+" "+athlete.last_name+" <span style='font-size:9pt;color:#777'>C.F. "+(athlete.fiscal_code||"—")+"</span></td></tr><tr><td class='label'>IMPORTO:</td><td><div class='importo-box'><span class='importo-lettere'>€ "+Number(p.amount).toFixed(2)+"</span></div></td></tr><tr><td class='label'>CAUSALE:</td><td>"+causale+"</td></tr></table><div class='totale'><span class='totale-label'>TOTALE</span><span class='totale-value'>€ "+Number(p.amount).toFixed(2)+"</span></div><div class='firma'><div><div class='firma-line'></div><div class='firma-label'>IL RICEVENTE</div></div></div></div></div><script>window.onload=()=>window.print();</script></body></html>");
                      win.document.close();
                    }} style={{ background: "rgba(74,158,255,0.15)", color: "#4a9eff", border: "1px solid #4a9eff", borderRadius: 8, padding: "7px 12px", cursor: "pointer", fontSize: 11, fontFamily: "inherit", whiteSpace: "nowrap" }}>📄 Ricevuta</button>
                  </div>
                );
              })}
          </div>
        )}

        {/* EVENTI */}
        {activeTab === "esami" && (
          <div>
            <h2 style={{ color: "#daa520", marginBottom: 18, fontSize: 20 }}>🏆 I miei Eventi</h2>
            {exams.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#5a5040", background: "#0d0c07", borderRadius: 14, border: "1px dashed #2a2010" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🏆</div>
                <div>Nessun evento in programma.</div>
              </div>
            ) : exams.map((ep, i) => {
              const typeColors = { "Esame Cinture": "#daa520", "Gara": "#4a9eff", "Seminario": "#c084fc" };
              const color = typeColors[ep.events?.event_type] || "#888";
              return (
                <div key={i} style={{ background: "#131008", border: `1px solid ${color}33`, borderRadius: 14, padding: 20, marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: 17, fontWeight: 700, color }}>{ep.events?.event_type}</div>
                      <div style={{ fontSize: 13, color: "#8a7a6a", marginTop: 4 }}>{ep.events?.event_date ? new Date(ep.events.event_date).toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : ""}</div>
                      {ep.events?.location && <div style={{ fontSize: 12, color: "#5a5040", marginTop: 2 }}>📍 {ep.events.location}</div>}
                    </div>
                    <span style={{ background: `${color}20`, color, border: `1px solid ${color}`, borderRadius: 99, padding: "4px 14px", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>{ep.status === "iscritto" ? "✓ Iscritto" : ep.status === "promosso" ? "🎉 Promosso" : ep.status === "rimandato" ? "⏳ Rimandato" : ep.status}</span>
                  </div>
                  {ep.new_belt && <div style={{ marginTop: 10 }}><span style={{ fontSize: 12, color: "#22c55e" }}>Nuova cintura: </span><BeltBadge belt={ep.new_belt} /></div>}
                </div>
              );
            })}
          </div>
        )}

        {/* BACHECA */}
        {activeTab === "notizie" && (
          <div>
            <h2 style={{ color: "#daa520", marginBottom: 18, fontSize: 20 }}>Bacheca</h2>
            {news.length === 0 ? <div style={{ textAlign: "center", padding: 60, color: "#5a5040" }}>Nessuna comunicazione.</div>
              : news.map(n => (
                <div key={n.id} style={{ background: "#131008", border: `1px solid ${n.important ? "rgba(185,28,28,0.4)" : "#2a2010"}`, borderRadius: 14, padding: 20, marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    {n.important && <span style={{ background: "#b91c1c", color: "#fff", fontSize: 10, padding: "2px 8px", borderRadius: 99, fontWeight: 700 }}>⚡ IMPORTANTE</span>}
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#e8e0d0" }}>{n.title}</div>
                    <div style={{ marginLeft: "auto", fontSize: 11, color: "#3a3020" }}>{new Date(n.published_at).toLocaleDateString("it-IT")}</div>
                  </div>
                  <div style={{ fontSize: 13, color: "#8a7a6a", lineHeight: 1.7 }}>{n.body}</div>
                </div>
              ))}
          </div>
        )}

        {/* RISORSE */}
        {activeTab === "risorse" && (
          <div>
            <h2 style={{ color: "#daa520", marginBottom: 8, fontSize: 20 }}>📚 Risorse & Materiali</h2>
            <div style={{ fontSize: 13, color: "#5a5040", marginBottom: 24, lineHeight: 1.7 }}>Documenti e materiali di studio messi a disposizione dal Sensei.</div>
            {resources.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#5a5040", background: "#0d0c07", borderRadius: 14, border: "1px dashed #2a2010" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>📄</div>
                <div style={{ fontSize: 14 }}>Nessun documento disponibile</div>
              </div>
            ) : resources.map(r => (
              <a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 16, background: "#131008", border: "1px solid #2a2010", borderRadius: 12, padding: "16px 20px", marginBottom: 12, textDecoration: "none" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "#b8860b"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "#2a2010"}>
                <div style={{ fontSize: 28 }}>📄</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#daa520" }}>{r.title}</div>
                  {r.description && <div style={{ fontSize: 12, color: "#5a5040", marginTop: 3 }}>{r.description}</div>}
                </div>
                <div style={{ fontSize: 12, color: "#b8860b" }}>Scarica →</div>
              </a>
            ))}
          </div>
        )}

        {/* IMPOSTAZIONI */}
        {activeTab === "impostazioni" && (
          <div>
            <h2 style={{ color: "#daa520", marginBottom: 24, fontSize: 20 }}>⚙️ Impostazioni Account</h2>
            <div style={{ background: "#131008", border: "1px solid #2a2010", borderRadius: 14, padding: 24, marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#daa520", marginBottom: 16 }}>📧 Cambia Email</div>
              <div style={{ marginBottom: 12 }}><label style={labelStyle}>Nuova email</label><input type="email" style={inputStyle} value={settingsForm.newEmail} onChange={e => setSettingsForm(p => ({...p, newEmail: e.target.value}))} placeholder="nuova@email.com" /></div>
              {settingsError === "email" && <div style={{ color: "#ef4444", fontSize: 12, marginBottom: 10 }}>⚠️ {settingsSuccess}</div>}
              {settingsSuccess === "email" && <div style={{ color: "#22c55e", fontSize: 12, marginBottom: 10 }}>✓ Email aggiornata!</div>}
              <button disabled={settingsSaving} onClick={async () => {
                if (!settingsForm.newEmail) return;
                setSettingsSaving(true);
                const { error } = await supabase.auth.updateUser({ email: settingsForm.newEmail });
                if (!error) { await supabase.from("athletes").update({ email: settingsForm.newEmail }).eq("id", athlete.id); setSettingsSuccess("email"); setSettingsForm(p => ({...p, newEmail: ""})); }
                else { setSettingsError("email"); setSettingsSuccess(error.message); }
                setSettingsSaving(false);
              }} style={{ background: "linear-gradient(135deg,#b8860b,#daa520)", color: "#0a0905", border: "none", borderRadius: 8, padding: "10px 24px", cursor: "pointer", fontWeight: 700, fontSize: 13, fontFamily: "inherit" }}>Aggiorna Email</button>
            </div>
            <div style={{ background: "#131008", border: "1px solid #2a2010", borderRadius: 14, padding: 24 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#daa520", marginBottom: 16 }}>🔐 Cambia Password</div>
              <div style={{ marginBottom: 12 }}><label style={labelStyle}>Nuova password</label><input type="password" style={inputStyle} value={settingsForm.newPassword} onChange={e => setSettingsForm(p => ({...p, newPassword: e.target.value}))} placeholder="Minimo 8 caratteri" /></div>
              <div style={{ marginBottom: 16 }}><label style={labelStyle}>Conferma password</label><input type="password" style={inputStyle} value={settingsForm.confirmPassword} onChange={e => setSettingsForm(p => ({...p, confirmPassword: e.target.value}))} placeholder="Ripeti la password" /></div>
              {settingsError === "pwd" && <div style={{ color: "#ef4444", fontSize: 12, marginBottom: 10 }}>⚠️ {settingsSuccess}</div>}
              {settingsSuccess === "pwd" && <div style={{ color: "#22c55e", fontSize: 12, marginBottom: 10 }}>✓ Password aggiornata!</div>}
              <button disabled={settingsSaving} onClick={async () => {
                if (!settingsForm.newPassword || settingsForm.newPassword.length < 8) { setSettingsError("pwd"); setSettingsSuccess("La password deve avere almeno 8 caratteri."); return; }
                if (settingsForm.newPassword !== settingsForm.confirmPassword) { setSettingsError("pwd"); setSettingsSuccess("Le password non coincidono."); return; }
                setSettingsSaving(true);
                const { error } = await supabase.auth.updateUser({ password: settingsForm.newPassword });
                if (!error) { setSettingsSuccess("pwd"); setSettingsError(""); setSettingsForm(p => ({...p, newPassword: "", confirmPassword: ""})); }
                else { setSettingsError("pwd"); setSettingsSuccess(error.message); }
                setSettingsSaving(false);
              }} style={{ background: "linear-gradient(135deg,#b8860b,#daa520)", color: "#0a0905", border: "none", borderRadius: 8, padding: "10px 24px", cursor: "pointer", fontWeight: 700, fontSize: 13, fontFamily: "inherit" }}>Aggiorna Password</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
