import { WebPlugin } from './index';
import { SplashScreenPlugin, SplashScreenHideOptions, SplashScreenShowOptions } from '../core-plugin-definitions';
export declare class SplashScreenPluginWeb extends WebPlugin implements SplashScreenPlugin {
    constructor();
    show(_options?: SplashScreenShowOptions, _callback?: Function): Promise<void>;
    hide(_options?: SplashScreenHideOptions, _callback?: Function): Promise<void>;
}
declare const SplashScreen: SplashScreenPluginWeb;
export { SplashScreen };
