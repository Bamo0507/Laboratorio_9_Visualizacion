import * as Plot from "@observablehq/plot";
import { ANCHO, CONFIG, ESTILO, MESES, PALETA, afirmar, documento, guardarSvg, leerDatos } from "./comun.js";

const { datos } = leerDatos("estacionalidad");
const [preDesde, preHasta] = CONFIG.estacionalidad.pre_pandemia;
const [postDesde, postHasta] = CONFIG.estacionalidad.post_pandemia;

const meses = datos.map((d) => ({
  mes: MESES[d.mes - 1],
  actual: d.post_pandemia.indice,
  previo: d.pre_pandemia.indice,
}));
const pico = meses.reduce((a, b) => (b.actual > a.actual ? b : a));
afirmar(pico.mes === "Dic", "el pico del período actual es diciembre");

// Las fechas se ubican sobre el primer mes del par para leerse como "coincide con", no como causa.
const fechas = [
  { mes: "Mar", texto: "Semana Santa" },
  { mes: "Jul", texto: "Vacaciones de medio\naño y Bono 14" },
  { mes: "Dic", texto: "Fiestas de fin de\naño y aguinaldo" },
];

const grafico = Plot.plot({
  document: documento(),
  width: ANCHO,
  height: 380,
  marginLeft: 64,
  marginTop: 70,
  marginRight: 20,
  style: ESTILO,
  x: { domain: MESES, label: null, padding: 0.25 },
  y: { domain: [75, 140], label: "Índice (100 = mes típico)", ticks: [80, 90, 100, 110, 120, 130, 140] },
  marks: [
    Plot.gridY({ stroke: PALETA.rejilla, strokeOpacity: 1, ticks: [80, 90, 110, 120, 130, 140] }),
    Plot.axisY({ ticks: [80, 90, 100, 110, 120, 130, 140], tickSize: 0, labelAnchor: "top", labelArrow: "none", fill: PALETA.texto_secundario }),
    Plot.axisX({ tickSize: 0, fill: PALETA.texto }),
    Plot.barY(meses, { x: "mes", y1: 100, y2: "actual", fill: (d) => (d === pico ? PALETA.acento : PALETA.principal) }),
    Plot.tickY(meses, { x: "mes", y: "previo", stroke: PALETA.principal_claro, strokeWidth: 3 }),
    Plot.ruleY([100], { stroke: PALETA.texto_secundario, strokeWidth: 1.2 }),
    ...[
      { filtro: (d) => d.actual >= 100, dy: -6, ancla: "bottom" },
      { filtro: (d) => d.actual < 100, dy: 6, ancla: "top" },
    ].map(({ filtro, dy, ancla }) =>
      Plot.text(meses.filter(filtro), {
        x: "mes", y: "actual", text: (d) => Math.round(d.actual), dy, lineAnchor: ancla,
        fill: (d) => (d === pico ? PALETA.acento_texto : PALETA.texto), fontWeight: 700,
      })
    ),
    Plot.text(fechas, { x: "mes", frameAnchor: "top", dy: -50, text: "texto", lineAnchor: "top", lineHeight: 1.15, fill: PALETA.texto_secundario }),
    Plot.text([`Barras: ${postDesde}-${postHasta}`], { frameAnchor: "top-left", dx: 8, dy: 6, lineAnchor: "top", fill: PALETA.principal, fontWeight: 700, textAnchor: "start" }),
    Plot.text([`Marca clara: ${preDesde}-${preHasta}, antes de la pandemia`], { frameAnchor: "top-left", dx: 8, dy: 26, lineAnchor: "top", fill: PALETA.principal_claro, fontWeight: 700, textAnchor: "start" }),
  ],
});

guardarSvg("02_estacionalidad", grafico);
