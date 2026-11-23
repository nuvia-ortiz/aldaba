// Aldaba Design System — genera en Figma el sistema de diseño y las pantallas de «Casa Aldaba»
// (casa de huéspedes ficticia en Camagüey). Ejecutar en un archivo de Figma NUEVO y vacío.

// ---------- Tokens ----------
const PRIMITIVES = {
  "terracotta/50": "#FBF1EC", "terracotta/100": "#F4DCD0", "terracotta/300": "#E0A07F",
  "terracotta/500": "#C2643A", "terracotta/600": "#A9522C", "terracotta/700": "#8A4223", "terracotta/900": "#4A2313",
  "green/50": "#EEF4F0", "green/100": "#D3E4D9", "green/500": "#3E7A58", "green/700": "#2A5940", "green/900": "#163324",
  "sand/50": "#FBF8F3", "sand/100": "#F3EDE3", "sand/200": "#E6DCCB", "sand/400": "#BFAF95", "sand/600": "#8C7B62",
  "ink/300": "#A39A93", "ink/500": "#6B625C", "ink/700": "#3D3531", "ink/800": "#2A2420", "ink/900": "#1F1A17",
  "white": "#FFFFFF",
  "red/50": "#FEF3F2", "red/300": "#FDA29B", "red/600": "#B42318", "red/900": "#55160C",
  "amber/50": "#FFFAEB", "amber/300": "#FEC84B", "amber/600": "#B54708", "amber/900": "#4E1D09",
};

// [nombre semántico, primitivo en modo claro, primitivo en modo oscuro]
const SEMANTIC = [
  ["bg/canvas", "sand/50", "ink/900"],
  ["bg/surface", "white", "ink/800"],
  ["bg/subtle", "sand/100", "ink/700"],
  ["border/default", "sand/200", "ink/700"],
  ["border/strong", "sand/600", "ink/300"], // ≥ 3:1 sobre los fondos (WCAG 1.4.11)
  ["text/primary", "ink/900", "sand/50"],
  ["text/secondary", "ink/500", "ink/300"],
  ["text/on-accent", "white", "ink/900"],
  ["accent/default", "terracotta/600", "terracotta/300"],
  ["accent/hover", "terracotta/700", "terracotta/100"],
  ["accent/subtle", "terracotta/50", "terracotta/900"],
  ["success/text", "green/700", "green/100"],
  ["success/bg", "green/50", "green/900"],
  ["warning/text", "amber/600", "amber/300"],
  ["warning/bg", "amber/50", "amber/900"],
  ["danger/text", "red/600", "red/300"],
  ["danger/bg", "red/50", "red/900"],
  ["focus/ring", "green/500", "green/500"],
];

const SPACE = { "space/1": 4, "space/2": 8, "space/3": 12, "space/4": 16, "space/6": 24, "space/8": 32, "space/12": 48, "space/16": 64 };
const RADIUS = { "radius/sm": 6, "radius/md": 12, "radius/lg": 20, "radius/full": 999 };

const P = {}; // variables primitivas
const S = {}; // variables semánticas
const N = {}; // variables numéricas
const T = {}; // estilos de texto
let semanticCollection = null;
let darkModeId = null;

// ---------- Utilidades ----------
function hex(h) {
  const v = h.replace("#", "");
  return { r: parseInt(v.slice(0, 2), 16) / 255, g: parseInt(v.slice(2, 4), 16) / 255, b: parseInt(v.slice(4, 6), 16) / 255 };
}

function paint(variable) {
  return figma.variables.setBoundVariableForPaint({ type: "SOLID", color: { r: 0, g: 0, b: 0 } }, "color", variable);
}

function bindPadding(node, vertical, horizontal) {
  node.setBoundVariable("paddingTop", N[vertical]);
  node.setBoundVariable("paddingBottom", N[vertical]);
  node.setBoundVariable("paddingLeft", N[horizontal]);
  node.setBoundVariable("paddingRight", N[horizontal]);
}

function bindRadius(node, token) {
  for (const k of ["topLeftRadius", "topRightRadius", "bottomLeftRadius", "bottomRightRadius"]) node.setBoundVariable(k, N[token]);
}

function bindGap(node, token) {
  node.setBoundVariable("itemSpacing", N[token]);
}

// Frame con auto layout que abraza su contenido
function stack(name, direction, gapToken) {
  const f = figma.createFrame();
  f.name = name;
  f.layoutMode = direction;
  f.primaryAxisSizingMode = "AUTO";
  f.counterAxisSizingMode = "AUTO";
  f.fills = [];
  f.clipsContent = false;
  if (gapToken) bindGap(f, gapToken);
  return f;
}

