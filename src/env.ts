
import * as dotenv from "dotenv";
dotenv.config({ path: __dirname + '/.env' });

export const appRoutingPrefix = process.env.APP_ROUTING_PREFIX || "/";
export const conString = process.env.CONNECTION_STRING as string;
export const sessionSecret = process.env.SESSION_SECRET as string;
export const applicationPort = process.env.APPLICATION_PORT as string;
export const hashSaltrounds = +process.env.HASH_SALT_ROUND!;

console.log("import");