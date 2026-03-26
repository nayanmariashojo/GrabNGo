import { useEffect, useState } from "react";

/**
 * Alert banner — auto-dismisses after `duration` ms.
 *
 * @param {"success"|"error"|"info"} type
 * @param {string} message
 * @param {function} onClose
 * @param {number} duration — ms before auto-dismiss (default 4000)
 */
export default function Alert({ type = "info", message, onClose, duration = 4000 }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onClose?.();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!visible || !message) return null;

  const colors = {
    success: "bg-green-100 text-green-800 border-green-300",
    error: "bg-red-100 text-red-800 border-red-300",
    info: "bg-blue-100 text-blue-800 border-blue-300",
  };

  return (
    <div
      className={`mb-4 rounded-lg border px-4 py-3 text-sm ${colors[type] || colors.info}`}
      role="alert"
    >
      {message}
    </div>
  );
}


