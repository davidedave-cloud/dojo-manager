import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const ONESIGNAL_APP_ID = 'c26d4ea3-dec2-4e31-af56-f42e338240f9';
const ONESIGNAL_API_KEY = process.env.ONESIGNAL_API_KEY;
const MONTHS_IT = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];

export default async function handler(req, res) {
  const authHeader = req.headers['authorization'];
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const monthLabel = MONTHS_IT[month - 1];
  const day = now.getDate();

  // Determina messaggio in base al giorno
  let title, message;
  if (day === 21) {
    title = '💶 Promemoria quota mensile';
    message = `La quota di ${monthLabel} non risulta ancora pagata. Puoi effettuare il bonifico quando vuoi.`;
  } else if (day === 25) {
    title = '⚠️ Quota mensile in scadenza';
    message = `Ricorda: la quota di ${monthLabel} non è ancora stata pagata. Mancano pochi giorni alla fine del mese.`;
  } else if (day === 30) {
    title = '🚨 Ultimo promemoria quota';
    message = `Oggi è l'ultimo giorno per pagare la quota di ${monthLabel}. Effettua il bonifico il prima possibile.`;
  } else {
    return res.json({ skipped: true, day });
  }

  // Prendi atleti approvati senza parent (titolari)
  const { data: athletes } = await supabase
    .from('athletes')
    .select('id, first_name, last_name, onesignal_id, email')
    .eq('status', 'approved')
    .is('parent_athlete_id', null)
    .not('onesignal_id', 'is', null);

  if (!athletes?.length) return res.json({ sent: 0, message: 'Nessun atleta con onesignal_id' });

  // Prendi pagamenti del mese corrente
  const { data: monthPayments } = await supabase
    .from('payments')
    .select('athlete_id')
    .eq('period_month', month)
    .eq('period_year', year)
    .eq('status', 'paid');

  const paidIds = new Set((monthPayments || []).map(p => p.athlete_id));

  // Filtra chi non ha pagato e ha onesignal_id
  const unpaid = athletes.filter(a => !paidIds.has(a.id) && a.onesignal_id);
  const playerIds = unpaid.map(a => a.onesignal_id);

  if (!playerIds.length) return res.json({ sent: 0, message: 'Tutti hanno pagato' });

  // Manda notifica push via OneSignal
  const pushRes = await fetch('https://onesignal.com/api/v1/notifications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${ONESIGNAL_API_KEY}`,
    },
    body: JSON.stringify({
      app_id: ONESIGNAL_APP_ID,
      include_player_ids: playerIds,
      headings: { it: title, en: title },
      contents: { it: message, en: message },
      url: 'https://dojo-manager-six.vercel.app',
    }),
  });

  const pushData = await pushRes.json();
  return res.json({ sent: playerIds.length, day, month: monthLabel, onesignal: pushData });
}
