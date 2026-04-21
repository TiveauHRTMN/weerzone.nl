import fs from "fs";
import path from "path";

async function download(url: string, filename: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("fetch err " + res.status);
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(filename, buffer);
  console.log("Saved " + filename);
}

async function run() {
  const artifactDir = "C:\\Users\\rwnhr\\.gemini\\antigravity\\brain\\6c318920-bf18-475e-bcad-085e9ad98a43\\artifacts";
  
  // ensure dir exists
  if (!fs.existsSync(artifactDir)) {
    fs.mkdirSync(artifactDir, { recursive: true });
  }

  console.log("Fetching TikTok Slide 1...");
  await download("http://localhost:3000/api/social/piet-v2?city=Amsterdam&slide=1&format=tiktok&persona=piet", path.join(artifactDir, "tiktok_test_1.png"));

  console.log("Fetching X Slide 1...");
  await download("http://localhost:3000/api/social/piet-v2?city=Amsterdam&slide=1&format=x&persona=piet", path.join(artifactDir, "x_test_1.png"));

  console.log("Done");
}

run();
