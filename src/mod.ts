import { DependencyContainer } from "tsyringe";
import { Ilogger } from "@spt-aki/models/spt/utils/Ilogger";
import { IPostDBLoadMod } from "@spt-aki/models/external/IPostDBLoadMod";
import { DatabaseServer } from "@spt-aki/servers/DatabaseServer";

import { VFS } from "@spt-aki/utils/VFS";
import { jsonc } from "jsonc";
import path from "path";

class MAPE implements IPostDBLoadMod
{
	public mod: string;
    public modShortName: string;

	constructor() {
        this.mod = "Make Armor Plate Effective";
        this.modShortName = "MAPE";
	}

	public postDBLoad(container: DependencyContainer): void 
	{
		const logger = container.resolve<Ilogger>("WinstonLogger");
		const db = container.resolve<DatabaseServer>("DatabaseServer");
		const tables = db.getTables();    
		const itemDB = tables.templates.items;

		const vfs = container.resolve<VFS>("VFS");
		const config = jsonc.parse(vfs.readFile(path.resolve(__dirname, "../config/config.jsonc")));

		let defaultArmorGears = [];
		defaultArmorGears = defaultArmorGears.concat(config.upperTorso, config.lowerTorso, config.entireTorso); // All BSG's default EFT gears
		
		for (let item in itemDB) {
			if (itemDB[item]._type !== "Node") {
				let itemId = itemDB[item]._id
				
				if (config.mod_TGC) { // For MoxoPixel-TacticalGearComponent
					const modTGC_items = JSON.parse(vfs.readFile(path.resolve(__dirname, "../../MoxoPixel-TacticalGearComponent/database/modTGC_items.json"))); // is it working?

					if (modTGC_items.hasOwnProperty(itemId)) {
						let cloneId = modTGC_items[itemId].clone;

						if (defaultArmorGears.includes(cloneId)) { // check item is armor vest or body armor
							itemId = cloneId; // change itemId to cloneId

							if (config.debug) {
								logger.info(`[${this.modShortName}] Cloned ${itemDB[item]._name}'s cloneID. (clone id ${itemId} )`);
							}			
						}
					}		
				}

				if (config.upperTorso.includes(itemId)) {	// if item is in upperTorso table
					if (config.debug) {
						logger.info(`[${this.modShortName}] adjusting item ${itemDB[item]._name} (id ${itemId} ) to match config values (front)`);
					}
					itemDB[item]._props.Slots[0]._props.filters[0].armorColliders = config.upperTorsoFrontProtectionArea; // set front plate armor collider
					itemDB[item]._props.Slots[1]._props.filters[0].armorColliders = config.upperTorsoBackProtectionArea; // set back plate armor collider
					itemDB[item]._props.Slots[0]._props.filters[0].armorPlateColliders = [];
					itemDB[item]._props.Slots[1]._props.filters[0].armorPlateColliders = [];
					
				}
				else if (config.lowerTorso.includes(itemId)) { // if item is in lowerTorso table
					if (config.debug) {
						logger.info(`[${this.modShortName}] adjusting item ${itemDB[item]._name} (id ${itemId} ) to match config values (back)`);
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







			}
		}
		logger.info(`[${this.modShortName}] ${this.mod} Loaded`);
	}
}

module.exports = { mod: new MAPE() }