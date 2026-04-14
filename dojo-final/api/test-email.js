import { createClient } from '@supabase/supabase-js';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

export default async function handler(req, res) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const { data: athlete } = await supabase
    .from('athletes')
    .select('*')
    .eq('email', 'm.stabe82@gmail.com')
    .single();

  if (!athlete) return res.json({ error: 'Atleta non trovato' });

  const emailRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: 'Cinque Cerchi ASD <onboarding@resend.dev>',
      to: athlete.email,
      subject: 'Test promemoria quota Aprile 2026 — Cinque Cerchi ASD',
      html: `<p>Ciao ${athlete.first_name}, questa è una email di test. Se la ricevi, il sistema funziona!</p>`,
    }),
  });

  const data = await emailRes.json();
  return res.json({ ok: emailRes.ok, data });
}
