import { randomBytes } from 'crypto';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { VrchatBindingsRepository, VrchatConfigRepository } from '@/models/_.js';
import type { MiVrchatBinding } from '@/models/VrchatBinding.js';
import type { MiVrchatConfig } from '@/models/VrchatConfig.js';
import type { MiUser } from '@/models/User.js';
import { RoleService } from '@/core/RoleService.js';
import { bindThis } from '@/decorators.js';
import Logger from '@/logger.js';
import { VrcClient } from '@/server/api/endpoints/admin/vrchat/vrcClient.js';

const TRUST_RANK_ORDER = ['visitor', 'new_user', 'user', 'known_user', 'trusted_user'] as const;
export type TrustRank = typeof TRUST_RANK_ORDER[number];

@Injectable()
export class VrchatService implements OnModuleInit {
	private logger = new Logger('VrchatService');
	private vrchatClient: VrcClient | null = null;
	private config: MiVrchatConfig | null = null;

	constructor(
		@Inject(DI.vrchatBindingsRepository)
		private vrchatBindingsRepository: VrchatBindingsRepository,

		@Inject(DI.vrchatConfigRepository)
		private vrchatConfigRepository: VrchatConfigRepository,

		private roleService: RoleService,
	) {}

	async onModuleInit() {
		await this.loadConfig();
	}

	@bindThis
	public async loadConfig(): Promise<MiVrchatConfig> {
		this.config = await this.vrchatConfigRepository.findOneBy({ id: 'x' });
		if (!this.config) {
			this.config = await this.vrchatConfigRepository.save({ id: 'x' } as MiVrchatConfig);
		}
		return this.config;
	}

	@bindThis
	public async getConfig(): Promise<MiVrchatConfig> {
		if (!this.config) {
			return await this.loadConfig();
		}
		return this.config;
	}

	@bindThis
	public async updateConfig(updates: Partial<MiVrchatConfig>): Promise<MiVrchatConfig> {
		await this.vrchatConfigRepository.update({ id: 'x' }, updates);
		return await this.loadConfig();
	}

	@bindThis
	private async createClient() {
		const config = await this.getConfig();
		return new VrcClient(
			config.botAuthCookie,
			(cookieString) => this.saveClientCookies(cookieString),
			config.botUsername,
			config.botPassword,
		);
	}

	@bindThis
	private async ensureClient() {
		if (this.vrchatClient) return this.vrchatClient;

		const config = await this.getConfig();
		if (!config.botUsername || !config.botPassword) {
			throw new Error('VRChat bot credentials not configured');
		}

		this.vrchatClient = await this.createClient();
		return this.vrchatClient;
	}

	@bindThis
	private async saveClientCookies(cookieDataString: string): Promise<void> {
		try {
			await this.updateConfig({ botAuthCookie: cookieDataString });
		} catch (e) {
			this.logger.warn('Failed to persist VRC cookies', e as any);
		}
	}

	@bindThis
	public async login(username: string, password: string): Promise<{ success: boolean; requires2fa?: string[]; user?: any; error?: string }> {
		this.vrchatClient = await this.createClient();

		try {
			const result = await this.vrchatClient.login(username, password);

			if (result.httpStatusCode === 200) {
				if (result.requiresTwoFactorAuth) {
					await this.updateConfig({
						botUsername: username,
						botPassword: password,
					});
					return { success: false, requires2fa: result.requiresTwoFactorAuth };
				}
				await this.updateConfig({
					botUsername: username,
					botPassword: password,
				});
				return { success: true, user: result };
			} else {
				this.vrchatClient = null;
				return { success: false, error: result.error?.message ?? 'Login failed' };
			}
		} catch (e: any) {
			this.vrchatClient = null;
			this.logger.error('VRC login failed', e);
			return { success: false, error: String(e?.message || e) };
		}
	}

	@bindThis
	public async verify2fa(code: string, method: 'totp' | 'emailOtp' = 'totp'): Promise<{ success: boolean; user?: any; error?: string }> {
		if (!this.vrchatClient) {
			return { success: false, error: 'No active login session. Please login first.' };
		}

		try {
			const result = method === 'emailOtp'
				? await this.vrchatClient.verify2FaEmailCode(code)
				: await this.vrchatClient.verify2Fa(code);

			if (!result) {
				return { success: false, error: '2FA verification failed' };
			}

			const userResult = await this.vrchatClient.getCurrentUser();

			if ((userResult.httpStatusCode !== 200) || userResult.error) {
				return { success: false, error: userResult.error?.message ?? 'Failed to get user info after 2FA' };
			}

			return { success: true, user: userResult };
		} catch (e: any) {
			this.logger.error('VRC 2FA verification failed', e);
			return { success: false, error: String(e?.message || e) };
		}
	}

	@bindThis
	public async getBotStatus(): Promise<{ loggedIn: boolean; displayName?: string; error?: string }> {
		try {
			const client = await this.ensureClient();
			const result = await client.getCurrentUser();

			if (result.error) {
				return { loggedIn: false, error: result.error.message };
			}

			if (result.requiresTwoFactorAuth) {
				return { loggedIn: false, error: 'Requires 2FA' };
			}

			if (result.httpStatusCode === 200) {
				return { loggedIn: true, displayName: result.displayName };
			}

			return { loggedIn: false };
		} catch (e: any) {
			return { loggedIn: false, error: String(e?.message || e) };
		}
	}

