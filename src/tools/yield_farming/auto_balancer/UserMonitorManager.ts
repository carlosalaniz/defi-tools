import { Types } from 'mongoose';
import { MonitorStatus } from '../database';
import { GlobalMonitorManager, getUserMonitors, getMonitorAndExchanges } from './GlobalMonitorManager';


export class UserMonitorManager {
    private _id: string;
    private _globalMonitorManager: GlobalMonitorManager;
    constructor(
        _id: string
    ) {
        this._globalMonitorManager = GlobalMonitorManager.getInstance();
        this._id = _id;
        getUserMonitors(this._id).then(monitors => {
            if (monitors) {
                monitors.filter(m => m.monitor.status === MonitorStatus.Running)
                    .forEach(monitor => this._globalMonitorManager.forkMonitorAsync(monitor.monitor, monitor.exchangeCredentials));
            }
        });
    }

    public async startMonitorAsync(monitorId: Types.ObjectId | string) {
        let m = await getMonitorAndExchanges(monitorId);
        if (m) {
            return this._globalMonitorManager.forkMonitorAsync(m.monitor, m.exchangeCredentials);
        }
        throw `${monitorId} not found`;
    }

    public async stopMonitorAsync() {
    }
}
