function FormInput({ label, error, className = '', ...props }) {
  return (
    <div className={`form-group ${className}`.trim()}>
      {label && <label className="form-label">{label}</label>}
      <input className={`form-control ${error ? 'input-error' : ''}`} {...props} />
      {error && <small className="field-error">{error}</small>}
    </div>
  );
}

export default FormInput;
