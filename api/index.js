import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function handler(req, res) {
  // CORS başlıklarını ekle (tüm yanıtlara uygulanacak)
  res.setHeader('Access-Control-Allow-Origin', '127.0.0.1:5500');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Tarayıcının gönderdiği OPTIONS isteğine yanıt ver
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    const { action, username, password } = req.body;

    if (action === 'signup') {
      try {
        const { data: existingUser, error: findError } = await supabase
          .from('profiles')
          .select('username')
          .eq('username', username);

        if (findError) {
          return res.status(500).json({ error: findError.message });
        }
        if (existingUser && existingUser.length > 0) {
          return res.status(409).json({ error: 'Kullanıcı adı zaten kullanımda.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const userUuid = crypto.randomUUID();

        const { data, error: insertError } = await supabase
          .from('profiles')
          .insert([
            {
              user_uuid: userUuid,
              username: username,
              password_hash: hashedPassword
            }
          ]);

        if (insertError) {
          return res.status(500).json({ error: insertError.message });
        }

        return res.status(200).json({ success: true, user: data[0] });

      } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Bir hata oluştu.' });
      }
    }

    if (action === 'login') {
      try {
        const { data: user, error: findError } = await supabase
          .from('profiles')
          .select('password_hash')
          .eq('username', username)
          .single();

        if (findError || !user) {
          return res.status(401).json({ error: 'Kullanıcı adı veya şifre yanlış.' });
        }

        const passwordMatch = await bcrypt.compare(password, user.password_hash);

        if (!passwordMatch) {
          return res.status(401).json({ error: 'Kullanıcı adı veya şifre yanlış.' });
        }

        return res.status(200).json({ success: true, message: 'Giriş başarılı!' });

      } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Bir hata oluştu.' });
      }
    }
  }

  // Bu satırın da CORS başlıkları alması için `res` nesnesinin `setHeader` metodunu kullanmasına gerek kalmaz
  // çünkü zaten yukarıda eklendi.
  res.status(405).json({ message: 'Method Not Allowed' });
}

