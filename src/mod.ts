import { DependencyContainer } from "tsyringe";
import { Ilogger } from "@spt/models/spt/utils/Ilogger";
import { IPostDBLoadMod } from "@spt/models/external/IPostDBLoadMod";
import { DatabaseServer } from "@spt/servers/DatabaseServer";
import { PreSptModLoader } from "@spt/loaders/PreSptModLoader";
import { IPostSptLoadMod } from "@spt/models/external/IPostSptLoadMod";

import { VFS } from "@spt/utils/VFS";
import { jsonc } from "jsonc";
import path from "path";

class MAPE implements IPostDBLoadMod, IPostSptLoadMod, PreSptModLoader
{
	public mod: string;
    public modShortName: string;

	constructor() {
        this.mod = "Make Armor Plate Effective";
        this.modShortName = "MAPE";
	}

	// Set soft insert slot protection area
	public SetSoftSlotProtectArea(itemDB: any, item: any, config: any, frontArea: any, backArea: any, logger: any) {
		let slots = itemDB[item]._props.Slots;

		for (let slotIdx = 0; slotIdx < slots.length; slotIdx++){
			let slotName = slots[slotIdx]._name;
			
			if (config.debug) {
				logger.info(`[${this.modShortName}] idx: ${slotIdx}, slotName: ${slotName}`);
			}	

			if (slotName.includes("Soft_armor") || slotName.includes("soft_armor")) { // because of BSG's shitty lowercase typo
				if (slotName.includes("front")) {
					slots[slotIdx]._props.filters[0].armorColliders = frontArea; // set front soft armor collider
				}
				else if (slotName.includes("back")) {
					slots[slotIdx]._props.filters[0].armorColliders = backArea; // set back soft armor collider
				}
			}
		}
	}

	// Set plate slot protection area
	public SetPlateSlotProtectArea(itemDB: any, item: any, frontArea: any, backArea: any) {
		itemDB[item]._props.Slots[0]._props.filters[0].armorColliders = frontArea; // set front plate armor collider
		itemDB[item]._props.Slots[1]._props.filters[0].armorColliders = backArea; // set back plate armor collider
		itemDB[item]._props.Slots[0]._props.filters[0].armorPlateColliders = [];
		itemDB[item]._props.Slots[1]._props.filters[0].armorPlateColliders = [];
	}

	// Set armor plate's protection area
	public SetPlateProtectArea(itemDB: any, item: any, protectArea: any) {
		itemDB[item]._props.armorColliders = protectArea;
		itemDB[item]._props.armorPlateColliders = [];
	}

