export interface ApiParameter {
  name: string;
  type: string;
  required?: boolean;
  description?: string;
}

export interface ApiEndpoint {
  path: string;
  method: string;
  queryParams?: ApiParameter[];
  requestBody?: Record<string, string>; // name: type
  sourceLocations?: { file: string; line: number; column: number }[];
  description?: string;
}

export interface ApiSurface {
  baseUrl?: string;
  endpoints: ApiEndpoint[];
}
