import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatRequestBody {
  messages?: ChatMessage[];
  message?: string;
  context?: Record<string, unknown>;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const DEFAULT_SYSTEM_PROMPT =
  "You are Inny, the compassionate InnerCode coach. Keep responses concise, warm, and action-oriented.";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
  }

  let body: ChatRequestBody;

  try {
    body = await req.json();
  } catch (error) {
    console.error("Invalid JSON payload", error);
    return new Response(JSON.stringify({ error: "Invalid JSON payload" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  if (!body?.messages && !body?.message) {
    return new Response(JSON.stringify({ error: "'messages' or 'message' is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    console.error("OPENAI_API_KEY is not set");
    return new Response(JSON.stringify({ error: "Service misconfigured" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const payloadMessages = body.messages
      ? body.messages
      : [
          { role: "system", content: DEFAULT_SYSTEM_PROMPT },
          {
            role: "user",
            content: JSON.stringify({
              message: body.message,
              context: body.context ?? {},
            }),
          },
        ];

    const response = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: body.model ?? "gpt-4o-mini",
        temperature: body.temperature ?? 0.8,
        max_tokens: body.maxTokens ?? 280,
        messages: payloadMessages,
      }),
    });

    if (!response.ok) {
      const errorPayload = await response.text();
      console.error("OpenAI error", response.status, errorPayload);
      return new Response(
        JSON.stringify({ error: "Failed to generate AI response" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content ?? "";

    return new Response(JSON.stringify({ reply }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    console.error("Unexpected error calling OpenAI", error);
    return new Response(JSON.stringify({ error: "Unexpected server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});

