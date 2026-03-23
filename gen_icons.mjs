import fs from "fs";
import sharp from "sharp";

const svg = `<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <!-- Sleek dark futuristic background -->
  <rect width="512" height="512" fill="#09090b" rx="120" />
  
  <defs>
    <linearGradient id="bananaGrad" x1="20%" y1="0%" x2="80%" y2="100%">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="40%" stop-color="#eab308" />
      <stop offset="100%" stop-color="#854d0e" />
    </linearGradient>
    <linearGradient id="bgGlow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="rgba(234, 179, 8, 0.25)" />
      <stop offset="100%" stop-color="rgba(0,0,0,0)" />
    </linearGradient>
  </defs>

  <!-- Background radial glow -->
  <circle cx="256" cy="256" r="200" fill="url(#bgGlow)" />

  <!-- Nano Banana abstract icon -->
  <g transform="translate(120, 100) rotate(-10 136 156)">
    <!-- Base curve forming the inner banana shape -->
    <path d="M40,240 Q40,100 160,50 Q230,20 280,10 Q220,100 200,180 Q160,300 40,240 Z" fill="url(#bananaGrad)" />
    <!-- Outer peel curve overlay -->
    <path d="M40,240 Q100,220 160,200 Q200,180 230,140 Q250,90 280,10 Q200,80 150,150 Q100,210 40,240 Z" fill="#fef08a" opacity="0.6"/>
  </g>

  <!-- Nano tech dots below the banana -->
  <g transform="translate(180, 420)">
    <circle cx="30" cy="0" r="16" fill="#eab308" />
    <circle cx="80" cy="0" r="10" fill="#eab308" opacity="0.6" />
    <circle cx="120" cy="0" r="6" fill="#eab308" opacity="0.3" />
  </g>
</svg>`;

async function main() {
  const buffer = Buffer.from(svg);
  await sharp(buffer).resize(192, 192).png().toFile("public/icon-192x192.png");
  await sharp(buffer).resize(512, 512).png().toFile("public/icon-512x512.png");
  await sharp(buffer).resize(180, 180).png().toFile("public/apple-icon.png");
  await sharp(buffer).resize(64, 64).png().toFile("public/favicon.ico");
  console.log("Nano Banana icons generated successfully!");
}

main();
