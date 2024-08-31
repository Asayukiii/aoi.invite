"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AoiInviteManager = void 0;
const tiny_typed_emitter_1 = require("tiny-typed-emitter");
const aoi_structures_1 = require("@aoijs/aoi.structures");
/**
 * The main hub of the Aoi Invite System.
 */
class AoiInviteManager extends tiny_typed_emitter_1.TypedEmitter {
    constructor(client, options) {
        super();
        this.client = client;
        this.options = options;
        this.cmds = {
            inviteJoin: new aoi_structures_1.Group(Infinity),
            inviteLeave: new aoi_structures_1.Group(Infinity),
            inviteError: new aoi_structures_1.Group(Infinity)
        };
    }
}
exports.AoiInviteManager = AoiInviteManager;
