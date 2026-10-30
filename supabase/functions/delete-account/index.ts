// Deletes the signed-in member's account: their files, then the account itself.
// Everything they made goes with it (the database cascades from the profile), except
// orders and tickets, which stay for refunds and payouts without pointing at them.

import { createClient } from 'npm:@supabase/supabase-js@^2';

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

/** Removes every file under a folder, page by page. */
async function emptyFolder(bucket: string, folder: string) {
  for (;;) {
    const { data, error } = await admin.storage.from(bucket).list(folder, { limit: 100 });
    if (error) throw error;
    // Folders come back without an id; uploads are flat, so only files are removed.
    const files = (data ?? []).filter((f) => f.id);
    if (!files.length) return;
    const { error: removeError } = await admin.storage.from(bucket).remove(files.map((f) => `${folder}/${f.name}`));
    if (removeError) throw removeError;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return reply({ error: 'Use POST' }, 405);

  const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
  const { data: auth } = await admin.auth.getUser(token);
  const user = auth.user;
  if (!user) return reply({ error: 'Sign in to delete your account.' }, 401);

  try {
    // Profile photos and post photos live in a folder named after the member.
    await emptyFolder('avatars', user.id);
    await emptyFolder('media', user.id);
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) throw error;
  } catch (err) {
    return reply({ error: `Couldn’t delete the account: ${(err as Error).message}` }, 500);
  }
  return reply({ ok: true });
});
