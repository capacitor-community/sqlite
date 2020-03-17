import { __awaiter, __extends, __generator } from "tslib";
import { WebPlugin } from './index';
var ModalsPluginWeb = /** @class */ (function (_super) {
    __extends(ModalsPluginWeb, _super);
    function ModalsPluginWeb() {
        return _super.call(this, {
            name: 'Modals',
            platforms: ['web']
        }) || this;
    }
    ModalsPluginWeb.prototype.alert = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                window.alert(options.message);
                return [2 /*return*/, Promise.resolve()];
            });
        });
    };
    ModalsPluginWeb.prototype.prompt = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var val;
            return __generator(this, function (_a) {
                val = window.prompt(options.message, options.inputPlaceholder || '');
                return [2 /*return*/, Promise.resolve({
                        value: val,
                        cancelled: val === null
                    })];
            });
        });
    };
    ModalsPluginWeb.prototype.confirm = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var val;
            return __generator(this, function (_a) {
                val = window.confirm(options.message);
                return [2 /*return*/, Promise.resolve({
                        value: val
                    })];
            });
        });
    };
    ModalsPluginWeb.prototype.showActions = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, _reject) { return __awaiter(_this, void 0, void 0, function () {
                        var controller, items, actionSheetElement;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    controller = document.querySelector('ion-action-sheet-controller');
                                    if (!controller) {
                                        controller = document.createElement('ion-action-sheet-controller');
                                        document.body.appendChild(controller);
                                    }
                                    return [4 /*yield*/, controller.componentOnReady()];
                                case 1:
                                    _a.sent();
                                    items = options.options.map(function (o, i) {
                                        return {
                                            text: o.title,
                                            role: o.style && o.style.toLowerCase() || '',
                                            icon: o.icon || '',
                                            handler: function () {
                                                resolve({
                                                    index: i
                                                });
                                            }
                                        };
                                    });
                                    return [4 /*yield*/, controller.create({
                                            title: options.title,
                                            buttons: items
                                        })];
                                case 2:
                                    actionSheetElement = _a.sent();
                                    return [4 /*yield*/, actionSheetElement.present()];
                                case 3:
                                    _a.sent();
                                    return [2 /*return*/];
                            }
                        });
                    }); })];
            });
        });
    };
    return ModalsPluginWeb;
}(WebPlugin));
export { ModalsPluginWeb };
var Modals = new ModalsPluginWeb();
export { Modals };
//# sourceMappingURL=modals.js.map