// Capturas para el README y la revisión visual. Requiere el servidor: npm run serve
import { chromium } from "@playwright/test";
const base = process.argv[2] || "http://localhost:4173";
const browser = await chromium.launch();
const shots = [["/", "inicio"], ["/reservar.html", "reservar"]];
for (const [w, h, tag] of [[1440, 900, "escritorio"], [390, 844, "movil"]]) {
  for (const scheme of ["light", "dark"]) {
    const page = await browser.newPage({ viewport: { width: w, height: h }, colorScheme: scheme, deviceScaleFactor: 1 });
    for (const [path, name] of shots) {
      await page.goto(base + path, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: `docs/${name}-${tag}-${scheme === "light" ? "claro" : "oscuro"}.png`, fullPage: true });
    }
    await page.close();
  }
}
await browser.close();
console.log("Capturas en docs/");
