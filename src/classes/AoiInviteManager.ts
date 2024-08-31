import { APIGuildMember, Channel, Guild, GuildMember, Invite, PartialGuildMember, TextChannel, User } from "discord.js"
import { KeyValue, KeyValueData } from "@aoijs/aoi.db"
import { TypedEmitter } from "tiny-typed-emitter"
import { AoiClient, EventCommand } from "aoi.js"
import { Group } from "@aoijs/aoi.structures"
import inviteFunctions from "../functions"

/**
 * All events the invite manager can emit.
 */
export interface InviteManagerEvents {
    inviteJoin: (guildID: string, memberID: string, inviter: string, code: string) => void
    inviteLeave: (guildID: string, memberID: string, inviter: string, code: string) => void
    inviteError: (error: Error) => void
}

/**
 * Options the invite manager can admit.
 */
export interface InviteManagerOptions {
    fakeLimit?: number
    events: (keyof InviteManagerEvents)[]
    sk: string
}

/**
 * Represents the data a invite code has.
 */
export interface InviteCodeData {
    id: string
    join: number
    isFake: boolean
}

/**
 * Represents the data a inviter has.
 */
export interface InviterData {
    inviter: string
    codes: string[]
    codeData: {
        [key: string]: {
            fake: number
            total: number
            real: number
            leave: number
        }
    }
    counts: {
        fake: number
        total: number
        real: number
        leave: number
    }
}

/**
 * The main hub of the Aoi Invite System.
 */
export class AoiInviteManager extends TypedEmitter<InviteManagerEvents> {
    public cmds = {
        inviteJoin: new Group<string, EventCommand>(Infinity),
        inviteLeave: new Group<string, EventCommand>(Infinity),
        inviteError: new Group<string, EventCommand>(Infinity)
    }
    public readyAt: number | null = null

    private db: KeyValue
    private declaredEvents: (keyof InviteManagerEvents)[]
    private fakeLimit: number
    private invites = new Group<string, Group<string, Invite>>(Infinity)
    constructor(private client: AoiClient, private options: InviteManagerOptions) {
        super()

        this.db = new KeyValue({
            dataConfig: {
                path: "./database",
                tables: ["invites", "inviteCodes"],
            },
            fileConfig: {
                maxSize: 20 * 1024 * 1024,
            },
            encryptionConfig: {
                encriptData: false,
                securityKey: options.sk,
            }
        })
        this.declaredEvents = options.events
        this.fakeLimit = options.fakeLimit ??= 2 * 7 * 24 * 60 * 60 * 1000

        this.client.on("ready", async () => {
            await this.connect();
        })
    }

    /**
     * Fetch all invite codes from all cached guilds.
     */
    public async fetchAllInvites() {
        const guilds = this.client.guilds.cache.values()

        for (const guild of guilds) {
            const invites = await guild.invites.fetch()
            .catch((err: Error) => {
                this.emit("inviteError", err)
                return null
            });
            if (!invites) continue;

            const group = new Group<string, Invite>(Infinity)
            for (const invite of invites.values()) {
                group.set(invite.code, structuredClone(invite))
            }

            this.invites.set(guild.id, group)
        }

        console.log("[@aoijs/aoi.invite]: Fetched all invites")
    }

    /**
     * Handles the invite join event.
     * @param member - Guild member to work with.
     * @returns {Promise<void>}
     */
    public async memberJoin(member: GuildMember) {}

    /**
     * Handles the invite leave event.
     * @param guildID - Guild ID to remove the member from.
     * @param member - Guild member to work with.
     * @returns {Promise<void>}
     */
    public async memberLeave(guildID: string, member: GuildMember | PartialGuildMember) {}

    /**
     * Bind the declared events to the aoijs client.
     */
    private bindEvents() {
        for (const eventName of this.declaredEvents) {
            this.on(eventName, async (args: any) => {
                const commands = this.cmds[eventName]
                if (!commands) return;

                for (const command of commands.V()) {
                    const data: Record<string, any> = {}
                    let channel: Channel | null = null

                    if (command.channel?.match(/\$\w+/)) {
                        const id = await this.client.functionManager.interpreter(
                            this.client,
                            {},
                            [],
                            { name: "ChannelParser", code: command.channel },
                            this.client.db,
                            true
                        )
                        channel = this.client.channels.cache.get(id.code)
                        data.channel = channel
                    } else {
                        channel = this.client.channels.cache.get(command.channel)
                        data.channel = channel
                    }

                    await this.client.functionManager.interpreter(
                        this.client,
                        {},
                        [],
                        command,
                        this.client.db,
                        false,
                        channel.id,
                        { eventInfo: args },
                        channel as TextChannel
                    );
                }
            })
        }
    }

    /**
     * Connect the invite manager.
     */
    private async connect() {
        // Add the invite manager to the aoi client.
        this.client.aoiInviteManager = this

        // Connect the invite system database.
        await this.db.connect();

        // Fetch all invites.
        await this.fetchAllInvites();

        // Required events by the invite system.
        this.client.on("inviteCreate", (invite) => {
            let group = this.invites.get(invite.guild.id)
            if (!group) group = new Group<string, Invite>(Infinity);

            group.set(invite.code, invite)
            this.invites.set(invite.guild.id, group)
        })
        .on("inviteDelete", (invite) => {
            const group = this.invites.get(invite.guild.id)
            if (!group) return;

            group.delete(invite.code)
            this.invites.set(invite.guild.id, group)
        })
        .on("guildCreate", async (guild) => {
            const invites = await guild.invites.fetch()
            .catch((err) => {
                this.client.emit("error", err)
                return null
            })
            if (!invites) return;

            const group = new Group<string, Invite>(Infinity)
            for (const invite of invites.values()) {
                group.set(invite.code, invite)
            }
            this.invites.set(guild.id, group)
        })
        .on("guildDelete", (guild) => {
            this.invites.delete(guild.id)
        })
        .on("guildMemberAdd", async (member) => {
            await this.memberJoin(member);
        })
        .on("guildMemberRemove", async (member) => {
            await this.memberLeave(member.guild.id, member);
        })
        .on("guildBanAdd", async (ban) => {
            const getCodeData = await this.db.findOne("inviteCodes", (data) => {
                const found = (<InviteCodeData[]>data.value).find((d) => {
                    return d.id === ban.user.id && data.key.endsWith(ban.guild.id)
                })
                return !!found
            })
            const getCodeDataValue: InviteCodeData[] | undefined = getCodeData.value
            if (!getCodeDataValue) return;

            const memberData = getCodeDataValue.find((x) => x.id === ban.user.id)
            const member = {
                id: ban.user.id,
                user: ban.user,
                joinedTimestamp: memberData.join ?? ban.user.createdTimestamp,
            } as GuildMember

            await this.memberLeave(ban.guild.id, member);
        });

        for (const fn of inviteFunctions) {
            this.client.functionManager.createFunction({ type: "djs", ...fn })
        }

        this.readyAt = Date.now()
    }
}