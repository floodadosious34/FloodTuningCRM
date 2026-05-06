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
  const inputClass =
    "w-full bg-zinc-950 border-0 px-4 pt-1 pb-3 text-zinc-100 outline-none text-sm placeholder-zinc-700 focus:ring-0";

  return (
    <div className="border border-zinc-800">
      <label htmlFor={name} className="block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 px-4 pt-3">
        {label}
        {required && <span className="text-red-600 ml-1">*</span>}
      </label>
      {rows ? (
        <textarea
          id={name}
          name={name}
          rows={rows}
          defaultValue={defaultValue ?? ""}
          required={required}
          placeholder={placeholder}
          className={inputClass}
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
          className={inputClass}
        />
      )}
    </div>
  );
}
