const defaultSteps = [
  "File Uploaded",
  "Data Cleaned",
  "Report Generated",
  "Email Sent",
  "History Saved",
];
export default function PipelineSteps({
  currentStep = 0,
  steps = defaultSteps,
}) {
  return (
    <div className="pipeline-steps">
      {steps.map((step, index) => (
        <div
          key={step}
          className={`pipeline-step ${index <= currentStep ? "done" : ""} ${index === currentStep ? "current" : ""}`}
        >
          <span>{index + 1}</span>
          <p>{step}</p>
        </div>
      ))}
    </div>
  );
}
