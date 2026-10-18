import * as Plot from "@observablehq/plot";
import { CONFIG, ESTILO, FUENTE_ETIQUETA, FUENTE_SECUNDARIA, MESES, PALETA, afirmar, documento, guardarSvg, leerDatos, tamano } from "./comun.js";

const NOMBRE = "02_estacionalidad";
const [ancho, alto] = tamano(NOMBRE);
const { datos } = leerDatos("estacionalidad");
const [postDesde, postHasta] = CONFIG.estacionalidad.post_pandemia;

const meses = datos.map((d) => ({ mes: MESES[d.mes - 1], actual: d.post_pandemia.indice }));
const pico = meses.reduce((a, b) => (b.actual > a.actual ? b : a));
const valle = meses.reduce((a, b) => (b.actual < a.actual ? b : a));
afirmar(pico.mes === "Dic", "el pico del período actual es diciembre");
afirmar(valle.mes === "Sep", "el mes más bajo del período actual es septiembre");
const lectura = `Diciembre recibe ${Math.round(pico.actual - 100)} % más que un mes típico; septiembre, ${Math.round(100 - valle.actual)} % menos.`;
const ALTO_LECTURA = 28;

// Las fechas se ubican sobre el mes con el que coinciden; se redactan como coincidencia, no como causa.
const fechas = [
  { mes: "Mar", texto: "Semana\nSanta" },
  { mes: "Jul", texto: "Vacaciones\ny Bono 14" },
  { mes: "Dic", texto: "Fiestas y\naguinaldo" },
];

const grafico = Plot.plot({
  document: documento(),
  width: ancho,
  height: alto - ALTO_LECTURA,
  marginLeft: 40,
  marginTop: 58,
  marginRight: 10,
  marginBottom: 24,
  style: ESTILO,
  x: { domain: MESES, label: null, padding: 0.2 },
  y: { domain: [75, 140], label: `Índice (100 = mes típico), promedio ${postDesde}-${postHasta}` },
  marks: [
    Plot.gridY({ stroke: PALETA.rejilla, strokeOpacity: 1, ticks: [80, 120, 140] }),
    Plot.axisY({ ticks: [80, 100, 120, 140], tickSize: 0, labelAnchor: "top", labelArrow: "none", fill: PALETA.texto_secundario, fontSize: FUENTE_SECUNDARIA }),
    Plot.axisX({ tickSize: 0, fill: PALETA.texto, fontSize: FUENTE_SECUNDARIA }),
    Plot.barY(meses, { x: "mes", y1: 100, y2: "actual", fill: (d) => (d === pico ? PALETA.acento : PALETA.principal) }),
    Plot.ruleY([100], { stroke: PALETA.texto_secundario, strokeWidth: 1.2 }),
    ...[
      { filtro: (d) => d.actual >= 100, dy: -4, ancla: "bottom" },
      { filtro: (d) => d.actual < 100, dy: 4, ancla: "top" },
    ].map(({ filtro, dy, ancla }) =>
      Plot.text(meses.filter(filtro), {
        x: "mes", y: "actual", text: (d) => Math.round(d.actual), dy, lineAnchor: ancla, fontSize: FUENTE_SECUNDARIA,
        fill: (d) => (d === pico ? PALETA.acento_texto : PALETA.texto), fontWeight: 700,
      })
    ),
    Plot.text(fechas, { x: "mes", frameAnchor: "top", dy: -40, text: "texto", lineAnchor: "top", lineHeight: 1.05, fill: PALETA.texto_secundario, fontSize: FUENTE_SECUNDARIA }),
  ],
});

guardarSvg(
  NOMBRE,
  `<svg xmlns="http://www.w3.org/2000/svg" width="${ancho}" height="${alto}" viewBox="0 0 ${ancho} ${alto}" style="font-family:${ESTILO.fontFamily};background:${PALETA.fondo}">
  <text x="0" y="18" font-size="${FUENTE_ETIQUETA}" font-weight="700" fill="${PALETA.texto}">${lectura}</text>
  <g transform="translate(0,${ALTO_LECTURA})">${grafico.outerHTML}</g>
</svg>`
);
