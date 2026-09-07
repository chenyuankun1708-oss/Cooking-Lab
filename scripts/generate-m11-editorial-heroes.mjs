import { createHash } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

/**
 * M11 Batch A art direction.
 *
 * These are deliberately local, self-created editorial illustrations rather
 * than generic “dish / drink” placeholders. Every item names a vessel or
 * service form and at least two signature marks that remain legible at card
 * scale. Keep this map exhaustive: the renderer has no generic fallback.
 */
const art = {
  "lemon-chicken-breast": { type: "dish", layout: "plate-left", vessel: "plate", motifs: ["chicken", "lemon", "herb"], accent: "citrus" },
  "broccoli-chicken": { type: "dish", layout: "bowl-right", vessel: "bowl", motifs: ["chicken", "broccoli", "scallion"], accent: "leaf" },
  "mushroom-tofu-rice": { type: "dish", layout: "bowl-left", vessel: "rice-bowl", motifs: ["tofu", "mushroom", "rice"], accent: "earth" },
  "pan-seared-chicken-thigh": { type: "dish", layout: "skillet-right", vessel: "skillet", motifs: ["chicken", "garlic", "lemon"], accent: "ember" },
  "pepper-beef-stir-fry": { type: "dish", layout: "wok-left", vessel: "wok", motifs: ["beef", "red-bell-pepper", "green-bell-pepper"], accent: "pepper" },
  "tomato-beef-stew": { type: "dish", layout: "pot-right", vessel: "pot", motifs: ["beef", "tomato", "carrot"], accent: "tomato" },
  "potato-beef-stew": { type: "dish", layout: "pot-left", vessel: "pot", motifs: ["beef", "potato", "carrot"], accent: "earth" },
  "shrimp-scrambled-eggs": { type: "dish", layout: "plate-right", vessel: "plate", motifs: ["shrimp", "egg", "scallion"], accent: "citrus" },
  "steamed-salmon": { type: "dish", layout: "plate-left", vessel: "plate", motifs: ["salmon", "ginger", "scallion"], accent: "sea" },
  "roasted-salmon": { type: "dish", layout: "tray-right", vessel: "tray", motifs: ["salmon", "lemon", "garlic"], accent: "sea" },
  "steamed-egg": { type: "dish", layout: "bowl-center", vessel: "bowl", motifs: ["egg", "scallion", "soy"], accent: "gold" },
  "pan-fried-tofu": { type: "dish", layout: "plate-right", vessel: "plate", motifs: ["tofu", "garlic", "scallion"], accent: "ember" },
  "cold-shredded-chicken": { type: "dish", layout: "plate-left", vessel: "plate", motifs: ["chicken", "cucumber", "chili"], accent: "leaf" },
  "roasted-vegetables": { type: "dish", layout: "tray-left", vessel: "tray", motifs: ["carrot", "broccoli", "pepper"], accent: "ember" },
  "tomato-egg-soup": { type: "dish", layout: "soup-center", vessel: "soup-bowl", motifs: ["tomato", "egg", "scallion"], accent: "tomato" },
  "rice-cooker-chicken-rice": { type: "dish", layout: "rice-bowl-right", vessel: "rice-bowl", motifs: ["chicken", "rice", "mushroom"], accent: "gold" },
  "japanese-beef-potato-simmer": { type: "dish", layout: "pot-left", vessel: "pot", motifs: ["beef", "potato", "onion"], accent: "earth" },
  "korean-kimchi-fried-rice": { type: "dish", layout: "wok-right", vessel: "wok", motifs: ["rice", "kimchi", "scallion"], accent: "tomato" },
  "vietnamese-lemongrass-chicken": { type: "dish", layout: "plate-right", vessel: "plate", motifs: ["chicken", "lemongrass", "lime"], accent: "leaf" },
  "mexican-chicken-fajitas": { type: "dish", layout: "skillet-left", vessel: "skillet", motifs: ["chicken", "pepper", "lime"], accent: "pepper" },
  "double-skin-milk": { type: "dessert", layout: "bowl-center", vessel: "custard-bowl", motifs: ["custard", "milk", "mint"], accent: "milk" },
  "mango-pomelo-sago": { type: "dessert", layout: "glass-right", vessel: "dessert-glass", motifs: ["mango", "pomelo", "sago"], accent: "citrus" },
  "hong-kong-egg-tart": { type: "dessert", layout: "tart-left", vessel: "tart-plate", motifs: ["tart", "custard", "pastry"], accent: "gold" },
  "black-sesame-soup": { type: "dessert", layout: "bowl-right", vessel: "sweet-soup-bowl", motifs: ["sesame", "rice", "steam"], accent: "earth" },
  "matcha-usucha": { type: "tea", layout: "bowl-left", vessel: "matcha-bowl", motifs: ["matcha", "whisk", "foam"], accent: "leaf" },
  "tieguanyin-gongfu": { type: "tea", layout: "gaiwan-right", vessel: "gaiwan", motifs: ["oolong", "gaiwan", "tea-cup"], accent: "gold" },
  "darjeeling-first-flush-profile": { type: "tea", layout: "teapot-left", vessel: "teapot", motifs: ["black-tea", "tea-leaf", "tea-cup"], accent: "citrus" },
  "v60-pour-over": { type: "coffee", layout: "dripper-right", vessel: "v60", motifs: ["coffee", "dripper", "carafe"], accent: "earth" },
  "flat-white": { type: "coffee", layout: "cup-left", vessel: "flat-white-cup", motifs: ["coffee", "microfoam", "art"], accent: "milk" },
  "ethiopia-yirgacheffe-washed-profile": { type: "coffee", layout: "server-right", vessel: "coffee-server", motifs: ["coffee", "bean", "flower"], accent: "citrus" },
  "cha-chaan-teng-lemon-coke": { type: "non-alcoholic-drink", layout: "highball-left", vessel: "highball", motifs: ["cola", "lemon", "ice"], accent: "citrus" },
  "kumquat-lemon-tea": { type: "non-alcoholic-drink", layout: "glass-right", vessel: "tea-glass", motifs: ["kumquat", "lemon", "tea"], accent: "gold" },
  "hong-kong-iced-lemon-tea": { type: "non-alcoholic-drink", layout: "highball-right", vessel: "highball", motifs: ["black-tea", "lemon", "ice"], accent: "citrus" },
  "yuenyeung": { type: "non-alcoholic-drink", layout: "cup-center", vessel: "yin-yang-cup", motifs: ["coffee", "tea", "milk"], accent: "earth" },
  "rioja-reserva-profile": { type: "alcoholic-drink", layout: "wine-left", vessel: "wine-glass", motifs: ["red-wine", "oak", "grape"], accent: "berry" },
};

