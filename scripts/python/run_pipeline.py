import subprocess
import sys
from pathlib import Path

ETAPAS = [
    "01_serie_mensual.py",
    "02_kpis.py",
    "03_vias_fronteras.py",
    "04_estacionalidad.py",
    "05_pronostico_ses.py",
    "06_comparativo.py",
    "07_verificar_paleta.py",
]

carpeta = Path(__file__).resolve().parent
for etapa in ETAPAS:
    print(f"\n{'=' * 60}\n{etapa}\n{'=' * 60}", flush=True)
    if subprocess.run([sys.executable, carpeta / etapa], cwd=carpeta).returncode != 0:
        print(f"\n[FALLO] el pipeline se detuvo en {etapa}")
        sys.exit(1)
print("\n[ok] pipeline completo")
