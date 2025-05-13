import { ethers } from "ethers"
import dotenv from "dotenv"
import { SmartRouterTrade } from "@pancakeswap/smart-router";
import { TradeType } from "@pancakeswap/sdk";

dotenv.config()

export const getProvider = (_chainId: number) => {

    if (_chainId !== 56 && _chainId !== 8453 && _chainId !== 137 && _chainId !== 1 && _chainId !== 42161)
        throw new Error("Wrong chain ID.");


    var provider

    if (_chainId === 56)
        provider = new ethers.providers.JsonRpcProvider(process.env.BSC_URL)
    else if (_chainId === 8453)
        provider = new ethers.providers.JsonRpcProvider(process.env.BASE_URL)
    else if (_chainId === 1)
        provider = new ethers.providers.JsonRpcProvider(process.env.ETH_URL)
    else if (_chainId === 42161)
        provider = new ethers.providers.JsonRpcProvider(process.env.ARB_URL)
    else
        provider = new ethers.providers.JsonRpcProvider(process.env.MATIC_URL)

    return provider
}

export const convertBigIntToString = (obj: SmartRouterTrade<TradeType> | null) => {
    return JSON.parse(
        JSON.stringify(obj, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        )
    );
}