const palette = {
  ink: "#24211d", paper: "#f4eee4", shadow: "#24211d", red: "#c94a35",
  gold: "#d99d3d", green: "#6e8157", deepGreen: "#3f5a4a", brown: "#76503a",
  salmon: "#de775b", lemon: "#e6c348", cream: "#fffaf0", milk: "#eee5d4",
  sea: "#5f8791", purple: "#7b5362", ice: "#dce6e4",
};

function seed(slug) { return Number.parseInt(createHash("sha256").update(slug).digest("hex").slice(0, 8), 16); }
function colorFor(accent) {
  const color = { citrus: palette.lemon, leaf: palette.green, earth: palette.brown, ember: palette.red, pepper: palette.deepGreen, tomato: palette.salmon, sea: palette.sea, gold: palette.gold, milk: palette.milk, berry: palette.purple }[accent];
  if (!color) throw new Error(`Unmapped art accent: ${accent}`);
  return color;
}
function ellipse(x, y, rx, ry, fill, rotate = 0, opacity = 1) { return `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" opacity="${opacity}" transform="rotate(${rotate} ${x} ${y})"/>`; }
function circle(x, y, r, fill, opacity = 1) { return `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" opacity="${opacity}"/>`; }
function line(x1, y1, x2, y2, stroke, width = 16, opacity = 1) { return `<path d="M${x1} ${y1}L${x2} ${y2}" fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" opacity="${opacity}"/>`; }
function leaf(x, y, size, fill = palette.green, rotate = 0) { return ellipse(x, y, size * 0.42, size, fill, rotate); }
function lemon(x, y, size, rotate = 0) { return `<g transform="rotate(${rotate} ${x} ${y})">${circle(x, y, size, palette.lemon)}${line(x - size * .7, y, x + size * .7, y, palette.paper, 7)}${line(x, y - size * .7, x, y + size * .7, palette.paper, 7)}${circle(x, y, size * .22, palette.paper, .8)}</g>`; }
function tomato(x, y, size, rotate = 0) { return `<g transform="rotate(${rotate} ${x} ${y})">${circle(x, y, size, palette.salmon)}${leaf(x, y - size * .7, size * .22, palette.green, -20)}${leaf(x + size * .24, y - size * .65, size * .2, palette.green, 24)}</g>`; }
function pepper(x, y, size, fill = palette.red, rotate = 0) { return `<path d="M${x - size * .7} ${y - size * .2}C${x - size * .25} ${y - size * .9},${x + size * .7} ${y - size * .8},${x + size * .65} ${y}C${x + size * .5} ${y + size * .85},${x - size * .35} ${y + size * .9},${x - size * .7} ${y + size * .2}Z" fill="${fill}" transform="rotate(${rotate} ${x} ${y})"/>`; }
function pepperStrip(x, y, size, fill, rotate = 0) { return `<path d="M${x - size} ${y - size * .2}Q${x} ${y - size * .55} ${x + size} ${y - size * .05}L${x + size * .82} ${y + size * .28}Q${x} ${y - size * .08} ${x - size * .9} ${y + size * .2}Z" fill="${fill}" stroke="${palette.paper}" stroke-width="6" transform="rotate(${rotate} ${x} ${y})"/>`; }
function mushroom(x, y, size, rotate = 0) { return `<g transform="rotate(${rotate} ${x} ${y})"><path d="M${x - size} ${y}Q${x} ${y - size * .95} ${x + size} ${y}Z" fill="${palette.brown}"/><path d="M${x - size * .42} ${y}h${size * .84}v${size * .85}q-${size * .42} ${size * .3}-${size * .84} 0z" fill="${palette.milk}"/></g>`; }
function broccoli(x, y, size) { return `<g>${circle(x - size * .45, y, size * .5, palette.green)}${circle(x + size * .1, y - size * .18, size * .57, palette.deepGreen)}${circle(x + size * .55, y + size * .04, size * .44, palette.green)}${line(x, y + size * .25, x, y + size * .95, palette.green, size * .25)}</g>`; }
function shrimp(x, y, size, rotate = 0) { return `<path d="M${x - size} ${y + size * .2}Q${x - size * .35} ${y - size} ${x + size * .65} ${y - size * .3}Q${x + size} ${y + size * .2} ${x + size * .3} ${y + size * .7}Q${x - size * .25} ${y + size * .92} ${x - size} ${y + size * .2}Z" fill="${palette.salmon}" stroke="${palette.red}" stroke-width="8" transform="rotate(${rotate} ${x} ${y})"/>`; }
function chicken(x, y, size, rotate = 0) { return `<path d="M${x - size * .8} ${y - size * .4}Q${x - size * .15} ${y - size} ${x + size * .6} ${y - size * .35}Q${x + size} ${y + size * .25} ${x + size * .3} ${y + size * .75}Q${x - size * .5} ${y + size * .8} ${x - size * .8} ${y - size * .4}Z" fill="${palette.gold}" stroke="${palette.brown}" stroke-width="8" transform="rotate(${rotate} ${x} ${y})"/>`; }
function tofu(x, y, size, rotate = 0) { return `<rect x="${x - size}" y="${y - size * .65}" width="${size * 2}" height="${size * 1.3}" rx="${size * .16}" fill="${palette.cream}" stroke="${palette.gold}" stroke-width="8" transform="rotate(${rotate} ${x} ${y})"/>`; }
function egg(x, y, size, rotate = 0) { return `<path d="M${x} ${y - size}C${x + size * .75} ${y - size * .9},${x + size} ${y},${x + size * .35} ${y + size * .8}C${x - size * .15} ${y + size * 1.05},${x - size} ${y + size * .55},${x - size * .78} ${y - size * .1}C${x - size * .65} ${y - size * .72},${x - size * .25} ${y - size},${x} ${y - size}Z" fill="${palette.cream}" stroke="${palette.gold}" stroke-width="8" transform="rotate(${rotate} ${x} ${y})"/>${circle(x + size * .06, y - size * .05, size * .27, palette.gold)}`; }
function salmon(x, y, size, rotate = 0) { return `<g transform="rotate(${rotate} ${x} ${y})"><path d="M${x - size} ${y}Q${x} ${y - size * .75} ${x + size} ${y}Q${x} ${y + size * .75} ${x - size} ${y}Z" fill="${palette.salmon}" stroke="${palette.red}" stroke-width="8"/>${line(x - size * .45, y - size * .4, x + size * .25, y + size * .35, palette.milk, 8)}${line(x - size * .15, y - size * .55, x + size * .55, y + size * .18, palette.milk, 8)}</g>`; }
function rice(x, y, size) { return `<g>${ellipse(x, y, size * 1.08, size * .54, palette.cream)}${[[-.5,-.15],[0,-.28],[.52,-.04],[-.2,.15],[.28,.2]].map(([dx,dy]) => ellipse(x + dx * size, y + dy * size, size * .18, size * .08, palette.gold, -20)).join("")}</g>`; }
function ice(x, y, size, rotate = 0) { return `<rect x="${x - size / 2}" y="${y - size / 2}" width="${size}" height="${size}" rx="${size * .12}" fill="${palette.ice}" stroke="${palette.paper}" stroke-width="8" transform="rotate(${rotate} ${x} ${y})"/>`; }

