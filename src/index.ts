// start http server
import { ExchangeCredentialsModel } from "./lib/common/database";
import { GlobalMonitorManager } from "./tools/yield_farming/auto_balancer/GlobalMonitorManager";
import { MonitorUserModel, MonitorModel, TransactionModel, PendingOrderModel, MonitorStatus } from "./tools/yield_farming/database";
import server from "./web/server";




server().then(async () => {
    let _globalMonitorManager = GlobalMonitorManager.initiliaze(
        MonitorUserModel,
        MonitorModel,
        ExchangeCredentialsModel,
        TransactionModel,
        PendingOrderModel
    );
    // initialize all running monitors
    await Promise.all((await MonitorModel.find({ status: MonitorStatus.Running }).exec()).map(async monitor => {
        await _globalMonitorManager.startMonitorAsync(monitor._id);
    }))
});
