"""
Run this script from the khetai/ folder:
    python convert_model.py
"""
import subprocess
import sys
import os

# Step 1: Install only what we need — no heavy deps
print("Installing tensorflowjs (lightweight install)...")
subprocess.run([
    sys.executable, '-m', 'pip', 'install',
    'tensorflowjs==4.4.0',     # older stable version, fewer conflicts
    '--no-deps',               # <-- KEY: skip all dependency resolution hell
    '-q'
], check=True)

# Also need these two minimal deps
subprocess.run([
    sys.executable, '-m', 'pip', 'install',
    'tensorflow==2.13.0',
    'keras==2.13.1',
    '-q'
], check=False)  # may already be installed

print("Done installing.")

# Step 2: Convert
import tensorflow as tf
import tensorflowjs as tfjs

print(f"TF version: {tf.__version__}")
print("Loading model...")

model = tf.keras.models.load_model('plant_disease_model.keras')
print("Model loaded successfully!")
print(f"Input shape: {model.input_shape}")

# Step 3: Save as SavedModel first (avoids the InputLayer bug)
print("Exporting as SavedModel...")
tf.saved_model.save(model, 'plant_savedmodel')
print("SavedModel exported!")

# Step 4: Convert SavedModel → TF.js
print("Converting to TF.js format...")
os.makedirs('tfjs_model_fixed', exist_ok=True)

tfjs.converters.convert_tf_saved_model(
    'plant_savedmodel',
    'tfjs_model_fixed',
)
print("\n✅ Conversion complete!")
print("Files in tfjs_model_fixed/:")
for f in os.listdir('tfjs_model_fixed'):
    size = os.path.getsize(f'tfjs_model_fixed/{f}') / 1024 / 1024
    print(f"  {f}  ({size:.1f} MB)")

print("\n📋 Next step:")
print("Copy all files from tfjs_model_fixed/ into frontend/public/tfjs_model/")