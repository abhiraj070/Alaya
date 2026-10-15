export default function AlayaWordmark({ className = "" }) {
  return (
    <span className={`inline-flex items-center uppercase ${className}`}>
      <span className="text-accent-sky">
        A
      </span>
      <span
        data-wordmark-char="text"
        className="text-black dark:text-white"
        style={{ color: "var(--text-primary, #000000)" }}
      >
        L
      </span>
      <span className="text-accent-sky">
        A
      </span>
      <span
        data-wordmark-char="text"
        className="text-black dark:text-white"
        style={{ color: "var(--text-primary, #000000)" }}
      >
        Y
      </span>
      <span className="text-accent-sky">
        A
      </span>
    </span>
  );
}
