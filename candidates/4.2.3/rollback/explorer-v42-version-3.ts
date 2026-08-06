import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const VERSION = "4.2.0";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function decodePart(value: string): Uint8Array {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) throw new Error("Configuração do servidor indisponível");
    const db = createClient(url, key, { auth: { persistSession: false } });
    const { data, error } = await db.from("app_release_chunks").select("part,data").eq("version", VERSION).order("part", { ascending: true });
    if (error) throw error;
    if (!data || data.length !== 44) throw new Error(`Pacote incompleto: ${data?.length || 0} blocos`);

    const decoded = data.map((row: { data: string }) => decodePart(row.data));
    const total = decoded.reduce((sum, part) => sum + part.length, 0);
    const compressed = new Uint8Array(total);
    let offset = 0;
    for (const part of decoded) {
      compressed.set(part, offset);
      offset += part.length;
    }

    const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream("gzip"));
    const html = await new Response(stream).text();
    const pathname = new URL(req.url).pathname;
    if (pathname.endsWith("/health")) {
      const result = {
        ok: html.includes("Explorer 4.2"),
        version: VERSION,
        chunks: data.length,
        compressedBytes: compressed.length,
        characters: html.length,
        title: html.includes("<title>Explorer 4.2</title>"),
        messages: html.includes("Mensagens"),
        notifications: html.includes("Notificações"),
        clickDetails: html.includes("markerDetailModal"),
        sosHome: html.includes("home-safety-card") && html.includes("SEGURANÇA EM CAMPO"),
        guideStatic: html.includes("trail-guide-panel{position:relative") || html.includes("trail-guide-panel-static"),
        follow: html.includes("Seguir"),
      };
      const allReady = result.ok && result.title && result.messages && result.notifications && result.clickDetails && result.sosHome && result.guideStatic && result.follow;
      return new Response(JSON.stringify({ ...result, ok: allReady }), { status: allReady ? 200 : 500, headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
    }
    return new Response(html, { status: 200, headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store, max-age=0", "Permissions-Policy": "geolocation=(self), camera=(self), microphone=(self)", "X-Content-Type-Options": "nosniff" } });
  } catch (error) {
    return new Response(`Explorer 4.2: ${error instanceof Error ? error.message : String(error)}`, { status: 500, headers: { ...corsHeaders, "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
  }
});
