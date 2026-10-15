import * as Plot from "@observablehq/plot";
import { ANCHO, ESTILO, PALETA, afirmar, documento, enMiles, guardarSvg, leerDatos, miles } from "./comun.js";

const { datos } = leerDatos("metricas_modelos");
const mejor = datos[0];
afirmar(datos.every((d) => d.mae >= mejor.mae), "el primer modelo es el de menor MAE");

const grafico = Plot.plot({
  document: documento(),
  width: ANCHO,
  height: 300,
  marginLeft: 250,
  marginRight: 230,
  marginTop: 10,
  marginBottom: 44,
  style: ESTILO,
  x: { domain: [0, 250000], label: "Error promedio (visitantes por mes, MAE)", tickFormat: enMiles, ticks: 5 },
  y: { domain: datos.map((d) => d.modelo), label: null },
  marks: [
    Plot.axisY({ tickSize: 0, fill: PALETA.texto }),
    Plot.axisX({ ticks: 5, tickFormat: enMiles, fill: PALETA.texto_secundario, stroke: PALETA.contexto, labelArrow: "none" }),
    Plot.barX(datos, { x: "mae", y: "modelo", fill: (d) => (d === mejor ? PALETA.acento : PALETA.contexto) }),
    Plot.ruleX([0], { stroke: PALETA.contexto }),
    Plot.text(datos, {
      x: "mae", y: "modelo", text: (d) => miles(d.mae), textAnchor: "start", dx: 6, fontWeight: 700,
      fill: (d) => (d === mejor ? PALETA.acento_texto : PALETA.texto),
    }),
    Plot.text(datos, {
      x: "mae", y: "modelo", text: (d) => `RMSE ${miles(d.rmse)}`, textAnchor: "start", dx: 78, fill: PALETA.texto_secundario,
    }),
  ],
});

guardarSvg("05_modelos", grafico);
