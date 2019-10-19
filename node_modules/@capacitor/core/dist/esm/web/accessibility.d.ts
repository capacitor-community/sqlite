import { WebPlugin } from './index';
import { AccessibilityPlugin, AccessibilitySpeakOptions, ScreenReaderEnabledResult } from '../core-plugin-definitions';
export declare class AccessibilityPluginWeb extends WebPlugin implements AccessibilityPlugin {
    constructor();
    isScreenReaderEnabled(): Promise<ScreenReaderEnabledResult>;
    speak(options: AccessibilitySpeakOptions): Promise<void>;
}
declare const Accessibility: AccessibilityPluginWeb;
export { Accessibility };
