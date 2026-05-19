import { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { genderOptions } from '../../mocks/profile';

const FieldShell = ({ label, children }) => (
  <div className="relative w-full rounded-xl border border-[#5b7c99]/60 bg-white px-4 pt-2 pb-2">
    <span className="block text-[11px] font-semibold text-slate-800">{label}</span>
    {children}
  </div>
);

const ProfileForm = ({ initialValues, onConfirm }) => {
  const [values, setValues] = useState(initialValues);

  const update = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(values);
  };

  const inputCls =
    'w-full bg-transparent text-sm text-slate-700 focus:outline-none placeholder:text-slate-400';

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md flex flex-col gap-3">
      <FieldShell label="Email">
        <input
          type="email"
          value={values.email}
          onChange={update('email')}
          className={inputCls}
        />
      </FieldShell>

      <FieldShell label="Password">
        <input
          type="password"
          value={values.password}
          onChange={update('password')}
          className={inputCls}
        />
      </FieldShell>

      <FieldShell label="Fullname">
        <input
          type="text"
          value={values.fullName}
          onChange={update('fullName')}
          className={inputCls}
        />
      </FieldShell>

      <div className="flex gap-3">
        <div className="flex-1">
          <FieldShell label="date of birth">
            <div className="flex items-center">
              <input
                type="date"
                value={values.dateOfBirth}
                onChange={update('dateOfBirth')}
                className={`${inputCls} pr-2`}
              />
              <Calendar size={16} className="text-slate-500 shrink-0" />
            </div>
          </FieldShell>
        </div>
        <div className="flex-1">
          <FieldShell label="Gender">
            <div className="relative">
              <select
                value={values.gender}
                onChange={update('gender')}
                className={`${inputCls} appearance-none pr-6`}
              >
                {genderOptions.map((g) => (
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
          </FieldShell>
        </div>
      </div>

      <div>
        <button
          type="submit"
          className="mt-3 px-6 py-2 rounded-lg bg-[#5b7c99] text-white text-sm font-medium hover:bg-[#4a6a85]"
        >
          Confirm
        </button>
      </div>
    </form>
  );
};

export default ProfileForm;
