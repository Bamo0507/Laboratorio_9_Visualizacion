import * as Plot from "@observablehq/plot";
import { CONFIG, ESTILO, FUENTE_ETIQUETA, FUENTE_SECUNDARIA, PALETA, afirmar, documento, enMiles, fecha, guardarSvg, leerDatos, miles, tamano } from "./comun.js";

const NOMBRE = "06_pronostico";
const [ancho, alto] = tamano(NOMBRE);
const pronostico = leerDatos("pronostico_ses");
const recorte = pronostico.recorte_grafico;
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
const prueba = real.filter((d) => d.fecha >= finEntrenamiento);
const mediaPrueba = prueba.reduce((s, d) => s + d.viajeros, 0) / prueba.length;
afirmar(pronostico.cobertura_pct[nivel] === 100, `la banda de ${nivel} % cubre todos los meses reales`);
const lectura = `Aprendieron hasta marzo de 2021: estimaron ${Math.round(estimado[0].estimacion / 1000)} mil al mes y llegaron ${Math.round(mediaPrueba / 1000)} mil.`;
const ALTO_LECTURA = 26;
const notas = [
  { fecha: finEntrenamiento, y: tope, texto: "Fin de los datos de aprendizaje", ancla: "end", dx: 4, dy: -6, color: PALETA.texto_secundario, base: "bottom", tamano: FUENTE_SECUNDARIA },
  { fecha: fecha("2023-11-01"), y: 490000, texto: `Estimación (${nivel} %): cubre todos los meses,\npero es muy ancha para planificar`, ancla: "middle", color: PALETA.acento_texto, negrita: true, base: "top", tamano: FUENTE_SECUNDARIA },
  { fecha: fecha("2026-06-01"), y: estimado[0].estimacion, texto: `${miles(estimado[0].estimacion)} al mes: nivel de mar 2021`, ancla: "end", dy: 5, color: PALETA.acento_texto, base: "top", tamano: FUENTE_SECUNDARIA },
  { fecha: ultimo.fecha, y: ultimo.viajeros, texto: "Visitantes\nreales", ancla: "start", dx: 6, color: PALETA.principal, negrita: true, base: "middle" },
];

const grafico = Plot.plot({
  document: documento(),
  width: ancho,
  height: alto - ALTO_LECTURA,
  marginLeft: 54,
  marginRight: 76,
  marginTop: 44,
  marginBottom: 24,
  style: ESTILO,
  x: { type: "utc", label: null },
  y: { domain: [0, tope], label: "Visitantes por mes", tickFormat: enMiles, clamp: true },
  marks: [
    Plot.gridY({ stroke: PALETA.rejilla, strokeOpacity: 1, ticks: [100000, 200000, 300000, 400000, 500000] }),
    Plot.axisY({ tickFormat: enMiles, ticks: [0, 100000, 200000, 300000, 400000, 500000], tickSize: 0, labelAnchor: "top", labelArrow: "none", fill: PALETA.texto_secundario, fontSize: FUENTE_SECUNDARIA }),
    Plot.axisX({ ticks: "2 years", tickFormat: "%Y", fill: PALETA.texto_secundario, stroke: PALETA.contexto, fontSize: FUENTE_SECUNDARIA }),
    Plot.areaY(estimado, { x: "fecha", y1: "inferior", y2: "superior", fill: PALETA.acento_banda }),
    Plot.ruleX([finEntrenamiento], { stroke: PALETA.texto_secundario, strokeDasharray: "3,3" }),
    Plot.ruleY([0], { stroke: PALETA.contexto }),
    Plot.lineY(real, { x: "fecha", y: "viajeros", stroke: PALETA.principal, strokeWidth: 1.8 }),
    Plot.lineY(estimado, { x: "fecha", y: "estimacion", stroke: PALETA.acento, strokeWidth: 2.5, strokeDasharray: "7,5" }),
    ...notas.map((n) =>
      Plot.text([n], {
        x: "fecha", y: "y", text: "texto", textAnchor: n.ancla, lineAnchor: n.base ?? "bottom", dx: n.dx ?? 0, dy: n.dy ?? 0,
        fill: n.color, fontWeight: n.negrita ? 700 : 400, fontSize: n.tamano, lineHeight: 1.1,
      })
    ),
    Plot.text([`↑ La banda llega a ${(recorte.superior_final / 1e6).toFixed(1)} millones en jun 2026`], {
      frameAnchor: "top-right", dy: -42, textAnchor: "end", lineAnchor: "top", fill: PALETA.acento_texto, fontSize: FUENTE_SECUNDARIA,
    }),
  ],
});

guardarSvg(
  NOMBRE,
  `<svg xmlns="http://www.w3.org/2000/svg" width="${ancho}" height="${alto}" viewBox="0 0 ${ancho} ${alto}" style="font-family:${ESTILO.fontFamily};background:${PALETA.fondo}">
  <text x="0" y="17" font-size="${FUENTE_ETIQUETA}" font-weight="700" fill="${PALETA.texto}">${lectura}</text>
  <g transform="translate(0,${ALTO_LECTURA})">${grafico.outerHTML}</g>
</svg>`
);
