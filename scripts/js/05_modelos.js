import * as Plot from "@observablehq/plot";
import { ESTILO, FUENTE_ETIQUETA, FUENTE_SECUNDARIA, PALETA, afirmar, documento, enMiles, guardarSvg, leerDatos, miles, tamano } from "./comun.js";

const NOMBRE = "05_modelos";
const [ancho, alto] = tamano(NOMBRE);
// Nombres cortos para que quepan en media columna; el documento trae los nombres completos.
const CORTOS = {
  "Suavizamiento exponencial simple": "Suavizamiento simple",
  "SARIMA (versión 1)": "SARIMA (v1)",
  "SARIMA (versión 2)": "SARIMA (v2)",
  "Seasonal naive": "Repetir el año anterior",
};

const datos = leerDatos("metricas_modelos").datos.map((d) => ({ ...d, nombre: CORTOS[d.modelo] ?? d.modelo }));
const mejor = datos[0];
afirmar(datos.every((d) => d.mae >= mejor.mae), "el primer modelo es el de menor MAE");
const lectura = `Hasta el mejor se equivoca en ${Math.round(mejor.mae / 1000)} mil al mes`;
// El RMSE va como nota porque ordena a los modelos igual que el MAE; así se muestra sin duplicar las seis cifras.
afirmar(datos.every((d, i) => i === 0 || d.rmse >= datos[i - 1].rmse), "el RMSE ordena a los modelos igual que el MAE");
const notaRmse = `RMSE: de ${miles(mejor.rmse)} a ${miles(datos.at(-1).rmse)}, en el mismo orden`;
const ALTO_LECTURA = 26;
const ALTO_NOTA = 20;

const grafico = Plot.plot({
  document: documento(),
  width: ancho,
  height: alto - ALTO_LECTURA - ALTO_NOTA,
  marginLeft: 172,
  marginRight: 66,
  marginTop: 4,
  marginBottom: 40,
  style: ESTILO,
  x: { domain: [0, 250000], label: "Error promedio al mes (MAE)" },
  y: { domain: datos.map((d) => d.nombre), label: null, padding: 0.18 },
  marks: [
    Plot.axisY({ tickSize: 0, fill: PALETA.texto }),
    Plot.axisX({ ticks: [0, 100000, 200000], tickFormat: enMiles, fill: PALETA.texto_secundario, stroke: PALETA.contexto, labelArrow: "none", labelAnchor: "left", fontSize: FUENTE_SECUNDARIA }),
    Plot.barX(datos, { x: "mae", y: "nombre", fill: (d) => (d === mejor ? PALETA.acento : PALETA.contexto) }),
    Plot.ruleX([0], { stroke: PALETA.contexto }),
    Plot.text(datos, {
      x: "mae", y: "nombre", text: (d) => miles(d.mae), textAnchor: "start", dx: 5, fontWeight: 700,
      fill: (d) => (d === mejor ? PALETA.acento_texto : PALETA.texto),
    }),
  ],
});

guardarSvg(
  NOMBRE,
  `<svg xmlns="http://www.w3.org/2000/svg" width="${ancho}" height="${alto}" viewBox="0 0 ${ancho} ${alto}" style="font-family:${ESTILO.fontFamily};background:${PALETA.fondo}">
  <text x="0" y="17" font-size="${FUENTE_ETIQUETA}" font-weight="700" fill="${PALETA.texto}">${lectura}</text>
  <g transform="translate(0,${ALTO_LECTURA})">${grafico.outerHTML}</g>
  <text x="0" y="${alto - 5}" font-size="${FUENTE_SECUNDARIA}" fill="${PALETA.texto_secundario}">${notaRmse}</text>
</svg>`
);
