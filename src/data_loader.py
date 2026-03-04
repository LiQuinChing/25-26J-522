"""
Data Loader for MI Detection
Handles loading ECG images, preprocessing, and train/val/test splitting
"""

import os
import numpy as np
import cv2
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.utils import class_weight
import yaml
from tqdm import tqdm


class ECGDataLoader:
    """Load and preprocess ECG images for MI detection"""
    
    def __init__(self, config_path="config.yaml"):
        """
        Initialize data loader with configuration
        
        Args:
            config_path: Path to configuration YAML file
        """
        # Handle relative path from src directory
        if not os.path.isabs(config_path) and not os.path.exists(config_path):
            # Try parent directory
            parent_config = os.path.join(os.path.dirname(os.path.dirname(__file__)), config_path)
            if os.path.exists(parent_config):
                config_path = parent_config
        
        with open(config_path, 'r') as f:
            self.config = yaml.safe_load(f)
        
        self.dataset_root = self.config['data']['dataset_root']
        
        # Resolve dataset_root path relative to config file location
        if not os.path.isabs(self.dataset_root):
            config_dir = os.path.dirname(os.path.abspath(config_path))
            self.dataset_root = os.path.join(config_dir, self.dataset_root)
        
        self.img_height = self.config['image']['img_height']
        self.img_width = self.config['image']['img_width']
        self.channels = self.config['image']['channels']
        self.seed = self.config['training']['seed']
        
        # Class mapping
        self.class_folders = {
            0: "Normal Person ECG Images (859)",
            1: "ECG Images of Patient that have History of MI (203)",
            2: "ECG Images of Myocardial Infarction Patients (77)"
        }
        
        self.class_names = self.config['classes']['class_names']
        
    def load_images_from_folder(self, folder_path, label):
        """
        Load all images from a folder
        
        Args:
            folder_path: Path to image folder
            label: Class label for images
            
        Returns:
            images: List of image arrays
            labels: List of corresponding labels
        """
        images = []
        labels = []
        
        folder = Path(folder_path)
        image_files = list(folder.glob("*.jpg")) + list(folder.glob("*.jpeg")) + list(folder.glob("*.png"))
        
        print(f"Loading {len(image_files)} images from {folder.name}...")
        
        for img_path in tqdm(image_files):
            try:
                # Read image
                img = cv2.imread(str(img_path))
                
                if img is None:
                    print(f"Warning: Could not read {img_path}")
                    continue
                
                # Convert BGR to RGB
                img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
                
                # Resize
                img = cv2.resize(img, (self.img_width, self.img_height))
                
                # Normalize to [0, 1]
                img = img.astype(np.float32) / 255.0
                
                images.append(img)
                labels.append(label)
                
            except Exception as e:
                print(f"Error loading {img_path}: {e}")
                continue
        
        return images, labels
    
    def load_dataset(self):
        """
        Load entire dataset from all class folders
        
        Returns:
            X: Array of images (N, H, W, C)
            y: Array of labels (N,)
        """
        all_images = []
        all_labels = []
        
        print("\n" + "="*50)
        print("Loading ECG Dataset")
        print("="*50)
        
        for label, folder_name in self.class_folders.items():
            folder_path = os.path.join(self.dataset_root, folder_name)
            
            if not os.path.exists(folder_path):
                print(f"Warning: Folder not found - {folder_path}")
                continue
            
            images, labels = self.load_images_from_folder(folder_path, label)
            all_images.extend(images)
            all_labels.extend(labels)
        
        # Convert to numpy arrays
        X = np.array(all_images)
        y = np.array(all_labels)
        
        print("\n" + "="*50)
        print("Dataset Summary")
        print("="*50)
        print(f"Total images: {len(X)}")
        print(f"Image shape: {X[0].shape}")
        
        for i, class_name in enumerate(self.class_names):
            count = np.sum(y == i)
            percentage = (count / len(y)) * 100
            print(f"Class {i} ({class_name}): {count} images ({percentage:.1f}%)")
        
        return X, y
    
    def split_data(self, X, y):
        """
        Split data into train, validation, and test sets
        
        Args:
            X: Image array
            y: Label array
            
        Returns:
            X_train, X_val, X_test, y_train, y_val, y_test
        """
        val_split = self.config['training']['validation_split']
        test_split = self.config['training']['test_split']
        
        # First split: separate test set
        X_temp, X_test, y_temp, y_test = train_test_split(
            X, y, 
            test_size=test_split,
            stratify=y,
            random_state=self.seed
        )
        
        # Second split: separate train and validation
        val_size_adjusted = val_split / (1 - test_split)
        X_train, X_val, y_train, y_val = train_test_split(
            X_temp, y_temp,
            test_size=val_size_adjusted,
            stratify=y_temp,
            random_state=self.seed
        )
        
        print("\n" + "="*50)
        print("Data Split")
        print("="*50)
        print(f"Training set: {len(X_train)} images")
        print(f"Validation set: {len(X_val)} images")
        print(f"Test set: {len(X_test)} images")
        
        # Show class distribution in each set
        for split_name, y_split in [("Train", y_train), ("Val", y_val), ("Test", y_test)]:
            print(f"\n{split_name} set distribution:")
            for i, class_name in enumerate(self.class_names):
                count = np.sum(y_split == i)
                percentage = (count / len(y_split)) * 100
                print(f"  {class_name}: {count} ({percentage:.1f}%)")
        
        return X_train, X_val, X_test, y_train, y_val, y_test
    
    def calculate_class_weights(self, y_train):
        """
        Calculate class weights for imbalanced dataset
        
        Args:
            y_train: Training labels
            
        Returns:
            Dictionary of class weights
        """
        class_weights_array = class_weight.compute_class_weight(
            'balanced',
            classes=np.unique(y_train),
            y=y_train
        )
        
        class_weights_dict = {i: weight for i, weight in enumerate(class_weights_array)}
        
        print("\n" + "="*50)
        print("Calculated Class Weights")
        print("="*50)
        for i, class_name in enumerate(self.class_names):
            print(f"{class_name}: {class_weights_dict[i]:.2f}")
        
        return class_weights_dict
    
    def prepare_data(self):
        """
        Complete data preparation pipeline
        
        Returns:
            Dictionary containing all data splits and metadata
        """
        # Load dataset
        X, y = self.load_dataset()
        
        # Split data
        X_train, X_val, X_test, y_train, y_val, y_test = self.split_data(X, y)
        
        # Calculate class weights
        class_weights = self.calculate_class_weights(y_train)
        
        return {
            'X_train': X_train,
            'X_val': X_val,
            'X_test': X_test,
            'y_train': y_train,
            'y_val': y_val,
            'y_test': y_test,
            'class_weights': class_weights,
            'class_names': self.class_names
        }


if __name__ == "__main__":
    # Test the data loader
    loader = ECGDataLoader()
    data = loader.prepare_data()
    
    print("\n" + "="*50)
    print("Data loading completed successfully!")
    print("="*50)
