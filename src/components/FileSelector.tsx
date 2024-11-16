import React from 'react';
import { FolderOpen } from 'lucide-react';

interface FileSelectorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}

const FileSelector: React.FC<FileSelectorProps> = ({
  label,
  value,
  onChange,
  placeholder,
  required = false,
}) => {
  const handleFileSelect = async () => {
    try {
      // Create an input element
      const input = document.createElement('input');
      input.type = 'file';
      input.webkitdirectory = true;
      input.directory = true;

      // Handle file selection
      input.onchange = (e) => {
        const files = (e.target as HTMLInputElement).files;
        if (files && files.length > 0) {
          // Get the directory path
          const path = files[0].webkitRelativePath.split('/')[0];
          onChange(path);
        }
      };

      // Trigger file selection dialog
      input.click();
    } catch (error) {
      console.error('Error selecting directory:', error);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium mb-1">{label}</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 p-2 border rounded"
          placeholder={placeholder}
          required={required}
        />
        <button
          type="button"
          onClick={handleFileSelect}
          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded border flex items-center gap-2"
        >
          <FolderOpen className="w-4 h-4" />
          Browse
        </button>
      </div>
    </div>
  );
};

export default FileSelector;
