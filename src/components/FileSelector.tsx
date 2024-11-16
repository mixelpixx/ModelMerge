import React from 'react';
import { FolderOpen } from 'lucide-react';

interface FileSelectorProps {
  label?: string;
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
      
      // Enable directory selection
      // Note: These are non-standard attributes, adding type assertion
      (input as any).webkitdirectory = true;
      (input as any).directory = true;

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
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder={placeholder}
          required={required}
        />
        <button
          type="button"
          onClick={handleFileSelect}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <FolderOpen className="w-4 h-4 mr-2" />
          Browse
        </button>
      </div>
    </div>
  );
};

export default FileSelector;