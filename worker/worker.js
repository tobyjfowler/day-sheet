// Day Sheet storage — Cloudflare Worker with a KV namespace bound as DAYSHEET
// and a secret named TOKEN. Paste this whole file into the Worker editor.
//
// Routes (all need header  Authorization: Bearer <TOKEN>):
//   GET  /settings            -> settings JSON (or {} if none)
//   PUT  /settings            -> body = settings JSON
//   GET  /days?since=YYYY-MM-DD -> { "YYYY-MM-DD": dayJSON, ... }
//   GET  /days/YYYY-MM-DD     -> dayJSON (or {} if none)
//   PUT  /days/YYYY-MM-DD     -> body = dayJSON
//   DELETE /days/YYYY-MM-DD

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Authorization,Content-Type",
  "Access-Control-Max-Age": "86400",
};
const DATE = /^\d{4}-\d{2}-\d{2}$/;

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...CORS },
  });
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

    const auth = request.headers.get("Authorization") || "";
    if (!env.TOKEN || auth !== "Bearer " + env.TOKEN) return json({ error: "unauthorised" }, 401);

    const url = new URL(request.url);
    const parts = url.pathname.split("/").filter(Boolean);

    try {
      // /settings
      if (parts[0] === "settings" && parts.length === 1) {
        if (request.method === "GET") {
          const v = await env.DAYSHEET.get("settings");
          return json(v ? JSON.parse(v) : {});
        }
        if (request.method === "PUT") {
          const body = await request.text();
          JSON.parse(body); // validate
          await env.DAYSHEET.put("settings", body);
          return json({ ok: true });
        }
      }

      // /days  (list since a date)
      if (parts[0] === "days" && parts.length === 1 && request.method === "GET") {
        const since = url.searchParams.get("since") || "0000-00-00";
        const out = {};
        let cursor;
        do {
          const page = await env.DAYSHEET.list({ prefix: "day:", cursor });
          for (const k of page.keys) {
            const d = k.name.slice(4);
            if (d >= since) {
              const v = await env.DAYSHEET.get(k.name);
              if (v) out[d] = JSON.parse(v);
            }
          }
          cursor = page.list_complete ? undefined : page.cursor;
        } while (cursor);
        return json(out);
      }

      // /days/YYYY-MM-DD
      if (parts[0] === "days" && parts.length === 2 && DATE.test(parts[1])) {
        const key = "day:" + parts[1];
        if (request.method === "GET") {
          const v = await env.DAYSHEET.get(key);
          return json(v ? JSON.parse(v) : {});
        }
        if (request.method === "PUT") {
          const body = await request.text();
          if (body.length > 200000) return json({ error: "too large" }, 413);
          JSON.parse(body);
          await env.DAYSHEET.put(key, body);
          return json({ ok: true });
        }
        if (request.method === "DELETE") {
          await env.DAYSHEET.delete(key);
          return json({ ok: true });
        }
      }

      return json({ error: "not found" }, 404);
    } catch (e) {
      return json({ error: String(e && e.message || e) }, 400);
    }
  },
};
