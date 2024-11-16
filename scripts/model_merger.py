import os
import argparse
import sys
from typing import Optional, List
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch
from mergekit import merge

class ModelMerger:
    def __init__(self, config: dict):
        self.config = config
        self.validate_config()

    def validate_config(self):
        """Validate all required paths exist and configurations are correct."""
        required_paths = [
            self.config['base_model_path'],
            self.config['target_model_path'],
            *self.config['finetune_outputs']
        ]
        for path in required_paths:
            if not os.path.exists(path):
                raise ValueError(f"Path does not exist: {path}")
        
        if self.config.get('weights') and len(self.config['weights']) != len(self.config['finetune_outputs']) + 1:
            raise ValueError("Number of weights must match number of models (including target)")
        
        if self.config.get('densities') and len(self.config['densities']) != len(self.config['finetune_outputs']) + 1:
            raise ValueError("Number of densities must match number of models (including target)")

    def update_progress(self, progress: int):
        print(f"Progress: {progress}%", flush=True)

    def prepare_merge_config(self) -> dict:
        """Prepare the mergekit configuration according to the document's methodology."""
        # Default weights and densities if not provided
        weights = self.config.get('weights') or [1.0] * (len(self.config['finetune_outputs']) + 1)
        densities = self.config.get('densities') or [1.0] * (len(self.config['finetune_outputs']) + 1)

        # Build models configuration
        models_config = []
        
        # Add all fine-tuned models
        for idx, model_path in enumerate(self.config['finetune_outputs']):
            models_config.append({
                "model": model_path,
                "parameters": {
                    "weight": weights[idx],
                    "density": densities[idx]
                }
            })
        
        # Add target model (instruct model)
        models_config.append({
            "model": self.config['target_model_path'],
            "parameters": {
                "weight": weights[-1],
                "density": densities[-1]
            }
        })

        return {
            "models": models_config,
            "merge_method": "ties",
            "base_model": self.config['base_model_path'],
            "parameters": {
                "weight": 1,
                "density": 1,
                "normalize": True,
                "int8_mask": True
            },
            "tokenizer_source": self.config['finetune_outputs'][0],  # Using first fine-tuned model's tokenizer
            "dtype": "bfloat16"
        }

    def merge_models(self):
        """Execute the model merging process."""
        try:
            # Create output directory if it doesn't exist
            os.makedirs(self.config['output_path'], exist_ok=True)
            self.update_progress(10)

            # Prepare merge configuration
            merge_config = self.prepare_merge_config()
            self.update_progress(20)
            
            # Perform merge
            print("Starting model merge...")
            self.update_progress(30)
            merged_model = merge(merge_config)
            self.update_progress(70)
            
            # Save merged model and tokenizer
            print(f"Saving merged model to {self.config['output_path']}")
            self.update_progress(80)
            merged_model.save_pretrained(self.config['output_path'])
            self.update_progress(90)
            
            # Save tokenizer from the first fine-tuned model
            tokenizer = AutoTokenizer.from_pretrained(self.config['finetune_outputs'][0])
            tokenizer.save_pretrained(self.config['output_path'])
            
            print("Merge completed successfully!")
            self.update_progress(100)
            return True
            
        except Exception as e:
            print(f"Error during merge process: {str(e)}")
            sys.exit(1)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Merge multiple fine-tuned models')
    parser.add_argument('--base-model', required=True, help='Path to base model')
    parser.add_argument('--target-model', required=True, help='Path to target model')
    parser.add_argument('--finetune-outputs', nargs='+', required=True, help='Paths to fine-tuned models')
    parser.add_argument('--output-path', required=True, help='Path to save merged model')
    parser.add_argument('--weights', nargs='+', type=float, help='Optional weights for each model')
    parser.add_argument('--densities', nargs='+', type=float, help='Optional densities for each model')

    args = parser.parse_args()

    config = {
        'base_model_path': args.base_model,
        'target_model_path': args.target_model,
        'finetune_outputs': args.finetune_outputs,
        'output_path': args.output_path,
        'weights': args.weights,
        'densities': args.densities
    }
     
    merger = ModelMerger(config)
    merger.merge_models()
