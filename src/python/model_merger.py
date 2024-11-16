# model_merger.py
import os
import json
import argparse
from typing import Optional, List
from dataclasses import dataclass
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch
from mergekit import merge
from tqdm import tqdm

def print_progress(progress: float, status: str = ""):
    """Print progress in JSON format for the Node.js server to parse"""
    print(json.dumps({
        "progress": progress,
        "status": status
    }), flush=True)

@dataclass
class FineTuneConfig:
    base_model_path: str
    target_model_path: str
    finetune_outputs: List[str]
    output_path: str
    weights: Optional[List[float]] = None
    densities: Optional[List[float]] = None

class ModelMerger:
    def __init__(self, config: FineTuneConfig):
        self.config = config
        self.validate_config()

    def validate_config(self):
        """Validate all required paths exist and configurations are correct."""
        required_paths = [
            self.config.base_model_path,
            self.config.target_model_path,
            *self.config.finetune_outputs
        ]
        for path in required_paths:
            if not os.path.exists(path):
                raise ValueError(f"Path does not exist: {path}")
        
        if self.config.weights and len(self.config.weights) != len(self.config.finetune_outputs) + 1:
            raise ValueError("Number of weights must match number of models (including target)")
        
        if self.config.densities and len(self.config.densities) != len(self.config.finetune_outputs) + 1:
            raise ValueError("Number of densities must match number of models (including target)")

    def merge_models(self):
        """Execute the model merging process with progress reporting."""
        try:
            # Create output directory if it doesn't exist
            os.makedirs(self.config.output_path, exist_ok=True)
            
            print_progress(0, "Starting merge process")
            
            # Calculate total steps
            total_steps = len(self.config.finetune_outputs) + 3  # +3 for base model, target model, and final save
            current_step = 0
            
            # Load base model
            print_progress(current_step / total_steps * 100, "Loading base model")
            merge_config = self.prepare_merge_config()
            current_step += 1
            
            # Merge process
            print_progress(current_step / total_steps * 100, "Starting merge")
            merged_model = merge(merge_config)
            current_step += 1
            
            # Save merged model
            print_progress(current_step / total_steps * 100, "Saving merged model")
            merged_model.save_pretrained(
                self.config.output_path,
                max_shard_size="2GB"  # Shard large models
            )
            current_step += 1
            
            # Save tokenizer
            print_progress(90, "Saving tokenizer")
            tokenizer = AutoTokenizer.from_pretrained(self.config.finetune_outputs[0])
            tokenizer.save_pretrained(self.config.output_path)
            
            print_progress(100, "Merge completed successfully")
            return True
            
        except Exception as e:
            print_progress(0, f"Error: {str(e)}")
            raise

def main():
    parser = argparse.ArgumentParser(description='Merge multiple fine-tuned models')
    parser.add_argument('--base_model', required=True, help='Path to base model')
    parser.add_argument('--target_model', required=True, help='Path to target model')
    parser.add_argument('--finetune_output', action='append', required=True, help='Paths to fine-tuned models')
    parser.add_argument('--output_path', required=True, help='Path to save merged model')
    
    args = parser.parse_args()
    
    config = FineTuneConfig(
        base_model_path=args.base_model,
        target_model_path=args.target_model,
        finetune_outputs=args.finetune_output,
        output_path=args.output_path
    )
    
    merger = ModelMerger(config)
    merger.merge_models()

if __name__ == "__main__":
    main()