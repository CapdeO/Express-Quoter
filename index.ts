// Express
import express, { NextFunction, Request, Response } from "express"
import cors from "cors"

// Uniswap
import { AlphaRouter, SwapOptionsSwapRouter02, SwapType } from "@uniswap/smart-order-router"
import { CurrencyAmount, Percent, Token, TradeType, Ether, Currency } from "@uniswap/sdk-core"
import { ADDRESS_ZERO, Protocol, SwapRouter, Trade, ZERO } from '@uniswap/router-sdk';

// Pancakeswap
import {
    Token as TokenPcs,
    CurrencyAmount as
        CurrencyAmountPcs,
    TradeType as TradeTypePcs
} from "@pancakeswap/sdk"
import { SmartRouter } from "@pancakeswap/smart-router"

// utils
import { getProvider, convertBigIntToString } from "./utils"
import { createPublicClient, http } from "viem"
import { bsc } from 'viem/chains'
import { GraphQLClient } from 'graphql-request'
import { BigNumber, ethers } from "ethers"
import dotenv from "dotenv"

dotenv.config()

const port = 8000
const API_KEY = process.env.API_KEY || "my-secure-api-key";

interface RequestBody {
    chainId: number;
    walletAddress: string;
    tokenIn: Token;
    tokenOut: Token;
    amountIn: number;
}

const validateApiKey = (req: Request, res: Response, next: NextFunction) => {
    const clientApiKey = req.headers['x-api-key']

    if (!clientApiKey) {
        res.status(403).json({ error: "API key is required" })
        return
    }

    if (clientApiKey !== API_KEY) {
        res.status(403).json({ error: "Invalid API key" })
        return
    }

    next()
}

const app = express()
app.use(express.json())
app.use(cors())
app.use(validateApiKey)

app.post("/quote", validateApiKey, async (req: Request, res: Response) => {
    try {
        // console.log(req.body)
        console.log(`Inside quote route-----------`)

        const {
            chainId,
            walletAddress,
            tokenIn,
            tokenOut,
            amountIn
        }: RequestBody = req.body

        if (!chainId || !walletAddress || !tokenIn || !tokenOut || !amountIn) {
            res.status(400).json({
                error: "Missing required parameters."
            });
            return
        }

        const isNativeTokenIn = tokenIn.address === ADDRESS_ZERO;

        const tokenInTyped = isNativeTokenIn ?
            (Ether.onChain(chainId) as Currency) :
            new Token(chainId, tokenIn.address, tokenIn.decimals, tokenIn.symbol, tokenIn.name);
        const tokenOutTyped = new Token(chainId, tokenOut.address, tokenOut.decimals, tokenOut.symbol, tokenOut.name);

        console.log(`Quote ----> ${tokenInTyped.symbol}/${tokenOutTyped.symbol}`)

        const provider = getProvider(chainId)

        const router = new AlphaRouter({
            chainId: chainId,
            provider,
        })

        const options: SwapOptionsSwapRouter02 = {
            recipient: walletAddress,
            slippageTolerance: new Percent(10_000, 10_000),
            deadline: Math.floor(Date.now() / 1000 + 1800),
            type: SwapType.SWAP_ROUTER_02,
        };
        var fixedAmount: any = Number(amountIn).toFixed(tokenIn.decimals)

        var rawAmount: BigNumber | number | string = ethers.utils.parseUnits(fixedAmount.toString(), tokenInTyped.decimals)

        let route = await router.route(
            CurrencyAmount.fromRawAmount(tokenInTyped, rawAmount.toString()),
            tokenOutTyped,
            TradeType.EXACT_INPUT,
            options,
            {
                protocols: [Protocol.V3]
            }
        );

        if (!route) {
            route = await router.route(
                CurrencyAmount.fromRawAmount(tokenInTyped, rawAmount.toString()),
                tokenOutTyped,
                TradeType.EXACT_INPUT,
                options,
                {
                    protocols: [Protocol.V2]
                }
            );
        }

        // console.log(route?.quote)

        if (!route || !route.methodParameters) {
            console.log("No route found")
            res.status(400).json({
                error: "No route found",
                details:
                    "Unable to find a valid trading route for the specified tokens.",
            });
            return
        }

        const readableAmount = route.quote.toExact()

        console.log(`Output amount: ${readableAmount} ${route?.quote?.currency?.symbol}`)

        res.json({
            route,
            numerator: route?.quote.numerator,
            decimals: route?.quote.currency.decimals,
            readableAmount
        })

    } catch (error) {
        console.error("Route error:", error);
        res.status(500).json({
            error: "Failed to process route.",
            message: error,
        });
    }
})

