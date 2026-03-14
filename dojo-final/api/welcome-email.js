const RESEND_API_KEY = process.env.RESEND_API_KEY;
const IBAN = 'IT77H0707236640000000760891';
const ASS_NAME = 'Cinque Cerchi ASD';
const ASS_EMAIL = 'cinquecerchikaratedo@gmail.com';
const PORTAL_URL = 'https://dojo-manager-six.vercel.app';

const ORARI = {
  'Karate': {
    'Argenta': {
      indirizzo: 'Argenta GymH24, Via Nervi 4, Argenta (FE)',
      orari: [
        { giorno: 'Martedì', bambini: '17:15 – 18:15', adulti: '20:30 – 21:30' },
        { giorno: 'Venerdì', bambini: '17:15 – 18:15', adulti: '19:00 – 20:00' },
      ]
    },
    'S.M. Codifiume': {
      indirizzo: 'PalaCodifiume, Via Verga 16, S.M. Codifiume (FE)',
      orari: [
        { giorno: 'Lunedì', bambini: '17:00 – 18:00', adulti: '19:00 – 20:00' },
        { giorno: 'Giovedì', bambini: '17:00 – 18:00', adulti: '19:00 – 20:00' },
      ]
    }
  },
  'Psicomotricità': {
    'S.M. Codifiume': {
      indirizzo: 'PalaCodifiume, Via Verga 16, S.M. Codifiume (FE)',
      orari: [
        { giorno: 'Lunedì', orario: '18:00 – 18:45' },
        { giorno: 'Giovedì', orario: '18:00 – 18:45' },
      ]
    }
  }
};

