export default function Input({ label, name, id = name, type = "text", textarea = false, error, ...props }) {
  const kelas =
    "w-full rounded-lg border border-garis bg-latar px-3 py-2.5 text-base text-teks placeholder:text-teks-lembut focus:border-utama focus:outline-none";

  return (
    <label className="flex flex-col gap-1.5 text-sm font-semibold">
      {label}
      {textarea ? (
        <textarea id={id} name={name} rows={4} className={kelas} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} {...props} />
      ) : (
        <input id={id} name={name} type={type} className={kelas} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} {...props} />
      )}
      {error ? <span id={`${id}-error`} className="text-sm font-normal text-bahaya">{error}</span> : null}
    </label>
  );
}
