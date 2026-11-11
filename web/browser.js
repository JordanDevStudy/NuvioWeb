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
})();
