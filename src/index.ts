// start http server
import * as env from "./env";
import { ExchangeCredentialsModel } from "./lib/common/database";
import { GlobalMonitorManager } from "./tools/yield_farming/auto_balancer/GlobalMonitorManager";
import { UserMonitorManager } from "./tools/yield_farming/auto_balancer/UserMonitorManager";
import { MonitorUserModel, MonitorModel, TransactionModel, PendingOrderModel } from "./tools/yield_farming/database";
import server from "./web/server";




server().then(async () => {
    let gmonitorManager = GlobalMonitorManager.initiliaze(
        MonitorUserModel,
        MonitorModel,
        ExchangeCredentialsModel,
        TransactionModel,
        PendingOrderModel
    );
    (await MonitorUserModel.find().exec()).forEach(user => {
        new UserMonitorManager(
            user._user!.toString()
        )
    })
});
