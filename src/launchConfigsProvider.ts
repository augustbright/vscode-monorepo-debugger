import * as vscode from "vscode";

export class LaunchConfigItem extends vscode.TreeItem {
  constructor(public readonly label: string, public isRunning: boolean) {
    super(label);

    this.description = isRunning ? "Running" : "";
    this.tooltip = `Launch Config: ${this.label}`;
    this.contextValue = isRunning ? "runningConfig" : "stoppedConfig";
  }
}

export class LaunchConfigsProvider
  implements vscode.TreeDataProvider<LaunchConfigItem>
{
  private readonly _onDidChangeTreeData: vscode.EventEmitter<
    LaunchConfigItem | undefined | void
  > = new vscode.EventEmitter<LaunchConfigItem | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<
    LaunchConfigItem | undefined | void
  > = this._onDidChangeTreeData.event;

  private configs: { name: string; isRunning: boolean }[] = [];

  constructor(private readonly getLaunchConfigs: () => { name: string }[]) {
    this.configs = this.getLaunchConfigs().map((config) => ({
      ...config,
      isRunning: false,
    }));
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: LaunchConfigItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: LaunchConfigItem): Thenable<LaunchConfigItem[]> {
    const items = this.configs.map(
      (config) => new LaunchConfigItem(config.name, config.isRunning)
    );
    return Promise.resolve(items);
  }

  updateRunningStatus(name: string, isRunning: boolean): void {
    const config = this.configs.find((config) => config.name === name);
    if (config) {
      config.isRunning = isRunning;
      this.refresh(); // Refresh the tree view
    }
  }
}
