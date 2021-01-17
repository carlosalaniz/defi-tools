
import { NextFunction, Request, Response, Router } from "express";
import { Types } from "mongoose";
import { UserModel } from "../../lib/common/database";
import { Monitor, MonitorModel, MonitorReportModel, MonitorUserModel } from "../../tools/yield_farming/database";
import { AutenticationHelpers } from "../common/AuthenticationHelpers";
import { AuthenticatedRequest, BasicAuthMW, validateUser as authenticateUser } from "../middleware/authentication";
import { ControllerInterface } from "./ControllerInterface";

export class ApiMonitorController extends ControllerInterface {
    routeHandleRegistry = {};
    constructor(router?: Router, prefix?: string) {
        super(router, prefix);
        this.routeHandleRegistry = {
            "/monitor": [
                { method: "get", callback: [BasicAuthMW, this.GETAllMonitors] },
                { method: "post", callback: [BasicAuthMW, this.PostMonitor] },
            ],
            "/monitor/:_id": [
                { method: "get", callback: [BasicAuthMW, this.GETSingleMonitor] }
            ],
            "/monitor/:_id/transactions": [
                { method: "get", callback: [BasicAuthMW, this.GETMonitorTransactions] }
            ],
            "/monitor/:_id/report": [
                { method: "get", callback: [BasicAuthMW, this.GETMonitorReport] }
            ]
        }
    }

    private async GETMonitorReport(req: AuthenticatedRequest, res: Response) {
        const { _id } = req.params;
        if (_id) {
            let monitor = await MonitorModel.findById(_id)
                .populate("transactions")
                .exec();
            if (monitor && monitor._user!.toString() === req.user!._id.toString()) {
                let reports = await MonitorReportModel.find({ "report._mid": monitor._id }).exec();
                return res.status(200).json(reports.map(r => r.toJSON()));
            }
        }
        res.status(400).json("400 Bad Request");
    }

    private async GETMonitorTransactions(req: AuthenticatedRequest, res: Response) {
        const { _id } = req.params;
        if (_id) {
            let monitor = await MonitorModel.findById(_id)
                .populate("transactions")
                .exec();
            if (monitor && monitor._user!.toString() === req.user!._id.toString()) {
                return res.status(200).json(monitor.toJSON({ virtuals: true }).transactions);
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

        let monitorUser = await MonitorUserModel.findOne({ _user: req.user!._id }).exec();
        if (!monitorUser) {
            monitorUser = new MonitorUserModel();
            monitorUser._user = req.user!._id;
            monitorUser.monitors = [];
            monitorUser.exchangeCredentials = [];
            await monitorUser.save();
        }

        let monitor = new MonitorModel(req.body);
        await monitor.save()

        monitorUser.monitors.push(monitor._id);
        await monitorUser.save();

        res.status(200).json(req.body);
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
        return res.status(200).json(monitors.map(m => m.toJSON({ virtuals: true })));
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

}