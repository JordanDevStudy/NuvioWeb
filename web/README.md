# Nuvio Web (versão para navegador)

Site: https://jordandevstudy.github.io/NuvioWeb/

Fork do Nuvio oficial (NuvioMedia/NuvioTVSmart), feito para TV, adaptado para o
navegador do PC. Tudo que é específico do site fica nesta pasta, sem editar os
arquivos originais, então a atualização diária a partir do oficial não dá conflito.

- `patch.mjs` — liga o suporte a mouse no navegador (antes só existia no webOS) e
  monta o site final (`app.html` + o encaixe `index.html`).
- `index.html` — roda o app numa tela virtual de no mínimo 1920x960 e ajusta a
  escala para caber em qualquer janela.
- `browser.js` — espaço = play/pause no player; esconde o cursor no player depois de 3 s.
- `../web.properties` — configuração pública dos servidores do Nuvio.
- `../.github/workflows/pages.yml` — puxa o oficial, compila e publica no GitHub Pages
  (a cada push, todo dia de madrugada, ou manual em Actions > Run workflow).

Atalhos: clique/rodinha do mouse, setas + Enter, Esc ou Backspace = voltar, F11 = tela cheia.
