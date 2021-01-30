
import { mongoose } from "@typegoose/typegoose";
import { Response, Router } from "express";
import { Types, startSession } from "mongoose";
import { BinanceExchangeCredentialsModel, ExchangeCredentialsModel, ExchangeNames, FTXExchangeCredentialsModel } from "../../../lib/common/database";
import { GlobalMonitorManager } from "../../../tools/yield_farming/auto_balancer/GlobalMonitorManager";
import { Monitor, MonitorModel, MonitorReportModel, MonitorStatus, MonitorUserModel, PendingOrderModel, Transaction, TransactionModel } from "../../../tools/yield_farming/database";
import { AuthenticatedRequest, BasicAuthMW } from "../../middleware/authentication";
import { ControllerInterface } from "../ControllerInterface";

export class ApiYieldfarmingMonitorController extends ControllerInterface {
    routeHandleRegistry = {};
    constructor(router?: Router, prefix?: string) {
        super(router, prefix);
        this.routeHandleRegistry = {
            "/monitor": [
                { method: "get", callback: [BasicAuthMW, this.GETAllMonitors] },
                { method: "post", callback: [BasicAuthMW, this.PostMonitor] },
            ],
            "/monitor/:_id": [
                { method: "delete", callback: [BasicAuthMW, this.DELETEMonitor] },
                { method: "get", callback: [BasicAuthMW, this.GETSingleMonitor] }
            ],
            "/monitor/:_id/toggle": [
                { method: "post", callback: [BasicAuthMW, this.PostToggleMonitor] }
            ],
            "/monitor/:_id/transactions": [
                { method: "get", callback: [BasicAuthMW, this.GETMonitorTransactions] }
            ],
            "/monitor/:_id/reports": [
                { method: "get", callback: [BasicAuthMW, this.GETMonitorReport] }
            ],
            "/monitor/:_id/pending-orders": [
                { method: "get", callback: [BasicAuthMW, this.GETMonitorPendingOrders] },
                { method: "post", callback: [BasicAuthMW, this.POSTResolvePendingOrder] }
            ],
        }
    }

    private async GETMonitorReport(req: AuthenticatedRequest, res: Response) {
        const { _id } = req.params;
        if (_id) {
            let monitor = await MonitorModel.findById(_id)
                .populate("transactions")
                .exec();
            let monitorUser = await MonitorUserModel.findOne({ _user: req.user!._id }).exec()

            if (monitor && monitor._user!.toString() === monitorUser!._id.toString()) {
                let reports = await MonitorReportModel.find({ "report._mid": monitor._id })
                    .sort({ createdAt: -1 })
                    .exec();
                return res.status(200).json(reports.map(r => r.toJSON()));
            }
        }
        res.status(400).json("400 Bad Request");
    }

    private async DELETEMonitor(req: AuthenticatedRequest, res: Response) {
        const { _id } = req.params;
        if (_id) {
            let instance = GlobalMonitorManager.getInstance()
            await instance.stopMonitorAsync(_id);
            await TransactionModel.deleteMany({ _monitor: _id.toString() }).exec();
            await MonitorModel.deleteOne({ _id: _id.toString() }).exec();
            return res.status(200).json("");
        }
        res.status(400).json("400 Bad Request");
    }


    private async GETMonitorTransactions(req: AuthenticatedRequest, res: Response) {
        const { _id } = req.params;
        if (_id) {
            let monitor = await MonitorModel.findById(_id)
                .populate({ path: 'transactions', populate: { path: 'exchangeData.exchangeCredentials' } })
                .exec();
            let monitorUser = await MonitorUserModel.findOne({ _user: req.user!._id }).exec()
            if (monitor && monitor._user!.toString() === monitorUser!._id.toString()) {
                return res.status(200).json(monitor.toJSON({ virtuals: true }).transactions.map((t: any) => {
                    delete t.exchangeData.exchangeCredentials.apisecret
                    return t;
                }).sort((a: Transaction, b: Transaction) => +(b.createdAt as Date) - +(a.createdAt as Date)));
            }
        }
        res.status(400).json("400 Bad Request");
    }

    private async GETMonitorPendingOrders(req: AuthenticatedRequest, res: Response) {
        const { _id } = req.params;
        if (_id) {
            let monitor = await MonitorModel.findById(_id)
                .populate({ path: 'transactions', populate: { path: 'exchangeData.exchangeCredentials' } })
                .exec();
            let monitorUser = await MonitorUserModel.findOne({ _user: req.user!._id }).exec()
            if (monitor && monitor._user!.toString() === monitorUser!._id.toString()) {
                let pendingOrders = await PendingOrderModel.find({ _monitor: _id, resolved: false }).exec();
                return res.status(200).json(pendingOrders.map(po => po.toJSON()));
            }
        }
        res.status(400).json("400 Bad Request");
    }

