import { getAllCityProfiles } from "@/lib/data/aggregator";
import { CompareClient } from "@/components/compare/CompareClient";

export const dynamic = "force-dynamic";

export default async function ComparePage() {
  const profiles = await getAllCityProfiles();

  const cities = profiles
    .map((p) => ({
      cityName: p.cityName,
      cityCode: p.cityCode,
      district: p.district,
      population: p.population,
      investmentScore: p.investmentScore,
      scoreBreakdown: p.scoreBreakdown,
      urbanRenewalProjects: p.urbanRenewalProjects,
      urbanRenewalUnitsAdditional: p.urbanRenewalUnitsAdditional,
      urbanRenewalInExecution: p.urbanRenewalInExecution,
      constructionSites: p.constructionSites,
      constructionWithCranes: p.constructionWithCranes,
      housingInventoryUnits: p.housingInventoryUnits,
      mechirLaMishtakenAvgPricePerMeter: p.mechirLaMishtakenAvgPricePerMeter,
      mechirLaMishtakenProjects: p.mechirLaMishtakenProjects,
      subscriberToWinnerRatio: p.subscriberToWinnerRatio,
      busStopCount: p.busStopCount,
      bankBranchCount: p.bankBranchCount,
      greenBuildingCount: p.greenBuildingCount,
      contaminatedSiteCount: p.contaminatedSiteCount,
      youngAdultRatio: p.youngAdultRatio,
      municipalBudgetSurplus: p.municipalBudgetSurplus,
      municipalTotalIncome: p.municipalTotalIncome,
      municipalTotalExpenses: p.municipalTotalExpenses,
      municipalLoanBurden: p.municipalLoanBurden,
    }))
    .sort((a, b) => b.investmentScore - a.investmentScore);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Compare Cities</h1>
        <p className="text-muted-foreground mt-1">
          Side-by-side comparison of investment metrics
        </p>
      </div>
      <CompareClient cities={cities} />
    </div>
  );
}
