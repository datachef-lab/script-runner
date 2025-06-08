import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, CheckCircle, XCircle } from "lucide-react";

// This would typically come from an API
const recentExecutions = [
  {
    id: 1,
    scriptName: "College Approval",
    status: "success",
    duration: "2m 30s",
    timestamp: "2024-03-20 14:30:00",
  },
  {
    id: 2,
    scriptName: "Web Scrape Marks",
    status: "error",
    duration: "1m 15s",
    timestamp: "2024-03-20 13:45:00",
  },
  {
    id: 3,
    scriptName: "Combine Marks",
    status: "success",
    duration: "45s",
    timestamp: "2024-03-20 12:30:00",
  },
];

export default function RootPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Script Runner Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor and manage your automation scripts
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold">Total Executions</h3>
          </div>
          <p className="mt-2 text-3xl font-bold">24</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <h3 className="font-semibold">Successful</h3>
          </div>
          <p className="mt-2 text-3xl font-bold">20</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500" />
            <h3 className="font-semibold">Failed</h3>
          </div>
          <p className="mt-2 text-3xl font-bold">4</p>
        </Card>
      </div>

      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold">Recent Executions</h2>
          <ScrollArea className="h-[400px]">
            <div className="mt-4 space-y-4">
              {recentExecutions.map((execution) => (
                <div
                  key={execution.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div>
                    <p className="font-medium">{execution.scriptName}</p>
                    <p className="text-sm text-muted-foreground">
                      {execution.timestamp}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                        execution.status === "success"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {execution.status === "success" ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                      {execution.status}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {execution.duration}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </Card>
    </div>
  );
}
