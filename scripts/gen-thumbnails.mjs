// 기본 동화 썸네일 생성 → sharp로 4:3 webp → public/thumbnails/{id}.webp
//
// 프로바이더:
//   PROVIDER=openai (기본, 있으면)  — gpt-image-1 (권장) / dall-e-3
//   PROVIDER=gemini                 — gemini-2.5-flash-image (무료 쿼터 낮음, 429 잦음)
//
// 사용:
//   node scripts/gen-thumbnails.mjs                 # 전체(1~34)
//   node scripts/gen-thumbnails.mjs --only=10       # 특정 id 하나(테스트)
//   node scripts/gen-thumbnails.mjs --from=25 --to=34
//   PROVIDER=openai MODEL=dall-e-3 node scripts/gen-thumbnails.mjs
//
// 키는 .env.local 에서 읽음: OPENAI_API_KEY / GEMINI_API_KEY

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

function readEnv(name) {
  const txt = fs.readFileSync(path.join(ROOT, ".env.local"), "utf8");
  const m = txt.match(new RegExp(`^${name}\\s*=\\s*(.+)$`, "m"));
  return m ? m[1].trim().replace(/^["']|["']$/g, "") : null;
}

const OPENAI_KEY = process.env.OPENAI_API_KEY || readEnv("OPENAI_API_KEY");
const GEMINI_KEY = process.env.GEMINI_API_KEY || readEnv("GEMINI_API_KEY");
const PROVIDER = process.env.PROVIDER || (OPENAI_KEY ? "openai" : "gemini");
const OPENAI_MODEL = process.env.MODEL || "gpt-image-1";
const GEMINI_MODEL = process.env.MODEL || "gemini-2.5-flash-image";

const OUT_DIR = path.join(ROOT, "public", "thumbnails");
const prompts = JSON.parse(
  fs.readFileSync(path.join(ROOT, "db", "thumbnail-prompts.json"), "utf8")
);

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  })
);

const allIds = Object.keys(prompts.subjects).sort((a, b) => +a - +b);
let ids = allIds;
if (args.only) ids = [String(args.only)];
else if (args.from || args.to) {
  const from = +(args.from ?? allIds[0]);
  const to = +(args.to ?? allIds[allIds.length - 1]);
  ids = allIds.filter((id) => +id >= from && +id <= to);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const promptFor = (id) => `${prompts.style} Subject: ${prompts.subjects[id]}`;

async function genOpenAI(id) {
  const isDalle = OPENAI_MODEL.startsWith("dall-e");
  const body = {
    model: OPENAI_MODEL,
    prompt: promptFor(id),
    n: 1,
    size: isDalle ? "1792x1024" : "1536x1024", // 가로형 → 이후 4:3 크롭
    ...(isDalle
      ? { response_format: "b64_json", quality: "hd" }
      : { quality: "medium" }),
  };
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify(body),
    });
    if (res.status === 429) {
      const wait = 20000 * (attempt + 1);
      console.log(`  [${id}] 429 — ${wait / 1000}s 대기`);
      await sleep(wait);
      continue;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 240)}`);
    const data = await res.json();
    const b64 = data.data?.[0]?.b64_json;
    if (!b64) throw new Error("b64_json 없음");
    return Buffer.from(b64, "base64");
  }
  throw new Error("429 재시도 초과");
}

async function genGemini(id) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`;
  const body = {
    contents: [{ parts: [{ text: promptFor(id) }] }],
    generationConfig: {
      responseModalities: ["IMAGE"],
      imageConfig: { aspectRatio: "4:3" },
    },
  };
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.status === 429) {
      await sleep(20000 * (attempt + 1));
      continue;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 240)}`);
    const data = await res.json();
    const parts = data.candidates?.[0]?.content?.parts ?? [];
    const b64 = parts.find((p) => p.inlineData?.data)?.inlineData?.data;
    if (!b64) throw new Error("이미지 데이터 없음");
    return Buffer.from(b64, "base64");
  }
  throw new Error("429 재시도 초과");
}

const genOne = PROVIDER === "openai" ? genOpenAI : genGemini;

async function main() {
  if (PROVIDER === "openai" && !OPENAI_KEY)
    throw new Error(".env.local 에 OPENAI_API_KEY 를 추가해주세요.");
  fs.mkdirSync(OUT_DIR, { recursive: true });
  console.log(
    `provider=${PROVIDER} model=${PROVIDER === "openai" ? OPENAI_MODEL : GEMINI_MODEL} · ${ids.length}편`
  );
  const done = [];
  for (const id of ids) {
    try {
      console.log(`[${id}] 생성 중...`);
      const raw = await genOne(id);
      const outPath = path.join(OUT_DIR, `${id}.webp`);
      await sharp(raw)
        .resize(1024, 768, { fit: "cover", position: "attention" })
        .webp({ quality: 82 })
        .toFile(outPath);
      console.log(`  [${id}] ✓ ${(fs.statSync(outPath).size / 1024).toFixed(0)}KB`);
      done.push({ id, url: `/thumbnails/${id}.webp` });
    } catch (e) {
      console.log(`  [${id}] ✗ ${e.message}`);
    }
    await sleep(1500);
  }
  fs.writeFileSync(path.join(OUT_DIR, "_manifest.json"), JSON.stringify(done, null, 2));
  console.log(`\n완료 ${done.length}/${ids.length}. → public/thumbnails/`);
}

main();