app.post("/quote-pancakeswap", validateApiKey, async (req: Request, res: Response) => {
    try {
        console.log(`Inside quote bsc route-----------`);

        const { walletAddress, tokenIn, tokenOut, amountIn }: RequestBody = req.body;

        if (!walletAddress || !tokenIn.symbol || !tokenOut.symbol || !amountIn) {
            res.status(400).json({ error: "Missing required parameters." });
            return;
        }

        const tokenInTyped = new TokenPcs(56, tokenIn.address as `0x${string}`, tokenIn.decimals, tokenIn.symbol, tokenIn.name);
        const tokenOutTyped = new TokenPcs(56, tokenOut.address as `0x${string}`, tokenOut.decimals, tokenOut.symbol, tokenOut.name);

        console.log(`Quote ----> ${tokenInTyped.symbol}/${tokenOutTyped.symbol}`)

        const publicClient = createPublicClient({
            chain: bsc,
            transport: http('https://bsc-dataseed1.binance.org'),
            batch: {
                multicall: {
                    batchSize: 1024 * 200,
                },
            },
        });

        const v3SubgraphClient = new GraphQLClient('https://api.thegraph.com/subgraphs/name/pancakeswap/exchange-v3-bsc');
        const v2SubgraphClient = new GraphQLClient('https://proxy-worker-api.pancakeswap.com/bsc-exchange');

        const quoteProvider = SmartRouter.createQuoteProvider({
            onChainProvider: () => publicClient,
        });

        const fixedAmount: any = Number(amountIn).toFixed(tokenIn.decimals);
        const rawAmount: BigNumber | number | string = ethers.utils.parseUnits(fixedAmount.toString(), tokenInTyped.decimals);
        const amount = CurrencyAmountPcs.fromRawAmount(tokenInTyped, rawAmount.toString());

        const [v2Pools, v3Pools] = await Promise.all([
            SmartRouter.getV2CandidatePools({
                onChainProvider: () => publicClient,
                v2SubgraphProvider: () => v2SubgraphClient,
                v3SubgraphProvider: () => v3SubgraphClient,
                currencyA: amount.currency,
                currencyB: tokenOutTyped,
            }),
            SmartRouter.getV3CandidatePools({
                onChainProvider: () => publicClient,
                subgraphProvider: () => v3SubgraphClient,
                currencyA: amount.currency,
                currencyB: tokenOutTyped,
                subgraphFallback: false,
            }),
        ]);

        let trade;
        try {
            trade = await SmartRouter.getBestTrade(amount, tokenOutTyped, TradeTypePcs.EXACT_INPUT, {
                gasPriceWei: () => publicClient.getGasPrice(),
                maxHops: 2,
                maxSplits: 2,
                poolProvider: SmartRouter.createStaticPoolProvider(v3Pools),
                quoteProvider,
                quoterOptimization: true,
            });
            // console.log("Trade found using V3 pools:", trade);
        } catch (error) {
            // console.warn("Failed to find trade using V3 pools, trying V2 pools:", error);
            trade = await SmartRouter.getBestTrade(amount, tokenOutTyped, TradeTypePcs.EXACT_INPUT, {
                gasPriceWei: () => publicClient.getGasPrice(),
                maxHops: 2,
                maxSplits: 2,
                poolProvider: SmartRouter.createStaticPoolProvider(v2Pools),
                quoteProvider,
                quoterOptimization: true,
            });
            // console.log("Trade found using V2 pools:", trade);
        }

        const tradeResponse = convertBigIntToString(trade);
        const firstRoute = tradeResponse.routes[0]
        const readableAmount = ethers.utils.formatUnits(firstRoute.outputAmount.numerator, firstRoute.outputAmount.currency.decimals)

        res.json({ tradeResponse, readableAmount });
    } catch (error) {
        console.error("Route error:", error);
        res.status(500).json({
            error: "Failed to process route.",
            message: error,
        });
    }
});

// NOT WORKING FOR NOW
// app.post("/quotes", async (req: Request, res: Response) => {
//     try {
//         console.log(req.body)
//         console.log("Inside quote route-------------")

//         const {
//             chainId,
//             walletAddress,
//             typedTokensIn,
//             tokenOut,
//             amountsIn
//         } = req.body

//         if (!chainId || !walletAddress || !typedTokensIn || !tokenOut || !amountsIn) {
//             res.status(400).json({
//                 error: "Missing required parameters."
//             });
//             return
//         }

//         console.log(`TYPED TOKENS IN`)
//         console.log(typedTokensIn)

//         console.log(`AMOUNTS IN`)
//         console.log(amountsIn)

//         const tokenOutTyped = new Token(
//             chainId, 
//             tokenOut.address, 
//             tokenOut.decimals, 
//             tokenOut.symbol, 
//             tokenOut.name
//         );

//         const provider = getProvider(chainId)

//         const router = new AlphaRouter({
//             chainId: chainId,
//             provider
//         })

//         const options: SwapOptionsSwapRouter02 = {
//             recipient: walletAddress,
//             slippageTolerance: new Percent(50, 10_000),
//             deadline: Math.floor(Date.now() / 1000 + 1800),
//             type: SwapType.SWAP_ROUTER_02,
//         };

//         const quotes = await Promise.all(
//             typedTokensIn.map(async (tokenIn: Token, index: number) => {
//                 const amountIn = amountsIn[index];
//                 const tokenInTyped = new Token(chainId, tokenIn.address, tokenIn.decimals, tokenIn.symbol, tokenIn.name);
//                 const rawTokenAmountIn: JSBI = fromReadableAmount(Number(amountIn), tokenInTyped.decimals);

//                 const route = await router.route(
//                     CurrencyAmount.fromRawAmount(tokenInTyped, rawTokenAmountIn.toString()),
//                     tokenOutTyped,
//                     TradeType.EXACT_INPUT,
//                     options
//                 );

//                 if (route?.quote?.numerator && route?.quote?.currency?.decimals !== undefined) {
//                     const readableAmount = ethers.utils.formatUnits(
//                         route.quote.numerator.toString(),
//                         route.quote.currency.decimals
//                     );
//                     return {
//                         tokenIn: tokenIn.symbol,
//                         tokenOut: tokenOutTyped.symbol,
//                         numerator: route.quote.numerator.toString(),
//                         decimals: route.quote.currency.decimals,
//                         readableAmount,
//                     };
//                 } else {
//                     return {
//                         tokenIn: tokenIn.symbol,
//                         error: "No valid route found for this token"
//                     };
//                 }
//             })
//         );

//         console.log(quotes)
//         res.json({
//             quotes
//         })

//     } catch (error) {
//         console.error("Route error:", error);
//         res.status(500).json({
//             error: "Failed to process route.",
//             message: error,
//         });
//     }
// })

app.listen(port, () => {
    console.log(`Server listening on port ${port}.`)
})