function fill(child) {
  child.layoutSizingHorizontal = "FILL";
  return child;
}

async function text(chars, styleKey, colorToken, name) {
  const t = figma.createText();
  t.fontName = T[styleKey].fontName;
  t.characters = chars;
  await t.setTextStyleIdAsync(T[styleKey].id);
  t.fills = [paint(S[colorToken])];
  if (name) t.name = name;
  return t;
}

async function pickFont(candidates, available) {
  for (const c of candidates) {
    if (available.some((f) => f.fontName.family === c.family && f.fontName.style === c.style)) return c;
  }
  return { family: "Inter", style: "Regular" };
}

// Rectángulo para fotos (se sustituye arrastrando una imagen encima)
async function photo(label, height, radiusToken) {
  const f = figma.createFrame();
  f.name = "Foto";
  f.layoutMode = "VERTICAL";
  f.primaryAxisAlignItems = "CENTER";
  f.counterAxisAlignItems = "CENTER";
  f.primaryAxisSizingMode = "FIXED";
  f.counterAxisSizingMode = "FIXED";
  f.resize(400, height);
  f.fills = [paint(S["accent/subtle"])];
  if (radiusToken) bindRadius(f, radiusToken);
  f.appendChild(await text("Foto · " + label, "Caption", "accent/default"));
  return f;
}

function variantName(props) {
  return Object.entries(props).map(([k, v]) => `${k}=${v}`).join(", ");
}

async function setInstanceText(instance, value, index = 0) {
  const texts = instance.findAll((n) => n.type === "TEXT");
  if (texts[index]) texts[index].characters = value;
}

// ---------- 1. Variables ----------
async function createVariables() {
  const prim = figma.variables.createVariableCollection("Aldaba / Primitivos");
  const primMode = prim.modes[0].modeId;
  prim.renameMode(primMode, "Valor");
  for (const [name, value] of Object.entries(PRIMITIVES)) {
    const v = figma.variables.createVariable(name, prim, "COLOR");
    v.setValueForMode(primMode, hex(value));
    v.hiddenFromPublishing = true;
    P[name] = v;
  }

  semanticCollection = figma.variables.createVariableCollection("Aldaba / Semánticos");
  const lightId = semanticCollection.modes[0].modeId;
  semanticCollection.renameMode(lightId, "Claro");
  try {
    darkModeId = semanticCollection.addMode("Oscuro");
  } catch (e) {
    darkModeId = null; // el plan gratuito de Figma puede limitar los modos
    console.warn("No se pudo crear el modo oscuro:", e.message);
  }
  for (const [name, light, dark] of SEMANTIC) {
    const v = figma.variables.createVariable(name, semanticCollection, "COLOR");
    v.setValueForMode(lightId, figma.variables.createVariableAlias(P[light]));
    if (darkModeId) v.setValueForMode(darkModeId, figma.variables.createVariableAlias(P[dark]));
    S[name] = v;
  }

  const num = figma.variables.createVariableCollection("Aldaba / Espaciado y radios");
  const numMode = num.modes[0].modeId;
  num.renameMode(numMode, "Valor");
  for (const [name, value] of Object.entries(SPACE)) {
    const v = figma.variables.createVariable(name, num, "FLOAT");
    v.setValueForMode(numMode, value);
    v.scopes = ["GAP"];
    N[name] = v;
  }
  for (const [name, value] of Object.entries(RADIUS)) {
    const v = figma.variables.createVariable(name, num, "FLOAT");
    v.setValueForMode(numMode, value);
    v.scopes = ["CORNER_RADIUS"];
    N[name] = v;
  }
}

// ---------- 2. Tipografía ----------
async function createTextStyles() {
  const available = await figma.listAvailableFontsAsync();
  const serif = [
    await pickFont([{ family: "Fraunces", style: "SemiBold" }, { family: "Fraunces", style: "Semi Bold" }, { family: "Playfair Display", style: "SemiBold" }, { family: "Inter", style: "Bold" }], available),
    await pickFont([{ family: "Fraunces", style: "Regular" }, { family: "Playfair Display", style: "Regular" }, { family: "Inter", style: "Regular" }], available),
  ];
  const sans = {
    regular: await pickFont([{ family: "Inter", style: "Regular" }], available),
    medium: await pickFont([{ family: "Inter", style: "Medium" }, { family: "Inter", style: "Regular" }], available),
    semibold: await pickFont([{ family: "Inter", style: "Semi Bold" }, { family: "Inter", style: "SemiBold" }, { family: "Inter", style: "Bold" }], available),
  };
  const scale = [
    ["Display", serif[0], 56, 64, -1],
    ["H1", serif[0], 40, 48, -0.5],
    ["H2", serif[0], 30, 38, -0.25],
    ["H3", serif[0], 22, 28, 0],
    ["Body L", sans.regular, 18, 28, 0],
    ["Body", sans.regular, 16, 24, 0],
    ["Small", sans.regular, 14, 20, 0],
    ["Label", sans.semibold, 15, 20, 0],
    ["Caption", sans.medium, 12, 16, 0.2],
  ];
  for (const [name, font, size, line, tracking] of scale) {
    await figma.loadFontAsync(font);
    const s = figma.createTextStyle();
    s.name = "Aldaba/" + name;
    s.fontName = font;
    s.fontSize = size;
    s.lineHeight = { unit: "PIXELS", value: line };
    s.letterSpacing = { unit: "PIXELS", value: tracking };
    T[name] = s;
  }
}

