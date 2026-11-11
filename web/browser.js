/*
 * Nuvio Web — ajustes para usar no navegador do PC com mouse e teclado.
 * Carregado pelo app.html (injetado no build por web/patch.mjs).
 *
 * O Nuvio foi feito para controle remoto de TV. Aqui o mouse e o teclado do
 * PC são "traduzidos" para as teclas do controle quando faz sentido, sem
 * mudar a aparência do app.
 */
(function () {
  "use strict";

  var KEY = { ENTER: 13, LEFT: 37, UP: 38, RIGHT: 39, DOWN: 40, PLAY_PAUSE: 10252 };
  var KEY_NAMES = {
    13: "Enter",
    37: "ArrowLeft",
    38: "ArrowUp",
    39: "ArrowRight",
    40: "ArrowDown",
    10252: "MediaPlayPause"
  };

  function isEditable(target) {
    if (!target) return false;
    if (target.isContentEditable) return true;
    var tag = String(target.tagName || "").toLowerCase();
    return tag === "input" || tag === "textarea" || tag === "select";
  }

  function inPlayer() {
    return Boolean(document.getElementById("playerUiRoot"));
  }

  function hasOpenDialog() {
    return Boolean(document.body && document.body.classList.contains("nuvio-modal-open"));
  }

  // Dispara uma tecla do controle como se tivesse sido apertada.
  function synthKey(type, keyCode, target) {
    var e = new KeyboardEvent(type, {
      bubbles: true,
      cancelable: true,
      key: KEY_NAMES[keyCode] || "",
      code: KEY_NAMES[keyCode] || ""
    });
    try {
      Object.defineProperty(e, "keyCode", {
        get: function () {
          return keyCode;
        }
      });
      Object.defineProperty(e, "which", {
        get: function () {
          return keyCode;
        }
      });
    } catch (err) {}
    var dest = target && document.contains(target) ? target : document.activeElement;
    if (!dest || !document.contains(dest)) dest = document.body;
    dest.dispatchEvent(e);
  }

  function pressKey(keyCode, target) {
    synthKey("keydown", keyCode, target);
    synthKey("keyup", keyCode, target);
  }

  function stop(e) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
  }

  /* ---------------------------------------------------------------- *
   * Estilo: cursor de "mãozinha" em tudo que é clicável e cursor que  *
   * some no player depois de 3 s parado.                              *
   * ---------------------------------------------------------------- */
  var style = document.createElement("style");
  style.textContent =
    "html.nv-cursor-idle, html.nv-cursor-idle * { cursor: none !important; }" +
    ".focusable, [data-action], .player-progress-shell { cursor: pointer; }" +
    // A barra de tempo do player herdava "pointer-events: none" do overlay (na TV
    // não se clica nela); os botões já tinham exceção, a barra não.
    "#playerUiRoot.controls-visible .player-progress-shell { pointer-events: auto; }" +
    "#nvVolumeToast { position: fixed; top: 5%; left: 50%; transform: translateX(-50%);" +
    " z-index: 2147483000; padding: 0.6vw 1.2vw; border-radius: 999px;" +
    " background: rgba(0,0,0,0.72); color: #fff; font: 600 1.05vw/1.2 Inter, system-ui, sans-serif;" +
    " opacity: 0; transition: opacity .2s; pointer-events: none; }" +
    // Área de clique maior na barra de tempo (invisível; o visual não muda).
    "#playerUiRoot.controls-visible .player-progress-shell { position: relative; }" +
    "#playerUiRoot.controls-visible .player-progress-shell::after { content: '';" +
    " position: absolute; left: 0; right: 0; top: -14px; bottom: -14px; }" +
    "#nvVolumeToast.show { opacity: 1; }";
  (document.head || document.documentElement).appendChild(style);

  var idleTimer = null;
  function wake() {
    document.documentElement.classList.remove("nv-cursor-idle");
    clearTimeout(idleTimer);
    idleTimer = setTimeout(function () {
      if (inPlayer()) document.documentElement.classList.add("nv-cursor-idle");
    }, 3000);
  }
  ["mousemove", "mousedown", "wheel"].forEach(function (t) {
    document.addEventListener(t, wake, { capture: true, passive: true });
  });

  /* ---------------------------------------------------------------- *
   * Menu lateral: na TV ele abre quando o foco vai para ele e fecha    *
   * quando o foco volta para o conteúdo (seta →). Com mouse, ele abria *
   * ao passar por cima e ficava aberto, escurecendo tudo. Agora fecha  *
   * sozinho quando o mouse sai dele.                                   *
   * ---------------------------------------------------------------- */
  var SIDEBAR_SELECTOR =
    ".home-sidebar, .root-sidebar-legacy, .modern-sidebar-shell, .modern-sidebar-panel";

  function expandedSidebar() {
    return document.querySelector(
      ".has-expanded-sidebar, .root-sidebar-legacy.expanded, .modern-sidebar-shell.expanded, .home-sidebar.expanded"
    );
  }

  var collapseTimer = null;
  document.addEventListener(
    "mousemove",
    function (e) {
      if (inPlayer() || hasOpenDialog()) return;
      var target = e.target;
      var overSidebar = target && target.closest && target.closest(SIDEBAR_SELECTOR);
      if (overSidebar) {
        clearTimeout(collapseTimer);
        collapseTimer = null;
        return;
      }
      if (collapseTimer || !expandedSidebar()) return;
      // Pequena tolerância para quem passa o mouse rápido pela borda.
      collapseTimer = setTimeout(function () {
        collapseTimer = null;
        if (!expandedSidebar()) return;
        pressKey(KEY.RIGHT);
      }, 180);
    },
    { capture: true, passive: true }
  );

  /* ---------------------------------------------------------------- *
   * Rolagem lateral: Shift + rodinha ou touchpad para o lado viram as   *
   * setas ← → (passa os cards da fileira).                            *
   * ---------------------------------------------------------------- */
  var hAccum = 0;
  var hLast = 0;
  document.addEventListener(
    "wheel",
    function (e) {
      if (inPlayer() || hasOpenDialog() || e.ctrlKey) return;
      var dx = e.deltaX;
      if (e.shiftKey && Math.abs(e.deltaY) > Math.abs(dx)) dx = e.deltaY;
      if (Math.abs(dx) <= Math.abs(e.shiftKey ? 0 : e.deltaY)) return;
      // Só onde existe uma fileira horizontal embaixo do mouse.
      var row =
        e.target &&
        e.target.closest &&
        e.target.closest(
          ".home-row, .home-track, [class*='-track'], [class*='-row'], [class*='rail']"
        );
      if (!row) return;
      stop(e);
      var now = Date.now();
      if (now - hLast > 400) hAccum = 0;
      hLast = now;
      hAccum += dx;
      var STEP = 90;
      while (Math.abs(hAccum) >= STEP) {
        pressKey(hAccum > 0 ? KEY.RIGHT : KEY.LEFT);
        hAccum -= hAccum > 0 ? STEP : -STEP;
      }
    },
    { capture: true, passive: false }
  );

  /* ---------------------------------------------------------------- *
   * Botão direito (ou clique segurado) num card = "segurar OK" do      *
   * controle: abre o menu de opções do item.                           *
   * ---------------------------------------------------------------- */
  var HOLD_MS = 800;
  function holdCard(card) {
    if (!card || !document.contains(card)) return;
    synthKey("keydown", KEY.ENTER, card);
    setTimeout(function () {
      synthKey("keyup", KEY.ENTER, card);
    }, HOLD_MS);
  }
  function cardFrom(target) {
    return target && target.closest ? target.closest(".focusable") : null;
  }
  document.addEventListener(
    "contextmenu",
    function (e) {
      if (inPlayer()) {
        e.preventDefault();
        return;
      }
      var card = cardFrom(e.target);
      if (!card || isEditable(e.target)) return;
      e.preventDefault();
      holdCard(card);
    },
    true
  );

  var pressTimer = null;
  var pressFired = false;
  document.addEventListener(
    "mousedown",
    function (e) {
      pressFired = false;
      clearTimeout(pressTimer);
      if (e.button !== 0 || inPlayer()) return;
      var card = cardFrom(e.target);
      if (!card || isEditable(e.target)) return;
      pressTimer = setTimeout(function () {
        pressFired = true;
        holdCard(card);
      }, 600);
    },
    true
  );
  ["mouseup", "mouseleave", "dragstart"].forEach(function (t) {
    document.addEventListener(
      t,
      function () {
        clearTimeout(pressTimer);
      },
      true
    );
  });
  // Depois de um clique segurado, ignora o "clique" que vem ao soltar o botão.
  document.addEventListener(
    "click",
    function (e) {
      if (!pressFired) return;
      pressFired = false;
      stop(e);
    },
    true
  );

  /* ---------------------------------------------------------------- *
   * Player                                                            *
   *   Espaço / K  = play/pause        F / duplo clique = tela cheia    *
   *   M           = mudo              rodinha = volume                 *
   * ---------------------------------------------------------------- */
  function topDocument() {
    try {
      return window.top.document;
    } catch (err) {
      return document;
    }
  }

  function toggleFullscreen() {
    var doc = topDocument();
    try {
      if (doc.fullscreenElement) {
        doc.exitFullscreen();
      } else {
        doc.documentElement.requestFullscreen();
      }
    } catch (err) {}
  }

  function video() {
    return document.querySelector("#videoPlayer") || document.querySelector("video");
  }

  var toastTimer = null;
  function showVolume(v) {
    var el = document.getElementById("nvVolumeToast");
    if (!el) {
      el = document.createElement("div");
      el.id = "nvVolumeToast";
      document.body.appendChild(el);
    }
    el.textContent =
      v.muted || v.volume === 0 ? "Sem som" : "Volume " + Math.round(v.volume * 100) + "%";
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      el.classList.remove("show");
    }, 900);
  }

  function changeVolume(delta) {
    var v = video();
    if (!v) return;
    v.muted = false;
    v.volume = Math.max(0, Math.min(1, Math.round((v.volume + delta) * 100) / 100));
    showVolume(v);
  }

  document.addEventListener(
    "keydown",
    function (e) {
      if (!inPlayer() || isEditable(e.target) || e.ctrlKey || e.metaKey || e.altKey) return;
      var k = String(e.key || "").toLowerCase();
      if (e.code === "Space" || k === " " || k === "k") {
        stop(e);
        if (!e.repeat) pressKey(KEY.PLAY_PAUSE, e.target);
      } else if (k === "f") {
        stop(e);
        toggleFullscreen();
      } else if (k === "m") {
        stop(e);
        var v = video();
        if (v) {
          v.muted = !v.muted;
          showVolume(v);
        }
      }
    },
    true
  );
  document.addEventListener(
    "keyup",
    function (e) {
      if (!inPlayer() || isEditable(e.target)) return;
      var k = String(e.key || "").toLowerCase();
      if (e.code === "Space" || k === " " || k === "k" || k === "f" || k === "m" || k === "p")
        stop(e);
    },
    true
  );

  document.addEventListener(
    "dblclick",
    function (e) {
      if (!inPlayer()) return;
      var t = e.target;
      if (t && t.closest && t.closest(".focusable, button, [data-action], .player-progress-shell"))
        return;
      stop(e);
      toggleFullscreen();
    },
    true
  );

  document.addEventListener(
    "wheel",
    function (e) {
      if (!inPlayer() || hasOpenDialog() || e.ctrlKey) return;
      var t = e.target;
      // Deixa rolar normalmente listas dentro do player (episódios, fontes, legendas).
      if (
        t &&
        t.closest &&
        t.closest("[class*='panel'], [class*='dialog'], [class*='list'], [class*='menu']")
      )
        return;
      stop(e);
      changeVolume(e.deltaY < 0 ? 0.05 : -0.05);
    },
    { capture: true, passive: false }
  );

  /* ---------------------------------------------------------------- *
   * Luz ambiente: pega a arte do título em destaque (tela inicial ou   *
   * detalhes) e usa ela desfocada atrás da interface (web/theme.css).  *
   * ---------------------------------------------------------------- */
  var ambient = null;
  var ambientLayers = [];
  var ambientIndex = 0;
  var ambientUrl = "";

  function ensureAmbient() {
    if (ambient && document.body.contains(ambient)) return;
    ambient = document.createElement("div");
    ambient.id = "nvAmbient";
    ambient.setAttribute("aria-hidden", "true");
    ambientLayers = [document.createElement("i"), document.createElement("i")];
    ambientLayers.forEach(function (l) {
      ambient.appendChild(l);
    });
    document.body.insertBefore(ambient, document.body.firstChild);
  }

  function urlFromBackground(el) {
    var bg = el ? getComputedStyle(el).backgroundImage : "";
    var m = bg && bg.match(/url\(["']?([^"')]+)["']?\)/);
    return m ? m[1] : "";
  }

  function currentArtwork() {
    if (inPlayer()) return "";
    var img = document.querySelector(".home-hero-backdrop");
    if (img && img.currentSrc && img.offsetParent) return img.currentSrc;
    var detail = document.querySelector(".series-detail-backdrop");
    if (detail && detail.offsetParent) {
      var u = urlFromBackground(detail);
      if (u) return u;
      var di = detail.querySelector("img");
      if (di && di.currentSrc) return di.currentSrc;
    }
    return ambientUrl; // mantém a última nas outras telas
  }

  function updateAmbient() {
    if (!document.body) return;
    ensureAmbient();
    var url = currentArtwork();
    ambient.style.display = inPlayer() ? "none" : "";
    if (!url || url === ambientUrl) return;
    ambientUrl = url;
    var next = ambientLayers[ambientIndex];
    var prev = ambientLayers[1 - ambientIndex];
    var probe = new Image();
    probe.onload = function () {
      if (ambientUrl !== url) return;
      next.style.backgroundImage = 'url("' + url.replace(/"/g, '\\"') + '")';
      next.classList.add("on");
      prev.classList.remove("on");
      ambientIndex = 1 - ambientIndex;
    };
    probe.src = url;
  }

  setInterval(updateAmbient, 700);

  /* ---------------------------------------------------------------- *
   * Picture-in-Picture (P), título da aba e atalhos globais (/ e ?).   *
   * ---------------------------------------------------------------- */
  function togglePiP() {
    var v = video();
    if (!v || !document.pictureInPictureEnabled) return;
    try {
      if (document.pictureInPictureElement) {
        document.exitPictureInPicture();
      } else {
        v.requestPictureInPicture();
      }
    } catch (err) {}
  }

  // Título da aba: "▶ Nome do título · Nuvio" enquanto toca.
  var baseTitle = "Nuvio";
  function playerTitleText() {
    var el = document.querySelector("#playerUiRoot .player-title");
    return el
      ? String(el.textContent || "")
          .replace(/\s+/g, " ")
          .trim()
      : "";
  }
  function updateTitle() {
    var title = baseTitle;
    if (inPlayer()) {
      var name = playerTitleText();
      var v = video();
      if (name) title = (v && !v.paused ? "▶ " : "❚❚ ") + name + " · Nuvio";
    }
    if (document.title !== title) document.title = title;
  }
  setInterval(updateTitle, 1000);

  // Janela de atalhos (?)
  var helpEl = null;
  var HELP_ROWS = [
    ["Clique", "Abrir"],
    ["Botão direito", "Opções do card (como segurar OK)"],
    ["Rodinha / Shift + rodinha", "Descer e subir / passar cards para o lado"],
    ["Setas + Enter", "Navegar como no controle"],
    ["Esc ou Backspace", "Voltar"],
    ["/", "Buscar"],
    ["Espaço ou K", "Pausar no player"],
    ["← →", "Voltar e avançar no player"],
    ["F ou duplo clique", "Tela cheia"],
    ["P", "Janela flutuante (Picture-in-Picture)"],
    ["M / rodinha no player", "Mudo / volume"],
    ["?", "Mostrar ou esconder esta lista"]
  ];
  function toggleHelp(force) {
    var show = typeof force === "boolean" ? force : !(helpEl && helpEl.classList.contains("show"));
    if (!helpEl) {
      helpEl = document.createElement("div");
      helpEl.id = "nvHelp";
      helpEl.setAttribute("role", "dialog");
      helpEl.setAttribute("aria-label", "Atalhos");
      var html = '<div class="nv-help-panel"><h2>Atalhos</h2><dl>';
      HELP_ROWS.forEach(function (r) {
        html += "<dt>" + r[0] + "</dt><dd>" + r[1] + "</dd>";
      });
      html += "</dl><p>Aperte ? ou Esc para fechar</p></div>";
      helpEl.innerHTML = html;
      helpEl.addEventListener("click", function (e) {
        if (e.target === helpEl) toggleHelp(false);
      });
      document.body.appendChild(helpEl);
    }
    helpEl.classList.toggle("show", show);
  }

  document.addEventListener(
    "keydown",
    function (e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      var helpOpen = helpEl && helpEl.classList.contains("show");
      if (helpOpen && (e.key === "Escape" || e.key === "Backspace" || e.key === "?")) {
        stop(e);
        toggleHelp(false);
        return;
      }
      if (isEditable(e.target)) return;
      if (e.key === "?") {
        stop(e);
        toggleHelp();
        return;
      }
      if (e.key === "/" && !inPlayer() && !hasOpenDialog()) {
        var search = document.querySelector('[data-action="gotoSearch"]');
        if (search) {
          stop(e);
          search.click();
        }
        return;
      }
      if (inPlayer() && String(e.key).toLowerCase() === "p") {
        stop(e);
        togglePiP();
      }
    },
    true
  );
})();
