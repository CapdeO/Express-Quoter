const { ChainId, Currency, Token, Percent } = require("@uniswap/sdk-core");
const { SwapRouter } = require("@uniswap/router-sdk");
const { SwapType } = require("@uniswap/smart-order-router");
const ethers = require("ethers")
const dotenv = require("dotenv")
const abi = require("./abi.json");
const erc20Abi = require("./erc20.json");

dotenv.config()

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
    //     "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    //     6,
    //     "USDC",
    //     "USDC",
    // )

    const tokenIn = new Token(
        8453,
        "0x0000000000000000000000000000000000000000",
        18,
        "ETH",
        "Ether",
    )

    const tokenOut1 = new Token(
        8453,
        "0xac1bd2486aaf3b5c0fc3fd868558b082a531b2b4",
        18,
        "TOSHI",
        "Toshi",
    )

    const tokenOut2 = new Token(
        8453,
        "0x199664F01704DE177E0871963d8E2BF01E964708",
        18,
        "TOSHI",
        "Toshi",
    )

    const tokenOut3 = new Token(
        8453,
        "0xBA5E66FB16944Da22A62Ea4FD70ad02008744460",
        9,
        "TOSHI",
        "Toshi",
    )

    const tokenOut4 = new Token(
        8453,
        "0x5Dc232B8301E34EFe2F0ea2A5a81da5b388Bb45E",
        9,
        "TOSHI",
        "Toshi",
    )

    const tokenOut5 = new Token(
        8453,
        "0x1196c6704789620514fD25632aBe15F69a50bc4f",
        18,
        "TOSHI",
        "Toshi",
    )

    const tokens = [tokenOut5]

    const amount_ = "100"
    const amountWithFee_ = "95"

    console.log("AMOUNT TO SWAP", amountWithFee_)

    var _swapData = []
    var _router = []
    var _tokenAddresses = []
    var _amounts = []

    for (const _token of tokens) {

        const requestBody = {
            chainId: 8453,
            walletAddress: "0x61D4d1Ab7eA7B3A54C7B2D646Eb8189faD7B1050",
            tokenIn,
            tokenOut: _token,
            amountIn: amountWithFee_, // amount_,
        };

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": process.env.API_KEY,
            },
            body: JSON.stringify(requestBody),
        });

        const data = await response.json();
        console.log(data.route)

        _swapData.push(data.route.methodParameters.calldata)
        _router.push(data.route.methodParameters.to)
        _tokenAddresses.push(tokenIn.address)
        _amounts.push(ethers.utils.parseUnits(amount_, 6))
        console.log(_tokenAddresses)
    }

    console.log(`_swapData: ${_swapData}`)
    console.log(`_router: ${_router}`)
    console.log(`_tokenAddresses: ${_tokenAddresses}`)
    console.log(`_amounts: ${_amounts}`)

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
        walletAddress: "0x61D4d1Ab7eA7B3A54C7B2D646Eb8189faD7B1050",
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

testQuote()
// testQuotePancakeswap()