// ---------- 3. Componentes ----------
const BUTTON_SIZES = { Sm: ["space/2", "space/3", 36], Md: ["space/3", "space/6", 44], Lg: ["space/4", "space/8", 52] };

async function createButtonSet(parent) {
  const comps = [];
  for (const variant of ["Primary", "Secondary", "Ghost"]) {
    for (const size of Object.keys(BUTTON_SIZES)) {
      for (const state of ["Default", "Hover", "Disabled"]) {
        const c = figma.createComponent();
        c.name = variantName({ Variant: variant, Size: size, State: state });
        c.layoutMode = "HORIZONTAL";
        c.primaryAxisSizingMode = "AUTO";
        c.counterAxisSizingMode = "AUTO";
        c.primaryAxisAlignItems = "CENTER";
        c.counterAxisAlignItems = "CENTER";
        const [v, h, minH] = BUTTON_SIZES[size];
        bindPadding(c, v, h);
        bindGap(c, "space/2");
        bindRadius(c, "radius/md");
        try { c.minHeight = minH; } catch (e) { /* API antigua */ }
        let labelColor = "text/on-accent";
        if (variant === "Primary") {
          c.fills = [paint(S[state === "Hover" ? "accent/hover" : "accent/default"])];
        } else if (variant === "Secondary") {
          c.fills = [paint(S[state === "Hover" ? "bg/subtle" : "bg/surface"])];
          c.strokes = [paint(S["border/strong"])];
          c.strokeWeight = 1;
          labelColor = "text/primary";
        } else {
          c.fills = state === "Hover" ? [paint(S["accent/subtle"])] : [];
          labelColor = "accent/default";
        }
        if (state === "Disabled") c.opacity = 0.4;
        c.appendChild(await text("Reservar", "Label", labelColor, "Label"));
        comps.push(c);
      }
    }
  }
  const set = figma.combineAsVariants(comps, parent);
  set.name = "Button";
  layoutSet(set, 900);
  return set;
}

async function createInputSet(parent) {
  const comps = [];
  for (const state of ["Default", "Focus", "Error", "Disabled"]) {
    const c = figma.createComponent();
    c.name = variantName({ State: state });
    c.layoutMode = "VERTICAL";
    c.primaryAxisSizingMode = "AUTO";
    c.counterAxisSizingMode = "FIXED";
    c.resize(320, 100);
    bindGap(c, "space/2");
    c.fills = [];
    c.appendChild(await text("Correo electrónico", "Label", "text/primary", "Etiqueta"));

    const field = figma.createFrame();
    field.name = "Campo";
    field.layoutMode = "HORIZONTAL";
    field.counterAxisAlignItems = "CENTER";
    field.primaryAxisSizingMode = "FIXED";
    field.counterAxisSizingMode = "FIXED";
    field.resize(320, 48);
    bindPadding(field, "space/3", "space/4");
    bindRadius(field, "radius/md");
    field.fills = [paint(S[state === "Disabled" ? "bg/subtle" : "bg/surface"])];
    field.strokes = [paint(S[state === "Error" ? "danger/text" : state === "Focus" ? "focus/ring" : "border/strong"])];
    field.strokeWeight = state === "Focus" || state === "Error" ? 2 : 1;
    field.appendChild(await text(state === "Default" || state === "Disabled" ? "tu@correo.com" : state === "Error" ? "ana@correo" : "ana@correo.com", "Body", state === "Default" || state === "Disabled" ? "text/secondary" : "text/primary", "Valor"));
    c.appendChild(field);
    fill(field);

    const helper = state === "Error"
      ? await text("Falta el dominio: escribe, por ejemplo, ana@correo.com", "Small", "danger/text", "Ayuda")
      : await text("Te enviaremos aquí la confirmación", "Small", "text/secondary", "Ayuda");
    c.appendChild(helper);
    fill(helper);
    if (state === "Disabled") c.opacity = 0.5;
    comps.push(c);
  }
  const set = figma.combineAsVariants(comps, parent);
  set.name = "Input";
  layoutSet(set, 1440);
  return set;
}

