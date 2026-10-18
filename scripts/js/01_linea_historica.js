import * as Plot from "@observablehq/plot";
import { ESTILO, FUENTE_ETIQUETA, FUENTE_SECUNDARIA, PALETA, afirmar, documento, enMiles, fecha, guardarSvg, leerDatos, miles, tamano } from "./comun.js";

const NOMBRE = "01_linea_historica";
const [ancho, alto] = tamano(NOMBRE);

const serie = leerDatos("serie_mensual").datos.map((d) => ({ ...d, fecha: fecha(d.fecha) }));
const anuales = Object.fromEntries(leerDatos("totales_anuales").datos.map((d) => [d.anio, d.viajeros]));
const kpis = leerDatos("kpis");

const pandemia = serie.filter((d) => d.pandemia);
const finPandemia = new Date(pandemia.at(-1).fecha);
finPandemia.setUTCMonth(finPandemia.getUTCMonth() + 1);
const pico = serie.reduce((a, b) => (b.viajeros > a.viajeros ? b : a));
const minimo = serie.find((d) => d.fecha.toISOString().startsWith(kpis.mes_minimo_pandemia.fecha));
const anioReciente = kpis.recuperacion_vs_pico_pct.anio;
// El marcador del año reciente se ubica a mitad de ese año, sobre la curva.
const reciente = serie.find((d) => d.fecha.toISOString().startsWith(`${anioReciente}-07`));
afirmar(Math.round(pico.viajeros) === kpis.mes_pico.viajeros, "el pico coincide con kpis.json");
afirmar(Math.round(minimo.viajeros) === kpis.mes_minimo_pandemia.viajeros, "el mínimo coincide con kpis.json");

const crecimiento = kpis.crecimiento_hasta_pico_pct;
const lectura = `Creció ${Math.round(crecimiento.valor)} % en ${crecimiento.hasta - crecimiento.desde} años, la pandemia lo hundió ${Math.round(kpis.caida_pandemia_pct)} % y hoy está en el ${Math.round(kpis.recuperacion_vs_pico_pct.valor)} % de su máximo.`;

const marcadores = [
  { numero: 1, punto: pico, color: PALETA.principal, cifra: miles(pico.viajeros), texto: "dic 2019, el mes más alto" },
  { numero: 2, punto: minimo, color: PALETA.acento, cifra: miles(minimo.viajeros), texto: "may 2020, el mes más bajo" },
  { numero: 3, punto: reciente, color: PALETA.principal, cifra: `${(anuales[anioReciente] / 1e6).toFixed(2)} M al año`, texto: `en ${anioReciente}, menos que en 2019` },
];

const ALTO_LECTURA = 30;
const ALTO_VINETAS = 34;
const altoGrafico = alto - ALTO_LECTURA - ALTO_VINETAS;

const grafico = Plot.plot({
  document: documento(),
  width: ancho,
  height: altoGrafico,
  marginLeft: 58,
  marginRight: 96,
  marginTop: 26,
  marginBottom: 24,
  style: ESTILO,
  x: { type: "utc", label: null },
  y: { domain: [0, 500000], label: "Visitantes por mes" },
  marks: [
    Plot.rect([{ x1: pandemia[0].fecha, x2: finPandemia }], { x1: "x1", x2: "x2", fill: PALETA.rejilla }),
    Plot.text([{ x: pandemia[0].fecha }], { x: "x", frameAnchor: "top", dy: 4, dx: 5, text: () => "Pandemia", textAnchor: "start", lineAnchor: "top", fill: PALETA.texto_secundario, fontSize: FUENTE_SECUNDARIA }),
    Plot.gridY({ stroke: PALETA.rejilla, strokeOpacity: 1, ticks: [100000, 200000, 300000, 400000, 500000] }),
    Plot.axisY({ tickFormat: enMiles, ticks: [0, 100000, 200000, 300000, 400000, 500000], tickSize: 0, label: "Visitantes por mes", labelAnchor: "top", labelArrow: "none", fill: PALETA.texto_secundario, fontSize: FUENTE_SECUNDARIA }),
    Plot.axisX({ ticks: "2 years", tickFormat: "%Y", fill: PALETA.texto_secundario, stroke: PALETA.contexto, fontSize: FUENTE_SECUNDARIA }),
    Plot.ruleY([0], { stroke: PALETA.contexto }),
    Plot.lineY(serie, { x: "fecha", y: "viajeros", stroke: PALETA.principal, strokeWidth: 2.2 }),
    Plot.dot(marcadores, { x: (d) => d.punto.fecha, y: (d) => d.punto.viajeros, r: 10, fill: "color", stroke: PALETA.fondo, strokeWidth: 2 }),
    Plot.text(marcadores, { x: (d) => d.punto.fecha, y: (d) => d.punto.viajeros, text: "numero", fill: PALETA.fondo, fontWeight: 700, fontSize: FUENTE_SECUNDARIA }),
    Plot.text([serie.at(-1)], { x: "fecha", y: "viajeros", text: () => "2026: datos\nhasta junio", textAnchor: "start", dx: 8, fill: PALETA.texto_secundario, lineHeight: 1.1, fontSize: FUENTE_SECUNDARIA }),
  ],
});

const anchoColumna = ancho / marcadores.length;
const vinetas = marcadores.map((m, i) => {
  const x = i * anchoColumna;
  const y = ALTO_LECTURA + altoGrafico + 20;
  return `<g transform="translate(${x},${y})">
    <circle cx="10" cy="-5" r="10" fill="${m.color}"/>
    <text x="10" y="-5" text-anchor="middle" dominant-baseline="central" font-size="${FUENTE_SECUNDARIA}" font-weight="700" fill="${PALETA.fondo}">${m.numero}</text>
    <text x="28" y="0" font-size="${FUENTE_ETIQUETA}" fill="${PALETA.texto}"><tspan font-weight="700" fill="${m.numero === 2 ? PALETA.acento_texto : PALETA.texto}">${m.cifra}</tspan><tspan fill="${PALETA.texto_secundario}"> · ${m.texto}</tspan></text>
  </g>`;
});

guardarSvg(
  NOMBRE,
  `<svg xmlns="http://www.w3.org/2000/svg" width="${ancho}" height="${alto}" viewBox="0 0 ${ancho} ${alto}" style="font-family:${ESTILO.fontFamily};background:${PALETA.fondo}">
  <text x="0" y="18" font-size="${FUENTE_ETIQUETA + 1}" font-weight="700" fill="${PALETA.texto}">${lectura}</text>
  <g transform="translate(0,${ALTO_LECTURA})">${grafico.outerHTML}</g>
  ${vinetas.join("")}
</svg>`
);
