import { WebPlugin } from './index';
import { GeolocationPlugin, GeolocationOptions, GeolocationPosition, GeolocationWatchCallback } from '../core-plugin-definitions';
export declare class GeolocationPluginWeb extends WebPlugin implements GeolocationPlugin {
    constructor();
    getCurrentPosition(options?: GeolocationOptions): Promise<GeolocationPosition>;
    watchPosition(options: GeolocationOptions, callback: GeolocationWatchCallback): string;
    clearWatch(options: {
        id: string;
    }): Promise<void>;
}
declare const Geolocation: GeolocationPluginWeb;
export { Geolocation };
