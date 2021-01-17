import { Request, Response } from "express";
import { User, UserModel } from "../../lib/common/database";
import { AutenticationHelpers } from "../common/AuthenticationHelpers";
export async function validateUser(email: string, password: string) {
    let user = await UserModel.findOne({ email: email }).exec();
    if (user) {
        let hashHelper = AutenticationHelpers.Hash();
        if (hashHelper.compare(password, user.password)) {
            return user.toJSON({ virtuals: true }) as User;
        }
    }
    return false;
}
export type AuthenticatedRequest = Request & { user?: User };
export async function BasicAuthMW(req: AuthenticatedRequest, res: Response, next: any) {
    if (req.headers.authorization) {
        let basicAuthHeader = req.headers.authorization;
        if (/Basic .*/.test(basicAuthHeader)) {
            // Valid header
            let encodedValue = basicAuthHeader.split(" ")[1];
            let decodedValue = Buffer.from(encodedValue, 'base64').toString();
            if (/.*:.*/.test(decodedValue)) {
                let credentials = decodedValue.split(":");
                let email = credentials[0];
                let password = credentials[1];
                let user = await validateUser(email, password);
                if (user) {
                    req.user = user;
                    return next();
                }
            }
        }
    }
    res.status(401).json("Unauthorized");
}