async function createBadgeSet(parent) {
  const tones = { Neutral: ["bg/subtle", "text/secondary", "Planta alta"], Success: ["success/bg", "success/text", "Disponible"], Warning: ["warning/bg", "warning/text", "Últimas noches"], Accent: ["accent/subtle", "accent/default", "Favorita"] };
  const comps = [];
  for (const [tone, [bg, fg, label]] of Object.entries(tones)) {
    const c = figma.createComponent();
    c.name = variantName({ Tone: tone });
    c.layoutMode = "HORIZONTAL";
    c.primaryAxisSizingMode = "AUTO";
    c.counterAxisSizingMode = "AUTO";
    bindPadding(c, "space/1", "space/3");
    bindRadius(c, "radius/full");
    c.fills = [paint(S[bg])];
    c.appendChild(await text(label, "Caption", fg, "Texto"));
    comps.push(c);
  }
  const set = figma.combineAsVariants(comps, parent);
  set.name = "Badge";
  layoutSet(set, 600);
  return set;
}

async function createRoomCard(parent, button, badge) {
  const c = figma.createComponent();
  c.name = "Room card";
  c.layoutMode = "VERTICAL";
  c.primaryAxisSizingMode = "AUTO";
  c.counterAxisSizingMode = "FIXED";
  c.resize(380, 100);
  c.fills = [paint(S["bg/surface"])];
  c.strokes = [paint(S["border/default"])];
  c.strokeWeight = 1;
  bindRadius(c, "radius/lg");
  c.clipsContent = true;
  c.effects = [{ type: "DROP_SHADOW", color: { r: 0.12, g: 0.1, b: 0.09, a: 0.06 }, offset: { x: 0, y: 4 }, radius: 16, spread: 0, visible: true, blendMode: "NORMAL" }];

  const img = await photo("habitación", 220);
  c.appendChild(img);
  fill(img);

  const body = stack("Contenido", "VERTICAL", "space/3");
  bindPadding(body, "space/6", "space/6");
  c.appendChild(body);
  fill(body);

  const badgeInst = variantOf(badge, { Tone: "Success" }).createInstance();
  badgeInst.name = "Badge";
  body.appendChild(badgeInst);
  const title = await text("Habitación Patio", "H3", "text/primary", "Título");
  body.appendChild(title);
  fill(title);
  const desc = await text("Cama doble · Baño propio · Aire acondicionado · Da al patio interior", "Small", "text/secondary", "Descripción");
  body.appendChild(desc);
  fill(desc);

  const row = stack("Precio y acción", "HORIZONTAL", "space/4");
  row.counterAxisAlignItems = "CENTER";
  row.primaryAxisAlignItems = "SPACE_BETWEEN";
  body.appendChild(row);
  fill(row);
  row.appendChild(await text("35 USD / noche", "Label", "text/primary", "Precio"));
  row.appendChild(variantOf(button, { Variant: "Primary", Size: "Sm", State: "Default" }).createInstance());

  parent.appendChild(c);
  return c;
}

async function createNavbar(parent, button, mobile) {
  const c = figma.createComponent();
  c.name = mobile ? "Navbar / Móvil" : "Navbar / Escritorio";
  c.layoutMode = "HORIZONTAL";
  c.primaryAxisSizingMode = "FIXED";
  c.counterAxisSizingMode = "AUTO";
  c.resize(mobile ? 390 : 1440, 72);
  c.primaryAxisAlignItems = "SPACE_BETWEEN";
  c.counterAxisAlignItems = "CENTER";
  bindPadding(c, "space/4", mobile ? "space/4" : "space/16");
  c.fills = [paint(S["bg/canvas"])];
  c.strokes = [paint(S["border/default"])];
  c.strokeBottomWeight = 1; c.strokeTopWeight = 0; c.strokeLeftWeight = 0; c.strokeRightWeight = 0;
  c.appendChild(await text("Casa Aldaba", "H3", "text/primary", "Logo"));
  if (mobile) {
    const menu = variantOf(button, { Variant: "Ghost", Size: "Sm", State: "Default" }).createInstance();
    await setInstanceText(menu, "Menú");
    c.appendChild(menu);
  } else {
    const links = stack("Enlaces", "HORIZONTAL", "space/8");
    links.counterAxisAlignItems = "CENTER";
    for (const l of ["Inicio", "Habitaciones", "El barrio", "Contacto"]) links.appendChild(await text(l, "Body", "text/primary"));
    links.appendChild(variantOf(button, { Variant: "Primary", Size: "Md", State: "Default" }).createInstance());
    c.appendChild(links);
  }
  parent.appendChild(c);
  return c;
}

