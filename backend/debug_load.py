import os
import traceback
from pathlib import Path

p = Path(__file__).with_name("svt_model.keras")
print("exists:", p.exists())
print("path:", p.resolve())

print("\n--- tf.keras (legacy disabled) ---")
os.environ.pop("TF_USE_LEGACY_KERAS", None)
try:
    import tensorflow as tf
    print("tf:", tf.__version__)
    m = tf.keras.models.load_model(str(p), compile=False)

    print("loaded:", type(m))
except Exception as e:
    print("FAILED:", type(e).__name__, e)
    traceback.print_exc(limit=3)


print("\n--- tf.keras (legacy disabled, safe_mode=False) ---")
os.environ.pop("TF_USE_LEGACY_KERAS", None)
try:
    import tensorflow as tf
    print("tf:", tf.__version__)
    m = tf.keras.models.load_model(str(p), compile=False, safe_mode=False)
    print("loaded:", type(m))
except Exception as e:
    print("FAILED:", type(e).__name__, e)
    traceback.print_exc(limit=3)

print("\n--- tf.keras (legacy enabled) ---")
os.environ["TF_USE_LEGACY_KERAS"] = "1"

try:
    import importlib
    import tensorflow as tf
    importlib.reload(tf)
    print("tf:", tf.__version__)
    m = tf.keras.models.load_model(str(p), compile=False)
    print("loaded:", type(m))
except Exception as e:
    print("FAILED:", type(e).__name__, e)
    traceback.print_exc(limit=3)

print("\n--- standalone keras ---")
try:
    import keras
    print("keras:", keras.__version__)
    m = keras.saving.load_model(str(p), compile=False)
    print("loaded:", type(m))
except Exception as e:
    print("FAILED:", type(e).__name__, e)
    traceback.print_exc(limit=3)

print("\n--- standalone keras (safe_mode=False) ---")
try:
    import keras
    print("keras:", keras.__version__)
    m = keras.saving.load_model(str(p), compile=False, safe_mode=False)
    print("loaded:", type(m))
except Exception as e:
    print("FAILED:", type(e).__name__, e)
    traceback.print_exc(limit=3)
