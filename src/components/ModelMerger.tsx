// ModelMerger.tsx
import React, { useState, useEffect } from 'react';
import { Trash2, Plus, FileText, Loader } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import FileSelector from './FileSelector';

// Add WebSocket type
type ProgressUpdate = {
  progress: number;
  status?: string;
  error?: string;
};

const ModelMerger = () => {
  const [baseModel, setBaseModel] = useState('');
  const [targetModel, setTargetModel] = useState('');
  const [outputPath, setOutputPath] = useState('');
  const [finetuneOutputs, setFinetuneOutputs] = useState(['']);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [result, setResult] = useState({ type: '', message: '' });
  const [progress, setProgress] = useState<number>(0);
  
  // WebSocket connection for progress updates
  useEffect(() => {
    let ws: WebSocket | null = null;
    
    if (isProcessing) {
      ws = new WebSocket(`${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/progress`);
      
      ws.onmessage = (event) => {
        const update: ProgressUpdate = JSON.parse(event.data);
        if (update.progress) {
          setProgress(update.progress);
        }
        if (update.error) {
          setResult({ type: 'error', message: update.error });
          setIsProcessing(false);
        }
      };
    }
    
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [isProcessing]);

  const addFinetuneOutput = () => {
    setFinetuneOutputs([...finetuneOutputs, '']);
  };

  const removeFinetuneOutput = (index: number) => {
    const newOutputs = finetuneOutputs.filter((_, i) => i !== index);
    setFinetuneOutputs(newOutputs);
  };

  const updateFinetuneOutput = (index: number, value: string) => {
    const newOutputs = [...finetuneOutputs];
    newOutputs[index] = value;
    setFinetuneOutputs(newOutputs);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setResult({ type: '', message: '' });
    setProgress(0);

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
      setProgress(0);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Existing header and instructions code remains the same */}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <FileSelector
            label="Base Model Path"
            value={baseModel}
            onChange={setBaseModel}
            placeholder="e.g., Qwen/Qwen2-7B"
            required
          />

          <FileSelector
            label="Target Model Path"
            value={targetModel}
            onChange={setTargetModel}
            placeholder="e.g., Qwen/Qwen2-7B-Instruct"
            required
          />

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
                <FileSelector
                  value={output}
                  onChange={(value) => updateFinetuneOutput(index, value)}
                  placeholder={`Fine-tune output path ${index + 1}`}
                  required
                  label=""
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

          <FileSelector
            label="Output Path"
            value={outputPath}
            onChange={setOutputPath}
            placeholder="Path to save merged model"
            required
          />
        </div>

        {isProcessing && (
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        )}

        <button
          type="submit"
          disabled={isProcessing}
          className="w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300 flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Processing... {progress.toFixed(1)}%
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