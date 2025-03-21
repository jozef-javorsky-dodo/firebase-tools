import { marked } from "marked";
import * as path from "path";
import * as semver from "semver";
import { markedTerminal } from "marked-terminal";

import { listExtensionVersions } from "./extensionsApi";
import { readFile } from "./localHelper";
import * as refs from "./refs";

marked.use(markedTerminal() as any);

const EXTENSIONS_CHANGELOG = "CHANGELOG.md";
// Simplifed version of https://semver.org/#is-there-a-suggested-regular-expression-regex-to-check-a-semver-string
const VERSION_LINE_REGEX =
  /##.+?(\d+\.\d+\.\d+(?:-((\d+|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(\d+|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?).*/;

/*
 * getReleaseNotesForUpdate fetches all version between toVersion and fromVersion and returns the relase notes
 * for those versions if they exist.
 * @param extensionRef
 * @param fromVersion the version you are updating from
 * @param toVersion the version you are upodating to
 * @returns a Record of version number to releaseNotes for that version
 */
export async function getReleaseNotesForUpdate(args: {
  extensionRef: string;
  fromVersion: string;
  toVersion: string;
}): Promise<Record<string, string>> {
  const releaseNotes: Record<string, string> = {};
  const filter = `id<="${args.toVersion}" AND id>"${args.fromVersion}"`;
  const extensionVersions = await listExtensionVersions(args.extensionRef, filter);
  extensionVersions.sort((ev1, ev2) => {
    return -semver.compare(ev1.spec.version, ev2.spec.version);
  });
  for (const extensionVersion of extensionVersions) {
    if (extensionVersion.releaseNotes) {
      const version = refs.parse(extensionVersion.ref).version!;
      releaseNotes[version] = extensionVersion.releaseNotes;
    }
  }
  return releaseNotes;
}

/**
 * breakingChangesInUpdate identifies which versions in an update are major changes.
 * Exported for testing.
 */
export function breakingChangesInUpdate(versionsInUpdate: string[]): string[] {
  const breakingVersions: string[] = [];
  const semvers = versionsInUpdate.map((v) => semver.parse(v)!).sort(semver.compare);
  for (let i = 1; i < semvers.length; i++) {
    const hasMajorBump = semvers[i - 1].major < semvers[i].major;
    const hasMinorBumpInPreview =
      semvers[i - 1].major === 0 &&
      semvers[i].major === 0 &&
      semvers[i - 1].minor < semvers[i].minor;
    if (hasMajorBump || hasMinorBumpInPreview) {
      breakingVersions.push(semvers[i].raw);
    }
  }
  return breakingVersions;
}

/**
 * getLocalChangelog checks directory for a CHANGELOG.md, and parses it into a map of
 * version to release notes for that version.
 * @param directory The directory to check for
 * @returns
 */
export function getLocalChangelog(directory: string): Record<string, string> {
  const rawChangelog = readFile(path.resolve(directory, EXTENSIONS_CHANGELOG));
  return parseChangelog(rawChangelog);
}

// Exported for testing.
export function parseChangelog(rawChangelog: string): Record<string, string> {
  const changelog: Record<string, string> = {};
  let currentVersion = "";
  for (const line of rawChangelog.split("\n")) {
    const matches = line.match(VERSION_LINE_REGEX);
    if (matches) {
      currentVersion = matches[1]; // The first capture group is the SemVer.
    } else if (currentVersion) {
      // Throw away lines that aren't under a specific version.
      if (!changelog[currentVersion]) {
        changelog[currentVersion] = line;
      } else {
        changelog[currentVersion] += `\n${line}`;
      }
    }
  }
  return changelog;
}
