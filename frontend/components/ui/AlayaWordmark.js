export default function AlayaWordmark({ className = "" }) {
  return (
    <span
      className={`inline-flex items-center uppercase font-garamond ${className}`}
      style={{ fontFamily: '"EB Garamond", Garamond, "Baskerville", "Times New Roman", serif' }}
    >
      <span className="text-accent-sky">
        A
      </span>
      <span
        data-wordmark-char="text"
        className="text-text-primary text-black dark:text-white"
      >
        L
      </span>
      <span className="text-accent-sky">
        A
      </span>
      <span
        data-wordmark-char="text"
        className="text-text-primary text-black dark:text-white"
      >
        Y
      </span>
      <span className="text-accent-sky">
        A
      </span>
    </span>
  );
}
