const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY missing');

    const body = await req.json();
    const query = (body.query || '').toString().slice(0, 300).trim();
    if (query.length < 3) {
      return new Response(JSON.stringify({ error: 'Query too short' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const system = `You are an Indian academic-publishing expert. Given a journal name, DOI, or ISSN, return ONLY valid JSON (no markdown) with this exact shape:
{
  "summary": "<2-3 sentence factual summary about this journal>",
  "indexedIn": ["<list of databases like Scopus, WoS-SCIE, UGC-CARE, DOAJ, PubMed, etc.>"],
  "ugcCare": "yes" | "no" | "unknown",
  "scopus": "yes" | "no" | "unknown",
  "webOfScience": "yes" | "no" | "unknown",
  "predatoryRisk": "low" | "medium" | "high" | "unknown",
  "sources": ["<official URLs the user can use to verify, e.g. https://ugccare.unipune.ac.in/, https://www.scopus.com/sources, https://mjl.clarivate.com/>"]
}

Be conservative — when in doubt, mark "unknown" and recommend manual verification. Predatory risk should be "high" only if multiple Beall-style red flags are evident (fake metrics, fast review, suspicious editorial board).`;

    const user = `Lookup journal: "${query}"`;

    const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429) return new Response(JSON.stringify({ error: 'Rate limited' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      if (resp.status === 402) return new Response(JSON.stringify({ error: 'AI quota exhausted' }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      throw new Error(`AI gateway: ${resp.status}`);
    }

    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('AI returned non-JSON');
    const result = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify({ success: true, result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('journal-quality error', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'lookup failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