function abstractSmall(kind, x, y, size, rotate = 0) {
  if (kind === "bean") return `<path d="M${x - size * .5} ${y - size * .8}Q${x + size} ${y - size * .4} ${x + size * .35} ${y + size * .75}Q${x - size} ${y + size * .4} ${x - size * .5} ${y - size * .8}Z" fill="${palette.brown}" transform="rotate(${rotate} ${x} ${y})"/>${line(x - size * .3, y - size * .5, x + size * .28, y + size * .5, palette.gold, 7)}`;
  if (kind === "grape") return Array.from({ length: 6 }, (_, i) => circle(x + ((i % 2) - .5) * size * .65, y + (Math.floor(i / 2) - 1) * size * .5, size * .28, palette.purple)).join("");
  if (kind === "flower") return `${circle(x, y, size * .3, palette.gold)}${[0, 1, 2, 3, 4].map((i) => circle(x + Math.cos(i * 1.256) * size * .47, y + Math.sin(i * 1.256) * size * .47, size * .27, palette.cream)).join("")}`;
  if (kind === "oak") return [0, 1, 2].map((i) => ellipse(x + i * size * .35, y + ((i % 2) ? -.18 : .18) * size, size * .24, size * .62, palette.brown, -20 + i * 20)).join("");
  if (kind === "red-wine") return ellipse(x, y, size * .7, size * .4, palette.purple, rotate);
  if (kind === "cola") return ellipse(x, y, size * .7, size * .36, palette.brown, rotate);
  if (kind === "milk" || kind === "microfoam") return ellipse(x, y, size * .8, size * .34, palette.cream, rotate);
  if (kind === "ice") return ice(x, y, size * .8, rotate);
  if (kind === "tea") return leaf(x, y, size * .65, palette.deepGreen, rotate);
  if (kind === "coffee") return abstractSmall("bean", x, y, size, rotate);
  if (kind === "gaiwan") return `<path d="M${x - size * .7} ${y - size * .3}h${size * 1.4}q-${size * .1} ${size * .7}-${size * .7} ${size * .7}t-${size * .7}-${size * .7}z" fill="${palette.cream}" stroke="${palette.ink}" stroke-width="8"/>`;
  if (kind === "tea-cup") return `${ellipse(x, y, size * .62, size * .3, palette.gold)}${circle(x + size * .62, y, size * .2, "none", 1).replace('fill="none"', `fill="none" stroke="${palette.ink}" stroke-width="8"`)}`;
  if (kind === "dripper") return `<path d="M${x - size * .6} ${y - size * .55}h${size * 1.2}l-${size * .3} ${size * .95}h-${size * .6}z" fill="${palette.cream}" stroke="${palette.ink}" stroke-width="8"/>`;
  if (kind === "carafe") return `<path d="M${x - size * .4} ${y - size * .7}h${size * .8}l${size * .3} ${size * 1.25}h-${size * 1.4}z" fill="${palette.cream}" fill-opacity=".6" stroke="${palette.ink}" stroke-width="8"/>`;
  if (kind === "art") return `${circle(x, y, size * .58, palette.cream)}${circle(x, y, size * .3, palette.gold)}${circle(x, y, size * .11, palette.brown)}`;
  throw new Error(`Unmapped abstract art motif: ${kind}`);
}

function motif(kind, x, y, size, rotate = 0) {
  switch (kind) {
    case "chicken": return chicken(x, y, size, rotate);
    case "lemon": case "lime": return lemon(x, y, size * .55, rotate);
    case "herb": case "dill": case "mint": case "scallion": case "thyme": case "ginger": case "peas": return leaf(x, y, size * .65, palette.green, rotate);
    case "broccoli": return broccoli(x, y, size);
    case "mushroom": return mushroom(x, y, size * .65, rotate);
    case "tofu": return tofu(x, y, size * .75, rotate);
    case "beef": return ellipse(x, y, size * 1.2, size * .34, palette.brown, rotate);
    case "pepper": case "chili": return pepper(x, y, size * .8, palette.red, rotate);
    case "red-bell-pepper": return pepperStrip(x, y, size, palette.red, rotate);
    case "green-bell-pepper": return pepperStrip(x, y, size, palette.green, rotate);
    case "onion": case "soy": return circle(x, y, size * .6, palette.milk, .92);
    case "garlic": return [0, 1, 2].map((i) => circle(x + (i - 1) * size * .42, y + (i % 2) * size * .18, size * .4, palette.cream)).join("");
    case "tomato": return tomato(x, y, size * .65, rotate);
    case "carrot": return pepper(x, y, size * .75, palette.gold, rotate + 20);
    case "potato": return ellipse(x, y, size * .82, size * .58, palette.gold, rotate);
    case "shrimp": return shrimp(x, y, size * .75, rotate);
    case "egg": return egg(x, y, size * .68, rotate);
    case "salmon": return salmon(x, y, size * .8, rotate);
    case "cucumber": return ellipse(x, y, size * .9, size * .28, palette.green, rotate);
    case "rice": return rice(x, y, size * .72);
    case "kimchi": return pepper(x, y, size, palette.red, rotate);
    case "lemongrass": return line(x - size, y + size * .7, x + size, y - size * .7, palette.green, size * .2);
    case "mango": return ellipse(x, y, size * .8, size * .55, palette.gold, rotate);
    case "kumquat": return circle(x, y, size * .52, palette.gold);
    case "pomelo": return circle(x, y, size * .58, palette.salmon);
    case "sago": return circle(x, y, size * .2, palette.cream, .9);
    case "tart": return `<ellipse cx="${x}" cy="${y}" rx="${size}" ry="${size * .75}" fill="${palette.gold}" stroke="${palette.brown}" stroke-width="8"/>${ellipse(x, y - size * .05, size * .7, size * .48, palette.cream)}`;
    case "custard": return ellipse(x, y, size, size * .5, palette.cream);
    case "pastry": return ellipse(x, y, size, size * .22, palette.gold, rotate);
    case "sesame": return Array.from({ length: 7 }, (_, i) => ellipse(x + ((i % 3) - 1) * size * .4, y + (Math.floor(i / 3) - 1) * size * .22, size * .16, size * .08, palette.ink, -25)).join("");
    case "matcha": return ellipse(x, y, size, size * .42, palette.green);
    case "whisk": return Array.from({ length: 5 }, (_, i) => line(x - size * .5 + i * size * .25, y - size * .7, x + (i - 2) * size * .18, y + size * .8, palette.ink, 7, .8)).join("");
    case "foam": return [0, 1, 2].map((i) => circle(x + (i - 1) * size * .45, y, size * .25, palette.cream)).join("");
    case "oolong": case "black-tea": case "tea-leaf": return leaf(x, y, size * .7, palette.deepGreen, rotate);
    case "gaiwan": case "tea-cup": case "coffee": case "bean": case "flower": case "dripper": case "carafe": case "microfoam": case "art": case "cola": case "tea": case "milk": case "oak": case "grape": case "red-wine": case "ice": return abstractSmall(kind, x, y, size, rotate);
    case "steam": return line(x, y + size * .7, x - size * .1, y - size * .7, palette.ink, 9, .38);
    default: throw new Error(`Unmapped art motif: ${kind}`);
  }
}

