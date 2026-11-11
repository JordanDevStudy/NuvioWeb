# Nuvio Web (versão para navegador)

Site: https://jordandevstudy.github.io/NuvioWeb/

Fork do Nuvio oficial (NuvioMedia/NuvioTVSmart), feito para TV, adaptado para o
navegador do PC. Tudo que é específico do site fica nesta pasta, sem editar os
arquivos originais, então a atualização diária a partir do oficial não dá conflito.

- `patch.mjs` — ajusta o código oficial na hora do build: liga o mouse no navegador
  (antes só existia no webOS) e, no player, faz o mouse mostrar os controles e o clique
  no vídeo pausar/despausar. Também monta o site final (`app.html` + o encaixe `index.html`).
- `index.html` — roda o app numa tela virtual de no mínimo 1920x960 e ajusta a
  escala para caber em qualquer janela.
- `browser.js` — traduz mouse/teclado do PC para o controle da TV (veja os atalhos abaixo),
  fecha o menu lateral quando o mouse sai dele e deixa a barra de tempo clicável.
- `theme.css` — tema moderno (só a pele, sem mudar o layout): no tema Padrão usa as
  cores da marca Nuvio (azul-marinho + gradiente ciano → violeta); nos outros temas de
  Aparência segue a cor escolhida. Inclui a luz ambiente (a arte em destaque desfocada
  atrás da interface), vidro fosco no menu/diálogos e o anel em gradiente no card em foco.
- `manifest.webmanifest`, `sw.js`, `icons/` — permitem instalar o Nuvio como app
  (Chrome/Edge: ícone de instalar na barra de endereço). O service worker não guarda
  cache, então nunca abre versão velha.
- `../web.properties` — configuração pública dos servidores do Nuvio.
- `../.github/workflows/pages.yml` — puxa o oficial, compila e publica no GitHub Pages
  (a cada push, todo dia de madrugada, ou manual em Actions > Run workflow).

## Atalhos

| Onde | Mouse | Teclado |
|---|---|---|
| Em todo lugar | clique = abrir · rodinha = descer/subir · Shift + rodinha (ou touchpad para o lado) = passar cards | setas + Enter · Esc ou Backspace = voltar |
| Cards | botão direito ou clique segurado = menu de opções (como segurar OK) | segurar Enter |
| Player | mexer = mostra controles · clique = pausa · duplo clique = tela cheia · rodinha = volume · clique na barra = pular | Espaço/K = pausa · F = tela cheia · P = janela flutuante · M = mudo · ← → = voltar/avançar |
| Geral | | / = buscar · ? = lista de atalhos |
