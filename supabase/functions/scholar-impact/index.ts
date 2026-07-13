const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { profile } = await req.json();

    if (!profile) {
      return new Response(
        JSON.stringify({ error: 'Profile data is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = `You are an expert academic research advisor specializing in Indian higher education. You help educators improve their Google Scholar metrics (h-index, i10-index, citations) and overall research impact.

You must respond with VALID JSON only (no markdown, no code blocks). Use this exact structure:
{
  "impactScore": <number 0-100>,
  "tier": "<one of: Emerging Researcher | Active Researcher | Impactful Scholar | Distinguished Researcher>",
  "tierEmoji": "<emoji for tier>",
  "summary": "<2-3 sentence overall assessment>",
  "benchmarks": {
    "hIndex": { "current": <number>, "nationalAvg": <number for their designation>, "percentile": <number> },
    "i10Index": { "current": <number>, "nationalAvg": <number>, "percentile": <number> },
    "citations": { "current": <number>, "nationalAvg": <number>, "percentile": <number> }
  },
  "recommendations": [
    {
      "title": "<action title>",
      "description": "<detailed actionable description>",
      "estimatedImpact": "<specific impact, e.g. +2-3 h-index in 2 years>",
      "difficulty": "<Easy | Medium | Hard>",
      "timeframe": "<e.g. 3-6 months>",
      "priority": <1-5, 1 being highest>,
      "category": "<Publication Strategy | Citation Growth | Visibility | Collaboration | UGC-API Connection>"
    }
  ],
  "quickWins": ["<immediate action 1>", "<immediate action 2>", "<immediate action 3>"],
  "motivationalMessage": "<inspiring personalized message about their potential>",
  "ugcApiConnection": "<how their current metrics map to UGC API scores and what improvement would mean for CAS promotion>"
}

Provide exactly 6-8 recommendations sorted by priority. Be specific to Indian academic context (UGC, NAAC, CARE list, Scopus, etc.). Use real national benchmarks for Indian academics.`;

    const userPrompt = `Analyze this Indian educator's research profile and provide detailed improvement recommendations:

Name: ${profile.name || 'Not provided'}
Designation: ${profile.designation || 'Not provided'}
Department: ${profile.department || 'Not provided'}
Institution: ${profile.institution || 'Not provided'}
Experience: ${profile.experienceYears || 0} years

Google Scholar Metrics:
- h-index: ${profile.hIndex || 0}
- i10-index: ${profile.i10Index || 0}
- Total Citations: ${profile.totalCitations || 0}
- Total Publications: ${profile.totalPublications || 0}

Additional Context:
- Research Areas: ${profile.researchAreas || 'Not specified'}
- UGC-CARE List Publications: ${profile.careListPubs || 0}
- Scopus Indexed Publications: ${profile.scopusPubs || 0}
- Conference Papers: ${profile.conferencePapers || 0}
- Books/Book Chapters: ${profile.booksChapters || 0}
- Has Google Scholar Profile: ${profile.hasGoogleScholar ? 'Yes' : 'No'}
- Has ORCID: ${profile.hasOrcid ? 'Yes' : 'No'}
- Has ResearchGate: ${profile.hasResearchGate ? 'Yes' : 'No'}

Provide a comprehensive analysis with actionable recommendations to dramatically improve their research impact. Be specific about estimated metric improvements for each recommendation.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Too many requests. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI service temporarily unavailable. Please try again later.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error('AI analysis failed');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response from AI');
    }

    // Parse the JSON response
    let analysis;
    try {
      // Try to extract JSON from the response (handle potential markdown wrapping)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Failed to parse analysis results');
    }

    return new Response(
      JSON.stringify({ success: true, analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Scholar impact analysis error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Analysis failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
