import api from "../api/axios";
export function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
export function formatNumber(value) {
  return new Intl.NumberFormat("en-IN").format(value || 0);
}
export function getErrorMessage(error) {
  const detail = error?.response?.data?.detail;
  if (Array.isArray(detail)) return detail.map((item) => item.msg).join(", ");
  return (
    detail ||
    error?.response?.data?.message ||
    error.message ||
    "Something went wrong"
  );
}
export function getSessionId() {
  const key = "noctragrid_anonymous_session_id";
  let sessionId = localStorage.getItem(key);
  if (!sessionId) {
    sessionId = crypto?.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    localStorage.setItem(key, sessionId);
  }
  return sessionId;
}
export async function downloadReportFile(reportId, type) {
  const response = await api.get(`/api/reports/${reportId}/download/${type}`, {
    responseType: "blob",
  });
  const extension = type === "excel" ? "xlsx" : type;
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `noctragrid-report-${reportId}.${extension}`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
