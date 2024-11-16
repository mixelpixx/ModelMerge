import os
from typing import Optional, List
from dataclasses import dataclass
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch
from mergekit import merge

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

    def prepare_merge_config(self) -> dict:
        """Prepare the mergekit configuration according to the document's methodology."""
        # Default weights and densities if not provided
        weights = self.config.weights or [1.0] * (len(self.config.finetune_outputs) + 1)
        densities = self.config.densities or [1.0] * (len(self.config.finetune_outputs) + 1)

        # Build models configuration
        models_config = []
        
        # Add all fine-tuned models
        for idx, model_path in enumerate(self.config.finetune_outputs):
            models_config.append({
                "model": model_path,
                "parameters": {
                    "weight": weights[idx],
                    "density": densities[idx]
                }
            })
        
        # Add target model (instruct model)
        models_config.append({
            "model": self.config.target_model_path,
            "parameters": {
                "weight": weights[-1],
                "density": densities[-1]
            }
        })

        return {
            "models": models_config,
            "merge_method": "ties",
            "base_model": self.config.base_model_path,
            "parameters": {
                "weight": 1,
                "density": 1,
                "normalize": True,
                "int8_mask": True
            },
            "tokenizer_source": self.config.finetune_outputs[0],  # Using first fine-tuned model's tokenizer
            "dtype": "bfloat16"
        }

    def merge_models(self):
        """Execute the model merging process."""
        try:
            # Create output directory if it doesn't exist
            os.makedirs(self.config.output_path, exist_ok=True)

            # Prepare merge configuration
            merge_config = self.prepare_merge_config()
            
            # Perform merge
            print("Starting model merge...")
            merged_model = merge(merge_config)
            
            # Save merged model and tokenizer
            print(f"Saving merged model to {self.config.output_path}")
            merged_model.save_pretrained(self.config.output_path)
            
            # Save tokenizer from the first fine-tuned model
            tokenizer = AutoTokenizer.from_pretrained(self.config.finetune_outputs[0])
            tokenizer.save_pretrained(self.config.output_path)
            
            print("Merge completed successfully!")
            return True
            
        except Exception as e:
            print(f"Error during merge process: {str(e)}")
            return False

# Example usage
if __name__ == "__main__":
    config = FineTuneConfig(
        base_model_path="Qwen/Qwen2-7B",
        target_model_path="Qwen/Qwen2-7B-Instruct",
        finetune_outputs=[
            "path/to/finetune1",
            "path/to/finetune2",
            "path/to/finetune3"
        ],
        output_path="path/to/output",
        weights=[1.0, 1.0, 1.0, 1.0],  # Optional custom weights
        densities=[1.0, 1.0, 1.0, 1.0]  # Optional custom densities
    )
    
    merger = ModelMerger(config)
    merger.merge_models()