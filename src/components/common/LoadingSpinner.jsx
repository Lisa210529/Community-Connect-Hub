export default function LoadingSpinner({ fullPage = false }) {
  const wrapperClass = fullPage
    ? 'd-flex align-items-center justify-content-center min-vh-100'
    : 'd-flex justify-content-center p-4';

  return (
    <div className={wrapperClass}>
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );
}