	@bindThis
	public async searchUsers(query: string): Promise<{ id: string; displayName: string }[]> {
		const client = await this.ensureClient();
		const result = await client.searchUsersByDisplayName(query);

		if (result.error || !Array.isArray(result.data)) {
			throw new Error(result.error?.message ?? 'Failed to search VRChat users');
		}

		return result.data.map((u) => ({
			id: u.id,
			displayName: u.displayName,
		}));
	}

	@bindThis
	public async getVrcUser(vrchatId: string): Promise<{ id: string; displayName: string; bio: string; tags: string[]; currentAvatarThumbnailImageUrl?: string } | null> {
		try {
			const client = await this.ensureClient();
			const u = await client.getUser(vrchatId);

			if (u.error || !u.id || (u.httpStatusCode !== 200)) {
				this.logger.error(`Failed to get VRC user ${vrchatId}: ${u.error?.message ?? 'unknown'}`);
				return null;
			}

			return {
				id: u.id,
				displayName: u.displayName,
				bio: u.bio || '',
				tags: u.tags,
				currentAvatarThumbnailImageUrl: u.currentAvatarThumbnailImageUrl,
			};
		} catch (e: any) {
			this.logger.error(`Failed to get VRC user ${vrchatId}`, e);
			return null;
		}
	}

	@bindThis
	public parseTrustRank(tags: string[]): TrustRank {
		if (tags.includes('system_trust_veteran')) return 'trusted_user';
		if (tags.includes('system_trust_trusted')) return 'known_user';
		if (tags.includes('system_trust_known')) return 'user';
		if (tags.includes('system_trust_basic')) return 'new_user';
		return 'visitor';
	}

	@bindThis
	public generateVerificationKey(): string {
		return 'verify_' + randomBytes(16).toString('hex');
	}

	@bindThis
	public async startBinding(userId: MiUser['id'], vrchatId: string): Promise<{ verificationKey: string }> {
		const existing = await this.vrchatBindingsRepository.findOneBy({ userId });
		if (existing?.verified) {
			throw new Error('ALREADY_BOUND');
		}

		const existingVrc = await this.vrchatBindingsRepository.findOneBy({ vrchatId });
		if (existingVrc && existingVrc.userId !== userId) {
			throw new Error('VRCHAT_ACCOUNT_ALREADY_BOUND');
		}

		const verificationKey = this.generateVerificationKey();

		if (existing) {
			await this.vrchatBindingsRepository.update({ userId }, {
				vrchatId,
				verificationKey,
				verified: false,
				displayName: null,
				trustRank: null,
				cachedAt: null,
			});
		} else {
			await this.vrchatBindingsRepository.insert({
				userId,
				vrchatId,
				verificationKey,
				verified: false,
			} as MiVrchatBinding);
		}

		return { verificationKey };
	}

	@bindThis
	public async verifyBinding(userId: MiUser['id']): Promise<{ success: boolean; error?: string }> {
		const binding = await this.vrchatBindingsRepository.findOneBy({ userId });
		if (!binding) {
			return { success: false, error: 'NO_BINDING' };
		}
		if (binding.verified) {
			return { success: false, error: 'ALREADY_VERIFIED' };
		}

		const vrcUser = await this.getVrcUser(binding.vrchatId);
		if (!vrcUser) {
			return { success: false, error: 'VRC_USER_NOT_FOUND' };
		}

		if (!vrcUser.bio.includes(binding.verificationKey)) {
			return { success: false, error: 'KEY_NOT_FOUND_IN_BIO' };
		}

		const trustRank = this.parseTrustRank(vrcUser.tags);

		await this.vrchatBindingsRepository.update({ userId }, {
			verified: true,
			displayName: vrcUser.displayName,
			trustRank,
			cachedAt: new Date(),
		});

		await this.assignRoles(userId, trustRank);

		return { success: true };
	}

	@bindThis
	public async unbind(userId: MiUser['id']): Promise<void> {
		const binding = await this.vrchatBindingsRepository.findOneBy({ userId });
		if (!binding) return;

		await this.removeRoles(userId);
		await this.vrchatBindingsRepository.delete({ userId });
	}

	@bindThis
	public async getBinding(userId: MiUser['id']): Promise<MiVrchatBinding | null> {
		return await this.vrchatBindingsRepository.findOneBy({ userId, verified: true });
	}

	@bindThis
	public async getBindingsByUserIds(userIds: MiUser['id'][]): Promise<Map<string, MiVrchatBinding>> {
		if (userIds.length === 0) return new Map();
		const bindings = await this.vrchatBindingsRepository
			.createQueryBuilder('vb')
			.where('vb.userId IN (:...userIds)', { userIds })
			.andWhere('vb.verified = true')
			.getMany();
		return new Map(bindings.map(b => [b.userId, b]));
	}

