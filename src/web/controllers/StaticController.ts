
import { Request, Response, Router } from "express";
import { BasicAuthMW } from "../middleware/authentication";
import { ControllerInterface } from "./ControllerInterface";

export class StaticController extends ControllerInterface {
    routeHandleRegistry = {};
    constructor(router?: Router, prefix?: string) {
        super(router, prefix);
        this.routeHandleRegistry = {
            "/": { method: "get", callback: [this.RenderIndexView] },
            "/login": { method: "get", callback: [this.RenderLoginView] },
            "/register": { method: "get", callback: [this.RenderRegisterView] }
        }
    }

    private RenderIndexView(req: Request, res: Response) {
        res.render('index');
    }

    private RenderLoginView(req: Request, res: Response) {
        res.render('login');
    }

    private RenderRegisterView(req: Request, res: Response) {
        res.render('register');
    }
}
