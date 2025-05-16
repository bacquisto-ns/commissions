import { AgencyCommissionReport } from "@/components/agency-commission-report";

export default function AgencyReports() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Agency Commission Reports</h1>
        <p className="text-sm text-muted-foreground mt-1">
          View detailed commission reports by agency
        </p>
      </div>
      
      <AgencyCommissionReport />
    </div>
  );
}