	@bindThis
	public async getInfo(userId: MiUser['id'], forceRefresh: boolean = false): Promise<{
		vrchatId: string;
		displayName: string | null;
		trustRank: TrustRank | null;
		cachedAt: Date | null;
	} | null> {
		const binding = await this.vrchatBindingsRepository.findOneBy({ userId, verified: true });
		if (!binding) return null;

		const config = await this.getConfig();
		const now = new Date();
		const cacheExpired = !binding.cachedAt ||
			(now.getTime() - binding.cachedAt.getTime()) > config.cacheTtlMinutes * 60 * 1000;

		if (forceRefresh || cacheExpired) {
			await this.refreshCache(binding);
			const updated = await this.vrchatBindingsRepository.findOneBy({ userId });
			if (!updated) return null;
			return {
				vrchatId: updated.vrchatId,
				displayName: updated.displayName,
				trustRank: updated.trustRank as TrustRank | null,
				cachedAt: updated.cachedAt,
			};
		}

		return {
			vrchatId: binding.vrchatId,
			displayName: binding.displayName,
			trustRank: binding.trustRank as TrustRank | null,
			cachedAt: binding.cachedAt,
		};
	}

	@bindThis
	public async manualRefresh(userId: MiUser['id']): Promise<{ success: boolean; error?: string; cooldownSeconds?: number }> {
		const binding = await this.vrchatBindingsRepository.findOneBy({ userId, verified: true });
		if (!binding) {
			return { success: false, error: 'NO_BINDING' };
		}

		const config = await this.getConfig();
		const now = new Date();

		if (binding.lastManualRefresh) {
			const cooldownMs = config.manualRefreshCooldownMinutes * 60 * 1000;
			const elapsed = now.getTime() - binding.lastManualRefresh.getTime();
			if (elapsed < cooldownMs) {
				return {
					success: false,
					error: 'COOLDOWN',
					cooldownSeconds: Math.ceil((cooldownMs - elapsed) / 1000),
				};
			}
		}

		await this.vrchatBindingsRepository.update({ userId }, { lastManualRefresh: now });
		await this.refreshCache(binding);
		return { success: true };
	}

	@bindThis
	private async refreshCache(binding: MiVrchatBinding): Promise<void> {
		try {
			const vrcUser = await this.getVrcUser(binding.vrchatId);
			if (!vrcUser) return;

			const newTrustRank = this.parseTrustRank(vrcUser.tags);
			const oldTrustRank = binding.trustRank;

			await this.vrchatBindingsRepository.update({ userId: binding.userId }, {
				displayName: vrcUser.displayName,
				trustRank: newTrustRank,
				cachedAt: new Date(),
			});

			if (oldTrustRank !== newTrustRank) {
				await this.removeRoles(binding.userId);
				await this.assignRoles(binding.userId, newTrustRank);
			}
		} catch (e) {
			this.logger.error(`Failed to refresh VRC cache for user ${binding.userId}`, e as any);
		}
	}

	@bindThis
	private async assignRoles(userId: MiUser['id'], trustRank: TrustRank): Promise<void> {
		const config = await this.getConfig();

		if (config.verifiedRoleId) {
			try {
				await this.roleService.assign(userId, config.verifiedRoleId);
			} catch (e) {
				this.logger.warn(`Failed to assign verified role: ${e}`);
			}
		}

		const rankRoleMap: Record<TrustRank, string | null> = {
			visitor: config.visitorRoleId,
			new_user: config.newUserRoleId,
			user: config.userRoleId,
			known_user: config.knownUserRoleId,
			trusted_user: config.trustedUserRoleId,
		};

		const roleId = rankRoleMap[trustRank];
		if (roleId) {
			try {
				await this.roleService.assign(userId, roleId);
			} catch (e) {
				this.logger.warn(`Failed to assign trust rank role: ${e}`);
			}
		}
	}

	@bindThis
	private async removeRoles(userId: MiUser['id']): Promise<void> {
		const config = await this.getConfig();
		const roleIds = [
			config.verifiedRoleId,
			config.visitorRoleId,
			config.newUserRoleId,
			config.userRoleId,
			config.knownUserRoleId,
			config.trustedUserRoleId,
		].filter((id): id is string => id != null);

		for (const roleId of roleIds) {
			try {
				await this.roleService.unassign(userId, roleId);
			} catch {
				// role may not be assigned, ignore
			}
		}
	}

	@bindThis
	public async getPublicConfig(): Promise<{
		enabled: boolean;
		cacheTtlMinutes: number;
		manualRefreshCooldownMinutes: number;
		colors: Record<TrustRank, string>;
	}> {
		const config = await this.getConfig();
		return {
			enabled: config.enabled,
			cacheTtlMinutes: config.cacheTtlMinutes,
			manualRefreshCooldownMinutes: config.manualRefreshCooldownMinutes,
			colors: {
				visitor: config.visitorColor,
				new_user: config.newUserColor,
				user: config.userColor,
				known_user: config.knownUserColor,
				trusted_user: config.trustedUserColor,
			},
		};
	}
}
