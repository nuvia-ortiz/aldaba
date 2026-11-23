// Genera site/css/tokens.css a partir de los tokens del plugin de Figma,
// para que Figma y la web compartan una única fuente de verdad.
//   node scripts/build-tokens.mjs          → escribe el archivo
//   node scripts/build-tokens.mjs --check  → falla si el archivo no está al día
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = fileURLToPath(new URL("..", import.meta.url));
const source = readFileSync(root + "figma-plugin/code.js", "utf8").split("\r\n").join("\n");

function extract(name) {
  const m = source.match(new RegExp(`const ${name} = ([\\s\\S]*?);\\n`));
  if (!m) throw new Error(`No encuentro "const ${name}" en figma-plugin/code.js`);
  return vm.runInNewContext(`(${m[1]})`);
}

const PRIMITIVES = extract("PRIMITIVES");
const SEMANTIC = extract("SEMANTIC");
const SPACE = extract("SPACE");
const RADIUS = extract("RADIUS");

const v = (name) => "--" + name.replace(/\//g, "-");
const lines = [];
lines.push("/* Archivo generado por scripts/build-tokens.mjs a partir de figma-plugin/code.js. No editar a mano. */", "");
lines.push(":root {");
lines.push("  /* Primitivos */");
for (const [k, hex] of Object.entries(PRIMITIVES)) lines.push(`  ${v(k)}: ${hex.toLowerCase()};`);
lines.push("", "  /* Espaciado y radios */");
for (const [k, n] of Object.entries(SPACE)) lines.push(`  ${v(k)}: ${n / 16}rem;`);
for (const [k, n] of Object.entries(RADIUS)) lines.push(`  ${v(k)}: ${n}px;`);
lines.push("", "  /* Semánticos · modo claro */", "  color-scheme: light;");
for (const [k, light] of SEMANTIC) lines.push(`  ${v(k)}: var(${v(light)});`);
lines.push("}", "");

const dark = SEMANTIC.map(([k, , d]) => `  ${v(k)}: var(${v(d)});`);
lines.push("/* Modo oscuro: sigue al sistema salvo que el usuario elija claro */");
lines.push("@media (prefers-color-scheme: dark) {", '  :root:not([data-theme="light"]) {', "    color-scheme: dark;", ...dark.map((l) => "  " + l), "  }", "}", "");
lines.push('/* Modo oscuro elegido a mano */', ':root[data-theme="dark"] {', "  color-scheme: dark;", ...dark, "}", "");

const out = lines.join("\n");
const target = root + "site/css/tokens.css";
if (process.argv.includes("--check")) {
  const current = existsSync(target) ? readFileSync(target, "utf8").replace(/\r\n/g, "\n") : "";
  if (current !== out) {
    console.error("site/css/tokens.css no coincide con los tokens de Figma. Ejecuta: npm run tokens");
    process.exit(1);
  }
  console.log("Tokens al día.");
} else {
  writeFileSync(target, out);
  console.log(`Escrito site/css/tokens.css (${Object.keys(PRIMITIVES).length} primitivos, ${SEMANTIC.length} semánticos).`);
}