async function createFooter(parent, mobile) {
  const c = figma.createComponent();
  c.name = mobile ? "Footer / Móvil" : "Footer / Escritorio";
  c.layoutMode = mobile ? "VERTICAL" : "HORIZONTAL";
  c.primaryAxisSizingMode = mobile ? "AUTO" : "FIXED";
  c.counterAxisSizingMode = mobile ? "FIXED" : "AUTO";
  c.resize(mobile ? 390 : 1440, 120);
  if (!mobile) c.primaryAxisAlignItems = "SPACE_BETWEEN";
  bindPadding(c, "space/12", mobile ? "space/4" : "space/16");
  bindGap(c, "space/4");
  c.fills = [paint(S["bg/subtle"])];
  const left = stack("Marca", "VERTICAL", "space/2");
  left.appendChild(await text("Casa Aldaba", "H3", "text/primary"));
  left.appendChild(await text("Calle Cisneros · Centro histórico de Camagüey", "Small", "text/secondary"));
  c.appendChild(left);
  c.appendChild(await text("Proyecto ficticio de portfolio · Diseño: Nuvia Ortiz Basulto", "Caption", "text/secondary"));
  parent.appendChild(c);
  return c;
}

function variantOf(set, props) {
  const name = variantName(props);
  const v = set.children.find((n) => n.name === name);
  if (!v) throw new Error("No existe la variante " + name + " en " + set.name);
  return v;
}

function layoutSet(set, width) {
  set.layoutMode = "HORIZONTAL";
  set.layoutWrap = "WRAP";
  set.primaryAxisSizingMode = "FIXED";
  set.counterAxisSizingMode = "AUTO";
  set.resize(width, 100);
  set.itemSpacing = 24;
  set.counterAxisSpacing = 24;
  set.paddingTop = set.paddingBottom = set.paddingLeft = set.paddingRight = 32;
  set.fills = [paint(S["bg/canvas"])];
  bindRadius(set, "radius/lg");
}

// ---------- 4. Páginas ----------
async function buildCover(page) {
  await figma.setCurrentPageAsync(page);
  const f = figma.createFrame();
  f.name = "Portada";
  f.resize(1920, 1080);
  f.layoutMode = "VERTICAL";
  f.primaryAxisSizingMode = "FIXED";
  f.counterAxisSizingMode = "FIXED";
  f.primaryAxisAlignItems = "CENTER";
  bindPadding(f, "space/16", "space/16");
  bindGap(f, "space/6");
  f.fills = [paint(S["bg/canvas"])];
  f.appendChild(await text("Aldaba", "Display", "accent/default"));
  f.appendChild(await text("Sistema de diseño y web de Casa Aldaba", "H1", "text/primary"));
  f.appendChild(await text("Casa de huéspedes ficticia en el centro histórico de Camagüey. Tokens, componentes y pantallas en modo claro y oscuro.", "Body L", "text/secondary"));
  f.appendChild(await text("Nuvia Ortiz Basulto · 2026", "Label", "text/primary"));
  page.appendChild(f);
}

