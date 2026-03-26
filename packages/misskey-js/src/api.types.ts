import { Endpoints as Gen } from './autogen/endpoint.js';
import { UserDetailed } from './autogen/models.js';
import {
	AdminRolesCreateRequest,
	AdminRolesCreateResponse,
	EmptyRequest,
	EmptyResponse,
	UsersShowRequest,
} from './autogen/entities.js';
import {
	PartialRolePolicyOverride,
	SigninFlowRequest,
	SigninFlowResponse,
	SigninWithPasskeyInitResponse,
	SigninWithPasskeyRequest,
	SigninWithPasskeyResponse,
	SignupPendingRequest,
	SignupPendingResponse,
	SignupRequest,
	SignupResponse,
} from './entities.js';

type Overwrite<T, U extends { [Key in keyof T]?: unknown }> = Omit<
	T,
	keyof U
> & U;

type SwitchCase<Condition = unknown, Result = unknown> = {
	$switch: {
		$cases: [Condition, Result][],
		$default: Result;
	};
};

type IsNeverType<T> = [T] extends [never] ? true : false;
type StrictExtract<Union, Cond> = Cond extends Union ? Union : never;

type IsCaseMatched<E extends keyof Endpoints, P extends Endpoints[E]['req'], C extends number> =
	Endpoints[E]['res'] extends SwitchCase
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		? IsNeverType<StrictExtract<Endpoints[E]['res']['$switch']['$cases'][C], [P, any]>> extends false ? true : false
		: false;

type GetCaseResult<E extends keyof Endpoints, P extends Endpoints[E]['req'], C extends number> =
	Endpoints[E]['res'] extends SwitchCase
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		? StrictExtract<Endpoints[E]['res']['$switch']['$cases'][C], [P, any]>[1]
		: never;

/* eslint-disable @stylistic/indent */
export type SwitchCaseResponseType<E extends keyof Endpoints, P extends Endpoints[E]['req']> = Endpoints[E]['res'] extends SwitchCase
	? IsCaseMatched<E, P, 0> extends true ? GetCaseResult<E, P, 0> :
		IsCaseMatched<E, P, 1> extends true ? GetCaseResult<E, P, 1> :
			IsCaseMatched<E, P, 2> extends true ? GetCaseResult<E, P, 2> :
				IsCaseMatched<E, P, 3> extends true ? GetCaseResult<E, P, 3> :
					IsCaseMatched<E, P, 4> extends true ? GetCaseResult<E, P, 4> :
						IsCaseMatched<E, P, 5> extends true ? GetCaseResult<E, P, 5> :
							IsCaseMatched<E, P, 6> extends true ? GetCaseResult<E, P, 6> :
								IsCaseMatched<E, P, 7> extends true ? GetCaseResult<E, P, 7> :
									IsCaseMatched<E, P, 8> extends true ? GetCaseResult<E, P, 8> :
										IsCaseMatched<E, P, 9> extends true ? GetCaseResult<E, P, 9> :
											Endpoints[E]['res']['$switch']['$default'] : Endpoints[E]['res'];
/* eslint-enable @stylistic/indent */

export type Endpoints = Overwrite<
	Gen,
	{
		'users/show': {
			req: UsersShowRequest;
			res: {
				$switch: {
					$cases: [[
						{
							userIds?: string[];
						}, UserDetailed[],
					]];
					$default: UserDetailed;
				};
			};
		},
		// api.jsonには載せないものなのでここで定義
		'signup': {
			req: SignupRequest;
			res: SignupResponse;
		},
		// api.jsonには載せないものなのでここで定義
		'signup-pending': {
			req: SignupPendingRequest;
			res: SignupPendingResponse;
		},
		// api.jsonには載せないものなのでここで定義
		'signin-flow': {
			req: SigninFlowRequest;
			res: SigninFlowResponse;
		},
		'signin-with-passkey': {
			req: SigninWithPasskeyRequest;
			res: {
				$switch: {
					$cases: [
						[
							{
								context: string;
							},
							SigninWithPasskeyResponse,
						],
					];
					$default: SigninWithPasskeyInitResponse;
				},
			},
		},
		'admin/roles/create': {
			req: Overwrite<AdminRolesCreateRequest, { policies: PartialRolePolicyOverride }>;
			res: AdminRolesCreateResponse;
		},
		'clear-browser-cache': {
			req: EmptyRequest;
			res: EmptyResponse;
		},
		'admin/vrchat/config': {
			req: EmptyRequest;
			res: {
				enabled: boolean;
				botUsername: string | null;
				cacheTtlMinutes: number;
				manualRefreshCooldownMinutes: number;
				verifiedRoleId: string | null;
				visitorRoleId: string | null;
				newUserRoleId: string | null;
				userRoleId: string | null;
				knownUserRoleId: string | null;
				trustedUserRoleId: string | null;
				visitorColor: string;
				newUserColor: string;
				userColor: string;
				knownUserColor: string;
				trustedUserColor: string;
			};
		},
		'admin/vrchat/update-config': {
			req: {
				enabled?: boolean;
				cacheTtlMinutes?: number;
				manualRefreshCooldownMinutes?: number;
				verifiedRoleId?: string | null;
				visitorRoleId?: string | null;
				newUserRoleId?: string | null;
				userRoleId?: string | null;
				knownUserRoleId?: string | null;
				trustedUserRoleId?: string | null;
				visitorColor?: string;
				newUserColor?: string;
				userColor?: string;
				knownUserColor?: string;
				trustedUserColor?: string;
			};
			res: EmptyResponse;
		},
		'admin/vrchat/login': {
			req: {
				username: string;
				password: string;
			};
			res: {
				success: boolean;
				requires2fa: string[] | false;
				displayName?: string;
			};
		},
		'admin/vrchat/verify-2fa': {
			req: {
				code: string;
				method?: 'totp' | 'emailOtp';
			};
			res: {
				success: boolean;
				displayName?: string;
			};
		},
		'admin/vrchat/status': {
			req: EmptyRequest;
			res: {
				loggedIn: boolean;
				displayName?: string;
				error?: string;
			};
		},
		'vrchat/config': {
			req: EmptyRequest;
			res: {
				enabled: boolean;
				cacheTtlMinutes: number;
				manualRefreshCooldownMinutes: number;
				colors: Record<string, string>;
			};
		},
		'vrchat/info': {
			req: {
				userId: string;
			};
			res: {
				vrchatId: string;
				displayName: string | null;
				trustRank: string | null;
				cachedAt: string | null;
			} | null;
		},
		'vrchat/search': {
			req: {
				query: string;
			};
			res: {
				id: string;
				displayName: string;
			}[];
		},
		'vrchat/bind': {
			req: {
				vrchatId: string;
			};
			res: {
				verificationKey: string;
			};
		},
		'vrchat/verify': {
			req: EmptyRequest;
			res: EmptyResponse;
		},
		'vrchat/refresh': {
			req: EmptyRequest;
			res: {
				cooldownSeconds?: number;
			};
		},
		'vrchat/unbind': {
			req: EmptyRequest;
			res: EmptyResponse;
		},
	}
>;
