import json
import sys
from pathlib import Path

import pandas as pd

RAIZ = Path(__file__).resolve().parents[2]
CONFIG = json.loads((RAIZ / "config.json").read_text(encoding="utf-8"))
MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]


def ruta(clave):
    return RAIZ / CONFIG["rutas"][clave]


def afirmar(condicion, mensaje):
    if condicion:
        print(f"[ok]       {mensaje}")
    else:
        print(f"[FALLO]    {mensaje}")
        sys.exit(1)


def cargar_detalle():
    entrenamiento = pd.read_csv(ruta("entrenamiento"), parse_dates=["Fecha"])
    prueba = pd.read_csv(ruta("prueba"), parse_dates=["Fecha"])
    detalle = pd.concat([entrenamiento, prueba], ignore_index=True)
    print(f"[cargado]  entrenamiento + prueba -> {len(detalle):,} filas")
    afirmar(set(detalle["Tipo de Viajero"]) == set(CONFIG["serie"]["tipos_viajero"]),
            "solo Turista + Excursionista")
    afirmar(detalle["Fecha"].nunique() == CONFIG["serie"]["meses_esperados"],
            f"{CONFIG['serie']['meses_esperados']} meses distintos")
    return detalle


def guardar_json(datos, nombre):
    destino = ruta("salida_datos") / f"{nombre}.json"
    destino.parent.mkdir(parents=True, exist_ok=True)
    destino.write_text(json.dumps(datos, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[guardado] {destino.relative_to(RAIZ)}")


def cargar_json(nombre):
    destino = ruta("salida_datos") / f"{nombre}.json"
    print(f"[cargado]  {destino.relative_to(RAIZ)}")
    return json.loads(destino.read_text(encoding="utf-8"))


def cargar_serie_mensual():
    registros = cargar_json("serie_mensual")["datos"]
    serie = pd.Series({pd.Timestamp(r["fecha"]): r["viajeros"] for r in registros}).asfreq("MS")
    afirmar(len(serie) == CONFIG["serie"]["meses_esperados"] and serie.notna().all(),
            "serie mensual completa y sin huecos")
    return serie, registros
