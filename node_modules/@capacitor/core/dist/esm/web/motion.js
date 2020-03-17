import { __extends } from "tslib";
import { WebPlugin } from './index';
var MotionPluginWeb = /** @class */ (function (_super) {
    __extends(MotionPluginWeb, _super);
    function MotionPluginWeb() {
        var _this = _super.call(this, {
            name: 'Motion'
        }) || this;
        _this.registerWindowListener('devicemotion', 'accel');
        _this.registerWindowListener('deviceorientation', 'orientation');
        return _this;
    }
    return MotionPluginWeb;
}(WebPlugin));
export { MotionPluginWeb };
var Motion = new MotionPluginWeb();
export { Motion };
//# sourceMappingURL=motion.js.map