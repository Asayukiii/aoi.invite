import { TypedEmitter } from "tiny-typed-emitter";
import { Group } from "@aoijs/aoi.structures";
import { AoiClient, Command } from "aoi.js";
/**
 * All events the invite manager can emit.
 */
export interface InviteManagerEvents {
    inviteJoin: (guildID: string, memberID: string, inviter: string, code: string) => void;
    inviteLeave: (guildID: string, memberID: string, inviter: string, code: string) => void;
    inviteError: (error: Error) => void;
}
/**
 * Options the invite manager can admit.
 */
export interface InviteManagerOptions {
    events: (keyof InviteManagerEvents)[];
    sk: string;
}
/**
 * The main hub of the Aoi Invite System.
 */
export declare class AoiInviteManager extends TypedEmitter<InviteManagerEvents> {
    private client;
    private options;
    cmds: {
        inviteJoin: Group<string, Command>;
        inviteLeave: Group<string, Command>;
        inviteError: Group<string, Command>;
    };
    constructor(client: AoiClient, options: InviteManagerOptions);
}
