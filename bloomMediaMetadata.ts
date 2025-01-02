export interface BloomMetadata {
  url: string;
  licenseUrl?: string;
  license: LicenseType;
  credits: string;
  sourceWebPage?: string;
}

export type LicenseType =
  | "CC-BY"
  | "CC-BY-ND"
  | "CC-BY-SA"
  | "CC-BY-NC"
  | "CC-BY-NC-ND"
  | "CC-BY-NC-SA"
  | "CC0"
  | "Public Domain"
  | "Site Specific";
