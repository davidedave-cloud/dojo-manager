import React, { useState } from "react";
import { MONTHS_IT } from "./adminConstants.js";

export default function BilancioTab({ payments, expenses, supabase, onReload }) {
  const now = new Date();
  const [selYear, setSelYear] = useState(now.getFullYear());
  const [selMonth, setSelMonth] = useState(now.getMonth() + 1);


  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ category: "affitto", description: "", location: "Argenta", amount: "", month: now.getMonth() + 1, year: now.getFullYear(), notes: "" });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [deleting, setDeleting] = useState(null);
  const [activeView, setActiveView] = useState("mese"); // "mese" | "anno"

  const iS = { width: "100%", background: "#0d0d0d", border: "1px solid #2a2a1a", borderRadius: 8, padding: "10px 12px", color: "#e8e0d0", fontFamily: "inherit", fontSize: 13, boxSizing: "border-box" };

  // --- MESE ---
  const monthIncome = payments.filter(p => p.period_month === selMonth && p.period_year === selYear && p.status === "paid").reduce((s, p) => s + Number(p.amount), 0);
  const monthExpenses = expenses.filter(e => Number(e.period_month) === selMonth && Number(e.period_year) === selYear);
  const monthExpTotal = monthExpenses.reduce((s, e) => s + Number(e.amount), 0);
  const monthBalance = monthIncome - monthExpTotal;

  // --- ANNO ---
  const yearIncome = payments.filter(p => p.period_year === selYear && p.status === "paid").reduce((s, p) => s + Number(p.amount), 0);
  const yearExpenses = expenses.filter(e => Number(e.period_year) === selYear);
  const yearExpTotal = yearExpenses.reduce((s, e) => s + Number(e.amount), 0);
  const yearBalance = yearIncome - yearExpTotal;

  // Riepilogo mensile anno
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1;
    const inc = payments.filter(p => p.period_month === m && p.period_year === selYear && p.status === "paid").reduce((s, p) => s + Number(p.amount), 0);
    const exp = expenses.filter(e => Number(e.period_month) === m && Number(e.period_year) === selYear).reduce((s, e) => s + Number(e.amount), 0);
    return { month: m, label: MONTHS_IT[i].slice(0, 3), income: inc, expenses: exp, balance: inc - exp };
  });

  async function saveExpense() {
    if (!expenseForm.amount || !expenseForm.category) { setSaveError("Inserisci almeno categoria e importo."); return; }
    setSaving(true); setSaveError("");
    const { error } = await supabase.from("expenses").insert({
      amount: Number(expenseForm.amount),
      category: expenseForm.category,
      description: expenseForm.description || null,
      location: expenseForm.category === "affitto" ? expenseForm.location : null,
      period_month: Number(expenseForm.month),
      period_year: Number(expenseForm.year),
      notes: expenseForm.notes || null,
    });
    if (error) { setSaveError("Errore: " + error.message); setSaving(false); return; }
    await onReload();
    setShowExpenseForm(false);
    setExpenseForm({ category: "affitto", description: "", location: "Argenta", amount: "", month: now.getMonth() + 1, year: now.getFullYear(), notes: "" });
    setSaving(false);
  }

  async function deleteExpense(id) {
    setDeleting(id);
    await supabase.from("expenses").delete().eq("id", id);
    await onReload();
    setDeleting(null);
  }

  const catLabel = { affitto: "🏢 Affitto", stipendio: "💰 Stipendio", altro: "📦 Altro" };
  const catColor = { affitto: "#4a9eff", stipendio: "#c084fc", altro: "#888" };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ color: "#daa520", fontSize: 22 }}>💸 Bilancio</h2>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select value={selYear} onChange={e => setSelYear(Number(e.target.value))} style={{ background: "#1a1a0e", border: "1px solid #2a2a1a", borderRadius: 8, padding: "8px 12px", color: "#daa520", fontFamily: "inherit", fontSize: 13, fontWeight: 700 }}>
            {[2024, 2025, 2026, 2027].map(y => <option key={y}>{y}</option>)}
          </select>
          <button onClick={onReload} style={{ background: "#1a1a0e", color: "#888", border: "1px solid #2a2a1a", borderRadius: 8, padding: "10px 16px", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>🔄 Aggiorna</button>
          <button onClick={() => setShowExpenseForm(true)} style={{ background: "linear-gradient(135deg,#b8860b,#daa520)", color: "#0d0d0d", border: "none", borderRadius: 8, padding: "10px 20px", cursor: "pointer", fontWeight: 700, fontSize: 13, fontFamily: "inherit" }}>+ Nuova Uscita</button>
        </div>
      </div>

      {/* Vista toggle */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {[["mese", "📅 Mese"], ["anno", "📊 Anno"]].map(([v, label]) => (
          <button key={v} onClick={() => setActiveView(v)} style={{ background: activeView === v ? "linear-gradient(135deg,#b8860b,#daa520)" : "#1a1a0e", color: activeView === v ? "#0d0d0d" : "#888", border: "1px solid #2a2a1a", borderRadius: 8, padding: "8px 18px", cursor: "pointer", fontSize: 13, fontFamily: "inherit", fontWeight: activeView === v ? 700 : 400 }}>{label}</button>
        ))}
      </div>

      {/* VISTA MESE */}
      {activeView === "mese" && (
        <div>
          <div style={{ display: "flex", gap: 10, marginBottom: 24, alignItems: "center" }}>
            <select value={selMonth} onChange={e => setSelMonth(Number(e.target.value))} style={{ background: "#1a1a0e", border: "1px solid #2a2a1a", borderRadius: 8, padding: "10px 14px", color: "#daa520", fontFamily: "inherit", fontSize: 13, fontWeight: 700 }}>
              {MONTHS_IT.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
            </select>
          </div>

          {/* KPI mese */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 28 }}>
            <div style={{ background: "linear-gradient(135deg,#0d1a0d,#0a1a0a)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 12, color: "#22c55e", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>✅ Entrate</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#22c55e" }}>€{Number(monthIncome).toFixed(2)}</div>
              <div style={{ fontSize: 11, color: "#555", marginTop: 4 }}>Quote atleti {MONTHS_IT[selMonth-1]}</div>
            </div>
            <div style={{ background: "linear-gradient(135deg,#1a0d0d,#1a0a0a)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 12, color: "#ef4444", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>❌ Uscite</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#ef4444" }}>€{Number(monthExpTotal).toFixed(2)}</div>
              <div style={{ fontSize: 11, color: "#555", marginTop: 4 }}>{monthExpenses.length} voci</div>
            </div>
            <div style={{ background: monthBalance >= 0 ? "linear-gradient(135deg,#0d1a0d,#0a1a0a)" : "linear-gradient(135deg,#1a0d0d,#1a0a0a)", border: `1px solid ${monthBalance >= 0 ? "rgba(218,165,32,0.4)" : "rgba(239,68,68,0.4)"}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 12, color: "#daa520", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>⚖️ Saldo</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: monthBalance >= 0 ? "#daa520" : "#ef4444" }}>{monthBalance >= 0 ? "+" : ""}€{Number(Math.abs(monthBalance)).toFixed(2)}</div>
              <div style={{ fontSize: 11, color: "#555", marginTop: 4 }}>{MONTHS_IT[selMonth-1]} {selYear}</div>
            </div>
          </div>

          {/* Uscite del mese */}
          <div style={{ background: "#1a1a0e", border: "1px solid #2a2a1a", borderRadius: 12, overflow: "hidden", marginBottom: 20 }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid #2a2a1a", fontSize: 13, color: "#888", fontWeight: 600 }}>
              Uscite {MONTHS_IT[selMonth-1]} {selYear}
            </div>
            {monthExpenses.length === 0 ? (
              <div style={{ textAlign: "center", padding: 32, color: "#555", fontSize: 13 }}>Nessuna uscita registrata per questo mese.</div>
            ) : monthExpenses.map(e => (
              <div key={e.id} style={{ display: "flex", alignItems: "center", padding: "14px 20px", borderBottom: "1px solid #141408", gap: 14 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#e8e0d0" }}>{catLabel[e.category] || e.category}{e.location ? ` — ${e.location}` : ""}</div>
                  {e.description && <div style={{ fontSize: 11, color: "#777", marginTop: 2 }}>{e.description}</div>}
                  {e.notes && <div style={{ fontSize: 11, color: "#555", marginTop: 1 }}>{e.notes}</div>}
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#ef4444" }}>-€{e.amount}</div>
                <button onClick={() => deleteExpense(e.id)} disabled={deleting === e.id} style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>
                  {deleting === e.id ? "..." : "🗑️"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VISTA ANNO */}
      {activeView === "anno" && (
        <div>
          {/* KPI anno */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 28 }}>
            <div style={{ background: "linear-gradient(135deg,#0d1a0d,#0a1a0a)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 12, color: "#22c55e", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>✅ Entrate {selYear}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#22c55e" }}>€{Number(yearIncome).toFixed(2)}</div>
            </div>
            <div style={{ background: "linear-gradient(135deg,#1a0d0d,#1a0a0a)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 12, color: "#ef4444", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>❌ Uscite {selYear}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#ef4444" }}>€{Number(yearExpTotal).toFixed(2)}</div>
            </div>
            <div style={{ background: yearBalance >= 0 ? "linear-gradient(135deg,#0d1a0d,#0a1a0a)" : "linear-gradient(135deg,#1a0d0d,#1a0a0a)", border: `1px solid ${yearBalance >= 0 ? "rgba(218,165,32,0.4)" : "rgba(239,68,68,0.4)"}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 12, color: "#daa520", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>⚖️ Saldo {selYear}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: yearBalance >= 0 ? "#daa520" : "#ef4444" }}>{yearBalance >= 0 ? "+" : ""}€{Number(Math.abs(yearBalance)).toFixed(2)}</div>
            </div>
          </div>

          {/* Tabella mese per mese */}
          <div style={{ background: "#1a1a0e", border: "1px solid #2a2a1a", borderRadius: 12, overflow: "hidden", marginBottom: 20 }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid #2a2a1a", fontSize: 13, color: "#888", fontWeight: 600 }}>
              Riepilogo mensile {selYear}
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #2a2a1a" }}>
                  {["Mese", "Entrate", "Uscite", "Saldo"].map(h => (
                    <th key={h} style={{ padding: "10px 20px", textAlign: h === "Mese" ? "left" : "right", fontSize: 11, color: "#777", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {monthlyData.map(m => (
                  <tr key={m.month} style={{ borderBottom: "1px solid #141408", opacity: m.income === 0 && m.expenses === 0 ? 0.4 : 1 }}>
                    <td style={{ padding: "12px 20px", fontSize: 13, color: "#e8e0d0", fontWeight: 600 }}>{MONTHS_IT[m.month-1]}</td>
                    <td style={{ padding: "12px 20px", textAlign: "right", fontSize: 13, color: "#22c55e", fontWeight: 600 }}>€{Number(m.income).toFixed(2)}</td>
                    <td style={{ padding: "12px 20px", textAlign: "right", fontSize: 13, color: m.expenses > 0 ? "#ef4444" : "#555" }}>€{Number(m.expenses).toFixed(2)}</td>
                    <td style={{ padding: "12px 20px", textAlign: "right", fontSize: 14, fontWeight: 700, color: m.balance >= 0 ? "#daa520" : "#ef4444" }}>{m.balance >= 0 ? "+" : ""}€{Number(Math.abs(m.balance)).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: "#141408", borderTop: "2px solid #2a2a1a" }}>
                  <td style={{ padding: "14px 20px", fontSize: 13, fontWeight: 700, color: "#daa520" }}>TOTALE</td>
                  <td style={{ padding: "14px 20px", textAlign: "right", fontSize: 14, fontWeight: 700, color: "#22c55e" }}>€{Number(yearIncome).toFixed(2)}</td>
                  <td style={{ padding: "14px 20px", textAlign: "right", fontSize: 14, fontWeight: 700, color: "#ef4444" }}>€{Number(yearExpTotal).toFixed(2)}</td>
                  <td style={{ padding: "14px 20px", textAlign: "right", fontSize: 15, fontWeight: 700, color: yearBalance >= 0 ? "#daa520" : "#ef4444" }}>{yearBalance >= 0 ? "+" : ""}€{Number(Math.abs(yearBalance)).toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Lista tutte le uscite anno */}
          <div style={{ background: "#1a1a0e", border: "1px solid #2a2a1a", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid #2a2a1a", fontSize: 13, color: "#888", fontWeight: 600 }}>
              Tutte le uscite {selYear}
            </div>
            {yearExpenses.length === 0 ? (
              <div style={{ textAlign: "center", padding: 32, color: "#555", fontSize: 13 }}>Nessuna uscita registrata per {selYear}.</div>
            ) : yearExpenses.sort((a, b) => a.period_month - b.period_month).map(e => (
              <div key={e.id} style={{ display: "flex", alignItems: "center", padding: "12px 20px", borderBottom: "1px solid #141408", gap: 14 }}>
                <div style={{ fontSize: 11, color: catColor[e.category] || "#888", background: `${catColor[e.category]}20`, border: `1px solid ${catColor[e.category]}`, borderRadius: 99, padding: "2px 10px", whiteSpace: "nowrap" }}>{catLabel[e.category] || e.category}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: "#e8e0d0" }}>{e.description || (e.location ? e.location : "—")}</div>
                  <div style={{ fontSize: 11, color: "#555", marginTop: 1 }}>{MONTHS_IT[e.period_month-1]} {e.period_year}</div>
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#ef4444" }}>-€{e.amount}</div>
                <button onClick={() => deleteExpense(e.id)} disabled={deleting === e.id} style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>
                  {deleting === e.id ? "..." : "🗑️"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL NUOVA USCITA */}
      {showExpenseForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#1a1a0e", border: "1px solid #b8860b", borderRadius: 16, padding: 32, width: 440, maxWidth: "90vw" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#daa520" }}>Nuova Uscita</div>
              <button onClick={() => setShowExpenseForm(false)} style={{ background: "none", border: "none", color: "#666", fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 11, color: "#777", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>Categoria</label>
              <div style={{ display: "flex", gap: 8 }}>
                {[["affitto", "🏢 Affitto"], ["stipendio", "💰 Stipendio"], ["altro", "📦 Altro"]].map(([val, label]) => (
                  <button key={val} onClick={() => setExpenseForm(p => ({ ...p, category: val }))} style={{ flex: 1, background: expenseForm.category === val ? "linear-gradient(135deg,#b8860b,#daa520)" : "#141408", color: expenseForm.category === val ? "#0d0d0d" : "#888", border: `1px solid ${expenseForm.category === val ? "#daa520" : "#2a2a1a"}`, borderRadius: 8, padding: "10px 6px", cursor: "pointer", fontSize: 12, fontFamily: "inherit", fontWeight: expenseForm.category === val ? 700 : 400 }}>{label}</button>
                ))}
              </div>
            </div>

            {expenseForm.category === "affitto" && (
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 11, color: "#777", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>Sede</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {["Argenta", "S.M. Codifiume"].map(loc => (
                    <button key={loc} onClick={() => setExpenseForm(p => ({ ...p, location: loc }))} style={{ flex: 1, background: expenseForm.location === loc ? "linear-gradient(135deg,#1E3A8A,#4a9eff)" : "#141408", color: expenseForm.location === loc ? "#fff" : "#888", border: `1px solid ${expenseForm.location === loc ? "#4a9eff" : "#2a2a1a"}`, borderRadius: 8, padding: "10px", cursor: "pointer", fontSize: 13, fontFamily: "inherit", fontWeight: expenseForm.location === loc ? 700 : 400 }}>{loc}</button>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginBottom: 14 }}><label style={{ display: "block", fontSize: 11, color: "#777", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>Descrizione (opzionale)</label><input style={iS} value={expenseForm.description} onChange={e => setExpenseForm(p => ({ ...p, description: e.target.value }))} placeholder="Es: Affitto marzo, Stipendio aprile..." /></div>

            <div style={{ marginBottom: 14 }}><label style={{ display: "block", fontSize: 11, color: "#777", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>Importo (€) *</label><input type="number" style={iS} value={expenseForm.amount} onChange={e => setExpenseForm(p => ({ ...p, amount: e.target.value }))} placeholder="0" /></div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, color: "#777", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>Mese</label>
                <select style={iS} value={expenseForm.month} onChange={e => setExpenseForm(p => ({ ...p, month: Number(e.target.value) }))}>
                  {MONTHS_IT.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, color: "#777", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>Anno</label>
                <select style={iS} value={expenseForm.year} onChange={e => setExpenseForm(p => ({ ...p, year: Number(e.target.value) }))}>
                  {[2024, 2025, 2026, 2027].map(y => <option key={y}>{y}</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}><label style={{ display: "block", fontSize: 11, color: "#777", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>Note (opzionale)</label><input style={iS} value={expenseForm.notes} onChange={e => setExpenseForm(p => ({ ...p, notes: e.target.value }))} placeholder="Note aggiuntive..." /></div>

            {saveError && <div style={{ color: "#ef4444", fontSize: 12, padding: "10px 14px", background: "rgba(239,68,68,0.08)", borderRadius: 8, border: "1px solid rgba(239,68,68,0.2)", marginBottom: 14 }}>⚠️ {saveError}</div>}

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={saveExpense} disabled={saving} style={{ flex: 1, background: "linear-gradient(135deg,#b8860b,#daa520)", color: "#0d0d0d", border: "none", borderRadius: 10, padding: 14, cursor: "pointer", fontWeight: 700, fontSize: 14, fontFamily: "inherit", opacity: saving ? 0.7 : 1 }}>
                {saving ? "Salvataggio..." : "✓ Salva Uscita"}
              </button>
              <button onClick={() => setShowExpenseForm(false)} style={{ background: "#2a2a1a", color: "#888", border: "1px solid #3a3a2a", borderRadius: 10, padding: "14px 20px", cursor: "pointer", fontFamily: "inherit" }}>Annulla</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

