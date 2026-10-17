import { AlertCircle, CheckCircle2, LoaderCircle, X } from "lucide-react";

export default function ProcessingNotifications({ notifications, onDismiss }) {
  return (
    <div aria-label="Knowledge processing notifications" aria-live="polite" aria-relevant="additions"
      className="pointer-events-none fixed right-4 top-4 z-[60] flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-sm flex-col gap-3 overflow-y-auto">
      {notifications.map(({ id, status, message }) => {
        const failed = status === "failed";
        const processing = status === "processing";
        const Icon = processing ? LoaderCircle : failed ? AlertCircle : CheckCircle2;
        return (
          <div key={id} role="status"
            className="processing-notification pointer-events-auto flex shrink-0 items-start gap-3 rounded-xl border border-border-strong bg-surface-primary p-4 text-text-primary shadow-xl motion-reduce:animate-none">
            <Icon aria-hidden="true" className={`mt-0.5 h-5 w-5 shrink-0 ${processing ? "animate-spin text-accent-sky" : failed ? "text-rose-400" : "text-emerald-500"}`} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{processing ? "Saving to memory…" : failed ? "Knowledge processing failed" : "Knowledge ready"}</p>
              <p className="mt-1 break-words text-xs leading-relaxed text-text-secondary">{message}</p>
            </div>
            <button type="button" onClick={() => onDismiss(id)} aria-label="Dismiss notification"
              className="shrink-0 rounded-md p-1 text-text-muted transition-colors hover:bg-surface-secondary hover:text-text-primary focus-visible:outline-2 focus-visible:outline-accent-sky">
              <X aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
