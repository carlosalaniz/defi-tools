import { prop, getModelForClass, Ref } from '@typegoose/typegoose';
import { Base, TimeStamps } from '@typegoose/typegoose/lib/defaultClasses';
import { ExchangeCredentials, MongooseModel, User } from '../../lib/common/database';
import { ContractEnum } from '../../lib/common/defi/ContractEnum';
import { TransactionsSide } from '../../lib/common/exchanges/HttpExchangeInterfaces';
import { ValidateRequiredFields } from '../../lib/common/mischelpers';


//#region SUBDOCUMENTS
export class MonitorTradeSettings {
    @prop()
    public tradeMinimumAmount!: number;

    @prop()
    public tradeMaxminumAmount!: number;

    @prop()
    public refreshRateSeconds!: number;
}

export class MonitorExchangeCredentials {
    @prop({ ref: "ExchangeCredentials", required: true })
    public exchangeCredentials!: Ref<ExchangeCredentials>

    @prop({ required: true })
    public market!: string

    @prop({ required: true })
    public tradeSymbol!: string;

    @prop({ default: 1 })
    public orderDistributionPercentage!: number;
}

export class FTXMonitorExchangeCredentials extends MonitorExchangeCredentials {
    @prop()
    public subaccount!: string;
}
//#endregion 

//#region ENUMS

export enum MonitorStatus {
    Running = 'running',
    Stopped = "stopped",
    HasPendingOrders = 'haspendingorders',
    HasBadConfiguration = 'hasbadconfiguration'
}
//#endregion

//#region DOCUMENTS

export interface Transaction extends Base { }
export class Transaction extends TimeStamps {
    @prop({
        type: MonitorExchangeCredentials, _id: false
    })
    public exchangeCredentials!: FTXMonitorExchangeCredentials | MonitorExchangeCredentials;

    @prop({ ref: 'Monitor' })
    public _monitor!: Ref<Monitor>;

    @prop({ enum: TransactionsSide })
    public side?: TransactionsSide;

    @prop()
    public size?: number;

    @prop({ default: undefined })
    public transactionBatchId?: string;

    @prop({ default: 1 })
    public orderDistributionPercentage!: number;
}

export interface PendingOrder extends Base { }
export class PendingOrder extends TimeStamps {
    @prop({ ref: 'Monitor' })
    public _monitor!: Ref<Monitor>;

    @prop()
    public ordersize!: number;

    @prop({ enum: TransactionsSide })
    public side!: TransactionsSide;
}


export interface MonitorReport extends Base { }
export class MonitorReport extends TimeStamps {
    @prop()
    report!: any
}

export interface Monitor extends Base { }
export class Monitor extends TimeStamps {
    @prop({ ref: 'MonitorUser' })
    public _user!: Ref<MonitorUser>;

    @prop({
        type: FTXMonitorExchangeCredentials, _id: false
    })
    public exchangeData!: (FTXMonitorExchangeCredentials | MonitorExchangeCredentials)[];

    @prop({ type: MonitorTradeSettings, _id: false })
    public tradeSettings!: MonitorTradeSettings;

    @prop({ enum: ContractEnum, required: true })
    public contractName!: ContractEnum;

    @prop({ required: true })
    public contractAddress!: string;

    @prop()
    public web3HttpConnectionString!: string;

    @prop()
    public walletAddress!: string;

    @prop()
    public targetAssetAddress!: string;

    @prop({ enum: MonitorStatus })
    public status!: MonitorStatus;

    @prop({ ref: 'Transaction' })
    public transactions?: Transaction[];

    static validate(m: Partial<Monitor>): string[] {
        let missingFields =
            ValidateRequiredFields(m, [
                "exchangeData",
                "exchangeData.exchangeCredentials",
                "exchangeData.market",
                "exchangeData.tradeSymbol",
                "exchangeData.orderDistributionPercentage",
                "tradeSettings",
                "tradeSettings.tradeMinimumAmount",
                "tradeSettings.tradeMaxminumAmount",
                "tradeSettings.refreshRateSeconds",
                "contractName",
                "contractAddress",
                "web3HttpConnectionString",
                "walletAddress",
                "targetAssetAddress"
            ])
        return missingFields;
    }

}
export interface MonitorUser extends Base { }
export class MonitorUser extends TimeStamps {
    @prop({ ref: 'User', unique: true })
    public _user!: Ref<User>;

    @prop({ ref: 'Monitor' })
    public monitors!: Ref<Monitor>[];

    @prop({ ref: "ExchangeCredentials" })
    public exchangeCredentials?: Ref<ExchangeCredentials>[]
}

/**
    interface MonitorUserDocument extends BaseExtention {} 
    class MonitorUserDocument extends MonitorUser{}

    export interface TransactionDocument extends BaseExtention {} 
    export class TransactionDocument extends Transaction{}


    export interface MonitorDocument extends BaseExtention {} 
    export class MonitorDocument extends Monitor{} 
*/

// public nest: Nested;
//#endregion
export const MonitorUserModel: MongooseModel<MonitorUser> = getModelForClass(MonitorUser);
export const TransactionModel: MongooseModel<Transaction> = getModelForClass(Transaction);
export const MonitorModel: MongooseModel<Monitor> = getModelForClass(Monitor);
export const PendingOrderModel: MongooseModel<PendingOrder> = getModelForClass(PendingOrder);
export const MonitorReportModel: MongooseModel<MonitorReport> = getModelForClass(MonitorReport);