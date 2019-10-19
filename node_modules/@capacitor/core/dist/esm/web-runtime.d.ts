import { PluginRegistry } from './definitions';
export declare class CapacitorWeb {
    Plugins: PluginRegistry;
    platform: string;
    isNative: boolean;
    constructor();
    pluginMethodNoop(_target: any, _prop: PropertyKey, pluginName: string): Promise<never>;
    getPlatform(): string;
    isPluginAvailable(name: string): boolean;
    convertFileSrc(filePath: string): string;
    handleError(e: Error): void;
}
