# Day Sheet

Daily routine checklist, habit streaks, journal, and a trading desk (stocks / swing / day trading) with a pre-market plan and post-market review per day.

Live page: https://tobyjfowler.github.io/day-sheet/

- `index.html` — the whole app, served by GitHub Pages.
- `worker/worker.js` — a Cloudflare Worker that stores entries in KV so every device sees the same data.

Without the Worker the page still works; entries then stay in that browser only.

## One-time Cloudflare setup (about 10 minutes)

1. **Create the Worker.** Cloudflare dashboard → *Workers & Pages* → *Create* → *Create Worker*. Name it `day-sheet`, click *Deploy*, then *Edit code*. Delete everything in the editor, paste the contents of `worker/worker.js`, and click *Deploy*.
2. **Create the KV namespace.** *Storage & Databases* → *KV* → *Create namespace*. Name it `day-sheet`.
3. **Bind it to the Worker.** Back on the `day-sheet` Worker → *Settings* → *Bindings* → *Add* → *KV namespace*. Variable name `DAYSHEET` (exactly, capitals), namespace `day-sheet`. Save.
4. **Set the token.** Same *Settings* page → *Variables and Secrets* → *Add* → type *Secret*, name `TOKEN`, value: a long random password (a password manager's generator is fine). Save. Keep a copy.
5. **Copy the Worker URL.** It is shown on the Worker's overview page, like `https://day-sheet.<your-subdomain>.workers.dev`.
6. **Connect the page.** Open the live page, click the small word at the top right (`local`), paste the Worker URL and the token, click *Connect & sync*. Do the same on your phone. The word changes to `synced` when it is working.

The token lives only in each browser you entered it in. Anyone without it can't read or write your entries.
