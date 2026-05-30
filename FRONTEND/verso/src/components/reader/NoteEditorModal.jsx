import React from 'react';
import { X, Trash2 } from 'lucide-react';
import { DEFAULT_HIGHLIGHT_COLOR } from './annotationColors';

const NoteEditorModal = ({ ann, draft, onDraftChange, onSave, onDelete, onClose }) => {
  if (!ann) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
        <div className="flex items-center justify-between">
          <h4 className="text-base font-semibold text-[#2c3e50]">Note</h4>
          <button
            onClick={onClose}
            className="p-1 text-[#2c3e50] hover:text-[#5b7c99]"
            aria-label="Close note editor"
          >
            <X size={18} />
          </button>
        </div>
        <p
          className="mt-3 rounded-md border-l-2 bg-[#f8f6f2] p-2 text-[13px] text-[#2c3e50] leading-snug"
          style={{ borderColor: ann.color || DEFAULT_HIGHLIGHT_COLOR }}
        >
          “{ann.selected_text}”
        </p>
        <textarea
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          placeholder="Write your note…"
          rows={4}
          className="mt-3 w-full resize-none rounded-md border border-gray-300 p-2 text-[13px] text-[#2c3e50] focus:border-[#5b7c99] focus:outline-none"
        />
        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={() => onDelete(ann.id)}
            className="inline-flex items-center gap-1 text-[13px] text-red-600 hover:text-red-700"
          >
            <Trash2 size={15} /> Delete
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-md px-3 py-1.5 text-[13px] text-[#2c3e50] hover:bg-[#f0ece3]"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              className="rounded-md bg-[#5b7c99] px-3 py-1.5 text-[13px] font-medium text-white hover:bg-[#4a6884]"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoteEditorModal;
