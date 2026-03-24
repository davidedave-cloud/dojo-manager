import { createClient } from '@supabase/supabase-js';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const IBAN = 'IT77H0707236640000000760891';
const ASS_NAME = 'Cinque Cerchi ASD';
const ASS_EMAIL = 'cinquecerchikaratedo@gmail.com';

const MONTHLY_FEES = {
  'Karate Adulti-8': 50, 'Karate Adulti-4': 35,
  'Karate Bambini-8': 50, 'Karate Bambini-4': 35,
  'Psicomotricità-8': 40, 'Psicomotricità-4': 25,
};
const FAMILY_DISCOUNTS = { 1: 0, 2: 10, 3: 15, 4: 20 };
const MONTHS_IT = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];

function getMonthlyFee(athlete) {
  const lessons = athlete.lessons_per_month || 8;
  const key = `${athlete.course}-${lessons}`;
  return MONTHLY_FEES[key] || 50;
}

function calcFamilyTotal(mainAthlete, allAthletes) {
  const members = [mainAthlete, ...allAthletes.filter(a => a.parent_athlete_id === mainAthlete.id)];
  // Sconto famiglia solo per chi fa 8 lezioni/mese
  const membersEight = members.filter(m => (m.lessons_per_month || 8) === 8);
  const membersFour = members.filter(m => (m.lessons_per_month || 8) === 4);
  const totalEight = membersEight.reduce((s, m) => s + getMonthlyFee(m), 0);
  const totalFour = membersFour.reduce((s, m) => s + getMonthlyFee(m), 0);
  const discountPct = membersEight.length > 1 ? (FAMILY_DISCOUNTS[Math.min(membersEight.length, 4)] || 20) : 0;
  const discount = Math.round(totalEight * discountPct / 100);
  const total = totalEight + totalFour;
  const final = totalEight - discount + totalFour;
  return { members, total, discount, final, discountPct };
}

