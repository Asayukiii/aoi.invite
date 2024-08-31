import { Guild, GuildMember, Message, MessageMentions, Snowflake, TextChannel, User } from "discord.js"
import type { AoiClient, Command, EventCommand } from "aoi.js"
import { AoiInviteManager } from "./classes/AoiInviteManager"
import type { KeyValue } from "@aoijs/aoi.db"

export { AoiInviteManager }

declare module "aoi.js" {
    interface AoiClient {
        aoiInviteManager: AoiInviteManager
    }
    interface FunctionManager {
        createFunction(...funcs: Record<string, any>[]): void
    }
}