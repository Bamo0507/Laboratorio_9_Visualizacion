import * as Plot from "@observablehq/plot";
import { ESTILO, FUENTE_ETIQUETA, FUENTE_SECUNDARIA, PALETA, afirmar, documento, guardarSvg, leerDatos, tamano } from "./comun.js";

const NOMBRE = "04_cuadro_comparativo";
const [ancho, alto] = tamano(NOMBRE);
const { regiones, fronteras, recuperacion } = leerDatos("comparativo");
const nombreVisible = (nombre) => nombre.replace(/^\d+\s+/, "").replace("Del ", "del ");
const SEPARADOR = " ";
// Solo se destaca una serie si supera a la segunda por al menos 1 %; si no, sería exagerar una diferencia de décimas.
const MARGEN_GANADOR = 0.01;

const PANELES = [
  { campo: "estacionalidad_acf12", titulo: ["¿Cuál repite más", "su patrón cada año?"], notas: ["1 = repite el mismo patrón"], dominio: [0, 1], formato: (v) => v.toFixed(2) },
  { campo: "crecimiento_2009_2019_pct", titulo: ["¿Cuál creció más", "entre 2009 y 2019?"], notas: ["Crecimiento en %"], dominio: [0, 250], formato: (v) => `${v} %` },
  { campo: "volatilidad_cv", titulo: ["¿Cuál varía más", "de un mes a otro?"], notas: ["Cuánto se alejan sus meses", "del promedio, en %"], dominio: [0, 0.6], formato: (v) => `${Math.round(v * 100)} %` },
  {
    campo: "recuperacion_pct", titulo: ["¿Cuál ya volvió", `al nivel de ${recuperacion.anio_base}?`],
    notas: [`${recuperacion.anio_actual} como % de ${recuperacion.anio_base} (línea = 100)`, "Desde 2023 el INGUAT excluye", "compradores fronterizos"],
    dominio: [0, 150], formato: (v) => `${Math.round(v)} %`, referencia: 100,
  },
];

function ganador(grupo, campo) {
  const [primero, segundo] = [...grupo].sort((a, b) => b[campo] - a[campo]);
  return (primero[campo] - segundo[campo]) / primero[campo] >= MARGEN_GANADOR ? primero.nombre : null;
}

// En recuperación el azul marca a quien ya superó el nivel base y el coral al más rezagado, igual que en el resto de la página.
const todas = [...regiones, ...fronteras];
const rezagada = todas.reduce((a, b) => (b.recuperacion_pct < a.recuperacion_pct ? b : a));
function colorRecuperacion(d) {
  if (d.nombre === rezagada.nombre) return "rezago";
  return d.recuperacion_pct >= 100 ? "destacado" : "normal";
}

const COLORES = {
  destacado: { barra: PALETA.principal, texto: PALETA.principal, peso: 700 },
  rezago: { barra: PALETA.acento, texto: PALETA.acento_texto, peso: 700 },
  normal: { barra: PALETA.contexto, texto: PALETA.texto_secundario, peso: 400 },
};

const centro = regiones.find((d) => d.nombre === "América Del Centro");
afirmar(rezagada === centro, "Centroamérica es la serie más rezagada");
afirmar(ganador(regiones, "crecimiento_2009_2019_pct") === centro.nombre, "Centroamérica fue la región que más creció");
const superan = regiones.filter((d) => d.recuperacion_pct >= 100).map((d) => nombreVisible(d.nombre).replace("América del ", ""));
afirmar(superan.join(",") === "Norte,Europa", "Norteamérica y Europa superan el nivel base");
const lectura = `Norteamérica y Europa ya superan ${recuperacion.anio_base}; Centroamérica, la que más había crecido, está en ${Math.round(centro.recuperacion_pct)} %.`;

const ALTO_LECTURA = 30;
const ANCHO_ETIQUETAS = 142;
const SEPARACION = 14;
const ANCHO_PANEL = (ancho - ANCHO_ETIQUETAS - SEPARACION * 3) / 4;
const ALTO_ENCABEZADO = 92;
const ALTO_GRAFICO = alto - ALTO_LECTURA - ALTO_ENCABEZADO;
const orden = [...regiones.map((d) => nombreVisible(d.nombre)), SEPARADOR, ...fronteras.map((d) => nombreVisible(d.nombre))];