function buildWelcomeEmail(athlete) {
  const isKarate = athlete.course?.startsWith('Karate');
  const isPsico = athlete.course === 'Psicomotricità';
  const location = athlete.location;
  const courseKey = isKarate ? 'Karate' : 'Psicomotricità';
  const sede = ORARI[courseKey]?.[location];
  const isAdult = !athlete.is_minor;
  const monthlyFee = athlete.monthly_fee || (isKarate ? 50 : 40);

  let orariHtml = '';
  if (sede) {
    if (isKarate) {
      orariHtml = sede.orari.map(o => `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #ece8e0;font-size:13px;color:#888;font-weight:600;">${o.giorno}</td>
          <td style="padding:8px 0;border-bottom:1px solid #ece8e0;font-size:13px;color:#1a1a1a;text-align:right;">
            ${athlete.is_minor ? `Bambini: <strong>${o.bambini}</strong>` : `Adulti: <strong>${o.adulti}</strong>`}
          </td>
        </tr>`).join('');
    } else {
      orariHtml = sede.orari.map(o => `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #ece8e0;font-size:13px;color:#888;font-weight:600;">${o.giorno}</td>
          <td style="padding:8px 0;border-bottom:1px solid #ece8e0;font-size:13px;color:#1a1a1a;text-align:right;"><strong>${o.orario}</strong></td>
        </tr>`).join('');
    }
  }

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:Georgia,serif;">
  <div style="max-width:540px;margin:32px auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e0d8c8;">
    
    <div style="background:#1a1408;padding:32px;text-align:center;">
      <div style="font-size:40px;margin-bottom:10px;">🥋</div>
      <div style="font-size:20px;font-weight:700;color:#daa520;letter-spacing:0.08em;">${ASS_NAME.toUpperCase()}</div>
      <div style="font-size:12px;color:#888;margin-top:6px;letter-spacing:0.2em;text-transform:uppercase;">Benvenuto nel Dojo</div>
    </div>

    <div style="padding:32px;">
      <h2 style="font-size:20px;color:#1a1a1a;margin:0 0 12px;">Ciao ${athlete.first_name}! 👋</h2>
      <p style="font-size:14px;color:#555;line-height:1.8;margin:0 0 24px;">
        La tua iscrizione a <strong>${athlete.course}</strong> presso la sede di <strong>${location}</strong> è stata approvata. 
        Siamo felici di averti con noi!
      </p>

      ${sede ? `
      <div style="background:#f9f6f0;border-radius:10px;padding:20px;margin-bottom:20px;">
        <div style="font-size:11px;color:#888;margin-bottom:14px;text-transform:uppercase;letter-spacing:0.1em;">📅 Orari delle lezioni</div>
        <table style="width:100%;border-collapse:collapse;">${orariHtml}</table>
        <div style="margin-top:14px;padding-top:12px;border-top:1px solid #ece8e0;">
          <div style="font-size:12px;color:#888;">📍 <strong style="color:#1a1a1a;">${sede.indirizzo}</strong></div>
        </div>
      </div>` : ''}

      <div style="background:#f9f6f0;border-radius:10px;padding:20px;margin-bottom:20px;">
        <div style="font-size:11px;color:#888;margin-bottom:14px;text-transform:uppercase;letter-spacing:0.1em;">💶 Primo pagamento</div>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="font-size:13px;color:#888;padding:6px 0;border-bottom:1px solid #ece8e0;">Quota mensile</td><td style="font-size:13px;font-weight:700;color:#b8860b;text-align:right;padding:6px 0;border-bottom:1px solid #ece8e0;">€${monthlyFee},00/mese</td></tr>
          <tr><td style="font-size:13px;color:#888;padding:6px 0;border-bottom:1px solid #ece8e0;">Tessera annuale (una tantum)</td><td style="font-size:13px;font-weight:700;color:#b8860b;text-align:right;padding:6px 0;border-bottom:1px solid #ece8e0;">€35,00</td></tr>
          <tr><td style="font-size:13px;color:#888;padding:6px 0;border-bottom:1px solid #ece8e0;">Intestatario</td><td style="font-size:13px;font-weight:600;color:#1a1a1a;text-align:right;padding:6px 0;border-bottom:1px solid #ece8e0;">${ASS_NAME}</td></tr>
          <tr><td style="font-size:13px;color:#888;padding:6px 0;">IBAN</td><td style="font-size:12px;font-weight:600;color:#1a1a1a;text-align:right;padding:6px 0;font-family:monospace;">${IBAN}</td></tr>
        </table>
        <div style="margin-top:14px;padding:10px 14px;background:#fffbf0;border:1px solid #daa520;border-radius:6px;">
          <p style="font-size:12px;color:#7a5a00;margin:0;">Causale: <strong>Prima quota + Tessera ${new Date().getFullYear()} — ${athlete.first_name} ${athlete.last_name}</strong></p>
        </div>
      </div>

      <div style="background:#f9f6f0;border-radius:10px;padding:20px;margin-bottom:24px;text-align:center;">
        <div style="font-size:11px;color:#888;margin-bottom:14px;text-transform:uppercase;letter-spacing:0.1em;">📋 Regolamento del Dojo</div>
        <p style="font-size:13px;color:#555;line-height:1.7;margin:0 0 16px;">Ti chiediamo di leggere il regolamento del dojo prima di iniziare. È importante per la convivenza e la sicurezza di tutti.</p>
        <a href="https://drive.google.com/file/d/1uHKn-AyzUPzH7pH7WaraJ9v6dqO0MP__/view?usp=sharing" style="display:inline-block;background:#1a1408;color:#daa520;text-decoration:none;border-radius:8px;padding:12px 28px;font-weight:700;font-size:13px;border:1px solid #b8860b;">
          📄 Leggi il Regolamento
        </a>
      </div>

      <div style="text-align:center;margin-bottom:8px;">
        <a href="${PORTAL_URL}" style="display:inline-block;background:linear-gradient(135deg,#b8860b,#daa520);color:#0d0d0d;text-decoration:none;border-radius:10px;padding:14px 40px;font-weight:700;font-size:15px;font-family:Georgia,serif;">
          Accedi al Portale Atleti →
        </a>
      </div>
      <div style="text-align:center;font-size:12px;color:#aaa;margin-bottom:8px;">Usa la tua email e la password scelta durante la registrazione</div>
    </div>

    <div style="background:#f5f2ec;padding:18px 32px;text-align:center;border-top:1px solid #e8e0d0;">
      <p style="font-size:12px;color:#999;margin:0;">${ASS_NAME} · <a href="mailto:${ASS_EMAIL}" style="color:#b8860b;">${ASS_EMAIL}</a></p>
      <p style="font-size:11px;color:#bbb;margin:4px 0 0;">精神統一 · SEISHIN TOITSU</p>
    </div>
  </div>
</body>
</html>`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers['authorization'];
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { athlete } = req.body;
  if (!athlete?.email || athlete.email.includes('@dojo.local')) {
    return res.json({ sent: false, reason: 'No valid email' });
  }

  const html = buildWelcomeEmail(athlete);

  const emailRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: `${ASS_NAME} <onboarding@resend.dev>`,
      to: athlete.email,
      subject: `Benvenuto in ${ASS_NAME}! La tua iscrizione è approvata 🥋`,
      html,
    }),
  });

  return res.json({ sent: emailRes.ok, status: emailRes.status });
}
