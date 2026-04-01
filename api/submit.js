/**
 * Qbil Transformation Programme — Notion Proxy
 * Vercel Edge Function: /api/submit.js
 *
 * Receives POST from the self-report HTML form,
 * validates fields, and creates a page in the
 * Employee Development Notion database.
 */

export const config = { runtime: 'edge' };

const NOTION_DB_ID   = '07df4aff2e0742f3a4bbccc70e72310f';
const NOTION_VERSION = '2022-06-28';

// Allowed origins — add your hosting domain here if needed
const ALLOWED_ORIGINS = ['*'];

function cors(origin) {
  return {
    'Access-Control-Allow-Origin':  ALLOWED_ORIGINS.includes('*') ? '*' : (ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]),
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age':       '86400',
  };
}

function json(data, status = 200, origin = '*') {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors(origin) },
  });
}

export default async function handler(req) {
  const origin = req.headers.get('origin') || '*';

  // ── CORS preflight ────────────────────────────────────────────────────────
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors(origin) });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405, origin);
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400, origin);
  }

  // ── Validate required fields ──────────────────────────────────────────────
  const required = ['name', 'month', 'program', 'group', 'q1', 'q2', 'q3'];
  for (const f of required) {
    if (!body[f] || !String(body[f]).trim()) {
      return json({ error: `Missing required field: ${f}` }, 400, origin);
    }
  }

  // ── Sanitise helper ───────────────────────────────────────────────────────
  const s = (v, max = 2000) => String(v).trim().slice(0, max);

  // ── Build Notion payload ──────────────────────────────────────────────────
  const properties = {
    Employee: {
      title: [{ text: { content: s(body.name, 100) } }],
    },
    Month: {
      rich_text: [{ text: { content: s(body.month, 50) } }],
    },
    Program: {
      select: { name: body.program },
    },
    Group: {
      select: { name: body.group },
    },
    'Entry Type': {
      select: { name: 'Self-Report' },
    },
    'Q1 - What did you do differently this month?': {
      rich_text: [{ text: { content: s(body.q1, 2000) } }],
    },
    'Q2 - Where are you stuck or need support?': {
      rich_text: [{ text: { content: s(body.q2, 2000) } }],
    },
    'Q3 - What is your focus for next month?': {
      rich_text: [{ text: { content: s(body.q3, 2000) } }],
    },
    'Submitted On Time': {
      select: { name: 'Yes' },
    },
    Status: {
      select: { name: 'On Track' },
    },
  };

  // Optional employee note → prepended to Kashif Observations
  if (body.extra && String(body.extra).trim()) {
    properties['Kashif Observations'] = {
      rich_text: [{ text: { content: '[Employee note] ' + s(body.extra, 1000) } }],
    };
  }

  const notionPayload = {
    parent: { database_id: NOTION_DB_ID },
    properties,
  };

  // ── Call Notion API ───────────────────────────────────────────────────────
  const token = process.env.NOTION_TOKEN;
  if (!token) {
    console.error('NOTION_TOKEN env var is not set');
    return json({ error: 'Server configuration error — contact Kashif.' }, 500, origin);
  }

  let notionRes;
  try {
    notionRes = await fetch('https://api.notion.com/v1/pages', {
      method:  'POST',
      headers: {
        Authorization:    `Bearer ${token}`,
        'Notion-Version': NOTION_VERSION,
        'Content-Type':   'application/json',
      },
      body: JSON.stringify(notionPayload),
    });
  } catch (err) {
    console.error('Notion fetch error:', err);
    return json({ error: 'Could not reach Notion API.' }, 502, origin);
  }

  if (notionRes.ok) {
    const created = await notionRes.json();
    return json({ success: true, id: created.id }, 200, origin);
  }

  // Surface Notion error details in the server logs (not to client)
  const errBody = await notionRes.json().catch(() => ({}));
  console.error('Notion API error:', notionRes.status, errBody);
  return json(
    { error: 'Notion rejected the submission. Check server logs.' },
    notionRes.status,
    origin,
  );
}
