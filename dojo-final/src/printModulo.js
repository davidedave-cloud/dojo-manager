// Funzione per generare e stampare il modulo di tesseramento
// Da importare in AdminPanel.jsx e AthletePortal.jsx

export function printModuloTesseramento(athlete, stagione = "2025/2026") {
  const isMinore = athlete.is_minor;
  const nome = athlete.first_name || "";
  const cognome = athlete.last_name || "";
  const luogoNascita = athlete.birth_place || "";
  const provNascita = athlete.birth_province || "";
  const dataNascita = athlete.birth_date ? new Date(athlete.birth_date).toLocaleDateString("it-IT") : "";
  const nazione = athlete.birth_country || "Italia";
  const cf = athlete.fiscal_code || "";
  const residenza = athlete.city || "";
  const via = athlete.address || "";
  const cap = athlete.zip || "";
  const email = athlete.email?.includes("@dojo.local") ? "" : (athlete.email || "");
  const cell = athlete.mobile || "";
  const corso = athlete.course || "";
  const sede = athlete.location || "";

  // Dati genitore (per minorenni)
  const parentName = athlete.parent_name || "";
  const parentPhone = athlete.parent_phone || "";
  const parentEmail = athlete.parent_email || "";

  const titoloModulo = isMinore
    ? `Modulo di Tesseramento ${stagione} – MINORI`
    : `Modulo di Tesseramento ${stagione} – ADULTI`;

  const html = `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<title>${titoloModulo} — ${nome} ${cognome}</title>
<style>
  @page { size: A4; margin: 12mm 18mm 12mm 18mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 9pt; color: #000; background: #fff; }
  .page { page-break-after: always; padding: 0; }
  .page:last-child { page-break-after: avoid; }
  .header { text-align: center; margin-bottom: 6px; }
  .logo { font-size: 18pt; font-weight: bold; color: #1a6bbf; letter-spacing: 2px; }
  .titolo { font-size: 12pt; font-weight: bold; color: #1a6bbf; margin: 4px 0 2px; }
  .sottotitolo { font-size: 8pt; font-style: italic; margin-bottom: 6px; }
  .num-iscrizione { text-align: right; font-size: 8pt; margin-bottom: 4px; }
  .intestazione { text-align: center; margin: 5px 0 7px; font-size: 9pt; }
  .riga { display: flex; align-items: flex-end; margin-bottom: 5px; gap: 6px; }
  .label { font-size: 9pt; white-space: nowrap; flex-shrink: 0; }
  .campo { flex: 1; border-bottom: 1px solid #000; min-width: 40px; padding-bottom: 1px; font-size: 10pt; }
  .campo-fisso { border-bottom: 1px solid #000; font-size: 10pt; padding-bottom: 1px; }
  .sezione { margin: 7px 0 4px; text-align: center; font-size: 9pt; font-weight: bold; }
  .testo { font-size: 8pt; line-height: 1.4; margin-bottom: 4px; text-align: justify; }
  .firma-riga { display: flex; justify-content: flex-end; margin: 5px 0 4px; gap: 8px; align-items: flex-end; }
  .firma-label { font-size: 9pt; white-space: nowrap; }
  .firma-linea { border-bottom: 1px solid #000; width: 220px; }
  .consenso-blocco { margin: 5px 0; }
  .consenso-riga { display: flex; align-items: center; gap: 16px; margin: 2px 0; }
  .checkbox-gruppo { display: flex; align-items: center; gap: 6px; }
  .checkbox { display: inline-block; width: 12px; height: 12px; border: 1px solid #000; vertical-align: middle; flex-shrink: 0; }
  .dichiaro-inoltre { font-weight: bold; text-align: center; margin: 5px 0 3px; font-size: 9pt; }
  hr { border: none; border-top: 1px solid #ccc; margin: 8px 0; }
  
  /* Pagina 2 - Regolamento */
  .reg-titolo { text-align: center; font-size: 12pt; font-weight: bold; text-decoration: underline; margin: 10px 0 8px; }
  .reg-sezione { font-weight: bold; text-align: center; margin: 8px 0 4px; font-size: 9.5pt; }
  .reg-testo { font-size: 8.5pt; line-height: 1.5; margin-bottom: 5px; text-align: justify; }
  .footer-dati { text-align: center; font-size: 7.5pt; margin-top: 8px; color: #444; }

  @media print {
    body { -webkit-print-color-adjust: exact; }
  }
</style>
</head>
<body>

<!-- PAGINA 1 -->
<div class="page">
  <div class="num-iscrizione">N° di iscrizione: _______________</div>
  
  <div class="header">
    <div class="logo">CINQUE CERCHI</div>
    <div style="font-size:8pt;color:#555;">S.S.D. a R.L.</div>
    <div class="titolo">${titoloModulo}</div>
    <div class="sottotitolo">(si prega di compilare in stampatello)</div>
  </div>

  <div class="intestazione">lo sottoscritto/a</div>

  ${isMinore ? `
  <!-- SEZIONE MINORE: dati del minore -->
  <div class="riga">
    <span class="label">Nome:</span><span class="campo">${nome}</span>
    <span class="label" style="margin-left:10px;">Cognome:</span><span class="campo">${cognome}</span>
  </div>
  <div class="riga">
    <span class="label">Luogo di Nascita:</span><span class="campo">${luogoNascita}</span>
    <span class="label">Prov.:</span><span class="campo-fisso" style="width:50px;">${provNascita}</span>
    <span class="label" style="margin-left:6px;">Data di nascita:</span><span class="campo">${dataNascita}</span>
  </div>
  <div class="riga">
    <span class="label">Nazione:</span><span class="campo">${nazione}</span>
    <span class="label" style="margin-left:10px;">Codice Fiscale:</span><span class="campo">${cf}</span>
  </div>
  <div class="riga">
    <span class="label">Residente a</span><span class="campo">${residenza}</span>
    <span class="label" style="margin-left:6px;">P.zza/Via</span><span class="campo">${via}</span>
    <span class="label">, n.</span><span class="campo-fisso" style="width:30px;"></span>
  </div>
  <div class="riga">
    <span class="label">CAP</span><span class="campo-fisso" style="width:50px;">${cap}</span>
    <span class="label" style="margin-left:10px;">E-mail:</span><span class="campo">${email}</span>
    <span class="label" style="margin-left:6px;">Cell.:</span><span class="campo">${cell}</span>
  </div>

  <div style="text-align:center;margin:8px 0 6px;font-size:9.5pt;">
    nella qualità di esercente la responsabilità [ ] genitoriale / [ ] tutoriale su
  </div>

  <!-- Dati genitore -->
  <div class="riga">
    <span class="label">Nome:</span><span class="campo">${parentName.split(' ').slice(0,-1).join(' ')}</span>
    <span class="label" style="margin-left:10px;">Cognome:</span><span class="campo">${parentName.split(' ').slice(-1).join(' ')}</span>
  </div>
  <div class="riga">
    <span class="label">Luogo di Nascita:</span><span class="campo"></span>
    <span class="label">Prov.:</span><span class="campo-fisso" style="width:50px;"></span>
    <span class="label" style="margin-left:6px;">Data di nascita:</span><span class="campo"></span>
  </div>
  <div class="riga">
    <span class="label">Nazione:</span><span class="campo">Italia</span>
    <span class="label" style="margin-left:10px;">Codice Fiscale:</span><span class="campo"></span>
  </div>
  <div class="riga">
    <span class="label">Residente a</span><span class="campo"></span>
    <span class="label" style="margin-left:6px;">P.zza/Via</span><span class="campo"></span>
    <span class="label">, n.</span><span class="campo-fisso" style="width:30px;"></span>
    <span class="label" style="margin-left:6px;">CAP</span><span class="campo-fisso" style="width:50px;"></span>
  </div>
  ` : `
  <!-- SEZIONE ADULTO -->
  <div class="riga">
    <span class="label">Nome:</span><span class="campo">${nome}</span>
    <span class="label" style="margin-left:10px;">Cognome:</span><span class="campo">${cognome}</span>
  </div>
  <div class="riga">
    <span class="label">Luogo di Nascita:</span><span class="campo">${luogoNascita}</span>
    <span class="label">Prov.:</span><span class="campo-fisso" style="width:50px;">${provNascita}</span>
    <span class="label" style="margin-left:6px;">Data di nascita:</span><span class="campo">${dataNascita}</span>
  </div>
  <div class="riga">
    <span class="label">Nazione:</span><span class="campo">${nazione}</span>
    <span class="label" style="margin-left:10px;">Codice Fiscale:</span><span class="campo">${cf}</span>
  </div>
  <div class="riga">
    <span class="label">Residente a</span><span class="campo">${residenza}</span>
    <span class="label" style="margin-left:6px;">P.zza/Via</span><span class="campo">${via}</span>
    <span class="label">, n.</span><span class="campo-fisso" style="width:30px;"></span>
  </div>
  <div class="riga">
    <span class="label">CAP</span><span class="campo-fisso" style="width:50px;">${cap}</span>
    <span class="label" style="margin-left:10px;">E-mail:</span><span class="campo">${email}</span>
    <span class="label" style="margin-left:6px;">Cell.:</span><span class="campo">${cell}</span>
  </div>
  `}

  <div class="sezione">chiedo</div>

  <div class="testo">
    • di essere ammesso/a in qualità di tesserato/a alla <strong>CINQUECERCHI S.S.D. a R.L.</strong>, confermando di aver preso visione dello Statuto e di condividerne le linee generali;<br>
    • di essere tesserato/a, per tramite di <strong>CINQUECERCHI S.S.D. a R.L.</strong>, presso <strong>${sede}</strong> - sede di <strong>${corso}</strong> - a cui <strong>CINQUECERCHI S.S.D. a R.L.</strong> è affiliata;
  </div>

  <div class="sezione">dichiaro</div>

  <div class="testo">
    • di aver preso visione e di accettare in ogni sua parte il Regolamento di <strong>CINQUECERCHI S.S.D. a R.L.</strong>;<br>
    • di aver preso visione delle quote di partecipazione proposte da <strong>CINQUECERCHI S.S.D. a R.L.</strong> per le proprie attività, impegnandomi ad adempiere a riguardo secondo le modalità previste;<br>
    • di godere di sana e robusta costituzione fisica e di essere idoneo alla pratica sportiva dilettantistica, nonché ad impegnarmi a consegnare e depositare presso la sede della società, entro l'inizio della pratica sportiva, la certificazione medica che attesti detta idoneità e sollevando <strong>CINQUECERCHI S.S.D. a R.L.</strong> da ogni responsabilità per l'eventuale mancato deposito della stessa certificazione e di <strong>impegnarmi altresì ad adempiere ad ogni prescrizione sanitaria e comportamentale</strong> eventualmente emanata dalle Autorità competenti di qualsivoglia ordine, grado e tipologia e/o dalla scrivente Società Sportiva, comprendendosi fra tali misure sia quelle in vigore alla data del presente tesseramento sia quelle che verranno eventualmente emanate in momento successivo, che saranno rese note a tesserati e avventori della struttura con le modalità ritenute più opportune nonché tramite i canali comunicativi istituzionali.
  </div>

  <div class="firma-riga">
    <span class="firma-label">Firma (LEGGIBILE)</span>
    <span class="firma-linea"></span>
  </div>

  <div class="dichiaro-inoltre">Dichiaro inoltre</div>

  <!-- Consenso 1 -->
  <div class="consenso-blocco">
    <div class="testo">• di aver visionato l'informativa privacy allegata e pertanto</div>
    <div class="consenso-riga">
      <div class="checkbox-gruppo"><span class="checkbox"></span><span style="font-size:9pt;">acconsento</span></div>
      <div class="checkbox-gruppo"><span class="checkbox"></span><span style="font-size:9pt;">non acconsento</span></div>
    </div>
    <div class="testo">che <strong>CINQUECERCHI S.S.D. a R.L.</strong> proceda al trattamento dei miei dati particolari (ex dati sensibili).</div>
    <div class="firma-riga">
      <span class="firma-label">Firma (LEGGIBILE)</span>
      <span class="firma-linea"></span>
    </div>
  </div>

  <!-- Consenso 2 -->
  <div class="consenso-blocco">
    <div class="testo">• di aver visionato l'informativa privacy allegata e pertanto</div>
    <div class="consenso-riga">
      <div class="checkbox-gruppo"><span class="checkbox"></span><span style="font-size:9pt;">acconsento</span></div>
      <div class="checkbox-gruppo"><span class="checkbox"></span><span style="font-size:9pt;">non acconsento</span></div>
    </div>
    <div class="testo">che <strong>CINQUECERCHI S.S.D. a R.L.</strong> proceda al trattamento dei dati per le finalità di cui al punto 3.a</div>
    <div class="firma-riga">
      <span class="firma-label">Firma (LEGGIBILE)</span>
      <span class="firma-linea"></span>
    </div>
  </div>

  <!-- Consenso 3 -->
  <div class="consenso-blocco">
    <div class="testo">• di aver visionato l'informativa privacy allegata e pertanto</div>
    <div class="consenso-riga">
      <div class="checkbox-gruppo"><span class="checkbox"></span><span style="font-size:9pt;">acconsento</span></div>
      <div class="checkbox-gruppo"><span class="checkbox"></span><span style="font-size:9pt;">non acconsento</span></div>
    </div>
    <div class="testo">che <strong>CINQUECERCHI S.S.D. a R.L.</strong> proceda al trattamento dei dati per le finalità di cui al punto 3.b</div>
    <div class="firma-riga">
      <span class="firma-label">Firma (LEGGIBILE)</span>
      <span class="firma-linea"></span>
    </div>
  </div>
</div>

<!-- PAGINA 2 - REGOLAMENTO -->
<div class="page">
  <div class="reg-titolo">REGOLAMENTO PER LA FRUIZIONE DEGLI SPAZI</div>

  <div class="reg-sezione">DOCUMENTAZIONE</div>
  <div class="reg-testo">È obbligatorio presentare il certificato medico entro la data di inizio della pratica sportiva.</div>

  <div class="reg-sezione">SOSPENSIONE ABBONAMENTI</div>
  <div class="reg-testo">Eventuali sospensioni si effettuano solo su esibizione di documento attestante la necessaria sospensione di attività fisica comprovante un'impossibilità fisica alla pratica sportiva o per motivazioni di lavoro che prevedano lunghi periodi di assenza comprovati.<br>
  Nessun rimborso potrà essere riconosciuto per parziale o totale mancata frequenza o per prestazioni non utilizzate di abbonamenti.<br>
  La quota associativa non è rimborsabile ne sospendibile per nessun motivo, come indicato da statuto.<br>
  Non è previsto alcun rimborso per quanto versato per gli abbonamenti o per il prolungamento della durata degli stessi nei giorni di chiusura del centro decisi dall'organo amministrativo della Società, a meno che non sia disposto e comunicato diversamente.</div>

  <div class="reg-sezione">COMPORTAMENTO</div>
  <div class="reg-testo">È vietato fumare in qualsiasi reparto del centro.<br>
  È vietato consumare cibi e bevande negli spazi del centro in cui ciò non sia espressamente previsto.<br>
  È obbligatorio un abbigliamento consono e rispettoso della sensibilità altrui, oltre all'uso di scarpe di ricambio pulite per accedere nelle zone fitness del centro. È richiesto l'uso di asciugamano da utilizzare sulle attrezzature del centro.</div>

  <div class="reg-sezione">SERVIZI</div>
  <div class="reg-testo">La Società mette a disposizione del tesserato gli armadietti ubicati all'interno degli spogliatoi, da chiudersi con lucchetto da parte del socio stesso; il tutto a meno che non siano in vigore misure che ne limitano o escludono l'uso.<br>
  La Società non si assume alcuna responsabilità per eventuali ammanchi, furti o danni. L'uso dell'armadietto è consentito solo durante la permanenza nel centro. La direzione si riserva il diritto di liberare gli armadietti lasciati chiusi dai tesserati al termine della giornata per ragioni di sicurezza.<br>
  L'orario di apertura e chiusura del centro ed eventuali variazioni occasionali sono rese note tramite apposite comunicazioni di segreteria.<br>
  Eventuali esigenze tecniche, organizzative ed amministrative potranno annullare, limitare o modificare il palinsesto corsi, l'orario di apertura/chiusura del centro nonché gli orari di servizio degli istruttori, previo avviso ai tesserati.<br>
  La direzione si riserva il diritto di sospendere o chiudere i corsi a sua insindacabile decisione, previo avviso ai tesserati.</div>

  <div class="reg-sezione">MISURE DI PREVENZIONE EVENTUALMENTE ADOTTATE</div>
  <div class="reg-testo">Per quanto concerne tali misure si fa rinvio alle relative normative vigenti di qualsivoglia ordine e grado nonché alle loro successive eventuali modifiche o integrazioni.</div>

  <div class="reg-sezione">IMPORTANTE</div>
  <div class="reg-testo">L'inosservanza di uno o più punti del presente regolamento e/o il mancato rispetto delle norme basilari della civile convivenza e dello sport, potrà comportare il diritto di CINQUECERCHI S.S.D. a R.L. di stabilire l'eventuale allontanamento del socio inadempiente, senza che per questo faccia maturare a suo vantaggio diritti alla restituzione di somme già versate.</div>

  <div style="margin-top:20px;text-align:right;font-size:9.5pt;">
    Mezzolara, lì .......................... Firma ...................................................<br>
    <span style="font-size:8pt;">(in caso di minore/soggetto tutelato, firma dell'esercente resp. genitoriale/tutore)</span>
  </div>

  <div class="footer-dati" style="margin-top:16px;">
    ***<br>
    CINQUECERCHI S.S.D. a R.L.<br>
    Affiliata a OPES<br>
    Tel. 051805484 - Sede Legale: Via Lumnca 2, 40054 - Mezzolara di Budrio (BO)<br>
    Mail: info@palamezzolara.com - PEC: palamezzolara@pec.it<br>
    C.F./P.IVA/N. Iscr. R.I.: 02638831202
  </div>
</div>

<script>window.onload = function() { window.print(); }</script>
</body>
</html>`;

  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
}
