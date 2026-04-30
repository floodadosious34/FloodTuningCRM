interface FormFieldProps {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | number | null;
  required?: boolean;
  placeholder?: string;
  rows?: number;
  step?: string;
}

export function FormField({
  label,
  name,
  type = "text",
  defaultValue,
  required,
  placeholder,
  rows,
  step,
}: FormFieldProps) {
  const base =
    "w-full border border-stone-300 rounded-xl px-4 py-3 text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white placeholder-stone-400";

  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-stone-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {rows ? (
        <textarea
          id={name}
          name={name}
          rows={rows}
          defaultValue={defaultValue ?? ""}
          required={required}
          placeholder={placeholder}
          className={base}
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          defaultValue={defaultValue ?? ""}
          required={required}
          placeholder={placeholder}
          step={step}
          className={base}
        />
      )}
    </div>
  );
}