function vesselShape(kind, x, y, scale, liquid = palette.milk) {
  const s = scale;
  const stroke = palette.ink;
  if (["plate", "tart-plate", "tray"].includes(kind)) return `${ellipse(x, y + s * .48, s * 1.75, s * .3, palette.shadow, 0, .13)}${ellipse(x, y, s * 1.65, s * .92, palette.cream)}${ellipse(x, y - s * .03, s * 1.36, s * .68, liquid)}<ellipse cx="${x}" cy="${y - s * .03}" rx="${s * 1.36}" ry="${s * .68}" fill="none" stroke="${stroke}" stroke-width="16"/>`;
  if (["bowl", "rice-bowl", "soup-bowl", "custard-bowl", "sweet-soup-bowl"].includes(kind)) return `${ellipse(x, y + s * .52, s * 1.4, s * .24, palette.shadow, 0, .13)}<path d="M${x - s * 1.35} ${y - s * .15}Q${x} ${y + s * 1.45} ${x + s * 1.35} ${y - s * .15}Z" fill="${palette.cream}" stroke="${stroke}" stroke-width="16"/><ellipse cx="${x}" cy="${y - s * .1}" rx="${s * 1.18}" ry="${s * .42}" fill="${liquid}" stroke="${stroke}" stroke-width="12"/>`;
  if (["skillet", "wok"].includes(kind)) return `${ellipse(x, y + s * .56, s * 1.35, s * .22, palette.shadow, 0, .13)}<ellipse cx="${x}" cy="${y}" rx="${s * 1.22}" ry="${s * .73}" fill="${palette.ink}"/><ellipse cx="${x}" cy="${y - s * .05}" rx="${s * .96}" ry="${s * .53}" fill="${liquid}"/><path d="M${x + s * 1.05} ${y - s * .2}L${x + s * 2.1} ${y - s * .55}" stroke="${stroke}" stroke-width="${s * .22}" stroke-linecap="round"/>`;
  if (kind === "pot") return `${ellipse(x, y + s * .62, s * 1.2, s * .2, palette.shadow, 0, .13)}<path d="M${x - s} ${y - s * .65}h${s * 2}v${s * 1.3}q0 ${s * .7}-${s} ${s * .7}t-${s}-${s * .7}z" fill="${palette.cream}" stroke="${stroke}" stroke-width="16"/><ellipse cx="${x}" cy="${y - s * .62}" rx="${s}" ry="${s * .22}" fill="${liquid}" stroke="${stroke}" stroke-width="12"/><path d="M${x - s * .5} ${y - s * .9}h${s}" stroke="${stroke}" stroke-width="16"/>`;
  if (["dessert-glass", "highball", "tea-glass"].includes(kind)) return `${ellipse(x, y + s * .72, s * .88, s * .16, palette.shadow, 0, .13)}<path d="M${x - s * .9} ${y - s * .9}h${s * 1.8}l-${s * .2} ${s * 1.6}h-${s * 1.4}z" fill="${palette.cream}" fill-opacity=".5" stroke="${stroke}" stroke-width="14"/><path d="M${x - s * .68} ${y - s * .18}h${s * 1.4}l-${s * .13} ${s * .65}h-${s * 1.14}z" fill="${liquid}"/>`;
  if (["matcha-bowl", "gaiwan"].includes(kind)) return `${ellipse(x, y + s * .55, s * 1.05, s * .18, palette.shadow, 0, .13)}<path d="M${x - s * .85} ${y - s * .5}Q${x - s * .72} ${y + s * .8} ${x} ${y + s}Q${x + s * .72} ${y + s * .8} ${x + s * .85} ${y - s * .5}Z" fill="${palette.cream}" stroke="${stroke}" stroke-width="14"/><ellipse cx="${x}" cy="${y - s * .48}" rx="${s * .7}" ry="${s * .22}" fill="${liquid}" stroke="${stroke}" stroke-width="10"/>`;
  if (kind === "teapot") return `${ellipse(x, y + s * .63, s * 1.25, s * .18, palette.shadow, 0, .13)}<path d="M${x - s * .72} ${y - s * .48}h${s * 1.44}v${s * 1.12}q0 ${s * .52}-${s * .72} ${s * .52}t-${s * .72}-${s * .52}z" fill="${palette.cream}" stroke="${stroke}" stroke-width="14"/><ellipse cx="${x}" cy="${y - s * .48}" rx="${s * .72}" ry="${s * .18}" fill="${liquid}"/><path d="M${x - s * .68} ${y - s * .22}L${x - s * 1.35} ${y - s * .52}L${x - s * .82} ${y + s * .05}" fill="${palette.cream}" stroke="${stroke}" stroke-width="12" stroke-linejoin="round"/><path d="M${x + s * .68} ${y - s * .18}q${s * .72}-${s * .3} ${s * .96} ${s * .36}" fill="none" stroke="${stroke}" stroke-width="12"/>`;
  if (kind === "coffee-server") return `${ellipse(x, y + s * .63, s * 1.25, s * .18, palette.shadow, 0, .13)}<path d="M${x - s * .72} ${y - s * .5}h${s * 1.44}v${s * 1.14}q0 ${s * .54}-${s * .72} ${s * .54}t-${s * .72}-${s * .54}z" fill="${palette.cream}" fill-opacity=".58" stroke="${stroke}" stroke-width="14"/><path d="M${x - s * .58} ${y + s * .08}h${s * 1.16}v${s * .45}q0 ${s * .28}-${s * .58} ${s * .28}t-${s * .58}-${s * .28}z" fill="${liquid}"/><path d="M${x - s * .68} ${y - s * .28}L${x - s * 1.2} ${y - s * .5}L${x - s * .78} ${y - s * .02}" fill="${palette.cream}" fill-opacity=".58" stroke="${stroke}" stroke-width="12" stroke-linejoin="round"/><path d="M${x + s * .68} ${y - s * .14}q${s * .72}-${s * .28} ${s * .96} ${s * .4}" fill="none" stroke="${stroke}" stroke-width="12"/>`;
  if (kind === "v60") return `${ellipse(x, y + s * .68, s * 1.05, s * .16, palette.shadow, 0, .13)}<path d="M${x - s * .7} ${y - s * .6}h${s * 1.4}l-${s * .32} ${s * 1.25}h-${s * .76}z" fill="${palette.cream}" stroke="${stroke}" stroke-width="14"/><path d="M${x - s * .48} ${y - s * .2}h${s * .96}" stroke="${palette.brown}" stroke-width="${s * .3}"/>`;
  if (kind === "flat-white-cup") return `${ellipse(x, y + s * .44, s * 1.05, s * .15, palette.shadow, 0, .13)}<path d="M${x - s * .88} ${y - s * .38}h${s * 1.76}v${s * .68}q0 ${s * .44}-${s * .88} ${s * .44}t-${s * .88}-${s * .44}z" fill="${palette.cream}" stroke="${stroke}" stroke-width="14"/><ellipse cx="${x}" cy="${y - s * .38}" rx="${s * .88}" ry="${s * .24}" fill="${liquid}"/><path d="M${x + s * .84} ${y - s * .08}q${s * .48}-${s * .18} ${s * .5} ${s * .3}q-${s * .06} ${s * .35}-${s * .46} ${s * .2}" fill="none" stroke="${stroke}" stroke-width="12"/>`;
  if (kind === "yin-yang-cup") return `${ellipse(x, y + s * .55, s * .88, s * .15, palette.shadow, 0, .13)}<path d="M${x - s * .7} ${y - s * .55}h${s * 1.4}v${s * 1.05}q0 ${s * .55}-${s * .7} ${s * .55}t-${s * .7}-${s * .55}z" fill="${palette.cream}" stroke="${stroke}" stroke-width="14"/><ellipse cx="${x}" cy="${y - s * .55}" rx="${s * .7}" ry="${s * .2}" fill="${liquid}"/><path d="M${x} ${y - s * .73}v${s * .36}" stroke="${palette.cream}" stroke-width="8"/>`;
  if (kind === "wine-glass") return `${ellipse(x, y + s * .76, s * .9, s * .12, palette.shadow, 0, .13)}<path d="M${x - s * .72} ${y - s * .8}h${s * 1.44}q-${s * .1} ${s * 1.05}-${s * .72} ${s * 1.05}t-${s * .72}-${s * 1.05}z" fill="${palette.cream}" fill-opacity=".36" stroke="${stroke}" stroke-width="12"/><path d="M${x - s * .55} ${y - s * .1}h${s * 1.1}" stroke="${palette.purple}" stroke-width="${s * .35}"/><path d="M${x} ${y + s * .25}v${s * .55}M${x - s * .55} ${y + s * .8}h${s * 1.1}" stroke="${stroke}" stroke-width="12" stroke-linecap="round"/>`;
  throw new Error(`Unmapped art vessel: ${kind}`);
}

