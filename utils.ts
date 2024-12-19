import { ethers } from "ethers"
import dotenv from "dotenv"
import JSBI from "jsbi"

dotenv.config()

export const getProvider = (_chainId: number) => {

    if (_chainId !== 56 && _chainId !== 8453 && _chainId !== 137)
        throw new Error("Wrong chain ID.");


    var provider

    if (_chainId === 56)
        provider = new ethers.providers.JsonRpcProvider(process.env.BSC_URL)
    else if (_chainId === 8453)
        provider = new ethers.providers.JsonRpcProvider(process.env.BASE_URL)
    else
        provider = new ethers.providers.JsonRpcProvider(process.env.MATIC_URL)

    return provider
}

export function fromReadableAmount(amount: number, decimals: number): JSBI {
    const extraDigits = Math.pow(10, countDecimals(amount));
    const adjustedAmount = amount * extraDigits;
    return JSBI.divide(
        JSBI.multiply(JSBI.BigInt(adjustedAmount), JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(decimals))),
        JSBI.BigInt(extraDigits),
    );
}

function countDecimals(value: number): number {
    if (Math.floor(value) === value) return 0;
    const decimalPart = value.toString().split(".")[1];
    return decimalPart ? decimalPart.length : 0;
}