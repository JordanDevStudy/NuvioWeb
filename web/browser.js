/*
 * Nuvio Web — ajustes para usar no navegador do PC com mouse e teclado.
 * Carregado pelo app.html (injetado no build por web/patch.mjs).
 */
(function () {
  "use strict";

  function isEditable(target) {
    if (!target) return false;
    if (target.isContentEditable) return true;
    var tag = String(target.tagName || "").toLowerCase();
    return tag === "input" || tag === "textarea" || tag === "select";
  }

  function inPlayer() {
    return Boolean(document.getElementById("playerUiRoot"));
  }

  // Espaço = play/pause no player (vira a tecla Play/Pause do controle da TV).
  function synthKey(type, original) {
    var e = new KeyboardEvent(type, { bubbles: true, cancelable: true, key: "MediaPlayPause" });
    try {
      Object.defineProperty(e, "keyCode", {
        get: function () {
          return 10252;
        }
      });
      Object.defineProperty(e, "which", {
        get: function () {
          return 10252;
        }
      });
    } catch (err) {}
    (original.target || document.body).dispatchEvent(e);
  }
  ["keydown", "keyup"].forEach(function (type) {
    document.addEventListener(
      type,
      function (e) {
        if (e.code !== "Space" && e.key !== " ") return;
        if (isEditable(e.target) || !inPlayer()) return;
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        if (type === "keydown" && e.repeat) return;
        synthKey(type, e);
      },
      true
    );
  });

  // Esconde o cursor do mouse no player depois de 3 s parado.
  var style = document.createElement("style");
  style.textContent =
    "html.nv-cursor-idle, html.nv-cursor-idle * { cursor: none !important; }" +
    ".focusable { cursor: pointer; }";
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

  // Botão direito (ou clique segurado) num card = "segurar OK" do controle:
  // abre o menu de opções/detalhes avançados do item.
  var HOLD_MS = 800;
  function synthEnter(type, target) {
    var e = new KeyboardEvent(type, {
      bubbles: true,
      cancelable: true,
      key: "Enter",
      code: "Enter"
    });
    try {
      Object.defineProperty(e, "keyCode", {
        get: function () {
          return 13;
        }
      });
      Object.defineProperty(e, "which", {
        get: function () {
          return 13;
        }
      });
    } catch (err) {}
    var dest = target && document.contains(target) ? target : document.activeElement;
    if (!dest || !document.contains(dest)) dest = document.body;
    dest.dispatchEvent(e);
  }
  function holdCard(card) {
    if (!card || !document.contains(card)) return;
    synthEnter("keydown", card);
    setTimeout(function () {
      synthEnter("keyup", card);
    }, HOLD_MS);
  }
  function cardFrom(target) {
    return target && target.closest ? target.closest(".focusable") : null;
  }
  document.addEventListener(
    "contextmenu",
    function (e) {
      var card = cardFrom(e.target);
      if (!card || isEditable(e.target) || inPlayer()) return;
      e.preventDefault();
      holdCard(card);
    },
    true
  );

  var pressTimer = null,
    pressFired = false;
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
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    },
    true
  );
})();
