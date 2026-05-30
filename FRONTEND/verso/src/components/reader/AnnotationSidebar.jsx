import React from 'react';
import { X, Edit3, Trash2 } from 'lucide-react';
import { DEFAULT_HIGHLIGHT_COLOR } from './annotationColors';

const AnnotationSidebar = ({
  isOpen,
  onClose,
  annotations,
  getLocationLabel,
  onJump,
  onEdit,
  onDelete,
}) => {
  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/30 lg:hidden"
        onClick={onClose}
        aria-hidden
      />
      <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-[#b8c5d6] flex flex-col shadow-xl lg:static lg:z-auto lg:w-72 lg:max-w-none lg:shadow-none">
        <div className="flex items-center justify-end px-6 py-5 text-[#2c3e50]">
          <button
            onClick={onClose}
            className="p-1 hover:text-[#5b7c99]"
            aria-label="Close annotations"
          >
            <X size={22} />
          </button>
        </div>

        <h3 className="text-center text-lg font-semibold text-[#2c3e50] mb-4">Annotations</h3>

        <div className="flex-1 overflow-y-auto px-4 pb-6 flex flex-col gap-2">
          {annotations.length === 0 && (
            <p className="px-2 text-[13px] text-[#2c3e50]/70 text-center">
              Select text in the reader and highlight it to start annotating.
            </p>
          )}
          {annotations.map((a) => (
            <div
              key={a.id}
              className="group rounded-md bg-white/40 p-2 hover:bg-white/70 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <button
                  onClick={() => onJump?.(a)}
                  className="flex-1 text-left"
                >
                  <span className="block text-[11px] font-semibold text-[#5b7c99]">
                    {getLocationLabel ? getLocationLabel(a) : ''}
                  </span>
                  <span
                    className="mt-0.5 block text-[13px] text-[#2c3e50] leading-snug border-l-2 pl-2"
                    style={{ borderColor: a.color || DEFAULT_HIGHLIGHT_COLOR }}
                  >
                    “{a.selected_text && a.selected_text.length > 90
                      ? `${a.selected_text.slice(0, 90)}…`
                      : a.selected_text}”
                  </span>
                  {a.note && (
                    <span className="mt-1 block text-[12px] italic text-[#2c3e50]/70">
                      {a.note}
                    </span>
                  )}
                </button>
                <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onEdit(a)}
                    className="p-1 text-[#2c3e50] hover:text-[#5b7c99]"
                    aria-label="Edit note"
                  >
                    <Edit3 size={15} />
                  </button>
                  <button
                    onClick={() => onDelete(a.id)}
                    className="p-1 text-[#2c3e50] hover:text-red-600"
                    aria-label="Delete annotation"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </aside>
    </>
  );
};

export default AnnotationSidebar;
