import { WebPlugin } from './index';
import { AppPlugin, AppLaunchUrl, AppState } from '../core-plugin-definitions';
export declare class AppPluginWeb extends WebPlugin implements AppPlugin {
    constructor();
    exitApp(): never;
    canOpenUrl(_options: {
        url: string;
    }): Promise<{
        value: boolean;
    }>;
    openUrl(_options: {
        url: string;
    }): Promise<{
        completed: boolean;
    }>;
    getLaunchUrl(): Promise<AppLaunchUrl>;
    getState(): Promise<AppState>;
    handleVisibilityChange(): void;
}
declare const App: AppPluginWeb;
export { App };
