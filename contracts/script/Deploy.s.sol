// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/AgroEscrow.sol";

contract DeployAgroEscrow is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);

        console.log("Deploying AgroEscrow...");
        console.log("Deployer:", deployer);

        vm.startBroadcast(deployerKey);
        AgroEscrow escrow = new AgroEscrow();
        vm.stopBroadcast();

        console.log("==================================================");
        console.log("AgroEscrow deployed to:", address(escrow));
        console.log("Admin:", escrow.admin());
        console.log("==================================================");
        console.log("");
        console.log("Add to .env and Railway:");
        console.log("ESCROW_CONTRACT_ADDRESS=", address(escrow));
        console.log("BLOCKCHAIN_RPC_URL=https://alfajores-forno.celo-testnet.org");
        console.log("ADMIN_WALLET_ADDRESS=", deployer);
    }
}
