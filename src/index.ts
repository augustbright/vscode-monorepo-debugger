import vscode from "vscode";
import {
  LaunchConfigItem,
  LaunchConfigsProvider,
} from "./launchConfigsProvider";
import { getLaunchConfigs, getWorkspaceFolderForLaunchConfig } from "./utils";

export const activate = (): void => {
  const launchConfigsProvider = new LaunchConfigsProvider(getLaunchConfigs);
  vscode.window.registerTreeDataProvider(
    "launchConfigsView",
    launchConfigsProvider
  );
  vscode.commands.registerCommand("launchConfigsView.refresh", () =>
    launchConfigsProvider.refresh()
  );

  let activeSessions: Set<vscode.DebugSession> = new Set();

  vscode.commands.registerCommand(
    "launchConfigsView.start",
    async (item: LaunchConfigItem) => {
      const configName = item.label; // Use the item's label as the config name

      const workspaceFolder = getWorkspaceFolderForLaunchConfig(configName);

      if (!workspaceFolder) {
        vscode.window.showErrorMessage(
          `No workspace folder found for config: ${configName}`
        );
        return;
      }

      // Start the debug session for the given config
      vscode.window.showInformationMessage(`Starting config: ${configName}`);
      const success = await vscode.debug.startDebugging(
        workspaceFolder,
        configName
      );

      if (!success) {
        vscode.window.showErrorMessage(`Failed to start config: ${configName}`);
      }
    }
  );

  vscode.commands.registerCommand(
    "launchConfigsView.stop",
    async (item: LaunchConfigItem) => {
      const configName = item.label; // The config name to stop

      // Find all active debug sessions and stop the one that matches the config name
      const session = Array.from(activeSessions).find(
        (session) => session.name === configName
      );

      if (session) {
        await vscode.debug.stopDebugging(session);
      } else {
        vscode.window.showErrorMessage(
          `No running config found for: ${configName}`
        );
      }
    }
  );

  vscode.commands.registerCommand(
    "launchConfigsView.revealConsole",
    (item: LaunchConfigItem) => {
      const configName = item.label;

      const session = Array.from(activeSessions).find(
        (session) => session.name === configName
      );

      if (session) {
        vscode.commands.executeCommand("workbench.action.debug.console.focus");
        const terminal = vscode.window.terminals.find(
          (t) => t.name === configName
        );
        if (terminal) {
          terminal.show();
        }
      }
    }
  );

  vscode.window
    .createTreeView("launchConfigsView", {
      treeDataProvider: launchConfigsProvider,
      showCollapseAll: true,
      canSelectMany: false,
    })
    .onDidChangeSelection((e) => {
      const selectedItem = e.selection[0]; // Only single selection assumed
      if (selectedItem) {
        vscode.commands.executeCommand(
          "launchConfigsView.revealConsole",
          selectedItem
        );
      }
    });

  vscode.debug.onDidStartDebugSession((session) => {
    activeSessions.add(session);
    launchConfigsProvider.updateRunningStatus(session.name, true); // Update tree
  });

  vscode.debug.onDidTerminateDebugSession((session) => {
    activeSessions.delete(session);
    launchConfigsProvider.updateRunningStatus(session.name, false); // Update tree
  });
};
