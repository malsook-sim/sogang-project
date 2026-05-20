// 동화 배경음악(BGM)을 ElevenLabs Sound Effects 로 생성 — 실행: npm run gen:bgm
// 한 번만 생성해서 public/bgm/ 에 정적 파일로 저장한다.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const TRACKS = [
  {
    id: "lullaby",
    prompt:
      "Gentle soft lullaby with a delicate music box melody, warm, calm, soothing, peaceful, for a baby falling asleep, seamless loop",
  },
  {
    id: "piano",
    prompt:
      "Calm slow solo piano, minimal gentle soothing melody, peaceful and warm with soft reverb, seamless loop",
  },
  {
    id: "forest",
    prompt:
      "Peaceful forest ambience with soft distant birdsong and a gentle breeze, calm relaxing nature soundscape, seamless loop",
  },
  {
    id: "dream",
    prompt:
      "Dreamy warm ambient pad with soft twinkling bell tones, cozy calm bedtime atmosphere, seamless loop",
  },
];

async function generate(
  apiKey: string,
  prompt: string
): Promise<Buffer | null> {
  for (const withLoop of [true, false]) {
    const body: Record<string, unknown> = {
      text: prompt,
      duration_seconds: 22,
      prompt_influence: 0.3,
    };
    if (withLoop) body.loop = true;

    const res = await fetch(
      "https://api.elevenlabs.io/v1/sound-generation",
      {
        method: "POST",
        headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );
    if (res.ok) return Buffer.from(await res.arrayBuffer());
    const err = await res.text();
    console.error(
      `  시도(loop=${withLoop}) 실패: ${res.status} ${err.slice(0, 160)}`
    );
  }
  return null;
}

async function main() {
  const env = await readFile(join(root, ".env.local"), "utf8");
  const apiKey = env.match(/^ELEVENLABS_API_KEY=(.+)$/m)?.[1]?.trim();
  if (!apiKey) throw new Error(".env.local 에 ELEVENLABS_API_KEY 가 없습니다.");

  const outDir = join(root, "public", "bgm");
  await mkdir(outDir, { recursive: true });

  for (const t of TRACKS) {
    console.log(`${t.id} 생성 중...`);
    const buf = await generate(apiKey, t.prompt);
    if (!buf) {
      console.error(`${t.id} 생성 실패 — 건너뜀`);
      continue;
    }
    await writeFile(join(outDir, `${t.id}.mp3`), buf);
    console.log(`  → public/bgm/${t.id}.mp3 (${buf.length} bytes)`);
  }
  console.log("BGM 생성 완료");
}

main().catch((e) => {
  console.error("BGM 생성 실패:", e instanceof Error ? e.message : e);
  process.exit(1);
});
