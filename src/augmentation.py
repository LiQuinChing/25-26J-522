"""
Data Augmentation for MI Detection
Handles image augmentation to balance classes and improve generalization
"""

import numpy as np
import albumentations as A
from albumentations.pytorch import ToTensorV2
import yaml


class ECGAugmentor:
    """Augmentation pipeline for ECG images"""
    
    def __init__(self, config_path="config.yaml"):
        """
        Initialize augmentor with configuration
        
        Args:
            config_path: Path to configuration YAML file
        """
        # Handle relative path from src directory
        import os
        if not os.path.isabs(config_path) and not os.path.exists(config_path):
            # Try parent directory
            parent_config = os.path.join(os.path.dirname(os.path.dirname(__file__)), config_path)
            if os.path.exists(parent_config):
                config_path = parent_config
        
        with open(config_path, 'r') as f:
            self.config = yaml.safe_load(f)
        
        aug_config = self.config['augmentation']
        
        # Training augmentation pipeline
        self.train_transform = A.Compose([
            A.Rotate(
                limit=aug_config['rotation_limit'],
                p=0.5
            ),
            A.HorizontalFlip(p=0.5 if aug_config['horizontal_flip'] else 0.0),
            A.RandomBrightnessContrast(
                brightness_limit=aug_config['brightness_limit'],
                contrast_limit=aug_config['contrast_limit'],
                p=0.5
            ),
            A.ShiftScaleRotate(
                shift_limit=0.05,
                scale_limit=aug_config['zoom_range'],
                rotate_limit=0,
                p=0.5
            ),
            A.GaussNoise(p=0.3),
            A.GaussianBlur(blur_limit=(3, 5), p=0.2),
        ])
        
        # Validation/test transform (no augmentation, just normalization if needed)
        self.val_transform = None  # Images already normalized in data_loader
    
    def augment_image(self, image):
        """
        Apply augmentation to a single image
        
        Args:
            image: Input image array (H, W, C)
            
        Returns:
            Augmented image
        """
        augmented = self.train_transform(image=image)
        return augmented['image']
    
    def augment_batch(self, images):
        """
        Apply augmentation to a batch of images
        
        Args:
            images: Array of images (N, H, W, C)
            
        Returns:
            Augmented images
        """
        augmented_images = []
        for img in images:
            aug_img = self.augment_image(img)
            augmented_images.append(aug_img)
        
        return np.array(augmented_images)
    
    def oversample_minority_classes(self, X_train, y_train, target_samples=None, balance_ratio=0.3):
        """
        Oversample minority classes to balance dataset
        
        Args:
            X_train: Training images
            y_train: Training labels
            target_samples: Target number of samples per class (default: max class count * balance_ratio)
            balance_ratio: Ratio of max class to target (0.3 = 30% of max class). Lower = less memory
            
        Returns:
            X_balanced, y_balanced: Balanced dataset
        """
        from collections import Counter
        
        # Count samples per class
        class_counts = Counter(y_train)
        print("\n" + "="*50)
        print("Original Class Distribution")
        print("="*50)
        for class_id, count in sorted(class_counts.items()):
            print(f"Class {class_id}: {count} samples")
        
        # Determine target samples - use balance_ratio to reduce memory usage
        if target_samples is None:
            max_count = max(class_counts.values())
            target_samples = int(max_count * balance_ratio)
            print(f"\nTarget samples per class: {target_samples} (ratio={balance_ratio})")
        
        X_balanced = []
        y_balanced = []
        
        for class_id in sorted(class_counts.keys()):
            # Get all samples of this class
            class_indices = np.where(y_train == class_id)[0]
            class_images = X_train[class_indices]
            
            X_balanced.extend(class_images)
            y_balanced.extend([class_id] * len(class_images))
            
            # Calculate how many augmented samples needed
            samples_needed = target_samples - len(class_images)
            
            if samples_needed > 0:
                print(f"\nAugmenting Class {class_id}: generating {samples_needed} samples...")
                
                # Randomly sample and augment
                for _ in range(samples_needed):
                    # Pick a random image from this class
                    idx = np.random.randint(0, len(class_images))
                    img = class_images[idx]
                    
                    # Apply augmentation
                    aug_img = self.augment_image(img)
                    
                    X_balanced.append(aug_img)
                    y_balanced.append(class_id)
        
        X_balanced = np.array(X_balanced)
        y_balanced = np.array(y_balanced)
        
        # Shuffle the balanced dataset
        shuffle_indices = np.random.permutation(len(X_balanced))
        X_balanced = X_balanced[shuffle_indices]
        y_balanced = y_balanced[shuffle_indices]
        
        print("\n" + "="*50)
        print("Balanced Class Distribution")
        print("="*50)
        balanced_counts = Counter(y_balanced)
        for class_id, count in sorted(balanced_counts.items()):
            print(f"Class {class_id}: {count} samples")
        
        print(f"\nTotal training samples: {len(X_balanced)}")
        
        return X_balanced, y_balanced


class DataGenerator:
    """
    Custom data generator for on-the-fly augmentation during training
    """
    
    def __init__(self, X, y, batch_size=32, augmentor=None, shuffle=True):
        """
        Initialize data generator
        
        Args:
            X: Image data
            y: Labels
            batch_size: Batch size
            augmentor: ECGAugmentor instance for augmentation
            shuffle: Whether to shuffle data
        """
        self.X = X
        self.y = y
        self.batch_size = batch_size
        self.augmentor = augmentor
        self.shuffle = shuffle
        self.indices = np.arange(len(self.X))
        
        if self.shuffle:
            np.random.shuffle(self.indices)
    
    def __len__(self):
        """Number of batches per epoch"""
        return int(np.ceil(len(self.X) / self.batch_size))
    
    def __getitem__(self, idx):
        """Generate one batch of data"""
        # Get batch indices
        start_idx = idx * self.batch_size
        end_idx = min((idx + 1) * self.batch_size, len(self.X))
        batch_indices = self.indices[start_idx:end_idx]
        
        # Get batch data
        batch_X = self.X[batch_indices]
        batch_y = self.y[batch_indices]
        
        # Apply augmentation if provided
        if self.augmentor is not None:
            batch_X = self.augmentor.augment_batch(batch_X)
        
        return batch_X, batch_y
    
    def on_epoch_end(self):
        """Shuffle data after each epoch"""
        if self.shuffle:
            np.random.shuffle(self.indices)


if __name__ == "__main__":
    # Test augmentation
    from data_loader import ECGDataLoader
    
    print("Loading data...")
    loader = ECGDataLoader()
    data = loader.prepare_data()
    
    print("\nTesting augmentation...")
    augmentor = ECGAugmentor()
    
    # Test oversampling
    X_balanced, y_balanced = augmentor.oversample_minority_classes(
        data['X_train'], 
        data['y_train']
    )
    
    print("\n" + "="*50)
    print("Augmentation testing completed!")
    print("="*50)