async function buildFoundations(page) {
  await figma.setCurrentPageAsync(page);
  const root = stack("Fundamentos", "VERTICAL", "space/12");
  bindPadding(root, "space/16", "space/16");
  root.fills = [paint(S["bg/canvas"])];

  // Colores
  root.appendChild(await text("Color", "H1", "text/primary"));
  const grid = stack("Colores semánticos", "HORIZONTAL", "space/4");
  grid.layoutWrap = "WRAP";
  grid.primaryAxisSizingMode = "FIXED";
  grid.resize(1312, 100);
  grid.counterAxisSpacing = 24;
  for (const [name, light] of SEMANTIC) {
    const card = stack(name, "VERTICAL", "space/2");
    card.counterAxisSizingMode = "FIXED";
    card.resize(150, 100);
    const sw = figma.createRectangle();
    sw.resize(150, 80);
    sw.fills = [paint(S[name])];
    sw.strokes = [paint(S["border/default"])];
    sw.cornerRadius = 12;
    card.appendChild(sw);
    card.appendChild(await text(name, "Label", "text/primary"));
    card.appendChild(await text(light + " · " + PRIMITIVES[light], "Caption", "text/secondary"));
    grid.appendChild(card);
  }
  root.appendChild(grid);

  // Tipografía
  root.appendChild(await text("Tipografía", "H1", "text/primary"));
  const type = stack("Escala tipográfica", "VERTICAL", "space/4");
  for (const key of Object.keys(T)) {
    const s = T[key];
    const row = stack(key, "HORIZONTAL", "space/8");
    row.counterAxisAlignItems = "CENTER";
    const meta = await text(`${key} · ${s.fontName.family} ${s.fontSize}/${s.lineHeight.value}`, "Caption", "text/secondary");
    meta.resize(260, meta.height);
    meta.textAutoResize = "HEIGHT";
    row.appendChild(meta);
    row.appendChild(await text("Un patio con tinajones y sombra", key, "text/primary"));
    type.appendChild(row);
  }
  root.appendChild(type);

  // Espaciado
  root.appendChild(await text("Espaciado y radios", "H1", "text/primary"));
  const sp = stack("Espaciado", "VERTICAL", "space/3");
  for (const [name, value] of Object.entries(SPACE)) {
    const row = stack(name, "HORIZONTAL", "space/4");
    row.counterAxisAlignItems = "CENTER";
    const label = await text(`${name} · ${value}px`, "Caption", "text/secondary");
    label.resize(140, label.height);
    label.textAutoResize = "HEIGHT";
    row.appendChild(label);
    const bar = figma.createRectangle();
    bar.resize(value * 4, 16);
    bar.fills = [paint(S["accent/default"])];
    bar.cornerRadius = 4;
    row.appendChild(bar);
    sp.appendChild(row);
  }
  root.appendChild(sp);
  const radii = stack("Radios", "HORIZONTAL", "space/6");
  for (const [name, value] of Object.entries(RADIUS)) {
    const col = stack(name, "VERTICAL", "space/2");
    const r = figma.createRectangle();
    r.resize(96, 96);
    r.fills = [paint(S["accent/subtle"])];
    r.strokes = [paint(S["accent/default"])];
    r.setBoundVariable("topLeftRadius", N[name]); r.setBoundVariable("topRightRadius", N[name]);
    r.setBoundVariable("bottomLeftRadius", N[name]); r.setBoundVariable("bottomRightRadius", N[name]);
    col.appendChild(r);
    col.appendChild(await text(`${name} · ${value}`, "Caption", "text/secondary"));
    radii.appendChild(col);
  }
  root.appendChild(radii);
  page.appendChild(root);
}

async function buildComponents(page) {
  await figma.setCurrentPageAsync(page);
  const button = await createButtonSet(page);
  const input = await createInputSet(page);
  const badge = await createBadgeSet(page);
  const card = await createRoomCard(page, button, badge);
  const navD = await createNavbar(page, button, false);
  const navM = await createNavbar(page, button, true);
  const footD = await createFooter(page, false);
  const footM = await createFooter(page, true);

  // Colocación en el lienzo
  let y = 0;
  for (const node of [button, input, badge]) { node.x = 0; node.y = y; y += node.height + 80; }
  card.x = 0; card.y = y; y += card.height + 80;
  for (const node of [navD, navM, footD, footM]) { node.x = 0; node.y = y; y += node.height + 80; }
  return { button, input, badge, card, navD, navM, footD, footM };
}

function screen(name, width) {
  const f = figma.createFrame();
  f.name = name;
  f.layoutMode = "VERTICAL";
  f.resize(width, 100);
  f.primaryAxisSizingMode = "AUTO";
  f.counterAxisSizingMode = "FIXED";
  f.fills = [paint(S["bg/canvas"])];
  return f;
}

function section(name, mobile, gapToken = "space/8") {
  const s = stack(name, "VERTICAL", gapToken);
  bindPadding(s, mobile ? "space/12" : "space/16", mobile ? "space/4" : "space/16");
  return s;
}

const ROOMS = [
  ["Habitación Patio", "Cama doble · Baño propio · Da al patio interior", "35 USD / noche", "Success"],
  ["Habitación Tinajón", "Dos camas · Balcón a la calle · Aire acondicionado", "40 USD / noche", "Warning"],
  ["Suite Aldaba", "Cama grande · Sala de estar · Techos de 5 m", "55 USD / noche", "Accent"],
];

async function roomInstance(C, room) {
  const inst = C.card.createInstance();
  const [title, desc, price, tone] = room;
  const texts = inst.findAll((n) => n.type === "TEXT");
  const byName = (n) => texts.find((t) => t.name === n);
  byName("Título").characters = title;
  byName("Descripción").characters = desc;
  byName("Precio").characters = price;
  const badge = inst.findOne((n) => n.type === "INSTANCE" && n.name === "Badge");
  if (badge) badge.setProperties({ Tone: tone });
  return inst;
}

