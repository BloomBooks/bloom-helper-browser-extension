import { BloomMetadata, LicenseType } from "./bloomMediaMetadata";

export interface SiteAdapter {
  canHandleDownload(url: string): boolean;
  getMetadata(sourcePageUrl: string, imageUrl: string): Promise<BloomMetadata>;
  getHostWildcardPatterns(): string[];
}

export function getStandardizeLicense(
  licenseNameFromMetadata: string,
  licenseUrlFromMetadata?: string,
  siteSpecificLicenseUrlFallback?: string
): { license: LicenseType; licenseUrl: string } | undefined {
  const licenses: Record<string, string> = {
    "CC-BY": "https://creativecommons.org/licenses/by/4.0/",
    "CC-BY-SA": "https://creativecommons.org/licenses/by-sa/4.0/",
    "CC-BY-NC": "https://creativecommons.org/licenses/by-nc/4.0/",
    "CC-BY-ND": "https://creativecommons.org/licenses/by-nd/4.0/",
    "CC-BY-NC-SA": "https://creativecommons.org/licenses/by-nc-sa/4.0/",
    "CC-BY-NC-ND": "https://creativecommons.org/licenses/by-nc-nd/4.0/",
    CC0: "https://creativecommons.org/publicdomain/zero/1.0/",
    "Public Domain, PD, PDM":
      "https://creativecommons.org/publicdomain/mark/1.0/",
  };

  const normalizedName = licenseNameFromMetadata
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-\d+(\.\d+)?$/, ""); // Remove version number at the end (e.g. wikicommons has "https://creativecommons.org/licenses/by-sa/4.0/")
  const match = Object.entries(licenses).find(([pattern]) =>
    pattern
      .split(",")
      .some((p) => normalizedName.toLowerCase() === p.trim().toLowerCase())
  );
  if (match) {
    return {
      license: match[0].split(",")[0] as LicenseType,
      licenseUrl: licenseUrlFromMetadata || match[1],
    };
  } else if (licenseUrlFromMetadata) {
    return { license: "Site Specific", licenseUrl: licenseUrlFromMetadata };
  } else if (siteSpecificLicenseUrlFallback) {
    return {
      license: "Site Specific",
      licenseUrl: siteSpecificLicenseUrlFallback,
    };
  } else return undefined; // give up
}
