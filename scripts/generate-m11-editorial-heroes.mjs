import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

const items = [
  ["lemon-chicken-breast", "dish"], ["broccoli-chicken", "dish"],
  ["mushroom-tofu-rice", "dish"], ["pan-seared-chicken-thigh", "dish"],
  ["pepper-beef-stir-fry", "dish"], ["tomato-beef-stew", "dish"],
  ["potato-beef-stew", "dish"], ["shrimp-scrambled-eggs", "dish"],
  ["steamed-salmon", "dish"], ["roasted-salmon", "dish"],
  ["steamed-egg", "dish"], ["pan-fried-tofu", "dish"],
  ["cold-shredded-chicken", "dish"], ["roasted-vegetables", "dish"],
  ["tomato-egg-soup", "dish"], ["rice-cooker-chicken-rice", "dish"],
  ["japanese-beef-potato-simmer", "dish"], ["korean-kimchi-fried-rice", "dish"],
  ["vietnamese-lemongrass-chicken", "dish"], ["mexican-chicken-fajitas", "dish"],
  ["double-skin-milk", "dessert"], ["mango-pomelo-sago", "dessert"],
  ["hong-kong-egg-tart", "dessert"], ["black-sesame-soup", "dessert"],
  ["matcha-usucha", "tea"], ["tieguanyin-gongfu", "tea"],
  ["darjeeling-first-flush-profile", "tea"], ["v60-pour-over", "coffee"],
  ["flat-white", "coffee"], ["ethiopia-yirgacheffe-washed-profile", "coffee"],
  ["cha-chaan-teng-lemon-coke", "non-alcoholic-drink"], ["kumquat-lemon-tea", "non-alcoholic-drink"],
  ["hong-kong-iced-lemon-tea", "non-alcoholic-drink"], ["yuenyeung", "non-alcoholic-drink"],
  ["rioja-reserva-profile", "alcoholic-drink"],
];

const palettes = [
  ["#9f2d20", "#eaa45b", "#65724b"], ["#594533", "#d3a94d", "#758f52"],
  ["#6e342f", "#dd784b", "#a6a75a"], ["#3b4e45", "#b57a4b", "#d9b04c"],
  ["#552f38", "#c26043", "#788e56"], ["#243f46", "#c98549", "#a3a45c"],
];

function seed(slug) {
  return Number.parseInt(createHash("sha256").update(slug).digest("hex").slice(0, 8), 16);
}

function foodMarks(slug, palette) {
  const value = seed(slug);
  return Array.from({ length: 11 }, (_, index) => {
    const angle = ((value >>> (index % 20)) + index * 47) % 360;
    const radius = 75 + ((value >>> (index % 12)) % 155);
    const x = 750 + Math.cos(angle * Math.PI / 180) * radius;
    const y = 505 + Math.sin(angle * Math.PI / 180) * radius * 0.55;
    const size = 72 + ((value >>> (index % 16)) % 94);
    const fill = palette[index % palette.length];
    return `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${size}" ry="${Math.round(size * 0.55)}" fill="${fill}" transform="rotate(${angle} ${x} ${y})"/>`;
  }).join("");
}

