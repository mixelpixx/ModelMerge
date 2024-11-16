// merge.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { spawn } from 'child_process';
import WebSocket from 'ws';

// Store WebSocket connections
const progressSubscribers = new Set<WebSocket>();

// WebSocket handler for /api/progress
export const progressHandler = (ws: WebSocket) => {
  progressSubscribers.add(ws);
  
  ws.on('close', () => {
    progressSubscribers.delete(ws);
  });
};

// Broadcast progress to all connected clients
const broadcastProgress = (progress: number, status?: string) => {
  const message = JSON.stringify({ progress, status });
  progressSubscribers.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  });
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { baseModel, targetModel, finetuneOutputs, outputPath } = req.body;

  try {
    const python = spawn('python', [
      'model_merger.py',
      '--base_model', baseModel,
      '--target_model', targetModel,
      '--output_path', outputPath,
      ...finetuneOutputs.flatMap(path => ['--finetune_output', path])
    ]);

    let output = '';
    let error = '';

    // Handle progress updates from Python script
    python.stdout.on('data', (data) => {
      const stringData = data.toString();
      output += stringData;
      
      try {
        const jsonData = JSON.parse(stringData);
        if (jsonData.progress !== undefined) {
          broadcastProgress(jsonData.progress, jsonData.status);
        }
      } catch (e) {
        // Not JSON data, just regular output
        console.log(stringData);
      }
    });

    python.stderr.on('data', (data) => {
      error += data.toString();
    });

    // Set timeout for long-running operations
    const timeout = setTimeout(() => {
      python.kill();
      broadcastProgress(0, 'Operation timed out');
      return res.status(504).json({ message: 'Operation timed out' });
    }, 3600000); // 1 hour timeout

    python.on('close', (code) => {
      clearTimeout(timeout);
      
      if (code !== 0) {
        broadcastProgress(0, error);
        return res.status(500).json({ message: error || 'Process failed' });
      }
      
      broadcastProgress(100, 'Complete');
      return res.status(200).json({ 
        message: 'Models merged successfully',
        output: `Merged model saved to ${outputPath}`
      });
    });
  } catch (error) {
    console.error('Error:', error);
    broadcastProgress(0, 'Internal server error');
    return res.status(500).json({ message: 'Internal server error' });
  }
}