function signatureMarks(item, x, y, size) {
  const offsets = [[-.72, -.14, -18], [0, .08, 18], [.72, -.1, -8], [-.42, .28, 12], [.38, .3, -15]];
  return offsets.map(([dx, dy, rotate], index) => {
    const kind = item.motifs[index % item.motifs.length];
    return motif(kind, x + dx * size, y + dy * size, size * (index < 3 ? .5 : .36), rotate);
  }).join("");
}

function featuredScene(slug, x, y, size) {
  if (slug === "lemon-chicken-breast") {
    return `${vesselShape("plate", x, y, size, "#ead8a5")}
      ${[[-.65,-.12,-12],[-.2,.08,4],[.28,-.03,10],[.68,.16,18]].map(([dx,dy,r]) => chicken(x + dx * size, y + dy * size, size * .48, r)).join("")}
      <path d="M${x - size * 1.05} ${y + size * .34}Q${x} ${y + size * .6} ${x + size * 1.08} ${y + size * .28}" fill="none" stroke="#c98f36" stroke-width="24" stroke-linecap="round" opacity=".72"/>
      ${lemon(x + size * .88, y - size * .42, size * .25, 10)}${[0,1,2].map((i) => leaf(x - size * .72 + i * size * .23, y - size * .52 + i * 8, size * .15, palette.green, -30 + i * 20)).join("")}`;
  }
  if (slug === "steamed-egg") {
    return `${vesselShape("bowl", x, y, size, "#efcf73")}
      <ellipse cx="${x}" cy="${y - size * .1}" rx="${size * 1.02}" ry="${size * .34}" fill="#f2d882"/>
      <path d="M${x - size * .86} ${y - size * .05}Q${x} ${y + size * .12} ${x + size * .86} ${y - size * .06}" fill="none" stroke="#8b5639" stroke-width="14" opacity=".72"/>
      ${[-.55,-.18,.22,.58].map((dx, i) => line(x + dx * size, y - size * (.23 - i * .02), x + (dx + .13) * size, y - size * (.36 - i * .02), palette.deepGreen, 14)).join("")}`;
  }
  if (slug === "tomato-beef-stew") {
    return `${vesselShape("pot", x, y, size, "#b8523f")}
      ${[[-.62,-.05,-12],[-.08,.18,8],[.52,-.08,-18]].map(([dx,dy,r]) => motif("beef", x + dx * size, y + dy * size, size * .4, r)).join("")}
      ${[[-.42,-.28],[.12,-.2],[.62,.18]].map(([dx,dy], i) => tomato(x + dx * size, y + dy * size, size * .22, i * 18)).join("")}
      ${motif("carrot", x + size * .4, y + size * .23, size * .28, 34)}`;
  }
  if (slug === "potato-beef-stew") {
    return `${vesselShape("pot", x, y, size, "#8b6848")}
      ${[[-.62,-.12,-10],[-.08,.18,9],[.5,-.04,-16]].map(([dx,dy,r]) => motif("beef", x + dx * size, y + dy * size, size * .38, r)).join("")}
      ${[[-.4,-.28,12],[.2,-.2,-8],[.62,.2,18]].map(([dx,dy,r]) => motif("potato", x + dx * size, y + dy * size, size * .34, r)).join("")}
      ${motif("carrot", x - size * .02, y + size * .28, size * .24, 28)}`;
  }
  if (slug === "shrimp-scrambled-eggs") {
    const curds = [[-.55,-.18,-10],[-.08,.08,7],[.42,-.12,-5],[-.32,.3,12],[.5,.25,-14]]
      .map(([dx,dy,r]) => ellipse(x + dx * size, y + dy * size, size * .34, size * .2, "#f2cc65", r)).join("");
    return `${vesselShape("plate", x, y, size, "#fff3cf")}${curds}
      ${shrimp(x - size * .5, y - size * .04, size * .28, -18)}${shrimp(x + size * .32, y + size * .08, size * .28, 18)}
      ${[-.62,-.18,.28,.62].map((dx) => line(x + dx * size, y - size * .35, x + (dx + .12) * size, y - size * .48, palette.deepGreen, 12)).join("")}`;
  }
  if (slug === "cold-shredded-chicken") {
    const shreds = Array.from({ length: 10 }, (_, i) => line(
      x - size * .62 + (i % 5) * size * .3,
      y - size * .18 + Math.floor(i / 5) * size * .34,
      x - size * .32 + (i % 5) * size * .3,
      y - size * .36 + Math.floor(i / 5) * size * .34,
      i % 3 === 0 ? palette.brown : palette.gold,
      20,
    )).join("");
    const cucumbers = [-.58,0,.58].map((dx, i) => `<g transform="rotate(${-18 + i * 18} ${x + dx * size} ${y + size * .34})">${ellipse(x + dx * size, y + size * .34, size * .24, size * .1, palette.green)}${ellipse(x + dx * size, y + size * .34, size * .14, size * .05, palette.cream)}</g>`).join("");
    return `${vesselShape("plate", x, y, size, "#eee4bd")}${shreds}${cucumbers}${pepper(x + size * .65, y - size * .35, size * .18, palette.red, 20)}
      ${[-.28,.18,.5].map((dx, i) => line(x + dx * size, y - size * .42, x + (dx + .14) * size, y - size * (.55 - i * .03), palette.deepGreen, 12)).join("")}`;
  }
  if (slug === "tomato-egg-soup") {
    const ribbons = [-.55,-.18,.2,.55].map((dx, i) => `<path d="M${x + dx * size} ${y - size * .34}q${size * (.16 - i * .02)} ${size * .22} ${size * .04} ${size * .5}" fill="none" stroke="#f4d979" stroke-width="28" stroke-linecap="round"/>`).join("");
    return `${vesselShape("soup-bowl", x, y, size, "#c95743")}${ribbons}
      ${tomato(x - size * .58, y + size * .12, size * .2, -10)}${tomato(x + size * .42, y - size * .12, size * .18, 12)}
      ${[-.45,.08,.5].map((dx) => line(x + dx * size, y + size * .24, x + (dx + .12) * size, y + size * .1, palette.deepGreen, 11)).join("")}`;
  }
  if (slug === "rice-cooker-chicken-rice") {
    return `${vesselShape("rice-bowl", x, y, size, "#f1e5c5")}${rice(x, y + size * .12, size * .72)}
      ${chicken(x - size * .48, y - size * .23, size * .35, -18)}${chicken(x + size * .18, y - size * .18, size * .33, 12)}
      ${mushroom(x + size * .62, y + size * .02, size * .24, 10)}${mushroom(x + size * .48, y - size * .28, size * .19, -12)}
      ${[-.18,.22,.58].map((dx, i) => line(x + dx * size, y + size * .33, x + (dx + .13) * size, y + size * (.2 - i * .02), palette.deepGreen, 11)).join("")}`;
  }
  if (slug === "japanese-beef-potato-simmer") {
    return `${vesselShape("pot", x, y, size, "#9a633f")}
      ${[[-.62,-.12,-8],[-.05,.12,10],[.58,-.04,-15]].map(([dx,dy,r]) => motif("potato", x + dx * size, y + dy * size, size * .45, r)).join("")}
      ${[[-.38,.2,8],[.28,-.22,-12],[.62,.25,15]].map(([dx,dy,r]) => motif("beef", x + dx * size, y + dy * size, size * .38, r)).join("")}
      ${motif("carrot", x - size * .74, y - size * .32, size * .34, 28)}${motif("onion", x + size * .05, y - size * .35, size * .3)}`;
  }
  if (slug === "korean-kimchi-fried-rice") {
    const grains = Array.from({ length: 17 }, (_, i) => {
      const col = i % 6;
      const row = Math.floor(i / 6);
      return ellipse(x + (col - 2.5) * size * .26, y - size * .18 + row * size * .2, size * .16, size * .07, i % 4 === 0 ? palette.gold : "#d76245", -18 + (i % 3) * 16);
    }).join("");
    return `${vesselShape("wok", x, y, size, "#a93f32")}${grains}
      ${[[-.55,-.24],[.18,.18],[.62,-.08]].map(([dx,dy], i) => pepper(x + dx * size, y + dy * size, size * .25, "#b6342d", -20 + i * 25)).join("")}
      ${[[-.7,.22],[.46,.3]].map(([dx,dy]) => line(x + dx * size, y + dy * size, x + (dx + .24) * size, y + (dy - .16) * size, palette.deepGreen, 12)).join("")}`;
  }
  if (slug === "vietnamese-lemongrass-chicken") {
    const pieces = [[-.58,-.12,-16],[-.05,.16,8],[.5,-.08,18]].map(([dx,dy,r]) => chicken(x + dx * size, y + dy * size, size * .42, r)).join("");
    const sear = [[-.64,-.1],[-.12,.18],[.45,-.06]].map(([dx,dy]) => line(x + (dx - .14) * size, y + (dy - .04) * size, x + (dx + .14) * size, y + (dy + .04) * size, palette.brown, 10, .9)).join("");
    return `${vesselShape("plate", x, y, size, "#e9d7a9")}${pieces}${sear}
      ${[-.7,-.32,.08].map((dx, i) => line(x + dx * size, y + size * .38, x + (dx + .62) * size, y - size * (.5 - i * .08), palette.green, 11)).join("")}
      ${lemon(x + size * .66, y + size * .28, size * .2, -12)}${leaf(x + size * .55, y - size * .38, size * .18, palette.deepGreen, 28)}`;
  }
  if (slug === "mexican-chicken-fajitas") {
    const tortillas = [-.46,.15].map((dx, i) => ellipse(x + dx * size, y + size * .3, size * .58, size * .22, "#e8c878", i ? 10 : -8)).join("");
    return `${vesselShape("skillet", x, y, size, "#eadcb7")}${tortillas}
      ${chicken(x - size * .38, y - size * .2, size * .34, -14)}${chicken(x + size * .24, y - size * .12, size * .32, 14)}
      ${pepper(x + size * .58, y + size * .1, size * .24, palette.red, 18)}
      ${[[-.62,.12,-12],[.02,-.34,15]].map(([dx,dy,r]) => ellipse(x + dx * size, y + dy * size, size * .28, size * .1, palette.milk, r)).join("")}${lemon(x + size * .7, y - size * .34, size * .18, 10)}`;
  }
  if (slug === "double-skin-milk") {
    return `${vesselShape("custard-bowl", x, y, size, "#f6f0df")}
      <ellipse cx="${x}" cy="${y - size * .11}" rx="${size * 1.02}" ry="${size * .32}" fill="#fffaf0"/>
      <path d="M${x - size * .86} ${y - size * .14}Q${x} ${y - size * .34} ${x + size * .86} ${y - size * .14}" fill="none" stroke="#d5c5a9" stroke-width="13" stroke-linecap="round"/>
      <path d="M${x - size * .78} ${y - size * .02}Q${x} ${y - size * .18} ${x + size * .78} ${y - size * .02}" fill="none" stroke="#eee1c9" stroke-width="10" stroke-linecap="round"/>`;
  }
  if (slug === "black-sesame-soup") {
    return `${vesselShape("sweet-soup-bowl", x, y, size, palette.ink)}
      <ellipse cx="${x}" cy="${y - size * .1}" rx="${size * 1.02}" ry="${size * .33}" fill="#24211d"/>
      ${[-.52,-.18,.2,.54].map((dx, i) => ellipse(x + dx * size, y - size * (.13 + (i % 2) * .08), size * .09, size * .04, "#5d554c", -20 + i * 12)).join("")}
      ${motif("sesame", x + size * 1.45, y + size * .46, size * .42, -8)}
      ${[0,1,2].map((i) => `<path d="M${x - size * .35 + i * size * .35} ${y - size * .7}q-${size * .12}-${size * .34} ${size * .03}-${size * .64}" fill="none" stroke="${palette.ink}" stroke-width="10" stroke-linecap="round" opacity=".34"/>`).join("")}`;
  }
  if (slug === "tieguanyin-gongfu") {
    return `${vesselShape("gaiwan", x - size * .28, y, size * .82, palette.gold)}
      <ellipse cx="${x - size * .28}" cy="${y - size * .55}" rx="${size * .52}" ry="${size * .16}" fill="${palette.cream}" stroke="${palette.ink}" stroke-width="11"/>
      ${circle(x - size * .28, y - size * .72, size * .08, palette.cream)}
      ${vesselShape("coffee-server", x + size * .72, y + size * .16, size * .42, palette.gold)}
      ${abstractSmall("tea-cup", x + size * 1.25, y + size * .43, size * .35)}
      ${[-.62,-.22,.18].map((dx, i) => leaf(x + dx * size, y + size * .58, size * .15, palette.deepGreen, -30 + i * 25)).join("")}`;
  }
  if (slug === "mango-pomelo-sago") {
    const pearls = Array.from({ length: 18 }, (_, i) => circle(x + ((i % 6) - 2.5) * size * .22, y + (Math.floor(i / 6) - .15) * size * .18, size * .07, palette.cream, .92)).join("");
    const pomelo = [[-.28,-.04],[.32,.06]].map(([dx,dy]) => Array.from({ length: 4 }, (_, i) => circle(x + dx * size + (i % 2) * size * .1, y + dy * size + Math.floor(i / 2) * size * .1, size * .055, palette.salmon)).join("")).join("");
    return `${vesselShape("dessert-glass", x, y, size, "#e6a934")}${pearls}
      ${[[-.48,-.28,-12],[.05,-.36,10],[.5,-.2,22]].map(([dx,dy,r]) => ellipse(x + dx * size, y + dy * size, size * .28, size * .2, palette.gold, r)).join("")}${pomelo}`;
  }
  if (slug === "cha-chaan-teng-lemon-coke") {
    const bubbles = [[-.35,-.35,.07],[.2,-.22,.05],[.45,.18,.08],[-.18,.3,.045],[.55,-.42,.04]];
    return `${vesselShape("highball", x, y, size, "#4a2b21")}
      ${ice(x - size * .38, y - size * .26, size * .38, -12)}${ice(x + size * .28, y - size * .08, size * .34, 14)}
      ${lemon(x + size * .48, y + size * .18, size * .23, 18)}
      ${bubbles.map(([dx,dy,r]) => `<circle cx="${x + dx * size}" cy="${y + dy * size}" r="${size * r}" fill="none" stroke="${palette.cream}" stroke-width="8" opacity=".75"/>`).join("")}`;
  }
  if (slug === "flat-white") {
    return `${vesselShape("flat-white-cup", x, y, size, "#8b573c")}
      <ellipse cx="${x}" cy="${y - size * .55}" rx="${size * .62}" ry="${size * .16}" fill="#8b573c"/>
      <path d="M${x - size * .48} ${y - size * .55}Q${x - size * .16} ${y - size * .75} ${x + size * .02} ${y - size * .55}T${x + size * .48} ${y - size * .55}" fill="none" stroke="${palette.cream}" stroke-width="22" stroke-linecap="round"/>
      <path d="M${x - size * .3} ${y - size * .55}Q${x} ${y - size * .67} ${x + size * .3} ${y - size * .55}" fill="none" stroke="#fffdf7" stroke-width="9" stroke-linecap="round"/>`;
  }
  if (slug === "rioja-reserva-profile") {
    return `${vesselShape("wine-glass", x, y, size, palette.purple)}
      <path d="M${x - size * .53} ${y - size * .1}h${size * 1.06}q-${size * .1} ${size * .48}-${size * .53} ${size * .48}t-${size * .53}-${size * .48}z" fill="${palette.purple}" opacity=".95"/>
      ${motif("grape", x + size * 1.3, y + size * .08, size * .62)}
      ${motif("oak", x + size * 1.1, y + size * .72, size * .5, -12)}`;
  }
  if (slug === "kumquat-lemon-tea") {
    return `${vesselShape("tea-glass", x, y, size, "#8f5b32")}
      ${ice(x - size * .25, y - size * .18, size * .3, -10)}${ice(x + size * .34, y + size * .12, size * .28, 12)}
      ${[-.48,.04,.5].map((dx) => circle(x + dx * size, y - size * .28, size * .18, palette.gold)).join("")}
      ${lemon(x + size * .45, y + size * .28, size * .2, 12)}${leaf(x - size * .62, y + size * .3, size * .15, palette.deepGreen, -28)}`;
  }
  if (slug === "hong-kong-iced-lemon-tea") {
    return `${vesselShape("highball", x, y, size, "#704425")}
      ${ice(x - size * .3, y - size * .24, size * .3, -12)}${ice(x + size * .28, y + size * .14, size * .28, 14)}
      ${[-.45,0,.44].map((dx, i) => lemon(x + dx * size, y - size * (.1 + i * .08), size * .18, -14 + i * 14)).join("")}`;
  }
  if (slug === "yuenyeung") {
    return `${vesselShape("yin-yang-cup", x, y, size, palette.brown)}
      <ellipse cx="${x}" cy="${y - size * .55}" rx="${size * .64}" ry="${size * .17}" fill="#9f6f4d"/>
      <path d="M${x} ${y - size * .72}C${x - size * .44} ${y - size * .7},${x - size * .44} ${y - size * .42},${x} ${y - size * .4}C${x + size * .44} ${y - size * .42},${x + size * .44} ${y - size * .7},${x} ${y - size * .72}Z" fill="#4f3025"/>
      <path d="M${x} ${y - size * .72}C${x + size * .44} ${y - size * .7},${x + size * .44} ${y - size * .42},${x} ${y - size * .4}C${x - size * .12} ${y - size * .48},${x - size * .12} ${y - size * .64},${x} ${y - size * .72}Z" fill="${palette.cream}"/>
      ${circle(x - size * .18, y - size * .56, size * .055, palette.cream)}${circle(x + size * .18, y - size * .56, size * .055, "#4f3025")}`;
  }
  return undefined;
}

