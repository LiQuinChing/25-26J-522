"""
Training script with WMI workaround for Windows
Fixes the Windows WMI error that prevents TensorFlow/h5py from loading
"""
import os
import sys

# Set environment variables before any imports
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'

# Comprehensive patch for platform module to avoid WMI errors
import platform
from collections import namedtuple

# Patch _wmi_query to prevent WMI calls entirely
def patched_wmi_query(*args, **kwargs):
    """Prevent WMI calls that cause errors on Windows"""
    raise OSError("not supported")

# Store originals
original_uname = platform.uname
original_win32_ver = platform.win32_ver
original_wmi_query = getattr(platform, '_wmi_query', None)

# Apply WMI patch first
if original_wmi_query:
    platform._wmi_query = patched_wmi_query

# Create fake results
uname_result = namedtuple("uname_result", "system node release version machine")
fake_uname = uname_result(
    system='Windows',
    node='localhost', 
    release='10',
    version='10.0.19045',
    machine='AMD64'
)

def patched_uname():
    """Return fake uname to avoid WMI calls"""
    try:
        return original_uname()
    except (OSError, Exception):
        return fake_uname

def patched_win32_ver(release='', version='', csd='', ptype=''):
    """Return fake Windows version to avoid WMI calls"""
    try:
        return original_win32_ver(release, version, csd, ptype)
    except (OSError, Exception):
        return ('10', '10.0.19045', '', 'Multiprocessor Free')

# Apply patches
platform.uname = patched_uname
platform.win32_ver = patched_win32_ver

# Now safely import the training module
print("Loading training modules...")
from train import ModelTrainer

if __name__ == "__main__":
    print("Initializing training pipeline...")
    
    trainer = ModelTrainer()
    
    # Start training
    history = trainer.train(
        use_augmentation=True,
        balance_classes=True
    )
    
    print("\nTraining script completed successfully!")

