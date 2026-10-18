import * as Plot from "@observablehq/plot";
import { ESTILO, FUENTE_ETIQUETA, FUENTE_SECUNDARIA, PALETA, afirmar, documento, guardarSvg, leerDatos, tamano } from "./comun.js";

const { vias, fronteras, aurora_en_aerea_pct } = leerDatos("vias_fronteras");
const sinCodigo = (nombre) => nombre.replace(/^\d+\s+/, "");
const TOP_FRONTERAS = 5;
const ALTO_LECTURA = 26;

function barras(nombre, filas, lectura, detalle) {
  const [ancho, alto] = tamano(nombre);
  const grafico = Plot.plot({
    document: documento(),
    width: ancho,
    height: alto - ALTO_LECTURA,
    marginLeft: 190,
    marginRight: 60,
    marginTop: 2,
    marginBottom: 2,
    style: ESTILO,
    // Vías y fronteras comparten la escala de 0 a 100 % para que sus barras sean comparables.
    x: { domain: [0, 100], label: null, axis: null },
    y: { domain: filas.map((d) => d.nombre), label: null, padding: 0.18 },
    marks: [
      Plot.axisY({ tickSize: 0, fill: PALETA.texto }),
      Plot.barX(filas, { x: "porcentaje", y: "nombre", fill: (d) => (d.resto ? PALETA.contexto : PALETA.principal) }),
      Plot.ruleX([0], { stroke: PALETA.contexto }),
      Plot.text(filas, {
        x: "porcentaje", y: "nombre", text: (d) => `${d.porcentaje_1d.toFixed(1)} %`, textAnchor: "start", dx: 6, fontWeight: 700,
        fill: (d) => (d.resto ? PALETA.texto_secundario : PALETA.texto),
      }),
    ],
  });
  guardarSvg(
    nombre,
    `<svg xmlns="http://www.w3.org/2000/svg" width="${ancho}" height="${alto}" viewBox="0 0 ${ancho} ${alto}" style="font-family:${ESTILO.fontFamily};background:${PALETA.fondo}">
  <text x="0" y="17" font-size="${FUENTE_ETIQUETA}" fill="${PALETA.texto}"><tspan font-weight="700">${lectura}</tspan>${detalle ? `<tspan font-size="${FUENTE_SECUNDARIA}" fill="${PALETA.texto_secundario}"> · ${detalle}</tspan>` : ""}</text>
  <g transform="translate(0,${ALTO_LECTURA})">${grafico.outerHTML}</g>
</svg>`
  );
}

afirmar(Math.abs(vias.reduce((s, d) => s + d.porcentaje, 0) - 100) < 0.1, "las vías suman 100 %");
const terrestre = vias.find((d) => d.nombre === "Terrestre");
afirmar(Math.round(terrestre.porcentaje / 10) === 6, "6 de cada 10 entran por tierra");
barras("03_vias", vias, "6 de cada 10 entran por tierra", "% de visitantes, 2009 a jun 2026");

const principales = fronteras.slice(0, TOP_FRONTERAS).map((d) => ({ ...d, nombre: sinCodigo(d.nombre) }));
const otras = fronteras.slice(TOP_FRONTERAS);
const pctOtras = otras.reduce((s, d) => s + d.porcentaje, 0);
const filaOtras = { nombre: `Otras ${otras.length} fronteras`, porcentaje: pctOtras, porcentaje_1d: Math.round(pctOtras * 10) / 10, resto: true };
afirmar(Math.abs(principales.reduce((s, d) => s + d.porcentaje, 0) + pctOtras - 100) < 0.1, "las fronteras suman 100 %");
barras("03_fronteras", [...principales, filaOtras], `La Aurora recibe el ${aurora_en_aerea_pct.toFixed(1)} % de quienes llegan por aire`);
