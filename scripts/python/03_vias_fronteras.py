from comun import afirmar, cargar_detalle, guardar_json

detalle = cargar_detalle()


def participacion(columna):
    totales = detalle.groupby(columna)["Viajero"].sum().sort_values(ascending=False)
    porcentajes = totales / totales.sum() * 100
    afirmar(abs(porcentajes.sum() - 100) < 1e-6, f"participaciones de {columna} suman 100 %")
    return [
        {"nombre": nombre, "viajeros": round(float(totales[nombre])), "porcentaje": round(float(porcentajes[nombre]), 2)}
        for nombre in totales.index
    ]


vias = participacion("Vía")
fronteras = participacion("Frontera")
for fila in vias + fronteras[:3]:
    print(f"  {fila['nombre']}: {fila['porcentaje']} %")

guardar_json({"base": "Turista + Excursionista, 2009-01 a 2026-06", "vias": vias, "fronteras": fronteras},
             "vias_fronteras")
