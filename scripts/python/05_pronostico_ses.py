import warnings

import numpy as np
import pandas as pd
from scipy.stats import norm
from statsmodels.tsa.holtwinters import SimpleExpSmoothing

from comun import CONFIG, afirmar, cargar_serie_mensual, guardar_json

warnings.filterwarnings("ignore")

serie, _ = cargar_serie_mensual()
inicio_prueba = pd.Timestamp(CONFIG["serie"]["inicio_prueba"])
log_entrenamiento = np.log(serie[serie.index < inicio_prueba])
prueba = serie[serie.index >= inicio_prueba]

modelo = SimpleExpSmoothing(log_entrenamiento).fit()
alpha = float(modelo.params["smoothing_level"])
pronostico_log = np.asarray(modelo.forecast(len(prueba)))
pronostico = np.exp(pronostico_log)

mae = float(np.mean(np.abs(prueba.values - pronostico)))
rmse = float(np.sqrt(np.mean((prueba.values - pronostico) ** 2)))
config_pronostico = CONFIG["pronostico"]
afirmar(round(mae) == config_pronostico["mae_lab1"], f"MAE igual al Lab 1 ({round(mae):,})")
afirmar(round(rmse) == config_pronostico["rmse_lab1"], f"RMSE igual al Lab 1 ({round(rmse):,})")

# Intervalo del suavizamiento simple: la incertidumbre crece con cada mes que se aleja del ultimo dato.
# Se calcula en logaritmos y se regresa a viajeros, por eso la banda no es simetrica.
residuos = log_entrenamiento - modelo.fittedvalues
varianza = float(np.mean(residuos ** 2))
horizonte = np.arange(1, len(prueba) + 1)
error_estandar = np.sqrt(varianza * (1 + (horizonte - 1) * alpha ** 2))

intervalos, cobertura = {}, {}
for nivel in config_pronostico["niveles_confianza"]:
    clave = str(round(nivel * 100))
    z = norm.ppf(0.5 + nivel / 2)
    inferior = np.exp(pronostico_log - z * error_estandar)
    superior = np.exp(pronostico_log + z * error_estandar)
    intervalos[clave] = (inferior, superior)
    cobertura[clave] = round(float(np.mean((prueba.values >= inferior) & (prueba.values <= superior))) * 100, 1)

print(f"  alpha={alpha:.4f}  pronostico mensual={pronostico[0]:,.0f}")
print(f"  meses reales dentro del intervalo: {cobertura}")

nivel_banda = str(round(config_pronostico["nivel_banda_grafico"] * 100))
tope = config_pronostico["tope_eje_grafico"]
afirmar(tope > serie.max(), f"el tope del eje ({tope:,}) no recorta ningun dato real")
superior_banda = intervalos[nivel_banda][1]
recortados = prueba.index[superior_banda > tope]
recorte = {
    "nivel": nivel_banda,
    "tope_eje": tope,
    "primer_mes_recortado": recortados.min().strftime("%Y-%m") if len(recortados) else None,
    "meses_recortados": int(len(recortados)),
    "superior_final": round(float(superior_banda[-1])),
    "fecha_final": prueba.index.max().strftime("%Y-%m"),
}
print(f"  recorte de la banda {nivel_banda} %: {recorte}")

registros = []
for i, fecha in enumerate(prueba.index):
    fila = {"fecha": fecha.strftime("%Y-%m-%d"), "real": round(float(prueba.iloc[i])), "estimacion": round(float(pronostico[i]))}
    for clave, (inferior, superior) in intervalos.items():
        fila[f"inferior_{clave}"] = round(float(inferior[i]))
        fila[f"superior_{clave}"] = round(float(superior[i]))
    registros.append(fila)

guardar_json({
    "modelo": "Suavizamiento exponencial simple (sobre log de viajeros)",
    "entrenamiento": {"desde": log_entrenamiento.index.min().strftime("%Y-%m"),
                      "hasta": log_entrenamiento.index.max().strftime("%Y-%m")},
    "alpha": round(alpha, 4),
    "metricas": {"mae": round(mae), "rmse": round(rmse)},
    "cobertura_pct": cobertura,
    "recorte_grafico": recorte,
    "datos": registros,
}, "pronostico_ses")