	public postDBLoad(container: DependencyContainer): void 
	{
		const logger = container.resolve<Ilogger>("WinstonLogger");
		const db = container.resolve<DatabaseServer>("DatabaseServer");
		const tables = db.getTables();    
		const itemDB = tables.templates.items;

		const vfs = container.resolve<VFS>("VFS");
		const config = jsonc.parse(vfs.readFile(path.resolve(__dirname, "../config/config.jsonc")));

		// Check Compatibility
		const preSptModLoader = container.resolve<PreSptModLoader>("PreSptModLoader");
		if (!config.mod_TGC && preSptModLoader.getImportedModsNames().includes("MoxoPixel-TacticalGearComponent"))
		{
			logger.info(`[${this.modShortName}] Tactical Gear Component is detected.`);
			config.mod_TGC = true;
		}
		if (!config.mod_ARTEM && preSptModLoader.getImportedModsNames().includes("AAArtemEquipment"))
		{
			logger.info(`[${this.modShortName}] Artem Equipment is detected.`);
			config.mod_ARTEM = true;
		}
		if (!config.mod_BLACKCORE && preSptModLoader.getImportedModsNames().includes("MoxoPixel-BlackCore"))
		{
			logger.info(`[${this.modShortName}] Blackcore is detected.`);
			config.mod_BLACKCORE = true;
		}

		let defaultArmorGears = [];
		defaultArmorGears = defaultArmorGears.concat(config.upperTorso, config.lowerTorso, config.entireTorso); // All BSG's default EFT gears

		// Mod Compatibility 
		if (config.mod_ARTEM) { // For Artem Equipment mod
			const artemConfig = jsonc.parse(vfs.readFile(path.resolve(__dirname, "../config/artem.jsonc")));

			config.upperTorso = config.upperTorso.concat(artemConfig.upperTorso);
			config.lowerTorso = config.lowerTorso.concat(artemConfig.lowerTorso);
			config.entireTorso = config.entireTorso.concat(artemConfig.entireTorso);

			if (config.debug) {
				logger.info(`[${this.modShortName}] Artem equipments loaded.`);
			}
		}
		
		for (let item in itemDB) {
			if (itemDB[item]._type !== "Node") {
				let itemId = itemDB[item]._id
				
				// Mod Compatibility
				if (config.mod_TGC) { // For MoxoPixel-TacticalGearComponent
					const modTGC_items = JSON.parse(vfs.readFile(path.resolve(__dirname, "../../MoxoPixel-TacticalGearComponent/database/modTGC_items.json")));

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
					const modBlackCore_items = JSON.parse(vfs.readFile(path.resolve(__dirname, "../../MoxoPixel-BlackCore/database/items.json"))); // is it working?

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

				// ------------- Slot Setting -------------
				if (config.upperTorso.includes(itemId)) {	// if item is in upperTorso table
					if (config.debug) {
						logger.info(`[${this.modShortName}] adjusting item ${itemDB[item]._name} (id ${itemId} ) (upper)`);
					}
					this.SetSoftSlotProtectArea(itemDB, item, config, config.upperTorsoFrontProtectionArea, config.upperTorsoBackProtectionArea, logger);
					this.SetPlateSlotProtectArea(itemDB, item, config.upperTorsoFrontProtectionArea, config.upperTorsoBackProtectionArea)				
				}
				else if (config.lowerTorso.includes(itemId)) { // if item is in lowerTorso table
					if (config.debug) {
						logger.info(`[${this.modShortName}] adjusting item ${itemDB[item]._name} (id ${itemId} ) (lower)`);
					}		
					this.SetSoftSlotProtectArea(itemDB, item, config,  config.lowerTorsoFrontProtectionArea, config.lowerTorsoBackProtectionArea, logger);		
					this.SetPlateSlotProtectArea(itemDB, item, config.lowerTorsoFrontProtectionArea, config.lowerTorsoBackProtectionArea)			
				}
				else if (config.entireTorso.includes(itemId)) { // if item is in entireTorso table
					if (config.debug) {
						logger.info(`[${this.modShortName}] adjusting item ${itemDB[item]._name} (id ${itemId} ) (entire)`);
					}
					this.SetSoftSlotProtectArea(itemDB, item, config, config.entireTorsoFrontProtectionArea, config.entireTorsoBackProtectionArea, logger);
					this.SetPlateSlotProtectArea(itemDB, item, config.entireTorsoFrontProtectionArea, config.entireTorsoBackProtectionArea)
				}

				if (config.softArmorTorso.includes(itemId)) {
					if (config.debug) {
						logger.info(`[${this.modShortName}] adjusting item ${itemDB[item]._name} (id ${itemId} ) (soft torso)`);
					}
					this.SetSoftSlotProtectArea(itemDB, item, config,  config.lowerTorsoFrontProtectionArea, config.lowerTorsoBackProtectionArea, logger);
				}


				// ------------- Slot Setting -------------

				// ------------- Insert, Plate Setting -------------
				// Soft Armor Insert Protectable Area Setting
				let itemName = itemDB[item]._name;
				if (itemName.includes("Soft_armor") || itemName.includes("soft_armor")) { // for soft armor inserts
					if (itemName.includes("front")) {
						if (config.debug) {
							logger.info(`[${this.modShortName}] adjusting soft insert ${itemDB[item]._name} (id ${itemId} )`);
						}
						itemDB[item]._props.armorColliders = config.frontArmorPlateProtectableArea;
					}
					else if (itemName.includes("back")) {
						if (config.debug) {
							logger.info(`[${this.modShortName}] adjusting soft insert ${itemDB[item]._name} (id ${itemId} )`);
						}
						itemDB[item]._props.armorColliders = config.backArmorPlateProtectableArea;
					}
				}

				// Armor Plate Protectable Area Setting
				if (config.armorPlates.includes(itemId)) { // if item is an armor plate
					if (config.debug) {
						logger.info(`[${this.modShortName}] adjusting item ${itemDB[item]._name} (id ${itemId} ) (plate)`);
					}
					this.SetPlateProtectArea(itemDB, item, config.armorPlateProtectableArea);
				}
				else if (config.frontArmorPlates.includes(itemId)) { // if item is an front armor plate
					if (config.debug) {
						logger.info(`[${this.modShortName}] adjusting item ${itemDB[item]._name} (id ${itemId} ) (front plate)`);
					}
					this.SetPlateProtectArea(itemDB, item, config.frontArmorPlateProtectableArea);
				}
				else if (config.backArmorPlates.includes(itemId)) { // if item is an back armor plate
					if (config.debug) {
						logger.info(`[${this.modShortName}] adjusting item ${itemDB[item]._name} (id ${itemId} ) (back plate)`);
					}
					this.SetPlateProtectArea(itemDB, item, config.backArmorPlateProtectableArea);
				}

				// Side Plate Setting
				if (!config.isFrontPlateProtectSideTorso) { // can use side plates
					if (config.sideTorso.includes(itemId)) {
						if (config.debug) {
							logger.info(`[${this.modShortName}] adjusting item ${itemDB[item]._name} (id ${itemId} ) (side)`);
						}
						itemDB[item]._props.Slots[2]._props.filters[0].armorColliders = config.leftSideTorsoProtectionArea; // set left side plate armor collider
						itemDB[item]._props.Slots[3]._props.filters[0].armorColliders = config.rightSideTorsoProtectionArea; // set right side plate armor collider
						itemDB[item]._props.Slots[2]._props.filters[0].armorPlateColliders = [];
						itemDB[item]._props.Slots[3]._props.filters[0].armorPlateColliders = [];
					}
					else if (config.sideArmorPlates.includes(itemId)) {
						if (config.debug) {
							logger.info(`[${this.modShortName}] adjusting item ${itemDB[item]._name} (id ${itemId} ) (side plate)`);
						}
						itemDB[item]._props.armorColliders = config.sideArmorPlateProtectableArea;
						itemDB[item]._props.armorPlateColliders = [];
					}
				}
				// ------------- Insert, Plate Setting -------------
			}
		}
		logger.info(`[${this.modShortName}] ${this.mod} Loaded`);
	}
}

module.exports = { mod: new MAPE() }