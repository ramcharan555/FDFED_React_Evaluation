"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataStorePersistenceInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
const data_store_1 = require("../data-store");
let DataStorePersistenceInterceptor = class DataStorePersistenceInterceptor {
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        // Finance mutations persist inside their rollback boundary.
        if (request.originalUrl?.startsWith('/api/finance/'))
            return next.handle();
        if (request.originalUrl?.startsWith('/api/workspace/'))
            return next.handle();
        if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method))
            return next.handle();
        return next.handle().pipe((0, operators_1.tap)(() => data_store_1.DataStore.getInstance().persist()));
    }
};
exports.DataStorePersistenceInterceptor = DataStorePersistenceInterceptor;
exports.DataStorePersistenceInterceptor = DataStorePersistenceInterceptor = __decorate([
    (0, common_1.Injectable)()
], DataStorePersistenceInterceptor);
//# sourceMappingURL=data-store-persistence.interceptor.js.map