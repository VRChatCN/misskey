import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('vrchat_config')
export class MiVrchatConfig {
	@PrimaryColumn('varchar', {
		length: 32,
	})
	public id: string;

	@Column('boolean', {
		default: false,
	})
	public enabled: boolean;

	@Column('varchar', {
		length: 256, nullable: true,
	})
	public botUsername: string | null;

	@Column('varchar', {
		length: 256, nullable: true,
	})
	public botPassword: string | null;

	@Column('varchar', {
		length: 256, nullable: true,
	})
	public botTotpSecret: string | null;

	@Column('text', {
		nullable: true,
	})
	public botAuthCookie: string | null;

	@Column('integer', {
		default: 360,
	})
	public cacheTtlMinutes: number;

	@Column('integer', {
		default: 5,
	})
	public manualRefreshCooldownMinutes: number;

	@Column('varchar', {
		length: 32, nullable: true,
	})
	public verifiedRoleId: string | null;

	@Column('varchar', {
		length: 32, nullable: true,
	})
	public visitorRoleId: string | null;

	@Column('varchar', {
		length: 32, nullable: true,
	})
	public newUserRoleId: string | null;

	@Column('varchar', {
		length: 32, nullable: true,
	})
	public userRoleId: string | null;

	@Column('varchar', {
		length: 32, nullable: true,
	})
	public knownUserRoleId: string | null;

	@Column('varchar', {
		length: 32, nullable: true,
	})
	public trustedUserRoleId: string | null;

	@Column('varchar', {
		length: 16, default: '#CCCCCC',
	})
	public visitorColor: string;

	@Column('varchar', {
		length: 16, default: '#1778FF',
	})
	public newUserColor: string;

	@Column('varchar', {
		length: 16, default: '#2BCF5C',
	})
	public userColor: string;

	@Column('varchar', {
		length: 16, default: '#FF7B42',
	})
	public knownUserColor: string;

	@Column('varchar', {
		length: 16, default: '#8143E6',
	})
	public trustedUserColor: string;

	constructor(data: Partial<MiVrchatConfig>) {
		if (data == null) return;

		for (const [k, v] of Object.entries(data)) {
			(this as any)[k] = v;
		}
	}
}
