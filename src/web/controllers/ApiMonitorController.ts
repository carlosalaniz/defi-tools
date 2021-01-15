
import { NextFunction, Request, Response, Router } from "express";
import { Types } from "mongoose";
import { UserModel } from "../../lib/common/database";
import { Monitor, MonitorModel, MonitorUserModel } from "../../tools/yield_farming/database";
import { AutenticationHelpers } from "../common/AuthenticationHelpers";
import { AuthenticatedRequest, BasicAuthMW, validateUser as authenticateUser } from "../middleware/authentication";
import { ControllerInterface } from "./ControllerInterface";

export class ApiMonitorController extends ControllerInterface {
    routeHandleRegistry = {};
    constructor(router: Router, prefix: string) {
        super(router, prefix);
        this.routeHandleRegistry = {
            "/monitor": [
                { method: "get", callback: [BasicAuthMW, this.GETAllMonitors] },
                { method: "post", callback: [BasicAuthMW, this.PostMonitor] },
            ],
            "/monitor/:_id": [
                { method: "get", callback: [BasicAuthMW, this.GETSingleMonitor] }
            ]
        }
    }

    private async PostMonitor(req: AuthenticatedRequest, res: Response) {
        let missingFields = Monitor.validate(req.body);
        if (missingFields.length > 0) {
            res.status(400).json({ missingfields: missingFields });
            return;
        }
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