import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const database =
  /^https?:\/\//.test(url || '') && key ? createClient(url, key) : null;

export async function read(request) {
  const { data, error } = await request;
  if (error) throw error;
  return data;
}

export function allEvents() {
  return database
    ? read(
        database
          .from('occasions')
          .select('*')
          .order('date', { ascending: false })
      )
    : Promise.resolve([]);
}

export async function oneEvent(id) {
  if (!database) return null;
  const event = await read(
    database.from('occasions').select('*').eq('id', id).maybeSingle()
  );
  if (!event) return null;
  const media = await read(
    database.from('media').select('*').eq('occasion_id', id).order('id')
  );
  return { ...event, media };
}

export function plainText(value = '') {
  if (!value || !/<[a-z][\s\S]*>/i.test(value)) return value || '';
  const parsed = new DOMParser().parseFromString(
    value.replace(/<\/(p|div|li)>|<br\s*\/?>/gi, '\n'),
    'text/html'
  );
  return parsed.body.textContent.trim();
}

export function displayDate(value) {
  if (!value) return 'Date to be confirmed';
  const date = new Date(value.length === 10 ? value + 'T12:00:00' : value);
  return Number.isNaN(date.getTime())
    ? 'Date to be confirmed'
    : date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
}

export function localDate() {
  const date = new Date();
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

export async function sendMail(fields) {
  const service = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const template = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
  if (!service || !template || !publicKey)
    throw new Error('Email delivery is unavailable.');
  const { default: emailjs } = await import('@emailjs/browser');
  await emailjs.send(service, template, fields, { publicKey });
}
