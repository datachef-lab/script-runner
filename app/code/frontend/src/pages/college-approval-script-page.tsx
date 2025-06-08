import { ScriptLayout } from "@/components/layouts/script-layout";

export default function CollegeApprovalScriptPage() {
  return (
    <ScriptLayout
      title="College Approval Script"
      description="Automates the process of approving college applications by processing and validating application data."
      scriptName="college-approval"
      templateUrl="/templates/college-approval-template.xlsx"
      steps={[
        "Download the template file using the 'Download Template' button",
        "Fill in the required information in the template",
        "Save the file in Excel format (.xlsx)",
        "Upload the filled template using the file input above",
        "Click 'Run Script' to process the applications",
        "Monitor the progress in the output panel",
        "The script will validate and process each application automatically"
      ]}
    />
  );
}
