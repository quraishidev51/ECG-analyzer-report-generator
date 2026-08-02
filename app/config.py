from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = BASE_DIR / "models" / "best_model.keras"
CLASS_NAMES = [
    "Conduction Disturbance",
    "Hypertrophy",
    "Myocardial Infarction",
    "Normal",
    "ST/T Change"
]
DEFAULT_THRESHOLD = 0.5
# ------------------------------------------------------------------
# Build the model path relative to the project folder.
#
# __file__  -> current file (app/config.py)
# .parent   -> app/
# .parent   -> project root/
#
# This avoids hardcoding paths like:
#   /content/drive/... (Colab)
#   D:\...             (Windows)
#
# The code works on Windows, Linux, macOS, and cloud servers
# as long as the model is inside the project's "models" folder.
# ------------------------------------------------------------------