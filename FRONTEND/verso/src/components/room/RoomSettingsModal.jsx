import React, { useState } from 'react';
import { X, Copy, RefreshCw, Trash2, Globe, Lock } from 'lucide-react';
import { updateRoom, deleteRoom } from '../../api/readingRooms';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';

// Owner settings for a chat room: copy/regenerate the invite code, rename, edit
// description, toggle visibility, and delete. Non-owners never see this modal.
const RoomSettingsModal = ({ room, onClose, onUpdated, onDeleted }) => {
  const toast = useToast();
  const confirm = useConfirm();
  const [name, setName] = useState(room.name || '');
  const [description, setDescription] = useState(room.description || '');
  const [visibility, setVisibility] = useState(room.visibility || 'private');
  const [code, setCode] = useState(room.joinCode || '');
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const copyCode = () => {
    if (!code) return;
    navigator.clipboard?.writeText(code).then(
      () => toast.success('Invite code copied'),
      () => toast.show(`Invite code: ${code}`),
    );
  };

  const regenerate = async () => {
    setRegenerating(true);
    try {
      const updated = await updateRoom(room.id, { regenerate_code: true });
      setCode(updated.joinCode || '');
      onUpdated?.(updated);
      toast.success('New invite code generated');
    } catch (err) {
      toast.error(err?.message || 'Failed to regenerate code');
    } finally {
      setRegenerating(false);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const updated = await updateRoom(room.id, {
        name: name.trim(),
        description: description.trim() || null,
        visibility,
      });
      onUpdated?.(updated);
      toast.success('Room updated');
      onClose();
    } catch (err) {
      toast.error(err?.message || 'Failed to update room');
      setSaving(false);
    }
  };

  const remove = async () => {
    const ok = await confirm({
      title: 'Delete this room?',
      message: 'The room and all its messages will be permanently removed for everyone.',
      confirmLabel: 'Delete room',
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteRoom(room.id);
      toast.success('Room deleted');
      onDeleted?.();
    } catch (err) {
      toast.error(err?.message || 'Failed to delete room');
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-[#2c3e50]">Room settings</h3>
          <button onClick={onClose} className="p-1 text-slate-500 hover:text-[#5b7c99]"><X size={18} /></button>
        </div>

        <div className="mt-4 flex flex-col gap-4">
          {code && (
            <div>
              <span className="text-[13px] font-medium text-[#2c3e50]">Invite code</span>
              <div className="mt-1 flex items-center gap-2">
                <code className="flex-1 rounded-md bg-slate-100 px-3 py-2 text-sm font-mono tracking-wider text-[#2c3e50]">{code}</code>
                <button onClick={copyCode} title="Copy" className="rounded-md border border-slate-300 p-2 text-slate-600 hover:bg-slate-50">
                  <Copy size={15} />
                </button>
                <button onClick={regenerate} disabled={regenerating} title="Regenerate" className="rounded-md border border-slate-300 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-50">
                  <RefreshCw size={15} className={regenerating ? 'animate-spin' : ''} />
                </button>
              </div>
              <p className="mt-1 text-[12px] text-slate-400">Regenerating revokes the old code.</p>
            </div>
          )}

          <label className="text-[13px] font-medium text-[#2c3e50]">
            Room name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={120}
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-2 text-[13px]"
            />
          </label>

          <label className="text-[13px] font-medium text-[#2c3e50]">
            Description
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={2}
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-2 text-[13px]"
            />
          </label>

          <fieldset className="flex gap-4 text-[13px] text-[#2c3e50]">
            <label className="inline-flex items-center gap-1.5">
              <input type="radio" checked={visibility === 'public'} onChange={() => setVisibility('public')} />
              <Globe size={14} /> Public
            </label>
            <label className="inline-flex items-center gap-1.5">
              <input type="radio" checked={visibility === 'private'} onChange={() => setVisibility('private')} />
              <Lock size={14} /> Private
            </label>
          </fieldset>

          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              onClick={remove}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              <Trash2 size={15} /> Delete
            </button>
            <button
              onClick={save}
              disabled={saving || !name.trim()}
              className="rounded-lg bg-[#5b7c99] px-4 py-2 text-sm font-medium text-white hover:bg-[#4a6884] disabled:opacity-40"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomSettingsModal;