function vessel(type, slug, palette) {
  const marks = foodMarks(slug, palette);
  if (type === "tea" || type === "coffee") {
    const liquid = type === "tea" ? "#657746" : "#6c4d36";
    return `<ellipse cx="750" cy="725" rx="330" ry="55" fill="#1e1b18" opacity=".12"/><path d="M510 350h430v250c0 140-96 220-215 220s-215-80-215-220z" fill="#f7f0e6" stroke="#211e1a" stroke-width="18"/><path d="M940 425h75c105 0 105 205 0 205h-78" fill="none" stroke="#211e1a" stroke-width="26"/><ellipse cx="725" cy="385" rx="185" ry="55" fill="${liquid}"/><circle cx="665" cy="375" r="16" fill="${palette[1]}" opacity=".55"/><circle cx="790" cy="392" r="11" fill="#f4eadc" opacity=".42"/><path d="M615 315c-28-72 42-83 15-156M726 305c-18-67 41-84 16-150M825 318c-24-61 37-74 19-136" fill="none" stroke="#6f6a61" stroke-width="11" stroke-linecap="round" opacity=".58"/>`;
  }
  if (type.includes("drink")) {
    const wine = type === "alcoholic-drink";
    return wine
      ? `<ellipse cx="750" cy="805" rx="225" ry="42" fill="#1e1b18" opacity=".14"/><path d="M575 225h350c0 275-64 390-175 390S575 500 575 225z" fill="#f7f0e6" fill-opacity=".35" stroke="#211e1a" stroke-width="16"/><path d="M598 375h304c-14 153-62 221-152 221s-138-68-152-221z" fill="${palette[0]}" opacity=".88"/><path d="M750 615v165M630 800h240" stroke="#211e1a" stroke-width="18" stroke-linecap="round"/>`
      : `<ellipse cx="750" cy="800" rx="265" ry="48" fill="#1e1b18" opacity=".14"/><path d="M530 205h440l-55 575H585z" fill="#f7f0e6" fill-opacity=".45" stroke="#211e1a" stroke-width="18"/><path d="M570 390h360l-35 365H605z" fill="#8b4c32" opacity=".82"/><g fill="#f7f0e6" opacity=".7"><circle cx="650" cy="475" r="42"/><circle cx="792" cy="535" r="34"/><circle cx="852" cy="440" r="47"/></g><path d="M835 165 720 730" stroke="#211e1a" stroke-width="18" stroke-linecap="round"/>`;
  }
  if (type === "dessert") {
    return `<ellipse cx="750" cy="790" rx="390" ry="62" fill="#1e1b18" opacity=".14"/><path d="M390 390h720c-25 285-150 410-360 410S415 675 390 390z" fill="#f7f0e6" stroke="#211e1a" stroke-width="18"/><path d="M455 450h590c-42 170-137 265-295 265S497 620 455 450z" fill="#e5c985" opacity=".88"/>${marks}`;
  }
  return `<ellipse cx="750" cy="760" rx="520" ry="92" fill="#1e1b18" opacity=".16"/><ellipse cx="750" cy="490" rx="500" ry="310" fill="#f7f0e6" stroke="#211e1a" stroke-width="18"/><ellipse cx="750" cy="500" rx="410" ry="235" fill="#e9ddcb"/>${marks}<ellipse cx="750" cy="500" rx="410" ry="235" fill="none" stroke="#fdf9f2" stroke-width="25" opacity=".75"/>`;
}

function svg(slug, type) {
  const palette = palettes[seed(slug) % palettes.length];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1500" height="1000" viewBox="0 0 1500 1000"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f1e5d4"/><stop offset="1" stop-color="#d8c1a5"/></linearGradient><filter id="grain"><feTurbulence baseFrequency=".72" numOctaves="2" seed="${seed(slug) % 97}"/><feColorMatrix values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 .08 0"/></filter></defs><rect width="1500" height="1000" fill="url(#bg)"/><circle cx="1240" cy="125" r="220" fill="${palette[2]}" opacity=".18"/><circle cx="180" cy="850" r="290" fill="${palette[0]}" opacity=".12"/>${vessel(type, slug, palette)}<rect width="1500" height="1000" filter="url(#grain)" opacity=".16"/></svg>`;
}

for (const [slug, type] of items) {
  const outputDir = join(process.cwd(), "public", "images", "culinary", slug);
  await mkdir(outputDir, { recursive: true });
  await sharp(Buffer.from(svg(slug, type))).webp({ quality: 88, smartSubsample: true }).toFile(join(outputDir, "hero.webp"));
}

await writeFile(join(process.cwd(), "public", "images", "culinary", "m11-editorial-heroes.README.txt"), "Deterministic Cooking Lab original editorial illustrations generated by scripts/generate-m11-editorial-heroes.mjs. No external images or AI generation were used.\n");
console.log(`Generated ${items.length} deterministic M11 editorial Hero assets.`);
