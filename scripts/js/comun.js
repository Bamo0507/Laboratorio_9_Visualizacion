import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseHTML } from "linkedom";

export const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const CONFIG = JSON.parse(readFileSync(join(RAIZ, "config.json"), "utf-8"));
export const PALETA = CONFIG.paleta;
export const ANCHO = CONFIG.graficos.ancho_completo;
export const ANCHO_MEDIO = CONFIG.graficos.ancho_medio;
export const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const DIR_DATOS = join(RAIZ, CONFIG.rutas.salida_datos);
const DIR_GRAFICOS = join(RAIZ, CONFIG.rutas.salida_graficos);

// Los tamaños del config están en puntos de impresión; el SVG se dibuja a px_por_pulgada.
export const px = (pt) => Math.round((pt * CONFIG.graficos.px_por_pulgada) / 72);
export const FUENTE_ETIQUETA = px(CONFIG.tipografia.tamanos_pt.etiqueta);
export const FUENTE_TEXTO = px(CONFIG.tipografia.tamanos_pt.texto);

export const ESTILO = {
  fontFamily: `${CONFIG.tipografia.etiquetas.familia}, sans-serif`,
  fontSize: `${FUENTE_ETIQUETA}px`,
  color: PALETA.texto,
  background: PALETA.fondo,
  overflow: "visible",
};

export const leerDatos = (nombre) => JSON.parse(readFileSync(join(DIR_DATOS, `${nombre}.json`), "utf-8"));

export const documento = () => parseHTML("<a>").document;

const formatoMiles = new Intl.NumberFormat("en-US");
export const miles = (n) => formatoMiles.format(Math.round(n));
export const enMiles = (n) => (n === 0 ? "0" : `${n / 1000} mil`);

export const fecha = (texto) => new Date(`${texto.slice(0, 10)}T00:00:00Z`);

export function guardarSvg(nombre, svg) {
  let texto = typeof svg === "string" ? svg : svg.outerHTML;
  if (!texto.includes('xmlns="http://www.w3.org/2000/svg"')) {
    texto = texto.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
  }
  mkdirSync(DIR_GRAFICOS, { recursive: true });
  writeFileSync(join(DIR_GRAFICOS, `${nombre}.svg`), texto);
  console.log(`[guardado] ${CONFIG.rutas.salida_graficos}/${nombre}.svg`);
}

export function afirmar(condicion, mensaje) {
  if (!condicion) {
    console.log(`[FALLO]    ${mensaje}`);
    process.exit(1);
  }
  console.log(`[ok]       ${mensaje}`);
}
