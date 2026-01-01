/**
 * Generate placeholder branding assets for FormulaGuard
 * Run with: tsx scripts/generate-brand-assets.ts
 */

import sharp from "sharp";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const publicDir = join(process.cwd(), "public");

// Ensure public directory exists
mkdirSync(publicDir, { recursive: true });

// Color scheme: teal background (pharmaceutical/lab aesthetic)
const backgroundColor = "#14b8a6"; // teal-500
const textColor = "#ffffff"; // white
const subtitleColor = "#f0fdfa"; // teal-50

async function generateOGImage() {
  const width = 1200;
  const height = 630;

  // Create SVG with text
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="${backgroundColor}"/>
      <text x="50%" y="45%" font-family="Arial, sans-serif" font-size="72" font-weight="bold" fill="${textColor}" text-anchor="middle" dominant-baseline="middle">FormulaGuard</text>
      <text x="50%" y="60%" font-family="Arial, sans-serif" font-size="32" fill="${subtitleColor}" text-anchor="middle" dominant-baseline="middle">Cosmetic formulation safety &amp; compliance</text>
    </svg>
  `;

  const image = sharp(Buffer.from(svg))
    .resize(width, height)
    .png();

  await image.toFile(join(publicDir, "og.png"));
  console.log("✓ Generated og.png (1200x630)");
}

async function generateFavicon(size: number, filename: string) {
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="${backgroundColor}"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.6}" font-weight="bold" fill="${textColor}" text-anchor="middle" dominant-baseline="middle">FG</text>
    </svg>
  `;

  const image = sharp(Buffer.from(svg))
    .resize(size, size)
    .png();

  await image.toFile(join(publicDir, filename));
  console.log(`✓ Generated ${filename} (${size}x${size})`);
}

async function generateAppleTouchIcon() {
  const size = 180;
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="${backgroundColor}"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="64" font-weight="bold" fill="${textColor}" text-anchor="middle" dominant-baseline="middle">FG</text>
    </svg>
  `;

  const image = sharp(Buffer.from(svg))
    .resize(size, size)
    .png();

  await image.toFile(join(publicDir, "apple-touch-icon.png"));
  console.log("✓ Generated apple-touch-icon.png (180x180)");
}

async function generateFaviconICO() {
  // Generate 32x32 PNG first, then convert to ICO
  const size = 32;
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="${backgroundColor}"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="${textColor}" text-anchor="middle" dominant-baseline="middle">FG</text>
    </svg>
  `;

  const pngBuffer = await sharp(Buffer.from(svg))
    .resize(size, size)
    .png()
    .toBuffer();

  // For ICO, we'll use the PNG buffer (modern browsers support PNG in .ico)
  writeFileSync(join(publicDir, "favicon.ico"), pngBuffer);
  console.log("✓ Generated favicon.ico");
}

async function main() {
  try {
    console.log("Generating branding assets...\n");

    await generateOGImage();
    await generateFavicon(16, "favicon-16x16.png");
    await generateFavicon(32, "favicon-32x32.png");
    await generateAppleTouchIcon();
    await generateFaviconICO();

    console.log("\n✓ All branding assets generated successfully!");
  } catch (error) {
    console.error("Error generating assets:", error);
    process.exit(1);
  }
}

main();


