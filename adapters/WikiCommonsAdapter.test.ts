import { describe, it, expect, vi, beforeEach } from "vitest";
import { WikiCommonsAdapter } from "./WikiCommonsAdapter";

describe("WikiCommonsAdapter", () => {
  let adapter: WikiCommonsAdapter;

  beforeEach(() => {
    adapter = new WikiCommonsAdapter();
  });

  describe("getMetadata", () => {
    it("should return metadata for a valid wikimedia URL", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        json: () =>
          Promise.resolve({
            query: {
              pages: {
                "123": {
                  imageinfo: [
                    {
                      extmetadata: {
                        LicenseShortName: { value: "CC BY-SA 4.0" },
                        LicenseUrl: {
                          value:
                            "https://creativecommons.org/licenses/by-sa/4.0",
                        },
                        Artist: { value: "Test Artist" },
                      },
                      descriptionurl:
                        "https://commons.wikimedia.org/wiki/File:Test.jpg",
                    },
                  ],
                },
              },
            },
          }),
      });

      const metadata = await adapter.getMetadata(
        "https://commons.wikimedia.org/wiki/File:Test.jpg",
        "https://commons.wikimedia.org/commons/a/ab/Test.jpg"
      );

      expect(metadata).toEqual({
        url: "https://commons.wikimedia.org/commons/a/ab/Test.jpg",
        license: "CC-BY-SA",
        licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
        credits: "Test Artist",
        sourceWebPage: "https://commons.wikimedia.org/wiki/File:Test.jpg",
      });
    });

    it("should return undefined when API call fails", async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error("API Error"));

      const metadata = await adapter.getMetadata(
        "https://commons.wikimedia.org/wiki/File:Test.jpg",
        "https://commons.wikimedia.org/commons/a/ab/Test.jpg"
      );
      expect(metadata).toBeUndefined();
    });

    it("should handle HTML in artist name", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        json: () =>
          Promise.resolve({
            query: {
              pages: {
                "123": {
                  imageinfo: [
                    {
                      extmetadata: {
                        LicenseShortName: { value: "CC BY-SA 4.0" },
                        LicenseUrl: {
                          value:
                            "https://creativecommons.org/licenses/by-sa/4.0",
                        },
                        Artist: {
                          value:
                            '<a href="//commons.wikimedia.org/wiki/User:James_Moore200" title="User:James Moore200">James Moore200</a>',
                        },
                      },
                      descriptionurl:
                        "https://commons.wikimedia.org/wiki/File:Test.jpg",
                    },
                  ],
                },
              },
            },
          }),
      });

      const metadata = await adapter.getMetadata(
        "https://commons.wikimedia.org/wiki/File:Test.jpg",
        "https://commons.wikimedia.org/commons/a/ab/Test.jpg"
      );

      expect(metadata).toEqual({
        url: "https://commons.wikimedia.org/commons/a/ab/Test.jpg",
        license: "CC-BY-SA",
        licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
        credits: "James Moore200",
        sourceWebPage: "https://commons.wikimedia.org/wiki/File:Test.jpg",
      });
    });

    it("should handle missing licenseUrl", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        json: () =>
          Promise.resolve({
            query: {
              pages: {
                "123": {
                  imageinfo: [
                    {
                      extmetadata: {
                        LicenseShortName: { value: "CC BY-SA 4.0" },
                        // empty license URL
                        Artist: { value: "Test Artist" },
                      },
                      descriptionurl:
                        "https://commons.wikimedia.org/wiki/File:Test.jpg",
                    },
                  ],
                },
              },
            },
          }),
      });

      const metadata = await adapter.getMetadata(
        "https://commons.wikimedia.org/wiki/File:Test.jpg",
        "https://commons.wikimedia.org/commons/a/ab/Test.jpg"
      );

      expect(metadata).toEqual({
        url: "https://commons.wikimedia.org/commons/a/ab/Test.jpg",
        license: "CC-BY-SA",
        licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
        credits: "Test Artist",
        sourceWebPage: "https://commons.wikimedia.org/wiki/File:Test.jpg",
      });
    });
  });
});
