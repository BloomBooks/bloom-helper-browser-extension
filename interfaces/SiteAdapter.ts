export interface Metadata {
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

export interface SiteAdapter {
  canHandleDownload(url: string): boolean;
  getMetadata(url: string): Promise<Metadata>;
  getHostWildcardPatterns(): string[];
}

export function getStandardizeLicense(
  licenseNameFromMetadata: string,
  licenseUrlFromMetadata?: string,
  siteSpecificLicenseUrlFallback?: string
): { license: LicenseType; licenseUrl: string } | undefined {
  const licenses: Record<string, string> = {
    "CC-BY": "https://creativecommons.org/licenses/by/3.0/",
    "CC-BY-SA": "https://creativecommons.org/licenses/by-sa/3.0/",
    "CC-BY-NC": "https://creativecommons.org/licenses/by-nc/3.0/",
    "CC-BY-ND": "https://creativecommons.org/licenses/by-nd/3.0/",
    "CC-BY-NC-SA": "https://creativecommons.org/licenses/by-nc-sa/3.0/",
    "CC-BY-NC-ND": "https://creativecommons.org/licenses/by-nc-nd/3.0/",
    CC0: "https://creativecommons.org/publicdomain/zero/1.0/",
    "Public Domain, PD, PDM":
      "https://creativecommons.org/publicdomain/mark/1.0/",
  };

  const normalizedName = licenseNameFromMetadata.trim().replace(/\s+/g, "-");
  const match = Object.entries(licenses).find(([pattern]) =>
    pattern
      .split(",")
      .some((p) => normalizedName.toLowerCase() === p.trim().toLowerCase())
  );
  if (match) {
    return { license: match[0] as LicenseType, licenseUrl: match[1] };
  } else if (licenseUrlFromMetadata) {
    return { license: "Site Specific", licenseUrl: licenseUrlFromMetadata };
  } else if (siteSpecificLicenseUrlFallback) {
    return {
      license: "Site Specific",
      licenseUrl: siteSpecificLicenseUrlFallback,
    };
  } else return undefined; // give up
}
