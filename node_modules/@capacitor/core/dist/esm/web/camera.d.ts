import { WebPlugin } from './index';
import { CameraPlugin, CameraPhoto, CameraOptions } from '../core-plugin-definitions';
export declare class CameraPluginWeb extends WebPlugin implements CameraPlugin {
    constructor();
    getPhoto(options: CameraOptions): Promise<CameraPhoto>;
    private fileInputExperience;
    private _getCameraPhoto;
}
declare const Camera: CameraPluginWeb;
export { Camera };
