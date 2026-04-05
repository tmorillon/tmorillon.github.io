// script/sync-vector-store.mjs
import fs from "node:fs";
import path from "node:path";

const API = "https://api.openai.com/v1";
const KEY = process.env.OPENAI_API_KEY;
const VS  = process.env.TBOT_VECTOR_STORE_ID; // existing store id
const FOLDER = path.resolve("script/knowledge");

if (!KEY) throw new Error("Set OPENAI_API_KEY");
if (!VS)  throw new Error("Set TBOT_VECTOR_STORE_ID");
if (!fs.existsSync(FOLDER)) throw new Error(`Folder not found: ${FOLDER}`);

async function j(url, init = {}) {
  const r = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${KEY}`, ...(init.headers || {}) }
  });
  const data = await r.json();
  if (!r.ok) throw new Error(JSON.stringify(data));
  return data;
}

// Build filename -> file_id map for what's already in the store
const existing = {};
const filesResp = await j(`${API}/vector_stores/${VS}/files`);
for (const { id } of filesResp.data) {
  const meta = await j(`${API}/files/${id}`);
  existing[meta.filename] = id;
}

const allow = /\.(pdf|docx|md|txt)$/i;
const locals = fs.readdirSync(FOLDER).filter(f => allow.test(f));

for (const name of locals) {
  const fp = path.join(FOLDER, name);
  if (!fs.statSync(fp).isFile()) continue;

  // If filename exists, detach + delete old version
  if (existing[name]) {
    console.log("Detaching old:", name, existing[name]);
    await fetch(`${API}/vector_stores/${VS}/files/${existing[name]}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${KEY}` }
    });
    await fetch(`${API}/files/${existing[name]}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${KEY}` }
    });
  }

  // Upload new/updated version
  console.log("Uploading:", name);
  const form = new FormData();
  form.append("file", new Blob([fs.readFileSync(fp)]), name);
  const up = await fetch(`${API}/files`, {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}` },
    body: form
  });
  const uploaded = await up.json();
  if (!up.ok) throw new Error(JSON.stringify(uploaded));

  console.log("Attaching:", name, uploaded.id);
  await j(`${API}/vector_stores/${VS}/files`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file_id: uploaded.id })
  });
}

console.log("Sync complete.");
