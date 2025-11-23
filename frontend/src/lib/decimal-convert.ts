import {Decimal} from "@prisma/client/runtime/library";

/**
 * Prisma Decimal type, which is not supported in client components,
 * needs to be converted to a string or number before being passed
 * to the client.
 *
 * This function converts all Decimal types in an object to strings.
 *
 * @param obj
 */
export const convertDecimalToString = <T>(obj: T): T => {
    if (obj === null || obj === undefined) {
        return obj;
    }

    if (Decimal.isDecimal(obj)) {
        return obj.toString() as any as T;
    }

    if (Array.isArray(obj)) {
        return obj.map(item => convertDecimalToString(item)) as any as T;
    }

    if (typeof obj === 'object') {
        const newObj = {...obj} as T;
        for (const key in newObj) {
            if (Object.prototype.hasOwnProperty.call(newObj, key)) {
                (newObj as any)[key] = convertDecimalToString((newObj as any)[key]);
            }
        }
        return newObj;
    }

    return obj;
};

export default convertDecimalToString;
