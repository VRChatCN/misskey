import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { VrchatService } from '@/core/VrchatService.js';
import { ApiError } from '@/server/api/error.js';

export const meta = {
	tags: ['admin', 'vrchat'],
	requireCredential: true,
	requireAdmin: true,
	kind: 'write:admin:vrchat',
	errors: {
		loginFailed: { message: 'VRChat login failed.', code: 'VRCHAT_LOGIN_FAILED', id: 'f0a0b1c1-a001-4000-a000-000000000001' },
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		username: { type: 'string', minLength: 1 },
		password: { type: 'string', minLength: 1 },
	},
	required: ['username', 'password'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(private vrchatService: VrchatService) {
		super(meta, paramDef, async (ps) => {
			const result = await this.vrchatService.login(ps.username, ps.password);
			if (!result.success && !result.requires2fa) {
				throw new ApiError(meta.errors.loginFailed);
			}
			return {
				success: result.success,
				requires2fa: result.requires2fa ?? false,
				displayName: result.user?.displayName,
			};
		});
	}
}
