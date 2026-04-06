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

  // CASO 1: cerca atleta per email (atleti normali)
  const { data: athletes } = await supabase
    .from('athletes')
    .select('id, first_name, email, user_id, is_minor, parent_athlete_id, fiscal_code, parent_cf')
    .ilike('email', normalizedEmail);

  const athlete = athletes && athletes.length > 0 ? athletes[0] : null;

  if (athlete) {
    // Atleta trovato — verifica CF
    const isMinorOrFamily = athlete.is_minor || athlete.parent_athlete_id;
    const cfToCheck = isMinorOrFamily ? athlete.parent_cf : athlete.fiscal_code;

    if (!cfToCheck) {
      return res.status(200).json({ success: false, error: 'Codice fiscale non presente nel sistema. Contatta la segreteria.' });
    }
    if (cfToCheck.toUpperCase() !== normalizedCF) {
      return res.status(200).json({ success: false, error: 'Codice fiscale non corretto. Riprova o contatta la segreteria.' });
    }
    if (athlete.user_id) {
      return res.status(200).json({ success: false, error: 'Hai già un account. Usa il pulsante Accedi. Se non ricordi la password, usa "Password dimenticata?".' });
    }

    // Crea account e collega all'atleta
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: normalizedEmail, password: DEFAULT_PASSWORD, email_confirm: true,
    });
    if (authError) {
      if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
        return res.status(200).json({ success: false, error: 'Esiste già un account con questa email. Contatta la segreteria.' });
      }
      return res.status(500).json({ success: false, error: 'Errore: ' + authError.message });
    }
    await supabase.from('athletes').update({ user_id: authData.user.id }).eq('id', athlete.id);
    return res.status(200).json({ success: true, firstName: athlete.first_name });
  }

  // CASO 2: cerca come genitore referente (email nei figli come referente_email)
  const { data: figli } = await supabase
    .from('athletes')
    .select('id, first_name, last_name, fiscal_code, parent_cf, referente_email')
    .ilike('referente_email', normalizedEmail);

  if (!figli || figli.length === 0) {
    return res.status(200).json({ success: false, error: 'Email non trovata. Usa la stessa email che hai fornito in segreteria.' });
  }

  // Verifica CF: deve corrispondere al codice fiscale di uno dei figli
  const figlioCfMatch = figli.find(f => 
    (f.fiscal_code && f.fiscal_code.toUpperCase() === normalizedCF) ||
    (f.parent_cf && f.parent_cf.toUpperCase() === normalizedCF)
  );

  if (!figlioCfMatch) {
    return res.status(200).json({ success: false, error: 'Codice fiscale non corretto. Inserisci il codice fiscale di uno dei tuoi figli iscritti.' });
  }

  // Crea account Auth per il genitore referente
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: normalizedEmail, password: DEFAULT_PASSWORD, email_confirm: true,
  });

  if (authError) {
    if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
      return res.status(200).json({ success: false, error: 'Hai già un account. Usa il pulsante Accedi.' });
    }
    return res.status(500).json({ success: false, error: 'Errore: ' + authError.message });
  }

  return res.status(200).json({ success: true, firstName: figli[0].first_name });
}
