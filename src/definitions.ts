declare module "@capacitor/core" {
  interface PluginRegistry {
    CapacitorSQLite: CapacitorSQLitePlugin;
  }
}

export interface CapacitorSQLitePlugin {
  echo(options: { value: string }): Promise<{value: string}>;
  open(options: { name: string }): Promise<{result: boolean}>;
  execute(options: {statements: string }): Promise<{result: number}>;
  run(options: {statement: string, values: Array<any> }): Promise<{result: number}>;
  query(options: {statement: string, values: Array<string>}): Promise<{result: Array<any>}>;
  deleteDatabase(options: { name: string }): Promise<{result: boolean}>;
}

