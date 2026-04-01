import React, { useState } from "react";
import { ANNUAL_FEE, MONTHS_IT, SEASON_MONTHS, inputStyle, labelStyle, calcFamilyTotal, getMonthlyFee, FAMILY_DISCOUNTS } from "./adminConstants.js";

export default function PaymentsTab({ athletes, payments, supabase, onReload, setShowReceipt, BeltBadge }) {
  const now = new Date();
  const [selMonth, setSelMonth] = useState(now.getMonth() + 1);
  const [selYear, setSelYear] = useState(now.getFullYear());
  const [showPayModal, setShowPayModal] = useState(null);
  const [payForm, setPayForm] = useState({ type: "mensile", month: now.getMonth()+1, year: now.getFullYear(), amount: "", note: "" });
  const [saving, setSaving] = useState(false);
  const [activeView, setActiveView] = useState("mese"); // "mese" | "storico" | "export"
  const [paySearch, setPaySearch] = useState("");

  const mainAthletes = athletes.filter(a => !a.parent_athlete_id && a.status === "approved" && a.status !== "suspended");
  const volunteerIds = new Set(mainAthletes.filter(a => a.is_volunteer).map(a => a.id));

  // Pagamenti del mese selezionato
  const monthPayments = payments.filter(p => p.period_month === selMonth && p.period_year === selYear && p.status === "paid");
  const paidIds = new Set(monthPayments.map(p => p.athlete_id));
  const unpaid = mainAthletes.filter(a => !paidIds.has(a.id) && !volunteerIds.has(a.id) && (!paySearch || `${a.first_name} ${a.last_name}`.toLowerCase().includes(paySearch.toLowerCase())));
  const paid = mainAthletes.filter(a => paidIds.has(a.id) && (!paySearch || `${a.first_name} ${a.last_name}`.toLowerCase().includes(paySearch.toLowerCase())));
  const totalMonth = monthPayments.reduce((s, p) => s + Number(p.amount), 0);

  // Annuale
  const annualPaid = payments.filter(p => p.payment_type === "annuale" && (p.period_year === selYear || p.period_year === selYear - 1) && (p.status === "paid" || p.status === "external"));
  const annualPaidIds = new Set(annualPaid.map(p => p.athlete_id));

  async function registerPayment() {
    setSaving(true);
    const a = showPayModal;
    const family = calcFamilyTotal(a, athletes);
    const amount = payForm.amount || family.final;
    const now2 = new Date();
    const receiptNum = `RCV-${selYear}-${String(selMonth).padStart(2,"0")}-${String(Date.now()).slice(-4)}`;
    const { error } = await supabase.from("payments").insert({
      athlete_id: a.id,
      amount: Number(amount),
      period_month: payForm.type === "annuale" ? 9 : selMonth,
      period_year: selYear,
      paid_at: now2.toISOString(),
      payment_method: "bonifico",
      receipt_number: receiptNum,
      status: "paid",
      payment_type: payForm.type,
      notes: payForm.note || null,
    });
    if (error) {
      console.error("Errore salvataggio pagamento:", error);
      alert("❌ Errore nel salvataggio: " + error.message + "\n\nControlla la console del browser per i dettagli.");
      setSaving(false);
      return;
    }
    await onReload();
    setShowPayModal(null);
    setSaving(false);
  }

  // Genera ricevuta professionale per atleta
  function generateReceipt(payment, athlete) {
    const a = athletes.find(x => x.id === payment.athlete_id) || athlete;
    if (!a) return;
    const MONTHS = ["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"];
    const mese = MONTHS[(payment.period_month||1)-1];
    const anno = payment.period_year;
    const stagione = (payment.period_month >= 9) ? (anno + "/" + (anno+1)) : ((anno-1) + "/" + anno);
    const importo = Number(payment.amount);
    const importoInt = Math.floor(importo);
    const importoCent = Math.round((importo - importoInt) * 100);
    const numeri = ["zero","uno","due","tre","quattro","cinque","sei","sette","otto","nove","dieci","undici","dodici","tredici","quattordici","quindici","sedici","diciassette","diciotto","diciannove","venti","ventuno","ventidue","ventitre","ventiquattro","venticinque","ventisei","ventisette","ventotto","ventinove","trenta","trentuno","trentadue","trentatre","trentaquattro","trentacinque","trentasei","trentasette","trentotto","trentanove","quaranta","quarantuno","quarantadue","quarantatre","quarantaquattro","quarantacinque","quarantasei","quarantasette","quarantotto","quarantanove","cinquanta","cinquantuno","cinquantadue","cinquantatre","cinquantaquattro","cinquantacinque","cinquantasei","cinquantasette","cinquantotto","cinquantanove","sessanta","sessantuno","sessantadue","sessantatre","sessantaquattro","sessantacinque","sessantasei","sessantasette","sessantotto","sessantanove","settanta","settantuno","settantadue","settantatre","settantaquattro","settantacinque","settantasei","settantasette","settantotto","settantanove","ottanta","ottantuno","ottantadue","ottantatre","ottantaquattro","ottantacinque","ottantasei","ottantasette","ottantotto","ottantanove","novanta","novantuno","novantadue","novantatre","novantaquattro","novantacinque","novantasei","novantasette","novantotto","novantanove","cento"];
    const importoLettere = (importoInt <= 100 ? numeri[importoInt] : importoInt) + "/" + (importoCent > 0 ? String(importoCent).padStart(2,"0") : "00");
    const isMinore = a.is_minor;
    const causale = payment.payment_type === "annuale"
      ? ("Tessera associativa anno " + anno)
      : ("Quota mensile " + mese + " " + anno + " — corso di " + (a.course && a.course.includes("Psico") ? "Psicomotricità" : "Karate"));
    const receiptNum = (payment.receipt_number || "").replace("RCV-","").replace("UPLOAD-","") || (payment.id || "").slice(0,6).toUpperCase();
    const dataStr = new Date(payment.paid_at || Date.now()).toLocaleDateString("it-IT");
    const logoUrl = "https://ccllvcdtehvbjroawomz.supabase.co/storage/v1/object/public/assets/Karate%20Do%20copia.png";

    const ricevutoDa = isMinore
      ? ("<tr><td class='label'>RICEVUTO DA:</td><td>" + (a.parent_name || "—") + " <span class='cf'>C.F. " + (a.parent_cf || "—") + "</span></td></tr>")
      : ("<tr><td class='label'>RICEVUTO DA:</td><td>" + a.first_name + " " + a.last_name + " <span class='cf'>C.F. " + (a.fiscal_code || "—") + "</span></td></tr>");
    const perAtleta = isMinore
      ? ("<tr><td class='label'>PER ATLETA:</td><td>" + a.first_name + " " + a.last_name + " <span class='cf'>C.F. " + (a.fiscal_code || "—") + "</span></td></tr>")
      : "";
    const noteRow = (payment.receipt_note)
      ? ("<tr><td class='label'>NOTE:</td><td>" + payment.receipt_note + "</td></tr>")
      : "";

    const html = "<!DOCTYPE html>" +
      "<html lang='it'><head><meta charset='UTF-8'><title>Ricevuta " + receiptNum + "</title>" +
      "<style>" +
      "@page{size:A4;margin:20mm}" +
      "*{box-sizing:border-box;margin:0;padding:0}" +
      "body{font-family:Arial,sans-serif;font-size:11pt;color:#111;background:#fff}" +
      ".page{max-width:700px;margin:0 auto;border:1px solid #ccc}" +
      ".header{display:flex;align-items:center;padding:16px 20px;border-bottom:2px solid #1a1408;gap:16px}" +
      ".logo-box{width:80px;height:80px;flex-shrink:0}" +
      ".logo-box img{width:100%;height:100%;object-fit:contain}" +
      ".org-info{font-size:9pt;color:#444;line-height:1.6}" +
      ".org-name{font-weight:bold;font-size:10pt}" +
      ".ricevuta-title{margin-left:auto;text-align:right}" +
      ".ricevuta-title h1{font-size:28pt;font-weight:900;color:#111;letter-spacing:2px}" +
      ".meta{display:flex;gap:30px;justify-content:flex-end;font-size:10pt;margin-top:4px}" +
      ".body{padding:20px}" +
      "table{width:100%;border-collapse:collapse}" +
      "td{padding:8px 6px;border-bottom:1px solid #ddd;font-size:10pt}" +
      ".label{color:#555;font-weight:bold;width:140px}" +
      ".cf{font-size:9pt;color:#777;margin-left:8px}" +
      ".importo-box{background:#f5f5f5;border:1px solid #ddd;border-radius:4px;padding:12px 20px;margin:16px 0;text-align:center}" +
      ".importo-lettere{font-size:14pt;font-style:italic;font-weight:bold}" +
      ".totale{display:flex;justify-content:space-between;align-items:center;background:#1a1408;color:white;padding:14px 20px;margin-top:16px}" +
      ".totale-label{font-size:13pt;font-weight:bold}" +
      ".totale-value{font-size:16pt;font-weight:bold}" +
      ".firma{display:flex;justify-content:flex-end;margin-top:30px;padding-right:20px}" +
      ".firma-line{border-top:1px solid #333;width:200px;margin-top:40px}" +
      ".firma-label{font-size:9pt;color:#555;margin-top:4px;text-align:center}" +
      "</style></head><body>" +
      "<div class='page'>" +
      "<div class='header'>" +
      "<div class='logo-box'><img src='" + logoUrl + "' alt='Logo'/></div>" +
      "<div class='org-info'>" +
      "<div class='org-name'>Associazione Sportiva Dilettantistica</div>" +
      "<div class='org-name'>CINQUE CERCHI</div>" +
      "<div>Sezione Karate-do Tradizionale</div>" +
      "<div>cinquecerchikaratedo@gmail.com</div>" +
      "</div>" +
      "<div class='ricevuta-title'><h1>RICEVUTA</h1>" +
      "<div class='meta'><span>DATA <strong>" + dataStr + "</strong></span><span>N. <strong>" + receiptNum + "</strong></span></div>" +
      "</div></div>" +
      "<div class='body'><table>" +
      ricevutoDa + perAtleta +
      "<tr><td class='label'>IMPORTO:</td><td><div class='importo-box'><span class='importo-lettere'>€ " + importoLettere + "</span></div></td></tr>" +
      "<tr><td class='label'>CAUSALE:</td><td>" + causale + "</td></tr>" +
      noteRow +
      "</table>" +
      "<div class='totale'><span class='totale-label'>TOTALE</span><span class='totale-value'>€ " + importo.toFixed(2) + "</span></div>" +
      "<div class='firma'><div><div class='firma-line'></div><div class='firma-label'>IL RICEVENTE</div></div></div>" +
      "</div></div>" +
      "<script>window.onload=()=>window.print();</script>" +
      "</body></html>";

    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
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

      {/* Barra di ricerca */}
      <div style={{ marginBottom: 16 }}>
        <input value={paySearch} onChange={e => setPaySearch(e.target.value)} placeholder="Cerca atleta..." style={{ width: "100%", background: "#1a1a0e", border: "1px solid #2a2a1a", borderRadius: 8, padding: "10px 14px", color: "#e8e0d0", fontFamily: "inherit", fontSize: 13, boxSizing: "border-box" }} />
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
          {/* Pagamenti da verificare */}
          {(() => {
            const pending = payments.filter(p => p.status === "pending_verification");
            if (pending.length === 0) return null;
            return (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 13, color: "#4a9eff", fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ background: "#4a9eff", color: "#fff", borderRadius: 99, padding: "2px 10px", fontSize: 11 }}>{pending.length}</span>
                  Pagamenti in attesa di verifica
                </div>
                {pending.map(p => {
                  const a = athletes.find(x => x.id === p.athlete_id);
                  const [verifyNote, setVerifyNote] = React.useState("");
                  const [verifyAmount, setVerifyAmount] = React.useState(p.amount);
                  const [expanded, setExpanded] = React.useState(false);
                  return (
                    <div key={p.id} style={{ background: "#1a1a0e", border: "1px solid rgba(74,158,255,0.3)", borderRadius: 12, padding: 18, marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                        <div>
                          <div style={{ fontWeight: 600, color: "#e8e0d0", fontSize: 14 }}>{a ? `${a.first_name} ${a.last_name}` : "—"}</div>
                          <div style={{ fontSize: 12, color: "#777", marginTop: 2 }}>
                            📅 {MONTHS_IT[(p.period_month||1)-1]} {p.period_year} · Importo dichiarato: <strong style={{ color: "#4a9eff" }}>€{p.amount}</strong>
                          </div>
                          {p.notes && <div style={{ fontSize: 11, color: "#8a7a6a", marginTop: 2 }}>Nota atleta: {p.notes}</div>}
                          {p.submitted_at && <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>Inviato il {new Date(p.submitted_at).toLocaleDateString("it-IT")}</div>}
                        </div>
                        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                          {p.receipt_file && (
                            <a href="#" onClick={async e => { e.preventDefault(); const { data } = await supabase.storage.from("pagamenti").createSignedUrl(p.receipt_file, 60); if (data) window.open(data.signedUrl, "_blank"); }} style={{ background: "rgba(74,158,255,0.15)", color: "#4a9eff", border: "1px solid #4a9eff", borderRadius: 8, padding: "7px 12px", cursor: "pointer", fontSize: 11, textDecoration: "none" }}>📄 Vedi ricevuta</a>
                          )}
                          <button onClick={() => setExpanded(!expanded)} style={{ background: "rgba(218,165,32,0.15)", color: "#daa520", border: "1px solid #daa520", borderRadius: 8, padding: "7px 12px", cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>✏️ Verifica</button>
                        </div>
                      </div>
                      {expanded && (
                        <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #2a2a1a" }}>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                            <div>
                              <label style={{ display: "block", fontSize: 11, color: "#777", marginBottom: 4 }}>IMPORTO CORRETTO (€)</label>
                              <input type="number" value={verifyAmount} onChange={e => setVerifyAmount(e.target.value)} style={{ width: "100%", background: "#0d0d0d", border: "1px solid #2a2a1a", borderRadius: 8, padding: "8px 12px", color: "#e8e0d0", fontFamily: "inherit", fontSize: 13, boxSizing: "border-box" }} />
                            </div>
                            <div>
                              <label style={{ display: "block", fontSize: 11, color: "#777", marginBottom: 4 }}>NOTE (opzionale)</label>
                              <input value={verifyNote} onChange={e => setVerifyNote(e.target.value)} placeholder="Es: importo errato, differenza €5" style={{ width: "100%", background: "#0d0d0d", border: "1px solid #2a2a1a", borderRadius: 8, padding: "8px 12px", color: "#e8e0d0", fontFamily: "inherit", fontSize: 13, boxSizing: "border-box" }} />
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button onClick={async () => { await supabase.from("payments").update({ status: "paid", amount: Number(verifyAmount), receipt_note: verifyNote, verified_by: "admin", paid_at: new Date().toISOString() }).eq("id", p.id); await onReload(); }} style={{ flex: 1, background: "rgba(34,197,94,0.2)", color: "#22c55e", border: "1px solid #22c55e", borderRadius: 8, padding: "10px", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "inherit" }}>✓ Approva e registra in bilancio</button>
                            <button onClick={() => { const a = athletes.find(x => x.id === p.athlete_id); generateReceipt(p, a); }} style={{ background: "rgba(218,165,32,0.15)", color: "#daa520", border: "1px solid #daa520", borderRadius: 8, padding: "10px 14px", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>🖨️ Ricevuta</button>
                            <button onClick={async () => { await supabase.from("payments").update({ status: "rejected", receipt_note: verifyNote }).eq("id", p.id); await onReload(); }} style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid #ef4444", borderRadius: 8, padding: "10px 16px", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>✗ Rifiuta</button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* Da pagare */}
          {unpaid.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 13, color: "#ef4444", fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ background: "#ef4444", color: "#fff", borderRadius: 99, padding: "2px 10px", fontSize: 11 }}>{unpaid.length}</span>
                Non hanno ancora pagato {MONTHS_IT[selMonth-1]} {selYear}
              </div>
              {unpaid.map(a => {
                const family = calcFamilyTotal(a, athletes);
                const annualeOk = annualPaidIds.has(a.id) || (a.parent_athlete_id && annualPaidIds.has(a.parent_athlete_id));
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
                    <button onClick={() => generateReceipt(p, a)} style={{ background: "rgba(74,158,255,0.15)", color: "#4a9eff", border: "1px solid #4a9eff", borderRadius: 8, padding: "7px 12px", cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>📄 Ricevuta</button>
                  </div>
                );
              })}
            </div>
          )}

          {mainAthletes.length === 0 && <div style={{ textAlign: "center", padding: 60, color: "#555" }}>Nessun atleta approvato.</div>}
          {/* Volontari */}
          {mainAthletes.filter(a => a.is_volunteer).length > 0 && (
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 13, color: "#22c55e", fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ background: "#22c55e", color: "#fff", borderRadius: 99, padding: "2px 10px", fontSize: 11 }}>{mainAthletes.filter(a => a.is_volunteer).length}</span>
                Volontari — esonero quota mensile
              </div>
              {mainAthletes.filter(a => a.is_volunteer).map(a => (
                <div key={a.id} style={{ background: "#1a1a0e", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 12, padding: "14px 18px", marginBottom: 8, display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: "#e8e0d0", fontSize: 14 }}>{a.first_name} {a.last_name}</div>
                    <div style={{ fontSize: 11, color: "#777", marginTop: 2 }}>{a.course} · {a.location}</div>
                  </div>
                  <span style={{ fontSize: 12, color: "#22c55e", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 99, padding: "3px 12px" }}>🤝 Esonero quota</span>
                  {!annualPaidIds.has(a.id) && (
                    <button onClick={() => { setShowPayModal(a); setPayForm({ type: "annuale", month: selMonth, year: selYear, amount: 35, note: "Tessera annuale volontario" }); }} style={{ background: "rgba(218,165,32,0.15)", color: "#daa520", border: "1px solid #daa520", borderRadius: 8, padding: "7px 12px", cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>🎫 Tessera €35</button>
                  )}
                  {annualPaidIds.has(a.id) && <span style={{ fontSize: 11, color: "#22c55e" }}>✓ Tessera pagata</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* STORICO */}
      {activeView === "storico" && (
        <div>
          <div style={{ background: "#1a1a0e", border: "1px solid #2a2a1a", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #2a2a1a", fontSize: 13, color: "#888" }}>
              Tutti i pagamenti registrati — {selYear}
            </div>
            {payments.filter(p => p.period_year === selYear && p.status === "paid" && (!paySearch || (() => { const a = athletes.find(x => x.id === p.athlete_id); return a && `${a.first_name} ${a.last_name}`.toLowerCase().includes(paySearch.toLowerCase()); })())).length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: "#555" }}>Nessun pagamento per {selYear}.</div>
            ) : payments.filter(p => p.period_year === selYear && p.status === "paid" && (!paySearch || (() => { const a = athletes.find(x => x.id === p.athlete_id); return a && `${a.first_name} ${a.last_name}`.toLowerCase().includes(paySearch.toLowerCase()); })())).sort((a,b) => new Date(b.paid_at) - new Date(a.paid_at)).map(p => {
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


// ============================================================
// COMPONENTE PRESENZE
// ============================================================
const COURSE_OPTIONS = {
  "Argenta": ["Karate Bambini", "Karate Adulti"],
  "S.M. Codifiume": ["Karate Bambini", "Karate Adulti", "Psicomotricità"],
};

