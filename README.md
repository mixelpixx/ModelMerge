# AI Model Merger Interface

A Next.js web application for merging multiple fine-tuned AI models using a user-friendly interface. This tool allows you to combine a base model with multiple fine-tuned outputs and an instruct model to create a merged model that incorporates traits from all sources.

## Features

- User-friendly web interface for model merging
- Real-time progress updates during merge operations
- Support for multiple fine-tune outputs
- Directory selection through GUI
- Integration with MergeKit for model merging operations
- Progress tracking with visual feedback
- Error handling and validation

## Prerequisites

- Node.js (v16 or higher)
- Python (v3.8 or higher)
- NPM or Yarn package manager

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/model-merger.git
cd model-merger
```

2. Install Node.js dependencies:
```bash
npm install
# or
yarn install
```

3. Install required Python packages:
```bash
pip install transformers torch mergekit tqdm
```

## Development

Start the development server:
```bash
npm run dev
# or
yarn dev
```

The application will be available at http://localhost:3000

## Usage

1. Open the application in your web browser
2. Fill in the required paths:
   - Base Model Path (e.g., "Qwen/Qwen2-7B")
   - Target Model Path (e.g., "Qwen/Qwen2-7B-Instruct")
   - One or more Fine-tune Output paths
   - Output Path for the merged model
3. Click "Merge Models" to start the process
4. Monitor the progress through the progress bar
5. Wait for completion notification

## File Structure

```
model-merger/
├── src/
│   ├── components/
│   │   ├── FileSelector.tsx    # Directory selection component
│   │   └── ModelMerger.tsx    # Main merger interface
│   ├── pages/
│   │   ├── api/
│   │   │   └── merge.ts       # API endpoint for merge operations
│   │   └── index.tsx          # Main page
│   └── python/
│       └── model_merger.py    # Python backend for model merging
├── public/
├── styles/
└── package.json
```

## API Reference

### Model Merger API

**POST /api/merge**
```typescript
{
  baseModel: string;      // Path to base model
  targetModel: string;    // Path to target instruct model
  finetuneOutputs: string[]; // Array of paths to fine-tuned models
  outputPath: string;     // Where to save the merged model
}
```

## Python Backend

The Python backend uses MergeKit to perform the actual model merging. Configuration options include:
- Weights for different model components
- Density factors
- Model precision (default: bfloat16)

## Building for Production

Build the production version:
```bash
npm run build
npm start
# or
yarn build
yarn start
```

## Error Handling

The application includes error handling for:
- Invalid file paths
- Missing Python dependencies
- Merge operation failures
- Network issues
- Timeout handling for long operations

## Known Limitations

- Large models require significant system memory
- Directory selection requires browser support for `webkitdirectory`
- Long merge operations might timeout in some environments

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [MergeKit](https://github.com/cg123/mergekit) for model merging capabilities
- [Next.js](https://nextjs.org/) for the web framework
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [lucide-react](https://lucide.dev/) for icons

## Support

For support, please open an issue in the GitHub repository or contact the maintainers.
