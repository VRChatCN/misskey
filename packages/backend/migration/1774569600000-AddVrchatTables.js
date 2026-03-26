export class AddVrchatTables1774569600000 {
    name = 'AddVrchatTables1774569600000'

    async up(queryRunner) {
        await queryRunner.query(`
            CREATE TABLE "vrchat_config" (
                "id" varchar(32) NOT NULL,
                "enabled" boolean NOT NULL DEFAULT false,
                "botUsername" varchar(256),
                "botPassword" varchar(256),
                "botTotpSecret" varchar(256),
                "botAuthCookie" text,
                "cacheTtlMinutes" integer NOT NULL DEFAULT 360,
                "manualRefreshCooldownMinutes" integer NOT NULL DEFAULT 5,
                "verifiedRoleId" varchar(32),
                "visitorRoleId" varchar(32),
                "newUserRoleId" varchar(32),
                "userRoleId" varchar(32),
                "knownUserRoleId" varchar(32),
                "trustedUserRoleId" varchar(32),
                "visitorColor" varchar(16) NOT NULL DEFAULT '#CCCCCC',
                "newUserColor" varchar(16) NOT NULL DEFAULT '#1778FF',
                "userColor" varchar(16) NOT NULL DEFAULT '#2BCF5C',
                "knownUserColor" varchar(16) NOT NULL DEFAULT '#FF7B42',
                "trustedUserColor" varchar(16) NOT NULL DEFAULT '#8143E6',
                CONSTRAINT "PK_vrchat_config" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`
            INSERT INTO "vrchat_config" ("id") VALUES ('x')
        `);

        await queryRunner.query(`
            CREATE TABLE "vrchat_binding" (
                "userId" varchar(32) NOT NULL,
                "vrchatId" varchar(128) NOT NULL,
                "displayName" varchar(256),
                "trustRank" varchar(32),
                "verified" boolean NOT NULL DEFAULT false,
                "verificationKey" varchar(64) NOT NULL,
                "cachedAt" TIMESTAMP WITH TIME ZONE,
                "lastManualRefresh" TIMESTAMP WITH TIME ZONE,
                CONSTRAINT "PK_vrchat_binding" PRIMARY KEY ("userId")
            )
        `);

        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_vrchat_binding_vrchatId" ON "vrchat_binding" ("vrchatId")
        `);

        await queryRunner.query(`
            ALTER TABLE "vrchat_binding"
            ADD CONSTRAINT "FK_vrchat_binding_userId"
            FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "vrchat_binding" DROP CONSTRAINT "FK_vrchat_binding_userId"`);
        await queryRunner.query(`DROP INDEX "IDX_vrchat_binding_vrchatId"`);
        await queryRunner.query(`DROP TABLE "vrchat_binding"`);
        await queryRunner.query(`DROP TABLE "vrchat_config"`);
    }
}
