import { AoiInviteManager } from "./classes/AoiInviteManager";
export { AoiInviteManager };
declare module "aoi.js" {
    interface AoiClient {
        aoiInviteManager: AoiInviteManager;
    }
}
