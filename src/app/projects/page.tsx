import { fetchAllRecords } from "@/lib/ckan/client";
import { RESOURCE_IDS } from "@/config/datasets";
import { safeNumber, safeTrim } from "@/lib/data/normalizers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const revalidate = 300;

export default async function ProjectsPage() {
  let renewalProjects: Array<Record<string, unknown>> = [];
  let error: string | null = null;

  try {
    renewalProjects = await fetchAllRecords(RESOURCE_IDS.urbanRenewal);
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load projects";
  }

  // Group by status
  const inExecution = renewalProjects.filter(
    (r) => safeTrim(r["Bebitzua"]) === "כן"
  );
  const total = renewalProjects.length;
  const totalAdditionalUnits = renewalProjects.reduce(
    (sum, r) => sum + safeNumber(r["YachadTosafti"]),
    0
  );

  return (
    <div className="space-y-4 md:space-y-6 lg:space-y-8">
      <div>
        <h1 className="text-2xl md:text-xl md:text-2xl font-bold tracking-tight">Urban Renewal Projects</h1>
        <p className="text-muted-foreground mt-1">
          Browse all {total} urban renewal projects across Israel
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <p className="font-medium text-destructive">{error}</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Total Projects</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl md:text-2xl font-bold">{total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">In Execution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl md:text-2xl font-bold text-emerald-600">
                  {inExecution.length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Additional Units</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl md:text-2xl font-bold">
                  {totalAdditionalUnits.toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {renewalProjects.slice(0, 30).map((project, i) => {
              const city = safeTrim(project["Yeshuv"]);
              const existing = safeNumber(project["YachadKayam"]);
              const additional = safeNumber(project["YachadTosafti"]);
              const status = safeTrim(project["Status"]);
              const track = safeTrim(project["Maslul"]);
              const isActive = safeTrim(project["Bebitzua"]) === "כן";

              return (
                <Card key={i} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{city}</CardTitle>
                      {isActive && (
                        <Badge variant="default" className="bg-emerald-600">
                          Active
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Existing units:</span>
                      <span className="font-medium">{existing.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Additional units:</span>
                      <span className="font-medium text-emerald-600">
                        +{additional.toLocaleString()}
                      </span>
                    </div>
                    {track && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Track:</span>
                        <span className="font-medium">{track}</span>
                      </div>
                    )}
                    {status && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <span className="font-medium text-xs">{status}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {renewalProjects.length > 30 && (
            <p className="text-sm text-muted-foreground text-center">
              Showing 30 of {renewalProjects.length} projects
            </p>
          )}
        </>
      )}
    </div>
  );
}
