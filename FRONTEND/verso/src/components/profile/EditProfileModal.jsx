import { Camera, LogOut } from 'lucide-react';
import Modal from '../ui/Modal';
import Avatar from '../ui/Avatar';
import ProfileForm from './ProfileForm';

/**
 * Edit-profile dialog for the owner's profile. Wraps the existing ProfileForm
 * and surfaces the avatar (with a "Change photo" trigger) and a logout action.
 * Saving, photo upload, and logout are handled by the parent page.
 */
const EditProfileModal = ({
  open,
  onClose,
  initialValues,
  onSave,
  submitting,
  errors,
  avatarUrl,
  name,
  onChangePhoto,
  onLogout,
}) => {
  if (!open) return null;

  return (
    <Modal
      onClose={onClose}
      label="Edit profile"
      panelClassName="bg-white rounded-2xl shadow-xl max-w-lg max-h-[90vh] overflow-y-auto"
    >
      <div className="border-b border-slate-100 px-6 py-4">
        <h2 className="text-lg font-semibold text-slate-800">Edit profile</h2>
      </div>

      <div className="flex flex-col items-center gap-3 px-6 pt-5">
        <div className="relative">
          <Avatar src={avatarUrl} name={name} className="h-24 w-24 shadow-sm" textClass="text-3xl" />
          <button
            type="button"
            onClick={onChangePhoto}
            aria-label="Change photo"
            className="absolute -bottom-1 -right-1 rounded-full bg-[#5b7c99] p-2 text-white shadow hover:bg-[#4a6a85]"
          >
            <Camera size={15} />
          </button>
        </div>
      </div>

      <div className="flex justify-center px-6 pb-2 pt-4">
        <ProfileForm
          initialValues={initialValues}
          onConfirm={onSave}
          submitting={submitting}
          errors={errors}
        />
      </div>

      <div className="flex justify-between border-t border-slate-100 px-6 py-4">
        <button
          type="button"
          onClick={onLogout}
          className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
        >
          <LogOut size={16} /> Log out
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          Close
        </button>
      </div>
    </Modal>
  );
};

export default EditProfileModal;
