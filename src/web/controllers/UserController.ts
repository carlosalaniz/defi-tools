
import { NextFunction, Request, Response, Router } from "express";
import { UserModel } from "../../lib/common/database";
import { AutenticationHelpers } from "../common/AuthenticationHelpers";
import { AuthenticatedRequest, BasicAuthMW, validateUser as authenticateUser } from "../middleware/authentication";
import { ControllerInterface } from "./ControllerInterface";

export class ApiUserController extends ControllerInterface {
    routeHandleRegistry = {};
    constructor(router?: Router, prefix?: string) {
        super(router, prefix);
        this.routeHandleRegistry = {
            "/login": [
                { method: "post", callback: [this.POSTLoginCallbackAsync] },
            ],
            "/register": [
                { method: "post", callback: [this.PostRegisterCallback] }
            ]
        }
    }

    private async POSTLoginCallbackAsync(req: Request, res: Response) {
        let body = req.body as { email?: string, password?: string };
        if (body.email && body.password) {
            if (await authenticateUser(body.email, body.password)) {
                let encodedCredentials = Buffer.from(`${body.email}:${body.password}`).toString('base64')
                return res.status(200).json(encodedCredentials)
            }
        }
        res.status(400).json("400 Bad Request");
    }

    private async PostRegisterCallback(req: Request, res: Response, next?: NextFunction) {
        let body = req.body as { email?: string, password?: string };
        
        if (body.email && body.password) {
            let user = await UserModel.findOne({ email: body.email }).exec();
            if (!user) {
                let hashHelper = AutenticationHelpers.Hash();
                let newUser = new UserModel();
                newUser.email = body.email;
                newUser.password = hashHelper.hash(body.password);
                let encodedCredentials = Buffer.from(`${body.email}:${body.password}`).toString('base64')
                res.json(encodedCredentials);
                await newUser.save();
                if (next) next();
                return;
            }
        }

        res.status(400).json("400 Bad Request");
    }
}