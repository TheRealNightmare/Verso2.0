import { useEffect, useRef, useState } from 'react';
import { ChevronLeft } from 'lucide-react';

const UploadAvatarModal = ({ open, onClose, onConfirm }) => {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!open) {
      setFile(null);
      setPreviewUrl(null);
      setIsDragging(false);
    }
  }, [open]);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  if (!open) return null;

  const pickFile = (f) => {
    if (f && f.type.startsWith('image/')) setFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    pickFile(e.dataTransfer.files?.[0]);
  };

  const handleConfirm = () => {
    if (file) onConfirm(file);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl bg-[#eef2f5] p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-center relative mb-5">
          <button
            type="button"
            onClick={onClose}
            aria-label="Back"
            className="absolute left-0 text-slate-700 hover:text-slate-900"
          >
            <ChevronLeft size={22} />
          </button>
          <h2 className="text-lg font-semibold text-slate-800">upload new profile pic</h2>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`flex items-center justify-center h-52 rounded-xl bg-white border-2 border-dashed cursor-pointer transition ${
            isDragging ? 'border-[#5b7c99]' : 'border-slate-200'
          }`}
        >
          {previewUrl ? (
            <img src={previewUrl} alt="preview" className="h-full object-contain" />
          ) : (
            <span className="text-[#5b7c99]/80 text-sm">drag/select new picture here</span>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => pickFile(e.target.files?.[0])}
          />
        </div>

        <div className="flex justify-center mt-5">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!file}
            className="px-8 py-2 rounded-lg bg-[#5b7c99] text-white text-sm font-medium hover:bg-[#4a6a85] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadAvatarModal;
