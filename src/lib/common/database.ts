import "reflect-metadata";
import { Base, TimeStamps } from "@typegoose/typegoose/lib/defaultClasses";
import { plugin, mongoose, getModelForClass, index, Ref, DocumentType, prop, modelOptions, getDiscriminatorModelForClass } from '@typegoose/typegoose';
import mhidden from "mongoose-hidden";
export type MongooseModel<T> = mongoose.Model<DocumentType<T>>;
export type MongooseDocument<T> = DocumentType<T>;
export enum ExchangeNames { FTX = "FTX", BINANCE = "BINANCE" }
const hideFields = mhidden({ defaultHidden: {} });



export interface User extends Base { }
@plugin(hideFields)
export class User extends TimeStamps {
    @prop({ lowercase: true, index: true, unique: true })
    public email!: string;

    @prop({hide: true, hideJSON: true})
    public password!: string;
}

export interface ExchangeCredentials extends Base { }
@index({ apikey: 1, apisecret: 1 }, { unique: true })
export class ExchangeCredentials extends TimeStamps {
    @prop({ required: true, enum: ExchangeNames })
    public exchangeName?: ExchangeNames;

    @prop({ unique: true, required: true })
    public apikey?: string;

    @prop({ unique: true, required: true })
    public apisecret?: string;
}

export class FTXExchangeCredentials extends ExchangeCredentials {
    @prop({ required: true, default: ExchangeNames.FTX })
    public exchangeName: ExchangeNames = ExchangeNames.FTX;

    @prop({ required: true, type: [String] })
    public subaccounts!: string[];
}

export class BinanceExchangeCredentials extends ExchangeCredentials {
    @prop({ required: true, default: ExchangeNames.BINANCE })
    public exchangeName: ExchangeNames = ExchangeNames.BINANCE;
}

export const UserModel: MongooseModel<User> = getModelForClass(User); // UserModel is a regular Mongoose Model with correct types
export const ExchangeCredentialsModel: MongooseModel<ExchangeCredentials> = getModelForClass(ExchangeCredentials); // UserModel is a regular Mongoose Model with correct types
export const FTXExchangeCredentialsModel: MongooseModel<FTXExchangeCredentials> = getDiscriminatorModelForClass(ExchangeCredentialsModel, FTXExchangeCredentials);
export const BinanceExchangeCredentialsModel: MongooseModel<BinanceExchangeCredentials> = getDiscriminatorModelForClass(ExchangeCredentialsModel, BinanceExchangeCredentials);
