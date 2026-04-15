"""
Main script to run the complete MI detection pipeline
"""

import sys
import os

# Add src directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from src.train import ModelTrainer
from src.evaluate import ModelEvaluator


def main():
    """Run complete pipeline"""
    
    print("\n" + "="*80)
    print(" " * 20 + "MI DETECTION - COMPLETE PIPELINE")
    print("="*80)
    
    # Step 1: Train model
    print("\n[PHASE 1] TRAINING MODEL")
    print("-"*80)
    
    trainer = ModelTrainer(config_path="config.yaml")
    
    try:
        history = trainer.train(
            use_augmentation=True,
            balance_classes=True
        )
        print("\n✓ Training completed successfully")
    except Exception as e:
        print(f"\n✗ Training failed: {e}")
        return
    
    # Step 2: Evaluate model
    print("\n[PHASE 2] EVALUATING MODEL")
    print("-"*80)
    
    evaluator = ModelEvaluator(config_path="config.yaml")
    
    try:
        model_path = "models/best_model.h5"
        
        if os.path.exists(model_path):
            results = evaluator.complete_evaluation(model_path)
            print("\n✓ Evaluation completed successfully")
        else:
            print(f"\n✗ Model not found at: {model_path}")
    except Exception as e:
        print(f"\n✗ Evaluation failed: {e}")
        return
    
    # Summary
    print("\n" + "="*80)
    print(" " * 25 + "PIPELINE COMPLETED!")
    print("="*80)
    print("\nGenerated files:")
    print("  • models/best_model.h5              - Best trained model")
    print("  • models/final_model.h5             - Final model")
    print("  • outputs/training_curves.png       - Training history visualization")
    print("  • outputs/confusion_matrix.png      - Confusion matrix")
    print("  • outputs/roc_curves.png           - ROC curves")
    print("  • outputs/evaluation_results.json   - Detailed metrics")
    
    print("\nNext steps:")
    print("  • Review training curves in outputs/")
    print("  • Check evaluation_results.json for detailed metrics")
    print("  • Use predict.py to make predictions on new images")
    
    print("\n" + "="*80 + "\n")


if __name__ == "__main__":
    main()
