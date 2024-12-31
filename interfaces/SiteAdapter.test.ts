import { describe, it, expect } from "vitest";
import { getStandardizeLicense, LicenseType } from "./SiteAdapter";

describe("getStandardizeLicense", () => {
  it("should handle exact license matches", () => {
    const result = getStandardizeLicense("CC-BY");
    expect(result).toEqual({
      license: "CC-BY" as LicenseType,
      licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
    });
  });

  it("should handle case-insensitive matches", () => {
    const result = getStandardizeLicense("cc-by");
    expect(result).toEqual({
      license: "CC-BY" as LicenseType,
      licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
    });
  });

  it("should handle public domain variations", () => {
    const result = getStandardizeLicense("PD");
    expect(result).toEqual({
      license: "Public Domain" as LicenseType,
      licenseUrl: "https://creativecommons.org/publicdomain/mark/1.0/",
    });
  });

  it("should fallback to site specific with custom license URL", () => {
    const result = getStandardizeLicense(
      "Custom License",
      "https://example.com/license"
    );
    expect(result).toEqual({
      license: "Site Specific" as LicenseType,
      licenseUrl: "https://example.com/license",
    });
  });

  it("should fallback to site specific with fallback URL", () => {
    const result = getStandardizeLicense(
      "Custom License",
      undefined,
      "https://example.com/fallback"
    );
    expect(result).toEqual({
      license: "Site Specific" as LicenseType,
      licenseUrl: "https://example.com/fallback",
    });
  });

  it("should return undefined for unknown license without fallbacks", () => {
    const result = getStandardizeLicense("Unknown License");
    expect(result).toBeUndefined();
  });

  it("should handle whitespace in license names", () => {
    const result = getStandardizeLicense("  CC-BY  ");
    expect(result).toEqual({
      license: "CC-BY" as LicenseType,
      licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
    });
  });

  it("should handle license names with version numbers", () => {
    const result = getStandardizeLicense(
      "cc-by-sa-4.0",
      "https://creativecommons.org/licenses/by-sa/4.0/"
    );
    expect(result).toEqual({
      license: "CC-BY-SA" as LicenseType,
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    });
  });

  it("should preserve version 3.0 license URLs when provided", () => {
    const result = getStandardizeLicense(
      "CC-BY-SA",
      "https://creativecommons.org/licenses/by-sa/3.0/"
    );
    expect(result).toEqual({
      license: "CC-BY-SA" as LicenseType,
      licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
    });
  });
});
