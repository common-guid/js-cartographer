export interface ApiParameter {
  name: string;
  type: string;
  required?: boolean;
}

export interface ApiEndpoint {
  path: string;
  method: string;
  queryParams?: ApiParameter[];
  requestBody?: Record<string, string>; // name: type
  sourceLocations?: { file: string; line: number; column: number }[];
}

export interface ApiSurface {
  baseUrl?: string;
  endpoints: ApiEndpoint[];
}
