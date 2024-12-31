import {
  SiteAdapter,
  Metadata,
  getStandardizeLicense,
} from "../interfaces/SiteAdapter";

export class WikiCommonsAdapter implements SiteAdapter {
  public canHandleDownload(url: string): boolean {
    return url.includes("wikimedia.org");
  }

  // extension will be enabled if these match
  public getHostWildcardPatterns(): string[] {
    return ["https://*.wikimedia.org/*"];
  }

  // given a URL of something to download, get metadata about that file and massage it into a standard format that Bloom can use
  public async getMetadata(url: string): Promise<Metadata | undefined> {
    const filename = this.extractFilename(url);
    const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&prop=imageinfo&iiprop=extmetadata&titles=File:${encodeURIComponent(filename)}&format=json&origin=*`;

    try {
      const response = await fetch(apiUrl);
      const data = await response.json();
      const info =
        data.query.pages[Object.keys(data.query.pages)[0]].imageinfo[0];
      console.log(JSON.stringify(info, null, 2));
      const { license, licenseUrl } = getStandardizeLicense(
        info.extmetadata.LicenseShortName.value,
        info.extmetadata.LicenseUrl.value,
        "https://commons.wikimedia.org/wiki/Commons:Licensing" // fallback if we can't figure out the license
      );
      return {
        license,
        licenseUrl,
        credits: info.extmetadata.Artist.value,
        sourceWebPage: info.descriptionurl,
      };
    } catch (error) {
      console.error("Failed to fetch Commons info:", error);
    }
    return undefined;
  }

  // It appears that every file on wikicommons has a unique file name?
  private extractFilename(url: string): string {
    console.log("extract " + url);
    const match = url.match(
      /commons\/(?:thumb\/)?[a-f0-9]\/[a-f0-9]{2}\/(.+?)(?:\/|$)/
    );
    console.log(match);
    return match ? decodeURIComponent(match[1]) : "";
  }
}
