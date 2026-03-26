interface IKeyString {
	[key: string]: any;
}

export interface ApiResponse extends IKeyString {
	httpStatusCode: number;
}

export interface ErrorResponse extends IKeyString {
	message: string;
	status_code: number;
}

export interface LoginResponse extends ApiResponse {
	requiresTwoFactorAuth?: string[];
	error?: ErrorResponse;

	displayName?: string;
	id?: string;
}

export interface SearchUserInfo {
	bio: string
	bioLinks: string[]
	currentAvatarImageUrl: string
	currentAvatarThumbnailImageUrl: string
	currentAvatarTags: string[]
	developerType: string
	displayName: string
	id: string
	isFriend: boolean
	last_platform: string
	profilePicOverride: string
	pronouns: string
	status: string
	statusDescription: string
	tags: string[]
	userIcon: string
}

export interface SearchUsersModifiedResponse extends ApiResponse {
	error?: ErrorResponse;
	data?: SearchUserInfo[]
}

export interface UserInfoResponse extends ApiResponse {
	ageVerificationStatus: string
	ageVerified: boolean
	allowAvatarCopying: boolean
	badges: Badge[]
	bio: string
	bioLinks: string[]
	currentAvatarImageUrl: string
	currentAvatarThumbnailImageUrl: string
	currentAvatarTags: string[]
	date_joined: string
	developerType: string
	displayName: string
	friendKey: string
	friendRequestStatus: string
	id: string
	instanceId: string
	isFriend: boolean
	last_activity: string
	last_login: string
	last_mobile: string
	last_platform: string
	location: string
	note: string
	platform: string
	profilePicOverride: string
	profilePicOverrideThumbnail: string
	pronouns: string
	state: string
	status: string
	statusDescription: string
	tags: string[]
	travelingToInstance: string
	travelingToLocation: string
	travelingToWorld: string
	userIcon: string
	username: string
	worldId: string
}

export interface Badge {
	assignedAt: string
	badgeDescription: string
	badgeId: string
	badgeImageUrl: string
	badgeName: string
	hidden: boolean
	showcased: boolean
	updatedAt: string
}