function scene(slug, item) {
  const accent = colorFor(item.accent);
  const y = item.layout.includes("center") ? 500 : 530;
  const x = item.layout.includes("left") ? 570 : item.layout.includes("right") ? 930 : 750;
  const size = item.type === "dish" ? 205 : item.type === "dessert" ? 190 : 180;
  const featured = featuredScene(slug, x, y, size);
  if (featured) return featured;
  let liquid = item.type === "tea" ? palette.gold : item.type === "coffee" ? palette.brown : item.type.includes("drink") ? accent : palette.milk;
  if (item.vessel === "soup-bowl" || item.vessel === "sweet-soup-bowl") liquid = item.motifs.includes("sesame") ? palette.ink : palette.salmon;
  if (item.vessel === "matcha-bowl") liquid = palette.green;
  if (item.vessel === "wine-glass") liquid = palette.purple;
  const vessel = vesselShape(item.vessel, x, y, size, liquid);
  const marks = signatureMarks(item, x, y - size * .08, size * 1.08);
  const props = item.motifs.includes("steam") || ["tea", "coffee"].includes(item.type) || item.vessel.includes("soup") ? [0, 1, 2].map((i) => `<path d="M${x - size * .46 + i * size * .46} ${y - size * .8}q-${size * .14}-${size * .42} ${size * .05}-${size * .82}" fill="none" stroke="${palette.ink}" stroke-width="10" stroke-linecap="round" opacity=".38"/>`).join("") : "";
  const sideProps = item.motifs.includes("lime") ? lemon(1180, 760, 48, -12) : item.motifs.includes("lemon") ? lemon(1150, 770, 52, 15) : item.motifs.includes("tea-cup") ? ellipse(1120, 770, 85, 38, palette.gold) : item.motifs.includes("bean") ? motif("bean", 1130, 770, 62, 12) : "";
  return `${vessel}${marks}${props}${sideProps}`;
}

