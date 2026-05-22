import { useEffect, useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { fetchGenders } from '../../api/meta';
import Field from '../ui/Field';
import Button from '../ui/Button';

const firstError = (errors, key) => (Array.isArray(errors?.[key]) ? errors[key][0] : errors?.[key]);

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
