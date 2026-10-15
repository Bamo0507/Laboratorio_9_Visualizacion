import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { CONFIG, RAIZ } from "./comun.js";

const GRAFICOS = [
  "01_linea_historica.js",
  "02_estacionalidad.js",
  "03_vias_fronteras.js",
  "04_cuadro_comparativo.js",
  "05_modelos.js",
  "06_pronostico.js",
  "exportar_png.js",
];

for (const script of GRAFICOS) {
  console.log(`\n${"=".repeat(60)}\n${script}\n${"=".repeat(60)}`);
  await import(`./${script}`);
}

// Vista previa con los SVG en línea, para que tomen las fuentes de Google Fonts al abrirla en el navegador.
const dir = join(RAIZ, CONFIG.rutas.salida_graficos);
const svgs = readdirSync(dir).filter((f) => f.endsWith(".svg")).sort();
const familias = [CONFIG.tipografia.titulares, CONFIG.tipografia.texto]
  .map((t) => `family=${t.familia}:wght@${t.pesos.join(";")}`)
  .join("&");
const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Gráficos Lab 9</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?${familias}&display=swap">
<style>body{margin:0;padding:24px;background:#f4f4f4;font-family:${CONFIG.tipografia.texto.familia},sans-serif}
section{background:#fff;margin:0 auto 24px;padding:24px;width:fit-content}h2{font-family:${CONFIG.tipografia.titulares.familia};font-size:16px;margin:0 0 12px}</style></head><body>
${svgs.map((f) => `<section><h2>${f}</h2>${readFileSync(join(dir, f), "utf-8")}</section>`).join("\n")}
</body></html>`;
writeFileSync(join(dir, "vista_previa.html"), html);
console.log(`\n[guardado] ${CONFIG.rutas.salida_graficos}/vista_previa.html`);
