import type { ReactNode } from 'react';

type FieldShellProps = { name: string; label: string; error?: string; children: ReactNode };

function FieldShell({ name, label, error, children }: FieldShellProps) {
  return (
    <div className={`field${error ? ' field--error' : ''}`}>
      <label htmlFor={name}>{label}</label>
      {children}
      {error && (
        <span id={`${name}-error`} className="field__error">
          {error}
        </span>
      )}
    </div>
  );
}

type TextFieldProps = {
  name: string;
  label: string;
  defaultValue?: string;
  error?: string;
  type?: 'text' | 'email' | 'tel';
  multiline?: boolean;
  placeholder?: string;
  autoComplete?: string;
};

export function TextField({
  name,
  label,
  defaultValue = '',
  error,
  type = 'text',
  multiline = false,
  placeholder,
  autoComplete,
}: TextFieldProps) {
  const shared = {
    id: name,
    name,
    defaultValue,
    placeholder,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? `${name}-error` : undefined,
  };

  return (
    <FieldShell name={name} label={label} error={error}>
      {multiline ? (
        <textarea {...shared} rows={3} />
      ) : (
        <input {...shared} type={type} autoComplete={autoComplete} />
      )}
    </FieldShell>
  );
}

type SelectFieldProps = {
  name: string;
  label: string;
  options: readonly { value: string; label: string }[];
  defaultValue?: string;
  error?: string;
};

export function SelectField({ name, label, options, defaultValue, error }: SelectFieldProps) {
  return (
    <FieldShell name={name} label={label} error={error}>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${name}-error` : undefined}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}
