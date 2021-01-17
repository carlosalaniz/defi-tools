
import { NextFunction, Request, Response, Router } from "express";
import { Types } from "mongoose";
import { BinanceExchangeCredentials, ExchangeCredentials, ExchangeCredentialsModel, FTXExchangeCredentials, UserModel } from "../../lib/common/database";
import { Monitor, MonitorModel, MonitorUserModel } from "../../tools/yield_farming/database";
import { AutenticationHelpers } from "../common/AuthenticationHelpers";
import { AuthenticatedRequest, BasicAuthMW, validateUser as authenticateUser } from "../middleware/authentication";
import { ControllerInterface } from "./ControllerInterface";

export class ApiExchangeController extends ControllerInterface {
    routeHandleRegistry = {};
    constructor(router?: Router, prefix?: string) {
        super(router, prefix);
        this.routeHandleRegistry = {
            "/exchange": [
                { method: "post", callback: [BasicAuthMW, this.PostExchange] },
                { method: "get", callback: [BasicAuthMW, this.GetExchanges] },
            ]
        }
    }

    private async GetExchanges(req: AuthenticatedRequest, res: Response) {
        let exchanges = await ExchangeCredentialsModel.find({ _user: req.user!._id }).exec();
        res.status(200).json(exchanges.map(ex => ex.toSafeObject()));
    }

    private async PostExchange(req: AuthenticatedRequest, res: Response) {
        let validation = ExchangeCredentials.validate(req.body);
        if (validation.length > 0) {
            res.status(400).json(validation);
            return;
        }

        let exchangeCredentialsDo: ExchangeCredentials | FTXExchangeCredentials | BinanceExchangeCredentials = new ExchangeCredentials();
        exchangeCredentialsDo._user = req.user?._id;
        exchangeCredentialsDo.exchangeName = req.body.exchangeName;
        exchangeCredentialsDo.apikey = req.body.apikey;
        exchangeCredentialsDo.apisecret = req.body.apisecret;

        if (req.body.subaccount) {
            (exchangeCredentialsDo as FTXExchangeCredentials).subaccounts = req.body.subaccounts;
        }

        let exchangeCredentials = new ExchangeCredentialsModel(exchangeCredentialsDo);
        await exchangeCredentials.save();

        res.status(200).json(exchangeCredentials.toJSON({ virtuals: true }));
    };
}