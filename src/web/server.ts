import * as env from "../env";
import express_session from "express-session";


import { mongoose } from "@typegoose/typegoose";
import express, { IRouterHandler, IRouterMatcher } from "express";
import { ApiUserController } from "./controllers/UserController";
import path from "path";
import { StaticController } from "./controllers/StaticController";
import { ApiYieldfarmingMonitorController } from "./controllers/yieldfarming/ApiYieldfarmingMonitorController";
import { ApiExchangeController } from "./controllers/ApiExchangeController";
import { YieldFarmingStaticController } from "./controllers/yieldfarming/YieldFarmingStaticController";

export default (async () => {
    // Connect to Database.
    mongoose.set('useCreateIndex', true);
    await mongoose.connect(env.conString,
        {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

    const router = express.Router();
    const app = express();

    // Session
    app.use(express_session({
        secret: env.sessionSecret,
        resave: false,
        saveUninitialized: true,
    }))

    app.use(express.json());
    app.set('views', path.join(__dirname, 'views'))
    app.set('view engine', 'ejs');
    app.use(express.static(path.join(__dirname, 'public')))
    app.use((rq, rs, n) => { rs.set('Cache-Control', 'no-store'); n() });

    // Register controllers.
    let routes = [
        StaticController.register(router, ""),
        ApiUserController.register(router, "/api"),
        ApiExchangeController.register(router, "/api"),
        YieldFarmingStaticController.register(router, "/yf"),
        ApiYieldfarmingMonitorController.register(router, "/api/yf"),
    ].map(controller => controller.routes);
    console.log(routes.flat());

    app.use("/", router);
    app.locals = {
        site: {
            app_routing_prefix: (env.appRoutingPrefix.length > 1) ? env.appRoutingPrefix : ""
        },
    }
    app.set('etag', false)
    app.listen(env.applicationPort);
    console.log(`Listening to port ${env.applicationPort}`)
});