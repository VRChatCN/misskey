import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { VrchatService } from '@/core/VrchatService.js';

export const meta = {
	tags: ['admin', 'vrchat'],
	requireCredential: true,
	requireAdmin: true,
	kind: 'read:admin:vrchat',
} as const;

export const paramDef = {
	type: 'object',
	properties: {},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(private vrchatService: VrchatService) {
		super(meta, paramDef, async () => {
			const config = await this.vrchatService.getConfig();
			return {
				enabled: config.enabled,
				botUsername: config.botUsername,
				cacheTtlMinutes: config.cacheTtlMinutes,
				manualRefreshCooldownMinutes: config.manualRefreshCooldownMinutes,
				verifiedRoleId: config.verifiedRoleId,
				visitorRoleId: config.visitorRoleId,
				newUserRoleId: config.newUserRoleId,
				userRoleId: config.userRoleId,
				knownUserRoleId: config.knownUserRoleId,
				trustedUserRoleId: config.trustedUserRoleId,
				visitorColor: config.visitorColor,
				newUserColor: config.newUserColor,
				userColor: config.userColor,
				knownUserColor: config.knownUserColor,
				trustedUserColor: config.trustedUserColor,
			};
		});
	}
}
