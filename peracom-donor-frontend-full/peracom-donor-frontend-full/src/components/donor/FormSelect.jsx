function FormSelect({ label, error, options = [], className = '', ...props }) {
  return (
    <div className={`form-group ${className}`.trim()}>
      {label && <label className="form-label">{label}</label>}
      <select className={`form-control ${error ? 'input-error' : ''}`} {...props}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <small className="field-error">{error}</small>}
    </div>
  );
}

export default FormSelect;
