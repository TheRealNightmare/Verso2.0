import { useEffect, useRef, useState } from 'react';
import { Image as ImageIcon, Mic, Send, X, StopCircle } from 'lucide-react';

const MessageComposer = ({ onSendText, onSendImage, onSendAudio, placeholder = 'Type your message', replyingTo, onCancelReply }) => {
  const [text, setText] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [recording, setRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [recordedDuration, setRecordedDuration] = useState(0);
  const [recordElapsed, setRecordElapsed] = useState(0);
  const [sending, setSending] = useState(false);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const imageInputRef = useRef(null);

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
  }, [imagePreview]);

  const reset = () => {
    setText('');
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    setRecordedBlob(null);
    setRecordedDuration(0);
    setRecordElapsed(0);
  };

  const handleImagePick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    e.target.value = '';
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      chunksRef.current = [];
      const started = Date.now();
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const dur = Math.max(1, Math.round((Date.now() - started) / 1000));
        setRecordedBlob(blob);
        setRecordedDuration(dur);
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
      setRecordElapsed(0);
      timerRef.current = setInterval(() => setRecordElapsed((s) => s + 1), 1000);
    } catch (err) {
      console.error('Mic access failed', err);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  const submit = async (e) => {
    e?.preventDefault?.();
    if (sending) return;

    try {
      setSending(true);
      if (recordedBlob) {
        const file = new File([recordedBlob], 'recording.webm', { type: 'audio/webm' });
        await onSendAudio?.(file, recordedDuration);
      } else if (imageFile) {
        await onSendImage?.(imageFile, text.trim());
      } else {
        const trimmed = text.trim();
        if (!trimmed) return;
        await onSendText?.(trimmed);
      }
      reset();
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="border-t border-slate-200">
      {replyingTo && (
        <div className="flex items-center justify-between px-4 py-1.5 bg-slate-50 border-b border-slate-200 text-xs text-slate-600">
          <span>Replying to <strong>{replyingTo.authorName || 'message'}</strong></span>
          <button type="button" onClick={onCancelReply} className="text-slate-400 hover:text-slate-600">
            <X size={14} />
          </button>
        </div>
      )}

      {imagePreview && (
        <div className="px-4 py-2 border-b border-slate-200 flex items-center gap-2">
          <img src={imagePreview} alt="preview" className="w-16 h-16 object-cover rounded" />
          <button type="button" onClick={() => { setImageFile(null); URL.revokeObjectURL(imagePreview); setImagePreview(null); }} className="text-slate-500 hover:text-red-600">
            <X size={16} />
          </button>
          <span className="text-xs text-slate-500">{imageFile?.name}</span>
        </div>
      )}

      {recordedBlob && !recording && (
        <div className="px-4 py-2 border-b border-slate-200 flex items-center gap-2 text-sm text-slate-600">
          <Mic size={16} className="text-[#4f83cc]" />
          <span>Voice clip {recordedDuration}s ready to send</span>
          <button type="button" onClick={() => { setRecordedBlob(null); setRecordedDuration(0); }} className="text-slate-400 hover:text-red-600 ml-auto">
            <X size={14} />
          </button>
        </div>
      )}

      <form onSubmit={submit} className="flex items-center gap-2 px-4 py-3">
        <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImagePick} />

        {recording ? (
          <button
            type="button"
            onClick={stopRecording}
            className="w-9 h-9 rounded-full bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center animate-pulse"
            aria-label="Stop recording"
          >
            <StopCircle size={18} />
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center"
              aria-label="Attach image"
              disabled={!!recordedBlob}
            >
              <ImageIcon size={16} />
            </button>
            <button
              type="button"
              onClick={startRecording}
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center"
              aria-label="Record audio"
              disabled={!!imageFile || !!recordedBlob}
            >
              <Mic size={16} />
            </button>
          </>
        )}

        <input
          type="text"
          value={recording ? `Recording… ${recordElapsed}s` : text}
          onChange={(e) => setText(e.target.value)}
          placeholder={recordedBlob ? 'Press send to share your voice clip' : placeholder}
          disabled={recording || !!recordedBlob}
          className="flex-1 px-4 py-2.5 rounded-full bg-slate-100 border border-transparent focus:outline-none focus:border-[#4f83cc]/40 text-sm text-slate-700 placeholder:text-slate-400 disabled:opacity-70"
        />
        <button
          type="submit"
          className="w-10 h-10 rounded-lg bg-[#4f83cc] hover:bg-[#3f6ab0] text-white flex items-center justify-center disabled:opacity-50"
          aria-label="Send"
          disabled={sending || recording || (!text.trim() && !imageFile && !recordedBlob)}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};

export default MessageComposer;
