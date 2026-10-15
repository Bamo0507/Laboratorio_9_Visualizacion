import * as Plot from "@observablehq/plot";
import { ANCHO, ESTILO, FUENTE_ETIQUETA, FUENTE_TEXTO, PALETA, documento, guardarSvg, leerDatos } from "./comun.js";

const { regiones, fronteras } = leerDatos("comparativo");
const nombreVisible = (nombre) => nombre.replace(/^\d+\s+/, "").replace("Del ", "del ");
const SEPARADOR = " ";
// Solo se destaca una serie si supera a la segunda por al menos 1 %; si no, sería exagerar una diferencia de décimas.
const MARGEN_GANADOR = 0.01;

const PANELES = [
  { campo: "estacionalidad_acf12", titulo: "¿Cuál repite más su patrón cada año?", nota: "Escala de 0 a 1", dominio: [0, 1], formato: (v) => v.toFixed(2) },
  { campo: "crecimiento_2009_2019_pct", titulo: "¿Cuál creció más entre 2009 y 2019?", nota: "Crecimiento en %", dominio: [0, 250], formato: (v) => `${v} %` },
  { campo: "volatilidad_cv", titulo: "¿Cuál varía más respecto a su promedio?", nota: "Mayor valor = meses más dispersos", dominio: [0, 0.6], formato: (v) => v.toFixed(2) },
  { campo: "caida_pandemia_pct", titulo: "¿A cuál golpeó más la pandemia?", nota: "Caída del peor mes de 2020 frente a 2019", dominio: [0, 100], formato: (v) => `${v.toFixed(1)} %` },
];

function ganador(grupo, campo) {
  const ordenados = [...grupo].sort((a, b) => b[campo] - a[campo]);
  const [primero, segundo] = ordenados;
  return (primero[campo] - segundo[campo]) / primero[campo] >= MARGEN_GANADOR ? primero.nombre : null;
}

const ANCHO_PANEL = (ANCHO - 40) / 2;
const ALTO_PANEL = 230;
const ALTO_TITULO = 52;

function panel({ campo, dominio, formato }) {
  const destacados = [ganador(regiones, campo), ganador(fronteras, campo)].filter(Boolean);
  const filas = [...regiones, ...fronteras].map((d) => ({ serie: nombreVisible(d.nombre), valor: d[campo], destacado: destacados.includes(d.nombre) }));
  const orden = [...regiones.map((d) => nombreVisible(d.nombre)), SEPARADOR, ...fronteras.map((d) => nombreVisible(d.nombre))];
  const svg = Plot.plot({
    document: documento(),
    width: ANCHO_PANEL,
    height: ALTO_PANEL,
    marginLeft: 140,
    marginRight: 64,
    marginTop: 6,
    marginBottom: 28,
    style: ESTILO,
    x: { domain: dominio, label: null, ticks: 4 },
    y: { domain: orden, label: null, padding: 0.2 },
    marks: [
      Plot.axisY({ tickSize: 0, fill: PALETA.texto }),
      Plot.axisX({ ticks: 4, fill: PALETA.texto_secundario, stroke: PALETA.contexto }),
      Plot.barX(filas, { x: "valor", y: "serie", fill: (d) => (d.destacado ? PALETA.acento : PALETA.contexto) }),
      Plot.ruleX([0], { stroke: PALETA.contexto }),
      Plot.text(filas.filter((d) => d.destacado), { x: "valor", y: "serie", text: (d) => formato(d.valor), textAnchor: "start", dx: 6, fill: PALETA.acento_texto, fontWeight: 700 }),
    ],
  });
  const sinGanadorFronteras = !destacados.some((n) => fronteras.some((f) => f.nombre === n));
  return { svg: svg.outerHTML, sinGanadorFronteras };
}

const partes = PANELES.map((p, i) => {
  const x = (i % 2) * (ANCHO_PANEL + 40);
  const y = Math.floor(i / 2) * (ALTO_PANEL + ALTO_TITULO + 20);
  const { svg, sinGanadorFronteras } = panel(p);
  const nota = sinGanadorFronteras ? `${p.nota}; las tres fronteras cayeron casi igual` : p.nota;
  return `<g transform="translate(${x},${y})">
    <text x="0" y="20" font-size="${FUENTE_TEXTO}" font-weight="700" fill="${PALETA.texto}">${p.titulo}</text>
    <text x="0" y="42" font-size="${FUENTE_ETIQUETA - 1}" fill="${PALETA.texto_secundario}">${nota}</text>
    <g transform="translate(0,${ALTO_TITULO})">${svg}</g>
  </g>`;
});

const altoTotal = 2 * (ALTO_PANEL + ALTO_TITULO) + 20;
guardarSvg(
  "04_cuadro_comparativo",
  `<svg xmlns="http://www.w3.org/2000/svg" width="${ANCHO}" height="${altoTotal}" viewBox="0 0 ${ANCHO} ${altoTotal}" style="font-family:${ESTILO.fontFamily};background:${PALETA.fondo}">${partes.join("")}</svg>`
);
