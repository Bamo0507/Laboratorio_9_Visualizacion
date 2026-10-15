import * as Plot from "@observablehq/plot";
import { ANCHO_MEDIO, ESTILO, PALETA, afirmar, documento, guardarSvg, leerDatos } from "./comun.js";

const { vias, fronteras } = leerDatos("vias_fronteras");
const sinCodigo = (nombre) => nombre.replace(/^\d+\s+/, "");
const TOP_FRONTERAS = 5;

function barras(filas, alto) {
  return Plot.plot({
    document: documento(),
    width: ANCHO_MEDIO,
    height: alto,
    marginLeft: 200,
    marginRight: 70,
    marginTop: 10,
    marginBottom: 36,
    style: ESTILO,
    x: { domain: [0, 100], label: null, ticks: [0, 25, 50, 75, 100], tickFormat: (d) => `${d} %` },
    y: { domain: filas.map((d) => d.nombre), label: null },
    marks: [
      Plot.axisY({ tickSize: 0, fill: PALETA.texto }),
      Plot.axisX({ ticks: [0, 25, 50, 75, 100], tickFormat: (d) => `${d} %`, fill: PALETA.texto_secundario, stroke: PALETA.contexto, label: null }),
      Plot.barX(filas, { x: "porcentaje", y: "nombre", fill: PALETA.principal }),
      Plot.ruleX([0], { stroke: PALETA.contexto }),
      Plot.text(filas, { x: "porcentaje", y: "nombre", text: (d) => `${d.porcentaje_1d.toFixed(1)} %`, textAnchor: "start", dx: 6, fontWeight: 700 }),
    ],
  });
}

afirmar(Math.abs(vias.reduce((s, d) => s + d.porcentaje, 0) - 100) < 0.1, "las vías suman 100 %");
guardarSvg("03_vias", barras(vias, 150));
guardarSvg("03_fronteras", barras(fronteras.slice(0, TOP_FRONTERAS).map((d) => ({ ...d, nombre: sinCodigo(d.nombre) })), 220));
