import { Router, Request, Response, NextFunction } from "express";
type routeHandler = {
    method: "get" | "post" | "put" | "delete",
    callback: ((req: Request, res: Response, next?: NextFunction) => void | Promise<void>)[];
};
export abstract class ControllerInterface {
    protected abstract routeHandleRegistry: {
        [path: string]: routeHandler | routeHandler[]
    }
    protected constructor(protected router?: Router, protected prefix?: string) { }

    protected registerRoutes(): void {
        for (let path in this.routeHandleRegistry) {
            let handler = this.routeHandleRegistry[path];
            if (!Array.isArray(handler)) handler = [handler];
            handler.forEach(handler => {
                this.router![handler.method](this.prefix + path, ...handler.callback);
            })
        }
    }
    static self<T = ControllerInterface>(this: { new(router?: Router, prefix?: string): T }) {
        let instance = new this() as T;
        return instance;
    }

    get routes(): string[] {
        return Object.keys(this.routeHandleRegistry).map(route => this.prefix + route);
    }

    static register<T = ControllerInterface>(this: { new(router?: Router, prefix?: string): T }, router: Router, prefix: string) {
        let instance: ControllerInterface = new this(router, prefix) as any;
        instance.registerRoutes();
        return instance;
    }
}