function buildEmailHtml(athlete, amount, monthLabel, year, familyInfo) {
  const familyNote = familyInfo.members.length > 1
    ? `<p style="font-size:13px;color:#888;margin:0 0 16px;">Quota famiglia (${familyInfo.members.length} membri, sconto ${familyInfo.discountPct}%): totale €${familyInfo.total} - sconto €${familyInfo.discount} = <strong style="color:#b8860b;">€${amount}</strong></p>`
    : '';

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:Georgia,serif;">
  <div style="max-width:520px;margin:32px auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e0d8c8;">
    
    <div style="background:#1a1408;padding:28px 32px;text-align:center;">
      <div style="font-size:36px;margin-bottom:8px;">🥋</div>
      <div style="font-size:18px;font-weight:700;color:#daa520;letter-spacing:0.08em;">${ASS_NAME.toUpperCase()}</div>
      <div style="font-size:11px;color:#888;margin-top:4px;letter-spacing:0.15em;text-transform:uppercase;">Promemoria quota mensile</div>
    </div>

    <div style="padding:28px 32px;">
      <p style="font-size:15px;color:#1a1a1a;margin:0 0 8px;">Ciao <strong>${athlete.first_name}</strong>,</p>
      <p style="font-size:14px;color:#555;line-height:1.7;margin:0 0 24px;">
        Ti ricordiamo che la quota di <strong>${monthLabel} ${year}</strong> non risulta ancora pagata. 
        Puoi effettuare il bonifico quando vuoi entro fine mese.
      </p>

      ${familyNote}

      <div style="background:#f9f6f0;border-radius:8px;padding:16px 20px;margin-bottom:20px;">
        <div style="font-size:11px;color:#888;margin-bottom:12px;text-transform:uppercase;letter-spacing:0.08em;">Dettagli pagamento</div>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="font-size:13px;color:#888;padding:6px 0;border-bottom:1px solid #ece8e0;">Corso</td><td style="font-size:13px;font-weight:600;color:#1a1a1a;text-align:right;padding:6px 0;border-bottom:1px solid #ece8e0;">${athlete.course} · ${athlete.lessons_per_month || 8} lezioni/mese</td></tr>
          <tr><td style="font-size:13px;color:#888;padding:6px 0;border-bottom:1px solid #ece8e0;">Sede</td><td style="font-size:13px;font-weight:600;color:#1a1a1a;text-align:right;padding:6px 0;border-bottom:1px solid #ece8e0;">${athlete.location}</td></tr>
          <tr><td style="font-size:13px;color:#888;padding:6px 0;border-bottom:1px solid #ece8e0;">Intestatario</td><td style="font-size:13px;font-weight:600;color:#1a1a1a;text-align:right;padding:6px 0;border-bottom:1px solid #ece8e0;">${ASS_NAME}</td></tr>
          <tr><td style="font-size:13px;color:#888;padding:6px 0;border-bottom:1px solid #ece8e0;">IBAN</td><td style="font-size:12px;font-weight:600;color:#1a1a1a;text-align:right;padding:6px 0;border-bottom:1px solid #ece8e0;font-family:monospace;">${IBAN}</td></tr>
          <tr><td style="font-size:14px;font-weight:700;color:#1a1a1a;padding:12px 0 0;">Importo</td><td style="font-size:22px;font-weight:700;color:#b8860b;text-align:right;padding:12px 0 0;">€${amount},00</td></tr>
        </table>
      </div>

      <div style="background:#fffbf0;border:1px solid #daa520;border-radius:8px;padding:12px 16px;margin-bottom:24px;">
        <p style="font-size:13px;color:#7a5a00;margin:0;line-height:1.6;">
          Nella causale scrivi: <strong>Quota ${monthLabel} ${year} — ${athlete.first_name} ${athlete.last_name}</strong>
        </p>
      </div>

      <p style="font-size:13px;color:#888;line-height:1.7;margin:0;">
        Non hai partecipato questo mese? Nessun problema, puoi ignorare questa email. 
        Per qualsiasi domanda contattaci rispondendo a questo messaggio.
      </p>
    </div>

    <div style="background:#f5f2ec;padding:16px 32px;text-align:center;border-top:1px solid #e8e0d0;">
      <p style="font-size:12px;color:#999;margin:0;">${ASS_NAME} · ${ASS_EMAIL}</p>
    </div>
  </div>
</body>
</html>`;
}

export default async function handler(req, res) {
  // Verifica che la chiamata venga da Vercel Cron
  const authHeader = req.headers['authorization'];
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const monthLabel = MONTHS_IT[month - 1];

  // Prendi tutti gli atleti approvati (non familiari)
  const { data: athletes } = await supabase
    .from('athletes')
    .select('*')
    .eq('status', 'approved')
    .is('parent_athlete_id', null);

  if (!athletes?.length) return res.json({ sent: 0, message: 'Nessun atleta' });

  // Prendi i pagamenti del mese corrente
  const { data: monthPayments } = await supabase
    .from('payments')
    .select('athlete_id')
    .eq('period_month', month)
    .eq('period_year', year)
    .eq('status', 'paid');

  const paidIds = new Set((monthPayments || []).map(p => p.athlete_id));

  // Filtra chi non ha pagato e ha una email valida
  const unpaid = athletes.filter(a =>
    !paidIds.has(a.id) &&
    a.email &&
    !a.email.includes('@dojo.local')
  );

  let sent = 0;
  const logs = [];

  for (const athlete of unpaid) {
    const family = calcFamilyTotal(athlete, athletes);
    const amount = family.final;
    const html = buildEmailHtml(athlete, amount, monthLabel, year, family);

    // Manda email via Resend
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `${ASS_NAME} <onboarding@resend.dev>`,
        to: athlete.email,
        subject: `Promemoria quota ${monthLabel} ${year} — ${ASS_NAME}`,
        html,
      }),
    });

    const status = emailRes.ok ? 'sent' : 'error';
    sent += emailRes.ok ? 1 : 0;

    // Salva log nel database
    logs.push({
      athlete_id: athlete.id,
      email_to: athlete.email,
      subject: `Promemoria quota ${monthLabel} ${year}`,
      type: 'promemoria_25',
      month,
      year,
      status,
    });
  }

  if (logs.length > 0) {
    await supabase.from('email_logs').insert(logs);
  }

  return res.json({ sent, total: unpaid.length, month: monthLabel, year });
}