async function buildHome(C, mobile) {
  const f = screen(mobile ? "Inicio — Móvil" : "Inicio — Escritorio", mobile ? 390 : 1440);
  const nav = (mobile ? C.navM : C.navD).createInstance();
  f.appendChild(nav); fill(nav);

  // Hero
  const hero = section("Hero", mobile);
  hero.layoutMode = mobile ? "VERTICAL" : "HORIZONTAL";
  hero.counterAxisAlignItems = "CENTER";
  f.appendChild(hero); fill(hero);
  const copy = stack("Texto", "VERTICAL", "space/6");
  hero.appendChild(copy);
  if (mobile) fill(copy); else copy.layoutSizingHorizontal = "FILL";
  appendFill(copy, await text("Una casa colonial en el corazón de Camagüey", mobile ? "H1" : "Display", "text/primary"));
  appendFill(copy, await text("Tres habitaciones alrededor de un patio con tinajones, a dos calles de la Plaza del Carmen. Desayuno criollo incluido.", "Body L", "text/secondary"));
  const ctas = stack("Acciones", "HORIZONTAL", "space/3");
  const b1 = C.button.defaultVariant.createInstance(); b1.setProperties({ Variant: "Primary", Size: "Lg", State: "Default" }); await setInstanceText(b1, "Ver disponibilidad");
  const b2 = C.button.defaultVariant.createInstance(); b2.setProperties({ Variant: "Secondary", Size: "Lg", State: "Default" }); await setInstanceText(b2, "Cómo llegar");
  ctas.appendChild(b1); ctas.appendChild(b2);
  copy.appendChild(ctas);
  const heroImg = await photo("patio con tinajones", mobile ? 260 : 480, "radius/lg");
  hero.appendChild(heroImg);
  if (mobile) fill(heroImg); else { heroImg.resize(560, 480); }

  // Habitaciones
  const rooms = section("Habitaciones", mobile);
  f.appendChild(rooms); fill(rooms);
  appendFill(rooms, await text("Habitaciones", "H2", "text/primary"));
  const list = stack("Lista", mobile ? "VERTICAL" : "HORIZONTAL", "space/6");
  rooms.appendChild(list); fill(list);
  for (const r of ROOMS) {
    const inst = await roomInstance(C, r);
    list.appendChild(inst);
    inst.layoutSizingHorizontal = "FILL";
  }

  // Ventajas
  const why = section("Por qué Casa Aldaba", mobile);
  why.fills = [paint(S["bg/subtle"])];
  f.appendChild(why); fill(why);
  appendFill(why, await text("Por qué Casa Aldaba", "H2", "text/primary"));
  const feats = stack("Ventajas", mobile ? "VERTICAL" : "HORIZONTAL", "space/8");
  why.appendChild(feats); fill(feats);
  for (const [t, d] of [["Centro histórico", "A pie de la Plaza del Carmen, el Casino Campestre y las calles del tinajón."], ["Luz de respaldo", "Batería para ventiladores, luces y wifi durante los apagones."], ["Trato de familia", "Te recibimos nosotros y te ayudamos con taxis, excursiones y cambio."]]) {
    const col = stack(t, "VERTICAL", "space/2");
    feats.appendChild(col); col.layoutSizingHorizontal = "FILL";
    appendFill(col, await text(t, "H3", "text/primary"));
    appendFill(col, await text(d, "Body", "text/secondary"));
  }

  const foot = (mobile ? C.footM : C.footD).createInstance();
  f.appendChild(foot); fill(foot);
  return f;
}

function appendFill(parent, node) {
  parent.appendChild(node);
  node.layoutSizingHorizontal = "FILL";
  if (node.type === "TEXT") node.textAutoResize = "HEIGHT";
  return node;
}

