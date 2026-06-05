export type PatchConfig = {
  version: string;
  dataDragonVersion: string;
  statusLabel: string;
  dataSourceLabel: string;
  modesLabel: string;
};

const configuredPatchVersion =
  process.env.NEXT_PUBLIC_PATCH_VERSION ??
  process.env.NEXT_PUBLIC_DDRAGON_VERSION ??
  "16.11.1";

export const currentPatch: PatchConfig = {
  version: configuredPatchVersion,
  dataDragonVersion: process.env.NEXT_PUBLIC_DDRAGON_VERSION ?? configuredPatchVersion,
  statusLabel: process.env.NEXT_PUBLIC_PATCH_STATUS_LABEL ?? "Current Mock Meta",
  dataSourceLabel: process.env.NEXT_PUBLIC_PATCH_DATA_SOURCE_LABEL ?? "Data Dragon-ready dataset",
  modesLabel: "Arena + ARAM Mayhem"
};

export function getPatchLabel(patch: PatchConfig = currentPatch) {
  return `Patch ${patch.version}`;
}
