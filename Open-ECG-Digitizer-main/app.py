import streamlit as st
import os
import shutil
import subprocess
import pandas as pd
import sys
import base64

# Page Configuration
st.set_page_config(page_title="Open ECG Digitizer", layout="wide")

# --- Custom Background Color ---
st.markdown(
    """
    <style>
    /* Change the main background */
    [data-testid="stAppViewContainer"] {
        background-color: #00d5be;
    }
    
    /* Make the top header transparent so it blends in */
    [data-testid="stHeader"] {
        background-color: rgba(0,0,0,0);
    }

    /* Change the sidebar background to the darker teal */
    [data-testid="stSidebar"] {
        background-color: #0092b8 !important;
    }
    </style>
    """,
    unsafe_allow_html=True
)

# --- Streamlit-Native Auto-Download Hack ---
def trigger_auto_download(file_path, file_name):
    """Triggers a download by injecting an auto-clicking HTML element directly into the main DOM."""
    try:
        with open(file_path, "rb") as f:
            data = f.read()
        b64 = base64.b64encode(data).decode()
        
        # We use st.markdown instead of components.html to avoid the iframe sandbox.
        # The <img> tag deliberately fails, triggering the JS in 'onerror' to click the hidden link.
        safe_id = file_name.replace(".", "_")
        dl_html = f"""
        <a id="dl-{safe_id}" href="data:application/octet-stream;base64,{b64}" download="{file_name}" style="display:none;"></a>
        <img src="dummy.jpg" style="display:none;" onerror="document.getElementById('dl-{safe_id}').click()">
        """
        st.markdown(dl_html, unsafe_allow_html=True)
        
    except Exception as e:
        st.error(f"Auto-download trigger failed: {e}")

st.title("🫀 Open ECG Digitizer Web UI")
st.write("Upload an ECG image to digitize it. The CSV will download automatically upon success.")

# --- 1. Sidebar Configuration ---
st.sidebar.header("Settings")
layout_option = st.sidebar.selectbox(
    "Select ECG Layout",
    ["Standard 3x4", "Standard 6x2"]
)

# Map UI selection to specific config files
config_map = {
    "Standard 3x4": "src/config/inference_wrapper_george-moody-2024.yml",
    "Standard 6x2": "src/config/inference_wrapper_sixbytwo.yml"
}

# --- 2. File Upload ---
uploaded_file = st.file_uploader("Drag and drop or select an ECG image", type=["png", "jpg", "jpeg"])

if uploaded_file is not None:
    input_dir = "input_images"
    output_base_dir = "sandbox/inference_output_web"

    if os.path.exists(input_dir):
        shutil.rmtree(input_dir)
    os.makedirs(input_dir)
    
    if not os.path.exists(input_dir):
        os.makedirs(input_dir)
    
    file_path = os.path.join(input_dir, uploaded_file.name)
    with open(file_path, "wb") as f:
        f.write(uploaded_file.getbuffer())

    custom_success_msg = f"""
    <div style="background-color: #96f7e4; padding: 1rem; border-radius: 0.5rem; color: black; margin-bottom: 1rem;">
        <strong>✅ File '{uploaded_file.name}' is ready to download.</strong>
    </div>
    """
    st.markdown(custom_success_msg, unsafe_allow_html=True)

    # --- 3. Run Conversion ---
    if st.button("Convert & Auto-Download"):
        with st.spinner("Processing... Please wait for the download."):
            # Clean output directory
            if os.path.exists(output_base_dir):
                shutil.rmtree(output_base_dir)
            os.makedirs(output_base_dir)

            selected_config = config_map[layout_option]
            
            # Using sys.executable and env=os.environ.copy() to ensure 'torch' is found
            cmd = [
                sys.executable, "-m", "src.digitize", 
                "--config", selected_config,
                f"DATA.images_path={input_dir}",
                f"DATA.output_path={output_base_dir}"
            ]
            
            result = subprocess.run(
                cmd, 
                capture_output=True, 
                text=True, 
                env=os.environ.copy()
            )

            if result.returncode == 0:
                st.balloons()
                st.header("Conversion Successful")
                
                # Search for the output CSV and processed image
                for root, dirs, files in os.walk(output_base_dir):
                    for file in files:
                        full_path = os.path.join(root, file)
                        
                        # Handle CSV (Auto-Download + Manual Fallback)
                        if file.endswith(".csv"):
                            st.subheader(f"✅ Downloaded: {file}")
                            df = pd.read_csv(full_path)
                            st.dataframe(df.head(10))
                            
                            # 1. Trigger the automatic JS download
                            trigger_auto_download(full_path, file)
                            
                            # 2. Provide a manual fallback button just in case the browser completely blocks the JS
                            with open(full_path, "rb") as f:
                                st.download_button(
                                    label=f"Click here to download  {file}",
                                    data=f,
                                    file_name=file,
                                    mime="text/csv"
                                )
                        
                        # Handle Image Preview
                        if file.endswith((".png", ".jpg")) and ("segmented" in file.lower() or "perspective" in file.lower()):
                            st.subheader(f"Visualization: {file}")
                            st.image(full_path)
            else:
                st.error("Conversion Failed")
                st.text_area("Error Details", result.stderr)