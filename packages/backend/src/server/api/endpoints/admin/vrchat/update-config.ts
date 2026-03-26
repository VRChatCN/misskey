import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { VrchatService } from '@/core/VrchatService.js';

export const meta = {
	tags: ['admin', 'vrchat'],
	requireCredential: true,
	requireAdmin: true,
	kind: 'write:admin:vrchat',
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		enabled: { type: 'boolean' },
		cacheTtlMinutes: { type: 'integer', minimum: 1 },
		manualRefreshCooldownMinutes: { type: 'integer', minimum: 1 },
		verifiedRoleId: { type: 'string', nullable: true },
		visitorRoleId: { type: 'string', nullable: true },
		newUserRoleId: { type: 'string', nullable: true },
		userRoleId: { type: 'string', nullable: true },
		knownUserRoleId: { type: 'string', nullable: true },
		trustedUserRoleId: { type: 'string', nullable: true },
		visitorColor: { type: 'string', maxLength: 16 },
		newUserColor: { type: 'string', maxLength: 16 },
		userColor: { type: 'string', maxLength: 16 },
		knownUserColor: { type: 'string', maxLength: 16 },
		trustedUserColor: { type: 'string', maxLength: 16 },
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(private vrchatService: VrchatService) {
		super(meta, paramDef, async (ps) => {
			const updates: Record<string, any> = {};
			for (const key of Object.keys(paramDef.properties) as (keyof typeof paramDef.properties)[]) {
				const value = ps[key];
				if (value !== undefined) {
					updates[key] = value;
				}
			}
			await this.vrchatService.updateConfig(updates);
		});
	}
}
