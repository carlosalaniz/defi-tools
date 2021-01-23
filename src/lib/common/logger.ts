export const logger = {
    log: function (...args: any[]) { console.log(+new Date(), ...args) },
    warn: function (...args: any[]) { console.warn(+new Date(), ...args) },
    error: function (...args: any[]) { console.error(+new Date(), ...args) },
    info: function (...args: any[]) { console.info(+new Date(), ...args) },
    debug: function (...args: any[]) { console.debug(+new Date(), ...args) },
}