/**
 * @file src/lib/dira/client.test.ts
 *
 * Unit tests for fetchAllDiraProjects.
 *
 * Strategy: mock global fetch so every code path in diraRequest and
 * fetchAllDiraProjects can be exercised without network access.
 * Real timers are used — fetch resolves synchronously via mocks, so
 * the 30 s timeout timer never fires.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchAllDiraProjects } from "./client";
import type { DiraApiResponse, DiraProject } from "./types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Builds a minimal valid DiraProject stub. */
function makeProject(n: number): DiraProject {
  return {
    LotteryNumber: `L${n}`,
    ProjectNumber: `P${n}`,
    ProjectName: `Project ${n}`,
    CityCode: 1000 + n,
    CityDescription: `City ${n}`,
    NeighborhoodName: "",
    ContractorDescription: "",
    ContractorCode: 0,
    ApplicationStartDate: "2025-01-01T00:00:00",
    ApplicationEndDate: "2025-02-01T00:00:00",
    LotteryDate: null,
    PricePerUnit: 1_000_000,
    GrantSize: 0,
    HousingUnits: 10,
    TargetHousingUnits: 10,
    LotteryApparmentsNum: 10,
    LocalHousing: 0,
    IsLotteryHeld: false,
    StageCode: 1,
    LotteryType: 1,
    ProcessName: "",
    PermitStatus: "",
    EntitlementCode: 1,
    EntitlementDescription: "",
    Entitlement: "",
    TotalSubscribers: 100,
    TotalLocalSubscribers: 10,
    TotalHandicappedSubscribers: 0,
    TotalReservedDutySubscribers: 0,
    TotalCombatReservistSubscribers: 0,
    TotalSubscribersStagesHomeless: 0,
    TotalLocalSubscribersStagesHomeless: 0,
    TotalHandicappedSubscribersStagesHomeless: 0,
    TotalReservedDutySubscribersStagesHomeless: 0,
    TotalCombatReservistSubscribersStagesHomeless: 0,
    SeriesTypeOfStageHomeless: "",
    TotalSubscribersStagesImprovehousing: 0,
    TotalLocalSubscribersStagesImprovehousing: 0,
    TotalHandicappedSubscribersStagesImprovehousing: 0,
    TotalReservedDutySubscribersStagesImprovehousing: 0,
    TotalCombatReservistSubscribersStagesImprovehousing: 0,
    SeriesTypeOfStageImprovehousing: "",
    ResponsibilityDescription: "",
    ControlCompanyDescription: "",
    RegulationsVersion: "",
    Notes: null,
    OriginalLottery: 0,
    TenderName: "",
    IsPreferenceForHandicapped: false,
    HousingUnitsForHandicapped: 0,
    HU_Reservists_L: 0,
    HU_CombatReservist_L: 0,
    CountProjects: 1,
    OpenLotteriesCount: 1,
  };
}

/** Builds a mock fetch Response returning the given DiraApiResponse body. */
function okResponse(body: Partial<DiraApiResponse>): Response {
  return {
    ok: true,
    status: 200,
    statusText: "OK",
    json: async () => body,
  } as unknown as Response;
}

/** Builds a mock fetch Response with the given HTTP error status. */
function errResponse(status: number): Response {
  return {
    ok: false,
    status,
    statusText: "Error",
    json: async () => ({}),
  } as unknown as Response;
}

