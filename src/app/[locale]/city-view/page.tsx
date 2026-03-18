import { Suspense } from "react";
import { getAllCityProfiles } from "@/lib/data/aggregator";
import { CityViewClient } from "@/components/city-view/CityViewClient";
import { getTranslations, setRequestLocale } from "next-intl/server";

export const revalidate = 300;

export default async function CityViewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("cityView");

  const profiles = await getAllCityProfiles();

  // Sort by investment score descending – pass full profiles so
  // the client can render all stat cards without an extra API call.
  const cities = [...profiles].sort(
    (a, b) => b.investmentScore - a.investmentScore
  );

  return (
    <div className="space-y-4 md:space-y-6 lg:space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground mt-1">
          {t("subtitle")}
        </p>
      </div>
      <Suspense>
        <CityViewClient cities={cities} />
      </Suspense>
    </div>
  );
}
