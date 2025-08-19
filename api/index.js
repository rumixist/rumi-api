// Deno Deploy ile çalışmak için URL'leri kullanıyoruz
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import bcrypt from 'https://esm.sh/bcrypt@5';

// Ortam değişkenlerini alıyoruz
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

Deno.serve(async (req) => {
  // CORS (Çapraz Kaynak Paylaşımı) ayarları
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  // Sadece POST isteklerini kabul et
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ message: 'Method Not Allowed' }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  try {
    const { action, username, password } = await req.json();

    if (action === 'signup') {
      const { data: existingUser, error: findError } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username);

      if (findError) {
        return new Response(JSON.stringify({ error: findError.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }
      if (existingUser && existingUser.length > 0) {
        return new Response(JSON.stringify({ error: 'Kullanıcı adı zaten kullanımda.' }), {
          status: 409,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      
      const { data, error: insertError } = await supabase
        .from('profiles')
        .insert([
          {
            username: username,
            password_hash: hashedPassword,
          },
        ]);

      if (insertError) {
        return new Response(JSON.stringify({ error: insertError.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }

      return new Response(JSON.stringify({ success: true, user: data[0] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Login logic would go here
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: 'Bir hata oluştu.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
});
