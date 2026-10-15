import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CONFIG, RAIZ, afirmar } from "./comun.js";

const CHROME = process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
afirmar(existsSync(CHROME), "Google Chrome disponible (o definir CHROME_PATH)");

// El SVG se dibuja a px_por_pulgada; multiplicar por esta escala da la resolución de impresión del config.
const ESCALA = CONFIG.lienzo.dpi_png / CONFIG.graficos.px_por_pulgada;
const dir = join(RAIZ, CONFIG.rutas.salida_graficos);
const fuentes = [CONFIG.tipografia.titulares, CONFIG.tipografia.texto]
  .map((t) => `family=${t.familia}:wght@${t.pesos.join(";")}`)
  .join("&");
const temporal = mkdtempSync(join(tmpdir(), "graficos-"));

for (const archivo of readdirSync(dir).filter((f) => f.endsWith(".svg")).sort()) {
  const svg = readFileSync(join(dir, archivo), "utf-8");
  const ancho = Math.ceil(Number(svg.match(/width="([\d.]+)"/)[1]));
  const alto = Math.ceil(Number(svg.match(/height="([\d.]+)"/)[1]));
  const html = join(temporal, archivo.replace(".svg", ".html"));
  writeFileSync(html, `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?${fuentes}&display=block">
<style>html,body{margin:0;background:${CONFIG.paleta.fondo}}svg{display:block}</style></head><body>${svg}</body></html>`);
  const png = join(dir, archivo.replace(".svg", ".png"));
  // virtual-time-budget da tiempo a que Google Fonts cargue antes de la captura.
  execFileSync(CHROME, [
    "--headless=new", "--disable-gpu", "--hide-scrollbars", "--virtual-time-budget=5000",
    `--force-device-scale-factor=${ESCALA}`, `--window-size=${ancho},${alto}`, `--screenshot=${png}`, `file://${html}`,
  ], { stdio: "ignore" });
  afirmar(existsSync(png), `${archivo.replace(".svg", ".png")} (${ancho * ESCALA}x${alto * ESCALA} px)`);
}

rmSync(temporal, { recursive: true, force: true });