function svg(slug) {
  const item = art[slug];
  if (!item) throw new Error(`No art direction for ${slug}`);
  const value = seed(slug);
  const accent = colorFor(item.accent);
  const topX = 1080 + value % 260;
  const lowX = 90 + value % 180;
  const markerY = 120 + value % 110;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1500" height="1000" viewBox="0 0 1500 1000"><defs><linearGradient id="bg-${value}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#faf6ee"/><stop offset="1" stop-color="#e7ded0"/></linearGradient><filter id="grain-${value}"><feTurbulence baseFrequency=".7" numOctaves="2" seed="${value % 97}"/><feColorMatrix values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 .07 0"/></filter></defs><rect width="1500" height="1000" fill="url(#bg-${value})"/><circle cx="${topX}" cy="135" r="${170 + value % 80}" fill="${accent}" opacity=".13"/><path d="M${lowX} 900Q${250 + value % 140} ${720 + value % 80} ${440 + value % 90} 940" fill="none" stroke="${palette.red}" stroke-width="130" opacity=".05"/><path d="M80 ${markerY}h${110 + value % 100}" stroke="${palette.ink}" stroke-width="8" opacity=".15"/>${scene(slug, item)}<rect width="1500" height="1000" filter="url(#grain-${value})" opacity=".14"/></svg>`;
}

const items = Object.entries(art);
if (items.length !== 35) throw new Error(`Expected 35 Batch A art directions, received ${items.length}`);
for (const [slug, item] of items) {
  if (item.motifs.length < 2) throw new Error(`Art direction for ${slug} needs at least two signature motifs`);
  if (!item.vessel || !item.layout) throw new Error(`Art direction for ${slug} is missing vessel/layout`);
}
const fingerprints = new Set(items.map(([slug]) => createHash("sha256").update(svg(slug)).digest("hex")));
if (fingerprints.size !== items.length) throw new Error("Duplicate M11 Batch A illustration composition detected");
const compositionKeys = new Set(items.map(([, item]) => `${item.layout}|${item.vessel}|${item.motifs.join(",")}`));
if (compositionKeys.size !== items.length) throw new Error("Duplicate M11 Batch A art direction composition detected");

for (const [slug] of items) {
  const outputDir = join(process.cwd(), "public", "images", "culinary", slug);
  await mkdir(outputDir, { recursive: true });
  await sharp(Buffer.from(svg(slug))).webp({ quality: 88, smartSubsample: true }).toFile(join(outputDir, "hero.webp"));
}

console.log(`Generated ${items.length} deterministic, item-specific M11 editorial Hero assets.`);
