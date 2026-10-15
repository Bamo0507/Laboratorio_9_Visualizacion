from comun import CONFIG, MESES, afirmar, cargar_serie_mensual, guardar_json

serie, _ = cargar_serie_mensual()


def perfil(desde, hasta):
    tramo = serie[str(desde):str(hasta)]
    afirmar(len(tramo) == (hasta - desde + 1) * 12, f"{desde}-{hasta} con anios completos")
    promedio_mes = tramo.groupby(tramo.index.month).mean()
    # Indice 100 = mes promedio del periodo; 129 significa 29 % mas viajeros que un mes tipico.
    indice = promedio_mes / promedio_mes.mean() * 100
    return promedio_mes, indice


periodos = {nombre: perfil(*anios) for nombre, anios in CONFIG["estacionalidad"].items()}

registros = []
for mes in range(1, 13):
    fila = {"mes": mes, "nombre": MESES[mes - 1]}
    for nombre, (promedio_mes, indice) in periodos.items():
        fila[nombre] = {"promedio": round(float(promedio_mes[mes])), "indice": round(float(indice[mes]), 1)}
    registros.append(fila)
    print(f"  {fila['nombre']}: " + "  ".join(f"{n}={fila[n]['indice']}" for n in periodos))

guardar_json({"periodos": CONFIG["estacionalidad"], "base_indice": "promedio mensual del periodo = 100",
              "datos": registros}, "estacionalidad")
