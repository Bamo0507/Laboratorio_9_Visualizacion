from comun import MESES, cargar_serie_mensual, guardar_json

serie, registros = cargar_serie_mensual()

anual = serie.groupby(serie.index.year).agg(["sum", "count"])
completos = anual[anual["count"] == 12]["sum"]
anio_inicial, anio_reciente = completos.index.min(), completos.index.max()
anio_pico = completos.idxmax()

meses_pandemia = [r["fecha"] for r in registros if r["pandemia"]]
inicio_pandemia = serie[meses_pandemia].index.min()
mes_minimo = serie[meses_pandemia].idxmin()
promedio_previo = serie[str(inicio_pandemia.year - 1)].mean()

ultimo_mes = serie.index.max()
semestre_actual = serie[f"{ultimo_mes.year}-01":ultimo_mes]
semestre_anterior = serie[f"{ultimo_mes.year - 1}-01":f"{ultimo_mes.year - 1}-{ultimo_mes.month:02d}"]


def porcentaje(valor):
    return round(float(valor) * 100, 1)


kpis = {
    "total_acumulado": {"desde": serie.index.min().strftime("%Y-%m"), "hasta": ultimo_mes.strftime("%Y-%m"),
                        "viajeros": round(float(serie.sum()))},
    "anio_pico": {"anio": int(anio_pico), "viajeros": round(float(completos[anio_pico]))},
    "crecimiento_hasta_pico_pct": {"desde": int(anio_inicial), "hasta": int(anio_pico),
                                   "valor": porcentaje(completos[anio_pico] / completos[anio_inicial] - 1)},
    "mes_pico": {"fecha": serie.idxmax().strftime("%Y-%m"), "viajeros": round(float(serie.max()))},
    "mes_minimo_pandemia": {"fecha": mes_minimo.strftime("%Y-%m"), "viajeros": round(float(serie[mes_minimo]))},
    # Misma formula que el comparativo del Lab 1: peor mes de pandemia contra el promedio mensual del anio previo.
    "caida_pandemia_pct": porcentaje(1 - serie[mes_minimo] / promedio_previo),
    "recuperacion_vs_pico_pct": {"anio": int(anio_reciente),
                                 "valor": porcentaje(completos[anio_reciente] / completos[anio_pico])},
    "variacion_interanual_parcial_pct": {"periodo": f"ene-{MESES[ultimo_mes.month - 1]} {ultimo_mes.year} vs {ultimo_mes.year - 1}",
                                         "valor": porcentaje(semestre_actual.sum() / semestre_anterior.sum() - 1)},
}

totales_anuales = [
    {"anio": int(anio), "viajeros": round(float(fila["sum"])), "meses": int(fila["count"]), "parcial": bool(fila["count"] < 12)}
    for anio, fila in anual.iterrows()
]

for nombre, valor in kpis.items():
    print(f"  {nombre}: {valor}")
guardar_json(kpis, "kpis")
guardar_json({"unidad": "viajeros por anio (Turista + Excursionista)", "datos": totales_anuales}, "totales_anuales")
