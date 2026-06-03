import { useEffect, useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { fetchGenders } from '../../api/meta';
import Field from '../ui/Field';
import Button from '../ui/Button';

const firstError = (errors, key) => (Array.isArray(errors?.[key]) ? errors[key][0] : errors?.[key]);

const BANNER_PRESETS = [
  '#5b7c99',
  '#5b8c6a',
  '#8c5b8c',
  '#b5677d',
  '#475569',
  '#2c7a7b',
  '#b07a3c',
  '#4f5b93',
];

const ProfileForm = ({ initialValues, onConfirm, submitting = false, errors = {} }) => {
  const [values, setValues] = useState(initialValues);
  const [genderOptions, setGenderOptions] = useState([]);

  // Re-sync when the profile arrives from the async fetch.
  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  useEffect(() => {
    fetchGenders()
      .then((list) => setGenderOptions(Array.isArray(list) ? list : []))
      .catch(console.error);
  }, []);

  const update = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }));
  const setValue = (key, value) => setValues((v) => ({ ...v, [key]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(values);
  };

  const inputCls =
    'w-full bg-transparent text-sm text-slate-700 focus:outline-none placeholder:text-slate-400';

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md flex flex-col gap-3">
      <Field label="Email" error={firstError(errors, 'email')}>
        {(fp) => (
          <input
            {...fp}
            type="email"
            value={values.email}
            onChange={update('email')}
            className={inputCls}
          />
        )}
      </Field>

      <Field label="Current password" error={firstError(errors, 'current_password')}>
        {(fp) => (
          <input
            {...fp}
            type="password"
            value={values.currentPassword}
            onChange={update('currentPassword')}
            placeholder="Required only to change password"
            className={inputCls}
          />
        )}
      </Field>

      <Field label="New password" error={firstError(errors, 'password')}>
        {(fp) => (
          <input
            {...fp}
            type="password"
            value={values.password}
            onChange={update('password')}
            placeholder="Leave blank to keep current"
            className={inputCls}
          />
        )}
      </Field>

      <Field label="Fullname" error={firstError(errors, 'name')}>
        {(fp) => (
          <input
            {...fp}
            type="text"
            value={values.fullName}
            onChange={update('fullName')}
            className={inputCls}
          />
        )}
      </Field>

      <Field label="Bio" error={firstError(errors, 'bio')}>
        {(fp) => (
          <textarea
            {...fp}
            rows={3}
            maxLength={1000}
            value={values.bio}
            onChange={update('bio')}
            placeholder="Tell others a little about yourself"
            className={`${inputCls} resize-none`}
          />
        )}
      </Field>

      <Field label="Banner color" error={firstError(errors, 'banner_color')}>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          {BANNER_PRESETS.map((c) => {
            const active = (values.bannerColor || '').toLowerCase() === c.toLowerCase();
            return (
              <button
                key={c}
                type="button"
                aria-label={`Banner color ${c}`}
                aria-pressed={active}
                onClick={() => setValue('bannerColor', c)}
                className={`h-7 w-7 rounded-full ring-offset-2 transition ${
                  active ? 'ring-2 ring-slate-700' : 'ring-1 ring-slate-200'
                }`}
                style={{ backgroundColor: c }}
              />
            );
          })}
          <label
            className="ml-1 inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-full border border-slate-200 px-2.5 text-xs text-slate-600"
            title="Custom color"
          >
            <span
              className="h-4 w-4 rounded-full ring-1 ring-slate-200"
              style={{ backgroundColor: values.bannerColor || '#5b7c99' }}
            />
            Custom
            <input
              type="color"
              value={/^#[0-9a-fA-F]{6}$/.test(values.bannerColor || '') ? values.bannerColor : '#5b7c99'}
              onChange={(e) => setValue('bannerColor', e.target.value)}
              className="sr-only"
            />
          </label>
        </div>
      </Field>

      <div className="flex gap-3">
        <div className="flex-1">
          <Field label="date of birth" error={firstError(errors, 'date_of_birth')}>
            {(fp) => (
              <div className="flex items-center">
                <input
                  {...fp}
                  type="date"
                  value={values.dateOfBirth}
                  onChange={update('dateOfBirth')}
                  className={`${inputCls} pr-2`}
                />
                <Calendar size={16} className="text-slate-500 shrink-0" />
              </div>
            )}
          </Field>
        </div>
        <div className="flex-1">
          <Field label="Gender" error={firstError(errors, 'gender')}>
            {(fp) => (
              <div className="relative">
                <select
                  {...fp}
                  value={values.gender}
                  onChange={update('gender')}
                  className={`${inputCls} appearance-none pr-6`}
                >
                  {(genderOptions.includes(values.gender) || !values.gender
                    ? genderOptions
                    : [values.gender, ...genderOptions]
                  ).map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                />
              </div>
            )}
          </Field>
        </div>
      </div>

      <div>
        <Button type="submit" loading={submitting} loadingLabel="Saving…" className="mt-3 px-6">
          Confirm
        </Button>
      </div>
    </form>
  );
};

export default ProfileForm;
