import * as Plot from "@observablehq/plot";
import { ANCHO, ESTILO, FUENTE_ETIQUETA, PALETA, afirmar, documento, enMiles, fecha, guardarSvg, leerDatos, miles } from "./comun.js";

const serie = leerDatos("serie_mensual").datos.map((d) => ({ ...d, fecha: fecha(d.fecha) }));
const anuales = Object.fromEntries(leerDatos("totales_anuales").datos.map((d) => [d.anio, d.viajeros]));
const kpis = leerDatos("kpis");

const pandemia = serie.filter((d) => d.pandemia);
const finPandemia = new Date(pandemia.at(-1).fecha);
finPandemia.setUTCMonth(finPandemia.getUTCMonth() + 1);
const pico = serie.reduce((a, b) => (b.viajeros > a.viajeros ? b : a));
const minimo = serie.find((d) => d.fecha.toISOString().startsWith(kpis.mes_minimo_pandemia.fecha));
afirmar(Math.round(pico.viajeros) === kpis.mes_pico.viajeros, "el pico coincide con kpis.json");
afirmar(Math.round(minimo.viajeros) === kpis.mes_minimo_pandemia.viajeros, "el mínimo coincide con kpis.json");

const millones = (n) => (n / 1e6).toFixed(2);
const notas = [
  { fecha: fecha("2010-03-01"), y: 395000, texto: `2009 a 2019: de ${millones(anuales[2009])} a ${millones(anuales[2019])}\nmillones de visitantes al año`, color: PALETA.texto, ancla: "start" },
  { fecha: pico.fecha, y: pico.viajeros, texto: `Dic 2019: ${miles(pico.viajeros)}\nel mes con más visitantes`, color: PALETA.texto, ancla: "end", dx: -10, dy: -4 },
  { fecha: minimo.fecha, y: minimo.viajeros, texto: `May 2020: ${miles(minimo.viajeros)}\nel mes con menos visitantes`, color: PALETA.acento_texto, ancla: "end", dx: -12, dy: 10, negrita: true },
  { fecha: fecha("2023-03-01"), y: 470000, texto: `2025: ${millones(anuales[2025])} millones,\naún por debajo de 2019`, color: PALETA.texto, ancla: "start" },
];

const grafico = Plot.plot({
  document: documento(),
  width: ANCHO,
  height: 430,
  marginLeft: 64,
  marginRight: 70,
  marginTop: 34,
  style: ESTILO,
  x: { type: "utc", label: null, ticks: "2 years", tickFormat: "%Y" },
  y: { domain: [0, 500000], label: "Visitantes por mes", tickFormat: enMiles, ticks: 5 },
  marks: [
    Plot.rect([{ x1: pandemia[0].fecha, x2: finPandemia }], { x1: "x1", x2: "x2", fill: PALETA.rejilla }),
    Plot.text([{ x: pandemia[0].fecha }], { x: "x", frameAnchor: "top", dy: -14, dx: 4, text: () => "Pandemia", textAnchor: "start", fill: PALETA.texto_secundario }),
    Plot.gridY({ stroke: PALETA.rejilla, strokeOpacity: 1, ticks: 5 }),
    Plot.axisY({ tickFormat: enMiles, ticks: 5, tickSize: 0, label: "Visitantes por mes", labelAnchor: "top", labelArrow: "none", fill: PALETA.texto_secundario }),
    Plot.axisX({ ticks: "2 years", tickFormat: "%Y", fill: PALETA.texto_secundario, stroke: PALETA.contexto }),
    Plot.ruleY([0], { stroke: PALETA.contexto }),
    Plot.lineY(serie, { x: "fecha", y: "viajeros", stroke: PALETA.principal, strokeWidth: 2 }),
    Plot.dot([pico], { x: "fecha", y: "viajeros", fill: PALETA.principal, r: 4.5 }),
    Plot.dot([minimo], { x: "fecha", y: "viajeros", fill: PALETA.acento, r: 6 }),
    ...notas.map((n) =>
      Plot.text([n], {
        x: "fecha", y: "y", text: "texto", fill: n.color, textAnchor: n.ancla, lineAnchor: "bottom",
        dx: n.dx ?? 0, dy: n.dy ?? 0, fontWeight: n.negrita ? 700 : 400, fontSize: FUENTE_ETIQUETA, lineHeight: 1.15,
      })
    ),
    Plot.text([serie.at(-1)], { x: "fecha", y: "viajeros", text: () => "2026: datos\nhasta junio", textAnchor: "start", dx: 8, fill: PALETA.texto_secundario, lineHeight: 1.15 }),
  ],
});

guardarSvg("01_linea_historica", grafico);
