"""
Evaluation and Metrics for MI Detection Model
Comprehensive evaluation with confusion matrix, classification report, and ROC curves
"""

import os
import numpy as np
import matplotlib.pyplot as plt
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    roc_curve,
    auc,
    roc_auc_score
)
import yaml
import json

from tensorflow import keras
from data_loader import ECGDataLoader


class ModelEvaluator:
    """Evaluate trained MI detection model"""
    
    def __init__(self, config_path="config.yaml"):
        """
        Initialize evaluator
        
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
        
        self.class_names = self.config['classes']['class_names']
        self.output_dir = self.config['data']['output_dir']
        
        # Resolve relative path relative to config file location
        if not os.path.isabs(self.output_dir):
            config_dir = os.path.dirname(os.path.abspath(config_path))
            self.output_dir = os.path.join(config_dir, self.output_dir)
        
        os.makedirs(self.output_dir, exist_ok=True)
    
    def load_model(self, model_path):
        """
        Load trained model
        
        Args:
            model_path: Path to saved model
            
        Returns:
            Loaded Keras model
        """
        print(f"\nLoading model from: {model_path}")
        model = keras.models.load_model(model_path)
        print("Model loaded successfully")
        return model
    
    def evaluate_model(self, model, X_test, y_test):
        """
        Comprehensive model evaluation
        
        Args:
            model: Trained Keras model
            X_test: Test images
            y_test: Test labels
            
        Returns:
            Dictionary containing all evaluation metrics
        """
        print("\n" + "="*70)
        print(" " * 20 + "MODEL EVALUATION")
        print("="*70)
        
        # Get predictions
        print("\nGenerating predictions...")
        y_pred_probs = model.predict(X_test, verbose=1)
        y_pred = np.argmax(y_pred_probs, axis=1)
        
        # Calculate metrics
        results = {}
        
        # 1. Confusion Matrix
        print("\n[1/5] Computing confusion matrix...")
        cm = confusion_matrix(y_test, y_pred)
        results['confusion_matrix'] = cm.tolist()
        
        # 2. Classification Report
        print("[2/5] Generating classification report...")
        report = classification_report(
            y_test, y_pred,
            target_names=self.class_names,
            output_dict=True,
            zero_division=0
        )
        results['classification_report'] = report
        
        # 3. Per-class metrics
        print("[3/5] Calculating per-class metrics...")
        per_class_metrics = {}
        for i, class_name in enumerate(self.class_names):
            class_mask = y_test == i
            if class_mask.sum() > 0:
                class_acc = (y_pred[class_mask] == i).mean()
                per_class_metrics[class_name] = {
                    'accuracy': float(class_acc),
                    'samples': int(class_mask.sum())
                }
        results['per_class_metrics'] = per_class_metrics
        
        # 4. ROC-AUC scores
        print("[4/5] Computing ROC-AUC scores...")
        try:
            # One-vs-Rest ROC-AUC
            from sklearn.preprocessing import label_binarize
            y_test_bin = label_binarize(y_test, classes=range(len(self.class_names)))
            
            roc_auc_scores = {}
            for i, class_name in enumerate(self.class_names):
                if len(np.unique(y_test)) > 1:  # Need at least 2 classes
                    fpr, tpr, _ = roc_curve(y_test_bin[:, i], y_pred_probs[:, i])
                    roc_auc_scores[class_name] = float(auc(fpr, tpr))
            
            # Macro and micro average
            if len(np.unique(y_test)) > 1:
                roc_auc_scores['macro'] = float(roc_auc_score(y_test_bin, y_pred_probs, average='macro'))
                roc_auc_scores['micro'] = float(roc_auc_score(y_test_bin, y_pred_probs, average='micro'))
            
            results['roc_auc_scores'] = roc_auc_scores
        except Exception as e:
            print(f"Warning: Could not compute ROC-AUC scores: {e}")
            results['roc_auc_scores'] = {}
        
        # 5. Overall accuracy
        print("[5/5] Computing overall metrics...")
        overall_accuracy = float((y_pred == y_test).mean())
        results['overall_accuracy'] = overall_accuracy
        
        # Print results
        self.print_results(results)
        
        # Save results
        results_path = os.path.join(self.output_dir, 'evaluation_results.json')
        with open(results_path, 'w') as f:
            json.dump(results, f, indent=2)
        print(f"\nResults saved to: {results_path}")
        
        return results, y_pred, y_pred_probs
    
    def print_results(self, results):
        """Print evaluation results"""
        print("\n" + "="*70)
        print("EVALUATION RESULTS")
        print("="*70)
        
        print(f"\nOverall Accuracy: {results['overall_accuracy']:.4f}")
        
        print("\n" + "-"*70)
        print("PER-CLASS METRICS")
        print("-"*70)
        report = results['classification_report']
        
        print(f"\n{'Class':<25} {'Precision':<12} {'Recall':<12} {'F1-Score':<12} {'Support':<10}")
        print("-"*70)
        for class_name in self.class_names:
            if class_name in report:
                metrics = report[class_name]
                print(f"{class_name:<25} {metrics['precision']:<12.4f} {metrics['recall']:<12.4f} "
                      f"{metrics['f1-score']:<12.4f} {int(metrics['support']):<10}")
        
        print("-"*70)
        print(f"{'Macro Avg':<25} {report['macro avg']['precision']:<12.4f} "
              f"{report['macro avg']['recall']:<12.4f} {report['macro avg']['f1-score']:<12.4f}")
        print(f"{'Weighted Avg':<25} {report['weighted avg']['precision']:<12.4f} "
              f"{report['weighted avg']['recall']:<12.4f} {report['weighted avg']['f1-score']:<12.4f}")
        
        if 'roc_auc_scores' in results and results['roc_auc_scores']:
            print("\n" + "-"*70)
            print("ROC-AUC SCORES")
            print("-"*70)
            for class_name, score in results['roc_auc_scores'].items():
                print(f"{class_name:<25} {score:.4f}")
    
    def plot_confusion_matrix(self, cm, y_test, y_pred):
        """
        Plot confusion matrix
        
        Args:
            cm: Confusion matrix
            y_test: True labels
            y_pred: Predicted labels
        """
        plt.figure(figsize=(10, 8))
        
        # Convert to numpy array if needed
        cm = np.array(cm)
        
        # Normalize confusion matrix
        cm_normalized = cm.astype('float') / cm.sum(axis=1)[:, np.newaxis]
        
        # Plot with matplotlib
        im = plt.imshow(cm_normalized, interpolation='nearest', cmap='Blues')
        plt.colorbar(im, label='Percentage')
        
        # Add annotations
        thresh = cm_normalized.max() / 2.
        for i in range(cm_normalized.shape[0]):
            for j in range(cm_normalized.shape[1]):
                plt.text(j, i, f'{cm_normalized[i, j]:.1%}',
                        ha="center", va="center",
                        color="white" if cm_normalized[i, j] > thresh else "black",
                        fontsize=12, fontweight='bold')
        
        plt.xticks(range(len(self.class_names)), self.class_names, rotation=45, ha='right')
        plt.yticks(range(len(self.class_names)), self.class_names, rotation=0)
        plt.title('Confusion Matrix (Normalized)', fontsize=16, fontweight='bold', pad=20)
        plt.ylabel('True Label', fontsize=12)
        plt.xlabel('Predicted Label', fontsize=12)
        
        plt.tight_layout()
        
        # Save
        cm_path = os.path.join(self.output_dir, 'confusion_matrix.png')
        plt.savefig(cm_path, dpi=300, bbox_inches='tight')
        print(f"\nConfusion matrix saved to: {cm_path}")
        
        plt.close()
        
        # Also plot absolute numbers
        plt.figure(figsize=(10, 8))
        
        # Plot with matplotlib
        im = plt.imshow(cm, interpolation='nearest', cmap='Blues')
        plt.colorbar(im, label='Count')
        
        # Add annotations
        thresh = cm.max() / 2.
        for i in range(cm.shape[0]):
            for j in range(cm.shape[1]):
                plt.text(j, i, f'{cm[i, j]}',
                        ha="center", va="center",
                        color="white" if cm[i, j] > thresh else "black",
                        fontsize=12, fontweight='bold')
        
        plt.xticks(range(len(self.class_names)), self.class_names, rotation=45, ha='right')
        plt.yticks(range(len(self.class_names)), self.class_names, rotation=0)
        plt.title('Confusion Matrix (Counts)', fontsize=16, fontweight='bold', pad=20)
        plt.ylabel('True Label', fontsize=12)
        plt.xlabel('Predicted Label', fontsize=12)
        
        plt.tight_layout()
        
        cm_counts_path = os.path.join(self.output_dir, 'confusion_matrix_counts.png')
        plt.savefig(cm_counts_path, dpi=300, bbox_inches='tight')
        print(f"Confusion matrix (counts) saved to: {cm_counts_path}")
        
        plt.close()
    
    def plot_roc_curves(self, y_test, y_pred_probs):
        """
        Plot ROC curves for all classes
        
        Args:
            y_test: True labels
            y_pred_probs: Predicted probabilities
        """
        from sklearn.preprocessing import label_binarize
        
        # Binarize labels
        y_test_bin = label_binarize(y_test, classes=range(len(self.class_names)))
        
        plt.figure(figsize=(10, 8))
        
        colors = ['blue', 'red', 'green', 'orange', 'purple']
        
        for i, class_name in enumerate(self.class_names):
            fpr, tpr, _ = roc_curve(y_test_bin[:, i], y_pred_probs[:, i])
            roc_auc = auc(fpr, tpr)
            
            plt.plot(
                fpr, tpr,
                color=colors[i % len(colors)],
                lw=2,
                label=f'{class_name} (AUC = {roc_auc:.3f})'
            )
        
        plt.plot([0, 1], [0, 1], 'k--', lw=2, label='Random Classifier')
        
        plt.xlim([0.0, 1.0])
        plt.ylim([0.0, 1.05])
        plt.xlabel('False Positive Rate', fontsize=12)
        plt.ylabel('True Positive Rate', fontsize=12)
        plt.title('ROC Curves - Multi-Class Classification', fontsize=16, fontweight='bold', pad=20)
        plt.legend(loc="lower right", fontsize=10)
        plt.grid(True, alpha=0.3)
        
        plt.tight_layout()
        
        roc_path = os.path.join(self.output_dir, 'roc_curves.png')
        plt.savefig(roc_path, dpi=300, bbox_inches='tight')
        print(f"ROC curves saved to: {roc_path}")
        
        plt.close()
    
    def complete_evaluation(self, model_path, test_data=None):
        """
        Run complete evaluation pipeline
        
        Args:
            model_path: Path to saved model
            test_data: Optional tuple of (X_test, y_test). If None, will load from data loader
            
        Returns:
            Evaluation results dictionary
        """
        # Load model
        model = self.load_model(model_path)
        
        # Get test data if not provided
        if test_data is None:
            print("\nLoading test data...")
            data_loader = ECGDataLoader()
            data = data_loader.prepare_data()
            X_test = data['X_test']
            y_test = data['y_test']
        else:
            X_test, y_test = test_data
        
        # Evaluate
        results, y_pred, y_pred_probs = self.evaluate_model(model, X_test, y_test)
        
        # Plot visualizations
        print("\nGenerating visualizations...")
        self.plot_confusion_matrix(results['confusion_matrix'], y_test, y_pred)
        
        if len(self.class_names) > 1:
            try:
                self.plot_roc_curves(y_test, y_pred_probs)
            except Exception as e:
                print(f"Warning: Could not plot ROC curves: {e}")
        
        print("\n" + "="*70)
        print(" " * 20 + "EVALUATION COMPLETED!")
        print("="*70)
        
        return results


if __name__ == "__main__":
    # Evaluate the best model
    evaluator = ModelEvaluator()
    
    model_path = "models/best_model.h5"
    
    if os.path.exists(model_path):
        results = evaluator.complete_evaluation(model_path)
    else:
        print(f"Model not found at: {model_path}")
        print("Please train the model first using train.py")
