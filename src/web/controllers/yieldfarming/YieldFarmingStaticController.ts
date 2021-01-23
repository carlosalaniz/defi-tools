import { Request, Response, Router } from "express";
import { ControllerInterface } from "../ControllerInterface";

export class YieldFarmingStaticController extends ControllerInterface {
    routeHandleRegistry = {};
    constructor(router?: Router, prefix?: string) {
        super(router, prefix);
        this.routeHandleRegistry = {
            "/": { method: "get", callback: [this.RenderMonitorListView] },
            "/monitor/:mid/transactions": { method: "get", callback: [this.RenderMonitorTransactionListView] },
            "/monitor/:mid/reports": { method: "get", callback: [this.RenderMonitorReportView] }
        };
    }

    private RenderMonitorListView(req: Request, res: Response) { res.render('yieldfarming/monitor-list'); }
    private RenderMonitorTransactionListView(req: Request, res: Response) { res.render('yieldfarming/monitor-transaction-list'); }
    private RenderMonitorReportView(req: Request, res: Response) { res.render('yieldfarming/monitor-reports'); }
}
