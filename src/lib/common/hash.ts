import * as bcrypt from "bcryptjs";

export default class HashHelper {
    saltrounds: number;
    constructor(configuration: { saltrounds: number }) {
        this.saltrounds = configuration.saltrounds;
    }

    public hash(text: string): string {
        let salt = bcrypt.genSaltSync(this.saltrounds);
        return bcrypt.hashSync(text, salt)
    };

    public compare(text: string, hash: string): boolean {
        return bcrypt.compareSync(text, hash);
    }
}