function panel({ campo, dominio, formato, referencia }, conEtiquetas) {
  const destacados = [ganador(regiones, campo), ganador(fronteras, campo)].filter(Boolean);
  const filas = todas.map((d) => ({
    serie: nombreVisible(d.nombre),
    valor: d[campo],
    tono: COLORES[referencia ? colorRecuperacion(d) : destacados.includes(d.nombre) ? "destacado" : "normal"],
  }));
  return Plot.plot({
    document: documento(),
    width: ANCHO_PANEL + (conEtiquetas ? ANCHO_ETIQUETAS : 0),
    height: ALTO_GRAFICO,
    marginLeft: conEtiquetas ? ANCHO_ETIQUETAS : 2,
    marginRight: 50,
    marginTop: 2,
    marginBottom: 2,
    style: ESTILO,
    x: { domain: dominio, label: null, axis: null },
    y: { domain: orden, label: null, padding: 0.18, axis: null },
    marks: [
      conEtiquetas ? Plot.axisY({ tickSize: 0, fill: PALETA.texto, tickFormat: (d) => (d === SEPARADOR ? "" : d) }) : null,
      conEtiquetas ? Plot.text([SEPARADOR], { y: (d) => d, frameAnchor: "left", dx: -ANCHO_ETIQUETAS, textAnchor: "start", text: () => "Fronteras", fill: PALETA.texto_secundario, fontWeight: 700, fontSize: FUENTE_SECUNDARIA }) : null,
      referencia ? Plot.ruleX([referencia], { stroke: PALETA.texto_secundario, strokeDasharray: "3,3" }) : null,
      Plot.barX(filas, { x: "valor", y: "serie", fill: (d) => d.tono.barra }),
      Plot.ruleX([0], { stroke: PALETA.contexto }),
      // Bajo la referencia la cifra va dentro de la barra para que la línea punteada no la cruce.
      ...[
        { filtro: (d) => !referencia || d.valor >= referencia, ancla: "start", dx: 4, color: (d) => d.tono.texto },
        { filtro: (d) => referencia && d.valor < referencia, ancla: "end", dx: -4, color: (d) => (d.tono === COLORES.rezago ? PALETA.fondo : PALETA.texto) },
      ].map(({ filtro, ancla, dx, color }) =>
        Plot.text(filas.filter(filtro), { x: "valor", y: "serie", text: (d) => formato(d.valor), textAnchor: ancla, dx, fill: color, fontWeight: (d) => d.tono.peso })
      ),
    ],
  }).outerHTML;
}

const partes = PANELES.map((p, i) => {
  const conEtiquetas = i === 0;
  const x = i === 0 ? 0 : ANCHO_ETIQUETAS + i * (ANCHO_PANEL + SEPARACION);
  const xTexto = conEtiquetas ? ANCHO_ETIQUETAS : 0;
  return `<g transform="translate(${x},0)">
    <text x="${xTexto}" y="16" font-size="${FUENTE_ETIQUETA}" font-weight="700" fill="${PALETA.texto}">${p.titulo[0]}</text>
    <text x="${xTexto}" y="34" font-size="${FUENTE_ETIQUETA}" font-weight="700" fill="${PALETA.texto}">${p.titulo[1]}</text>
    ${p.notas.map((n, j) => `<text x="${xTexto}" y="${52 + j * 15}" font-size="${FUENTE_SECUNDARIA}" fill="${PALETA.texto_secundario}">${n}</text>`).join("")}
    ${conEtiquetas ? `<text x="0" y="${ALTO_ENCABEZADO - 6}" font-size="${FUENTE_SECUNDARIA}" font-weight="700" fill="${PALETA.texto_secundario}">Mercados de origen</text>` : ""}
    <g transform="translate(0,${ALTO_ENCABEZADO})">${panel(p, conEtiquetas)}</g>
  </g>`;
});

guardarSvg(
  NOMBRE,
  `<svg xmlns="http://www.w3.org/2000/svg" width="${ancho}" height="${alto}" viewBox="0 0 ${ancho} ${alto}" style="font-family:${ESTILO.fontFamily};background:${PALETA.fondo}">
  <text x="0" y="18" font-size="${FUENTE_ETIQUETA + 1}" font-weight="700" fill="${PALETA.texto}">${lectura}</text>
  <g transform="translate(0,${ALTO_LECTURA})">${partes.join("")}</g>
</svg>`
);
