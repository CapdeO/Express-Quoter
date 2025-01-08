const { ChainId, Currency, Token } = require("@uniswap/sdk-core");
const ethers = require("ethers")
const dotenv = require("dotenv")

dotenv.config()

const provider = new ethers.providers.JsonRpcProvider(process.env.MATIC_URL)
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider)

// BASE
// const swapRouterAddress = "0x2626664c2603336E57B271c5C0b26F421741e481"
// POLYGON
const swapRouterAddress = "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45"
// const swapRouterABI = [
//     "function exactInput((bytes path, address recipient, uint256 amountIn, uint256 amountOutMinimum)) external payable returns (uint256 amountOut)"
// ]
const swapRouterABI = [
    "function exactInput((bytes path, address recipient, uint256 amountIn, uint256 amountOutMinimum)) external payable returns (uint256 amountOut)",
    "function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] calldata path, address to) external returns (uint256 amountOut)"
];

const swapRouter = new ethers.Contract(swapRouterAddress, swapRouterABI, signer)

function encodePath(tokenPath, pools, protocol) {
    if (protocol === "V3" || protocol === 1) {
        const types = []
        const values = []

        for (let i = 0; i < tokenPath.length; i++) {
            types.push("address")
            values.push(tokenPath[i].address)

            if (i < pools.length) {
                types.push("uint24")
                values.push(pools[i].fee)
            }
        }

        console.log(`encoded path for v3 ${values}`)
        return ethers.utils.solidityPack(types, values)
    } else {
        // const types = []
        const values = []

        for (let i = 0; i < tokenPath.length; i++) {
            // types.push("address");
            values.push(tokenPath[i].address)
        }

        // return ethers.utils.solidityPack(types, values)
        console.log("path v2")
        console.log(values)
        return values
    }
}

async function testQuote() {
    const url = "http://localhost:8000/quote"

    // const tokenIn = new Token(
    //     8453,
    //     "0xA6f774051dFb6b54869227fDA2DF9cb46f296c09",
    //     18,
    //     "SKICAT",
    //     "SKI MASK CAT",
    // )

    // const tokenIn = new Token(
    //     8453,
    //     "0x3C281A39944a2319aA653D81Cfd93Ca10983D234",
    //     18,
    //     "BUIDL",
    //     "Buidl",
    // )

    const tokenIn = new Token(
        137,
        "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6",
        8,
        "WBTC",
        "(PoS) Wrapped BTC",
    )

    // const tokenOut = new Token(
    //     8453,
    //     "0x4200000000000000000000000000000000000006",
    //     18,
    //     "WETH",
    //     "Weth",
    // )

    const tokenOut = new Token(
        137,
        "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
        6,
        "USDC",
        "USD Coin",
    )

    const amount_ = "0.00000040"

    const requestBody = {
        chainId: 137,
        walletAddress: "0xBb992375dE1a6f462B381b5dDF706Aca893FBc30",
        tokenIn,
        tokenOut,
        amountIn: amount_,
    };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": process.env.API_KEY,
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const data = await response.json();
            console.log(data)
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // ==========================================

        console.log(data.route.route)

        // ==========================================

        // Always getting the first offered route

        // const firstRoute = data.route.route[0]
        // console.log(firstRoute)

        // const encodedPath = encodePath(firstRoute.tokenPath, firstRoute.route.pools, firstRoute.protocol)

        // if (firstRoute.protocol === 'V2') {
        //     console.log("calling v2")
        //     const params = {
        //         amountIn: ethers.utils.parseUnits(amount_, tokenIn.decimals),
        //         amountOutMin: 0,
        //         path: encodedPath,
        //         to: "0x61D4d1Ab7eA7B3A54C7B2D646Eb8189faD7B1050",
        //     }

        //     const tx = await swapRouter.swapExactTokensForTokens(
        //         params.amountIn,
        //         params.amountOutMin,
        //         params.path,
        //         params.to,
        //     )
        //     const receipt = await tx.wait()
        //     console.log("Swap success:", receipt)
        // } else {

        //     console.log("v3 route. aborting..")

        //     // const params = {
        //     //     path: encodedPath,
        //     //     recipient: "0x61D4d1Ab7eA7B3A54C7B2D646Eb8189faD7B1050",
        //     //     amountIn: ethers.utils.parseUnits(amount_, tokenIn.decimals),
        //     //     amountOutMinimum: 0
        //     // }

        //     // let maxFeePerGas = ethers.BigNumber.from(900000000000)
        //     // let maxPriorityFeePerGas = ethers.BigNumber.from(900000000000)

        //     // const tx = await swapRouter.exactInput(params, {
        //     //     maxFeePerGas: maxFeePerGas,
        //     //     maxPriorityFeePerGas: maxPriorityFeePerGas,
        //     // });

        //     // const receipt = await tx.wait()
        //     // console.log("Swap success:", receipt)
        // }

    } catch (error) {
        console.error("Error occurred:", error.message || error);
    }
}

async function testQuotePancakeswap() {
    const url = "http://localhost:8000/quote-pancakeswap"

    // V2 token
    // const tokenIn = new Token(
    //     56,
    //     "0x00f2b1d536485f3493fe7609249128027951d87e",
    //     18,
    //     "GROCK",
    //     "Grock AI",
    // )

    // V3 token
    const tokenIn = new Token(
        56,
        "0xC0041EF357B183448B235a8Ea73Ce4E4eC8c265F",
        18,
        "COOKIE",
        "Cookie",
    )

    const tokenOut = new Token(
        56,
        "0x55d398326f99059ff775485246999027b3197955",
        6,
        "USDT",
        "Tether USD",
    )

    const amount_ = "1500"

    const requestBody = {
        chainId: 8453,
        walletAddress: "0xBb992375dE1a6f462B381b5dDF706Aca893FBc30",
        tokenIn,
        tokenOut,
        amountIn: amount_,
    };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": process.env.API_KEY,
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const data = await response.json()
            console.log(data)
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        // console.log(data)

        const firstRoute = data.tradeResponse.routes[0]

        const readableAmount = ethers.utils.formatUnits(firstRoute.outputAmount.numerator, firstRoute.outputAmount.currency.decimals)
        console.log(firstRoute)

        // const encodedPath = encodePath(firstRoute.path, firstRoute.pools, firstRoute.pools[0].type)

        // console.log(encodedPath)

    } catch (error) {
        console.error("Error occurred:", error.message || error)
    }
}

// testQuote()
testQuotePancakeswap()
