/** Standard CKAN API response wrapper. */
export interface CkanResponse<T = Record<string, unknown>> {
  success: boolean;
  result: T;
}

/** Result payload from the CKAN `datastore_search` action. */
export interface DatastoreSearchResult {
  resource_id: string;
  fields: Array<{ id: string; type: string }>;
  records: Array<Record<string, unknown>>;
  total?: number;
  _links?: {
    start: string;
    next: string;
  };
}

/** Result payload from the CKAN `package_search` action (dataset metadata). */
export interface PackageSearchResult {
  count: number;
  results: Array<{
    id: string;
    name: string;
    title: string;
    notes: string;
    organization: { name: string; title: string };
    resources: Array<{
      id: string;
      name: string;
      format: string;
      url: string;
      datastore_active: boolean;
    }>;
  }>;
}

/** Parameters for a `datastore_search` request. */
export interface SearchParams {
  resource_id: string;
  q?: string;
  limit?: number;
  offset?: number;
  filters?: Record<string, unknown>;
  fields?: string[];
  sort?: string[];
  include_total?: boolean;
  distinct?: string;
}