/** Builds a single-page happy-path DiraApiResponse. */
function singlePageResponse(items: DiraProject[]): Partial<DiraApiResponse> {
  return {
    ActionStatus: 0,
    NumOfRecords: items.length,
    ProjectItems: items,
    IsAll: true,
    Messages: [],
  };
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Happy path
// ---------------------------------------------------------------------------

describe("fetchAllDiraProjects — happy path", () => {
  it("returns all projects from a single-page response (IsAll=true)", async () => {
    const projects = [makeProject(1), makeProject(2), makeProject(3)];
    vi.mocked(fetch).mockResolvedValueOnce(okResponse(singlePageResponse(projects)));

    const result = await fetchAllDiraProjects();

    expect(result).toHaveLength(3);
    expect(result[0].ProjectNumber).toBe("P1");
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("paginates across multiple pages until allProjects.length >= total", async () => {
    const page1Items = [makeProject(1), makeProject(2)];
    const page2Items = [makeProject(3), makeProject(4)];

    vi.mocked(fetch)
      .mockResolvedValueOnce(
        okResponse({
          ActionStatus: 0,
          NumOfRecords: 4,
          ProjectItems: page1Items,
          IsAll: false,
          Messages: [],
        })
      )
      .mockResolvedValueOnce(
        okResponse({
          ActionStatus: 0,
          NumOfRecords: 4,
          ProjectItems: page2Items,
          IsAll: false,
          Messages: [],
        })
      );

    const result = await fetchAllDiraProjects();

    expect(result).toHaveLength(4);
    expect(fetch).toHaveBeenCalledTimes(2);
    // The `param` query string is percent-encoded — decode before asserting
    const secondCallUrl = decodeURIComponent(vi.mocked(fetch).mock.calls[1][0] as string);
    expect(secondCallUrl).toContain("PageNumber=2");
    expect(secondCallUrl).toContain("IsInit=false");
  });

  it("stops early when IsAll=true even if allProjects.length < NumOfRecords", async () => {
    // API signals IsAll=true — trust it over NumOfRecords
    vi.mocked(fetch).mockResolvedValueOnce(
      okResponse({
        ActionStatus: 0,
        NumOfRecords: 100,
        ProjectItems: [makeProject(1)],
        IsAll: true,
        Messages: [],
      })
    );

    const result = await fetchAllDiraProjects();

    expect(result).toHaveLength(1);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("stops when ProjectItems is empty (no more data)", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        okResponse({
          ActionStatus: 0,
          NumOfRecords: 5,
          ProjectItems: [makeProject(1)],
          IsAll: false,
          Messages: [],
        })
      )
      .mockResolvedValueOnce(
        okResponse({
          ActionStatus: 0,
          NumOfRecords: 5,
          ProjectItems: [],
          IsAll: false,
          Messages: [],
        })
      );

    const result = await fetchAllDiraProjects();

    expect(result).toHaveLength(1);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("first page URL includes IsInit=true", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      okResponse(singlePageResponse([makeProject(1)]))
    );
    await fetchAllDiraProjects();

    // The `param` query string is percent-encoded — decode before asserting
    const firstCallUrl = decodeURIComponent(vi.mocked(fetch).mock.calls[0][0] as string);
    expect(firstCallUrl).toContain("IsInit=true");
  });
});

// ---------------------------------------------------------------------------
// ActionStatus guard — regression tests for #016
// ---------------------------------------------------------------------------

describe("fetchAllDiraProjects — ActionStatus guard (#016)", () => {
  it("does NOT throw when ActionStatus is 0 (explicit success)", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      okResponse(singlePageResponse([makeProject(1)]))
    );
    await expect(fetchAllDiraProjects()).resolves.toHaveLength(1);
  });

  it("does NOT throw when ActionStatus is absent (field missing from response)", async () => {
    // This was the #016 regression: undefined !== 0 was true → threw on valid response
    const body: Partial<DiraApiResponse> = {
      NumOfRecords: 2,
      ProjectItems: [makeProject(1), makeProject(2)],
      IsAll: true,
      Messages: [],
      // ActionStatus intentionally omitted
    };
    vi.mocked(fetch).mockResolvedValueOnce(okResponse(body));

    await expect(fetchAllDiraProjects()).resolves.toHaveLength(2);
  });

  it("throws with API message when ActionStatus is non-zero", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      okResponse({
        ActionStatus: 1,
        Messages: ["Service temporarily unavailable"],
        ProjectItems: [],
        NumOfRecords: 0,
        IsAll: false,
      })
    );

    await expect(fetchAllDiraProjects()).rejects.toThrow(
      "API error on page 1: Service temporarily unavailable"
    );
  });

  it("throws with ActionStatus code in message when Messages is empty", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      okResponse({
        ActionStatus: 42,
        Messages: [],
        ProjectItems: [],
        NumOfRecords: 0,
        IsAll: false,
      })
    );

    await expect(fetchAllDiraProjects()).rejects.toThrow("ActionStatus 42");
  });

  it("throws on the correct page number when error occurs on page 2", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        okResponse({
          ActionStatus: 0,
          NumOfRecords: 4,
          ProjectItems: [makeProject(1), makeProject(2)],
          IsAll: false,
          Messages: [],
        })
      )
      .mockResolvedValueOnce(
        okResponse({
          ActionStatus: 3,
          Messages: ["Session expired"],
          ProjectItems: [],
          NumOfRecords: 4,
          IsAll: false,
        })
      );

    await expect(fetchAllDiraProjects()).rejects.toThrow("page 2");
  });
});

