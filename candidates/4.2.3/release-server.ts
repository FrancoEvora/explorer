const RELEASE_VERSION = "4.2.3";
const RELEASE_BUILD = "4.2.3-r1";
const EXPECTED_CHUNKS = 24;
const EXPECTED_SHA256 = "3a8e540625e2d35453a09807ec03c65f29232b991eaa14572c832bdc3e085a85";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

let releasePromise: Promise<{
  html: string;
  bytes: number;
  sha256: string;
  chunks: number;
}> | null = null;

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Array.from(
    new Uint8Array(digest),
    (byte) => byte.toString(16).padStart(2, "0"),
  ).join("");
}

async function loadRelease() {
  if (!releasePromise) {
    releasePromise = (async () => {
      const url = Deno.env.get("SUPABASE_URL");
      const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (!url || !key) {
        throw new Error("Configuração do servidor indisponível");
      }

      const endpoint =
        `${url}/rest/v1/app_build_chunks?build=eq.${encodeURIComponent(RELEASE_BUILD)}&select=seq,content&order=seq.asc`;
      const response = await fetch(endpoint, {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
      });
      if (!response.ok) {
        throw new Error(`Release store HTTP ${response.status}`);
      }

      const rows = await response.json();
      if (!Array.isArray(rows) || rows.length !== EXPECTED_CHUNKS) {
        throw new Error(
          `Pacote incompleto: ${Array.isArray(rows) ? rows.length : 0} blocos`,
        );
      }

      for (let index = 0; index < rows.length; index += 1) {
        if (
          rows[index].seq !== index ||
          typeof rows[index].content !== "string"
        ) {
          throw new Error(`Sequência inválida no bloco ${index}`);
        }
      }

      const html = rows.map((row) => row.content).join("");
      const hash = await sha256(html);
      if (hash !== EXPECTED_SHA256) {
        throw new Error(`Integridade inválida: ${hash}`);
      }

      return {
        html,
        bytes: new TextEncoder().encode(html).length,
        sha256: hash,
        chunks: rows.length,
      };
    })();
  }
  return releasePromise;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const release = await loadRelease();
    const pathname = new URL(req.url).pathname;

    if (pathname.endsWith("/health")) {
      const checks = {
        title: release.html.includes("<title>Explorer 4.2.3</title>"),
        runtimeVersion: release.html.includes("const APP_VERSION = '4.2.3'"),
        modalSemantics:
          release.html.includes("activeStandardModal") &&
          release.html.includes("focusableSelector"),
        correctModalCollection: release.html.includes(
          "\n    $$('.modal').forEach",
        ),
        noCollapsedModalCollection: !release.html.includes(
          "\n    $('.modal').forEach",
        ),
        keyboardAccess:
          release.html.includes("event.key === 'Escape'") &&
          release.html.includes("event.key !== 'Tab'"),
        mobileViewport:
          release.html.includes("100dvh") &&
          release.html.includes("font-size:16px"),
        reducedMotion: release.html.includes("prefers-reduced-motion"),
        socialFix: release.html.includes("authorButton.dataset.trailAuthor"),
        ownMessageGuard: release.html.includes("canMessageAuthor"),
        autonomousAvatar:
          !release.html.includes(
            "else $('profileAvatar').src = 'icon-192.png'",
          ) && release.html.includes("defaultAvatarUrl"),
        liveStatus: release.html.includes(
          'role="status" aria-live="polite"',
        ),
        sosModalManager: release.html.includes("X.closeModal('sosModal')"),
      };
      const ok = Object.values(checks).every(Boolean);

      return new Response(
        JSON.stringify({
          ok,
          version: RELEASE_VERSION,
          build: RELEASE_BUILD,
          bytes: release.bytes,
          chunks: release.chunks,
          sha256: release.sha256,
          checks,
        }),
        {
          status: ok ? 200 : 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "no-store",
          },
        },
      );
    }

    return new Response(release.html, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store, max-age=0",
        "Permissions-Policy":
          "geolocation=(self), camera=(self), microphone=(self)",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "X-Content-Type-Options": "nosniff",
        "X-Explorer-Version": RELEASE_VERSION,
        "X-Explorer-Build": RELEASE_BUILD,
        "X-Explorer-SHA256": release.sha256,
      },
    });
  } catch (error) {
    return new Response(
      `Explorer ${RELEASE_VERSION}: ${
        error instanceof Error ? error.message : String(error)
      }`,
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-store",
        },
      },
    );
  }
});
