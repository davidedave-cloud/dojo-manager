import React, { useState } from "react";
import { inputStyle } from "./adminConstants.js";

export default function BachecaTab({ news, supabase, onReload, athletes }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", important: false });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  async function saveNews() {
    if (!form.title || !form.body) return;
    setSaving(true);
    await supabase.from("news").insert({
      title: form.title,
      body: form.body,
      important: form.important,
      published_at: new Date().toISOString(),
    });
    await onReload();
    setForm({ title: "", body: "", important: false });
    setShowForm(false);
    setSaving(false);
  }

  async function deleteNews(id) {
    setDeleting(id);
    await supabase.from("news").delete().eq("id", id);
    await onReload();
    setDeleting(null);
  }

  const iS = { width: "100%", background: "#0d0d0d", border: "1px solid #2a2a1a", borderRadius: 8, padding: "10px 12px", color: "#e8e0d0", fontFamily: "inherit", fontSize: 13, boxSizing: "border-box" };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ color: "#daa520", fontSize: 22 }}>📢 Bacheca Comunicazioni</h2>
        <button onClick={() => setShowForm(!showForm)} style={{ background: showForm ? "#2a2a1a" : "linear-gradient(135deg,#b8860b,#daa520)", color: showForm ? "#888" : "#0d0d0d", border: "1px solid #b8860b", borderRadius: 8, padding: "10px 20px", cursor: "pointer", fontWeight: 700, fontSize: 13, fontFamily: "inherit" }}>
          {showForm ? "Annulla" : "+ Nuova Comunicazione"}
        </button>
      </div>

      {showForm && (
        <div style={{ background: "#1a1a0e", border: "1px solid #b8860b", borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", fontSize: 11, color: "#777", marginBottom: 4, textTransform: "uppercase" }}>Titolo *</label>
            <input style={iS} value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Es: Chiusura per festività..." />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 11, color: "#777", marginBottom: 4, textTransform: "uppercase" }}>Testo *</label>
            <textarea style={{ ...iS, height: 100, resize: "vertical" }} value={form.body} onChange={e => setForm(p => ({ ...p, body: e.target.value }))} placeholder="Scrivi il messaggio per gli atleti..." />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
              <input type="checkbox" checked={form.important} onChange={e => setForm(p => ({ ...p, important: e.target.checked }))} style={{ width: 18, height: 18, accentColor: "#ef4444" }} />
              <span style={{ fontSize: 13, color: "#e8e0d0" }}>⚡ Segna come IMPORTANTE (appare in rosso)</span>
            </label>
            <button onClick={saveNews} disabled={saving || !form.title || !form.body} style={{ background: "linear-gradient(135deg,#b8860b,#daa520)", color: "#0d0d0d", border: "none", borderRadius: 8, padding: "10px 24px", cursor: "pointer", fontWeight: 700, fontSize: 13, fontFamily: "inherit", opacity: saving || !form.title || !form.body ? 0.6 : 1 }}>
              {saving ? "Pubblicando..." : "✓ Pubblica"}
            </button>
          </div>
        </div>
      )}

      {news.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "#555" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📢</div>
          <div>Nessuna comunicazione. Clicca "+ Nuova Comunicazione" per iniziare!</div>
        </div>
      ) : news.map(n => (
        <div key={n.id} style={{ background: "#1a1a0e", border: `1px solid ${n.important ? "#b91c1c" : "#2a2a1a"}`, borderRadius: 12, padding: 24, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                {n.important && <span style={{ background: "#b91c1c", color: "#fff", fontSize: 10, padding: "2px 8px", borderRadius: 10, fontWeight: 700 }}>⚡ IMPORTANTE</span>}
                <h3 style={{ color: "#e8e0d0", fontSize: 16, margin: 0 }}>{n.title}</h3>
              </div>
              <p style={{ color: "#999", fontSize: 14, margin: 0, lineHeight: 1.6 }}>{n.body}</p>
              <div style={{ fontSize: 11, color: "#555", marginTop: 8 }}>Pubblicata il {new Date(n.published_at).toLocaleDateString("it-IT")} · visibile a tutti gli atleti</div>
            </div>
            <button onClick={() => deleteNews(n.id)} disabled={deleting === n.id} style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 6, padding: "6px 12px", cursor: "pointer", fontSize: 11, fontFamily: "inherit", marginLeft: 16, flexShrink: 0 }}>
              {deleting === n.id ? "..." : "🗑️ Elimina"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}



// ============================================================
// COMPONENTE RISORSE
// ============================================================
