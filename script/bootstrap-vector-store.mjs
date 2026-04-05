// script/bootstrap-vector-store.mjs
import fs from "node:fs";
import path from "node:path";

const API = "https://api.openai.com/v1";
const KEY = process.env.OPENAI_API_KEY;
if (!KEY) throw new Error("Set OPENAI_API_KEY first (GitHub Secret)");

async function j(url, init = {}) {
  const r = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${KEY}`, ...(init.headers || {}) }
  });
  const data = await r.json();
  if (!r.ok) throw new Error(JSON.stringify(data));
  return data;
}

// Folder with PDFs in THIS repo:
const FOLDER = path.resolve("script/knowledge");
if (!fs.existsSync(FOLDER)) throw new Error(`Folder not found: ${FOLDER}`);

// 1) Create a new Vector Store (RUN THIS WORKFLOW ONCE)
const store = await j(`${API}/vector_stores`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name: "T-bot Knowledge" })
});
console.log("Vector Store ID:", store.id);

// 2) Upload every file in script/knowledge and attach to the store
const allow = /\.(pdf|docx|md|txt)$/i;
for (const file of fs.readdirSync(FOLDER)) {
  const fp = path.join(FOLDER, file);
  if (!fs.statSync(fp).isFile() || !allow.test(file)) continue;

  const form = new FormData();
  form.append("file", new Blob([fs.readFileSync(fp)]), file);

  const up = await fetch(`${API}/files`, {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}` },
    body: form
  });
  const uploaded = await up.json();
  if (!up.ok) throw new Error(JSON.stringify(uploaded));
  console.log("Uploaded:", uploaded.id, file);

  await j(`${API}/vector_stores/${store.id}/files`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file_id: uploaded.id })
  });
  console.log("Attached:", file);
}

console.log("\nDone. Copy this into Vercel env var TBOT_VECTOR_STORE_ID:");
console.log(store.id);
