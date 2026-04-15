"""
Model Architecture for MI Detection
Transfer learning with ResNet50, EfficientNet, or DenseNet
"""

import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, models
from tensorflow.keras.applications import (
    ResNet50, 
    EfficientNetB0, 
    DenseNet121,
    MobileNetV2
)
import yaml


class MIDetectionModel:
    """Build and compile CNN model for MI detection"""
    
    def __init__(self, config_path="config.yaml"):
        """
        Initialize model builder
        
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
        
        self.img_height = self.config['image']['img_height']
        self.img_width = self.config['image']['img_width']
        self.channels = self.config['image']['channels']
        self.num_classes = self.config['classes']['num_classes']
        
        self.backbone = self.config['model']['backbone']
        self.pretrained = self.config['model']['pretrained']
        self.freeze_base = self.config['model']['freeze_base']
        self.dropout_rate = self.config['model']['dropout_rate']
        
        self.learning_rate = self.config['training']['learning_rate']
        
    def get_base_model(self):
        """
        Get pre-trained base model
        
        Returns:
            Base model (ResNet50, EfficientNet, etc.)
        """
        input_shape = (self.img_height, self.img_width, self.channels)
        weights = 'imagenet' if self.pretrained else None
        
        base_models = {
            'ResNet50': ResNet50,
            'EfficientNetB0': EfficientNetB0,
            'DenseNet121': DenseNet121,
            'MobileNetV2': MobileNetV2
        }
        
        if self.backbone not in base_models:
            raise ValueError(f"Unsupported backbone: {self.backbone}. Choose from {list(base_models.keys())}")
        
        print(f"\nBuilding model with {self.backbone} backbone...")
        print(f"Pre-trained weights: {'ImageNet' if self.pretrained else 'None'}")
        print(f"Freeze base: {self.freeze_base}")
        
        base_model = base_models[self.backbone](
            include_top=False,
            weights=weights,
            input_shape=input_shape
        )
        
        # Freeze base model layers if specified
        if self.freeze_base:
            base_model.trainable = False
            print(f"Frozen {len(base_model.layers)} layers in base model")
        else:
            base_model.trainable = True
            print("Base model is trainable")
        
        return base_model
    
    def build_model(self):
        """
        Build complete model with custom classification head
        
        Returns:
            Compiled Keras model
        """
        # Get base model
        base_model = self.get_base_model()
        
        # Build classification head
        inputs = keras.Input(shape=(self.img_height, self.img_width, self.channels))
        
        # Base model
        x = base_model(inputs, training=False if self.freeze_base else True)
        
        # Global pooling
        x = layers.GlobalAveragePooling2D(name='global_avg_pool')(x)
        
        # Dense layers
        x = layers.Dense(512, activation='relu', name='dense_512')(x)
        x = layers.BatchNormalization(name='bn_1')(x)
        x = layers.Dropout(self.dropout_rate, name='dropout_1')(x)
        
        x = layers.Dense(256, activation='relu', name='dense_256')(x)
        x = layers.BatchNormalization(name='bn_2')(x)
        x = layers.Dropout(self.dropout_rate, name='dropout_2')(x)
        
        x = layers.Dense(128, activation='relu', name='dense_128')(x)
        x = layers.Dropout(self.dropout_rate / 2, name='dropout_3')(x)
        
        # Output layer
        outputs = layers.Dense(
            self.num_classes, 
            activation='softmax', 
            name='predictions'
        )(x)
        
        # Create model
        model = models.Model(inputs=inputs, outputs=outputs, name='MI_Detection_Model')
        
        # Print model summary
        print("\n" + "="*50)
        print("Model Architecture")
        print("="*50)
        model.summary()
        
        # Count parameters
        total_params = model.count_params()
        trainable_params = sum([tf.size(w).numpy() for w in model.trainable_weights])
        non_trainable_params = total_params - trainable_params
        
        print("\n" + "="*50)
        print("Model Parameters")
        print("="*50)
        print(f"Total parameters: {total_params:,}")
        print(f"Trainable parameters: {trainable_params:,}")
        print(f"Non-trainable parameters: {non_trainable_params:,}")
        
        return model
    
    def compile_model(self, model, class_weights_dict=None):
        """
        Compile model with optimizer, loss, and metrics
        
        Args:
            model: Keras model
            class_weights_dict: Dictionary of class weights for imbalanced data
            
        Returns:
            Compiled model
        """
        # Optimizer
        optimizer = keras.optimizers.Adam(learning_rate=self.learning_rate)
        
        # Loss function
        if class_weights_dict is not None:
            # Use weighted categorical crossentropy for imbalanced data
            print("\n" + "="*50)
            print("Using Class Weights for Loss Function")
            print("="*50)
            for class_id, weight in class_weights_dict.items():
                print(f"Class {class_id}: weight = {weight:.2f}")
        
        loss = keras.losses.SparseCategoricalCrossentropy()
        
        # Metrics - simplified to avoid shape mismatch issues
        metrics = [
            'accuracy',
            keras.metrics.SparseCategoricalAccuracy(name='sparse_categorical_accuracy')
        ]
        
        # Compile
        model.compile(
            optimizer=optimizer,
            loss=loss,
            metrics=metrics
        )
        
        print("\n" + "="*50)
        print("Model Compiled Successfully")
        print("="*50)
        print(f"Optimizer: Adam (lr={self.learning_rate})")
        print(f"Loss: Sparse Categorical Crossentropy")
        print(f"Metrics: {[m if isinstance(m, str) else m.name for m in metrics]}")
        
        return model
    
    def build_and_compile(self, class_weights_dict=None):
        """
        Build and compile model in one step
        
        Args:
            class_weights_dict: Dictionary of class weights
            
        Returns:
            Compiled Keras model
        """
        model = self.build_model()
        model = self.compile_model(model, class_weights_dict)
        return model
    
    def unfreeze_base_model(self, model, unfreeze_from_layer=None):
        """
        Unfreeze base model layers for fine-tuning
        
        Args:
            model: Compiled model
            unfreeze_from_layer: Layer number to unfreeze from (None = unfreeze all)
            
        Returns:
            Model with unfrozen layers
        """
        # Get the base model (first layer in the functional model)
        base_model = model.layers[1]  # Assuming base model is the second layer
        
        if unfreeze_from_layer is not None:
            # Unfreeze from specific layer
            for layer in base_model.layers[:unfreeze_from_layer]:
                layer.trainable = False
            for layer in base_model.layers[unfreeze_from_layer:]:
                layer.trainable = True
            print(f"\nUnfroze layers from {unfreeze_from_layer} onwards")
        else:
            # Unfreeze all layers
            base_model.trainable = True
            print("\nUnfroze all base model layers")
        
        # Recompile with lower learning rate for fine-tuning
        fine_tune_lr = self.learning_rate / 10
        model.compile(
            optimizer=keras.optimizers.Adam(learning_rate=fine_tune_lr),
            loss=keras.losses.SparseCategoricalCrossentropy(),
            metrics=['accuracy', keras.metrics.Precision(), keras.metrics.Recall(), keras.metrics.AUC()]
        )
        
        print(f"Recompiled model with learning rate: {fine_tune_lr}")
        
        return model


if __name__ == "__main__":
    # Test model building
    print("Testing model builder...")
    
    model_builder = MIDetectionModel()
    model = model_builder.build_and_compile()
    
    print("\n" + "="*50)
    print("Model building test completed!")
    print("="*50)