    private async PostMonitor(req: AuthenticatedRequest, res: Response) {
        let validation = Monitor.validate(req.body);
        if (validation.length > 0) {
            res.status(400).json(validation);
            return;
        }
        const session = await startSession();
        session.startTransaction();
        try {
            let monitorUser = await MonitorUserModel.findOne({ _user: req.user!._id }).session(session);
            if (!monitorUser) {
                monitorUser = new MonitorUserModel();
                monitorUser._user = req.user!._id;
                monitorUser.monitors = [];
                monitorUser.exchangeCredentials = [];
                await monitorUser.save({ session: session });
            }

            await Promise.all(req.body.exchangeData.map(async (exData: any, i: number) => {
                let exCredentials = await ExchangeCredentialsModel.findOne({ apikey: exData.apikey }).session(session);
                if (!exCredentials) {
                    if (exData.exchange.toUpperCase() === ExchangeNames.FTX) {
                        exCredentials = new FTXExchangeCredentialsModel();
                        exCredentials.subaccounts = [exData.subaccount];
                    } else {
                        exCredentials = new BinanceExchangeCredentialsModel();
                    }
                    exCredentials.apikey = exData.apikey;
                    exCredentials.apisecret = exData.apisecret;
                    exCredentials._user = req.user!._id;
                    await exCredentials.save({ session });
                }
                monitorUser!.exchangeCredentials!.push(exCredentials._id)
                req.body.exchangeData[i].exchangeCredentials = exCredentials._id;
                delete req.body.exchangeData[i].apikey;
                delete req.body.exchangeData[i].apisecret;
                delete req.body.exchangeData[i].exchange;
            }));
            req.body.exchangeData = req.body.exchangeData.map((exD: any) => {
                exD.orderDistributionPercentage = exD.orderDistributionPercentage / 100;
                return exD;
            })
            let monitor = new MonitorModel(req.body);
            monitor._user = monitorUser._id;
            await monitor.save({ session });

            monitorUser.monitors.push(monitor._id);
            await monitorUser.save({ session });

            await session.commitTransaction();
            session.endSession();

            res.status(200).json(req.body);
        } catch (e) {
            await session.abortTransaction();
            session.endSession();
            res.status(400).json(e.message);
        }
    };

    private async POSTResolvePendingOrder(req: AuthenticatedRequest, res: Response) {
        let {
            order_id
        } = req.body;
        let pendingOrder = await PendingOrderModel.findById(order_id).exec();
        pendingOrder!.resolved = true;
        await pendingOrder!.save();
        res.status(200).json("OK");
    };

    private async GETAllMonitors(req: AuthenticatedRequest, res: Response) {
        let monitorUser = await MonitorUserModel.findOne({ _user: req.user!._id }).exec();
        if (!monitorUser) {
            monitorUser = new MonitorUserModel();
            monitorUser._user = req.user!._id;
            monitorUser.monitors = [];
            monitorUser.exchangeCredentials = [];
            await monitorUser.save();
        }
        let monitors = await MonitorModel.find({ _id: { $in: monitorUser.monitors as Types.ObjectId[] } })
            .populate("exchangeData.exchangeCredentials").exec();
        return res.status(200).json(
            monitors
                .map(m => m.toJSON({ virtuals: true }))
                .map((m: any) => {
                    delete m.transactions;
                    m.exchangeData.forEach((d: any) => {
                        delete d.exchangeCredentials.apisecret;
                    })
                    return m;
                }));
    }

    private async GETSingleMonitor(req: AuthenticatedRequest, res: Response) {
        const { _id } = req.params;
        if (_id) {
            let monitor = await MonitorModel.findById(_id)
                .populate("exchangeData.exchangeCredentials")
                .exec();
            if (monitor && monitor._user!.toString() === req.user!._id.toString()) {
                return res.status(200).json(monitor.toJSON({ virtuals: true }));
            }
        }
        res.status(400).json("400 Bad Request");
    }

    private async PostToggleMonitor(req: AuthenticatedRequest, res: Response) {
        const { _id } = req.params;
        if (_id) {
            let monitor = await MonitorModel.findById(_id)
                .populate("exchangeData.exchangeCredentials")
                .exec();
            let monitorUser = await MonitorUserModel.findOne({ _user: req.user!._id }).exec();
            if (monitor && monitor._user!.toString() === monitorUser!._id.toString()) {
                let monitorManager = GlobalMonitorManager.getInstance();
                if (monitor.status === MonitorStatus.Running) {
                    await monitorManager.stopMonitorAsync(monitor._id)
                } else {
                    await monitorManager.startMonitorAsync(monitor._id);
                }
                res.status(200).json("");
                return;
            }
        }
        res.status(400).json("400 Bad Request");
    }

}
