// Scrapes the OFFICIAL UGC autonomous colleges list directly from the UGC table.
// Source of truth: https://www.ugc.gov.in/colleges/Autonomous_Colleges_list
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const UGC_SOURCE = 'https://www.ugc.gov.in/colleges/Autonomous_Colleges_list';

const STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jammu and Kashmir','Jharkhand','Karnataka','Kerala',
  'Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha',
  'Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
  'Uttarakhand','West Bengal','Delhi','Puducherry','Chandigarh','Andaman and Nicobar',
  'Dadra and Nagar Haveli','Lakshadweep','Ladakh',
];

const STATE_ALIASES: Record<string, string> = {
  chhatisgarh: 'Chhattisgarh',
  'jammu & kashmir': 'Jammu and Kashmir',
  'jammu and kashmir': 'Jammu and Kashmir',
  maharastra: 'Maharashtra',
  pondicherry: 'Puducherry',
  puducherry: 'Puducherry',
  uttrakhand: 'Uttarakhand',
};

type OfficialCollege = {
  college_name: string;
  state: string;
  city: string | null;
  affiliated_university: string | null;
  autonomous_since: number | null;
};

function decodeHtml(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function titleCaseState(raw: string) {
  const normalized = raw.replace(/\s+/g, ' ').trim().toLowerCase();
  if (STATE_ALIASES[normalized]) return STATE_ALIASES[normalized];
  const match = STATES.find((state) => state.toLowerCase() === normalized);
  if (match) return match;
  return normalized.replace(/\b\w/g, (char) => char.toUpperCase());
}

function normalizeKey(name: string, state: string) {
  return `${state.toLowerCase()}::${name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\b(college|autonomous|dist|district|india)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()}`;
}

function uniqueCollegeKey(name: string, university: string | null) {
  return `${name.trim().toLowerCase().replace(/\s+/g, ' ')}::${(university || '').trim().toLowerCase().replace(/\s+/g, ' ')}`;
}

function extractYear(value: string) {
  const match = value.match(/(?:19|20)\d{2}/);
  return match ? Number(match[0]) : null;
}

function inferCity(collegeName: string) {
  const district = collegeName.match(/(?:Dist\.?|District)\s*[-:]?\s*([A-Za-z .'-]+)/i)?.[1];
  if (district) return district.split(/,|\d/)[0].trim() || null;

  const parts = collegeName.split(',').map((part) => part.trim()).filter(Boolean);
  for (let i = parts.length - 1; i >= 0; i--) {
    const part = parts[i]
      .replace(/\b(?:Dist\.?|District|Taluk|Mandal|Pin|Pincode|Near|Post|PO|Road|Rd\.?|State)\b/gi, '')
      .replace(/[-–—]?\s*\d{3,}.*/, '')
      .trim();
    if (/^[A-Za-z .'-]{3,45}$/.test(part)) return part;
  }
  return null;
}

async function fetchOfficialRows() {
  const res = await fetch(UGC_SOURCE, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; AcademisthanBot/1.0; +https://academisthan.org)',
      'Accept': 'text/html,application/xhtml+xml',
    },
  });
  if (!res.ok) throw new Error(`UGC source returned ${res.status}`);
  const html = await res.text();
  const rows = [...html.matchAll(/<tr[\s\S]*?<\/tr>/gi)];
  const colleges: OfficialCollege[] = [];
  const seen = new Set<string>();

  for (const rowMatch of rows) {
    const cells = [...rowMatch[0].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((cell) => decodeHtml(cell[1]));
    if (cells.length < 6 || !/^\d+$/.test(cells[0])) continue;

    const state = titleCaseState(cells[1]);
    const collegeName = cells[2]?.substring(0, 500).trim();
    if (!collegeName || collegeName.length < 5) continue;

    const item: OfficialCollege = {
      state,
      college_name: collegeName,
      city: inferCity(collegeName),
      autonomous_since: extractYear(cells[3]),
      affiliated_university: cells[5]?.substring(0, 500).trim() || null,
    };
    const key = normalizeKey(item.college_name, item.state);
    if (seen.has(key)) continue;
    seen.add(key);
    colleges.push(item);
  }

  if (colleges.length < 1000) {
    throw new Error(`UGC table parse returned only ${colleges.length} rows; refusing incomplete sync`);
  }
  return colleges;
}

async function runUpdate(supabase: any, states: string[], runId: string | null) {
  let totalSynced = 0, totalSkipped = 0;
  const stateStats: Record<string, { total: number }> = {};
  const errors: string[] = [];

  try {
    const officialRows = (await fetchOfficialRows()).filter((row) => states.includes(row.state));
    const targetStateSet = new Set(officialRows.map((row) => row.state));
    const targetStates = [...targetStateSet];
    const now = new Date().toISOString();

    const rows: any[] = [];
    const queuedUniqueKeys = new Set<string>();
    for (const item of officialRows) {
      const uniqueKey = uniqueCollegeKey(item.college_name, item.affiliated_university);
      if (queuedUniqueKeys.has(uniqueKey)) continue;
      queuedUniqueKeys.add(uniqueKey);

      rows.push({
        college_name: item.college_name,
        state: item.state,
        city: item.city,
        affiliated_university: item.affiliated_university,
        naac_grade: null,
        autonomous_since: item.autonomous_since,
        website: null,
        institution_type: 'college',
        is_active: true,
        source_url: UGC_SOURCE,
        updated_at: now,
      });
      stateStats[item.state] ??= { total: 0 };
      stateStats[item.state].total++;
    }

    for (let i = 0; i < rows.length; i += 250) {
      const chunk = rows.slice(i, i + 250);
      const { error } = await supabase
        .from('autonomous_colleges_directory')
        .upsert(chunk, { onConflict: 'college_name,affiliated_university' });
      if (error) {
        totalSkipped += chunk.length;
        errors.push(`sync batch ${Math.floor(i / 250) + 1}: ${error.message}`);
        continue;
      }
      totalSynced += chunk.length;
    }

    if (targetStates.length && totalSynced > 1000) {
      await supabase
        .from('autonomous_colleges_directory')
        .update({ is_active: false })
        .in('state', targetStates)
        .lt('updated_at', now);
    }
  } catch (e) {
    errors.push((e as any)?.message || String(e));
  }

  if (runId) {
    await supabase.from('automation_runs').update({
      finished_at: new Date().toISOString(),
      status: errors.length && !totalSynced ? 'failed' : 'success',
      items_created: totalSynced,
      error_message: errors.slice(0, 3).join(' | ') || null,
      metadata: { source: UGC_SOURCE, synced: totalSynced, skipped: totalSkipped, states: stateStats },
    }).eq('id', runId);
  }
  console.log('update-autonomous-colleges done:', { totalSynced, totalSkipped, errors: errors.slice(0, 3) });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!serviceRoleKey) {
    return new Response(JSON.stringify({ error: 'Missing service role key' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, serviceRoleKey);
  let body: any = {};
  try { body = await req.json(); } catch { /* ok */ }
  const targetStates: string[] = Array.isArray(body?.states) ? body.states
    : body?.state ? [body.state]
    : STATES;
  const { data: run } = await supabase.from('automation_runs').insert({
    function_name: 'update-autonomous-colleges',
    status: 'running',
    metadata: { target: targetStates.length === STATES.length ? 'all' : targetStates },
  }).select('id').single();
  // @ts-ignore
  EdgeRuntime.waitUntil(runUpdate(supabase, targetStates, run?.id ?? null));
  return new Response(JSON.stringify({ accepted: true, run_id: run?.id, states_queued: targetStates.length }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
});
