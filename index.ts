import express, { NextFunction, Request, Response } from "express"
import cors from "cors"
import { getProvider } from "./utils"
import { AlphaRouter, SwapOptionsSwapRouter02, SwapType } from "@uniswap/smart-order-router"
import { CurrencyAmount, Percent, Token, TradeType } from "@uniswap/sdk-core"
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

        const tokenInTyped = new Token(chainId, tokenIn.address, tokenIn.decimals, tokenIn.symbol, tokenIn.name);
        const tokenOutTyped = new Token(chainId, tokenOut.address, tokenOut.decimals, tokenOut.symbol, tokenOut.name);

        console.log(`Quote ----> ${tokenInTyped.symbol}/${tokenOutTyped.symbol}`)

        const provider = getProvider(chainId)

        const router = new AlphaRouter({
            chainId: chainId,
            provider
        })

        const options: SwapOptionsSwapRouter02 = {
            recipient: walletAddress,
            slippageTolerance: new Percent(50, 10_000),
            deadline: Math.floor(Date.now() / 1000 + 1800),
            type: SwapType.SWAP_ROUTER_02,
        };
        var fixedAmount: any = Number(amountIn).toFixed(18)

        var rawAmount: BigNumber | number | string = ethers.utils.parseUnits(fixedAmount.toString(), tokenInTyped.decimals)

        const route = await router.route(
            CurrencyAmount.fromRawAmount(tokenInTyped, rawAmount.toString()),
            tokenOutTyped,
            TradeType.EXACT_INPUT,
            options
        );

        console.log(route?.quote)

        if (!route || !route.methodParameters) {
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