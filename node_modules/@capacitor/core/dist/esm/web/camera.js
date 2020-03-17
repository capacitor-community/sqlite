import { __awaiter, __extends, __generator } from "tslib";
import { WebPlugin } from './index';
import { CameraResultType } from '../core-plugin-definitions';
var CameraPluginWeb = /** @class */ (function (_super) {
    __extends(CameraPluginWeb, _super);
    function CameraPluginWeb() {
        return _super.call(this, {
            name: 'Camera',
            platforms: ['web']
        }) || this;
    }
    CameraPluginWeb.prototype.getPhoto = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                options;
                return [2 /*return*/, new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
                        var cameraModal;
                        var _this = this;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    cameraModal = document.createElement('pwa-camera-modal');
                                    document.body.appendChild(cameraModal);
                                    return [4 /*yield*/, cameraModal.componentOnReady()];
                                case 1:
                                    _a.sent();
                                    cameraModal.addEventListener('onPhoto', function (e) { return __awaiter(_this, void 0, void 0, function () {
                                        var photo, _a;
                                        return __generator(this, function (_b) {
                                            switch (_b.label) {
                                                case 0:
                                                    photo = e.detail;
                                                    if (!(photo === null)) return [3 /*break*/, 1];
                                                    reject('User cancelled photos app');
                                                    return [3 /*break*/, 4];
                                                case 1:
                                                    if (!(photo instanceof Error)) return [3 /*break*/, 2];
                                                    reject(photo.message);
                                                    return [3 /*break*/, 4];
                                                case 2:
                                                    _a = resolve;
                                                    return [4 /*yield*/, this._getCameraPhoto(photo, options)];
                                                case 3:
                                                    _a.apply(void 0, [_b.sent()]);
                                                    _b.label = 4;
                                                case 4:
                                                    cameraModal.dismiss();
                                                    document.body.removeChild(cameraModal);
                                                    return [2 /*return*/];
                                            }
                                        });
                                    }); });
                                    cameraModal.present();
                                    return [2 /*return*/];
                            }
                        });
                    }); })];
            });
        });
    };
    CameraPluginWeb.prototype._getCameraPhoto = function (photo, options) {
        return new Promise(function (resolve, reject) {
            var reader = new FileReader();
            var format = photo.type.split('/')[1];
            if (options.resultType === CameraResultType.Uri) {
                resolve({
                    webPath: URL.createObjectURL(photo),
                    format: format
                });
            }
            else {
                reader.readAsDataURL(photo);
                reader.onloadend = function () {
                    var r = reader.result;
                    if (options.resultType === CameraResultType.DataUrl) {
                        resolve({
                            dataUrl: r,
                            format: format
                        });
                    }
                    else {
                        resolve({
                            base64String: r.split(',')[1],
                            format: format
                        });
                    }
                };
                reader.onerror = function (e) {
                    reject(e);
                };
            }
        });
    };
    return CameraPluginWeb;
}(WebPlugin));
export { CameraPluginWeb };
var Camera = new CameraPluginWeb();
export { Camera };
//# sourceMappingURL=camera.js.map