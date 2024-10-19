import fs from "node:fs";
import path from "node:path";
import JSONC from "tiny-jsonc";
import { getProjectRootPath } from "vscode-extras";
import { Uri, workspace, type WorkspaceFolder } from "vscode";

const attempt = <T>(fn: () => T): T | undefined => {
  try {
    return fn();
  } catch {
    return;
  }
};

export function getLaunchConfigs() {
  const rootPath = getProjectRootPath();

  if (!rootPath) return [];

  const launchPath = path.join(rootPath, ".vscode", "launch.json");
  const launchContent = attempt(() => fs.readFileSync(launchPath, "utf8"));

  if (!launchContent) return [];

  const launchJSON = attempt(() => JSONC.parse(launchContent));

  if (!launchJSON) return [];
  if (!("configurations" in launchJSON)) return [];
  if (!Array.isArray(launchJSON.configurations)) return [];

  return launchJSON.configurations;
}

export function getWorkspaceFolderForLaunchConfig(
  configName: string
): WorkspaceFolder | undefined {
  const workspaceFolders = workspace.workspaceFolders;

  if (!workspaceFolders || workspaceFolders.length === 0) {
    return undefined;
  }

  if (workspaceFolders.length === 1) {
    return workspaceFolders[0];
  }

  for (const folder of workspaceFolders) {
    const launchConfigPath = Uri.joinPath(folder.uri, ".vscode", "launch.json");
    const configs = require(launchConfigPath.fsPath).configurations;

    if (configs.some((config: any) => config.name === configName)) {
      return folder; // Return the folder that has the matching launch configuration
    }
  }

  return undefined; // If no matching folder is found
}
