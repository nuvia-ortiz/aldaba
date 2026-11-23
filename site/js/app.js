// Aldaba · comportamiento mínimo. La página funciona sin JavaScript; esto solo añade comodidad.
(() => {
  const root = document.documentElement;

  // ---------- Modo oscuro ----------
  const themeBtn = document.querySelector(".theme-toggle");
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)");
  const isDark = () => (root.dataset.theme ? root.dataset.theme === "dark" : systemDark.matches);
  const syncThemeBtn = () => {
    if (!themeBtn) return;
    themeBtn.setAttribute("aria-pressed", String(isDark()));
    themeBtn.textContent = isDark() ? "Modo claro" : "Modo oscuro";
    const meta = document.querySelectorAll('meta[name="theme-color"]');
    meta.forEach((m) => { m.content = isDark() ? "#1f1a17" : "#fbf8f3"; m.removeAttribute("media"); });
  };
  if (themeBtn) {
    themeBtn.hidden = false;
    syncThemeBtn();
    themeBtn.addEventListener("click", () => {
      root.dataset.theme = isDark() ? "light" : "dark";
      try { localStorage.setItem("aldaba-theme", root.dataset.theme); } catch (e) { /* modo privado */ }
      syncThemeBtn();
    });
    systemDark.addEventListener("change", syncThemeBtn);
  }

  // ---------- Menú móvil ----------
  const toggle = document.querySelector(".nav-toggle");
  const menu = document.getElementById("menu");
  if (toggle && menu) {
    const setOpen = (open) => {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.textContent = open ? "Cerrar" : "Menú";
      menu.classList.toggle("is-open", open);
    };
    toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));
    menu.addEventListener("click", (e) => { if (e.target.closest("a")) setOpen(false); });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") { setOpen(false); toggle.focus(); }
    });
  }

  // ---------- Formulario de reserva ----------
  const form = document.getElementById("form-reserva");
  if (!form) return;

  const $ = (id) => document.getElementById(id);
  const room = $("habitacion"), arrive = $("llegada"), leave = $("salida");
  const errorsBox = $("errores"), okBox = $("exito");

  // Habitación elegida desde la tarjeta (?habitacion=suite)
  const wanted = new URLSearchParams(location.search).get("habitacion");
  if (wanted && [...room.options].some((o) => o.value === wanted)) room.value = wanted;

  // Fechas: no se puede llegar antes de hoy ni salir antes de llegar
  const iso = (d) => d.toISOString().slice(0, 10);
  const today = new Date(); today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  arrive.min = iso(today);
  const nightsBetween = () => {
    if (!arrive.value || !leave.value) return 0;
    return Math.round((Date.parse(leave.value) - Date.parse(arrive.value)) / 86400000);
  };

  const updateSummary = () => {
    const opt = room.selectedOptions[0];
    const price = Number(opt.dataset.precio);
    const nights = nightsBetween();
    $("res-habitacion").textContent = opt.textContent.split(" · ")[0];
    $("res-noches").textContent = nights > 0 ? `${price} USD × ${nights} ${nights === 1 ? "noche" : "noches"}` : `${price} USD × elige fechas`;
    $("res-total").textContent = nights > 0 ? `${price * nights} USD` : "—";
  };
  arrive.addEventListener("change", () => {
    if (arrive.value) {
      const next = new Date(Date.parse(arrive.value) + 86400000);
      leave.min = iso(next);
      if (leave.value && leave.value <= arrive.value) leave.value = "";
    }
    updateSummary();
  });
  [room, leave].forEach((el) => el.addEventListener("change", updateSummary));
  updateSummary();

  // Validación con mensajes que dicen cómo arreglar el error
  const rules = {
    nombre: (v) => (v.trim().length < 3 ? "Escribe tu nombre y apellidos." : ""),
    correo: (v) => {
      const s = v.trim();
      if (!s) return "Escribe tu correo para enviarte la confirmación.";
      if (!s.includes("@")) return "Falta la @: escribe, por ejemplo, ana@correo.com";
      const domain = s.split("@")[1] || "";
      if (!domain.includes(".") || domain.endsWith(".")) return "Falta el dominio: escribe, por ejemplo, ana@correo.com";
      return "";
    },
    llegada: (v) => (!v ? "Elige el día de llegada." : v < arrive.min ? "La llegada no puede ser antes de hoy." : ""),
    salida: (v) => (!v ? "Elige el día de salida." : nightsBetween() < 1 ? "La salida tiene que ser después de la llegada." : ""),
  };

  let submitted = false;
  const check = (name) => {
    const input = form.elements[name];
    const msg = rules[name](input.value);
    const out = $(name + "-error");
    out.textContent = msg;
    if (msg) input.setAttribute("aria-invalid", "true"); else input.removeAttribute("aria-invalid");
    return msg;
  };
  Object.keys(rules).forEach((name) => {
    form.elements[name].addEventListener("blur", () => { if (submitted) check(name); });
    form.elements[name].addEventListener("input", () => { if (submitted) check(name); });
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    submitted = true;
    okBox.hidden = true;
    const failed = Object.keys(rules).map((n) => [n, check(n)]).filter(([, m]) => m);
    if (failed.length) {
      errorsBox.innerHTML = "";
      const p = document.createElement("p");
      p.className = "label";
      p.textContent = failed.length === 1 ? "Revisa 1 campo:" : `Revisa ${failed.length} campos:`;
      const ul = document.createElement("ul");
      for (const [n, m] of failed) {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.href = "#" + n;
        a.textContent = m;
        a.style.color = "inherit";
        li.appendChild(a);
        ul.appendChild(li);
      }
      errorsBox.append(p, ul);
      errorsBox.hidden = false;
      errorsBox.focus();
      return;
    }
    errorsBox.hidden = true;
    okBox.textContent = `¡Listo, ${form.elements.nombre.value.trim().split(" ")[0]}! Tu solicitud está preparada. Como esto es un proyecto de portfolio, no se ha enviado a ningún sitio.`;
    okBox.hidden = false;
    okBox.focus();
  });
})();
