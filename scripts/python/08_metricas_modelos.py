import json

from comun import CONFIG, RAIZ, afirmar, cargar_json, guardar_json, ruta

NOMBRES = {
    "Suav. exp. simple": "Suavizamiento exponencial simple",
    "Holt-Winters": "Holt-Winters",
    "Seasonal naive": "Seasonal naive",
    "SARIMA (Modelo 1)": "SARIMA (versión 1)",
    "SARIMA (Modelo 2)": "SARIMA (versión 2)",
    "Prophet": "Prophet",
}

notebook = json.loads(ruta("notebook_mensual").read_text(encoding="utf-8"))
print(f"[cargado]  {ruta('notebook_mensual').relative_to(RAIZ)}")

# La tabla final de errores del Lab 1 es la celda que construye tabla_errores_total; se lee su salida impresa.
celda = next(c for c in notebook["cells"] if c["cell_type"] == "code" and "tabla_errores_total = " in "".join(c["source"]))
tabla = "".join(celda["outputs"][0]["data"]["text/plain"]).splitlines()[1:]

modelos = []
for linea in tabla:
    *nombre, mae, rmse = linea.split()
    nombre = " ".join(nombre)
    modelos.append({"modelo": NOMBRES[nombre], "nombre_lab1": nombre, "mae": round(float(mae)), "rmse": round(float(rmse))})

afirmar(len(modelos) == 6, "seis modelos en la tabla del Lab 1")
ses = cargar_json("pronostico_ses")["metricas"]
afirmar(modelos[0]["mae"] == ses["mae"] and modelos[0]["rmse"] == ses["rmse"],
        "el mejor modelo coincide con el SES recalculado en la etapa 05")
for m in modelos:
    print(f"  {m['modelo']}: MAE={m['mae']:,} RMSE={m['rmse']:,}")

guardar_json({"serie": "Total mensual (Turista + Excursionista)", "evaluacion": "abril 2021 a junio 2026",
              "datos": sorted(modelos, key=lambda m: m["mae"])}, "metricas_modelos")