// ---------------------------------------------------------------------------
// NumOfRecords edge cases — #018
// ---------------------------------------------------------------------------

describe("fetchAllDiraProjects — NumOfRecords edge cases (#018)", () => {
  it("breaks with warning when NumOfRecords is 0 on page 1", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    vi.mocked(fetch).mockResolvedValueOnce(
      okResponse({
        ActionStatus: 0,
        NumOfRecords: 0,
        ProjectItems: [],
        IsAll: false,
        Messages: [],
      })
    );

    const result = await fetchAllDiraProjects();

    expect(result).toHaveLength(0);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Invalid NumOfRecords (0)")
    );
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("breaks with warning when NumOfRecords is undefined (fixes #018)", async () => {
    // NumOfRecords missing → Number.isFinite(undefined) = false → warns and stops after page 1
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    vi.mocked(fetch).mockResolvedValueOnce(
      okResponse({
        ActionStatus: 0,
        // NumOfRecords intentionally absent
        ProjectItems: [makeProject(1)],
        IsAll: false,
        Messages: [],
      } as Partial<DiraApiResponse>)
    );

    const result = await fetchAllDiraProjects();

    expect(result).toHaveLength(1);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Invalid NumOfRecords")
    );
  });
});

// ---------------------------------------------------------------------------
// HTTP error & retry behaviour
// ---------------------------------------------------------------------------

describe("fetchAllDiraProjects — HTTP errors and retries", () => {
  it("retries on 500 and succeeds on the second attempt", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(errResponse(500))
      .mockResolvedValueOnce(okResponse(singlePageResponse([makeProject(1)])));

    const result = await fetchAllDiraProjects();

    expect(result).toHaveLength(1);
    expect(fetch).toHaveBeenCalledTimes(2);
  }, 10_000); // retry delay is 1.5 s — allow 10 s

  it("throws after exhausting all retries on persistent 500", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(errResponse(500))
      .mockResolvedValueOnce(errResponse(500));

    await expect(fetchAllDiraProjects()).rejects.toThrow("Dira API error (500)");
    expect(fetch).toHaveBeenCalledTimes(2);
  }, 10_000);

  it("throws immediately on 404 without retry (fixes #020)", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(errResponse(404));

    await expect(fetchAllDiraProjects()).rejects.toThrow("Dira API error (404)");
    expect(fetch).toHaveBeenCalledTimes(1); // 4xx not retried
  });

  it("throws immediately on 400 without retry (fixes #020)", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(errResponse(400));

    await expect(fetchAllDiraProjects()).rejects.toThrow("Dira API error (400)");
    expect(fetch).toHaveBeenCalledTimes(1); // 4xx not retried
  });
});

// ---------------------------------------------------------------------------
// Request shape
// ---------------------------------------------------------------------------

describe("fetchAllDiraProjects — request shape", () => {
  it("sends correct Accept and X-Requested-With headers", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      okResponse(singlePageResponse([makeProject(1)]))
    );
    await fetchAllDiraProjects();

    const [, init] = vi.mocked(fetch).mock.calls[0];
    const headers = (init as RequestInit).headers as Record<string, string>;
    expect(headers["Accept"]).toBe("application/json");
    expect(headers["X-Requested-With"]).toBe("XMLHttpRequest");
  });

  it("calls the Dira Invoker endpoint with method=Projects", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      okResponse(singlePageResponse([makeProject(1)]))
    );
    await fetchAllDiraProjects();

    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain("dira.moch.gov.il/api/Invoker");
    expect(url).toContain("method=Projects");
  });
});
