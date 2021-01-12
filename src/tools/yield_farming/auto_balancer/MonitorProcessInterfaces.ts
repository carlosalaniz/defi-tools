
//#region Enums and interfaces

import { ExchangeCredentials } from "../../../lib/common/database";
import { TransactionsSide } from "../../../lib/common/exchanges/HttpExchangeInterfaces";
import { Monitor, PendingOrder, Transaction } from "../database";



//#region Enums

export const HeartbeatMilliSeconds = 10000;

export enum MessageTypeEnum {
    MonitorStoped = "MonitorStoped",
    NewTransaction = "NewTransaction",
    MonitorStarted = "MonitorStarted",
    DeltaZero = "DeltaZero",
    Heartbeat = "Heartbeat"
}


export enum MonitorErrorsEnum {
    BadConfiguration = "BadConfiguration",
    UnexpectedError = "UnexpectedError",
    TradeLimitReached = "TradeLimitReached",
    MonitorHasPendingOrderError = "MonitorHasPendingOrderError"
}
//#endregion


export interface EmitMessageInterface {
    type: MessageTypeEnum | MonitorErrorsEnum,
    payload?: any,
    commandReply?: boolean
}


export interface CommandRequestInterface {
    command: "stop" | "status"
}

export interface InitParametersInterface {
    monitor: Monitor;
    monitorExchangeCredentials: ExchangeCredentials[];
    hasPendingOrders: boolean
}


//#region Message Types
export class NewTransactionMessage implements EmitMessageInterface {
    type = MessageTypeEnum.NewTransaction;
    payload: Transaction;
    constructor(transaction: Transaction) {
        this.payload = transaction;
    }
}

export class DeltaZeroMessage implements EmitMessageInterface {
    type = MessageTypeEnum.DeltaZero;
}

export class MonitorStoppedMessage implements EmitMessageInterface {
    type = MessageTypeEnum.MonitorStoped;
    payload = undefined;
    commandReply = true
}

export class HeartbeatMessage implements EmitMessageInterface {
    type = MessageTypeEnum.Heartbeat;
    payload = undefined;
}

export interface ErrorMessageInterface extends EmitMessageInterface {
    type: MonitorErrorsEnum;
}

export class MonitorHasPendingOrderErrorMessage implements ErrorMessageInterface {
    type = MonitorErrorsEnum.MonitorHasPendingOrderError;
}

export class UnexpectedErrorMessage implements ErrorMessageInterface {
    type = MonitorErrorsEnum.UnexpectedError;
    payload: any;
    constructor(error: any) {
        this.payload = error
    }
}

export class BadConfigurationErrorMessage implements ErrorMessageInterface {
    type = MonitorErrorsEnum.BadConfiguration;
    payload: string;
    constructor(error: any) {
        this.payload = error
    }
}

export class TradeLimitReachedErrorMessage implements ErrorMessageInterface {
    type = MonitorErrorsEnum.TradeLimitReached;
    payload: {
        message: string
    } & PendingOrder;
    constructor(orderDetails: PendingOrder & { message: string }) {
        this.payload = orderDetails
    }
}

export class MonitorStarted implements EmitMessageInterface {
    type: MessageTypeEnum | MonitorErrorsEnum = MessageTypeEnum.MonitorStarted;
    payload: any = "OK";
}

type StopMessageInterface = MonitorMessageInterface<CommandRequestInterface>
export class StopMessage implements StopMessageInterface {
    action: "command" = "command";
    body: CommandRequestInterface = { command: "stop" };
    constructor() { }
}

type InitMessageInterface = MonitorMessageInterface<InitParametersInterface>
export class InitMessage implements InitMessageInterface {
    action: "init";
    body: InitParametersInterface;
    constructor(payload: InitParametersInterface) {
        this.action = "init";
        this.body = payload;
    }

}
//#endregion


export interface MonitorMessageInterface<T = InitParametersInterface | CommandRequestInterface | EmitMessageInterface> {
    _monitorId?: string;
    action: "init" | "command" | "messageout",
    type?: "success" | "error"
    body: T
}

//#endregion
