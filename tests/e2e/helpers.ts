import sharp from "sharp";
import type { Page } from "@playwright/test";

/** A small, realistic-looking landing page used as the "design" under test. */
export async function makeDesignImage(label = "Flowboard"): Promise<Buffer> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="760">
    <rect width="1200" height="760" fill="#0f1117"/>
    <rect width="1200" height="64" fill="#151823"/>
    <text x="40" y="40" font-family="Arial" font-size="20" font-weight="700" fill="#e8e8f0">${label}</text>
    <text x="600" y="240" text-anchor="middle" font-family="Arial" font-size="52" font-weight="700" fill="#f2f2f8">A new kind of project</text>
    <text x="600" y="300" text-anchor="middle" font-family="Arial" font-size="52" font-weight="700" fill="#f2f2f8">management app</text>
    <rect x="440" y="360" width="240" height="48" rx="10" fill="#1b1f2d"/>
    <rect x="700" y="360" width="100" height="48" rx="10" fill="#4c6fff"/>
    <rect x="260" y="450" width="680" height="260" rx="14" fill="#f4f5f8"/>
  </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

export async function uploadFromHome(page: Page, files: Array<{ name: string; buffer: Buffer }>): Promise<void> {
  await page.goto("/");
  await page.getByLabel("Choose design images").setInputFiles(
    files.map((file) => ({ name: file.name, mimeType: "image/png", buffer: file.buffer })),
  );
}
