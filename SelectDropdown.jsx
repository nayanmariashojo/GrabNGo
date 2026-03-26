/**
 * SelectDropdown — labeled select dropdown with options.
 * @param {string} label
 * @param {Array} options — [{ value, label, disabled? }]
 * @param {string} error
 * @param {string} placeholder
 */
export default function SelectDropdown({ label, options = [], error, placeholder, id, className = '', ...rest }) {
  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <select
        id={id}
        className={`w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
          error ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
        }`}
        {...rest}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}


