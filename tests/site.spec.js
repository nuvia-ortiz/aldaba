import { test, expect } from "@playwright/test";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";

const require = createRequire(import.meta.url);
const axeSource = readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");

async function axe(page) {
  await page.addScriptTag({ content: axeSource });
  return page.evaluate(async () => {
    const r = await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] } });
    return r.violations.map((v) => `${v.id}: ${v.help} → ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
  });
}

for (const path of ["/", "/reservar.html"]) {
  for (const scheme of ["light", "dark"]) {
    test(`accesibilidad ${path} en modo ${scheme === "light" ? "claro" : "oscuro"}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto(path);
      await page.evaluate(() => document.fonts.ready);
      expect(await axe(page)).toEqual([]);
    });
  }

  test(`sin desplazamiento horizontal ni errores en consola ${path}`, async ({ page }) => {
    const errors = [];
    page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    expect(errors).toEqual([]);
  });
}

test("el peso propio de la página (sin fuentes de Google) es menor de 60 KB", async ({ page }) => {
  let bytes = 0;
  page.on("response", async (r) => {
    if (r.url().startsWith("http://localhost")) { try { bytes += (await r.body()).length; } catch { /* redirecciones */ } }
  });
  await page.goto("/", { waitUntil: "networkidle" });
  expect(bytes).toBeLessThan(60 * 1024);
});

test("la tarjeta lleva a la reserva con la habitación elegida", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Reservar la Suite Aldaba" }).click();
  await expect(page).toHaveURL(/habitacion=suite/);
  await expect(page.getByLabel("Habitación")).toHaveValue("suite");
  await expect(page.locator("#res-habitacion")).toHaveText("Suite Aldaba");
});

test("modo oscuro: el botón cambia el tema y se recuerda", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  const btn = page.getByRole("button", { name: "Modo oscuro" });
  await btn.click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.getByRole("button", { name: "Modo claro" })).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test.describe("menú en móvil", () => {
  test("se abre, navega y se cierra con Escape", async ({ page }, info) => {
    test.skip(info.project.name !== "movil", "Solo en móvil");
    await page.goto("/");
    const toggle = page.locator(".nav-toggle");
    await expect(page.getByRole("link", { name: "Habitaciones" })).toBeHidden();
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByRole("link", { name: "Habitaciones" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(toggle).toHaveText("Menú");
    await expect(toggle).toBeFocused();
  });
});

test.describe("formulario de reserva", () => {
  const addDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };

  test("enviar vacío muestra el resumen de errores y marca los campos", async ({ page }) => {
    await page.goto("/reservar.html");
    await page.getByRole("button", { name: "Solicitar reserva" }).click();
    const alert = page.getByRole("alert");
    await expect(alert).toBeVisible();
    await expect(alert).toContainText("Revisa 4 campos");
    await expect(alert).toBeFocused();
    await expect(page.getByLabel("Correo electrónico")).toHaveAttribute("aria-invalid", "true");
  });

  test("el error del correo explica cómo arreglarlo", async ({ page }) => {
    await page.goto("/reservar.html");
    await page.getByLabel("Correo electrónico").fill("ana@correo");
    await page.getByRole("button", { name: "Solicitar reserva" }).click();
    await expect(page.locator("#correo-error")).toHaveText("Falta el dominio: escribe, por ejemplo, ana@correo.com");
  });

  test("datos válidos: calcula el total y confirma sin enviar nada", async ({ page }) => {
    await page.goto("/reservar.html");
    await page.getByLabel("Nombre y apellidos").fill("Ana Pérez");
    await page.getByLabel("Correo electrónico").fill("ana@correo.com");
    await page.getByLabel("Llegada").fill(addDays(10));
    await page.getByLabel("Llegada").dispatchEvent("change");
    await page.getByLabel("Salida").fill(addDays(13));
    await page.getByLabel("Salida").dispatchEvent("change");
    await expect(page.locator("#res-total")).toHaveText("105 USD");
    await page.getByRole("button", { name: "Solicitar reserva" }).click();
    await expect(page.getByRole("status")).toContainText("¡Listo, Ana!");
    await expect(page.getByRole("alert")).toBeHidden();
  });
});

test("la barra de navegación ocupa una sola línea y muestra los botones correctos", async ({ page }, info) => {
  await page.goto("/");
  const bar = await page.locator(".navbar").boundingBox();
  expect(bar.height).toBeLessThanOrEqual(80);
  const mobile = info.project.name === "movil";
  await expect(page.locator(".nav-toggle")).toBeVisible({ visible: mobile });
  await expect(page.locator(".navbar__cta")).toBeVisible({ visible: !mobile });
});
