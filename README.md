Here's a README for your repository:

---

# Uniswap API Key Protected Quote Service

This project provides an Express-based server to interact with the Uniswap Smart Order Router, allowing users to get token swap quotes. The API is protected with an API key to restrict unauthorized access.

## Features

- **Secure API with Key Validation**: Ensures only authorized clients can access the API.
- **Uniswap Integration**: Leverages the Uniswap Smart Order Router for token swap quotes.
- **Dynamic Routing**: Automatically calculates optimal trading routes.
- **Customizable Settings**: Allows specification of chain ID, wallet addresses, and token details.

## Requirements

- Node.js >= 14.x
- Yarn or npm
- A valid API key (set as an environment variable)
- Access to Ethereum RPC endpoints for the desired chains

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. Install dependencies:
   ```bash
   yarn install
   # or
   npm install
   ```

3. Create a `.env` file in the root directory with the following content:
   ```
   API_KEY=your-secure-api-key
   ```

4. Start the server:
   ```bash
   yarn start
   # or
   npm start
   ```

## API Endpoints

### **POST /quote**

Get a token swap quote for a specific trade.

#### Request Headers:
- `Content-Type: application/json`
- `x-api-key`: Your API key (required)

#### Request Body:
```json
{
  "chainId": 1,
  "walletAddress": "0xYourWalletAddress",
  "tokenIn": {
    "address": "0xTokenInAddress",
    "decimals": 18,
    "symbol": "TOKEN_IN",
    "name": "Token In"
  },
  "tokenOut": {
    "address": "0xTokenOutAddress",
    "decimals": 18,
    "symbol": "TOKEN_OUT",
    "name": "Token Out"
  },
  "amountIn": 100
}
```

#### Response:
- **200 OK**: Returns the swap quote details.
- **400 Bad Request**: Missing or invalid parameters.
- **403 Forbidden**: Invalid or missing API key.
- **500 Internal Server Error**: Unable to process the request.

#### Example Response:
```json
{
  "numerator": "1000000000000000000",
  "decimals": 18,
  "readableAmount": "1.0"
}
```

## Project Structure

- **`index.ts`**: Entry point of the application.
- **`utils.ts`**: Helper functions for provider and token utilities.

## Environment Variables

- `API_KEY`: Your secure API key for the server.

## Usage

1. Make a POST request to `/quote` with the required headers and body.
2. Ensure the `x-api-key` header matches the value set in your `.env` file.

Example using `fetch`:
```javascript
fetch("http://localhost:8000/quote", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": "your-secure-api-key"
  },
  body: JSON.stringify({
    chainId: 1,
    walletAddress: "0xYourWalletAddress",
    tokenIn: { ... },
    tokenOut: { ... },
    amountIn: 100
  })
})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error("Error:", error));
```

## Development

- To run the server in development mode:
  ```bash
  yarn serve
  # or
  npm run serve
  ```

## License

This project is licensed under the MIT License.

--- 

Let me know if you need additional sections or customizations!