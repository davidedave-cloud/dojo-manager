import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY; // service key segreta, mai esposta al browser

const DEFAULT_PASSWORD = 'Cinquecerchikarate';

export default async function handler(req, res) {
  // Solo POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email mancante' });
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Usa il client con service key — questo codice gira solo sul server Vercel
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // 1. Cerca l'atleta nel DB
  const { data: athletes } = await supabase
    .from('athletes')
    .select('id, first_name, email, user_id, status')
    .ilike('email', normalizedEmail);

  const athlete = athletes && athletes.length > 0 ? athletes[0] : null;

  if (!athlete) {
    // Non diciamo se l'email esiste o no per sicurezza
    return res.status(200).json({ 
      success: false, 
      error: 'Email non trovata. Usa la stessa email che hai fornito in segreteria.' 
    });
  }

  // 2. Se l'atleta ha già un user_id, l'account esiste già
  if (athlete.user_id) {
    return res.status(200).json({ 
      success: false, 
      error: 'Hai già un account. Usa il pulsante Accedi. Se non ricordi la password, usa "Password dimenticata?".' 
    });
  }

  // 3. Atleta esiste e non ha ancora account → crea account Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: normalizedEmail,
    password: DEFAULT_PASSWORD,
    email_confirm: true, // bypassa la verifica email
  });

  if (authError) {
    // Se l'utente auth esiste già ma non è collegato (caso Campi)
    if (authError.message.includes('already been registered') || authError.message.includes('already exists')) {
      return res.status(200).json({ 
        success: false, 
        error: 'Esiste già un account con questa email ma non è collegato al tuo profilo. Contatta la segreteria.' 
      });
    }
    return res.status(500).json({ error: 'Errore creazione account: ' + authError.message });
  }

  // 4. Collega l'auth user all'atleta
  await supabase
    .from('athletes')
    .update({ user_id: authData.user.id })
    .eq('id', athlete.id);

  return res.status(200).json({ 
    success: true, 
    firstName: athlete.first_name 
  });
}
