// Costanti e componenti base del portale atleta
import React from "react";

import { useState, useEffect } from "react";
import { printModuloTesseramento } from "./printModulo.js";

export const BELT_COLORS = {
  "Bianca": "#f0ede6", "Bianca/Gialla": "#FFF176", "Gialla": "#FFD700", "Arancione": "#FF8C00",
  "Verde": "#228B22", "Blu": "#1E3A8A",
  "Marrone 3° Kyu": "#8B4513", "Marrone 2° Kyu": "#7a3a10", "Marrone 1° Kyu": "#6b2f0c",
  "Nera (1° Dan)": "#1a1a1a", "Nera (2° Dan)": "#1a1a1a", "Nera (3° Dan)": "#1a1a1a",
  "Nera (4° Dan)": "#1a1a1a", "Nera (5° Dan)": "#1a1a1a",
};
export const BELT_ORDER = Object.keys(BELT_COLORS);
export const COURSES = ["Karate Adulti", "Karate Bambini", "Psicomotricità"];
export const LOCATIONS = ["Argenta", "S.M. Codifiume"];
export const HOW_FOUND = ["Passaparola (amici/famiglia)", "Facebook / Instagram", "Google / Internet", "Volantino / Locandina", "Sono passato davanti alla palestra", "Scuola / Insegnante", "Altro"];
export const STEP_LABELS = ["Anagrafica", "Residenza & Contatti", "Corso", "Genitore", "Certificato", "Account"];
export const TOTAL_STEPS = 6;

export const emptyReg = {
  firstName: "", lastName: "", birthDate: "", birthPlace: "", birthProvince: "", birthCountry: "Italia", fiscalCode: "",
  address: "", city: "", zip: "", province: "",
  email: "", phone: "", mobile: "",
  course: "", location: "", belt: "Bianca",
  isMinor: false, parentName: "", parentPhone: "", parentEmail: "", parentFiscalCode: "",
  medicalExpiry: "", medicalFile: null,
  howFound: "", howFoundOther: "", notes: "",
  password: "", confirm: "",
  gdpr: false, gdprMarketing: false,
};

export const emptyMember = {
  firstName: "", lastName: "", birthDate: "", birthPlace: "", birthProvince: "", birthCountry: "Italia", fiscalCode: "",
  course: "", location: "", belt: "Bianca",
  medicalExpiry: "", notes: "", isMinor: false,
};

export const inputStyle = { width: "100%", background: "#0a0905", border: "1px solid #2a2010", borderRadius: 8, padding: "10px 14px", color: "#e8e0d0", fontFamily: "inherit", fontSize: 13, boxSizing: "border-box", outline: "none" };
export const labelStyle = { display: "block", fontSize: 11, color: "#8a7a6a", marginBottom: 5, letterSpacing: "0.08em", textTransform: "uppercase" };

export const SectionTitle = ({ icon, title }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "24px 0 14px", paddingBottom: 8, borderBottom: "1px solid #2a2010" }}>
    <span style={{ fontSize: 16 }}>{icon}</span>
    <span style={{ fontSize: 14, fontWeight: 700, color: "#daa520" }}>{title}</span>
  </div>
);

export const BeltBadge = ({ belt, large }) => {
  const isWhite = belt === "Bianca";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", background: BELT_COLORS[belt] || "#333", color: (isWhite || belt === "Bianca/Gialla" || belt === "Gialla" || belt === "Arancione") ? "#222" : "#fff", border: isWhite ? "1px solid #bbb" : "none", borderRadius: 99, padding: large ? "6px 18px" : "3px 12px", fontSize: large ? 14 : 11, fontWeight: 700 }}>{belt}</span>
  );
};

export const BeltProgress = ({ belt }) => {
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

export const StepIndicator = ({ step, total }) => (
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

