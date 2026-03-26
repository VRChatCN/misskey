import { Entity, Column, PrimaryColumn, OneToOne, JoinColumn, Index } from 'typeorm';
import { id } from './util/id.js';
import { MiUser } from './User.js';

@Entity('vrchat_binding')
export class MiVrchatBinding {
	@PrimaryColumn(id())
	public userId: MiUser['id'];

	@OneToOne(() => MiUser, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public user: MiUser | null;

	@Index({ unique: true })
	@Column('varchar', {
		length: 128,
	})
	public vrchatId: string;

	@Column('varchar', {
		length: 256, nullable: true,
	})
	public displayName: string | null;

	@Column('varchar', {
		length: 32, nullable: true,
	})
	public trustRank: string | null;

	@Column('boolean', {
		default: false,
	})
	public verified: boolean;

	@Column('varchar', {
		length: 64,
	})
	public verificationKey: string;

	@Column('timestamp with time zone', {
		nullable: true,
	})
	public cachedAt: Date | null;

	@Column('timestamp with time zone', {
		nullable: true,
	})
	public lastManualRefresh: Date | null;

	constructor(data: Partial<MiVrchatBinding>) {
		if (data == null) return;

		for (const [k, v] of Object.entries(data)) {
			(this as any)[k] = v;
		}
	}
}
