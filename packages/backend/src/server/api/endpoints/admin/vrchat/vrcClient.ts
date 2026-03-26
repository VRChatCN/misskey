import {
	LoginResponse,
	SearchUserInfo,
	SearchUsersModifiedResponse, UserInfoResponse,
} from '@/server/api/endpoints/admin/vrchat/vrcModels.js';

export class VrcClient {
	endpoint = 'https://api.vrchat.cloud/api/1/';
	cookies: Record<string, string> = {};
	ua = 'MisskeyVrchatIntegration/1.0.0 yukinekovrc@outlook.com';
	onUpdateCookie: ((cookie: string) => any) | undefined = undefined;

	private hasLoggedInOnce = false;
	private loginUsername: string | null = null;
	private loginPassword: string | null = null;
	private reloginPromise: Promise<boolean> | null = null;

	constructor(cookie: string | null | undefined, onUpdateCookie: ((cookie: string) => any) | undefined, loginUsername?: string | null, loginPassword?: string | null) {
		if (cookie) {
			this.cookies = this.cookieStringToMap(cookie);
		}
		this.onUpdateCookie = onUpdateCookie;
		if (loginUsername && loginPassword) {
			this.loginUsername = loginUsername;
			this.loginPassword = loginPassword;
			if (cookie) {
				this.hasLoggedInOnce = true;
			}
		}
	}

	cookieStringToMap(cookieString: string): Record<string, string> {
		const result: Record<string, string> = {};

		if (!cookieString) return result;

		for (const part of cookieString.split(';')) {
			const item = part.trim();
			if (!item) continue;

			const eqIndex = item.indexOf('=');
			if (eqIndex === -1) continue;

			const key = item.slice(0, eqIndex).trim();
			const value = item.slice(eqIndex + 1).trim();

			if (!key) continue;
			result[key] = value;
		}

		return result;
	}

	cookieStringsToMap(cookieStrings: string[]): Record<string, string> {
		const result: Record<string, string> = {};

		if (!Array.isArray(cookieStrings) || cookieStrings.length === 0) {
			return result;
		}

		for (const cookieString of cookieStrings) {
			if (!cookieString) continue;

			const firstPair = cookieString.split(';', 1)[0]?.trim();
			if (!firstPair) continue;

			Object.assign(result, this.cookieStringToMap(firstPair));
		}

		return result;
	}

	mapToCookieString(cookieMap: Record<string, string>): string {
		if (!cookieMap || typeof cookieMap !== 'object') return '';

		return Object.entries(cookieMap)
			.filter(([key]) => !!key)
			.map(([key, value]) => `${key}=${value ?? ''}`)
			.join('; ');
	}

	async sendRequest(path: string, method: 'GET' | 'POST', body?: any, addHeaders?: Record<string, string>, _skipReauth = false): Promise<Response> {
		const headers: Record<string, string> = {
			'User-Agent': this.ua,
			'Cookie': this.mapToCookieString(this.cookies),
		};
		if (body) {
			headers['Content-Type'] = 'application/json';
		}
		if (addHeaders) {
			Object.assign(headers, addHeaders);
		}

		const response = await fetch(`${this.endpoint}${path}`, {
			method,
			headers,
			body: body ? JSON.stringify(body) : undefined,
		});
		if (!response.ok) {
			if (response.status === 401 && !_skipReauth && this.hasLoggedInOnce) {
				const reloginOk = await this.doRelogin();
				if (reloginOk) {
					return this.sendRequest(path, method, body, addHeaders, true);
				}
			}
			throw new Error(`Request failed with status ${response.status}`);
		}

		const setCookies = response.headers.getSetCookie();
		if (setCookies && setCookies.length > 0) {
			const newCookies = this.cookieStringsToMap(setCookies);
			Object.assign(this.cookies, newCookies);
			if (this.onUpdateCookie) {
				this.onUpdateCookie(this.mapToCookieString(this.cookies));
			}
		}

		return response;
	}

	private async doRelogin(): Promise<boolean> {
		if (this.reloginPromise) return this.reloginPromise;
		this.reloginPromise = this._executeRelogin();
		try {
			return await this.reloginPromise;
		} finally {
			this.reloginPromise = null;
		}
	}

	private async _executeRelogin(): Promise<boolean> {
		if (!this.loginUsername || !this.loginPassword) return false;
		try {
			const response = await this.sendRequest('auth/user', 'GET', undefined, {
				Authorization: `Basic ${btoa(encodeURIComponent(this.loginUsername) + ':' + encodeURIComponent(this.loginPassword))}`,
			}, true);
			const data = await response.json() as LoginResponse;
			if (data.requiresTwoFactorAuth) {
				return false;
			}
			this.hasLoggedInOnce = true;
			return true;
		} catch {
			return false;
		}
	}

	public async getCurrentUser() {
		const response = await this.sendRequest('auth/user', 'GET');
		const data = await response.json() as LoginResponse;
		data['httpStatusCode'] = response.status;
		if (!data.requiresTwoFactorAuth) {
			this.hasLoggedInOnce = true;
		}
		return data;
	}

	public async login(username: string, password: string) {
		const response = await this.sendRequest('auth/user', 'GET', undefined, {
			Authorization: `Basic ${btoa(encodeURIComponent(username) + ':' + encodeURIComponent(password))}`,
		}, true);

		const data = await response.json() as LoginResponse;
		data['httpStatusCode'] = response.status;

		this.loginUsername = username;
		this.loginPassword = password;
		if (!data.requiresTwoFactorAuth) {
			this.hasLoggedInOnce = true;
		}

		return data;
	}

	public async verify2FaEmailCode(code: string) {
		const response = await this.sendRequest('auth/twofactorauth/emailotp/verify', 'POST', { code });
		if (!response.ok) {
			return false;
		}
		const responseJson = await response.json() as any;
		const verified = responseJson.verified === true;
		if (verified) this.hasLoggedInOnce = true;
		return verified;
	}

	public async verify2Fa(code: string) {
		const response = await this.sendRequest('auth/twofactorauth/totp/verify', 'POST', { code });
		if (!response.ok) {
			return false;
		}
		const responseJson = await response.json() as any;
		const verified = responseJson.verified === true;
		if (verified) this.hasLoggedInOnce = true;
		return verified;
	}

	public async searchUsersByDisplayName(displayName: string) {
		const response = await this.sendRequest(`users?search=${encodeURIComponent(displayName)}`, 'GET');
		const ret: SearchUsersModifiedResponse = {
			httpStatusCode: response.status,
		};
		if (response.status === 200) {
			ret.data = await response.json() as SearchUserInfo[];
			return ret;
		} else {
			return await response.json() as SearchUsersModifiedResponse;
		}
	}

	public async getUser(userId: string) {
		let pathUserId = userId;
		if (!userId.startsWith('usr_')) {
			pathUserId = 'usr_' + userId;
		}
		const response = await this.sendRequest(`users/${pathUserId}`, 'GET');
		const data = await response.json() as UserInfoResponse;
		data.httpStatusCode = response.status;
		return data;
	}
}
