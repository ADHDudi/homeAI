import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SUB_SCORES = [
  {
    name: "Development Momentum",
    weight: "25%",
    description: "Measures active construction and urban renewal activity",
    metrics: [
      "Urban renewal projects per capita",
      "Additional housing units from renewal",
      "Active construction sites",
      "Housing inventory pipeline",
    ],
  },
  {
    name: "Demand Signal",
    weight: "20%",
    description: "Indicates market demand for housing in the city",
    metrics: [
      "Mechir LaMishtaken subscriber/winner ratio",
      "Young adult (19-45) population ratio",
      "Population size (growth proxy)",
    ],
  },
  {
    name: "Price Attractiveness",
    weight: "20%",
    description: "Lower prices relative to national and district medians score higher",
    metrics: [
      "Average price per m² (inverted - lower is better)",
      "Compared against national median",
      "Compared against district median",
    ],
  },
  {
    name: "Infrastructure",
    weight: "15%",
    description: "Quality of transit, financial services, and sustainable building",
    metrics: [
      "Bus stops per capita",
      "Bank branches per capita",
      "Green buildings count and avg certification score",
    ],
  },
  {
    name: "Municipal Health",
    weight: "10%",
    description: "Financial health based on budget balance, debt levels, and fiscal capacity from Ministry of Interior data",
    metrics: [
      "Budget surplus/deficit ratio (40%)",
      "Debt-to-income ratio — inverted, lower debt is better (30%)",
      "Per-capita municipal income (30%)",
      "Falls back to population proxy when finance data unavailable",
    ],
  },
  {
    name: "Environment",
    weight: "10%",
    description: "Environmental risk assessment",
    metrics: [
      "Contaminated sites (fewer is better)",
      "Remediation progress",
    ],
  },
];

const DATA_SOURCES = [
  { name: "Urban Renewal Projects", source: "data.gov.il", records: "752" },
  { name: "Construction Sites", source: "data.gov.il", records: "10,440" },
  { name: "Housing Inventory", source: "data.gov.il", records: "1,112" },
  { name: "Mechir LaMishtaken", source: "data.gov.il", records: "2,352" },
  { name: "Population & Demographics", source: "data.gov.il", records: "1,284" },
  { name: "Bank Branches", source: "data.gov.il", records: "1,396" },
  { name: "Green Buildings", source: "data.gov.il", records: "7,269" },
  { name: "Bus Stops", source: "data.gov.il", records: "33,927" },
  { name: "Contaminated Land", source: "data.gov.il", records: "491" },
  { name: "Municipal Finances", source: "data.gov.il", records: "~5,000" },
];

export default function MethodologyPage() {
  return (
    <div className="space-y-4 md:space-y-6 lg:space-y-8 max-w-4xl w-full">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Methodology</h1>
        <p className="text-muted-foreground mt-1">
          How we calculate the Investment Score
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Investment Score (0-100)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Each city receives a composite score from 0 to 100 based on six weighted sub-scores.
            All metrics use <strong>percentile ranking</strong> across all Israeli cities with
            population above 5,000, ensuring relative comparison rather than absolute thresholds.
          </p>
          <div className="flex gap-2 flex-wrap">
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
              75-100 Excellent
            </span>
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              60-74 Good
            </span>
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
              45-59 Fair
            </span>
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
              0-44 Low
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-xl font-bold">Sub-Scores</h2>
        {SUB_SCORES.map((sub) => (
          <Card key={sub.name}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{sub.name}</CardTitle>
                <span className="text-sm font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">
                  {sub.weight}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">{sub.description}</p>
              <ul className="space-y-1">
                {sub.metrics.map((m) => (
                  <li key={m} className="text-sm flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {m}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Data Sources</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            All data is sourced from the Israeli government open data portal (data.gov.il)
            and fetched in real-time via the CKAN API.
          </p>
          <div className="space-y-2">
            {DATA_SOURCES.map((ds) => (
              <div key={ds.name} className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm py-1.5 border-b last:border-0 gap-1">
                <span className="font-medium">{ds.name}</span>
                <span className="text-muted-foreground">{ds.records} records</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Limitations</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            This tool is for informational purposes only and should not be the sole basis for
            investment decisions. The score reflects data availability and may not capture all
            relevant factors.
          </p>
          <p>
            Price data is only available for cities with Mechir LaMishtaken (government pricing)
            programs. Municipal finance data may not be available for all localities.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
