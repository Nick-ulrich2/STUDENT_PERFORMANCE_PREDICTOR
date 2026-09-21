type SpinnerProps = {
  size?: number;
  label?: string;
};

export function Spinner({ size = 20, label }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-live="polite"
      className="inline-flex items-center gap-2 text-sm text-navy"
    >
      <span
        className="inline-block animate-spin rounded-full border-2 border-line border-t-navy"
        style={{ width: size, height: size }}
        aria-hidden="true"
      />
      {label && <span>{label}</span>}
    </span>
  );
}
