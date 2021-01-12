import { ChildProcess, fork as forkChildProcess } from 'child_process';
import { Types } from 'mongoose';
import * as path from 'path';
import { ExchangeCredentials, MongooseModel } from '../../../lib/common/database';
import defer from '../../../lib/common/defer';
import { Monitor, MonitorStatus, MonitorUser, PendingOrder, Transaction } from '../database';
import { MonitorMessageInterface, EmitMessageInterface, MessageTypeEnum, InitMessage, MonitorErrorsEnum, UnexpectedErrorMessage, TradeLimitReachedErrorMessage, BadConfigurationErrorMessage, NewTransactionMessage, HeartbeatMilliSeconds, StopMessage } from './MonitorProcessInterfaces';




export class GlobalMonitorManager {
    private static _heartbeatTimeoutMilliSeconds = HeartbeatMilliSeconds + 5000;
    public static instance?: GlobalMonitorManager;

    private _globalMonitorRegistry: {
        [key: string]:
        {
            process: ChildProcess,
            lastSeen: number
        }
    } = {};

    private _monitorProcessPath = path.resolve(__dirname + "/MonitorProcess")

    private constructor(
        public UserModel: MongooseModel<MonitorUser>,
        public MonitorModel: MongooseModel<Monitor>,
        public ExchangeCredentialsModel: MongooseModel<ExchangeCredentials>,
        public TransactionModel: MongooseModel<Transaction>,
        public PendingOrderModel: MongooseModel<PendingOrder>
    ) {
        this.startMonitorHealthCheckInterval();
        GlobalMonitorManager.instance = this;
    }

    private startMonitorHealthCheckInterval() {
        return setInterval(async () => {
            for (let processkey in GlobalMonitorManager.instance!._globalMonitorRegistry) {
                let process = GlobalMonitorManager.instance!._globalMonitorRegistry[processkey];
                let timeDelta = (+Date.now()) - process.lastSeen;
                console.log("healthCheck", timeDelta);
                if (timeDelta >= GlobalMonitorManager._heartbeatTimeoutMilliSeconds) {
                    let monitorExchanges = await getMonitorAndExchanges(processkey);
                    GlobalMonitorManager.instance!.forkMonitorAsync(monitorExchanges!.monitor, monitorExchanges!.exchangeCredentials);
                };
            }
        }, 60000)
    }

    public static initiliaze(
        UserModel: MongooseModel<MonitorUser>,
        MonitorModel: MongooseModel<Monitor>,
        ExchangeCredentialsModel: MongooseModel<ExchangeCredentials>,
        TransactionModel: MongooseModel<Transaction>,
        PendingOrderModel: MongooseModel<PendingOrder>
    ) {
        if (GlobalMonitorManager.instance) {
            throw "GlobalMonitorManager can only be instantiated once, use GlobalMonitorManager.getInstance() instead"
        }

        return new GlobalMonitorManager(
            UserModel,
            MonitorModel,
            ExchangeCredentialsModel,
            TransactionModel,
            PendingOrderModel
        )
    }

    public static getInstance() {
        if (GlobalMonitorManager.instance) {
            return GlobalMonitorManager.instance;
        }
        throw "GlobalMonitorManager is not yet initizalided";
    }

    public stopMonitor(monitorId: string | Types.ObjectId) {
        const monitor = GlobalMonitorManager.instance?._globalMonitorRegistry[monitorId.toString()]
        if (monitor) {
            monitor.process.send(new StopMessage());
        }
    }

    public async forkMonitorAsync(monitor: Monitor, exchangeCredentials: ExchangeCredentials[]): Promise<void> {
        // fork process
        let monitorInstance = forkChildProcess(
            // path
            GlobalMonitorManager.instance!._monitorProcessPath,
            // argv
            [],
            // options
            { stdio: ['inherit', 'inherit', 'inherit', 'ipc'] }
        );
        var waitForMonitorReply = defer();
        monitorInstance.on("message", (message: MonitorMessageInterface<EmitMessageInterface>) => {
            if (message.type === "success") {
                switch (message.body.type as MessageTypeEnum) {
                    case MessageTypeEnum.MonitorStarted:
                        waitForMonitorReply.resolve();
                }
            }
        });
        await waitForMonitorReply;
        await GlobalMonitorManager.instance!.OnMonitorStartedMessageAsync(monitorInstance, monitor, exchangeCredentials);
        monitorInstance.on("message", GlobalMonitorManager.instance!.OnMessageRecievedAsync);
        let _globalMonitorRegistry = GlobalMonitorManager.instance!._globalMonitorRegistry;
        if (_globalMonitorRegistry[monitor._id.toString()]) {
            _globalMonitorRegistry[monitor._id.toString()].process.kill();
        }
        _globalMonitorRegistry[monitor._id.toString()] = {
            process: monitorInstance,
            lastSeen: +new Date()
        };
    }

