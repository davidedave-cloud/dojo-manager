import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const DEFAULT_PASSWORD = 'Cinquecerchikarate';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, fiscalCode } = req.body;
  if (!email || !fiscalCode) {
    return res.status(400).json({ success: false, error: 'Email e codice fiscale obbligatori.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedCF = fiscalCode.trim().toUpperCase();

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Cerca atleta per email
  const { data: athletes } = await supabase
    .from('athletes')
    .select('id, first_name, email, user_id, is_minor, parent_athlete_id, fiscal_code, parent_cf')
    .ilike('email', normalizedEmail);

  const athlete = athletes && athletes.length > 0 ? athletes[0] : null;

  if (!athlete) {
    return res.status(200).json({
      success: false,
      error: 'Email non trovata. Usa la stessa email che hai fornito in segreteria.'
    });
  }

  // Minorenne o familiare → verifica CF genitore, adulto → verifica CF proprio
  const isMinorOrFamily = athlete.is_minor || athlete.parent_athlete_id;
  const cfToCheck = isMinorOrFamily ? athlete.parent_cf : athlete.fiscal_code;

  if (!cfToCheck) {
    return res.status(200).json({
      success: false,
      error: 'Codice fiscale non presente nel sistema. Contatta la segreteria.'
    });
  }

  if (cfToCheck.toUpperCase() !== normalizedCF) {
    return res.status(200).json({
      success: false,
      error: 'Codice fiscale non corretto. Riprova o contatta la segreteria.'
    });
  }

  // CF ok — ha già account?
  if (athlete.user_id) {
    return res.status(200).json({
      success: false,
      error: 'Hai già un account. Usa il pulsante Accedi. Se non ricordi la password, usa "Password dimenticata?".'
    });
  }

  // Crea account Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: normalizedEmail,
    password: DEFAULT_PASSWORD,
    email_confirm: true,
  });

  if (authError) {
    if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
      return res.status(200).json({
        success: false,
        error: 'Esiste già un account con questa email ma non collegato al profilo. Contatta la segreteria.'
      });
    }
    return res.status(500).json({ success: false, error: 'Errore: ' + authError.message });
  }

  // Collega account all'atleta
  await supabase.from('athletes').update({ user_id: authData.user.id }).eq('id', athlete.id);

  return res.status(200).json({ success: true, firstName: athlete.first_name });
}
