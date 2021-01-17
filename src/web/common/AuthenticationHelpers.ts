
import * as env from "../../env";
import HashHelper from "../../lib/common/hash";
export class AutenticationHelpers {
    static singletons: { hash?: HashHelper } = {}
    static Hash(): HashHelper {
        if (!AutenticationHelpers.singletons.hash) {
            AutenticationHelpers.singletons.hash = new HashHelper({ saltrounds: env.hashSaltrounds });
        }
        return AutenticationHelpers.singletons.hash;
    }
}