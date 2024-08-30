"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonc_1 = require("/snapshot/project/node_modules/jsonc");
const path_1 = __importDefault(require("path"));
class MAPE {
    mod;
    modShortName;
    constructor() {
        this.mod = "Make Armor Plate Effective";
        this.modShortName = "MAPE";
    }
    postDBLoad(container) {
        const logger = container.resolve("WinstonLogger");
        const db = container.resolve("DatabaseServer");
        const tables = db.getTables();
        const itemDB = tables.templates.items;
        const vfs = container.resolve("VFS");
        const config = jsonc_1.jsonc.parse(vfs.readFile(path_1.default.resolve(__dirname, "../config/config.jsonc")));
        // Check Compatibility
        const preSptModLoader = container.resolve("PreSptModLoader");
        if (!config.mod_TGC && preSptModLoader.getImportedModsNames().includes("MoxoPixel-TacticalGearComponent")) {
            logger.info(`[${this.modShortName}] Tactical Gear Component is detected.`);
            config.mod_TGC = true;
        }
        if (!config.mod_ARTEM && preSptModLoader.getImportedModsNames().includes("AAArtemEquipment")) {
            logger.info(`[${this.modShortName}] Artem Equipment is detected.`);
            config.mod_ARTEM = true;
        }
        if (!config.mod_BLACKCORE && preSptModLoader.getImportedModsNames().includes("MoxoPixel-BlackCore")) {
            logger.info(`[${this.modShortName}] Blackcore is detected.`);
            config.mod_BLACKCORE = true;
        }
        let defaultArmorGears = [];
        defaultArmorGears = defaultArmorGears.concat(config.upperTorso, config.lowerTorso, config.entireTorso); // All BSG's default EFT gears
        // Mod Compatibility 
        if (config.mod_ARTEM) { // For Artem Equipment mod
            const artemConfig = jsonc_1.jsonc.parse(vfs.readFile(path_1.default.resolve(__dirname, "../config/artem.jsonc")));
            config.upperTorso = config.upperTorso.concat(artemConfig.upperTorso);
            config.lowerTorso = config.lowerTorso.concat(artemConfig.lowerTorso);
            config.entireTorso = config.entireTorso.concat(artemConfig.entireTorso);
            if (config.debug) {
                logger.info(`[${this.modShortName}] Artem equipments loaded.`);
            }
        }
        for (let item in itemDB) {
            if (itemDB[item]._type !== "Node") {
                let itemId = itemDB[item]._id;
                // Mod Compatibility
                if (config.mod_TGC) { // For MoxoPixel-TacticalGearComponent
                    const modTGC_items = JSON.parse(vfs.readFile(path_1.default.resolve(__dirname, "../../MoxoPixel-TacticalGearComponent/database/modTGC_items.json")));
                    if (modTGC_items.hasOwnProperty(itemId)) {
                        let cloneId = modTGC_items[itemId].clone;
                        if (defaultArmorGears.includes(cloneId)) { // check item is armor vest or body armor
                            itemId = cloneId; // change itemId to cloneId
                            if (config.debug) {
                                logger.info(`[${this.modShortName}] Cloned ${itemDB[item]._name}'s cloneID. (clone id ${itemId} )`);
                            }
                        }
                        else if (modTGC_items.hasOwnProperty(cloneId)) { // if item is clone of TGC another armor
                            while (modTGC_items.hasOwnProperty(cloneId)) { // change cloneId until it is BSG's default EFT gear's one.
                                cloneId = modTGC_items[cloneId].clone;
                                if (config.debug) {
                                    logger.info(`[${this.modShortName}] Cloned ${itemDB[item]._name}'s cloneID. (clone id ${itemId} )`);
                                }
                            }
                            itemId = cloneId; // change itemId to cloneId
                        }
                    }
                }
                if (config.mod_BLACKCORE) { // For MoxoPixel-BlackCore
                    const modBlackCore_items = JSON.parse(vfs.readFile(path_1.default.resolve(__dirname, "../../MoxoPixel-BlackCore/database/items.json"))); // is it working?
                    if (modBlackCore_items.hasOwnProperty(itemId)) {
                        let cloneId = modBlackCore_items[itemId].clone;
                        if (defaultArmorGears.includes(cloneId)) { // check item is armor vest or body armor
                            itemId = cloneId; // change itemId to cloneId
                            if (config.debug) {
                                logger.info(`[${this.modShortName}] Cloned ${itemDB[item]._name}'s cloneID. (clone id ${itemId} )`);
                            }
                        }
                        else if (modBlackCore_items.hasOwnProperty(cloneId)) { // if item is clone of Blackcore another armor
                            while (modBlackCore_items.hasOwnProperty(cloneId)) { // change cloneId until it is BSG's default EFT gear's one.
                                cloneId = modBlackCore_items[cloneId].clone;
                                if (config.debug) {
                                    logger.info(`[${this.modShortName}] Cloned ${itemDB[item]._name}'s cloneID. (clone id ${itemId} )`);
                                }
                            }
                            itemId = cloneId; // change itemId to cloneId
                        }
                    }
                }
                // Protection Type Option
                if (config.isFrontPlateProtectSideTorso) {
                    config.upperTorsoFrontProtectionArea = config.upperTorsoFrontProtectionArea.concat(config.leftSideTorsoProtectionArea, config.rightSideTorsoProtectionArea);
                    config.lowerTorsoFrontProtectionArea = config.lowerTorsoFrontProtectionArea.concat(config.leftSideTorsoProtectionArea, config.rightSideTorsoProtectionArea);
                    config.entireTorsoFrontProtectionArea = config.entireTorsoFrontProtectionArea.concat(config.leftSideTorsoProtectionArea, config.rightSideTorsoProtectionArea);
                    config.armorPlateProtectableArea = config.armorPlateProtectableArea.concat(config.sideArmorPlateProtectableArea);
                    config.frontArmorPlateProtectableArea = config.frontArmorPlateProtectableArea.concat(config.sideArmorPlateProtectableArea);
                }
                if (config.upperTorso.includes(itemId)) { // if item is in upperTorso table
                    if (config.debug) {
                        logger.info(`[${this.modShortName}] adjusting item ${itemDB[item]._name} (id ${itemId} ) to match config values (upper)`);
                    }
                    itemDB[item]._props.Slots[0]._props.filters[0].armorColliders = config.upperTorsoFrontProtectionArea; // set front plate armor collider
                    itemDB[item]._props.Slots[1]._props.filters[0].armorColliders = config.upperTorsoBackProtectionArea; // set back plate armor collider
                    itemDB[item]._props.Slots[0]._props.filters[0].armorPlateColliders = [];
                    itemDB[item]._props.Slots[1]._props.filters[0].armorPlateColliders = [];
                }
                else if (config.lowerTorso.includes(itemId)) { // if item is in lowerTorso table
                    if (config.debug) {
                        logger.info(`[${this.modShortName}] adjusting item ${itemDB[item]._name} (id ${itemId} ) to match config values (lower)`);
                    }
                    itemDB[item]._props.Slots[0]._props.filters[0].armorColliders = config.lowerTorsoFrontProtectionArea; // set front plate armor collider
                    itemDB[item]._props.Slots[1]._props.filters[0].armorColliders = config.lowerTorsoBackProtectionArea; // set back plate armor collider
                    itemDB[item]._props.Slots[0]._props.filters[0].armorPlateColliders = [];
                    itemDB[item]._props.Slots[1]._props.filters[0].armorPlateColliders = [];
                }
                else if (config.entireTorso.includes(itemId)) { // if item is in entireTorso table
                    if (config.debug) {
                        logger.info(`[${this.modShortName}] adjusting item ${itemDB[item]._name} (id ${itemId} ) to match config values (entire)`);
                    }
                    itemDB[item]._props.Slots[0]._props.filters[0].armorColliders = config.entireTorsoFrontProtectionArea; // set front plate armor collider
                    itemDB[item]._props.Slots[1]._props.filters[0].armorColliders = config.entireTorsoBackProtectionArea; // set back plate armor collider
                    itemDB[item]._props.Slots[0]._props.filters[0].armorPlateColliders = [];
                    itemDB[item]._props.Slots[1]._props.filters[0].armorPlateColliders = [];
                }
                else if (config.armorPlates.includes(itemId)) { // if item is an armor plate
                    if (config.debug) {
                        logger.info(`[${this.modShortName}] adjusting item ${itemDB[item]._name} (id ${itemId} ) to match config values (plate)`);
                    }
                    itemDB[item]._props.armorColliders = config.armorPlateProtectableArea;
                    itemDB[item]._props.armorPlateColliders = [];
                }
                else if (config.frontArmorPlates.includes(itemId)) { // if item is an front armor plate
                    if (config.debug) {
                        logger.info(`[${this.modShortName}] adjusting item ${itemDB[item]._name} (id ${itemId} ) to match config values (front plate)`);
                    }
                    itemDB[item]._props.armorColliders = config.frontArmorPlateProtectableArea;
                    itemDB[item]._props.armorPlateColliders = [];
                }
                else if (config.backArmorPlates.includes(itemId)) { // if item is an back armor plate
                    if (config.debug) {
                        logger.info(`[${this.modShortName}] adjusting item ${itemDB[item]._name} (id ${itemId} ) to match config values (back plate)`);
                    }
                    itemDB[item]._props.armorColliders = config.backArmorPlateProtectableArea;
                    itemDB[item]._props.armorPlateColliders = [];
                }
                if (!config.isFrontPlateProtectSideTorso) { // can use side plates
                    if (config.sideTorso.includes(itemId)) {
                        if (config.debug) {
                            logger.info(`[${this.modShortName}] adjusting item ${itemDB[item]._name} (id ${itemId} ) to match config values (side)`);
                        }
                        itemDB[item]._props.Slots[2]._props.filters[0].armorColliders = config.leftSideTorsoProtectionArea; // set left side plate armor collider
                        itemDB[item]._props.Slots[3]._props.filters[0].armorColliders = config.rightSideTorsoProtectionArea; // set right side plate armor collider
                        itemDB[item]._props.Slots[2]._props.filters[0].armorPlateColliders = [];
                        itemDB[item]._props.Slots[3]._props.filters[0].armorPlateColliders = [];
                    }
                    else if (config.sideArmorPlates.includes(itemId)) {
                        if (config.debug) {
                            logger.info(`[${this.modShortName}] adjusting item ${itemDB[item]._name} (id ${itemId} ) to match config values (side plate)`);
                        }
                        itemDB[item]._props.armorColliders = config.sideArmorPlateProtectableArea;
                        itemDB[item]._props.armorPlateColliders = [];
                    }
                }
            }
        }
        logger.info(`[${this.modShortName}] ${this.mod} Loaded`);
    }
}
module.exports = { mod: new MAPE() };
//# sourceMappingURL=mod.js.map