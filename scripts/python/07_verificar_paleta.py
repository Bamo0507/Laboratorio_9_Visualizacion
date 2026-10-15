import matplotlib
import numpy as np

matplotlib.use("Agg")
import matplotlib.pyplot as plt

from comun import CONFIG, RAIZ, afirmar, guardar_json, ruta

paleta = CONFIG["paleta"]

# Matriz de Machado et al. (2009) para simular deuteranopia completa.
DEUTERANOPIA = np.array([[0.367322, 0.860646, -0.227968],
                         [0.280085, 0.672501, 0.047413],
                         [-0.011820, 0.042940, 0.968881]])


def a_lineal(hexadecimal):
    rgb = np.array([int(hexadecimal[i:i + 2], 16) for i in (1, 3, 5)]) / 255
    return np.where(rgb <= 0.04045, rgb / 12.92, ((rgb + 0.055) / 1.055) ** 2.4)


def a_hex(lineal):
    lineal = np.clip(lineal, 0, 1)
    rgb = np.where(lineal <= 0.0031308, lineal * 12.92, 1.055 * lineal ** (1 / 2.4) - 0.055)
    return "#" + "".join(f"{round(v * 255):02X}" for v in rgb)


def luminancia(hexadecimal):
    return float(a_lineal(hexadecimal) @ [0.2126, 0.7152, 0.0722])


def contraste(a, b):
    claro, oscuro = sorted([luminancia(a), luminancia(b)], reverse=True)
    return (claro + 0.05) / (oscuro + 0.05)


def en_grises(hexadecimal):
    return a_hex(np.full(3, luminancia(hexadecimal)))


def con_deuteranopia(hexadecimal):
    return a_hex(DEUTERANOPIA @ a_lineal(hexadecimal))


fondo = paleta["fondo"]
# WCAG: 4.5 para texto normal y 3 para elementos graficos que deben distinguirse.
minimos = {"texto": 4.5, "texto_secundario": 4.5, "acento_texto": 4.5, "principal": 3, "principal_claro": 3, "acento": 3}
contrastes = {}
for nombre, minimo in minimos.items():
    contrastes[nombre] = round(contraste(paleta[nombre], fondo), 2)
    afirmar(contrastes[nombre] >= minimo, f"{nombre} {paleta[nombre]} contraste {contrastes[nombre]} >= {minimo}")

pares = [("principal", "acento"), ("principal", "contexto"), ("acento", "contexto"), ("principal", "principal_claro")]
distinguibles = {}
for a, b in pares:
    en_gris = round(contraste(en_grises(paleta[a]), en_grises(paleta[b])), 2)
    en_deuter = round(contraste(con_deuteranopia(paleta[a]), con_deuteranopia(paleta[b])), 2)
    distinguibles[f"{a}_vs_{b}"] = {"grises": en_gris, "deuteranopia": en_deuter}
    afirmar(en_gris >= 1.5 and en_deuter >= 1.5, f"{a} vs {b} se distinguen (grises {en_gris}, deuteranopia {en_deuter})")

vistas = {"Normal": lambda h: h, "Escala de grises": en_grises, "Deuteranopía": con_deuteranopia}
nombres = list(paleta)
figura, ejes = plt.subplots(1, 3, figsize=(13, 5.5))
for eje, (titulo, transformar) in zip(ejes, vistas.items()):
    for i, nombre in enumerate(nombres):
        eje.add_patch(plt.Rectangle((0, -i), 1, 0.85, color=transformar(paleta[nombre]), ec="#BDBDBD", lw=0.6))
        eje.text(1.15, -i + 0.42, f"{nombre}  {paleta[nombre]}", va="center", fontsize=9)
    eje.set_xlim(0, 4)
    eje.set_ylim(-len(nombres) + 0.8, 1)
    eje.set_title(titulo)
    eje.axis("off")
figura.tight_layout()
destino = ruta("salida_graficos") / "paleta_verificacion.png"
destino.parent.mkdir(parents=True, exist_ok=True)
figura.savefig(destino, dpi=150, bbox_inches="tight")
print(f"[guardado] {destino.relative_to(RAIZ)}")

guardar_json({"contraste_sobre_fondo": contrastes, "pares_distinguibles": distinguibles}, "verificacion_paleta")
