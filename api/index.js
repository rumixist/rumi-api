import { createClient } from '@supabase/supabase-js';

// Ortam değişkenlerini alıyoruz
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Supabase istemcisini oluşturuyoruz
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { action, email, password } = req.body;

    if (action === 'signup') {
      const { user, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ success: true, user });
    }

    if (action === 'login') {
      const { user, error } = await supabase.auth.signIn({
        email,
        password,
      });

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ success: true, user });
    }
  }

  // POST dışındaki isteklere hata döner
  res.status(405).json({ message: 'Method Not Allowed' });
}

