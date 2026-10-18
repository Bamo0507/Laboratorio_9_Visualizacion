from comun import afirmar, cargar_detalle, guardar_json

detalle = cargar_detalle()


def participacion(columna):
    totales = detalle.groupby(columna)["Viajero"].sum().sort_values(ascending=False)
    porcentajes = totales / totales.sum() * 100
    afirmar(abs(porcentajes.sum() - 100) < 1e-6, f"participaciones de {columna} suman 100 %")
    return [
        {"nombre": nombre, "viajeros": round(float(totales[nombre])), "porcentaje": round(float(porcentajes[nombre]), 2),
         "porcentaje_1d": round(float(porcentajes[nombre]), 1)}
        for nombre in totales.index
    ]


vias = participacion("Vía")
fronteras = participacion("Frontera")
# Qué parte de quienes entran por aire lo hace por La Aurora.
aerea = detalle[detalle["Vía"] == "Aérea"].groupby("Frontera")["Viajero"].sum()
aurora_en_aerea = round(float(aerea["01 La Aurora"] / aerea.sum() * 100), 1)
print(f"  La Aurora dentro de la vía aérea: {aurora_en_aerea} %")

for fila in vias + fronteras[:3]:
    print(f"  {fila['nombre']}: {fila['porcentaje']} %")

guardar_json({"base": "Turista + Excursionista, 2009-01 a 2026-06", "vias": vias, "fronteras": fronteras,
              "aurora_en_aerea_pct": aurora_en_aerea},
             "vias_fronteras")
