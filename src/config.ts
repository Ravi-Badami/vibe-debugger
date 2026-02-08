// Configuration module
import * as vscode from 'vscode';

export interface VibeDebuggerConfig {
  autoNotify: boolean;
  notificationDelay: number;
  debugMode: boolean;
  maxNotificationsPerHour: number;
}

export class Config {
  private static readonly CONFIG_SECTION = 'vibedebugger';
  private static readonly DEFAULTS: VibeDebuggerConfig = {
    autoNotify: true,
    notificationDelay: 10,
    debugMode: false,
    maxNotificationsPerHour: 5
  };

  /**
   * Get all configuration settings
   */
  static getAll(): VibeDebuggerConfig {
    const config = vscode.workspace.getConfiguration(this.CONFIG_SECTION);
    return {
      autoNotify: config.get('autoNotify', this.DEFAULTS.autoNotify),
      notificationDelay: this.validateNumericSetting(
        config.get('notificationDelay', this.DEFAULTS.notificationDelay),
        'notificationDelay'
      ),
      debugMode: config.get('debugMode', this.DEFAULTS.debugMode),
      maxNotificationsPerHour: this.validateNumericSetting(
        config.get('maxNotificationsPerHour', this.DEFAULTS.maxNotificationsPerHour),
        'maxNotificationsPerHour'
      )
    };
  }

  /**
   * Update a specific setting
   */
  static async updateSetting<T extends keyof VibeDebuggerConfig>(
    key: T,
    value: VibeDebuggerConfig[T]
  ): Promise<void> {
    // Validate numeric settings
    if (typeof value === 'number') {
      value = this.validateNumericSetting(value, key) as VibeDebuggerConfig[T];
    }

    const config = vscode.workspace.getConfiguration(this.CONFIG_SECTION);
    await config.update(key, value, vscode.ConfigurationTarget.Workspace);
  }

  /**
   * Reset all settings to defaults
   */
  static async resetToDefaults(): Promise<void> {
    const config = vscode.workspace.getConfiguration(this.CONFIG_SECTION);
    await config.update(
      'autoNotify',
      this.DEFAULTS.autoNotify,
      vscode.ConfigurationTarget.Workspace
    );
    await config.update(
      'notificationDelay',
      this.DEFAULTS.notificationDelay,
      vscode.ConfigurationTarget.Workspace
    );
    await config.update('debugMode', this.DEFAULTS.debugMode, vscode.ConfigurationTarget.Workspace);
    await config.update(
      'maxNotificationsPerHour',
      this.DEFAULTS.maxNotificationsPerHour,
      vscode.ConfigurationTarget.Workspace
    );
  }

  /**
   * Type-safe getter for autoNotify
   */
  static get autoNotify(): boolean {
    const config = vscode.workspace.getConfiguration(this.CONFIG_SECTION);
    return config.get('autoNotify', this.DEFAULTS.autoNotify);
  }

  /**
   * Type-safe getter for notificationDelay
   */
  static get notificationDelay(): number {
    const config = vscode.workspace.getConfiguration(this.CONFIG_SECTION);
    return this.validateNumericSetting(
      config.get('notificationDelay', this.DEFAULTS.notificationDelay),
      'notificationDelay'
    );
  }

  /**
   * Type-safe getter for debugMode
   */
  static get debugMode(): boolean {
    const config = vscode.workspace.getConfiguration(this.CONFIG_SECTION);
    return config.get('debugMode', this.DEFAULTS.debugMode);
  }

  /**
   * Type-safe getter for maxNotificationsPerHour
   */
  static get maxNotificationsPerHour(): number {
    const config = vscode.workspace.getConfiguration(this.CONFIG_SECTION);
    return this.validateNumericSetting(
      config.get('maxNotificationsPerHour', this.DEFAULTS.maxNotificationsPerHour),
      'maxNotificationsPerHour'
    );
  }

  /**
   * Listen for configuration changes
   */
  static onDidChangeConfiguration(
    callback: (config: VibeDebuggerConfig) => void
  ): vscode.Disposable {
    return vscode.workspace.onDidChangeConfiguration(event => {
      if (event.affectsConfiguration(this.CONFIG_SECTION)) {
        const newConfig = this.getAll();
        callback(newConfig);
      }
    });
  }

  /**
   * Validate numeric settings to ensure they are not negative
   */
  private static validateNumericSetting(value: number, settingName: string): number {
    if (value < 0) {
      console.warn(`Vibe Debugger: ${settingName} cannot be negative. Using default value.`);
      vscode.window.showWarningMessage(
        `Vibe Debugger: ${settingName} cannot be negative. Using default value.`
      );
      return this.DEFAULTS[settingName as keyof VibeDebuggerConfig] as number;
    }
    return value;
  }
}
