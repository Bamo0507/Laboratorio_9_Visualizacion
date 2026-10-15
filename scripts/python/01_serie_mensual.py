import pandas as pd

from comun import CONFIG, afirmar, cargar_detalle, guardar_json

detalle = cargar_detalle()
viajeros = detalle.groupby("Fecha")["Viajero"].sum().asfreq("MS")
pandemia = detalle.groupby("Fecha")["pandemia"].first()
afirmar(viajeros.notna().all(), "sin meses faltantes en la serie mensual")

inicio_prueba = pd.Timestamp(CONFIG["serie"]["inicio_prueba"])
registros = [
    {
        "fecha": fecha.strftime("%Y-%m-%d"),
        "viajeros": round(float(valor), 2),
        "conjunto": "prueba" if fecha >= inicio_prueba else "entrenamiento",
        "pandemia": bool(pandemia[fecha]),
    }
    for fecha, valor in viajeros.items()
]

guardar_json({"unidad": "viajeros por mes (Turista + Excursionista)", "datos": registros}, "serie_mensual")
