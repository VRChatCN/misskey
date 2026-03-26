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
		verifyFailed: { message: 'VRChat 2FA verification failed.', code: 'VRCHAT_2FA_FAILED', id: 'f0a0b1c1-a002-4000-a000-000000000001' },
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		code: { type: 'string', minLength: 1 },
		method: { type: 'string', enum: ['totp', 'emailOtp'], default: 'totp' },
	},
	required: ['code'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(private vrchatService: VrchatService) {
		super(meta, paramDef, async (ps) => {
			const result = await this.vrchatService.verify2fa(ps.code, (ps.method as 'totp' | 'emailOtp') ?? 'totp');
			if (!result.success) {
				throw new ApiError(meta.errors.verifyFailed);
			}
			return {
				success: true,
				displayName: result.user?.displayName,
			};
		});
	}
}
