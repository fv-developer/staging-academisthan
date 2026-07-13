// Scrape UGC / AICTE / NAAC / e-Gazette notifications, summarise via Perplexity,
// store in news_updates with retention_category='regulatory'. Runs in background.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GAZETTE_QUERIES = [
  { name: 'UGC Notices', query: `List the most important notifications published on ugc.gov.in in the last 7 days. For each item give: title, date, source_url (must be a ugc.gov.in URL), and a 2-3 sentence plain-English summary of what it means for college/university teachers. Return ONLY a JSON array of {title, date, source_url, summary, authority:"UGC"} — 3 to 6 items.` },
  { name: 'AICTE Circulars', query: `List the most important circulars/notifications published on aicte-india.org in the last 7 days. JSON array of {title, date, source_url, summary, authority:"AICTE"} — 3 to 6 items.` },
  { name: 'NAAC Updates', query: `List the most important NAAC notifications/manuals/frameworks updated on naac.gov.in in the last 14 days. JSON array of {title, date, source_url, summary, authority:"NAAC"} — 2 to 5 items.` },
  { name: 'Ministry of Education', query: `List the most important orders/notifications from education.gov.in (Ministry of Education, GoI) in the last 7 days affecting higher education. JSON array of {title, date, source_url, summary, authority:"MoE"} — 2 to 5 items.` },
  { name: 'e-Gazette', query: `List the most important entries in the Indian e-Gazette (egazette.gov.in) in the last 14 days that affect higher education, university regulation, faculty service conditions, or research. JSON array of {title, date, source_url, summary, authority:"Gazette of India"} — 2 to 5 items.` },
];

const TRUSTED = ['.gov.in', '.ac.in', 'aicte-india.org', 'naac.gov.in', 'ugc.gov.in', 'education.gov.in', 'egazette.gov.in'];
const trusted = (u: string | null) => !!u && TRUSTED.some(d => u.toLowerCase().includes(d));

function categoryFor(authority: string) {
  const a = authority.toLowerCase();
  if (a.includes('gazette')) return 'gazette';
  if (a.includes('ugc')) return 'ugc_update';
  if (a.includes('aicte') || a.includes('naac')) return 'ugc_aicte';
  return 'announcement';
}

async function fetchGazette(apiKey: string, q: typeof GAZETTE_QUERIES[0]) {
  try {
    const r = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [
          { role: 'system', content: `You are a meticulous regulatory analyst for Indian higher education. NEVER invent notifications. Source URLs MUST be from .gov.in / .ac.in / aicte-india.org / naac.gov.in / ugc.gov.in / education.gov.in / egazette.gov.in. Return ONLY a JSON array, no prose, no markdown.` },
          { role: 'user', content: q.query },
        ],
        temperature: 0.05,
        search_recency_filter: 'week',
        search_domain_filter: ['ugc.gov.in', 'aicte-india.org', 'naac.gov.in', 'education.gov.in', 'egazette.gov.in'],
      }),
      signal: AbortSignal.timeout(45000),
    });
    const data = await r.json();
    if (!r.ok) { console.error(`Perplexity ${q.name}:`, data); return []; }
    const content = data.choices?.[0]?.message?.content || '';
    const citations: string[] = data.citations || [];
    const cleaned = content.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    const m = cleaned.match(/\[[\s\S]*\]/);
    if (!m) return [];
    const items = JSON.parse(m[0]);
    return items.map((it: any, i: number) => ({
      raw: it,
      url: it.source_url || citations[i] || null,
      authority: it.authority || q.name,
    }));
  } catch (e) { console.error(`fetchGazette ${q.name}:`, e); return []; }
}

async function fetchGazetteViaFirecrawl(firecrawlKey: string, q: typeof GAZETTE_QUERIES[0]) {
  const authority = q.name.replace(' Notices', '').replace(' Circulars', '');
  const query = `${q.name} higher education teacher university notification circular India official recent`;
  const r = await fetch('https://api.firecrawl.dev/v2/search', {
    method: 'POST',
    headers: { Authorization: `Bearer ${firecrawlKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, limit: 10, tbs: 'qdr:m', scrapeOptions: { formats: ['markdown'] } }),
  });
  const data = await r.json();
  if (!r.ok) { console.error(`Firecrawl ${q.name}:`, data); return []; }
  const list = data?.data?.web || data?.data || [];
  return list
    .filter((it: any) => trusted(it?.url))
    .slice(0, 5)
    .map((it: any) => ({
      raw: {
        title: it.title || it.url,
        summary: (it.description || it.markdown || 'Official regulatory update. Verify the original source before acting.').slice(0, 500),
      },
      url: it.url,
      authority,
    }));
}

async function runScrape(supabase: any, key: string | undefined, firecrawlKey: string | undefined, runId: string | null) {
  let inserted = 0, skipped = 0, untrusted = 0;
  const errors: string[] = [];
  for (const q of GAZETTE_QUERIES) {
    try {
      let items = key ? await fetchGazette(key, q) : [];
      if (!items.length && firecrawlKey) items = await fetchGazetteViaFirecrawl(firecrawlKey, q);
      for (const { raw, url, authority } of items) {
        if (!trusted(url)) { untrusted++; continue; }
        const title = (raw.title || '').substring(0, 500);
        if (!title) continue;
        const { data: existing } = await supabase.from('news_updates').select('id')
          .ilike('title', `%${title.substring(0, 50)}%`).limit(1);
        if (existing?.length) { skipped++; continue; }
        const { error } = await supabase.from('news_updates').insert({
          title,
          summary: (raw.summary || '').substring(0, 500),
          category: categoryFor(authority),
          source_url: url,
          source_name: `${authority} (Official)`,
          is_published: true,
          is_ai_generated: true,
          published_at: new Date().toISOString(),
          retention_category: 'regulatory',
        });
        if (error) errors.push(`${title.substring(0, 40)}: ${error.message}`);
        else inserted++;
      }
      await new Promise(r => setTimeout(r, 1500));
    } catch (e) { errors.push(`${q.name}: ${e}`); }
  }
  if (runId) await supabase.from('automation_runs').update({
    finished_at: new Date().toISOString(),
    status: inserted ? 'success' : (errors.length ? 'failed' : 'success'),
    items_created: inserted,
    error_message: errors.slice(0, 3).join(' | ') || null,
    metadata: { skipped, untrusted_dropped: untrusted },
  }).eq('id', runId);
  console.log('scrape-gazette done:', { inserted, skipped, untrusted });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  const key = Deno.env.get('PERPLEXITY_API_KEY');
  const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
  if (!key && !firecrawlKey) return new Response(JSON.stringify({ error: 'Need PERPLEXITY_API_KEY or FIRECRAWL_API_KEY' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: run } = await supabase.from('automation_runs').insert({ function_name: 'scrape-gazette', status: 'running' }).select('id').single();
  // @ts-ignore
  EdgeRuntime.waitUntil(runScrape(supabase, key, firecrawlKey, run?.id ?? null));
  return new Response(JSON.stringify({ accepted: true, run_id: run?.id }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
});
