"""
Inference Script for MI Detection
Predict MI from new ECG images with confidence scores
"""

import os
import numpy as np
import cv2
import yaml
import argparse
from pathlib import Path

from tensorflow import keras
import matplotlib.pyplot as plt


class MIPredictor:
    """Predict MI from ECG images"""
    
    def __init__(self, model_path, config_path="config.yaml"):
        """
        Initialize predictor
        
        Args:
            model_path: Path to trained model
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
        
        self.img_height = self.config['image']['img_height']
        self.img_width = self.config['image']['img_width']
        self.class_names = self.config['classes']['class_names']
        
        # Load model
        print(f"Loading model from: {model_path}")
        try:
            self.model = keras.models.load_model(model_path, compile=False)
            # Recompile the model
            self.model.compile(
                optimizer='adam',
                loss='sparse_categorical_crossentropy',
                metrics=['accuracy']
            )
        except Exception as e:
            print(f"Error loading model with compile=False: {e}")
            # Try loading without compile
            self.model = keras.models.load_model(model_path)
        print("Model loaded successfully\n")
    
    def preprocess_image(self, image_path):
        """
        Preprocess single image for prediction
        
        Args:
            image_path: Path to image file
            
        Returns:
            Preprocessed image array
        """
        # Read image
        img = cv2.imread(str(image_path))
        
        if img is None:
            raise ValueError(f"Could not read image: {image_path}")
        
        # Convert BGR to RGB
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        
        # Resize
        img = cv2.resize(img, (self.img_width, self.img_height))
        
        # Normalize
        img = img.astype(np.float32) / 255.0
        
        return img
    
    def predict_single(self, image_path, show_image=False):
        """
        Predict class for a single image
        
        Args:
            image_path: Path to image file
            show_image: Whether to display the image with prediction
            
        Returns:
            Dictionary with prediction results
        """
        # Preprocess
        img = self.preprocess_image(image_path)
        
        # Add batch dimension
        img_batch = np.expand_dims(img, axis=0)
        
        # Predict
        predictions = self.model.predict(img_batch, verbose=0)[0]
        
        # Get predicted class
        predicted_class_idx = np.argmax(predictions)
        predicted_class = self.class_names[predicted_class_idx]
        confidence = predictions[predicted_class_idx]
        
        # Create results dictionary
        results = {
            'image_path': str(image_path),
            'predicted_class': predicted_class,
            'predicted_class_index': int(predicted_class_idx),
            'confidence': float(confidence),
            'all_probabilities': {
                class_name: float(prob) 
                for class_name, prob in zip(self.class_names, predictions)
            }
        }
        
        # Print results
        print("="*70)
        print(f"Image: {Path(image_path).name}")
        print("="*70)
        print(f"Predicted Class: {predicted_class}")
        print(f"Confidence: {confidence:.2%}")
        print("\nAll Class Probabilities:")
        for class_name, prob in results['all_probabilities'].items():
            print(f"  {class_name:<30} {prob:.2%}")
        print("="*70 + "\n")
        
        # Show image if requested
        if show_image:
            self.visualize_prediction(img, results)
        
        return results
    
    def predict_batch(self, image_folder, output_csv=None):
        """
        Predict classes for all images in a folder
        
        Args:
            image_folder: Path to folder containing images
            output_csv: Optional path to save results as CSV
            
        Returns:
            List of prediction results
        """
        image_folder = Path(image_folder)
        
        # Get all image files
        image_extensions = ['.jpg', '.jpeg', '.png', '.bmp']
        image_files = []
        for ext in image_extensions:
            image_files.extend(image_folder.glob(f"*{ext}"))
            image_files.extend(image_folder.glob(f"*{ext.upper()}"))
        
        if len(image_files) == 0:
            print(f"No images found in: {image_folder}")
            return []
        
        print(f"Found {len(image_files)} images in {image_folder}")
        print("\nProcessing images...\n")
        
        # Predict for each image
        all_results = []
        for img_path in image_files:
            try:
                result = self.predict_single(img_path, show_image=False)
                all_results.append(result)
            except Exception as e:
                print(f"Error processing {img_path}: {e}\n")
        
        # Save to CSV if requested
        if output_csv:
            import pandas as pd
            
            # Flatten results for CSV
            csv_data = []
            for result in all_results:
                row = {
                    'image_name': Path(result['image_path']).name,
                    'predicted_class': result['predicted_class'],
                    'confidence': result['confidence']
                }
                # Add individual class probabilities
                for class_name, prob in result['all_probabilities'].items():
                    row[f'prob_{class_name}'] = prob
                csv_data.append(row)
            
            df = pd.DataFrame(csv_data)
            df.to_csv(output_csv, index=False)
            print(f"\nResults saved to: {output_csv}")
        
        # Print summary
        print("\n" + "="*70)
        print("BATCH PREDICTION SUMMARY")
        print("="*70)
        print(f"Total images processed: {len(all_results)}")
        
        # Count predictions per class
        from collections import Counter
        pred_counts = Counter([r['predicted_class'] for r in all_results])
        print("\nPredictions by class:")
        for class_name, count in pred_counts.items():
            percentage = (count / len(all_results)) * 100
            print(f"  {class_name}: {count} ({percentage:.1f}%)")
        
        return all_results
    
    def visualize_prediction(self, image, results):
        """
        Visualize image with prediction
        
        Args:
            image: Image array
            results: Prediction results dictionary
        """
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(15, 5))
        
        # Show image
        ax1.imshow(image)
        ax1.axis('off')
        ax1.set_title(f"Predicted: {results['predicted_class']}\n"
                     f"Confidence: {results['confidence']:.2%}",
                     fontsize=14, fontweight='bold')
        
        # Show probability bar chart
        classes = list(results['all_probabilities'].keys())
        probs = list(results['all_probabilities'].values())
        
        colors = ['green' if i == results['predicted_class_index'] else 'gray' 
                 for i in range(len(classes))]
        
        bars = ax2.barh(classes, probs, color=colors)
        ax2.set_xlabel('Probability', fontsize=12)
        ax2.set_title('Class Probabilities', fontsize=14, fontweight='bold')
        ax2.set_xlim([0, 1])
        
        # Add value labels on bars
        for i, (bar, prob) in enumerate(zip(bars, probs)):
            ax2.text(prob + 0.02, i, f'{prob:.2%}', 
                    va='center', fontsize=10)
        
        plt.tight_layout()
        plt.show()
    
    def predict_with_visualization(self, image_path, save_path=None):
        """
        Predict and save visualization
        
        Args:
            image_path: Path to image
            save_path: Optional path to save visualization
            
        Returns:
            Prediction results
        """
        # Get prediction
        results = self.predict_single(image_path, show_image=False)
        
        # Load and preprocess image
        img = self.preprocess_image(image_path)
        
        # Create visualization
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(15, 5))
        
        # Show image
        ax1.imshow(img)
        ax1.axis('off')
        ax1.set_title(f"Predicted: {results['predicted_class']}\n"
                     f"Confidence: {results['confidence']:.2%}",
                     fontsize=14, fontweight='bold')
        
        # Show probability bar chart
        classes = list(results['all_probabilities'].keys())
        probs = list(results['all_probabilities'].values())
        
        colors = ['green' if i == results['predicted_class_index'] else 'lightblue' 
                 for i in range(len(classes))]
        
        bars = ax2.barh(classes, probs, color=colors)
        ax2.set_xlabel('Probability', fontsize=12)
        ax2.set_title('Class Probabilities', fontsize=14, fontweight='bold')
        ax2.set_xlim([0, 1])
        ax2.grid(axis='x', alpha=0.3)
        
        # Add value labels
        for i, (bar, prob) in enumerate(zip(bars, probs)):
            ax2.text(prob + 0.02, i, f'{prob:.2%}', 
                    va='center', fontsize=10, fontweight='bold')
        
        plt.tight_layout()
        
        # Save or show
        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            print(f"Visualization saved to: {save_path}")
        else:
            plt.show()
        
        plt.close()
        
        return results


def main():
    """Main function for command-line usage"""
    parser = argparse.ArgumentParser(description='MI Detection from ECG Images')
    parser.add_argument('--model', type=str, required=True, help='Path to trained model')
    parser.add_argument('--image', type=str, help='Path to single image')
    parser.add_argument('--folder', type=str, help='Path to folder of images')
    parser.add_argument('--output', type=str, help='Path to save results CSV (for batch prediction)')
    parser.add_argument('--visualize', action='store_true', help='Show visualization')
    parser.add_argument('--save-viz', type=str, help='Path to save visualization image')
    
    args = parser.parse_args()
    
    # Initialize predictor
    predictor = MIPredictor(args.model)
    
    # Single image prediction
    if args.image:
        if args.save_viz:
            predictor.predict_with_visualization(args.image, save_path=args.save_viz)
        else:
            predictor.predict_single(args.image, show_image=args.visualize)
    
    # Batch prediction
    elif args.folder:
        predictor.predict_batch(args.folder, output_csv=args.output)
    
    else:
        print("Please provide either --image or --folder")


if __name__ == "__main__":
    # Example usage
    import sys
    
    if len(sys.argv) > 1:
        main()
    else:
        # Demo mode
        print("MI Detection Predictor - Demo Mode")
        print("\nUsage examples:")
        print("  Single image: python predict.py --model models/best_model.h5 --image path/to/image.jpg --visualize")
        print("  Batch: python predict.py --model models/best_model.h5 --folder path/to/images --output results.csv")
        print("\nFor actual predictions, please provide command-line arguments.")
