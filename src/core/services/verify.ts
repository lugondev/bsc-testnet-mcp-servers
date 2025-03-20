import axios from 'axios';

interface VerifyResponse {
	status: string;
	message: string;
	result: string;
}

interface VerificationStatus {
	status: string;
	message: string;
	result: {
		status: string;
		message: string;
	};
}

const api = axios.default.create({
	baseURL: 'https://api.bscscan.com/api',
	headers: {
		'Content-Type': 'application/x-www-form-urlencoded',
	}
});

interface VerifyContractParams {
	contractAddress: string;
	sourceCode: string;
	contractName: string;
	compilerVersion: string;
	optimization?: boolean;
	runs?: number;
}

export async function verifyContract({
	contractAddress,
	sourceCode,
	contractName,
	compilerVersion,
	optimization = true,
	runs = 200
}: VerifyContractParams): Promise<string> {
	try {
		const formData = new URLSearchParams();
		formData.append('apikey', 'N73ZBDK2M6XT4ZNMVXQB4FG57HAX41EAPU');
		formData.append('module', 'contract');
		formData.append('action', 'verifysourcecode');
		formData.append('contractaddress', contractAddress);
		formData.append('sourceCode', sourceCode);
		formData.append('codeformat', 'solidity-single-file');
		formData.append('contractname', contractName);
		formData.append('compilerversion', compilerVersion);
		formData.append('optimizationUsed', optimization ? '1' : '0');
		formData.append('runs', runs.toString());
		formData.append('licenseType', '2');
		formData.append('evmversion', 'london');

		const response = await api.post<VerifyResponse>('', formData);

		if (response.data.status === '1' && response.data.message === 'OK') {
			return response.data.result; // Returns GUID for verification status
		} else {
			throw new Error(`Verification failed: ${response.data.message}`);
		}
	} catch (error) {
		if (error instanceof Error) {
			throw new Error(`Contract verification error: ${error.message}`);
		}
		throw error;
	}
}

export async function checkVerificationStatus(guid: string): Promise<boolean> {
	try {
		const formData = new URLSearchParams();
		formData.append('apikey', 'N73ZBDK2M6XT4ZNMVXQB4FG57HAX41EAPU');
		formData.append('module', 'contract');
		formData.append('action', 'checkverifystatus');
		formData.append('guid', guid);

		const response = await api.post<VerificationStatus>('', formData);

		if (response.data.status === '1') {
			if (response.data.result.status === '1') {
				return true;
			}
			if (response.data.result.status === '0') {
				throw new Error(`Verification failed: ${response.data.result.message}`);
			}
			// Status pending
			return false;
		}

		throw new Error(`Status check failed: ${response.data.message}`);
	} catch (error) {
		if (error instanceof Error) {
			throw new Error(`Verification status check error: ${error.message}`);
		}
		throw error;
	}
}