    //#region EventHandlers
    private async OnMessageRecievedAsync(message: MonitorMessageInterface<EmitMessageInterface>) {
        if (message.type === "success") {
            switch (message.body.type as MessageTypeEnum) {
                case MessageTypeEnum.Heartbeat:
                    GlobalMonitorManager.instance!.OnMonitorHeartbeatMessage(message._monitorId!);
                    break;
                case MessageTypeEnum.MonitorStoped:
                    GlobalMonitorManager.instance!.OnMonitorStoppedMessage(message._monitorId!);
                    break;
                case MessageTypeEnum.DeltaZero:
                    GlobalMonitorManager.instance!.OnDeltaZeroMessage(message._monitorId!);
                    break;
                case MessageTypeEnum.NewTransaction:
                    const _newTransactionMessage = message.body as NewTransactionMessage;
                    await GlobalMonitorManager.instance!.OnNewTransactionMessageAsync(message._monitorId!, _newTransactionMessage);
            }
        } else {
            switch (message.body.type as MonitorErrorsEnum) {
                case MonitorErrorsEnum.TradeLimitReached:
                    const _tradeLimitReachedErrorMessage = message.body as TradeLimitReachedErrorMessage;
                    await GlobalMonitorManager.instance!.OnTradeLimitReachedErrorAsync(message._monitorId!, _tradeLimitReachedErrorMessage)
                    break;
                case MonitorErrorsEnum.MonitorHasPendingOrderError:
                    await GlobalMonitorManager.instance!.OnMonitorHasPendingOrderErrorAsync(message._monitorId!)
                    break;
                case MonitorErrorsEnum.BadConfiguration:
                    const _badConfigurationErrorMessage = message.body as BadConfigurationErrorMessage;
                    await GlobalMonitorManager.instance!.OnBadConfigurationError(message._monitorId!, _badConfigurationErrorMessage);
                    break;
                case MonitorErrorsEnum.UnexpectedError:
                    const _unexpectedErrorMessage = message.body as UnexpectedErrorMessage;
                    await GlobalMonitorManager.instance!.OnUnExpectedErrorAsync(message._monitorId!, _unexpectedErrorMessage);
            }
        }
    }

    private async OnMonitorHasPendingOrderErrorAsync(_monitorId: string) {
        console.log("OnMonitorHasPendingOrderErrorAsync", _monitorId);
        let monitor = await GlobalMonitorManager.instance!.MonitorModel.findById(_monitorId).exec();
        if(monitor){
            monitor.status = MonitorStatus.HasPendingOrders;
            await monitor.save();
            delete GlobalMonitorManager.instance!._globalMonitorRegistry[_monitorId];
        }

    }

    private OnMonitorHeartbeatMessage(_monitorId: string) {
        let lastSeen = GlobalMonitorManager.instance!._globalMonitorRegistry[_monitorId].lastSeen
        console.log("Heartbeat", _monitorId, ((+new Date()) - lastSeen));
        GlobalMonitorManager.instance!._globalMonitorRegistry[_monitorId].lastSeen = +new Date();
    }

    private async OnMonitorStartedMessageAsync(child: ChildProcess, monitor: Monitor, exchangeCredentials: ExchangeCredentials[]) {
        console.log("Process started");
        let pendingOrders = await GlobalMonitorManager.instance!.PendingOrderModel.find(
            { _monitor: monitor._id }
        ).exec();
        // send message to initiliaze monitor process
        child.send(new InitMessage({
            monitor: monitor,
            monitorExchangeCredentials: exchangeCredentials,
            hasPendingOrders: pendingOrders.length > 0
        }));
    }

