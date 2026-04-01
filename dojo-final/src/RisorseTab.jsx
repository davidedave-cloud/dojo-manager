import React, { useState } from "react";

export default function RisorseTab({ resources, supabase, onReload }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", url: "" });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const iS = { width: "100%", background: "#0d0d0d", border: "1px solid #2a2a1a", borderRadius: 8, padding: "10px 12px", color: "#e8e0d0", fontFamily: "inherit", fontSize: 13, boxSizing: "border-box" };

  async function saveResource() {
    if (!form.title || !form.url) return;
    setSaving(true);
    await supabase.from("resources").insert({ title: form.title, description: form.description, url: form.url });
    await onReload();
    setForm({ title: "", description: "", url: "" });
    setShowForm(false);
    setSaving(false);
  }

  async function deleteResource(id) {
    setDeleting(id);
    await supabase.from("resources").delete().eq("id", id);
    await onReload();
    setDeleting(null);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ color: "#daa520", fontSize: 22 }}>📚 Risorse & Materiali</h2>
        <button onClick={() => setShowForm(!showForm)} style={{ background: showForm ? "#2a2a1a" : "linear-gradient(135deg,#b8860b,#daa520)", color: showForm ? "#888" : "#0d0d0d", border: "1px solid #b8860b", borderRadius: 8, padding: "10px 20px", cursor: "pointer", fontWeight: 700, fontSize: 13, fontFamily: "inherit" }}>
          {showForm ? "Annulla" : "+ Aggiungi Documento"}
        </button>
      </div>

      {showForm && (
        <div style={{ background: "#1a1a0e", border: "1px solid #b8860b", borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <div style={{ marginBottom: 12 }}><label style={{ display: "block", fontSize: 11, color: "#777", marginBottom: 4, textTransform: "uppercase" }}>Titolo *</label><input style={iS} value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Es: Regolamento del Dojo" /></div>
          <div style={{ marginBottom: 12 }}><label style={{ display: "block", fontSize: 11, color: "#777", marginBottom: 4, textTransform: "uppercase" }}>Descrizione</label><input style={iS} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Breve descrizione del documento" /></div>
          <div style={{ marginBottom: 16 }}><label style={{ display: "block", fontSize: 11, color: "#777", marginBottom: 4, textTransform: "uppercase" }}>URL del file *</label><input style={iS} value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))} placeholder="https://... (link Supabase Storage o Drive)" /></div>
          <div style={{ fontSize: 11, color: "#555", marginBottom: 16 }}>💡 Carica il PDF su Supabase → Storage → assets, poi incolla qui il link pubblico</div>
          <button onClick={saveResource} disabled={saving || !form.title || !form.url} style={{ background: "linear-gradient(135deg,#b8860b,#daa520)", color: "#0d0d0d", border: "none", borderRadius: 8, padding: "10px 24px", cursor: "pointer", fontWeight: 700, fontSize: 13, fontFamily: "inherit", opacity: saving || !form.title || !form.url ? 0.6 : 1 }}>
            {saving ? "Salvataggio..." : "✓ Pubblica"}
          </button>
        </div>
      )}

      {resources.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "#555" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📄</div>
          <div>Nessun documento. Clicca "+ Aggiungi Documento" per iniziare!</div>
        </div>
      ) : resources.map(r => (
        <div key={r.id} style={{ background: "#1a1a0e", border: "1px solid #2a2a1a", borderRadius: 12, padding: 20, marginBottom: 12, display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ fontSize: 28, flexShrink: 0 }}>📄</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#daa520" }}>{r.title}</div>
            {r.description && <div style={{ fontSize: 12, color: "#777", marginTop: 3 }}>{r.description}</div>}
            <div style={{ fontSize: 11, color: "#555", marginTop: 4 }}>{new Date(r.created_at).toLocaleDateString("it-IT")}</div>
          </div>
          <a href={r.url} target="_blank" rel="noopener noreferrer" style={{ background: "rgba(218,165,32,0.15)", color: "#daa520", border: "1px solid #daa520", borderRadius: 8, padding: "7px 14px", fontSize: 12, textDecoration: "none" }}>Apri →</a>
          <button onClick={() => deleteResource(r.id)} disabled={deleting === r.id} style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "7px 12px", cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>
            {deleting === r.id ? "..." : "🗑️"}
          </button>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// COMPONENTE ESAMI CINTURE
// ============================================================
// ============================================================
// COMPONENTE EVENTI (ex Esami Cinture)
// ============================================================
