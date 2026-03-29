// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/MockCUSD.sol";
import "../src/AgroEscrow.sol";

/**
 * @notice Deploys MockCUSD + AgroEscrow for Celo Sepolia testnet (chain 11142220).
 *         Run with:
 *   PRIVATE_KEY=<key> forge script script/DeployTestnet.s.sol:DeployTestnet \
 *     --rpc-url https://forno.celo-sepolia.celo-testnet.org \
 *     --broadcast -vvv
 */
contract DeployTestnet is Script {
    function run() external {
        uint256 deployerKey  = vm.envUint("PRIVATE_KEY");
        address deployer     = vm.addr(deployerKey);
        uint256 mintAmount   = 1_000_000 * 1e18; // 1M mock cUSD to admin

        console.log("Deploying to Celo Sepolia (chain 11142220)");
        console.log("Deployer / admin:", deployer);

        vm.startBroadcast(deployerKey);

        // 1. Deploy mock cUSD
        MockCUSD cusd = new MockCUSD();
        console.log("MockCUSD deployed:", address(cusd));

        // 2. Mint 1M test cUSD to deployer / admin wallet
        cusd.mint(deployer, mintAmount);
        console.log("Minted 1,000,000 mock cUSD to admin wallet");

        // 3. Deploy AgroEscrow pointing to the mock cUSD
        AgroEscrow escrow = new AgroEscrow(address(cusd));
        console.log("AgroEscrow deployed:", address(escrow));

        vm.stopBroadcast();

        console.log("");
        console.log("=== SET THESE IN RAILWAY ===");
        console.log("CUSD_TOKEN_ADDRESS =", address(cusd));
        console.log("ESCROW_CONTRACT_ADDRESS =", address(escrow));
        console.log("BLOCKCHAIN_RPC_URL = https://forno.celo-sepolia.celo-testnet.org");
        console.log("ADMIN_WALLET_ADDRESS =", deployer);
        console.log("============================");
    }
}
