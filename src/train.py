"""
Training Pipeline for MI Detection Model
Handles complete training workflow with callbacks and monitoring
"""

import os
import numpy as np
import yaml
import json
from datetime import datetime
import matplotlib.pyplot as plt

import tensorflow as tf
from tensorflow import keras

from data_loader import ECGDataLoader
from augmentation import ECGAugmentor
from model import MIDetectionModel


class ModelTrainer:
    """Train MI detection model with monitoring and callbacks"""
    
    def __init__(self, config_path="config.yaml"):
        """
        Initialize trainer
        
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
        
        self.batch_size = self.config['training']['batch_size']
        self.epochs = self.config['training']['epochs']
        self.model_dir = self.config['data']['model_dir']
        self.output_dir = self.config['data']['output_dir']
        
        # Resolve relative paths relative to config file location
        config_dir = os.path.dirname(os.path.abspath(config_path))
        if not os.path.isabs(self.model_dir):
            self.model_dir = os.path.join(config_dir, self.model_dir)
        if not os.path.isabs(self.output_dir):
            self.output_dir = os.path.join(config_dir, self.output_dir)
        
        # Create directories
        os.makedirs(self.model_dir, exist_ok=True)
        os.makedirs(self.output_dir, exist_ok=True)
        
        # Initialize components
        self.data_loader = ECGDataLoader(config_path)
        self.augmentor = ECGAugmentor(config_path)
        self.model_builder = MIDetectionModel(config_path)
        
        self.history = None
        self.model = None
        
    def setup_callbacks(self):
        """
        Setup training callbacks
        
        Returns:
            List of Keras callbacks
        """
        callbacks = []
        
        # Model checkpoint - save best model
        checkpoint_path = os.path.join(self.model_dir, 'best_model.h5')
        checkpoint = keras.callbacks.ModelCheckpoint(
            checkpoint_path,
            monitor='val_accuracy',
            save_best_only=True,
            mode='max',
            verbose=1
        )
        callbacks.append(checkpoint)
        
        # Early stopping
        early_stop = keras.callbacks.EarlyStopping(
            monitor='val_loss',
            patience=self.config['callbacks']['early_stopping']['patience'],
            restore_best_weights=True,
            verbose=1
        )
        callbacks.append(early_stop)
        
        # Reduce learning rate on plateau
        reduce_lr = keras.callbacks.ReduceLROnPlateau(
            monitor='val_loss',
            factor=self.config['callbacks']['reduce_lr']['factor'],
            patience=self.config['callbacks']['reduce_lr']['patience'],
            min_lr=self.config['callbacks']['reduce_lr']['min_lr'],
            verbose=1
        )
        callbacks.append(reduce_lr)
        
        # TensorBoard logging (disabled histograms to save memory)
        log_dir = os.path.join(self.output_dir, 'logs', datetime.now().strftime("%Y%m%d-%H%M%S"))
        tensorboard = keras.callbacks.TensorBoard(
            log_dir=log_dir,
            histogram_freq=0,  # Disabled to save memory
            write_graph=False  # Disabled to save memory
        )
        callbacks.append(tensorboard)
        
        # CSV logger
        csv_path = os.path.join(self.output_dir, 'training_log.csv')
        csv_logger = keras.callbacks.CSVLogger(csv_path)
        callbacks.append(csv_logger)
        
        print("\n" + "="*50)
        print("Callbacks Configured")
        print("="*50)
        print(f"Model checkpoint: {checkpoint_path}")
        print(f"TensorBoard logs: {log_dir}")
        print(f"CSV log: {csv_path}")
        print(f"Early stopping patience: {self.config['callbacks']['early_stopping']['patience']}")
        print(f"Reduce LR patience: {self.config['callbacks']['reduce_lr']['patience']}")
        
        return callbacks
    
    def train(self, use_augmentation=True, balance_classes=True):
        """
        Complete training pipeline
        
        Args:
            use_augmentation: Whether to use data augmentation
            balance_classes: Whether to oversample minority classes
            
        Returns:
            Training history
        """
        print("\n" + "="*70)
        print(" " * 15 + "TRAINING MI DETECTION MODEL")
        print("="*70)
        
        # Load data
        print("\n[STEP 1/6] Loading dataset...")
        data = self.data_loader.prepare_data()
        
        X_train = data['X_train']
        y_train = data['y_train']
        X_val = data['X_val']
        y_val = data['y_val']
        X_test = data['X_test']
        y_test = data['y_test']
        class_weights = data['class_weights']
        
        # Balance classes if requested
        if balance_classes:
            print("\n[STEP 2/6] Balancing classes with augmentation...")
            X_train, y_train = self.augmentor.oversample_minority_classes(X_train, y_train)
        else:
            print("\n[STEP 2/6] Skipping class balancing...")
        
        # Build model
        print("\n[STEP 3/6] Building model...")
        self.model = self.model_builder.build_and_compile(class_weights_dict=class_weights)
        
        # Setup callbacks
        print("\n[STEP 4/6] Setting up callbacks...")
        callbacks = self.setup_callbacks()
        
        # Train model
        print("\n[STEP 5/6] Starting training...")
        print("="*70)
        
        self.history = self.model.fit(
            X_train, y_train,
            batch_size=self.batch_size,
            epochs=self.epochs,
            validation_data=(X_val, y_val),
            class_weight=class_weights if not balance_classes else None,
            callbacks=callbacks,
            verbose=1
        )
        
        # Save final model
        print("\n[STEP 6/6] Saving final model...")
        final_model_path = os.path.join(self.model_dir, 'final_model.h5')
        self.model.save(final_model_path)
        print(f"Final model saved to: {final_model_path}")
        
        # Save training history
        history_path = os.path.join(self.output_dir, 'training_history.json')
        with open(history_path, 'w') as f:
            # Convert numpy types to Python types for JSON serialization
            history_dict = {k: [float(v) for v in vals] for k, vals in self.history.history.items()}
            json.dump(history_dict, f, indent=2)
        print(f"Training history saved to: {history_path}")
        
        # Plot training curves
        self.plot_training_history()
        
        # Evaluate on test set
        print("\n" + "="*70)
        print("Evaluating on test set...")
        test_results = self.model.evaluate(X_test, y_test, verbose=1)
        
        print("\n" + "="*70)
        print("TEST SET RESULTS")
        print("="*70)
        metric_names = self.model.metrics_names
        for name, value in zip(metric_names, test_results):
            print(f"{name}: {value:.4f}")
        
        # Save test results
        test_results_dict = {name: float(value) for name, value in zip(metric_names, test_results)}
        results_path = os.path.join(self.output_dir, 'test_results.json')
        with open(results_path, 'w') as f:
            json.dump(test_results_dict, f, indent=2)
        
        print("\n" + "="*70)
        print(" " * 20 + "TRAINING COMPLETED!")
        print("="*70)
        
        return self.history
    
    def plot_training_history(self):
        """Plot and save training curves"""
        if self.history is None:
            print("No training history available")
            return
        
        history = self.history.history
        
        # Create figure with subplots
        fig, axes = plt.subplots(2, 2, figsize=(15, 12))
        
        # Plot accuracy
        axes[0, 0].plot(history['accuracy'], label='Train Accuracy', linewidth=2)
        axes[0, 0].plot(history['val_accuracy'], label='Val Accuracy', linewidth=2)
        axes[0, 0].set_title('Model Accuracy', fontsize=14, fontweight='bold')
        axes[0, 0].set_xlabel('Epoch')
        axes[0, 0].set_ylabel('Accuracy')
        axes[0, 0].legend()
        axes[0, 0].grid(True, alpha=0.3)
        
        # Plot loss
        axes[0, 1].plot(history['loss'], label='Train Loss', linewidth=2)
        axes[0, 1].plot(history['val_loss'], label='Val Loss', linewidth=2)
        axes[0, 1].set_title('Model Loss', fontsize=14, fontweight='bold')
        axes[0, 1].set_xlabel('Epoch')
        axes[0, 1].set_ylabel('Loss')
        axes[0, 1].legend()
        axes[0, 1].grid(True, alpha=0.3)
        
        # Plot precision
        if 'precision' in history:
            axes[1, 0].plot(history['precision'], label='Train Precision', linewidth=2)
            axes[1, 0].plot(history['val_precision'], label='Val Precision', linewidth=2)
            axes[1, 0].set_title('Model Precision', fontsize=14, fontweight='bold')
            axes[1, 0].set_xlabel('Epoch')
            axes[1, 0].set_ylabel('Precision')
            axes[1, 0].legend()
            axes[1, 0].grid(True, alpha=0.3)
        
        # Plot recall
        if 'recall' in history:
            axes[1, 1].plot(history['recall'], label='Train Recall', linewidth=2)
            axes[1, 1].plot(history['val_recall'], label='Val Recall', linewidth=2)
            axes[1, 1].set_title('Model Recall', fontsize=14, fontweight='bold')
            axes[1, 1].set_xlabel('Epoch')
            axes[1, 1].set_ylabel('Recall')
            axes[1, 1].legend()
            axes[1, 1].grid(True, alpha=0.3)
        
        plt.tight_layout()
        
        # Save plot
        plot_path = os.path.join(self.output_dir, 'training_curves.png')
        plt.savefig(plot_path, dpi=300, bbox_inches='tight')
        print(f"\nTraining curves saved to: {plot_path}")
        
        plt.close()


if __name__ == "__main__":
    # Train the model
    print("Initializing training pipeline...")
    
    trainer = ModelTrainer()
    
    # Start training
    history = trainer.train(
        use_augmentation=True,
        balance_classes=True
    )
    
    print("\nTraining script completed successfully!")
