import pandas as pd
from statsmodels.tsa.stattools import acf

from comun import CONFIG, afirmar, cargar_detalle, guardar_json, ruta

entrenamiento = pd.read_csv(ruta("entrenamiento"), parse_dates=["Fecha"])
print(f"[cargado]  entrenamiento -> {len(entrenamiento):,} filas")


# Replica exacta de los notebooks de analisisComparativo del Lab 1 para que las cifras coincidan.
def metricas(serie):
    pre = serie[(serie.index >= "2009-01-01") & (serie.index < "2020-01-01")]
    anual = pre.groupby(pre.index.year).sum()
    return {
        "estacionalidad_acf12": round(float(acf(pre.diff().dropna(), nlags=12)[12]), 2),
        "crecimiento_2009_2019_pct": round(float((anual.loc[2019] / anual.loc[2009] - 1) * 100)),
        "volatilidad_cv": round(float(pre.std() / pre.mean()), 2),
        "caida_pandemia_pct": round(float((1 - serie[serie.index.year == 2020].min()
                                           / serie[serie.index.year == 2019].mean()) * 100), 1),
    }


def comparar(columna, nombres):
    filas = []
    for nombre in nombres:
        serie = entrenamiento[entrenamiento[columna] == nombre].groupby("Fecha")["Viajero"].sum().asfreq("MS")
        # Los meses de cierre sin registros se rellenan con el minimo observado, igual que en el Lab 1.
        filas.append({"nombre": nombre, "meses_rellenados": int(serie.isna().sum()),
                      **metricas(serie.fillna(serie.min()))})
    afirmar(len(filas) == len(nombres), f"{len(nombres)} series de {columna}")
    for fila in filas:
        print(f"  {fila}")
    return filas


# La recuperación no está en el Lab 1: usa la base completa porque entrenamiento termina en marzo de 2021.
detalle = cargar_detalle()
BASE, ACTUAL = CONFIG["comparativo"]["recuperacion"]["anio_base"], CONFIG["comparativo"]["recuperacion"]["anio_actual"]


def agregar_recuperacion(filas, columna):
    anual = detalle.groupby([columna, "Año"])["Viajero"].sum()
    for fila in filas:
        fila["recuperacion_pct"] = round(float(anual[(fila["nombre"], ACTUAL)] / anual[(fila["nombre"], BASE)] * 100), 1)
        print(f"  {fila['nombre']}: {ACTUAL} = {fila['recuperacion_pct']} % de {BASE}")
    return filas


comparativo = {
    "periodo_normal": "2009-2019",
    "recuperacion": {"anio_base": BASE, "anio_actual": ACTUAL},
    "regiones": agregar_recuperacion(comparar("Región dos", CONFIG["comparativo"]["regiones"]), "Región dos"),
    "fronteras": agregar_recuperacion(comparar("Frontera", CONFIG["comparativo"]["fronteras"]), "Frontera"),
}
guardar_json(comparativo, "comparativo")
