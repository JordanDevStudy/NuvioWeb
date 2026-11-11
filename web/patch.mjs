// Nuvio Web — adapta o build oficial (feito para TV) para o navegador do PC.
//
// Tudo que é específico do site fica nesta pasta web/, sem editar os arquivos
// originais do Nuvio. Assim a atualização automática a partir do repositório
// oficial nunca dá conflito.
//
//   node web/patch.mjs prebuild   -> ajusta o código-fonte antes do build
//   node web/patch.mjs postbuild  -> monta o site final em dist/
import { readFile, writeFile, copyFile, rename, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");

async function replaceInFile(file, edits) {
  const full = path.join(root, file);
  let text = await readFile(full, "utf8");
  for (const [from, to] of edits) {
    if (text.includes(to)) continue; // já aplicado
    if (!text.includes(from)) {
      console.warn(
        `::warning::Nuvio Web: trecho não encontrado em ${file} (o código oficial mudou?): ${from.slice(0, 60)}`
      );
      continue;
    }
    text = text.split(from).join(to);
  }
  await writeFile(full, text);
}

async function prebuild() {
  // O suporte a mouse (hover, clique) existe no Nuvio, mas só liga no webOS
  // (Magic Remote da LG). Liga também no navegador.
  await replaceInFile("js/ui/navigation/focusEngine.js", [
    ["Platform.isWebOS()", "(Platform.isWebOS() || Platform.isBrowser())"]
  ]);

  // Player com mouse, como num site de vídeo:
  // - mexer o mouse mostra os controles (e reinicia o tempo para escondê-los);
  // - clicar no vídeo pausa/despausa (antes só mostrava os controles).
  await replaceInFile("js/ui/screens/player/playerScreenMethods-69-sync-pointer-focus.js", [
    [
      `        this.isPostPlayVisible() ||
        this.controlsVisible
      ) {
        return false;
      }
      const video = this.container?.querySelector?.("#videoPlayer");
      if (!video || (target !== video && target?.closest?.("#videoPlayer") !== video)) {
        return false;
      }
      this.setControlsVisible(true, { focus: true });
      return true;
    },`,
      `        this.isPostPlayVisible()
      ) {
        return false;
      }
      const video = this.container?.querySelector?.("#videoPlayer");
      if (!video || (target !== video && target?.closest?.("#videoPlayer") !== video)) {
        return false;
      }
      this.togglePause({ focusControls: false });
      this.renderControlButtons();
      this.setControlsVisible(true, { focus: false });
      this.resetControlsAutoHide();
      return true;
    },
    onPointerMove() {
      if (
        this.isExternalFrameMode() ||
        this.isDialogOpen() ||
        this.isStartupErrorVisible() ||
        this.isPostPlayVisible()
      ) {
        return;
      }
      if (this.controlsVisible) {
        this.resetControlsAutoHide();
        return;
      }
      this.setControlsVisible(true, { focus: false });
    },`
    ]
  ]);
  console.log("Nuvio Web: prebuild ok");
}

async function postbuild() {
  // Versão de cada publicação: obriga o navegador a baixar os arquivos novos
  // (o GitHub Pages guarda cache por ~10 min e a moldura interna nem sempre recarrega).
  const version = String(process.env.GITHUB_SHA || Date.now().toString(36)).slice(0, 10);
  // O app vira app.html; o index.html passa a ser o "encaixe" que ajusta a escala.
  await rename(path.join(dist, "index.html"), path.join(dist, "app.html"));
  let app = await readFile(path.join(dist, "app.html"), "utf8");
  app = app.replace("<title>Nuvio TV</title>", "<title>Nuvio</title>");
  app = app.replace(
    "</head>",
    `    <link rel="stylesheet" href="web-theme.css?v=${version}" />\n    <script src="web-browser.js?v=${version}"></script>\n  </head>`
  );
  await writeFile(path.join(dist, "app.html"), app);
  await copyFile(path.join(root, "web", "browser.js"), path.join(dist, "web-browser.js"));
  await copyFile(path.join(root, "web", "theme.css"), path.join(dist, "web-theme.css"));
  const wrapper = await readFile(path.join(root, "web", "index.html"), "utf8");
  await writeFile(path.join(dist, "index.html"), wrapper.split("__NV_VERSION__").join(version));
  await copyFile(
    path.join(root, "web", "manifest.webmanifest"),
    path.join(dist, "manifest.webmanifest")
  );
  await copyFile(path.join(root, "web", "sw.js"), path.join(dist, "sw.js"));
  await mkdir(path.join(dist, "icons"), { recursive: true });
  for (const icon of ["icon-192.png", "icon-512.png", "maskable-192.png", "maskable-512.png"]) {
    await copyFile(path.join(root, "web", "icons", icon), path.join(dist, "icons", icon));
  }
  await writeFile(path.join(dist, ".nojekyll"), "");
  console.log("Nuvio Web: postbuild ok");
}

const step = process.argv[2];
if (step === "prebuild") await prebuild();
else if (step === "postbuild") await postbuild();
else {
  console.error("uso: node web/patch.mjs prebuild|postbuild");
  process.exit(1);
}
