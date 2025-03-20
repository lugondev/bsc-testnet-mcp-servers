import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { verifyContract, checkVerificationStatus } from "../verify.js";

export function registerVerifyTools(server: McpServer) {
	server.tool(
		"verify_contract",
		"Verify a smart contract on the blockchain explorer",
		{
			contractAddress: z.string().describe("The address of the deployed contract to verify"),
			sourceCode: z.string().describe("The source code of the contract"),
			contractName: z.string().describe("The name of the contract in the source code"),
			compilerVersion: z.string().describe("The Solidity compiler version used"),
			optimization: z.boolean().optional().describe("Whether optimization was used during compilation").default(true),
			runs: z.number().optional().describe("Number of optimization runs").default(200)
		},
		async ({ contractAddress, sourceCode, contractName, compilerVersion, optimization = true, runs = 200 }) => {
			try {
				const guid = await verifyContract({
					contractAddress,
					sourceCode,
					contractName,
					compilerVersion,
					optimization,
					runs
				});
				return {
					content: [
						{
							type: "text",
							text: `Contract verification submitted. GUID: ${guid}. Use check_verification_status to monitor the verification progress.`
						}
					]
				};
			} catch (error: unknown) {
				const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
				return {
					content: [
						{
							type: "text",
							text: `Failed to verify contract: ${errorMessage}`
						}
					],
					isError: true
				};
			}
		}
	);

	server.tool(
		"check_verification_status",
		"Check the status of a contract verification request",
		{
			guid: z.string().describe("The GUID returned from verify_contract")
		},
		async ({ guid }) => {
			try {
				const isVerified = await checkVerificationStatus(guid);
				return {
					content: [
						{
							type: "text",
							text: isVerified
								? "Contract verification completed successfully"
								: "Contract verification is still pending"
						}
					]
				};
			} catch (error: unknown) {
				const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
				return {
					content: [
						{
							type: "text",
							text: `Failed to check verification status: ${errorMessage}`
						}
					],
					isError: true
				};
			}
		}
	);
}
