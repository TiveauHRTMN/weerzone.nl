"use client";

import { useId, useMemo, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { AlertCircle, Eye, EyeOff } from "lucide-react";

function FieldShell({
  label,
  error,
  hint,
  children,
  htmlFor,
}: {
  label?: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="mb-3.5">
      {label && (
        <label
          htmlFor={htmlFor}
          className="block text-[13px] font-bold mb-1.5"
          style={{ color: "var(--wz-text)" }}
        >
          {label}
        </label>
      )}
      {children}
      {error ? (
        <div
          className="mt-1.5 flex items-center gap-1.5 text-xs"
          style={{ color: "var(--wz-danger)" }}
        >
          <AlertCircle className="w-3.5 h-3.5" />
          {error}
        </div>
      ) : hint ? (
        <div className="mt-1.5 text-xs" style={{ color: "var(--wz-text-mute)" }}>
          {hint}
        </div>
      ) : null}
    </div>
  );
}

type BaseInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "type">;

export function WzTextField({
  label,
  value,
  onChange,
  error,
  hint,
  type = "text",
  ...rest
}: BaseInputProps & {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  hint?: string;
  type?: "text" | "email" | "tel" | "url";
}) {
  const id = useId();
  return (
    <FieldShell label={label} error={error} hint={hint} htmlFor={id}>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="wz-input"
        style={error ? { borderColor: "var(--wz-danger)" } : undefined}
        {...rest}
      />
    </FieldShell>
  );
}

export function WzPasswordField({
  label,
  value,
  onChange,
  error,
  hint,
  showStrength = false,
  autoComplete = "current-password",
  ...rest
}: BaseInputProps & {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  hint?: string;
  showStrength?: boolean;
  autoComplete?: string;
}) {
  const id = useId();
  const [shown, setShown] = useState(false);
  const strength = useMemo(() => {
    if (!value) return 0;
    let s = 0;
    if (value.length >= 8) s++;
    if (/[A-Z]/.test(value)) s++;
    if (/\d/.test(value)) s++;
    if (/[^A-Za-z0-9]/.test(value)) s++;
    return s;
  }, [value]);
  const labels = ["", "Zwak", "Redelijk", "Sterk", "Zeer sterk"];
  const colors = ["var(--ink-200)", "#d93b3b", "#e08a2a", "#b5a018", "var(--wz-success)"];

  return (
    <FieldShell label={label} error={error} hint={hint} htmlFor={id}>
      <div className="relative">
        <input
          id={id}
          type={shown ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          className="wz-input"
          style={{
            paddingRight: 44,
            ...(error ? { borderColor: "var(--wz-danger)" } : {}),
          }}
          {...rest}
        />
        <button
          type="button"
          onClick={() => setShown((v) => !v)}
          aria-label={shown ? "Verberg wachtwoord" : "Toon wachtwoord"}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex items-center justify-center p-2 rounded-lg bg-transparent border-0 cursor-pointer hover:bg-[var(--ink-100)]"
          style={{ color: "var(--wz-text-mute)" }}
        >
          {shown ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
        </button>
      </div>
      {showStrength && value && (
        <>
          <div className="flex gap-1 mt-2">
            {[1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className="flex-1 h-1 rounded-full transition-colors"
                style={{
                  background:
                    strength >= i
                      ? strength === 4
                        ? colors[4]
                        : colors[strength]
                      : "var(--ink-200)",
                }}
              />
            ))}
          </div>
          <div className="text-xs mt-1.5" style={{ color: "var(--wz-text-mute)" }}>
            Wachtwoord sterkte:{" "}
            <strong style={{ color: "var(--wz-text)", fontWeight: 700 }}>
              {labels[strength] || "Erg zwak"}
            </strong>
          </div>
        </>
      )}
    </FieldShell>
  );
}

export function WzCheckbox({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: ReactNode;
}) {
  return (
    <label
      className="flex items-start gap-2.5 text-sm cursor-pointer leading-[1.5]"
      style={{ color: "var(--wz-text-soft)" }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 w-[18px] h-[18px]"
        style={{ accentColor: "var(--wz-brand)" }}
      />
      <span>{children}</span>
    </label>
  );
}

export function WzDivider({ children = "of" }: { children?: ReactNode }) {
  return <div className="wz-divider">{children}</div>;
}

export function WzSocialButtons({
  onGoogle,
  onApple,
  loading = false,
}: {
  onGoogle?: () => void;
  onApple?: () => void;
  loading?: boolean;
}) {
  return (
    <div className="grid gap-2.5">
      {onGoogle && (
        <button
          type="button"
          onClick={onGoogle}
          disabled={loading}
          className="wz-btn wz-btn-ghost wz-btn-block disabled:opacity-60"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.17-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
            <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.02-3.7H.92v2.33A9 9 0 0 0 9 18z" />
            <path fill="#FBBC05" d="M3.98 10.72A5.41 5.41 0 0 1 3.68 9c0-.6.1-1.18.3-1.72V4.95H.92A9 9 0 0 0 0 9c0 1.45.35 2.82.92 4.05l3.06-2.33z" />
            <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .92 4.95L3.98 7.28C4.68 5.16 6.66 3.58 9 3.58z" />
          </svg>
          Ga verder met Google
        </button>
      )}
      {onApple && (
        <button
          type="button"
          onClick={onApple}
          disabled={loading}
          className="wz-btn wz-btn-ghost wz-btn-block disabled:opacity-60"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path fill="#000" d="M14.94 13.86c-.27.62-.58 1.18-.95 1.7-.5.7-.91 1.19-1.23 1.46-.5.43-1.03.65-1.6.67-.4 0-.9-.12-1.47-.35-.58-.23-1.1-.35-1.59-.35-.5 0-1.05.12-1.63.35-.59.23-1.06.35-1.42.37-.55.02-1.09-.21-1.63-.69-.34-.29-.78-.8-1.3-1.52C1.54 14.7 1.08 13.8.7 12.78.3 11.68.1 10.62.1 9.6c0-1.17.25-2.18.76-3.03.4-.68.93-1.22 1.6-1.61.65-.4 1.37-.6 2.13-.61.43 0 1 .13 1.72.4.71.26 1.17.39 1.37.39.15 0 .66-.16 1.52-.46.82-.28 1.51-.4 2.08-.35 1.53.12 2.68.73 3.44 1.82-1.37.83-2.05 1.99-2.03 3.48.02 1.16.44 2.13 1.26 2.89.37.36.78.63 1.24.83-.1.29-.2.57-.31.84zM11.78.36c0 .88-.32 1.7-.96 2.46-.77.9-1.7 1.42-2.71 1.34a2.73 2.73 0 0 1-.02-.33c0-.84.37-1.74 1.03-2.48.33-.38.74-.69 1.25-.94.5-.24.97-.38 1.42-.4.01.12.01.24 0 .35z" />
          </svg>
          Ga verder met Apple
        </button>
      )}
    </div>
  );
}
