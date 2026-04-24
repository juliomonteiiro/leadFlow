import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface GenerateRequest {
  lead_id: string;
  campaign_id: string;
  auto_generated: boolean;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { lead_id, campaign_id, auto_generated }: GenerateRequest = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    // Fetch lead data
    const leadRes = await fetch(`${supabaseUrl}/rest/v1/leads?id=eq.${lead_id}&select=*`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    });
    const leadData = (await leadRes.json() as Record<string, unknown>[])[0];

    // Fetch campaign data
    const campaignRes = await fetch(`${supabaseUrl}/rest/v1/campaigns?id=eq.${campaign_id}&select=*`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    });
    const campaignData = (await campaignRes.json() as Record<string, unknown>[])[0];

    if (!leadData || !campaignData) {
      return new Response(JSON.stringify({ error: "Lead or campaign not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const leadName = String(leadData.name ?? "");
    const leadCompany = String(leadData.company ?? "");
    const leadJobTitle = String(leadData.job_title ?? "");
    const leadSource = String(leadData.source ?? "");
    const leadNotes = String(leadData.notes ?? "");

    const campaignContext = String(campaignData.context ?? "");
    const campaignPrompt = String(campaignData.prompt ?? "");

    // Generate message variations using template approach
    const variations = generateVariations(
      leadName,
      leadCompany,
      leadJobTitle,
      leadSource,
      leadNotes,
      campaignContext,
      campaignPrompt
    );

    // Store generated messages
    const insertRes = await fetch(`${supabaseUrl}/rest/v1/generated_messages`, {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        lead_id,
        campaign_id,
        variations,
        was_sent: false,
        auto_generated,
      }),
    });

    const inserted = (await insertRes.json() as Record<string, unknown>[])[0];

    // Log activity
    await fetch(`${supabaseUrl}/rest/v1/activity_logs`, {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        workspace_id: leadData.workspace_id,
        lead_id,
        activity_type: "message_generated",
        metadata: { campaign_id, auto_generated },
      }),
    });

    return new Response(JSON.stringify({ data: inserted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function generateVariations(
  name: string,
  company: string,
  jobTitle: string,
  source: string,
  notes: string,
  context: string,
  prompt: string
): string[] {
  const greeting = name ? `Ola ${name}` : "Ola";
  const companyRef = company ? ` da ${company}` : "";
  const titleRef = jobTitle ? ` como ${jobTitle}` : "";
  const sourceRef = source ? ` pelo ${source}` : "";

  const baseContext = context || "Seguimos interessados em entender melhor suas necessidades e como podemos ajudar.";

  const variation1 = `${greeting}!\n\n${baseContext}\n\nGostaria de agendar uma conversa rapida para entender melhor seu cenario${companyRef} e explorar como podemos gerar valor para voce${titleRef}.\n\nVoce teria disponibilidade essa semana?\n\nAbraços`;

  const variation2 = `${greeting}, tudo bem?\n\nVi que voce chegou ate nos${sourceRef} e fiquei muito interessado em entender mais sobre seu trabalho${companyRef}.\n\n${baseContext}\n\nPodemos conversar por 15 minutos essa semana?\n\nObrigado!`;

  const variation3 = `${greeting}!\n\n${baseContext}\n\nSei que seu tempo e valioso${titleRef ? ` especialmente na sua posicao${titleRef}` : ""}, entao prometo ser objetivo.\n\nGostaria de entender se faz sentido conversarmos sobre como podemos ajudar a ${company || "sua empresa"}. O que acha de um cafe virtual essa semana?\n\nAtenciosamente`;

  if (prompt) {
    return [
      variation1,
      variation2,
      `${greeting}!\n\n${prompt}\n\n${baseContext}\n\nFico a disposicao para conversarmos.\n\nAbraços`,
    ];
  }

  return [variation1, variation2, variation3];
}
