import type { NextApiRequest, NextApiResponse } from 'next';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';

type MergeRequest = {
  baseModel: string;
  targetModel: string;
  finetuneOutputs: string[];
  outputPath: string;
  weights?: number[];
  densities?: number[];
};

type MergeResponse = {
  message: string;
  output?: string;
  progress?: number;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  // Input validation
  const { baseModel, targetModel, finetuneOutputs, outputPath, weights, densities } = req.body as MergeRequest;
  
  if (!baseModel || !targetModel || !finetuneOutputs || !outputPath) {
    return res.status(400).json({ message: 'Missing required parameters' });
  }

  // Validate paths
  const scriptPath = path.join(process.cwd(), 'scripts', 'model_merger.py');
  if (!fs.existsSync(scriptPath)) {
    return res.status(500).json({ message: 'Model merger script not found' });
  }

  // Prepare arguments for Python script
  const args = [
    scriptPath,
    '--base-model', baseModel,
    '--target-model', targetModel,
    '--output-path', outputPath,
    '--finetune-outputs', ...finetuneOutputs
  ];

  if (weights) {
    args.push('--weights', ...weights.map(String));
  }
  if (densities) {
    args.push('--densities', ...densities.map(String));
  }

  try {
    let python: ChildProcess;
    const mergeProcess = new Promise<MergeResponse>((resolve, reject) => {
      python = spawn('python', args);
      
      let output = '';
      let error = '';
      let progress = 0;

      python.stdout.on('data', (data) => {
        const message = data.toString();
        output += message;
        
        // Parse progress updates
        const progressMatch = message.match(/Progress: (\d+)%/);
        if (progressMatch) {
          progress = parseInt(progressMatch[1]);
          res.write(JSON.stringify({ progress }));
        }
      });

      python.stderr.on('data', (data) => {
        error += data.toString();
      });

      python.on('close', (code) => {
        if (code !== 0) {
          reject({ message: 'Process failed', error });
        } else {
          resolve({ 
            message: 'Models merged successfully',
            output,
            progress: 100
          });
        }
      });

      // Handle process errors
      python.on('error', (err) => {
        reject({ message: 'Failed to start process', error: err.message });
      });
    });

    // Set response headers for Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const result = await mergeProcess;
    res.write(JSON.stringify({ 
      message: result.message,
      output: result.output,
      progress: 100
    }));
    res.end();
    
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
