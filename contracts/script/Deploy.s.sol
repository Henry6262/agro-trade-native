// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/AgroEscrow.sol";

contract DeployAgroEscrow is Script {
    // cUSD on Celo Sepolia testnet (chainId 11142220)
    address constant CUSD_SEPOLIA = 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1;
    // cUSD on Celo Mainnet (chainId 42220)
    address constant CUSD_MAINNET = 0x765DE816845861e75A25fCA122bb6898B8B1282a;

    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);
        address cusdAddress = vm.envOr("CUSD_ADDRESS", CUSD_SEPOLIA);

        console.log("Deploying AgroEscrow...");
        console.log("Deployer:", deployer);
        console.log("cUSD token:", cusdAddress);

        vm.startBroadcast(deployerKey);
        AgroEscrow escrowContract = new AgroEscrow(cusdAddress);
        vm.stopBroadcast();

        console.log("==================================================");
        console.log("AgroEscrow deployed to:", address(escrowContract));
        console.log("Admin:", escrowContract.admin());
        console.log("cUSD token:", escrowContract.cusdToken());
        console.log("==================================================");
        console.log("");
        console.log("Add to .env and Railway:");
        console.log("ESCROW_CONTRACT_ADDRESS=", address(escrowContract));
        console.log("BLOCKCHAIN_RPC_URL=https://celo-sepolia.infura.io/v3/YOUR_KEY");
        console.log("ADMIN_WALLET_ADDRESS=", deployer);
        console.log("CUSD_TOKEN_ADDRESS=", cusdAddress);
    }
}
