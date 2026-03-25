import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTranslations, setRequestLocale } from "next-intl/server";

const DATA_SOURCE_KEYS = [
  { key: "dsUrbanRenewal", records: "752", icon: "🔄" },
  { key: "dsConstructionSites", records: "10,440", icon: "🏗️" },
  { key: "dsHousingInventory", records: "1,112", icon: "📋" },
  { key: "dsMechir", records: "2,352", icon: "🏠" },
  { key: "dsPopulation", records: "1,284", icon: "👥" },
  { key: "dsBankBranches", records: "1,396", icon: "🏦" },
  { key: "dsGreenBuildings", records: "7,269", icon: "🌿" },
  { key: "dsBusStops", records: "33,927", icon: "🚌" },
  { key: "dsContaminated", records: "491", icon: "⚠️" },
  { key: "dsMunicipalFinances", records: "~5,000", icon: "💰" },
] as const;

export default async function MethodologyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("methodology");
  const tScores = await getTranslations("scores");

  const SUB_SCORES = [
    {
      nameKey: "development" as const,
      weightKey: "developmentWeight" as const,
      descKey: "developmentDesc" as const,
      metricKeys: [
        "developmentMetric1",
        "developmentMetric2",
        "developmentMetric3",
        "developmentMetric4",
      ] as const,
    },
    {
      nameKey: "demand" as const,
      weightKey: "demandWeight" as const,
      descKey: "demandDesc" as const,
      metricKeys: [
        "demandMetric1",
        "demandMetric2",
        "demandMetric3",
      ] as const,
    },
    {
      nameKey: "price" as const,
      weightKey: "priceWeight" as const,
      descKey: "priceDesc" as const,
      metricKeys: [
        "priceMetric1",
        "priceMetric2",
        "priceMetric3",
      ] as const,
    },
    {
      nameKey: "infrastructure" as const,
      weightKey: "infrastructureWeight" as const,
      descKey: "infrastructureDesc" as const,
      metricKeys: [
        "infrastructureMetric1",
        "infrastructureMetric2",
        "infrastructureMetric3",
      ] as const,
    },
    {
      nameKey: "municipal" as const,
      weightKey: "municipalWeight" as const,
      descKey: "municipalDesc" as const,
      metricKeys: [
        "municipalMetric1",
        "municipalMetric2",
        "municipalMetric3",
        "municipalMetric4",
      ] as const,
    },
    {
      nameKey: "environment" as const,
      weightKey: "environmentWeight" as const,
      descKey: "environmentDesc" as const,
      metricKeys: [
        "environmentMetric1",
        "environmentMetric2",
      ] as const,
    },
  ];

  return (
    <div className="space-y-4 md:space-y-6 lg:space-y-8 max-w-4xl w-full">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground mt-1">
          {t("subtitle")}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("investmentScore")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t.rich("scoreDesc", {
              b: (chunks) => <strong>{chunks}</strong>,
            })}
          </p>
          <div className="flex gap-2 flex-wrap">
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
              {t("scoreExcellent")}
            </span>
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {t("scoreGood")}
            </span>
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
              {t("scoreFair")}
            </span>
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
              {t("scoreLow")}
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-xl font-bold">{t("subScores")}</h2>
        {SUB_SCORES.map((sub) => (
          <Card key={sub.nameKey}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{tScores(sub.nameKey)}</CardTitle>
                <span className="text-sm font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">
                  {tScores(sub.weightKey)}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">{t(sub.descKey)}</p>
              <ul className="space-y-1">
                {sub.metricKeys.map((mKey) => (
                  <li key={mKey} className="text-sm flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {t(mKey)}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("dataSources")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            {t("dataSourcesDesc")}
          </p>
          <div className="space-y-2">
            {DATA_SOURCE_KEYS.map((ds) => (
              <div key={ds.key} className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm py-1.5 border-b last:border-0 gap-1">
                <span className="font-medium">
                  <span className="inline-block w-6 text-center me-1">{ds.icon}</span>
                  {t(ds.key)}
                </span>
                <span className="text-muted-foreground">{t("records", { count: ds.records })}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("limitations")}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>{t("limitationsDesc")}</p>
          <p>{t("limitationsPrice")}</p>
        </CardContent>
      </Card>
    </div>
  );
}
