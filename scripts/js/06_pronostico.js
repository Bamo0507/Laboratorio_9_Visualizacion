import * as Plot from "@observablehq/plot";
import { ANCHO, CONFIG, ESTILO, PALETA, afirmar, documento, enMiles, fecha, guardarSvg, leerDatos, miles } from "./comun.js";

const pronostico = leerDatos("pronostico_ses");
const { recorte } = { recorte: pronostico.recorte_grafico };
const nivel = recorte.nivel;
const tope = recorte.tope_eje;
const inicio = fecha(CONFIG.graficos.inicio_grafico_pronostico);
const finEntrenamiento = fecha(CONFIG.serie.inicio_prueba);

const real = leerDatos("serie_mensual").datos.map((d) => ({ fecha: fecha(d.fecha), viajeros: d.viajeros })).filter((d) => d.fecha >= inicio);
const estimado = pronostico.datos.map((d) => ({
  fecha: fecha(d.fecha),
  estimacion: d.estimacion,
  inferior: d[`inferior_${nivel}`],
  // El eje se topa en el valor declarado del config; la banda se corta ahí y la nota lo indica.
  superior: Math.min(d[`superior_${nivel}`], tope),
}));
afirmar(real.every((d) => d.viajeros <= tope), "ningún dato real queda fuera del eje");

const ultimo = real.at(-1);
const notas = [
  { fecha: finEntrenamiento, y: tope, texto: "Fin de los datos con los que\naprendió el modelo (mar 2021)", ancla: "end", dx: -8, dy: 4, color: PALETA.texto_secundario, base: "top" },
  { fecha: fecha("2024-09-01"), y: 490000, texto: `Estimación (intervalo de ${nivel} %)`, ancla: "middle", color: PALETA.acento_texto, negrita: true },
  { fecha: fecha("2024-09-01"), y: 474000, texto: `Línea punteada: ${miles(estimado[0].estimacion)} visitantes al mes,\nel nivel de marzo de 2021 sin cambios`, ancla: "middle", color: PALETA.acento_texto, base: "top" },
  { fecha: ultimo.fecha, y: ultimo.viajeros, texto: "Visitantes\nreales", ancla: "start", dx: 8, color: PALETA.principal, negrita: true, base: "middle" },
];

const grafico = Plot.plot({
  document: documento(),
  width: ANCHO,
  height: 440,
  marginLeft: 64,
  marginRight: 90,
  marginTop: 62,
  style: ESTILO,
  x: { type: "utc", label: null },
  y: { domain: [0, tope], label: "Visitantes por mes", tickFormat: enMiles, ticks: 5, clamp: true },
  marks: [
    Plot.gridY({ stroke: PALETA.rejilla, strokeOpacity: 1, ticks: 5 }),
    Plot.axisY({ tickFormat: enMiles, ticks: 5, tickSize: 0, labelAnchor: "top", labelArrow: "none", fill: PALETA.texto_secundario }),
    Plot.axisX({ ticks: "2 years", tickFormat: "%Y", fill: PALETA.texto_secundario, stroke: PALETA.contexto }),
    Plot.areaY(estimado, { x: "fecha", y1: "inferior", y2: "superior", fill: PALETA.acento_banda }),
    Plot.ruleX([finEntrenamiento], { stroke: PALETA.texto_secundario, strokeDasharray: "3,3" }),
    Plot.ruleY([0], { stroke: PALETA.contexto }),
    Plot.lineY(real, { x: "fecha", y: "viajeros", stroke: PALETA.principal, strokeWidth: 2 }),
    Plot.lineY(estimado, { x: "fecha", y: "estimacion", stroke: PALETA.acento, strokeWidth: 2.5, strokeDasharray: "7,5" }),
    ...notas.map((n) =>
      Plot.text([n], {
        x: "fecha", y: "y", text: "texto", textAnchor: n.ancla, lineAnchor: n.base ?? "bottom", dx: n.dx ?? 0, dy: n.dy ?? 0,
        fill: n.color, fontWeight: n.negrita ? 700 : 400, lineHeight: 1.15,
      })
    ),
    Plot.text([`↑ La banda continúa por encima del gráfico y llega a ${(recorte.superior_final / 1e6).toFixed(1)} millones en junio de 2026`], {
      frameAnchor: "top-right", dy: -42, textAnchor: "end", fill: PALETA.acento_texto,
    }),
  ],
});

guardarSvg("06_pronostico", grafico);
