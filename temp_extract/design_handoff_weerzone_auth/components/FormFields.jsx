// Form field primitives
function TextField({ label, type='text', value, onChange, placeholder, error, hint, autoFocus, autoComplete }) {
  return (
    <div className="field">
      {label && <label>{label}</label>}
      <input
        className={`input ${error ? 'error' : ''}`}
        type={type}
        value={value || ''}
        onChange={e => onChange && onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        autoComplete={autoComplete}
      />
      {error && <div className="err">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5"/><path d="M7 4v3.5M7 9.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
        {error}
      </div>}
      {!error && hint && <div className="hint">{hint}</div>}
    </div>
  );
}

function PasswordField({ label, value, onChange, placeholder, error, showStrength, autoComplete }) {
  const [shown, setShown] = React.useState(false);
  const strength = React.useMemo(() => {
    if (!value) return 0;
    let s = 0;
    if (value.length >= 8) s++;
    if (/[A-Z]/.test(value)) s++;
    if (/\d/.test(value)) s++;
    if (/[^A-Za-z0-9]/.test(value)) s++;
    return s;
  }, [value]);
  const labels = ['', 'Zwak', 'Redelijk', 'Sterk', 'Zeer sterk'];

  return (
    <div className="field">
      {label && <label>{label}</label>}
      <div className="input-wrap">
        <input
          className={`input ${error ? 'error' : ''}`}
          type={shown ? 'text' : 'password'}
          value={value || ''}
          onChange={e => onChange && onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete || 'current-password'}
        />
        <button type="button" className="icon-btn" onClick={() => setShown(s => !s)} aria-label={shown ? 'Verberg wachtwoord' : 'Toon wachtwoord'}>
          {shown ? (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 2l14 14M7.5 7.5a2 2 0 0 0 2.8 2.8M4.6 4.6C3.1 5.7 2 7.3 1.5 9c1 2.8 3.9 5 7.5 5 1.3 0 2.5-.3 3.5-.8M14.5 12A8.8 8.8 0 0 0 16.5 9C15.5 6.2 12.6 4 9 4c-.9 0-1.7.1-2.5.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M1.5 9s2.7-5 7.5-5 7.5 5 7.5 5-2.7 5-7.5 5S1.5 9 1.5 9z" stroke="currentColor" strokeWidth="1.5"/><circle cx="9" cy="9" r="2" stroke="currentColor" strokeWidth="1.5"/></svg>
          )}
        </button>
      </div>
      {showStrength && value && (
        <>
          <div className={`pw-meter s${strength}`}>
            <span/><span/><span/><span/>
          </div>
          <div className="pw-label">Wachtwoord sterkte: <strong>{labels[strength] || 'Erg zwak'}</strong></div>
        </>
      )}
      {error && <div className="err">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5"/><path d="M7 4v3.5M7 9.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
        {error}
      </div>}
    </div>
  );
}

function Checkbox({ checked, onChange, children }) {
  return (
    <label className="checkbox">
      <input type="checkbox" checked={!!checked} onChange={e => onChange && onChange(e.target.checked)} />
      <span>{children}</span>
    </label>
  );
}

Object.assign(window, { TextField, PasswordField, Checkbox });