    private OnMonitorStoppedMessage(_monitorId: string) {
        console.log("OnMonitorStopped", _monitorId);
        delete GlobalMonitorManager.instance!._globalMonitorRegistry[_monitorId.toString()];
    }

    private OnDeltaZeroMessage(_monitorId: string) {
        console.log("Delta Zero", _monitorId);
    }

    private async OnNewTransactionMessageAsync(_monitorId: string, transaction: NewTransactionMessage) {
        try {
            let newTransaction = new GlobalMonitorManager.instance!.TransactionModel(transaction.payload);
            await newTransaction.save();
            console.log("Transaction", _monitorId, transaction);
        } catch (e) {
            console.log(e);
        }
    }

    private async OnTradeLimitReachedErrorAsync(_monitorId: string, message: TradeLimitReachedErrorMessage) {
        let payload = message.payload;
        let newPendingOrder = new GlobalMonitorManager.instance!.PendingOrderModel(payload);
        await newPendingOrder.save()
        let monitor = await GlobalMonitorManager.instance!.MonitorModel.findById(_monitorId).exec();
        if(monitor){
            monitor.status = MonitorStatus.HasPendingOrders;
            await monitor.save();
            delete GlobalMonitorManager.instance!._globalMonitorRegistry[_monitorId];
        }
        console.log("OnTradeLimitReachedErrorAsync", _monitorId, message);
    }

    private async OnBadConfigurationError(_monitorId: string, message: BadConfigurationErrorMessage) {
        console.log("OnBadConfigurationError", _monitorId, message);
    }

    private async OnUnExpectedErrorAsync(_monitorId: string, message: UnexpectedErrorMessage) {
        console.log("OnUnExpectedErrorAsync", _monitorId, message);
    }
    //#endregion
}

async function getMonitorAndExchanges(mref: Monitor | string | Types.ObjectId | undefined) {
    const _globalMonitorManager = GlobalMonitorManager.getInstance();
    let monitor_id = mref instanceof Monitor ? mref._id : mref;
    let monitor = (await _globalMonitorManager.MonitorModel!.findById(monitor_id).exec())?.toObject() as Monitor | undefined;
    if (monitor) {


        let exchangeCredentials = await Promise.all(
            monitor.exchangeCredentials.map(
                async monitorExCred => {
                    let exchangeCredentials = await _globalMonitorManager.ExchangeCredentialsModel!.findById(monitorExCred.exchangeCredentials).exec();
                    return exchangeCredentials!.toObject() as ExchangeCredentials;
                })
        );
        return {
            monitor: monitor,
            exchangeCredentials: exchangeCredentials
        }

    }
}

async function getUserMonitors(_id: string): Promise<{ monitor: Monitor, exchangeCredentials: ExchangeCredentials[] }[] | null> {
    const _globalMonitorManager = GlobalMonitorManager.getInstance();
    let user = await _globalMonitorManager.UserModel!.findById(_id).exec()

    if (user) {
        return await Promise.all(user.monitors!.map(
            async mref => await getMonitorAndExchanges(mref) as { monitor: Monitor, exchangeCredentials: ExchangeCredentials[] }
        ));
    }
    return null;
};

export class UserMonitorManager {
    private _id: string;
    private _globalMonitorManager: GlobalMonitorManager;
    constructor(
        _id: string
    ) {
        this._globalMonitorManager = GlobalMonitorManager.getInstance();
        this._id = _id;
        getUserMonitors(this._id).then(monitors => {
            if (monitors) {
                monitors.filter(m => m.monitor.status === MonitorStatus.Running)
                    .forEach(monitor => this._globalMonitorManager.forkMonitorAsync(monitor.monitor, monitor.exchangeCredentials));
            }
        })
    }

    public async startMonitorAsync(monitorId: Types.ObjectId | string) {
        let m = await getMonitorAndExchanges(monitorId);
        if (m) {
            return this._globalMonitorManager.forkMonitorAsync(m.monitor, m.exchangeCredentials);
        }
        throw `${monitorId} not found`;
    }

    public async stopMonitorAsync() {

    }
}
