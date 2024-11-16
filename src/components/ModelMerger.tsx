import React, { useState } from 'react';
import { Trash2, Plus, FileText, Loader } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const ModelMerger = () => {
  const [baseModel, setBaseModel] = useState('');
  const [targetModel, setTargetModel] = useState('');
  const [outputPath, setOutputPath] = useState('');
  const [finetuneOutputs, setFinetuneOutputs] = useState(['']);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [result, setResult] = useState({ type: '', message: '' });

  const addFinetuneOutput = () => {
    setFinetuneOutputs([...finetuneOutputs, '']);
  };

  const removeFinetuneOutput = (index) => {
    const newOutputs = finetuneOutputs.filter((_, i) => i !== index);
    setFinetuneOutputs(newOutputs);
  };

  const updateFinetuneOutput = (index, value) => {
    const newOutputs = [...finetuneOutputs];
    newOutputs[index] = value;
    setFinetuneOutputs(newOutputs);
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsProcessing(true);
  setResult({ type: '', message: '' });

  try {
    const response = await fetch('/api/merge', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        baseModel,
        targetModel,
        finetuneOutputs,
        outputPath,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to merge models');
    }

    setResult({
      type: 'success',
      message: data.message,
    });
  } catch (error) {
    setResult({
      type: 'error',
      message: error instanceof Error ? error.message : 'An unknown error occurred',
    });
  } finally {
    setIsProcessing(false);
  }
};

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Model Merger Interface</h1>
        <button
          onClick={() => setShowInstructions(!showInstructions)}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          <FileText className="w-4 h-4" />
          {showInstructions ? 'Hide' : 'Show'} Instructions
        </button>
      </div>

      {showInstructions && (
        <Alert className="bg-blue-50 border-blue-200">
          <AlertTitle className="text-blue-800">How to Use the Model Merger</AlertTitle>
          <AlertDescription className="text-blue-700 mt-2">
            <ol className="list-decimal list-inside space-y-2">
              <li>Enter the path to your base model (e.g., "Qwen/Qwen2-7B")</li>
              <li>Enter the path to your target instruct model (e.g., "Qwen/Qwen2-7B-Instruct")</li>
              <li>Add paths to all your fine-tuned model outputs</li>
              <li>Specify the output path where the merged model will be saved</li>
              <li>Click "Merge Models" to start the process</li>
            </ol>
            <p className="mt-4">
              Note: All paths should be valid and accessible. The process might take several minutes 
              depending on the model sizes and your hardware capabilities.
            </p>
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Base Model Path</label>
            <input
              type="text"
              value={baseModel}
              onChange={(e) => setBaseModel(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="e.g., Qwen/Qwen2-7B"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Target Model Path</label>
            <input
              type="text"
              value={targetModel}
              onChange={(e) => setTargetModel(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="e.g., Qwen/Qwen2-7B-Instruct"
              required
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium">Fine-tune Outputs</label>
              <button
                type="button"
                onClick={addFinetuneOutput}
                className="flex items-center gap-1 px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
              >
                <Plus className="w-4 h-4" />
                Add Output
              </button>
            </div>
            {finetuneOutputs.map((output, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={output}
                  onChange={(e) => updateFinetuneOutput(index, e.target.value)}
                  className="flex-1 p-2 border rounded"
                  placeholder={`Fine-tune output path ${index + 1}`}
                  required
                />
                {finetuneOutputs.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeFinetuneOutput(index)}
                    className="p-2 text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Output Path</label>
            <input
              type="text"
              value={outputPath}
              onChange={(e) => setOutputPath(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Path to save merged model"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isProcessing}
          className="w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300 flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : (
            'Merge Models'
          )}
        </button>
      </form>

      {result.message && (
        <Alert className={result.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
          <AlertTitle className={result.type === 'success' ? 'text-green-800' : 'text-red-800'}>
            {result.type === 'success' ? 'Success!' : 'Error'}
          </AlertTitle>
          <AlertDescription className={result.type === 'success' ? 'text-green-700' : 'text-red-700'}>
            {result.message}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default ModelMerger;