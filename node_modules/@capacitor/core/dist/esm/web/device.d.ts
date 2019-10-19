import { WebPlugin } from './index';
import { DeviceInfo, DevicePlugin, DeviceLanguageCodeResult } from '../core-plugin-definitions';
export declare class DevicePluginWeb extends WebPlugin implements DevicePlugin {
    constructor();
    getInfo(): Promise<DeviceInfo>;
    getLanguageCode(): Promise<DeviceLanguageCodeResult>;
    parseUa(_ua: string): any;
    getUid(): string;
}
declare const Device: DevicePluginWeb;
export { Device };