async function buildBooking(C, mobile) {
  const f = screen(mobile ? "Reservar — Móvil" : "Reservar — Escritorio", mobile ? 390 : 1440);
  const nav = (mobile ? C.navM : C.navD).createInstance();
  f.appendChild(nav); fill(nav);

  const body = section("Reserva", mobile);
  body.layoutMode = mobile ? "VERTICAL" : "HORIZONTAL";
  f.appendChild(body); fill(body);

  const form = stack("Formulario", "VERTICAL", "space/6");
  body.appendChild(form); form.layoutSizingHorizontal = "FILL";
  appendFill(form, await text("Reserva tu estancia", "H1", "text/primary"));
  appendFill(form, await text("Sin pago por adelantado: confirmamos por correo o WhatsApp en menos de 24 horas.", "Body", "text/secondary"));
  const fields = [["Nombre y apellidos", "Ana Pérez", "Default"], ["Correo electrónico", "ana@correo", "Error"], ["Fechas", "12 – 15 de enero", "Focus"], ["Huéspedes", "2 adultos", "Default"]];
  for (const [label, value, state] of fields) {
    const inst = C.input.defaultVariant.createInstance();
    inst.setProperties({ State: state });
    const texts = inst.findAll((n) => n.type === "TEXT");
    const byName = (n) => texts.find((t) => t.name === n);
    byName("Etiqueta").characters = label;
    byName("Valor").characters = value;
    if (state !== "Error") byName("Ayuda").characters = state === "Focus" ? "Entrada a partir de las 14:00" : "";
    if (state !== "Error" && byName("Ayuda").characters === "") byName("Ayuda").visible = false;
    form.appendChild(inst); inst.layoutSizingHorizontal = "FILL";
  }
  const submit = C.button.defaultVariant.createInstance();
  submit.setProperties({ Variant: "Primary", Size: "Lg", State: "Default" });
  await setInstanceText(submit, "Solicitar reserva");
  form.appendChild(submit);

  // Resumen
  const sum = stack("Resumen", "VERTICAL", "space/4");
  sum.counterAxisSizingMode = "FIXED";
  sum.resize(mobile ? 358 : 420, 100);
  bindPadding(sum, "space/6", "space/6");
  bindRadius(sum, "radius/lg");
  sum.fills = [paint(S["bg/surface"])];
  sum.strokes = [paint(S["border/default"])];
  body.appendChild(sum);
  if (mobile) fill(sum);
  appendFill(sum, await text("Tu reserva", "H3", "text/primary"));
  for (const [k, v] of [["Habitación Patio", "35 USD × 3 noches"], ["Desayuno criollo", "Incluido"], ["Total", "105 USD"]]) {
    const row = stack(k, "HORIZONTAL", "space/4");
    row.primaryAxisAlignItems = "SPACE_BETWEEN";
    sum.appendChild(row); fill(row);
    row.appendChild(await text(k, k === "Total" ? "Label" : "Body", "text/primary"));
    row.appendChild(await text(v, k === "Total" ? "Label" : "Body", k === "Total" ? "text/primary" : "text/secondary"));
  }
  appendFill(sum, await text("El pago se hace al llegar, en efectivo o por transferencia.", "Small", "text/secondary"));

  const foot = (mobile ? C.footM : C.footD).createInstance();
  f.appendChild(foot); fill(foot);
  return f;
}

async function buildScreens(page, C) {
  await figma.setCurrentPageAsync(page);
  const frames = [
    await buildHome(C, false),
    await buildHome(C, true),
    await buildBooking(C, false),
    await buildBooking(C, true),
  ];
  if (darkModeId) {
    const dark = await buildHome(C, false);
    dark.name = "Inicio — Escritorio (oscuro)";
    dark.setExplicitVariableModeForCollection(semanticCollection, darkModeId);
    frames.push(dark);
  }
  let x = 0;
  for (const fr of frames) {
    page.appendChild(fr);
    fr.x = x; fr.y = 0;
    x += fr.width + 120;
  }
}

// ---------- Main ----------
async function main() {
  const existing = await figma.variables.getLocalVariableCollectionsAsync();
  if (existing.some((c) => c.name.startsWith("Aldaba"))) {
    figma.closePlugin("Este archivo ya tiene el sistema Aldaba. Ejecútalo en un archivo nuevo.");
    return;
  }
  figma.notify("Creando el sistema de diseño Aldaba…", { timeout: 4000 });
  await createVariables();
  await createTextStyles();

  const cover = figma.root.children[0];
  cover.name = "📕 Portada";
  const foundations = figma.createPage(); foundations.name = "🎨 Fundamentos";
  const components = figma.createPage(); components.name = "🧩 Componentes";
  const screens = figma.createPage(); screens.name = "📱 Pantallas";

  await buildCover(cover);
  await buildFoundations(foundations);
  const C = await buildComponents(components);
  await buildScreens(screens, C);

  await figma.setCurrentPageAsync(screens);
  figma.viewport.scrollAndZoomIntoView(screens.children);
  figma.closePlugin(darkModeId ? "Listo: Aldaba creado con modo claro y oscuro." : "Listo: Aldaba creado (sin modo oscuro: tu plan de Figma solo permite un modo).");
}

main().catch((e) => {
  console.error(e);
  figma.closePlugin("Error: " + (e && e.message ? e.message : e) + " — mira la consola (Plugins → Development → Show/Hide console).");
});
