# Laboratorio 9 — Visualización estática

Infografía que sintetiza el Laboratorio 1 (ingreso de visitantes a Guatemala, enero 2009 – junio 2026) para un directivo del INGUAT. El repositorio conserva los datos y notebooks del Laboratorio 1 y agrega los scripts que generan las cifras y los gráficos.

La infografía final (PNG y PDF) no se versiona.

## Estructura

```
.
├── config.json          # rutas, períodos, paleta, tipografía y tamaños
├── requirements.txt
├── datos/               # raw/ y processed/ del Laboratorio 1
├── notebooks/           # notebooks del Laboratorio 1
├── scripts/
│   ├── python/          # cifras → recursos/datos/*.json
│   └── js/              # gráficos → recursos/graficos/
├── recursos/
│   ├── datos/
│   └── graficos/        # SVG, PNG y vista_previa.html
└── infografia/          # ignorada por git
```

## Uso

**1. Cifras (Python)**

```bash
pip install -r requirements.txt
python scripts/python/run_pipeline.py
```

**2. Gráficos (Node.js + Google Chrome)**

```bash
cd scripts/js
npm install
npm run graficos
```

Chrome se usa para exportar los PNG a 300 dpi con las fuentes reales. Si no está en la ruta por defecto de macOS, se define `CHROME_PATH`.

## Scripts

| Script | Salida |
|---|---|
| `01_serie_mensual.py` | Serie mensual y totales anuales |
| `02_kpis.py` | Cifras del titular |
| `03_vias_fronteras.py` | Participación por vía y frontera |
| `04_estacionalidad.py` | Índice mensual (100 = mes típico) |
| `05_pronostico_ses.py` | Pronóstico SES con intervalo de 80 % |
| `06_comparativo.py` | Métricas comparativas y recuperación 2025 vs 2019 |
| `07_verificar_paleta.py` | Contraste, grises y deuteranopía |
| `08_metricas_modelos.py` | MAE y RMSE de los seis modelos |

| Gráfico | Bloque |
|---|---|
| `01_linea_historica` | Panorama histórico |
| `02_estacionalidad`, `03_vias`, `03_fronteras` | Estacionalidad, vías y fronteras |
| `04_cuadro_comparativo` | Mercados y fronteras |
| `05_modelos`, `06_pronostico` | Modelos y pronóstico |

## Datos

Solo se usan las categorías Turista + Excursionista. Desde 2023 la base excluye a los compradores fronterizos frecuentes, por lo que las comparaciones contra 2019 se toman con cautela. La recuperación por serie es un cálculo propio de este laboratorio.
