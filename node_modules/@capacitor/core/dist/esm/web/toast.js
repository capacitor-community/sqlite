import { __awaiter, __extends, __generator } from "tslib";
import { WebPlugin } from './index';
var ToastPluginWeb = /** @class */ (function (_super) {
    __extends(ToastPluginWeb, _super);
    function ToastPluginWeb() {
        return _super.call(this, {
            name: 'Toast',
            platforms: ['web']
        }) || this;
    }
    ToastPluginWeb.prototype.show = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var duration, toast;
            return __generator(this, function (_a) {
                duration = 2000;
                if (options.duration) {
                    duration = options.duration === 'long' ? 3500 : 2000;
                }
                toast = document.createElement('pwa-toast');
                toast.duration = duration;
                toast.message = options.text;
                document.body.appendChild(toast);
                return [2 /*return*/];
            });
        });
    };
    return ToastPluginWeb;
}(WebPlugin));
export { ToastPluginWeb };
var Toast = new ToastPluginWeb();
export { Toast };
//# sourceMappingURL=toast.js.map