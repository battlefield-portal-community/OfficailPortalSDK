// === BumperCars.ts ===
const VERSION = [0, 4, 41];







export async function OnGameModeStarted() {
    console.log("HoH Bumber Cars Game Mode Started");
    HoH_GameHandler.HoH_OnGameModeStarted()
    mod.SetSpawnMode(mod.SpawnModes.AutoSpawn)

    if (HoH_GameHandler.debug == false) {
        mod.EnableInteractPoint(mod.GetInteractPoint(2), false)
    }

    
    mod.EnableInteractPoint(mod.GetInteractPoint(1), false)
    
}


export function OnPlayerJoinGame(eventPlayer: mod.Player) {
    PlayerProfile.get(eventPlayer)

}

export function OnPlayerDeployed(eventPlayer: mod.Player) {
    mod.RemoveEquipment(eventPlayer, mod.InventorySlots.MeleeWeapon)
    mod.RemoveEquipment(eventPlayer, mod.InventorySlots.PrimaryWeapon)
    mod.RemoveEquipment(eventPlayer, mod.InventorySlots.SecondaryWeapon)
    mod.EnableInputRestriction(eventPlayer, mod.RestrictedInputs.FireWeapon, true)
    HoH_GameHandler.HoH_OnPlayerDeployed(eventPlayer)
}

export function OnPlayerDied(eventPlayer: mod.Player, eventOtherPlayer: mod.Player, eventDeathType: mod.DeathType, eventWeaponUnlock: mod.WeaponUnlock) {
    HoH_GameHandler.HoH_OnPlayerDied(eventPlayer, eventOtherPlayer, eventDeathType, eventWeaponUnlock)
}

export function OnVehicleSpawned(eventVehicle: mod.Vehicle) {
    HoH_GameHandler.AddVehicles(eventVehicle)
}

export function OnPlayerLeaveGame(eventNumber: number) {
    HoH_GameHandler.RemovePlayerFromGame(eventNumber)
    PlayerProfile.removeInvalidPlayers()

}

export function OnPlayerInteract(eventPlayer: mod.Player, eventInteractPoint: mod.InteractPoint) {

    if (mod.GetObjId(eventInteractPoint) == 1 && HoH_GameHandler.gameState == GameState.GameStartCountdown) {

        const playerProf = PlayerProfile.get(eventPlayer)
        playerProf?.ReadyUp()
    }

    if (HoH_GameHandler.debug && mod.GetObjId(eventInteractPoint) == 2) {
        HoH_Debugger.SpawnAIEnemy()
    }

    if (mod.GetObjId(eventInteractPoint) == 5) {
        HoH_GameHandler.ActivateLooserPlatform(eventPlayer)
    }

}


// === HoH_Debug.ts ===







class HoH_Debugger {

    static count = 10;

    static SpawnAIEnemy() {
        mod.SpawnAIFromAISpawner(mod.GetSpawner(1))
    }

    static addAIToPlayer(player: mod.Player) {
        PlayerProfile.get(player)
    }

    static CreateVersionUI(playerprofile: PlayerProfile): mod.UIWidget {
        const coolahhuiname: string = "debug_version_nb" + playerprofile.playerID;
        mod.AddUIText(coolahhuiname, mod.CreateVector(0, 0, 0), mod.CreateVector(200, 25, 0), mod.UIAnchor.BottomRight, HoH_Helpers.MakeMessage(mod.stringkeys.modversion, VERSION[0], VERSION[1], VERSION[2]), playerprofile.player);
        let widget = mod.FindUIWidgetWithName(coolahhuiname) as mod.UIWidget;
        mod.SetUITextSize(widget, 20);
        mod.SetUITextAnchor(widget, mod.UIAnchor.Center);
        mod.SetUIWidgetBgColor(widget, mod.CreateVector(1, 1, 1));
        mod.SetUITextColor(widget, mod.CreateVector(1, 1, 1));
        mod.SetUIWidgetBgFill(widget, mod.UIBgFill.Blur);
        mod.SetUIWidgetBgAlpha(widget, 1);
        mod.SetUIWidgetDepth(widget, mod.UIDepth.AboveGameUI);
        mod.SetUIWidgetVisible(widget, true);

        return widget;
    }



    static async SpawnVFXLoop() {

        const fxKeys = [
            mod.RuntimeSpawn_Aftermath.FX_GenDest_Rubble_Pile_Stone_L_GS,
            mod.RuntimeSpawn_Aftermath.FX_MacroDest_EUU_Building_Ruin_FallingDustRubble_01_Cont,
            mod.RuntimeSpawn_Common.FX_Airburst_Incendiary_Detonation,
            mod.RuntimeSpawn_Common.FX_Airburst_Incendiary_Detonation_Friendly,
            mod.RuntimeSpawn_Common.FX_Airplane_Jetwash_Dirt,
            mod.RuntimeSpawn_Common.FX_Airplane_Jetwash_Grass,
            mod.RuntimeSpawn_Common.FX_Airplane_Jetwash_Sand,
            mod.RuntimeSpawn_Common.FX_Airplane_Jetwash_Snow,
            mod.RuntimeSpawn_Common.FX_Airplane_Jetwash_Water,
            mod.RuntimeSpawn_Common.fx_ambwar_artillarystrike,
            mod.RuntimeSpawn_Common.FX_AmbWar_UAV_Circling,
            mod.RuntimeSpawn_Common.FX_ArtilleryStrike_Explosion_01,
            mod.RuntimeSpawn_Common.FX_ArtilleryStrike_Explosion_GS,
            mod.RuntimeSpawn_Common.FX_ArtilleryStrike_Explosion_GS_SP_Beach,
            mod.RuntimeSpawn_Common.FX_Autocannon_30mm_AP_Hit_GS,
            mod.RuntimeSpawn_Common.FX_Autocannon_30mm_AP_Hit_Metal_GS,
            mod.RuntimeSpawn_Common.FX_AW_Distant_Cluster_Bomb_Line_Outskirts,
            mod.RuntimeSpawn_Common.FX_BASE_Birds_Black_Circulating,
            mod.RuntimeSpawn_Common.FX_BASE_DeployClouds_Var_A,
            mod.RuntimeSpawn_Common.FX_BASE_DeployClouds_Var_B,
            mod.RuntimeSpawn_Common.FX_BASE_Dust_Large_Area,
            mod.RuntimeSpawn_Common.FX_BASE_Fire_L,
            mod.RuntimeSpawn_Common.FX_BASE_Fire_M,
            mod.RuntimeSpawn_Common.FX_BASE_Fire_M_NoSmoke,
            mod.RuntimeSpawn_Common.FX_BASE_Fire_Oil_Medium,
            mod.RuntimeSpawn_Common.FX_BASE_Fire_S,
            mod.RuntimeSpawn_Common.FX_BASE_Fire_S_NoSmoke,
            mod.RuntimeSpawn_Common.FX_BASE_Fire_XL,
            mod.RuntimeSpawn_Common.FX_BASE_Flies_Small,
            mod.RuntimeSpawn_Common.FX_BASE_Seagull_Flock,
            mod.RuntimeSpawn_Common.FX_BASE_Smoke_Column_XXL,
            mod.RuntimeSpawn_Common.FX_BASE_Smoke_Dark_M,
            mod.RuntimeSpawn_Common.FX_BASE_Smoke_Pillar_Black_L,
            mod.RuntimeSpawn_Common.FX_BASE_Smoke_Pillar_Black_L_Dist,
            mod.RuntimeSpawn_Common.FX_BASE_Smoke_Pillar_White_L,
            mod.RuntimeSpawn_Common.FX_BASE_Smoke_Soft_S_GS,
            mod.RuntimeSpawn_Common.FX_BASE_Sparks_Pulse_L,
            mod.RuntimeSpawn_Common.FX_BD_Huge_Horizon_Exp,
            mod.RuntimeSpawn_Common.FX_BD_Med_Horizon_Exp,
            mod.RuntimeSpawn_Common.FX_BD_Med_Horizon_Exp_Multi,
            mod.RuntimeSpawn_Common.FX_Blackhawk_Rotor_HaloGlow,
            mod.RuntimeSpawn_Common.FX_Blackhawk_Rotor_Vortex_Vapor,
            mod.RuntimeSpawn_Common.FX_BlackLocust_Tree_Branch_L_GS,
            mod.RuntimeSpawn_Common.FX_Bomb_Mk82_AIR_Detonation,
            mod.RuntimeSpawn_Common.FX_Bomb_Mk82_AIR_Trail_Ballute_AirStrike,
            mod.RuntimeSpawn_Common.FX_BreachingDart_Breach_Detonation,
            mod.RuntimeSpawn_Common.FX_BreachingDart_Generic_BreachthroughSmoke,
            mod.RuntimeSpawn_Common.FX_BreachingDart_NoBreach_Detonation,
            mod.RuntimeSpawn_Common.FX_Building_FallingDustSand,
            mod.RuntimeSpawn_Common.FX_Bullet_L_Vegetation_DeadLeaves_PropDest,
            mod.RuntimeSpawn_Common.FX_CAP_AmbWar_Rocket_Strike,
            mod.RuntimeSpawn_Common.FX_Car_Fire_M_GS,
            mod.RuntimeSpawn_Common.FX_CarFire_Bumper_01,
            mod.RuntimeSpawn_Common.FX_CarFire_FrameCrawl,
            mod.RuntimeSpawn_Common.FX_CarlGustaf_MK4_Impact,
            mod.RuntimeSpawn_Common.FX_Carrier_Explosion_Dist,
            mod.RuntimeSpawn_Common.FX_Chaingun_30mm_HEDP_Hit,
            mod.RuntimeSpawn_Common.FX_CIN_MF_Large_Static_Fire,
            mod.RuntimeSpawn_Common.FX_CIN_MF_Large_Static_VortexFire,
            mod.RuntimeSpawn_Common.FX_CIN_MF_Medium_Static_Fire,
            mod.RuntimeSpawn_Common.FX_CIN_MF_Medium_Static_Smoke,
            mod.RuntimeSpawn_Common.FX_CIN_MF_Small_Static_Fire,
            mod.RuntimeSpawn_Common.FX_CIN_MF_Small_Static_Smoke,
            mod.RuntimeSpawn_Common.FX_CivCar_SUV_Explosion,
            mod.RuntimeSpawn_Common.FX_CivCar_Tire_fire_S_GS,
            mod.RuntimeSpawn_Common.FX_Decoy_Destruction,
            mod.RuntimeSpawn_Common.FX_Defib_Shock_Heal_Full,
            mod.RuntimeSpawn_Common.FX_Defib_Shock_Heal_Half,
            mod.RuntimeSpawn_Common.FX_Defib_Shock_Hurt_Full,
            mod.RuntimeSpawn_Common.FX_Defib_Shock_Hurt_Half,
            mod.RuntimeSpawn_Common.FX_DeployableCover_Deploy_Dirt,
            mod.RuntimeSpawn_Common.FX_DeployableCover_Destruction,
            mod.RuntimeSpawn_Common.FX_EODBot_Active_Enemy,
            mod.RuntimeSpawn_Common.FX_EODBot_Active_Friendly,
            mod.RuntimeSpawn_Common.FX_EODBot_RepairTool_Torch_1P,
            mod.RuntimeSpawn_Common.FX_EODBot_RepairTool_Torch_3P,
            mod.RuntimeSpawn_Common.FX_Gadget_AdrenalineShot,
            mod.RuntimeSpawn_Common.FX_Gadget_AirburstLauncher_Detonation,
            mod.RuntimeSpawn_Common.FX_Gadget_AirburstLauncher_Predicted_Line,
            mod.RuntimeSpawn_Common.FX_Gadget_AirburstLauncher_Predicted_Point,
            mod.RuntimeSpawn_Common.FX_Gadget_AirburstLauncher_Predicted_Point_GroundConnect,
            mod.RuntimeSpawn_Common.FX_Gadget_AmmoCrate_Area,
            mod.RuntimeSpawn_Common.FX_Gadget_AT_Mine_Detonation,
            mod.RuntimeSpawn_Common.FX_Gadget_AT4_Launch_1P,
            mod.RuntimeSpawn_Common.FX_Gadget_AT4_Launch_3P,
            mod.RuntimeSpawn_Common.FX_Gadget_AT4_Projectile_Trail,
            mod.RuntimeSpawn_Common.FX_Gadget_Binoculars_ScopeGlint,
            mod.RuntimeSpawn_Common.FX_Gadget_C4_Explosives_Detonation,
            mod.RuntimeSpawn_Common.FX_Gadget_C4_Explosives_Detonation_Underwater,
            mod.RuntimeSpawn_Common.FX_Gadget_Defib_LED,
            mod.RuntimeSpawn_Common.FX_Gadget_Defib_Recharge_LED,
            mod.RuntimeSpawn_Common.FX_Gadget_DeployableMortar_Destruction,
            mod.RuntimeSpawn_Common.FX_Gadget_DeployableMortar_Detonation,
            mod.RuntimeSpawn_Common.FX_Gadget_DeployableMortar_Detonation_Underwater,
            mod.RuntimeSpawn_Common.FX_Gadget_DeployableMortar_FireEffect_1P,
            mod.RuntimeSpawn_Common.FX_Gadget_DeployableMortar_FireEffect_3P,
            mod.RuntimeSpawn_Common.FX_Gadget_DeployableMortar_Projectile_Trail,
            mod.RuntimeSpawn_Common.FX_Gadget_DeployableMortar_Target_Area,
            mod.RuntimeSpawn_Common.FX_Gadget_Drone_Destruction,
            mod.RuntimeSpawn_Common.FX_Gadget_Drone_NavLights,
            mod.RuntimeSpawn_Common.FX_Gadget_Drone_OutOfRange_Distortion,
            mod.RuntimeSpawn_Common.FX_Gadget_Drone_ThermalVE,
            mod.RuntimeSpawn_Common.FX_Gadget_EIDOS_Active,
            mod.RuntimeSpawn_Common.FX_Gadget_EIDOS_Destruction,
            mod.RuntimeSpawn_Common.FX_Gadget_EIDOS_Intercept_Detonation,
            mod.RuntimeSpawn_Common.FX_Gadget_EIDOS_Lights_Active,
            mod.RuntimeSpawn_Common.FX_Gadget_EIDOS_Lights_Standby,
            mod.RuntimeSpawn_Common.FX_Gadget_EIDOS_Projectile_Launch,
            mod.RuntimeSpawn_Common.FX_Gadget_EIDOS_Standby,
            mod.RuntimeSpawn_Common.FX_Gadget_EODBot_Clusterbomb_Separation,
            mod.RuntimeSpawn_Common.FX_Gadget_EODBot_ClusterFragmentCharge_Detonation,
            mod.RuntimeSpawn_Common.FX_Gadget_EODBot_Destruction,
            mod.RuntimeSpawn_Common.FX_Gadget_EODBot_ObjectiveInteraction,
            mod.RuntimeSpawn_Common.FX_Gadget_Generic_Destruction,
            mod.RuntimeSpawn_Common.FX_Gadget_Generic_Destruction_Electronic,
            mod.RuntimeSpawn_Common.FX_Gadget_Generic_Tripod_Destruction,
            mod.RuntimeSpawn_Common.FX_Gadget_IGLA_Launch_1P,
            mod.RuntimeSpawn_Common.FX_Gadget_IGLA_Launch_3P,
            mod.RuntimeSpawn_Common.FX_Gadget_InterativeSpectator_Camera_Light_Green,
            mod.RuntimeSpawn_Common.FX_Gadget_InterativeSpectator_Camera_Light_Red,
            mod.RuntimeSpawn_Common.FX_Gadget_InterativeSpectator_Camera_Light_Yellow,
            mod.RuntimeSpawn_Common.FX_Gadget_IntSpec_Drone_Damage_Heavy,
            mod.RuntimeSpawn_Common.FX_Gadget_IntSpec_Drone_Damage_Light,
            mod.RuntimeSpawn_Common.FX_Gadget_Javelin_Launch_1P,
            mod.RuntimeSpawn_Common.FX_Gadget_Javelin_Launch_3P,
            mod.RuntimeSpawn_Common.FX_Gadget_M320_Reload_ShellCasing,
            mod.RuntimeSpawn_Common.FX_Gadget_M320_Reload_Smoke,
            mod.RuntimeSpawn_Common.FX_Gadget_M4_SLAM_Detonation,
            mod.RuntimeSpawn_Common.FX_Gadget_MBTLAW_Launch_1P,
            mod.RuntimeSpawn_Common.FX_Gadget_MBTLAW_Launch_3P,
            mod.RuntimeSpawn_Common.FX_Gadget_Mine_AT_Warning_Light,
            mod.RuntimeSpawn_Common.FX_Gadget_MobileRespawn_Damaged,
            mod.RuntimeSpawn_Common.FX_Gadget_MPAPS_Active,
            mod.RuntimeSpawn_Common.FX_Gadget_MPAPS_Destruction,
            mod.RuntimeSpawn_Common.FX_Gadget_MPAPS_Intercept_Detonation,
            mod.RuntimeSpawn_Common.FX_Gadget_MPAPS_Lights_Active,
            mod.RuntimeSpawn_Common.FX_Gadget_MPAPS_Lights_Standby,
            mod.RuntimeSpawn_Common.FX_Gadget_MPAPS_Projectile_Launch,
            mod.RuntimeSpawn_Common.FX_Gadget_MPAPS_Standby,
            mod.RuntimeSpawn_Common.FX_Gadget_PTKM_EFP_Hit,
            mod.RuntimeSpawn_Common.FX_Gadget_PTKM_EFP_Trail,
            mod.RuntimeSpawn_Common.FX_Gadget_PTKM_Mine_Launch,
            mod.RuntimeSpawn_Common.FX_Gadget_PTKM_Submunition_Detonation,
            mod.RuntimeSpawn_Common.FX_Gadget_PTKM_Submunition_Trail,
            mod.RuntimeSpawn_Common.FX_Gadget_ReconDrone_EMP_Hit,
            mod.RuntimeSpawn_Common.FX_Gadget_ReconDrone_EMP_Weapon_Fire,
            mod.RuntimeSpawn_Common.FX_Gadget_ReconDrone_Light,
            mod.RuntimeSpawn_Common.FX_Gadget_ReconDrone_OutOfRange_Distortion,
            mod.RuntimeSpawn_Common.FX_Gadget_RemoteTurret_Box_Damage,
            mod.RuntimeSpawn_Common.FX_Gadget_RemoteTurret_Box_Damage_Top,
            mod.RuntimeSpawn_Common.FX_Gadget_RemoteTurret_Box_WreckState,
            mod.RuntimeSpawn_Common.FX_Gadget_RemoteTurret_Damage_Light,
            mod.RuntimeSpawn_Common.FX_Gadget_RemoteTurret_ScreenEffect_Damage,
            mod.RuntimeSpawn_Common.FX_Gadget_RemoteTurret_Smoke_Open,
            mod.RuntimeSpawn_Common.FX_Gadget_RPG7V2_Launch_1P,
            mod.RuntimeSpawn_Common.FX_Gadget_RPG7V2_Launch_3P,
            mod.RuntimeSpawn_Common.FX_Gadget_Sabotage_01_StartSparks,
            mod.RuntimeSpawn_Common.FX_Gadget_Sabotage_02_SparkLoop,
            mod.RuntimeSpawn_Common.FX_Gadget_Sabotage_02_SparkLoop_SidePannel,
            mod.RuntimeSpawn_Common.FX_Gadget_Sabotage_03_Fizzle,
            mod.RuntimeSpawn_Common.FX_Gadget_ScreenEffect_Thermal_BHOT,
            mod.RuntimeSpawn_Common.FX_Gadget_ScreenEffect_Thermal_WHOT,
            mod.RuntimeSpawn_Common.FX_Gadget_SmokeBarrage_AirBurst_Det,
            mod.RuntimeSpawn_Common.FX_Gadget_SmokeBarrage_Cluster_Det,
            mod.RuntimeSpawn_Common.FX_Gadget_SmokeBarrage_Cluster_Light1,
            mod.RuntimeSpawn_Common.FX_Gadget_SmokeBarrage_Cluster_Trail,
            mod.RuntimeSpawn_Common.FX_Gadget_SmokeBarrage_Cluster_VE,
            mod.RuntimeSpawn_Common.FX_Gadget_SniperDecoy_Destruction,
            mod.RuntimeSpawn_Common.FX_Gadget_SniperDecoy_LensFlare,
            mod.RuntimeSpawn_Common.FX_Gadget_SpawnBeacon_Active,
            mod.RuntimeSpawn_Common.FX_Gadget_SpawnBeacon_Destruction,
            mod.RuntimeSpawn_Common.FX_Gadget_StickyGrenade_Detonation,
            mod.RuntimeSpawn_Common.FX_Gadget_Stinger_Launch_1P,
            mod.RuntimeSpawn_Common.FX_Gadget_Stinger_Launch_3P,
            mod.RuntimeSpawn_Common.FX_Gadget_SupplyCrate_Destruction,
            mod.RuntimeSpawn_Common.FX_Gadget_SupplyCrate_Range_Indicator,
            mod.RuntimeSpawn_Common.FX_Gadget_SupplyCrate_Range_Indicator_Upgraded,
            mod.RuntimeSpawn_Common.FX_Gadget_SupplyDrop_Destruction,
            mod.RuntimeSpawn_Common.FX_Gadget_Trophy_Range_Indicator,
            mod.RuntimeSpawn_Common.FX_Gadget_TUGS_Active,
            mod.RuntimeSpawn_Common.FX_Gadget_TUGS_Destruction,
            mod.RuntimeSpawn_Common.FX_Gadget_VehicleRessuplyCrate_Destruction,
            mod.RuntimeSpawn_Common.FX_Gadget_VehicleSupplyCrate_Range_Indicator,
            mod.RuntimeSpawn_Common.FX_Gadget_VehicleSupplyCrate_Range_Indicator_Upgraded,
            mod.RuntimeSpawn_Common.FX_Granite_Strike_Smoke_Marker_Green,
            mod.RuntimeSpawn_Common.FX_Granite_Strike_Smoke_Marker_Red,
            mod.RuntimeSpawn_Common.FX_Granite_Strike_Smoke_Marker_Violet,
            mod.RuntimeSpawn_Common.FX_Granite_Strike_Smoke_Marker_Yellow,
            mod.RuntimeSpawn_Common.FX_Grenade_40mm_AT_Detonation,
            mod.RuntimeSpawn_Common.FX_Grenade_40mm_HE_Detonation,
            mod.RuntimeSpawn_Common.FX_Grenade_40mm_HE_Detonation_Underwater,
            mod.RuntimeSpawn_Common.FX_Grenade_40mm_Thermobaric_Detonation,
            mod.RuntimeSpawn_Common.FX_Grenade_AntiTank_Detonation,
            mod.RuntimeSpawn_Common.FX_Grenade_AntiTank_Trail,
            mod.RuntimeSpawn_Common.FX_Grenade_BreachingDart_Stuck,
            mod.RuntimeSpawn_Common.FX_Grenade_BreachingDart_Trail_Flashbang,
            mod.RuntimeSpawn_Common.FX_Grenade_BreachingDartFlashbang_BurnIn_ScreenEffect,
            mod.RuntimeSpawn_Common.FX_Grenade_BreachingDartFlashbang_Detonation,
            mod.RuntimeSpawn_Common.FX_Grenade_Concussion_Detonation,
            mod.RuntimeSpawn_Common.FX_Grenade_Concussion_ScreenEffect,
            mod.RuntimeSpawn_Common.FX_Grenade_Flashbang_BurnIn_ScreenEffect,
            mod.RuntimeSpawn_Common.FX_Grenade_Flashbang_Detonation,
            mod.RuntimeSpawn_Common.FX_Grenade_Flashbang_ScreenEffect,
            mod.RuntimeSpawn_Common.FX_Grenade_Fragmentation_Detonation,
            mod.RuntimeSpawn_Common.FX_Grenade_Fragmentation_Detonation_Underwater,
            mod.RuntimeSpawn_Common.FX_Grenade_Fragmentation_ImpactGrenade_Detonation,
            mod.RuntimeSpawn_Common.FX_Grenade_Fragmentation_MiniV40_Detonation,
            mod.RuntimeSpawn_Common.FX_Grenade_Fragmentation_Trail,
            mod.RuntimeSpawn_Common.FX_Grenade_Incendiary_Detonation,
            mod.RuntimeSpawn_Common.FX_Grenade_Incendiary_Trail,
            mod.RuntimeSpawn_Common.FX_Grenade_M67_Fragmentation_Trail,
            mod.RuntimeSpawn_Common.FX_Grenade_M84_Flashbang_Trail,
            mod.RuntimeSpawn_Common.FX_Grenade_MK32A_Concussion_Trail,
            mod.RuntimeSpawn_Common.FX_Grenade_RGO_Impact_Trail,
            mod.RuntimeSpawn_Common.FX_Grenade_SignalSmoke,
            mod.RuntimeSpawn_Common.FX_Grenade_SignalSmoke_INV,
            mod.RuntimeSpawn_Common.FX_Grenade_Smoke_Detonation,
            mod.RuntimeSpawn_Common.FX_Grenade_Smoke_Detonation_Upgraded,
            mod.RuntimeSpawn_Common.FX_Grenade_Smoke_Disarmed,
            mod.RuntimeSpawn_Common.FX_Grenade_Smoke_Explosion_High_Wind,
            mod.RuntimeSpawn_Common.FX_Grenade_Smoke_Trail,
            mod.RuntimeSpawn_Common.FX_Grenadelauncher_SmokeGL_Smoke,
            mod.RuntimeSpawn_Common.FX_Impact_LoadoutCrate_Bricks,
            mod.RuntimeSpawn_Common.FX_Impact_LoadoutCrate_Dirt,
            mod.RuntimeSpawn_Common.FX_Impact_LoadoutCrate_Generic,
            mod.RuntimeSpawn_Common.FX_Impact_LoadoutCrate_Metal,
            mod.RuntimeSpawn_Common.FX_Impact_LoadoutCrate_Mud,
            mod.RuntimeSpawn_Common.FX_Impact_LoadoutCrate_Sand,
            mod.RuntimeSpawn_Common.FX_Impact_LoadoutCrate_Stone,
            mod.RuntimeSpawn_Common.FX_Impact_LoadoutCrate_Wood,
            mod.RuntimeSpawn_Common.FX_Impact_LootCrate_Dirt,
            mod.RuntimeSpawn_Common.FX_Impact_LootCrate_Generic,
            mod.RuntimeSpawn_Common.FX_Impact_SafeImpact_Brick,
            mod.RuntimeSpawn_Common.FX_Impact_SafeImpact_Dirt,
            mod.RuntimeSpawn_Common.FX_Impact_SafeImpact_Generic,
            mod.RuntimeSpawn_Common.FX_Impact_SafeImpact_Gravel,
            mod.RuntimeSpawn_Common.FX_Impact_SafeImpact_Metal,
            mod.RuntimeSpawn_Common.FX_Impact_SafeImpact_Mud,
            mod.RuntimeSpawn_Common.FX_Impact_SafeImpact_Sand,
            mod.RuntimeSpawn_Common.FX_Impact_SafeImpact_Water,
            mod.RuntimeSpawn_Common.FX_Impact_SafeImpact_Wood,
            mod.RuntimeSpawn_Common.FX_Impact_SupplyDrop_Brick,
            mod.RuntimeSpawn_Common.FX_Impact_SupplyDrop_Dirt,
            mod.RuntimeSpawn_Common.FX_Impact_SupplyDrop_Gravel,
            mod.RuntimeSpawn_Common.FX_Impact_Supplydrop_Metal,
            mod.RuntimeSpawn_Common.FX_Impact_SupplyDrop_Mud,
            mod.RuntimeSpawn_Common.FX_Impact_SupplyDrop_Sand,
            mod.RuntimeSpawn_Common.FX_Impact_SupplyDrop_Water,
            mod.RuntimeSpawn_Common.FX_Impact_SupplyDrop_Wood,
            mod.RuntimeSpawn_Common.FX_LoadoutCrate_AirSpawn,
            mod.RuntimeSpawn_Common.FX_LoadoutCrate_Drop_Trails,
            mod.RuntimeSpawn_Common.FX_MF_CarlGustaf_MK4_Launch,
            mod.RuntimeSpawn_Common.FX_MF_M320_1P,
            mod.RuntimeSpawn_Common.FX_MF_M320_3P,
            mod.RuntimeSpawn_Common.FX_MF_TRR8_1P,
            mod.RuntimeSpawn_Common.FX_MF_TRR8_3P,
            mod.RuntimeSpawn_Common.FX_Mine_M18_Claymore_Detonation,
            mod.RuntimeSpawn_Common.FX_Mine_M18_Claymore_Laser_Tripwire,
            mod.RuntimeSpawn_Common.FX_Missile_IGLA_Trail,
            mod.RuntimeSpawn_Common.FX_Missile_Javelin,
            mod.RuntimeSpawn_Common.FX_Missile_Javelin_Detonation,
            mod.RuntimeSpawn_Common.FX_Missile_Javelin_Detonation_Underwater,
            mod.RuntimeSpawn_Common.FX_Missile_Javelin_Launch_SmokeTrail,
            mod.RuntimeSpawn_Common.FX_Missile_MBTLAW_Hit,
            mod.RuntimeSpawn_Common.FX_Missile_MBTLAW_Hit_Critical,
            mod.RuntimeSpawn_Common.FX_Missile_MBTLAW_Hit_Glancing,
            mod.RuntimeSpawn_Common.FX_Missile_MBTLAW_Trail,
            mod.RuntimeSpawn_Common.FX_Missile_Stinger_Trail,
            mod.RuntimeSpawn_Common.FX_MortarStrike_Trail,
            mod.RuntimeSpawn_Common.FX_Panzerfaust_Projectile_Stabilizers,
            mod.RuntimeSpawn_Common.FX_ProjectileTrail_BreachingDart,
            mod.RuntimeSpawn_Common.FX_ProjectileTrail_M320_Incendiary,
            mod.RuntimeSpawn_Common.FX_ProjectileTrail_M320_Lethal,
            mod.RuntimeSpawn_Common.FX_ProjectileTrail_M320_NonLethal,
            mod.RuntimeSpawn_Common.FX_ProximityGrenade_Ping_Flash,
            mod.RuntimeSpawn_Common.FX_ProximityGrenade_Trail,
            mod.RuntimeSpawn_Common.FX_RepairTool_FullyHealed,
            mod.RuntimeSpawn_Common.FX_RepairTool_Overheat_1P,
            mod.RuntimeSpawn_Common.FX_RepairTool_Overheat_3P,
            mod.RuntimeSpawn_Common.FX_RepairTool_Sparks_1P,
            mod.RuntimeSpawn_Common.FX_RepairTool_Sparks_3P,
            mod.RuntimeSpawn_Common.FX_RepairTool_Sparks_Damage,
            mod.RuntimeSpawn_Common.FX_RepairTool_Torch_1P,
            mod.RuntimeSpawn_Common.FX_RepairTool_Torch_3P,
            mod.RuntimeSpawn_Common.FX_Rocket_ArmorPiercing_Hit_Metal,
            mod.RuntimeSpawn_Common.FX_Rocket_RPG7V2_Dud,
            mod.RuntimeSpawn_Common.FX_Rocket_RPG7V2_Hit,
            mod.RuntimeSpawn_Common.FX_Rocket_RPG7V2_Hit_Critical,
            mod.RuntimeSpawn_Common.FX_Rocket_RPG7V2_Hit_Glancing,
            mod.RuntimeSpawn_Common.FX_Rocket_RPG7V2_Trail,
            mod.RuntimeSpawn_Common.FX_Rocket_RPG7V2_Trail_SP,
            mod.RuntimeSpawn_Common.FX_ShellEjection_DP12_12g_Buckshot,
            mod.RuntimeSpawn_Common.FX_Smoke_Marker_Custom,
            mod.RuntimeSpawn_Common.FX_SoldierScreen_HealingStarted,
            mod.RuntimeSpawn_Common.FX_SP_Glint_Collectable,
            mod.RuntimeSpawn_Common.FX_Sparks,
            mod.RuntimeSpawn_Common.FX_SupplyVehicleStation_Range_Indicator,
            mod.RuntimeSpawn_Common.FX_ThrowingKnife_Trail,
            mod.RuntimeSpawn_Common.FX_ThrowingKnife_Trail_Friendly,
            mod.RuntimeSpawn_Common.FX_TracerDart_Projectile_Glow,
            mod.RuntimeSpawn_Common.FX_Vehicle_Car_Destruction_Death_Explosion_PTV,
            mod.RuntimeSpawn_Common.FX_Vehicle_CriticalState_PTV,
            mod.RuntimeSpawn_Common.FX_Vehicle_Damage_PTV_Critical,
            mod.RuntimeSpawn_Common.FX_Vehicle_Damage_PTV_Heavy,
            mod.RuntimeSpawn_Common.FX_Vehicle_Damage_PTV_Light,
            mod.RuntimeSpawn_Common.FX_Vehicle_InstSpec_Drone_Explosion,
            mod.RuntimeSpawn_Common.FX_Vehicle_PTV_WheelTracks_GroundDecal,
            mod.RuntimeSpawn_Common.FX_Vehicle_Sabotage_Sequence,
            mod.RuntimeSpawn_Common.FX_Vehicle_Wreck_PTV,
            mod.RuntimeSpawn_Common.FX_Vehicle_Wreck_PTV_Calm,
            mod.RuntimeSpawn_Common.FX_WireGuidedMissile_SpooledWire,
        ]


        // const combined = [...fxKeys, ...fxKeys2];

        let spawnedObj: mod.Object | mod.VFX | undefined = undefined
        let count = 0;

        while (true) {
            PlayerProfile.playerInstances.forEach(element => {

                if (element) {
                    const pp = PlayerProfile.get(element)

                    if (!pp) {
                        return
                    }

                    if (
                        element
                        && mod.GetSoldierState(element, mod.SoldierStateBool.IsAlive)
                        && mod.GetSoldierState(element, mod.SoldierStateBool.IsFiring)
                    ) {
                        //mod.RuntimeSpawn_Common.FX_Autocannon_30mm_AP_Hit_Metal_GS,

                        spawnedObj && mod.UnspawnObject(spawnedObj)

                        if (fxKeys[count]) {
                            spawnedObj = mod.SpawnObject(fxKeys[count], mod.CreateVector(-623.297973632813, 142.054000854492, -123.278999328613), mod.CreateVector(0, 0, 0))
                            spawnedObj && mod.EnableVFX(spawnedObj as mod.VFX, true)
                            console.log("Spawn VFX:" + count)

                        }
                        count++;
                    }
                }
            });
            await mod.Wait(0);
        }




    }





}


// === HoH_GameHandler.ts ===









enum GameState {
    WaitingForPlayers,
    GameStartCountdown,
    GameRoundIsRunning,
    WaitingForNextRound,
    GameOver
}

class HoH_GameHandler {



    static victoryVFXCords = [
        { id: mod.RuntimeSpawn_Common.FX_Autocannon_30mm_AP_Hit_Metal_GS, position: { x: -578.721313476563, y: 143.388229370117, z: -112.560516357422 }, rotation: { x: 0.0, y: -0.70710676908493, z: 0.0, w: 0.70710676908493 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
        { id: mod.RuntimeSpawn_Common.FX_Autocannon_30mm_AP_Hit_Metal_GS, position: { x: -564.050231933594, y: 143.388229370117, z: -112.560516357422 }, rotation: { x: -0.00188956188504, y: 0.7217578291893, z: -0.0018120247405, w: 0.69214075803757 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },

    ]

    static loserPlatform = [
        { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -569.281005859375, y: 139.212005615234, z: -128.872680664063 }, rotation: { x: 0.0, y: 0.0, z: 0.0, w: 1.0 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
        { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -569.281005859375, y: 139.212005615234, z: -125.301246643066 }, rotation: { x: 0.0, y: 0.0, z: 0.0, w: 1.0 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
        { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -574.281005859375, y: 139.212005615234, z: -125.301246643066 }, rotation: { x: 0.0, y: 0.0, z: 0.0, w: 1.0 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
        { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -579.281005859375, y: 139.212005615234, z: -125.301246643066 }, rotation: { x: 0.0, y: 0.0, z: 0.0, w: 1.0 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
        { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -579.281005859375, y: 139.212005615234, z: -128.872680664063 }, rotation: { x: 0.0, y: 0.0, z: 0.0, w: 1.0 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
        { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -574.281005859375, y: 139.212005615234, z: -128.872680664063 }, rotation: { x: 0.0, y: 0.0, z: 0.0, w: 1.0 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },

    ]

    static platformRings = [
        [
            { id: mod.RuntimeSpawn_Aftermath.Metrobus_Wreck_Rim_Front, position: { x: -611.160095214844, y: 131.244049072266, z: -33.6565475463867 }, rotation: { x: -0.19695647060871, y: -0.19695647060871, z: 0.67912310361862, w: 0.67912304401398 }, scale: { x: 6.0, y: 6.0, z: 6.0 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -616.503112792969, y: 130.800155639648, z: -33.3591346740723 }, rotation: { x: 0.0, y: 0.0, z: 0.0, w: 1.0 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -616.458129882813, y: 130.801147460938, z: -37.0211372375488 }, rotation: { x: 0.0, y: -0.38268345594406, z: 0.0, w: 0.92387956380844 }, scale: { x: 0.99999994039536, y: 1.0, z: 0.99999994039536 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -613.993103027344, y: 130.802154541016, z: -39.5061378479004 }, rotation: { x: 0.0, y: -0.70710676908493, z: 0.0, w: 0.70710676908493 }, scale: { x: 1.00000011920929, y: 1.0, z: 1.00000011920929 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -610.533142089844, y: 130.803146362305, z: -39.4611358642578 }, rotation: { x: 0.0, y: -0.70710676908493, z: 0.0, w: 0.70710676908493 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -606.87109375, y: 130.804153442383, z: -39.4161376953125 }, rotation: { x: 0.0, y: 0.92387956380844, z: 0.0, w: -0.38268342614174 }, scale: { x: 0.99999994039536, y: 1.0, z: 0.99999994039536 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -604.387145996094, y: 130.805160522461, z: -36.9511375427246 }, rotation: { x: 0.0, y: 1.0, z: 0.0, w: 0.00000001490116 }, scale: { x: 1.00000011920929, y: 1.0, z: 1.00000011920929 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -608.326110839844, y: 130.80615234375, z: -35.0701370239258 }, rotation: { x: 0.0, y: 1.0, z: 0.0, w: 0.00000001490116 }, scale: { x: 1.00000011920929, y: 1.0, z: 1.00000011920929 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -604.424133300781, y: 130.807159423828, z: -33.439136505127 }, rotation: { x: 0.0, y: 1.0, z: 0.0, w: 0.00000005165802 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -604.469116210938, y: 130.808151245117, z: -29.7761363983154 }, rotation: { x: 0.0, y: 0.9238795042038, z: 0.0, w: 0.38268348574638 }, scale: { x: 0.99999982118607, y: 1.0, z: 0.99999982118607 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -606.93310546875, y: 130.809158325195, z: -27.2921371459961 }, rotation: { x: 0.0, y: 0.70710670948029, z: 0.0, w: 0.70710682868958 }, scale: { x: 1.00000011920929, y: 1.0, z: 1.00000011920929 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -610.39208984375, y: 130.810150146484, z: -27.3131370544434 }, rotation: { x: 0.0, y: 0.70710670948029, z: 0.0, w: 0.70710682868958 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -614.054138183594, y: 130.811157226563, z: -27.3581371307373 }, rotation: { x: 0.0, y: 0.38268336653709, z: 0.0, w: 0.92387956380844 }, scale: { x: 0.99999994039536, y: 1.0, z: 0.99999994039536 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -616.538146972656, y: 130.812149047852, z: -29.8231372833252 }, rotation: { x: 0.0, y: -0.00000005861255, z: 0.0, w: 1.0 }, scale: { x: 1.00000011920929, y: 1.0, z: 1.00000011920929 } },

        ],
        [
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -613.898132324219, y: 130.780151367188, z: -44.3541374206543 }, rotation: { x: 0.0, y: -0.70710676908493, z: 0.0, w: 0.70710676908493 }, scale: { x: 0.99999994039536, y: 1.0, z: 0.99999994039536 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -617.232116699219, y: 130.781158447266, z: -42.8181381225586 }, rotation: { x: 0.0, y: -0.52636235952377, z: 0.0, w: 0.85026037693024 }, scale: { x: 0.99999982118607, y: 0.99999994039536, z: 0.99999976158142 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -619.823120117188, y: 130.782150268555, z: -40.3271369934082 }, rotation: { x: 0.0, y: -0.38940528035164, z: 0.0, w: 0.92106652259827 }, scale: { x: 0.99999982118607, y: 0.99999994039536, z: 0.99999976158142 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -621.450134277344, y: 130.783157348633, z: -37.0941352844238 }, rotation: { x: 0.0, y: -0.22820644080639, z: 0.0, w: 0.97361278533936 }, scale: { x: 0.99999976158142, y: 0.99999994039536, z: 0.99999976158142 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -621.455139160156, y: 130.784149169922, z: -33.4411354064941 }, rotation: { x: 0.0, y: 0.0, z: 0.0, w: 1.0 }, scale: { x: 1.00000011920929, y: 0.99999994039536, z: 1.0 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -599.548095703125, y: 130.78515625, z: -37.0661354064941 }, rotation: { x: 0.0, y: 0.9999173283577, z: 0.0, w: -0.01285858824849 }, scale: { x: 1.0, y: 1.00000011920929, z: 1.00000011920929 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -601.169128417969, y: 130.786148071289, z: -40.3531379699707 }, rotation: { x: 0.0, y: 0.97031903266907, z: 0.0, w: -0.24182833731174 }, scale: { x: 0.99999976158142, y: 0.99999994039536, z: 0.99999976158142 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -603.72412109375, y: 130.787155151367, z: -42.874137878418 }, rotation: { x: 0.0, y: 0.92154008150101, z: 0.0, w: -0.38828331232071 }, scale: { x: 0.99999994039536, y: 0.99999982118607, z: 0.99999976158142 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -606.997131347656, y: 130.788146972656, z: -44.4121360778809 }, rotation: { x: 0.0, y: -0.84264987707138, z: 0.0, w: 0.53846192359924 }, scale: { x: 0.99999970197678, y: 1.0, z: 0.99999976158142 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -610.649108886719, y: 130.789154052734, z: -44.3201370239258 }, rotation: { x: 0.0, y: -0.69762343168259, z: 0.0, w: 0.71646457910538 }, scale: { x: 1.00000035762787, y: 1.00000011920929, z: 0.99999988079071 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -606.779113769531, y: 130.790145874023, z: -22.6571369171143 }, rotation: { x: 0.0, y: 0.71614068746567, z: 0.0, w: 0.69795596599579 }, scale: { x: 1.0, y: 1.00000011920929, z: 1.00000011920929 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -603.492126464844, y: 130.791152954102, z: -24.2781372070313 }, rotation: { x: 0.0, y: 0.85711771249771, z: 0.0, w: 0.5151207447052 }, scale: { x: 0.99999976158142, y: 0.99999988079071, z: 0.99999976158142 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -600.971130371094, y: 130.79216003418, z: -26.8341369628906 }, rotation: { x: 0.0, y: 0.92618495225906, z: 0.0, w: 0.37706950306892 }, scale: { x: 0.99999994039536, y: 0.99999976158142, z: 0.99999976158142 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -599.43310546875, y: 130.793151855469, z: -30.1071357727051 }, rotation: { x: 0.0, y: 0.97659349441528, z: 0.0, w: 0.21509335935116 }, scale: { x: 0.99999970197678, y: 1.0, z: 0.99999982118607 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -599.525146484375, y: 130.794158935547, z: -33.7591361999512 }, rotation: { x: 0.0, y: 0.99991124868393, z: 0.0, w: -0.01332269236445 }, scale: { x: 1.00000035762787, y: 1.00000011920929, z: 0.99999988079071 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -621.403137207031, y: 130.795150756836, z: -29.8881359100342 }, rotation: { x: 0.0, y: 0.01285854354501, z: 0.0, w: 0.9999173283577 }, scale: { x: 1.0, y: 1.00000011920929, z: 1.00000011920929 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -619.782104492188, y: 130.796157836914, z: -26.6011371612549 }, rotation: { x: 0.0, y: 0.2418282777071, z: 0.0, w: 0.97031909227371 }, scale: { x: 0.99999976158142, y: 0.99999988079071, z: 0.99999976158142 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -617.227111816406, y: 130.797149658203, z: -24.080135345459 }, rotation: { x: 0.0, y: 0.38828325271606, z: 0.0, w: 0.92154008150101 }, scale: { x: 0.99999994039536, y: 0.99999976158142, z: 0.99999976158142 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -613.953125, y: 130.798156738281, z: -22.5421371459961 }, rotation: { x: 0.0, y: 0.53846192359924, z: 0.0, w: 0.84264987707138 }, scale: { x: 0.99999976158142, y: 1.0, z: 0.99999982118607 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -610.302124023438, y: 130.79914855957, z: -22.6341361999512 }, rotation: { x: 0.0, y: 0.71646451950073, z: 0.0, w: 0.69762349128723 }, scale: { x: 1.00000035762787, y: 1.00000011920929, z: 0.99999988079071 } },

        ],
        [
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -607.062133789063, y: 130.748153686523, z: -44.3461380004883 }, rotation: { x: 0.0, y: 0.70710676908493, z: 0.0, w: 0.70710676908493 }, scale: { x: 1.00000035762787, y: 1.00000011920929, z: 0.99999988079071 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -605.0361328125, y: 130.749160766602, z: -43.5041351318359 }, rotation: { x: 0.0, y: 0.59672909975052, z: 0.0, w: 0.80244272947311 }, scale: { x: 1.00000035762787, y: 1.0, z: 0.99999982118607 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -603.685119628906, y: 130.750152587891, z: -42.2031364440918 }, rotation: { x: 0.0, y: 0.45554491877556, z: 0.0, w: 0.89021277427673 }, scale: { x: 1.00000035762787, y: 1.0, z: 0.99999976158142 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -602.299133300781, y: 130.751159667969, z: -41.2041358947754 }, rotation: { x: 0.0, y: 0.45554491877556, z: 0.0, w: 0.89021277427673 }, scale: { x: 1.00000035762787, y: 1.0, z: 0.99999976158142 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -599.910095214844, y: 130.752151489258, z: -33.6121368408203 }, rotation: { x: 0.0, y: 0.0, z: 0.0, w: 1.0 }, scale: { x: 1.00000023841858, y: 1.0, z: 0.99999976158142 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -599.563110351563, y: 130.753158569336, z: -35.4071350097656 }, rotation: { x: 0.0, y: 0.1856065839529, z: 0.0, w: 0.98262411355972 }, scale: { x: 1.00000023841858, y: 1.0, z: 0.99999970197678 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -600.565124511719, y: 130.754150390625, z: -38.031135559082 }, rotation: { x: 0.0, y: 0.2514950633049, z: 0.0, w: 0.96785855293274 }, scale: { x: 1.00000035762787, y: 1.0, z: 0.99999988079071 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -601.355102539063, y: 130.755157470703, z: -39.8541374206543 }, rotation: { x: 0.0, y: 0.37622427940369, z: 0.0, w: 0.92652863264084 }, scale: { x: 1.00000023841858, y: 1.0, z: 0.99999970197678 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -599.723876953125, y: 130.756149291992, z: -31.0446834564209 }, rotation: { x: 0.0, y: 0.01685036532581, z: 0.0, w: 0.99985802173615 }, scale: { x: 1.00000011920929, y: 1.00000023841858, z: 0.99999970197678 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -600.497192382813, y: 130.75715637207, z: -28.9914608001709 }, rotation: { x: 0.0, y: -0.12876968085766, z: 0.0, w: 0.99167454242706 }, scale: { x: 1.00000035762787, y: 1.0, z: 0.99999988079071 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -601.751831054688, y: 130.758148193359, z: -27.597375869751 }, rotation: { x: 0.0, y: -0.29127830266953, z: 0.0, w: 0.95663833618164 }, scale: { x: 1.00000023841858, y: 1.0, z: 0.99999994039536 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -602.70361328125, y: 130.759155273438, z: -26.1785202026367 }, rotation: { x: 0.0, y: -0.29127830266953, z: 0.0, w: 0.95663833618164 }, scale: { x: 1.00000023841858, y: 1.0, z: 0.99999994039536 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -610.210815429688, y: 130.760147094727, z: -23.535041809082 }, rotation: { x: 0.0, y: -0.69509148597717, z: 0.0, w: 0.71892136335373 }, scale: { x: 1.00000011920929, y: 1.0, z: 0.99999964237213 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -608.405151367188, y: 130.761154174805, z: -23.2487182617188 }, rotation: { x: 0.0, y: -0.5495770573616, z: 0.0, w: 0.83544301986694 }, scale: { x: 1.00000023841858, y: 1.0, z: 0.99999976158142 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -605.81640625, y: 130.762145996094, z: -24.3385772705078 }, rotation: { x: 0.0, y: -0.49194499850273, z: 0.0, w: 0.87062627077103 }, scale: { x: 1.00000023841858, y: 1.0, z: 0.99999988079071 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -604.02099609375, y: 130.763153076172, z: -25.1895332336426 }, rotation: { x: 0.0, y: -0.37354639172554, z: 0.0, w: 0.92761147022247 }, scale: { x: 1.00000023841858, y: 1.0, z: 0.99999970197678 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -613.404541015625, y: 130.76416015625, z: -23.2163124084473 }, rotation: { x: 0.0, y: -0.69509148597717, z: 0.0, w: 0.71892136335373 }, scale: { x: 1.00000011920929, y: 1.00000023841858, z: 0.99999970197678 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -615.457763671875, y: 130.765151977539, z: -23.9895668029785 }, rotation: { x: 0.0, y: -0.79227370023727, z: 0.0, w: 0.61016583442688 }, scale: { x: 1.00000059604645, y: 1.0, z: 1.0 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -616.851806640625, y: 130.766159057617, z: -25.2442665100098 }, rotation: { x: 0.0, y: 0.8824103474617, z: 0.0, w: -0.47048062086105 }, scale: { x: 1.00000035762787, y: 1.0, z: 0.99999994039536 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -618.270690917969, y: 130.767150878906, z: -26.1960182189941 }, rotation: { x: 0.0, y: 0.8824103474617, z: 0.0, w: -0.47048062086105 }, scale: { x: 1.00000035762787, y: 1.0, z: 0.99999994039536 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -620.914184570313, y: 130.768157958984, z: -33.7031898498535 }, rotation: { x: 0.0, y: 0.99985802173615, z: 0.0, w: -0.01685029827058 }, scale: { x: 1.00000023841858, y: 1.0, z: 0.99999976158142 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -621.200500488281, y: 130.769149780273, z: -31.8975257873535 }, rotation: { x: 0.0, y: 0.97935706377029, z: 0.0, w: -0.20213776826859 }, scale: { x: 1.00000023841858, y: 1.0, z: 0.99999976158142 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -620.110595703125, y: 130.770156860352, z: -29.308780670166 }, rotation: { x: 0.0, y: 0.96348339319229, z: 0.0, w: -0.26776805520058 }, scale: { x: 1.00000023841858, y: 1.0, z: 0.99999982118607 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -619.259643554688, y: 130.771148681641, z: -27.5134315490723 }, rotation: { x: 0.0, y: 0.92005759477615, z: 0.0, w: -0.39178311824799 }, scale: { x: 1.00000023841858, y: 1.0, z: 0.99999970197678 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -621.165893554688, y: 130.772155761719, z: -36.9768829345703 }, rotation: { x: 0.0, y: 0.99998837709427, z: 0.0, w: -0.00481705227867 }, scale: { x: 1.00000023841858, y: 1.00000023841858, z: 0.99999970197678 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -620.343505859375, y: 130.773147583008, z: -39.0109024047852 }, rotation: { x: 0.0, y: 0.99005311727524, z: 0.0, w: 0.14069397747517 }, scale: { x: 1.00000047683716, y: 1.0, z: 1.0 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -619.055603027344, y: 130.774154663086, z: -40.3744087219238 }, rotation: { x: 0.0, y: 0.95306390523911, z: 0.0, w: 0.30276921391487 }, scale: { x: 1.00000047683716, y: 1.0, z: 1.00000011920929 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -618.069946289063, y: 130.775146484375, z: -41.7699432373047 }, rotation: { x: 0.0, y: 0.95306390523911, z: 0.0, w: 0.30276921391487 }, scale: { x: 1.00000047683716, y: 1.0, z: 1.00000011920929 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -610.501342773438, y: 130.776153564453, z: -44.2319755554199 }, rotation: { x: 0.0, y: 0.71050471067429, z: 0.0, w: 0.70369243621826 }, scale: { x: 1.00000023841858, y: 1.0, z: 0.99999970197678 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -612.299560546875, y: 130.777160644531, z: -44.561695098877 }, rotation: { x: 0.0, y: 0.8287690281868, z: 0.0, w: 0.5595908164978 }, scale: { x: 1.00000023841858, y: 1.0, z: 0.99999970197678 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -614.913818359375, y: 130.77815246582, z: -43.5344352722168 }, rotation: { x: 0.0, y: 0.86464327573776, z: 0.0, w: 0.50238633155823 }, scale: { x: 1.00000023841858, y: 1.0, z: 0.99999988079071 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -616.729125976563, y: 130.779159545898, z: -42.726936340332 }, rotation: { x: 0.0, y: 0.92304909229279, z: 0.0, w: 0.38468214869499 }, scale: { x: 1.00000023841858, y: 1.0, z: 0.99999976158142 } },
            { id: mod.RuntimeSpawn_Aftermath.Metrobus_Wreck_Rim_Front, position: { x: -608.830017089844, y: 131.163482666016, z: -46.9575004577637 }, rotation: { x: 0.52028620243073, y: 0.52028614282608, z: 0.47885522246361, w: 0.47885519266129 }, scale: { x: 6.0, y: 5.99999952316284, z: 5.99999952316284 } },
            { id: mod.RuntimeSpawn_Aftermath.Metrobus_Wreck_Rim_Front, position: { x: -612.197875976563, y: 131.163482666016, z: -20.0823764801025 }, rotation: { x: 0.52028620243073, y: 0.52028614282608, z: 0.47885522246361, w: 0.47885519266129 }, scale: { x: 6.0, y: 5.99999952316284, z: 5.99999952316284 } },
            { id: mod.RuntimeSpawn_Aftermath.Metrobus_Wreck_Rim_Front, position: { x: -623.956665039063, y: 131.163482666016, z: -33.8208160400391 }, rotation: { x: 0.52028620243073, y: 0.52028614282608, z: 0.47885522246361, w: 0.47885519266129 }, scale: { x: 6.0, y: 5.99999952316284, z: 5.99999952316284 } },
            { id: mod.RuntimeSpawn_Aftermath.Metrobus_Wreck_Rim_Front, position: { x: -597.149475097656, y: 131.163482666016, z: -33.0295867919922 }, rotation: { x: 0.52028620243073, y: 0.52028614282608, z: 0.47885522246361, w: 0.47885519266129 }, scale: { x: 6.0, y: 5.99999952316284, z: 5.99999952316284 } },

        ],
        [
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -607.003540039063, y: 130.708160400391, z: -49.2063865661621 }, rotation: { x: 0.0, y: 0.70710676908493, z: 0.0, w: 0.70710676908493 }, scale: { x: 1.00000023841858, y: 1.0, z: 0.99999976158142 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -604.714599609375, y: 130.70915222168, z: -48.4908866882324 }, rotation: { x: 0.0, y: 0.61792141199112, z: 0.0, w: 0.78623992204666 }, scale: { x: 1.00000023841858, y: 1.0, z: 0.99999976158142 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -602.5078125, y: 130.710159301758, z: -47.6380348205566 }, rotation: { x: 0.0, y: 0.57140845060349, z: 0.0, w: 0.82066583633423 }, scale: { x: 1.00000023841858, y: 1.0, z: 0.99999982118607 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -595.076538085938, y: 130.711151123047, z: -33.6476898193359 }, rotation: { x: 0.0, y: -0.00000002980232, z: 0.0, w: 1.0 }, scale: { x: 1.00000023841858, y: 1.0, z: 0.99999976158142 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -594.942260742188, y: 130.712158203125, z: -35.9112167358398 }, rotation: { x: 0.0, y: 0.13052615523338, z: 0.0, w: 0.99144488573074 }, scale: { x: 1.00000023841858, y: 1.0, z: 0.99999970197678 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -595.641906738281, y: 130.713150024414, z: -38.6533660888672 }, rotation: { x: 0.0, y: 0.17794355750084, z: 0.0, w: 0.98404067754745 }, scale: { x: 1.00000023841858, y: 1.0, z: 0.99999970197678 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -596.46337890625, y: 130.714157104492, z: -41.0304298400879 }, rotation: { x: 0.0, y: 0.26973503828049, z: 0.0, w: 0.9629345536232 }, scale: { x: 1.00000035762787, y: 1.0, z: 0.99999976158142 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -597.749877929688, y: 130.715148925781, z: -43.242130279541 }, rotation: { x: 0.0, y: 0.35933724045753, z: 0.0, w: 0.93320780992508 }, scale: { x: 1.00000023841858, y: 1.0, z: 0.99999970197678 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -599.413818359375, y: 130.716156005859, z: -45.1268997192383 }, rotation: { x: 0.0, y: 0.43881815671921, z: 0.0, w: 0.89857590198517 }, scale: { x: 1.00000023841858, y: 1.0, z: 0.99999970197678 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -601.105163574219, y: 130.717147827148, z: -46.7695693969727 }, rotation: { x: 0.0, y: 0.54897177219391, z: 0.0, w: 0.83584094047546 }, scale: { x: 1.00000023841858, y: 1.0, z: 0.99999970197678 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -595.12158203125, y: 130.718154907227, z: -30.5297698974609 }, rotation: { x: 0.0, y: -0.02034038119018, z: 0.0, w: 0.99979311227798 }, scale: { x: 1.00000011920929, y: 1.0, z: 0.99999970197678 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -595.929626464844, y: 130.719146728516, z: -28.271842956543 }, rotation: { x: 0.0, y: -0.13919033110142, z: 0.0, w: 0.99026566743851 }, scale: { x: 1.00000011920929, y: 1.0, z: 0.99999976158142 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -596.871520996094, y: 130.720153808594, z: -26.1015625 }, rotation: { x: 0.0, y: -0.19623701274395, z: 0.0, w: 0.98055648803711 }, scale: { x: 1.00000023841858, y: 1.0, z: 0.99999976158142 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -611.152526855469, y: 130.721160888672, z: -19.2454605102539 }, rotation: { x: 0.0, y: -0.72134333848953, z: 0.0, w: 0.69257766008377 }, scale: { x: 1.00000011920929, y: 1.0, z: 0.99999970197678 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -608.896301269531, y: 130.722152709961, z: -19.0192108154297 }, rotation: { x: 0.0, y: -0.62477254867554, z: 0.0, w: 0.78080677986145 }, scale: { x: 1.00000011920929, y: 1.0, z: 0.99999958276749 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -606.127990722656, y: 130.723159790039, z: -19.6067657470703 }, rotation: { x: 0.0, y: -0.58659148216248, z: 0.0, w: 0.80988299846649 }, scale: { x: 1.00000023841858, y: 1.0, z: 0.99999964237213 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -603.719421386719, y: 130.724151611328, z: -20.3308715820313 }, rotation: { x: 0.0, y: -0.50779396295547, z: 0.0, w: 0.86147856712341 }, scale: { x: 1.00000023841858, y: 1.0, z: 0.99999970197678 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -601.457275390625, y: 130.725158691406, z: -21.5263519287109 }, rotation: { x: 0.0, y: -0.42429426312447, z: 0.0, w: 0.9055243730545 }, scale: { x: 1.00000023841858, y: 1.0, z: 0.99999970197678 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -599.506408691406, y: 130.726150512695, z: -23.1122512817383 }, rotation: { x: 0.0, y: -0.34426605701447, z: 0.0, w: 0.93887209892273 }, scale: { x: 1.00000023841858, y: 1.0, z: 0.99999970197678 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -597.796325683594, y: 130.727157592773, z: -24.7353973388672 }, rotation: { x: 0.0, y: -0.22272270917892, z: 0.0, w: 0.97488182783127 }, scale: { x: 1.00000023841858, y: 1.0, z: 0.99999970197678 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -614.471984863281, y: 130.728149414063, z: -18.9335479736328 }, rotation: { x: 0.0, y: -0.72134333848953, z: 0.0, w: 0.69257766008377 }, scale: { x: 1.00000011920929, y: 1.0, z: 0.99999970197678 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -616.729919433594, y: 130.729156494141, z: -19.7415924072266 }, rotation: { x: 0.0, y: -0.79864597320557, z: 0.0, w: 0.60180109739304 }, scale: { x: 1.00000011920929, y: 1.0, z: 0.99999976158142 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -618.900207519531, y: 130.73014831543, z: -20.6834869384766 }, rotation: { x: 0.0, y: -0.83211869001389, z: 0.0, w: 0.55459761619568 }, scale: { x: 1.00000023841858, y: 1.0, z: 0.99999976158142 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -625.756286621094, y: 130.731155395508, z: -34.9644927978516 }, rotation: { x: 0.0, y: 0.99979311227798, z: 0.0, w: 0.02034044824541 }, scale: { x: 1.00000011920929, y: 1.0, z: 0.99999970197678 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -625.982543945313, y: 130.732147216797, z: -32.7082672119141 }, rotation: { x: 0.0, y: 0.99389469623566, z: 0.0, w: -0.1103327870369 }, scale: { x: 1.00000011920929, y: 1.0, z: 0.99999958276749 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -625.394958496094, y: 130.733154296875, z: -29.9399566650391 }, rotation: { x: 0.0, y: 0.98745656013489, z: 0.0, w: -0.15789096057415 }, scale: { x: 1.00000023841858, y: 1.0, z: 0.99999964237213 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -624.670837402344, y: 130.734146118164, z: -27.5313873291016 }, rotation: { x: 0.0, y: 0.96822190284729, z: 0.0, w: -0.25009271502495 }, scale: { x: 1.00000023841858, y: 1.0, z: 0.99999970197678 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -623.475402832031, y: 130.735153198242, z: -25.2692413330078 }, rotation: { x: 0.0, y: 0.94032377004623, z: 0.0, w: -0.34028100967407 }, scale: { x: 1.00000023841858, y: 1.0, z: 0.99999964237213 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -621.889465332031, y: 130.73616027832, z: -23.3183746337891 }, rotation: { x: 0.0, y: 0.90731573104858, z: 0.0, w: -0.42044994235039 }, scale: { x: 1.00000023841858, y: 1.0, z: 0.99999970197678 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -620.266357421875, y: 130.737152099609, z: -21.6082916259766 }, rotation: { x: 0.0, y: -0.84683436155319, z: 0.0, w: 0.53185683488846 }, scale: { x: 1.00000035762787, y: 1.0, z: 0.99999988079071 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -625.804565429688, y: 130.738159179688, z: -37.8000907897949 }, rotation: { x: 0.0, y: 0.99979311227798, z: 0.0, w: 0.02034042961895 }, scale: { x: 1.00000011920929, y: 1.0, z: 0.99999970197678 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -624.996520996094, y: 130.739151000977, z: -40.0580253601074 }, rotation: { x: 0.0, y: 0.99026566743851, z: 0.0, w: 0.13919036090374 }, scale: { x: 1.00000023841858, y: 1.0, z: 0.99999988079071 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -624.054626464844, y: 130.740158081055, z: -42.2283134460449 }, rotation: { x: 0.0, y: 0.98055648803711, z: 0.0, w: 0.19623704254627 }, scale: { x: 1.00000023841858, y: 1.0, z: 0.99999982118607 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -609.773620605469, y: 130.741149902344, z: -49.0843925476074 }, rotation: { x: 0.0, y: 0.69257760047913, z: 0.0, w: 0.72134339809418 }, scale: { x: 1.00000011920929, y: 1.0, z: 0.99999970197678 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -612.029846191406, y: 130.742156982422, z: -49.3106498718262 }, rotation: { x: 0.0, y: 0.78080672025681, z: 0.0, w: 0.62477266788483 }, scale: { x: 1.00000011920929, y: 1.0, z: 0.99999958276749 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -614.798156738281, y: 130.743148803711, z: -48.7230644226074 }, rotation: { x: 0.0, y: 0.80988299846649, z: 0.0, w: 0.58659148216248 }, scale: { x: 1.00000023841858, y: 1.0, z: 0.99999964237213 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -617.206726074219, y: 130.744155883789, z: -47.9989433288574 }, rotation: { x: 0.0, y: 0.86147850751877, z: 0.0, w: 0.50779402256012 }, scale: { x: 1.00000023841858, y: 1.0, z: 0.99999970197678 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -619.468872070313, y: 130.745147705078, z: -46.8035087585449 }, rotation: { x: 0.0, y: 0.90552431344986, z: 0.0, w: 0.42429432272911 }, scale: { x: 1.00000035762787, y: 1.0, z: 0.99999982118607 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -621.419738769531, y: 130.746154785156, z: -45.2175712585449 }, rotation: { x: 0.0, y: 0.93887209892273, z: 0.0, w: 0.34426614642143 }, scale: { x: 1.00000023841858, y: 1.0, z: 0.99999964237213 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -623.129821777344, y: 130.747146606445, z: -43.5944633483887 }, rotation: { x: 0.0, y: 0.97488182783127, z: 0.0, w: 0.22272270917892 }, scale: { x: 1.00000035762787, y: 1.0, z: 0.99999988079071 } },
        ],
        [
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -624.751525878906, y: 130.755157470703, z: -19.2714385986328 }, rotation: { x: 0.0, y: 0.89687275886536, z: 0.0, w: -0.44228863716125 }, scale: { x: 1.00000023841858, y: 1.0, z: 0.99999988079071 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -609.554260253906, y: 130.708160400391, z: -54.0368614196777 }, rotation: { x: 0.0, y: 0.70710676908493, z: 0.0, w: 0.70710676908493 }, scale: { x: 1.00000035762787, y: 1.0, z: 0.99999988079071 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -612.11328125, y: 130.70915222168, z: -54.1750259399414 }, rotation: { x: 0.0, y: 0.77610695362091, z: 0.0, w: 0.63060128688812 }, scale: { x: 1.00000035762787, y: 1.0, z: 0.99999982118607 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -615.305114746094, y: 130.710159301758, z: -53.5101013183594 }, rotation: { x: 0.0, y: 0.79402756690979, z: 0.0, w: 0.60788178443909 }, scale: { x: 1.00000035762787, y: 1.0, z: 0.99999982118607 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -617.710693359375, y: 130.711151123047, z: -53.023567199707 }, rotation: { x: 0.0, y: 0.84164750576019, z: 0.0, w: 0.54002732038498 }, scale: { x: 1.00000023841858, y: 1.0, z: 0.99999988079071 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -620.388977050781, y: 130.712158203125, z: -51.8551330566406 }, rotation: { x: 0.0, y: 0.87234675884247, z: 0.0, w: 0.48888769745827 }, scale: { x: 1.00000035762787, y: 1.0, z: 0.99999994039536 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -622.910217285156, y: 130.713150024414, z: -50.3908996582031 }, rotation: { x: 0.0, y: 0.90482705831528, z: 0.0, w: 0.42577928304672 }, scale: { x: 1.00000023841858, y: 1.0, z: 0.99999976158142 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -624.014526367188, y: 130.714157104492, z: -49.9753036499023 }, rotation: { x: 0.0, y: 0.94682908058167, z: 0.0, w: 0.32173702120781 }, scale: { x: 1.00000023841858, y: 1.0, z: 0.99999982118607 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -630.704711914063, y: 130.715148925781, z: -37.6446990966797 }, rotation: { x: 0.0, y: 1.0, z: 0.0, w: -0.0000000754979 }, scale: { x: 1.00000035762787, y: 1.0, z: 0.99999988079071 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -630.151184082031, y: 130.716156005859, z: -40.4228096008301 }, rotation: { x: 0.0, y: 0.99750649929047, z: 0.0, w: 0.07057476788759 }, scale: { x: 1.00000035762787, y: 1.0, z: 0.99999982118607 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -629.14697265625, y: 130.717147827148, z: -43.0867614746094 }, rotation: { x: 0.0, y: 0.98935502767563, z: 0.0, w: 0.14552181959152 }, scale: { x: 1.00000023841858, y: 1.0, z: 0.99999964237213 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -627.763854980469, y: 130.718154907227, z: -45.3872451782227 }, rotation: { x: 0.0, y: 0.97030419111252, z: 0.0, w: 0.24188794195652 }, scale: { x: 1.00000023841858, y: 1.0, z: 0.99999970197678 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -625.864562988281, y: 130.719146728516, z: -47.654167175293 }, rotation: { x: 0.0, y: 0.95227861404419, z: 0.0, w: 0.30523002147675 }, scale: { x: 1.00000011920929, y: 1.0, z: 0.99999982118607 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -590.171936035156, y: 130.720153808594, z: -32.8417854309082 }, rotation: { x: 0.0, y: 0.0, z: 0.0, w: 1.0 }, scale: { x: 1.00000035762787, y: 1.0, z: 0.99999988079071 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -590.033752441406, y: 130.721160888672, z: -35.400806427002 }, rotation: { x: 0.0, y: 0.10288804769516, z: 0.0, w: 0.99469298124313 }, scale: { x: 1.00000023841858, y: 1.0, z: 0.99999976158142 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -590.698669433594, y: 130.722152709961, z: -38.5926399230957 }, rotation: { x: 0.0, y: 0.13162492215633, z: 0.0, w: 0.99129956960678 }, scale: { x: 1.00000035762787, y: 1.0, z: 0.99999982118607 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -591.185241699219, y: 130.723159790039, z: -40.998218536377 }, rotation: { x: 0.0, y: 0.21327762305737, z: 0.0, w: 0.97699165344238 }, scale: { x: 1.00000035762787, y: 1.0, z: 0.99999994039536 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -592.353637695313, y: 130.724151611328, z: -43.6765022277832 }, rotation: { x: 0.0, y: 0.27114647626877, z: 0.0, w: 0.96253806352615 }, scale: { x: 1.00000047683716, y: 1.0, z: 1.0 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -593.81787109375, y: 130.725158691406, z: -46.1977424621582 }, rotation: { x: 0.0, y: 0.33873787522316, z: 0.0, w: 0.94088077545166 }, scale: { x: 1.00000023841858, y: 1.0, z: 0.99999970197678 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -594.233459472656, y: 130.726150512695, z: -47.3020515441895 }, rotation: { x: 0.0, y: 0.44200682640076, z: 0.0, w: 0.89701169729233 }, scale: { x: 1.00000023841858, y: 1.0, z: 0.99999988079071 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -606.564086914063, y: 130.727157592773, z: -53.9922370910645 }, rotation: { x: 0.0, y: 0.70710682868958, z: 0.0, w: 0.70710670948029 }, scale: { x: 1.00000035762787, y: 1.0, z: 0.99999988079071 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -603.785949707031, y: 130.728149414063, z: -53.4387092590332 }, rotation: { x: 0.0, y: 0.65543967485428, z: 0.0, w: 0.75524753332138 }, scale: { x: 1.00000035762787, y: 1.0, z: 0.99999982118607 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -601.122009277344, y: 130.729156494141, z: -52.434497833252 }, rotation: { x: 0.0, y: 0.5966802239418, z: 0.0, w: 0.80247914791107 }, scale: { x: 1.00000023841858, y: 1.0, z: 0.99999964237213 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -598.821533203125, y: 130.73014831543, z: -51.0513801574707 }, rotation: { x: 0.0, y: 0.51506805419922, z: 0.0, w: 0.85714930295944 }, scale: { x: 1.00000035762787, y: 1.0, z: 0.99999988079071 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -596.554626464844, y: 130.731155395508, z: -49.1520881652832 }, rotation: { x: 0.0, y: 0.45753246545792, z: 0.0, w: 0.88919293880463 }, scale: { x: 1.00000023841858, y: 1.0, z: 0.99999982118607 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -611.984558105469, y: 130.732147216797, z: -14.2814025878906 }, rotation: { x: 0.0, y: -0.71907299757004, z: 0.0, w: 0.69493448734283 }, scale: { x: 1.00000035762787, y: 1.0, z: 0.99999982118607 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -609.431762695313, y: 130.733154296875, z: -14.0559558868408 }, rotation: { x: 0.0, y: -0.64375638961792, z: 0.0, w: 0.76523047685623 }, scale: { x: 1.00000023841858, y: 1.0, z: 0.99999970197678 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -606.219116210938, y: 130.734146118164, z: -14.6115417480469 }, rotation: { x: 0.0, y: -0.62134611606598, z: 0.0, w: 0.78353625535965 }, scale: { x: 1.00000023841858, y: 1.0, z: 0.99999982118607 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -603.798278808594, y: 130.735153198242, z: -15.0157222747803 }, rotation: { x: 0.0, y: -0.55431431531906, z: 0.0, w: 0.83230739831924 }, scale: { x: 1.00000035762787, y: 1.0, z: 0.99999988079071 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -601.081726074219, y: 130.73616027832, z: -16.0920238494873 }, rotation: { x: 0.0, y: -0.50370621681213, z: 0.0, w: 0.86387503147125 }, scale: { x: 1.00000035762787, y: 1.0, z: 0.99999994039536 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -598.511962890625, y: 130.737152099609, z: -17.4693489074707 }, rotation: { x: 0.0, y: -0.44116127490997, z: 0.0, w: 0.89742785692215 }, scale: { x: 1.00000011920929, y: 1.0, z: 0.99999964237213 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -597.394104003906, y: 130.738159179688, z: -17.8470020294189 }, rotation: { x: 0.0, y: -0.33785104751587, z: 0.0, w: 0.94119954109192 }, scale: { x: 1.00000023841858, y: 1.0, z: 0.99999988079071 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -590.286926269531, y: 130.739151000977, z: -29.9420928955078 }, rotation: { x: 0.0, y: -0.01706845872104, z: 0.0, w: 0.99985432624817 }, scale: { x: 1.00000035762787, y: 1.0, z: 0.99999982118607 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -590.934997558594, y: 130.740158081055, z: -27.1844673156738 }, rotation: { x: 0.0, y: -0.08759044110775, z: 0.0, w: 0.99615657329559 }, scale: { x: 1.00000023841858, y: 1.0, z: 0.99999964237213 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -592.029541015625, y: 130.741149902344, z: -24.5563564300537 }, rotation: { x: 0.0, y: -0.16238743066788, z: 0.0, w: 0.98672705888748 }, scale: { x: 1.00000023841858, y: 1.0, z: 0.99999970197678 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -593.490356445313, y: 130.742156982422, z: -22.3044300079346 }, rotation: { x: 0.0, y: -0.25841435790062, z: 0.0, w: 0.96603417396545 }, scale: { x: 1.00000035762787, y: 1.0, z: 0.99999982118607 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -595.465942382813, y: 130.743148803711, z: -20.1036720275879 }, rotation: { x: 0.0, y: -0.32143953442574, z: 0.0, w: 0.94693011045456 }, scale: { x: 1.00000023841858, y: 1.0, z: 0.99999988079071 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -630.573791503906, y: 130.744155883789, z: -35.7900543212891 }, rotation: { x: 0.0, y: 0.99985432624817, z: 0.0, w: 0.01706853508949 }, scale: { x: 1.00000023841858, y: 1.0, z: 0.99999976158142 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -630.799194335938, y: 130.745147705078, z: -33.2372589111328 }, rotation: { x: 0.0, y: 0.99630415439606, z: 0.0, w: -0.08589512109756 }, scale: { x: 1.00000035762787, y: 1.0, z: 0.99999982118607 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -630.24365234375, y: 130.746154785156, z: -30.0246124267578 }, rotation: { x: 0.0, y: 0.99340182542801, z: 0.0, w: -0.11468568444252 }, scale: { x: 1.00000023841858, y: 1.0, z: 0.99999982118607 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -629.839477539063, y: 130.747146606445, z: -27.6037750244141 }, rotation: { x: 0.0, y: 0.98048967123032, z: 0.0, w: -0.19657073915005 }, scale: { x: 1.00000023841858, y: 1.0, z: 0.99999982118607 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -628.763122558594, y: 130.748153686523, z: -24.8872222900391 }, rotation: { x: 0.0, y: 0.96702593564987, z: 0.0, w: -0.25467783212662 }, scale: { x: 1.00000047683716, y: 1.0, z: 1.00000011920929 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -627.385803222656, y: 130.749160766602, z: -22.3174591064453 }, rotation: { x: 0.0, y: 0.94652545452118, z: 0.0, w: -0.32262924313545 }, scale: { x: 1.00000011920929, y: 1.0, z: 0.99999964237213 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -627.008178710938, y: 130.750152587891, z: -21.1996002197266 }, rotation: { x: 0.0, y: 0.90442538261414, z: 0.0, w: -0.42663177847862 }, scale: { x: 1.00000011920929, y: 1.0, z: 0.99999976158142 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -614.9130859375, y: 130.751159667969, z: -14.0924224853516 }, rotation: { x: 0.0, y: -0.71907299757004, z: 0.0, w: 0.69493454694748 }, scale: { x: 1.00000023841858, y: 1.0, z: 0.99999976158142 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -617.670715332031, y: 130.752151489258, z: -14.7404937744141 }, rotation: { x: 0.0, y: -0.76632487773895, z: 0.0, w: 0.6424532532692 }, scale: { x: 1.00000023841858, y: 1.0, z: 0.99999964237213 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -620.298828125, y: 130.753158569336, z: -15.8350372314453 }, rotation: { x: 0.0, y: -0.8125467300415, z: 0.0, w: 0.58289611339569 }, scale: { x: 1.00000023841858, y: 1.0, z: 0.99999976158142 } },
            { id: mod.RuntimeSpawn_Common.FiringRange_Floor_A, position: { x: -622.550720214844, y: 130.754150390625, z: -17.2958526611328 }, rotation: { x: 0.0, y: -0.86581581830978, z: 0.0, w: 0.5003627538681 }, scale: { x: 1.00000035762787, y: 1.0, z: 0.99999982118607 } },


        ],
        [
            { id: mod.RuntimeSpawn_Aftermath.BarrierConcreteWall_01_192x320, position: { x: -613.361938476563, y: 130.655792236328, z: -58.6601905822754 }, rotation: { x: 0.0, y: -0.00609120121226, z: 0.0, w: 0.99998146295547 }, scale: { x: 0.99999994039536, y: 1.0, z: 0.99999994039536 } },
            { id: mod.RuntimeSpawn_Aftermath.BarrierConcreteWall_01_192x320, position: { x: -615.335815429688, y: 130.655792236328, z: -58.2436866760254 }, rotation: { x: 0.0, y: 0.08949401974678, z: 0.0, w: 0.99598735570908 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
            { id: mod.RuntimeSpawn_Aftermath.BarrierConcreteWall_01_192x320, position: { x: -617.311706542969, y: 130.655792236328, z: -57.7906227111816 }, rotation: { x: 0.0, y: 0.11927904933691, z: 0.0, w: 0.99286073446274 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
            { id: mod.RuntimeSpawn_Aftermath.BarrierConcreteWall_01_192x320, position: { x: -619.191833496094, y: 130.655792236328, z: -57.1371803283691 }, rotation: { x: 0.0, y: 0.13973474502563, z: 0.0, w: 0.99018901586533 }, scale: { x: 0.99999994039536, y: 1.0, z: 0.99999994039536 } },
            { id: mod.RuntimeSpawn_Aftermath.BarrierConcreteWall_01_192x320, position: { x: -621.117370605469, y: 130.655792236328, z: -56.5690650939941 }, rotation: { x: 0.0, y: 0.15856297314167, z: 0.0, w: 0.98734885454178 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
            { id: mod.RuntimeSpawn_Aftermath.BarrierConcreteWall_01_192x320, position: { x: -622.868286132813, y: 130.655792236328, z: -55.8606300354004 }, rotation: { x: 0.0, y: 0.21921615302563, z: 0.0, w: 0.97567629814148 }, scale: { x: 1.00000011920929, y: 1.0, z: 1.00000011920929 } },
            { id: mod.RuntimeSpawn_Aftermath.BarrierConcreteWall_01_192x320, position: { x: -624.740051269531, y: 130.655792236328, z: -54.8783302307129 }, rotation: { x: 0.0, y: 0.24642795324326, z: 0.0, w: 0.96916109323502 }, scale: { x: 1.00000011920929, y: 1.0, z: 1.00000011920929 } },
            { id: mod.RuntimeSpawn_Aftermath.BarrierConcreteWall_01_192x320, position: { x: -626.501586914063, y: 130.655792236328, z: -53.9056739807129 }, rotation: { x: 0.0, y: 0.27246060967445, z: 0.0, w: 0.96216696500778 }, scale: { x: 0.99999994039536, y: 1.0, z: 0.99999994039536 } },
            { id: mod.RuntimeSpawn_Aftermath.BarrierConcreteWall_01_192x320, position: { x: -628.087158203125, y: 130.655792236328, z: -52.6477394104004 }, rotation: { x: 0.0, y: 0.31809467077255, z: 0.0, w: 0.94805896282196 }, scale: { x: 1.00000011920929, y: 1.0, z: 1.00000011920929 } },
            { id: mod.RuntimeSpawn_Aftermath.BarrierConcreteWall_01_192x320, position: { x: -629.435241699219, y: 130.655792236328, z: -51.1221046447754 }, rotation: { x: 0.0, y: 0.39124089479446, z: 0.0, w: 0.92028832435608 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
            { id: mod.RuntimeSpawn_Aftermath.BarrierConcreteWall_01_192x320, position: { x: -630.642333984375, y: 130.655792236328, z: -49.5328712463379 }, rotation: { x: 0.0, y: 0.44233933091164, z: 0.0, w: 0.8968477845192 }, scale: { x: 0.99999976158142, y: 1.0, z: 0.99999976158142 } },
            { id: mod.RuntimeSpawn_Aftermath.BarrierConcreteWall_01_192x320, position: { x: -631.810913085938, y: 130.655792236328, z: -47.9261207580566 }, rotation: { x: 0.0, y: 0.45857563614845, z: 0.0, w: 0.8886553645134 }, scale: { x: 0.99999976158142, y: 1.0, z: 0.99999976158142 } },
            { id: mod.RuntimeSpawn_Aftermath.BarrierConcreteWall_01_192x320, position: { x: -632.8828125, y: 130.655792236328, z: -46.1894264221191 }, rotation: { x: 0.0, y: 0.4765333533287, z: 0.0, w: 0.87915641069412 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
            { id: mod.RuntimeSpawn_Aftermath.BarrierConcreteWall_01_192x320, position: { x: -633.879577636719, y: 130.655792236328, z: -44.4640235900879 }, rotation: { x: 0.0, y: 0.51448798179626, z: 0.0, w: 0.85749763250351 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
            { id: mod.RuntimeSpawn_Aftermath.BarrierConcreteWall_01_192x320, position: { x: -634.42578125, y: 130.655792236328, z: -42.6151466369629 }, rotation: { x: 0.0, y: 0.56258469820023, z: 0.0, w: 0.82673966884613 }, scale: { x: 0.99999988079071, y: 1.0, z: 0.99999988079071 } },
            { id: mod.RuntimeSpawn_Aftermath.BarrierConcreteWall_01_192x320, position: { x: -635.047485351563, y: 130.655792236328, z: -40.6866188049316 }, rotation: { x: 0.0, y: 0.58448666334152, z: 0.0, w: 0.81140333414078 }, scale: { x: 0.99999982118607, y: 1.0, z: 0.99999982118607 } },
            { id: mod.RuntimeSpawn_Aftermath.BarrierConcreteWall_01_192x320, position: { x: -635.301696777344, y: 130.655792236328, z: -38.6983985900879 }, rotation: { x: 0.0, y: 0.63447743654251, z: 0.0, w: 0.77294141054153 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
            { id: mod.RuntimeSpawn_Aftermath.BarrierConcreteWall_01_192x320, position: { x: -635.509765625, y: 130.655792236328, z: -36.7027320861816 }, rotation: { x: 0.0, y: 0.65791738033295, z: 0.0, w: 0.75309014320374 }, scale: { x: 0.99999982118607, y: 1.0, z: 0.99999982118607 } },
            { id: mod.RuntimeSpawn_Aftermath.BarrierConcreteWall_01_192x320, position: { x: -635.533020019531, y: 130.655792236328, z: -34.7953224182129 }, rotation: { x: 0.0, y: 0.68948972225189, z: 0.0, w: 0.72429543733597 }, scale: { x: 1.00000011920929, y: 1.0, z: 1.00000011920929 } },
            { id: mod.RuntimeSpawn_Aftermath.BarrierConcreteWall_01_192x320, position: { x: -611.432189941406, y: 130.668792724609, z: -58.6366920471191 }, rotation: { x: 0.0, y: -0.00609120121226, z: 0.0, w: 0.99998146295547 }, scale: { x: 0.99999994039536, y: 1.0, z: 0.99999994039536 } },
            { id: mod.RuntimeSpawn_Aftermath.BarrierConcreteWall_01_192x320, position: { x: -585.633361816406, y: 130.655792236328, z: -36.517147064209 }, rotation: { x: 0.0, y: -0.70710676908493, z: 0.0, w: 0.70710676908493 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
            { id: mod.RuntimeSpawn_Aftermath.BarrierConcreteWall_01_192x320, position: { x: -586.073852539063, y: 130.655792236328, z: -38.4858360290527 }, rotation: { x: 0.0, y: -0.63630044460297, z: 0.0, w: 0.77144140005112 }, scale: { x: 0.99999988079071, y: 1.0, z: 0.99999988079071 } },
            { id: mod.RuntimeSpawn_Aftermath.BarrierConcreteWall_01_192x320, position: { x: -586.550964355469, y: 130.655792236328, z: -40.4560585021973 }, rotation: { x: 0.0, y: -0.61291402578354, z: 0.0, w: 0.79014962911606 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
            { id: mod.RuntimeSpawn_Aftermath.BarrierConcreteWall_01_192x320, position: { x: -587.227294921875, y: 130.655792236328, z: -42.3280754089355 }, rotation: { x: 0.0, y: -0.59648406505585, z: 0.0, w: 0.80262494087219 }, scale: { x: 1.00000011920929, y: 1.0, z: 1.00000011920929 } },
            { id: mod.RuntimeSpawn_Aftermath.BarrierConcreteWall_01_192x320, position: { x: -587.818786621094, y: 130.655792236328, z: -44.2465476989746 }, rotation: { x: 0.0, y: -0.58109366893768, z: 0.0, w: 0.81383669376373 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
            { id: mod.RuntimeSpawn_Aftermath.BarrierConcreteWall_01_192x320, position: { x: -588.548522949219, y: 130.655792236328, z: -45.9887199401855 }, rotation: { x: 0.0, y: -0.52974170446396, z: 0.0, w: 0.84815901517868 }, scale: { x: 0.99999994039536, y: 1.0, z: 0.99999994039536 } },
            { id: mod.RuntimeSpawn_Aftermath.BarrierConcreteWall_01_192x320, position: { x: -589.553527832031, y: 130.655792236328, z: -47.8483352661133 }, rotation: { x: 0.0, y: -0.50580435991287, z: 0.0, w: 0.86264824867249 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
            { id: mod.RuntimeSpawn_Aftermath.BarrierConcreteWall_01_192x320, position: { x: -590.547607421875, y: 130.655792236328, z: -49.597900390625 }, rotation: { x: 0.0, y: -0.48236933350563, z: 0.0, w: 0.87596791982651 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
            { id: mod.RuntimeSpawn_Aftermath.BarrierConcreteWall_01_192x320, position: { x: -591.824768066406, y: 130.655792236328, z: -51.1680221557617 }, rotation: { x: 0.0, y: -0.43999031186104, z: 0.0, w: 0.89800250530243 }, scale: { x: 0.99999994039536, y: 1.0, z: 0.99999994039536 } },
            { id: mod.RuntimeSpawn_Aftermath.BarrierConcreteWall_01_192x320, position: { x: -593.36669921875, y: 130.655792236328, z: -52.4974098205566 }, rotation: { x: 0.0, y: -0.36843711137772, z: 0.0, w: 0.92965269088745 }, scale: { x: 1.00000011920929, y: 1.0, z: 1.00000011920929 } },
            { id: mod.RuntimeSpawn_Aftermath.BarrierConcreteWall_01_192x320, position: { x: -594.970520019531, y: 130.655792236328, z: -53.6850700378418 }, rotation: { x: 0.0, y: -0.31561198830605, z: 0.0, w: 0.94888836145401 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
            { id: mod.RuntimeSpawn_Aftermath.BarrierConcreteWall_01_192x320, position: { x: -596.591430664063, y: 130.655792236328, z: -54.8339691162109 }, rotation: { x: 0.0, y: -0.29830396175385, z: 0.0, w: 0.95447093248367 }, scale: { x: 0.99999988079071, y: 1.0, z: 0.99999988079071 } },
            { id: mod.RuntimeSpawn_Aftermath.BarrierConcreteWall_01_192x320, position: { x: -598.341003417969, y: 130.655792236328, z: -55.8846397399902 }, rotation: { x: 0.0, y: -0.278853058815, z: 0.0, w: 0.96033376455307 }, scale: { x: 0.99999988079071, y: 1.0, z: 0.99999988079071 } },
            { id: mod.RuntimeSpawn_Aftermath.BarrierConcreteWall_01_192x320, position: { x: -600.078430175781, y: 130.655792236328, z: -56.8603630065918 }, rotation: { x: 0.0, y: -0.23663067817688, z: 0.0, w: 0.97159969806671 }, scale: { x: 0.99999976158142, y: 1.0, z: 0.99999976158142 } },
            { id: mod.RuntimeSpawn_Aftermath.BarrierConcreteWall_01_192x320, position: { x: -601.933837890625, y: 130.655792236328, z: -57.3839492797852 }, rotation: { x: 0.0, y: -0.18079833686352, z: 0.0, w: 0.98352020978928 }, scale: { x: 0.99999994039536, y: 1.0, z: 0.99999994039536 } },
            { id: mod.RuntimeSpawn_Aftermath.BarrierConcreteWall_01_192x320, position: { x: -603.869812011719, y: 130.655792236328, z: -57.982120513916 }, rotation: { x: 0.0, y: -0.15443904697895, z: 0.0, w: 0.9880023598671 }, scale: { x: 0.99999988079071, y: 1.0, z: 0.99999988079071 } },
            { id: mod.RuntimeSpawn_Aftermath.BarrierConcreteWall_01_192x320, position: { x: -605.860961914063, y: 130.655792236328, z: -58.2121162414551 }, rotation: { x: 0.0, y: -0.09184513241053, z: 0.0, w: 0.99577331542969 }, scale: { x: 0.99999982118607, y: 1.0, z: 0.99999982118607 } },
            { id: mod.RuntimeSpawn_Aftermath.BarrierConcreteWall_01_192x320, position: { x: -607.859008789063, y: 130.655792236328, z: -58.3958969116211 }, rotation: { x: 0.0, y: -0.0612186640501, z: 0.0, w: 0.99812436103821 }, scale: { x: 0.99999988079071, y: 1.0, z: 0.99999988079071 } },
            { id: mod.RuntimeSpawn_Aftermath.BarrierConcreteWall_01_192x320, position: { x: -609.7666015625, y: 130.655792236328, z: -58.3958969116211 }, rotation: { x: 0.0, y: -0.0185215100646, z: 0.0, w: 0.99982845783234 }, scale: { x: 0.99999988079071, y: 1.0, z: 0.99999988079071 } },
            { id: mod.RuntimeSpawn_Aftermath.BarrierConcreteWall_01_192x320, position: { x: -585.633361816406, y: 130.668792724609, z: -34.5872497558594 }, rotation: { x: 0.0, y: -0.70710676908493, z: 0.0, w: 0.70710676908493 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
            { id: mod.RuntimeSpawn_Aftermath.BarrierConcreteWall_01_192x320, position: { x: -607.961486816406, y: 130.655792236328, z: -9.03469467163086 }, rotation: { x: 0.0, y: 0.99998146295547, z: 0.0, w: 0.00609120493755 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
            { id: mod.RuntimeSpawn_Aftermath.BarrierConcreteWall_01_192x320, position: { x: -605.987609863281, y: 130.655792236328, z: -9.451171875 }, rotation: { x: 0.0, y: 0.99598735570908, z: 0.0, w: -0.08949402719736 }, scale: { x: 0.99999994039536, y: 1.0, z: 0.99999994039536 } },
            { id: mod.RuntimeSpawn_Aftermath.BarrierConcreteWall_01_192x320, position: { x: -604.01171875, y: 130.655792236328, z: -9.90424537658691 }, rotation: { x: 0.0, y: 0.99286073446274, z: 0.0, w: -0.11927905678749 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
            { id: mod.RuntimeSpawn_Aftermath.BarrierConcreteWall_01_192x320, position: { x: -602.131591796875, y: 130.655792236328, z: -10.5577201843262 }, rotation: { x: 0.0, y: 0.99018901586533, z: 0.0, w: -0.13973473012447 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
            { id: mod.RuntimeSpawn_Aftermath.BarrierConcreteWall_01_192x320, position: { x: -600.2060546875, y: 130.655792236328, z: -11.1257972717285 }, rotation: { x: 0.0, y: 0.98734885454178, z: 0.0, w: -0.15856298804283 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
            { id: mod.RuntimeSpawn_Aftermath.BarrierConcreteWall_01_192x320, position: { x: -598.455139160156, y: 130.655792236328, z: -11.8342571258545 }, rotation: { x: 0.0, y: 0.97567629814148, z: 0.0, w: -0.21921616792679 }, scale: { x: 0.99999994039536, y: 1.0, z: 0.99999994039536 } },
            { id: mod.RuntimeSpawn_Aftermath.BarrierConcreteWall_01_192x320, position: { x: -596.583374023438, y: 130.655792236328, z: -12.8165321350098 }, rotation: { x: 0.0, y: 0.96916109323502, z: 0.0, w: -0.24642796814442 }, scale: { x: 0.99999994039536, y: 1.0, z: 0.99999994039536 } },
            { id: mod.RuntimeSpawn_Aftermath.BarrierConcreteWall_01_192x320, position: { x: -594.821838378906, y: 130.655792236328, z: -13.7892246246338 }, rotation: { x: 0.0, y: 0.96216696500778, z: 0.0, w: -0.27246057987213 }, scale: { x: 1.00000011920929, y: 1.0, z: 1.00000011920929 } },
            { id: mod.RuntimeSpawn_Aftermath.BarrierConcreteWall_01_192x320, position: { x: -593.236267089844, y: 130.655792236328, z: -15.0471649169922 }, rotation: { x: 0.0, y: 0.94805896282196, z: 0.0, w: -0.31809467077255 }, scale: { x: 1.00000011920929, y: 1.0, z: 1.00000011920929 } },
            { id: mod.RuntimeSpawn_Aftermath.BarrierConcreteWall_01_192x320, position: { x: -591.88818359375, y: 130.655792236328, z: -16.5727844238281 }, rotation: { x: 0.0, y: 0.92028832435608, z: 0.0, w: -0.39124092459679 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
            { id: mod.RuntimeSpawn_Aftermath.BarrierConcreteWall_01_192x320, position: { x: -590.681091308594, y: 130.655792236328, z: -18.1620197296143 }, rotation: { x: 0.0, y: 0.8968477845192, z: 0.0, w: -0.44233936071396 }, scale: { x: 0.99999988079071, y: 1.0, z: 0.99999988079071 } },
            { id: mod.RuntimeSpawn_Aftermath.BarrierConcreteWall_01_192x320, position: { x: -589.512512207031, y: 130.655792236328, z: -19.7688140869141 }, rotation: { x: 0.0, y: 0.8886553645134, z: 0.0, w: -0.45857563614845 }, scale: { x: 0.99999982118607, y: 1.0, z: 0.99999982118607 } },
            { id: mod.RuntimeSpawn_Aftermath.BarrierConcreteWall_01_192x320, position: { x: -588.440612792969, y: 130.655792236328, z: -21.5054569244385 }, rotation: { x: 0.0, y: 0.87915641069412, z: 0.0, w: -0.47653338313103 }, scale: { x: 0.99999988079071, y: 1.0, z: 0.99999988079071 } },
            { id: mod.RuntimeSpawn_Aftermath.BarrierConcreteWall_01_192x320, position: { x: -587.44384765625, y: 130.655792236328, z: -23.2308692932129 }, rotation: { x: 0.0, y: -0.85749763250351, z: 0.0, w: 0.51448792219162 }, scale: { x: 0.99999994039536, y: 1.0, z: 0.99999994039536 } },
            { id: mod.RuntimeSpawn_Aftermath.BarrierConcreteWall_01_192x320, position: { x: -586.897644042969, y: 130.655792236328, z: -25.0797595977783 }, rotation: { x: 0.0, y: -0.82673972845078, z: 0.0, w: 0.56258463859558 }, scale: { x: 0.99999976158142, y: 1.0, z: 0.99999976158142 } },
            { id: mod.RuntimeSpawn_Aftermath.BarrierConcreteWall_01_192x320, position: { x: -586.275939941406, y: 130.655792236328, z: -27.0083045959473 }, rotation: { x: 0.0, y: -0.81140333414078, z: 0.0, w: 0.58448666334152 }, scale: { x: 0.99999982118607, y: 1.0, z: 0.99999982118607 } },
            { id: mod.RuntimeSpawn_Aftermath.BarrierConcreteWall_01_192x320, position: { x: -586.021728515625, y: 130.655792236328, z: -28.9965057373047 }, rotation: { x: 0.0, y: -0.77294141054153, z: 0.0, w: 0.63447737693787 }, scale: { x: 0.99999988079071, y: 1.0, z: 0.99999988079071 } },
            { id: mod.RuntimeSpawn_Aftermath.BarrierConcreteWall_01_192x320, position: { x: -585.813659667969, y: 130.655792236328, z: -30.9921646118164 }, rotation: { x: 0.0, y: -0.75309014320374, z: 0.0, w: 0.65791738033295 }, scale: { x: 0.99999982118607, y: 1.0, z: 0.99999982118607 } },
            { id: mod.RuntimeSpawn_Aftermath.BarrierConcreteWall_01_192x320, position: { x: -585.790405273438, y: 130.655792236328, z: -32.8996162414551 }, rotation: { x: 0.0, y: -0.72429543733597, z: 0.0, w: 0.68948978185654 }, scale: { x: 0.99999982118607, y: 1.0, z: 0.99999982118607 } },
            { id: mod.RuntimeSpawn_Aftermath.BarrierConcreteWall_01_192x320, position: { x: -609.891235351563, y: 130.668792724609, z: -9.05820465087891 }, rotation: { x: 0.0, y: 0.99998146295547, z: 0.0, w: 0.00609120493755 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
            { id: mod.RuntimeSpawn_Aftermath.BarrierConcreteWall_01_192x320, position: { x: -635.52783203125, y: 130.655792236328, z: -31.0842475891113 }, rotation: { x: 0.0, y: 0.70278656482697, z: 0.0, w: 0.71140074729919 }, scale: { x: 0.99999994039536, y: 1.0, z: 0.99999994039536 } },
            { id: mod.RuntimeSpawn_Aftermath.BarrierConcreteWall_01_192x320, position: { x: -635.111328125, y: 130.655792236328, z: -29.1103591918945 }, rotation: { x: 0.0, y: 0.76755124330521, z: 0.0, w: 0.64098757505417 }, scale: { x: 1.00000011920929, y: 1.0, z: 1.00000011920929 } },
            { id: mod.RuntimeSpawn_Aftermath.BarrierConcreteWall_01_192x320, position: { x: -634.658264160156, y: 130.655792236328, z: -27.1344680786133 }, rotation: { x: 0.0, y: 0.78640162944794, z: 0.0, w: 0.61771553754807 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
            { id: mod.RuntimeSpawn_Aftermath.BarrierConcreteWall_01_192x320, position: { x: -634.004821777344, y: 130.655792236328, z: -25.2543487548828 }, rotation: { x: 0.0, y: 0.79897677898407, z: 0.0, w: 0.60136193037033 }, scale: { x: 0.99999994039536, y: 1.0, z: 0.99999994039536 } },
            { id: mod.RuntimeSpawn_Aftermath.BarrierConcreteWall_01_192x320, position: { x: -633.436706542969, y: 130.655792236328, z: -23.328800201416 }, rotation: { x: 0.0, y: 0.81028211116791, z: 0.0, w: 0.58604007959366 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
            { id: mod.RuntimeSpawn_Aftermath.BarrierConcreteWall_01_192x320, position: { x: -632.728271484375, y: 130.655792236328, z: -21.5778961181641 }, rotation: { x: 0.0, y: 0.84491658210754, z: 0.0, w: 0.53489810228348 }, scale: { x: 0.99999994039536, y: 1.0, z: 0.99999994039536 } },
            { id: mod.RuntimeSpawn_Aftermath.BarrierConcreteWall_01_192x320, position: { x: -631.745971679688, y: 130.655792236328, z: -19.7061195373535 }, rotation: { x: 0.0, y: 0.85955131053925, z: 0.0, w: 0.51104950904846 }, scale: { x: 0.99999994039536, y: 1.0, z: 0.99999994039536 } },
            { id: mod.RuntimeSpawn_Aftermath.BarrierConcreteWall_01_192x320, position: { x: -630.773315429688, y: 130.655792236328, z: -17.9445915222168 }, rotation: { x: 0.0, y: 0.87301349639893, z: 0.0, w: 0.4876960515976 }, scale: { x: 0.99999994039536, y: 1.0, z: 0.99999994039536 } },
            { id: mod.RuntimeSpawn_Aftermath.BarrierConcreteWall_01_192x320, position: { x: -629.515380859375, y: 130.655792236328, z: -16.3590278625488 }, rotation: { x: 0.0, y: 0.8953058719635, z: 0.0, w: 0.44545194506645 }, scale: { x: 1.00000011920929, y: 1.0, z: 1.00000011920929 } },
            { id: mod.RuntimeSpawn_Aftermath.BarrierConcreteWall_01_192x320, position: { x: -627.98974609375, y: 130.655792236328, z: -15.0109367370605 }, rotation: { x: 0.0, y: 0.92739123106003, z: 0.0, w: 0.37409299612045 }, scale: { x: 0.99999994039536, y: 1.0, z: 0.99999994039536 } },
            { id: mod.RuntimeSpawn_Aftermath.BarrierConcreteWall_01_192x320, position: { x: -626.400512695313, y: 130.655792236328, z: -13.8038520812988 }, rotation: { x: 0.0, y: 0.94694823026657, z: 0.0, w: 0.32138600945473 }, scale: { x: 0.99999976158142, y: 1.0, z: 0.99999976158142 } },
            { id: mod.RuntimeSpawn_Aftermath.BarrierConcreteWall_01_192x320, position: { x: -624.793762207031, y: 130.655792236328, z: -12.6352729797363 }, rotation: { x: 0.0, y: 0.95263624191284, z: 0.0, w: 0.3041122853756 }, scale: { x: 0.99999970197678, y: 1.0, z: 0.99999970197678 } },
            { id: mod.RuntimeSpawn_Aftermath.BarrierConcreteWall_01_192x320, position: { x: -623.057067871094, y: 130.655792236328, z: -11.5633735656738 }, rotation: { x: 0.0, y: 0.95861738920212, z: 0.0, w: 0.28469747304916 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
            { id: mod.RuntimeSpawn_Aftermath.BarrierConcreteWall_01_192x320, position: { x: -621.331665039063, y: 130.655792236328, z: -10.5666046142578 }, rotation: { x: 0.0, y: 0.97014033794403, z: 0.0, w: 0.2425444573164 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
            { id: mod.RuntimeSpawn_Aftermath.BarrierConcreteWall_01_192x320, position: { x: -619.482788085938, y: 130.655792236328, z: -10.0204048156738 }, rotation: { x: 0.0, y: 0.98240065574646, z: 0.0, w: 0.18678578734398 }, scale: { x: 0.99999988079071, y: 1.0, z: 0.99999988079071 } },
            { id: mod.RuntimeSpawn_Aftermath.BarrierConcreteWall_01_192x320, position: { x: -617.554260253906, y: 130.655792236328, z: -9.39870071411133 }, rotation: { x: 0.0, y: 0.98704326152802, z: 0.0, w: 0.1604543030262 }, scale: { x: 0.99999982118607, y: 1.0, z: 0.99999982118607 } },
            { id: mod.RuntimeSpawn_Aftermath.BarrierConcreteWall_01_192x320, position: { x: -615.566040039063, y: 130.655792236328, z: -9.14448165893555 }, rotation: { x: 0.0, y: 0.99519538879395, z: 0.0, w: 0.09790886193514 }, scale: { x: 1.00000011920929, y: 1.0, z: 1.00000011920929 } },
            { id: mod.RuntimeSpawn_Aftermath.BarrierConcreteWall_01_192x320, position: { x: -613.570373535156, y: 130.655792236328, z: -8.93641662597656 }, rotation: { x: 0.0, y: 0.99773299694061, z: 0.0, w: 0.06729725748301 }, scale: { x: 0.99999982118607, y: 1.0, z: 0.99999982118607 } },
            { id: mod.RuntimeSpawn_Aftermath.BarrierConcreteWall_01_192x320, position: { x: -611.662963867188, y: 130.655792236328, z: -8.91316986083984 }, rotation: { x: 0.0, y: 0.99969708919525, z: 0.0, w: 0.02461130358279 }, scale: { x: 0.99999994039536, y: 1.0, z: 0.99999994039536 } },
            { id: mod.RuntimeSpawn_Aftermath.BarrierConcreteWall_01_192x320, position: { x: -635.504333496094, y: 130.668792724609, z: -33.0139999389648 }, rotation: { x: 0.0, y: 0.70278656482697, z: 0.0, w: 0.71140074729919 }, scale: { x: 0.99999994039536, y: 1.0, z: 0.99999994039536 } },
        ]
    ]


    static spawnedPlatformsByRing: Map<number, any[]> = new Map();

    static KillHeight: number = 120;

    static gameState = GameState.WaitingForPlayers

    static currentRound: number = 0

    static ArenaCenterPoint = { x: -610.539794921875, y: 133.235931396484, z: -34.5330657958984 }
    static ArenaSize = 25
    static SpawnPointsRadios = 20;

    static VehiclesSpawned: mod.Vehicle[] = []
    static vehicleSpawners: mod.VehicleSpawner[] = []

    static playersInGame: mod.Player[] = [];
    static winAmount: number = 3;

    static minPlayers: number = 2
    static maxPlayers: number = 5;

    static countdowntime = 150;
    static currentCountdownTime = 150

    static WinnerPosition = { x: -571.634155273438, y: 142.420501708984, z: -113.144958496094 }
    static winnerDir = 65
    static LosserPlayerPosition = { x: -576.99169921875, y: 141.121307373047, z: -129.16227722168 }
    static LosserPlayerPositionEnd = { x: -566.721130371094, y: 141.121307373047, z: -129.16227722168 }

    static LobbyPosition = { x: -619.461975097656, y: 139.212005615234, z: -130.403701782227 }

    static GOcountDownStarted = false;
    static Gocountdowntime = 3;
    static GOCurrentCountdownTime = 3

    static RandomVehicle = true
    static #Vehicles: mod.VehicleList[] = [mod.VehicleList.Vector, mod.VehicleList.Quadbike, mod.VehicleList.Abrams, mod.VehicleList.GolfCart]
    static VehiclesInPool: mod.VehicleList[] = []
    static targetVehicle: mod.VehicleList | null = null

    static debug: boolean = false

    static HoH_OnPlayerDeployed(player: mod.Player) {

        const playerProf = PlayerProfile.get(player)
        mod.RemoveEquipment(player, mod.InventorySlots.MeleeWeapon)
        mod.EnableInputRestriction(player, mod.RestrictedInputs.FireWeapon, true)

        HoH_UIGameCountdown.GlobalUpdate()
        HoH_UIScoreBoard.GlobalUpdate()

        if (mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier) && playerProf) {
            mod.AIEnableShooting(player, false)
            playerProf.ReadyUp()
        }

        if (this.gameState == GameState.WaitingForPlayers) {
            this.LobbyCountDown()
        }

        if (this.gameState == GameState.GameStartCountdown) {
            playerProf?.UI_ReadyUp.update()
            playerProf?.EnableReadyUpWorldIcon(true)
        }
    }

    static async LobbyCountDown() {

        if (PlayerProfile.GetAvailablePlayers().length < this.minPlayers) {
            return
        }

        if (this.gameState == GameState.GameStartCountdown) {
            return
        }

        this.gameState = GameState.GameStartCountdown


        PlayerProfile.GetAllPlayerProfiles().forEach(playerProfile => {
            playerProfile.EnableReadyUpWorldIcon(true)
        });

        mod.EnableInteractPoint(mod.GetInteractPoint(1), true)

        HoH_UIReadyUp.GlobalUpdate()

        const allgood = await this.CountDownTimer(this.countdowntime);

        if (allgood) {
            this.StartGame();
        } else {
            this.gameState = GameState.WaitingForPlayers
            HoH_UIGameCountdown.GlobalUpdate()
        }
        HoH_UIReadyUp.GlobalClose()
        HoH_UIScoreBoard.GlobalUpdate()
        PlayerProfile.GetAllPlayerProfiles().forEach(playerProfile => {
            playerProfile.EnableReadyUpWorldIcon(false)
        });
        mod.EnableInteractPoint(mod.GetInteractPoint(1), false)
    }

    static async CountDownTimer(time: number, abortEarly = true) {
        this.currentCountdownTime = time
        try {
            while (this.currentCountdownTime > 0) {
                HoH_UIGameCountdown.GlobalUpdate()
                this.currentCountdownTime--;
                await mod.Wait(1)

                if (PlayerProfile.GetAvailablePlayers().length < this.minPlayers && abortEarly) {
                    return false; // Abort: not enough players
                }

                if (PlayerProfile.IsAllPlayersReady() && abortEarly) {
                    return true; // Everyone ready early
                }
            }

            return true;

        } finally {
            this.currentCountdownTime = 0
            HoH_UIGameCountdown.GlobalUpdate()
        }
    }

    static async GoCountDownTimer(time: number) {

        try {
            this.GOCurrentCountdownTime = time
            while (this.GOCurrentCountdownTime > 0) {
                HoH_UIGOCountdown.GlobalUpdate()
                this.GOCurrentCountdownTime--;
                await mod.Wait(1)
            }

            return true;
        } finally {
            this.GOCurrentCountdownTime = 0
            HoH_UIGOCountdown.GlobalUpdate()
        }
    }

    static AddPlayerToGame(player: mod.Player) {
        if (PlayerProfile.get(player)) {
            if (!this.playersInGame.includes(player)) {
                this.playersInGame.push(player)
                console.log("Add player to game")
            } else {
                console.log("Player already in game")
            }
        }
    }

    static RemovePlayerFromGame(playerId: number) {
        this.playersInGame = this.playersInGame.filter(
            player => mod.GetObjId(player) !== playerId
        );


    }

    static async StartGame() {
        if (this.gameState == GameState.GameRoundIsRunning || this.gameState == GameState.GameOver) {
            console.log("Game is running")
            return
        }



        let availablePlayers = PlayerProfile.GetAvailablePlayers();

        if (availablePlayers.length <= 1) {
            this.gameState = GameState.WaitingForPlayers
            HoH_UIGameCountdown.GlobalUpdate()
            return
        }

        console.log("Game on: Players :" + PlayerProfile.playerInstances.length)
        this.gameState = GameState.GameRoundIsRunning
        this.currentRound += 1;

        this.CreateArena()

        this.AddAllValidPlayers()

        this.RestrictAllInputs(true)

        await this.SpawnVehiclesAndSeatPlayer()

        await this.GoCountDownTimer(this.Gocountdowntime)

        //FailSafe remove players not on the platform
        this.RemoveInvalidPlayersFromRound()

        this.RestrictAllInputs(false)
        this.RestrictWeaponFire(true)

        //Game on
        this.PlatformDeleteLoop()

        // If no players are available when the game starts, end the game early
        if (this.playersInGame.length <= 1) {
            this.RoundOver()
        }
    }


    static async RemoveInvalidPlayersFromRound() {
        this.playersInGame = this.playersInGame.filter(player => {
            // Skip null or undefined
            if (!player) return false;

            // Only keep valid players
            if (!mod.IsPlayerValid(player)) return false;

            // Distance check
            const distance = mod.DistanceBetween(
                mod.GetSoldierState(player, mod.SoldierStateVector.GetPosition),
                mod.CreateVector(this.ArenaCenterPoint.x, this.ArenaCenterPoint.y, this.ArenaCenterPoint.z)
            );

            return distance <= this.ArenaSize;
        });
    }


    static CreateArena() {
        // Despawn all old platforms
        this.spawnedPlatformsByRing.forEach(platforms => {
            platforms.forEach(platform => mod.UnspawnObject(platform));
        });

        this.spawnedPlatformsByRing.clear();

        // Create new platforms by ring
        this.platformRings.forEach((ring, ringIndex) => {
            const spawnedForRing: any[] = [];

            ring.forEach(platform => {
                const obj = HoH_Helpers.SpawnObjectFromGodot(platform as ObjectTransform);
                spawnedForRing.push(obj);
            });

            this.spawnedPlatformsByRing.set(ringIndex, spawnedForRing);
        });
    }
    static async PlatformDeleteLoop() {
        const currentRound = this.currentRound;
        let ringIndex = 5;
        let ringRadious = [5, 10, 15, 20, 23, 25]
        let ringAmountOfSmokes = [5, 10, 15, 20, 25, 25]

        while (this.gameState == GameState.GameRoundIsRunning && currentRound === this.currentRound && ringIndex >= 0) {
            await mod.Wait(2);

            if (currentRound != this.currentRound) {
                return
            }

            // Spawn smoke VFX around arena
            const spawnedSmokeVFX: any[] = [];
            const platformSmokePos = HoH_Helpers.getPointsAround(HoH_GameHandler.ArenaCenterPoint, ringRadious[ringIndex], ringAmountOfSmokes[ringIndex]);
            const offset = mod.CreateVector(0, -1.25, 0);

            for (const smokepos of platformSmokePos) {
                const position = mod.Add(mod.CreateVector(smokepos.x, smokepos.y, smokepos.z), offset);
                const vfx = mod.SpawnObject(mod.RuntimeSpawn_Common.FX_BASE_Smoke_Pillar_Black_L, position, mod.CreateVector(0, 0, 0));
                mod.EnableVFX(vfx, true);
                spawnedSmokeVFX.push(vfx);
            }

            await mod.Wait(8);

            // Clean up smoke VFX
            for (const vfx of spawnedSmokeVFX) {
                mod.EnableVFX(vfx, false);
            }

            await mod.Wait(5);

            // Clean up smoke VFX
            for (const vfx of spawnedSmokeVFX) {
                mod.UnspawnObject(vfx);
            }

            if (currentRound != this.currentRound) {
                return
            }

            // Delete platforms for this ring
            const platforms = this.spawnedPlatformsByRing.get(ringIndex);
            if (!platforms) {
                ringIndex -= 1;
                continue;
            }

            for (const p of platforms) {
                mod.MoveObjectOverTime(p, mod.CreateVector(0, -25, 0), mod.CreateVector(0, 0, 0), 5, false, false)
            }

            await mod.Wait(6)

            if (currentRound != this.currentRound) {
                return
            }

            for (const p of platforms) {
                mod.UnspawnObject(p);
            }
            this.spawnedPlatformsByRing.delete(ringIndex);

            ringIndex -= 1;

            await mod.Wait(13);
        }



    }

    static AddAllValidPlayers() {

        const players = PlayerProfile.GetAvailablePlayers()

        for (let index = 0; index < players.length; index++) {
            this.AddPlayerToGame(players[index])
        }
    }

    static async RestrictAllInputs(enabled: boolean) {
        PlayerProfile
            .GetAvailablePlayers().forEach((player, index) => {
                mod.EnableAllInputRestrictions(player, enabled)
            });
    }

    static async RestrictWeaponFire(enabled: boolean) {
        PlayerProfile
            .GetAvailablePlayers().forEach((player, index) => {
                mod.EnableInputRestriction(player, mod.RestrictedInputs.FireWeapon, enabled)
            });
    }

    static async SpawnVehiclesAndSeatPlayer() {

        if (this.RandomVehicle) {
            if (this.VehiclesInPool.length === 0) {
                this.VehiclesInPool = HoH_Helpers.shuffle(this.#Vehicles);

                if (this.VehiclesInPool[0] === this.targetVehicle && this.VehiclesInPool.length > 1) {
                    [this.VehiclesInPool[0], this.VehiclesInPool[1]] = [this.VehiclesInPool[1], this.VehiclesInPool[0]];
                }
            }
            const vehicle = this.VehiclesInPool.shift()!;
            this.targetVehicle = vehicle
        } else {
            this.targetVehicle = mod.VehicleList.Vector
        }

        this.vehicleSpawners.forEach(element => {
            mod.UnspawnObject(element)
        });
        this.vehicleSpawners = []

        const spawnpoints = HoH_Helpers.getPointsAround(HoH_GameHandler.ArenaCenterPoint, HoH_GameHandler.SpawnPointsRadios, this.playersInGame.length)

        for (let index = 0; index < this.playersInGame.length; index++) {
            const spawnPoint = spawnpoints[index];
            const player = this.playersInGame[index]

            if (player && spawnPoint) {
                const dir = HoH_Helpers.getDirectionVector(HoH_GameHandler.ArenaCenterPoint, spawnPoint)
                const rot = HoH_Helpers.directionToEuler(dir);
                const vehSpawner = mod.SpawnObject(mod.RuntimeSpawn_Common.VehicleSpawner, mod.CreateVector(spawnPoint.x, spawnPoint.y, spawnPoint.z), mod.CreateVector(rot.pitch, rot.yaw, rot.roll), mod.CreateVector(1, 1, 1))
                this.vehicleSpawners.push(vehSpawner)

                mod.SetVehicleSpawnerVehicleType(vehSpawner, this.targetVehicle)

                mod.ForceVehicleSpawnerSpawn(vehSpawner)
            }
        }


        await mod.Wait(1)

        //Vehicles have Hopefully spawned
        for (let index = 0; index < this.playersInGame.length; index++) {
            const player = this.playersInGame[index]
            const vehicle = HoH_GameHandler.VehiclesSpawned[index]

            if (vehicle && player) {
                mod.ForcePlayerToSeat(player, vehicle, 0)
            }
        }
        HoH_GameHandler.VehiclesSpawned = []
    }

    static AddVehicles(veh: mod.Vehicle) {
        if (!HoH_GameHandler.VehiclesSpawned.includes(veh)) {
            HoH_GameHandler.VehiclesSpawned.push(veh)
        }
    }


    static async RoundOver() {
        if (this.gameState != GameState.GameRoundIsRunning) {
            return
        }
        this.gameState = GameState.WaitingForNextRound

        console.log("Round over")
        if (this.playersInGame[0]) {
            const amountOfWins = PlayerProfile.get(this.playersInGame[0])?.AddWin()
            HoH_UIRoundWinner.GlobalUpdate(this.playersInGame[0])
            HoH_UIScoreBoard.GlobalUpdate()

            if (amountOfWins && amountOfWins >= this.winAmount) {
                this.GameOver(this.playersInGame[0])
                return
            }
        }

        await mod.Wait(1)

        this.UnspawnAllVehicles()

        this.ResetRoundPlayers()

        await this.CountDownTimer(25, false)

        this.DeployAllPlayers()

        await mod.Wait(0.1)
        this.StartGame()
    }


    static async DeployUndeployedPlayers() {
        let count = 0;

        while (count < 120) {
            let deadPlayerFound = false;

            PlayerProfile.playerInstances.forEach(player => {
                if (mod.GetSoldierState(player, mod.SoldierStateBool.IsDead)) {
                    deadPlayerFound = true;
                    mod.DeployPlayer(player);
                }
            });

            if (!deadPlayerFound) {
                return; // everyone is alive, no need to keep looping
            }

            count++;
            await mod.Wait(0.1);
        }
    }

    static platformObj: mod.Object[] = []
    static ActivateLooserPlatform(eventPlayer: mod.Player) {

        const winnerPlayer = PlayerProfile.get(eventPlayer)

        if (winnerPlayer && winnerPlayer.wonRounds >= 3) {
            //Activate Platform

            this.platformObj.forEach(platform => {
                mod.UnspawnObject(platform)
            });
        }
    }

    static async SpawnLooserPlatform() {

        this.loserPlatform.forEach(platform => {
            const obj = HoH_Helpers.SpawnObjectFromGodot(platform)
            this.platformObj.push(obj)
        });
    }

    static async GameOver(player: mod.Player) {
        console.log("Game Over")

        this.gameState = GameState.GameOver

        //this.DeployAllPlayers()

        await this.DeployUndeployedPlayers()
        this.SpawnLooserPlatform()

        this.UnspawnAllVehicles()
        this.RestrictAllInputs(true)
        const availablePlayers = PlayerProfile
            .GetAvailablePlayers()
            .filter(filterplayer => filterplayer !== player);


        const GetLoserSpawnPoints = HoH_Helpers.generateSpawnLine(this.LosserPlayerPosition, this.LosserPlayerPositionEnd, availablePlayers.length, "right", 0.1)

        for (let index = 0; index < GetLoserSpawnPoints.length; index++) {
            mod.Teleport(availablePlayers[index], mod.CreateVector(GetLoserSpawnPoints[index].position.x, GetLoserSpawnPoints[index].position.y, GetLoserSpawnPoints[index].position.z), 0)
        }

        mod.SetTeam(player, mod.GetTeam(1))
        mod.Teleport(player, mod.CreateVector(this.WinnerPosition.x, this.WinnerPosition.y, this.WinnerPosition.z), this.winnerDir)

        await mod.Wait(1)
        this.RestrictAllInputs(false)
        this.RestrictWeaponFire(true)

        await mod.Wait(1)
        this.SpawnVictoryFirework()

        // Allow the winner to shoot :)
        mod.AddEquipment(player, mod.Weapons.LMG_M_60)
        mod.EnableInputRestriction(player, mod.RestrictedInputs.FireWeapon, false)

        await mod.Wait(15)
        mod.EndGameMode(player)
    }


    static async SpawnVictoryFirework() {

        while (true) {

            for (let index = 0; index < 100; index++) {
                const obt = mod.GetVFX(1)
                const obt2 = mod.GetVFX(2)
                mod.EnableVFX(obt, true)
                mod.EnableVFX(obt2, true)
                await mod.Wait(0.2)
            }
            await mod.Wait(5)
        }

    }

    static ResetRoundPlayers() {

        console.log("ResetRoundPlayers" + this.playersInGame.length)

        this.playersInGame.forEach(player => {
            mod.Teleport(player, mod.CreateVector(this.LobbyPosition.x, this.LobbyPosition.y, this.LobbyPosition.z), 0)
        });
        this.playersInGame = []
    }



    static UnspawnAllVehicles() {
        this.vehicleSpawners.forEach(element => {
            mod.UnspawnObject(element)
        });
        this.vehicleSpawners = []
    }

    static DeployAllPlayers() {
        PlayerProfile.playerInstances.forEach(player => {
            mod.DeployPlayer(player)
        });
    }

    static HoH_OnGameModeStarted() {
        this.KillPlayersBelowYCords(HoH_GameHandler.KillHeight);
    }

    static HoH_OnPlayerDied(eventPlayer: mod.Player, eventOtherPlayer: mod.Player, eventDeathType: mod.DeathType, eventWeaponUnlock: mod.WeaponUnlock) {
        this.RemovePlayerFromGame(mod.GetObjId(eventPlayer))

        if (this.gameState == GameState.GameRoundIsRunning && this.playersInGame.length <= 1) {
            console.log("Round over player died")
            this.RoundOver()
        }
    }

    static async KillPlayersBelowYCords(ycord: number) {
        while (true) {
            PlayerProfile.playerInstances.forEach(player => {
                if (mod.IsPlayerValid(player) && mod.GetSoldierState(player, mod.SoldierStateBool.IsAlive)) {
                    const playerPos = mod.GetSoldierState(player, mod.SoldierStateVector.GetPosition);

                    if (mod.YComponentOf(playerPos) <= ycord) {
                        mod.SkipManDown(player, true)
                        const veh = mod.GetVehicleFromPlayer(player);
                        mod.DealDamage(veh, 9000);
                        mod.Kill(player);
                    }
                }
            });

            await mod.Wait(1);
        }
    }
}

// === HoH_Helpers.ts ===



interface ObjectTransform {
    id: mod.VehicleList | mod.RuntimeSpawn_FireStorm | mod.RuntimeSpawn_Common;
    position: Vector3;
    rotation: Vector4;
    scale: Vector3;
}


export interface SpawnPoint {
    position: Vector3;        // point on the line
    forwardPosition: Vector3; 
}

interface Vector3 {
    x: number;
    y: number;
    z: number;
}

interface Vector4 {
    x: number;
    y: number;
    z: number;
    w: number;
}


enum TeamAllegiance {
    "Friendly",
    "Enemy",
    "unknown"
}

class HoH_Helpers {

    static getRandomItem<T>(array: T[]): T {
        const randomIndex = Math.floor(Math.random() * array.length);
        return array[randomIndex];
    }
    static shuffle<T>(array: T[]): T[] {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    static directionToEuler(dir: { x: number; y: number; z: number }) {
        const yaw = Math.atan2(dir.x, dir.z);         // rotation around Y axis
        const pitch = Math.asin(-dir.y);              // rotation around X axis
        const roll = 0;                               // usually 0 unless tilted

        return { pitch, yaw, roll };
    }

    static normalize(value: number, min: number, max: number): number {
        return (value - min) / (max - min);
    }

    static Lerp(a: number, b: number, t: number): number {
        return a + (b - a) * t;
    }

    static getCenterPosition(objects: ObjectTransform[]): Vector3 | undefined {
        if (objects.length === 0) return undefined;

        let sumX = 0;
        let sumY = 0;
        let sumZ = 0;

        for (const obj of objects) {
            sumX += obj.position.x;
            sumY += obj.position.y;
            sumZ += obj.position.z;
        }

        const count = objects.length;
        return {
            x: sumX / count,
            y: sumY / count,
            z: sumZ / count
        };
    }
    static IsObjectIDsEqual(left: any, right: any) {

        if (left == undefined || right == undefined) {
            return false
        }

        return mod.GetObjId(left) == mod.GetObjId(right)
    }

    static GetAllNonAIPlayersInArray(players: mod.Array) {

        let arrayOfPlayers = []

        for (let i = 0; i < mod.CountOf(players); i++) {
            let player = mod.ValueInArray(players, i)
            if (!mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier)) {
                arrayOfPlayers.push(player)
            }
        }

        return arrayOfPlayers
    }


    static GetPlayersNearPoint(
        targetPoint: mod.Vector,
        range: number,
        includeAI: boolean = false
    ): mod.Player[] {

        return PlayerProfile.playerInstances.filter(x => {
            const dis = mod.DistanceBetween(targetPoint, mod.GetSoldierState(x, mod.SoldierStateVector.GetPosition))
            if (dis > range) return false

            const isAI = mod.GetSoldierState(x, mod.SoldierStateBool.IsAISoldier)
            return includeAI || !isAI
        })
    }

    static GetTeamAllegianceToPlayer(team: mod.Team | undefined, playerProfile: PlayerProfile): TeamAllegiance {

        if (!team) return TeamAllegiance.unknown;

        const playersTeam = mod.GetTeam(playerProfile.player);
        if (!playersTeam) return TeamAllegiance.unknown;

        return HoH_Helpers.IsObjectIDsEqual(team, playersTeam) ? TeamAllegiance.Friendly : TeamAllegiance.Enemy;
    }

    static MakeMessage(message: string, ...args: any[]) {
        switch (args.length) {
            case 0:
                return mod.Message(message);
            case 1:
                return mod.Message(message, args[0]);
            case 2:
                return mod.Message(message, args[0], args[1]);
            case 3:
                return mod.Message(message, args[0], args[1], args[2]);
            default:
                throw new Error("Invalid number of arguments");
        }
    }

    static SpawnObjectFromGodot(object: ObjectTransform) {

        const rotation = HoH_Helpers.quaternionToEuler(object.rotation)

        const obj = mod.SpawnObject(object.id as mod.RuntimeSpawn_FireStorm | mod.RuntimeSpawn_Common,
            mod.CreateVector(object.position.x, object.position.y, object.position.z),
            mod.CreateVector(rotation.x, rotation.y, rotation.z),
            mod.CreateVector(object.scale.x, object.scale.y, object.scale.z)
        )

        return obj
    }

    static clamp(value: number, min: number, max: number): number {
        return Math.min(Math.max(value, min), max);
    }


    static FormatTime(sec: number): [number, number, number] {
        const minutes = Math.floor(sec / 60);
        const seconds = Math.floor(sec % 60);
        const coolerSeconds = Math.floor((sec % 60) / 10);
        return [minutes, coolerSeconds, seconds];
    }

    static GetRandomInt(max: number) {
        return Math.floor(Math.random() * max);
    }

    static directionYaw(from: Vector3, to: Vector3): number {
        const dx = to.x - from.x;
        const dz = to.z - from.z;
        let angle = Math.atan2(dx, dz);
        if (angle < 0) angle += Math.PI * 2;
        return angle;
    }

    /**
     * Returns an array of points distributed evenly around a center point.
     *
     * @param center - The center point { x, y, z } or { x, y }.
     * @param radius - The distance from the center to each point.
     * @param numPoints - The total number of points to generate.
     * @returns Array of points in the same dimensionality as center.
     */
    static getPointsAround(
        center: { x: number; y: number; z: number },
        radius: number,
        numPoints: number
    ): { x: number; y: number; z: number }[] {
        const points = [];

        for (let i = 0; i < numPoints; i++) {
            const angle = (2 * Math.PI * i) / numPoints;

            const x = center.x + radius * Math.cos(angle);
            const z = center.z + radius * Math.sin(angle);
            const y = center.y; // keep Y fixed (height)

            points.push({ x, y, z });
        }

        return points;
    }

    /**
     * Returns a normalized direction vector from point A to point B.
     *
     * @param from - Starting point { x, y, z? }
     * @param to - Target point { x, y, z? }
     * @param normalize - Whether to normalize the result (default: true)
     * @returns Direction vector { x, y, z }
     */
    static getDirectionVector(from: { x: number, y: number, z: number }, to: { x: number, y: number, z: number }, flip: boolean = true) {
        let dx = to.x - from.x;
        let dy = to.y - from.y;
        let dz = to.z - from.z;

        if (flip) {
            dx *= -1;
            dy *= -1;
            dz *= -1;
        }

        const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (length === 0) return { x: 0, y: 0, z: 0 };

        return { x: dx / length, y: dy / length, z: dz / length };
    }

    static quaternionToEuler(
        q: { x: number, y: number, z: number, w: number },
        eps = 0.001
    ): { x: number, y: number, z: number } {
        const { x, y, z, w } = q;

        const sinr_cosp = 2 * (w * x + y * z);
        const cosr_cosp = 1 - 2 * (x * x + y * y);
        let roll = Math.atan2(sinr_cosp, cosr_cosp);

        const sinp = 2 * (w * y - z * x);
        let pitch: number;
        let yaw: number;

        if (Math.abs(sinp) > 0.999999) {
            pitch = Math.sign(sinp) * (Math.PI / 2);

            roll = 0;
            yaw = 2 * Math.atan2(z, w) + (sinp > 0 ? eps : -eps);
        } else {
            pitch = Math.asin(sinp);

            const siny_cosp = 2 * (w * z + x * y);
            const cosy_cosp = 1 - 2 * (y * y + z * z);
            yaw = Math.atan2(siny_cosp, cosy_cosp);
        }

        function norm(a: number) {
            while (a > Math.PI) a -= 2 * Math.PI;
            while (a < -Math.PI) a += 2 * Math.PI;
            return a;
        }

        return { x: norm(roll), y: norm(pitch), z: norm(yaw) };
    }

    static generateSpawnLine(
        start: Vector3,
        end: Vector3,
        count: number,
        direction: "left" | "right" = "left",
        distance: number = 10,
        up: Vector3 = { x: 0, y: 1, z: 0 }
    ): SpawnPoint[] {
        if (count < 2) {
            throw new Error("Count must be at least 2 to generate a line.");
        }

        const spawnPoints: SpawnPoint[] = [];

        // Forward vector along line
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const dz = end.z - start.z;
        const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const forward = { x: dx / len, y: dy / len, z: dz / len };

        // Compute left = up × forward (always "left", never flipped)
        const left = {
            x: up.y * forward.z - up.z * forward.y,
            y: up.z * forward.x - up.x * forward.z,
            z: up.x * forward.y - up.y * forward.x,
        };

        // Scale left vector to desired distance
        const sideScaled = { x: left.x * distance, y: left.y * distance, z: left.z * distance };

        // Step size
        const stepX = dx / (count - 1);
        const stepY = dy / (count - 1);
        const stepZ = dz / (count - 1);

        for (let i = 0; i < count; i++) {
            const position = {
                x: start.x + stepX * i,
                y: start.y + stepY * i,
                z: start.z + stepZ * i,
            };

            const forwardPosition = {
                x: position.x + sideScaled.x,
                y: position.y + sideScaled.y,
                z: position.z + sideScaled.z,
            };

            spawnPoints.push({ position, forwardPosition });
        }

        // Reverse array order if "right"
        if (direction === "right") {
            return spawnPoints.reverse();
        }

        return spawnPoints;
    }
}



// === HoH_PlayerHandler.ts ===








let uniqueID: number = 0;

class PlayerProfile {

    player: mod.Player;

    selectedVehicle: mod.VehicleList = mod.VehicleList.F22;
    playerID: number = -1;
    readyUp: boolean = false;
    wonRounds: number = 0;

    playerSpawnedVeh: mod.Vehicle | undefined;
    playerSpawnedVehSpawner: mod.VehicleSpawner | undefined;

    static playerInstances: mod.Player[] = [];

    static #allHoHPlayers: { [key: number]: PlayerProfile } = {};

    readyUpWorldIcon: mod.WorldIcon | undefined

    versionWidget: mod.UIWidget | undefined;

    UI_Header: HoH_UIGameCountdown
    UI_GO: HoH_UIGOCountdown
    UI_RoundWinner: HoH_UIRoundWinner
    UI_Scoreboard: HoH_UIScoreBoard
    UI_ReadyUp: HoH_UIReadyUp

    constructor(player: mod.Player) {
        this.player = player;
        this.playerID = uniqueID++;
        this.versionWidget = HoH_Debugger.CreateVersionUI(this);
        this.UI_Header = new HoH_UIGameCountdown(this)
        this.UI_GO = new HoH_UIGOCountdown(this)
        this.UI_RoundWinner = new HoH_UIRoundWinner(this)
        this.UI_Scoreboard = new HoH_UIScoreBoard(this)
        this.UI_ReadyUp = new HoH_UIReadyUp(this)
    }

    createWorldIcon(){
        if (!this.readyUpWorldIcon) {
            this.readyUpWorldIcon = mod.SpawnObject(mod.RuntimeSpawn_Common.WorldIcon, mod.CreateVector(-623.325012207031, 140.613006591797, -130.374053955078), mod.CreateVector(0, 0, 0))
            if (this.readyUpWorldIcon) {
                mod.SetWorldIconOwner(this.readyUpWorldIcon, this.player)
                mod.SetWorldIconImage(this.readyUpWorldIcon,mod.WorldIconImages.Alert)
                mod.SetWorldIconColor(this.readyUpWorldIcon,mod.CreateVector(0,1,0))
                this.EnableReadyUpWorldIcon(false)
            }
        }

    }

    EnableReadyUpWorldIcon(activate: boolean) {
        this.createWorldIcon()
        this.readyUpWorldIcon && mod.EnableWorldIconImage(this.readyUpWorldIcon, activate)
    }

    CloseAllUI() {
        this.versionWidget && mod.SetUIWidgetVisible(this.versionWidget, false)
        this.UI_Header.Close()
        this.UI_GO.Close()
        this.UI_RoundWinner.Close()
        this.UI_Scoreboard.Close()
        this.UI_ReadyUp.Close()
    }

    DeleteAllUI() {
        this.versionWidget && mod.DeleteUIWidget(this.versionWidget)
        this.UI_Header.Delete()
        this.UI_GO.Delete()
        this.UI_RoundWinner.Delete()
        this.UI_Scoreboard.Delete()
        this.UI_ReadyUp.Delete()

        if (this.readyUpWorldIcon) [
            mod.UnspawnObject(this.readyUpWorldIcon)
        ]

    }

    AddWin() {
        console.log("Add round win to player")
        this.wonRounds += 1
        return this.wonRounds
    }

    ReadyUp() {
        if (HoH_GameHandler.gameState == GameState.WaitingForPlayers || HoH_GameHandler.gameState == GameState.GameStartCountdown) {
            if (this.readyUp) {
                this.readyUp = false
            } else {
                this.readyUp = true
            }
            this.UI_ReadyUp.update()
            HoH_UIScoreBoard.GlobalUpdate()
        }
    }

    static get(player: mod.Player) {
        if (mod.GetObjId(player) > -1) {
            let index = mod.GetObjId(player);

            let hohPlayer = this.#allHoHPlayers[index];
            if (!hohPlayer) {
                hohPlayer = new PlayerProfile(player);

                this.#allHoHPlayers[index] = hohPlayer;
                this.playerInstances.push(player)
            }
            return hohPlayer;
        }
        return undefined;
    }

    async DeletePlayerWidgets() {
        this.versionWidget && mod.DeleteUIWidget(this.versionWidget)
    }

    DestroyVehicle() {

        if (this.playerSpawnedVeh) {
            mod.DealDamage(this.playerSpawnedVeh, 9999)
        }
        if (this.playerSpawnedVehSpawner) {
            mod.UnspawnObject(this.playerSpawnedVehSpawner)
            this.playerSpawnedVehSpawner = undefined;
        }
    }

    SetVehicle(vehicle: mod.VehicleList) {
        this.selectedVehicle = vehicle
    }


    static removePlayer(playerID: number) {
        let hohPlayer = this.#allHoHPlayers[playerID];
        if (hohPlayer) {
            this.playerInstances = this.playerInstances.filter(item => mod.GetObjId(item) !== playerID);
            delete this.#allHoHPlayers[playerID];
        }
    }

    static IsAllPlayersReady() {
        const availablePlayers = this.GetAvailablePlayers();

        // Find any player who is NOT ready
        const notReadyPlayer = availablePlayers.find(
            x => PlayerProfile.get(x)?.readyUp === false
        );

        // If we found someone not ready -  false
        if (notReadyPlayer) {
            return false;
        }

        // Otherwise, all are ready -  true
        return true;
    }

    static GetAvailablePlayers() {
        const players = mod.AllPlayers();
        const n = mod.CountOf(players);
        let validPlayers: mod.Player[] = []

        for (let index = 0; index < n; index++) {
            const player = mod.ValueInArray(players, index);
            if (mod.IsPlayerValid(player) && mod.GetSoldierState(player, mod.SoldierStateBool.IsAlive)) {
                validPlayers.push(player)
            }
        }
        return validPlayers
    }

    static GetAllPlayerProfiles() {
        return Object.values(this.#allHoHPlayers);
    }


    static removeInvalidPlayers() {

        // Remove invalid from array
        PlayerProfile.playerInstances = PlayerProfile.playerInstances.filter(player =>
            this.isValidPlayer(player)
        );

        // Remove invalid from object
        for (const id in PlayerProfile.#allHoHPlayers) {
            const playerProf = PlayerProfile.#allHoHPlayers[id];
            if (!this.isValidPlayer(playerProf.player)) {
                playerProf.DeleteAllUI()
                delete PlayerProfile.#allHoHPlayers[id];
            }
        }

        HoH_UIScoreBoard.GlobalUpdate()
    }

    static isValidPlayer(player: mod.Player | null | undefined): boolean {
        // Check for null/undefined before calling mod function
        return player != null && mod.IsPlayerValid(player);
    }



}

// === HoH_UIGameCountdown.ts ===








class HoH_UIGameCountdown {

    static instances: HoH_UIGameCountdown[] = [];

    uiID = "HoH_UIGameCountdown"

    #PlayerProfile: PlayerProfile

    private UiWidget: mod.UIWidget | undefined

    constructor(PlayerProfile: PlayerProfile) {
        this.#PlayerProfile = PlayerProfile
        HoH_UIGameCountdown.instances.push(this);
    }

    private widgets: WidgetEntry[] = []

    async Show() {
        if (!this.UiWidget) {
            this.UiWidget = this.CreateUI() as mod.UIWidget
            mod.SetUIWidgetDepth(this.UiWidget, mod.UIDepth.BelowGameUI)
        } else {
            if (this.UiWidget) {
                mod.SetUIWidgetVisible(this.UiWidget, true)
            }
        }

    }

    update() {

        if (HoH_GameHandler.gameState == GameState.WaitingForPlayers) {
            this.Show()
            this.widgets[0]?.widget && mod.SetUITextLabel(this.widgets[0].widget, toMessage(mod.stringkeys.playerRequired, [PlayerProfile.GetAvailablePlayers().length, HoH_GameHandler.minPlayers]))
        } else if (HoH_GameHandler.currentCountdownTime > 0) {
            this.Show()
            if (HoH_GameHandler.currentRound > 0) {
                this.widgets[0]?.widget && mod.SetUITextLabel(this.widgets[0].widget, toMessage(mod.stringkeys.nextRoundCountdowntime, [HoH_GameHandler.currentCountdownTime]))
            } else {
                this.widgets[0]?.widget && mod.SetUITextLabel(this.widgets[0].widget, toMessage(mod.stringkeys.countdowntime, [HoH_GameHandler.currentCountdownTime]))
            }
        } else {
            this.Close()
        }
    }

    static GlobalUpdate() {
        for (const instance of HoH_UIGameCountdown.instances) {
            instance.update();
        }
    }

    static GlobalClose() {
        for (const instance of HoH_UIGameCountdown.instances) {
            instance.Close();
        }
    }

    Delete() {
        if (this.UiWidget) {
            mod.DeleteUIWidget(this.UiWidget)
        }
        const i = HoH_UIGameCountdown.instances.indexOf(this);
        if (i !== -1) HoH_UIGameCountdown.instances.splice(i, 1);
    }

    Close() {
        if (this.UiWidget) {
            mod.SetUIWidgetVisible(this.UiWidget, false)
        }
    }

    CreateUI() {

        const children: UIParams[] = []

        const boxsize: number[] = [700, 125]


        children.push(
            {
                type: "Text",
                name: `${this.uiID}_Text_${this.#PlayerProfile.playerID}`,
                textLabel: { text: mod.stringkeys.playerRequired, arg: [PlayerProfile.GetAvailablePlayers().length, HoH_GameHandler.minPlayers] },
                position: [0, 30, 0],
                size: [boxsize[0], 25, 0],
                textSize: 28,
                bgColor: [1, 1, 1],
                textColor: [1, 1, 1],
                bgFill: mod.UIBgFill.None,
                textAnchor: mod.UIAnchor.Center,
                anchor: mod.UIAnchor.Center,
            },
            {
                type: "Container",
                name: `${this.uiID}_Line_${this.#PlayerProfile.playerID}`,
                position: [0, 0, 0],
                size: [250, 1, 0],
                bgColor: [1, 1, 1],
                bgFill: mod.UIBgFill.Solid,
                anchor: mod.UIAnchor.Center,
            },
            {
                type: "Text",
                name: `${this.uiID}2_Text_${this.#PlayerProfile.playerID}`,
                textLabel: { text: mod.stringkeys.gamemodeName },
                position: [0, -32, 0],
                size: boxsize,
                textSize: 50,
                bgFill: mod.UIBgFill.None,
                textColor: [1, 1, 1],
                textAnchor: mod.UIAnchor.Center,
                anchor: mod.UIAnchor.Center,
            }
        )

        const popup = ParseUI({
            type: "Container",
            name: `${this.uiID}_Container_${this.#PlayerProfile.playerID}`,
            position: [0, 130, 0],
            size: boxsize,
            anchor: mod.UIAnchor.TopCenter,
            bgColor: [1, 1, 1],
            bgFill: mod.UIBgFill.Blur,
            bgAlpha: 1,
            padding: 20,
            children: children,
            playerId: this.#PlayerProfile.player
        })

        this.widgets.push(
            { type: "text", widget: mod.FindUIWidgetWithName(`${this.uiID}_Text_${this.#PlayerProfile.playerID}`) },
            { type: "background", widget: mod.FindUIWidgetWithName(`${this.uiID}_Line_${this.#PlayerProfile.playerID}`) },
            { type: "text", widget: mod.FindUIWidgetWithName(`${this.uiID}2_Text_${this.#PlayerProfile.playerID}`) },
            { type: "background", widget: mod.FindUIWidgetWithName(`${this.uiID}_Container_${this.#PlayerProfile.playerID}`) },
        )

        return popup
    }


}


// === HoH_UIGOCountdown.ts ===







class HoH_UIGOCountdown {

    static instances: HoH_UIGOCountdown[] = [];

    uiID = "HoH_UIGOCountdown"

    #PlayerProfile: PlayerProfile

    private UiWidget: mod.UIWidget | undefined

    constructor(PlayerProfile: PlayerProfile) {
        this.#PlayerProfile = PlayerProfile
        HoH_UIGOCountdown.instances.push(this);
    }

    private widgets: WidgetEntry[] = []

    async Show() {
        if (!this.UiWidget) {
            this.UiWidget = this.CreateUI() as mod.UIWidget
            mod.SetUIWidgetDepth(this.UiWidget, mod.UIDepth.BelowGameUI)
        } else {
            if (this.UiWidget) {
                mod.SetUIWidgetVisible(this.UiWidget, true)
            }
        }

    }

    async update() {
        if (HoH_GameHandler.GOCurrentCountdownTime > 0) {
            this.Show()
            this.widgets[0]?.widget && mod.SetUITextLabel(this.widgets[0].widget, toMessage(mod.stringkeys.threeTwoOne, [HoH_GameHandler.GOCurrentCountdownTime]))
        } else {
            this.Show()
            this.widgets[0]?.widget && mod.SetUITextLabel(this.widgets[0].widget, toMessage(mod.stringkeys.go))
            await mod.Wait(2);
            this.Close()
        }
    }

    static GlobalUpdate() {
        for (const instance of HoH_UIGOCountdown.instances) {
            instance.update();
        }
    }

    static GlobalClose() {
        for (const instance of HoH_UIGOCountdown.instances) {
            instance.Close();
        }
    }

    Delete() {
        if (this.UiWidget) {
            mod.DeleteUIWidget(this.UiWidget)
        }
        const i = HoH_UIGOCountdown.instances.indexOf(this);
        if (i !== -1) HoH_UIGOCountdown.instances.splice(i, 1);
    }

    Close() {
        if (this.UiWidget) {
            mod.SetUIWidgetVisible(this.UiWidget, false)
        }
    }

    CreateUI() {

        const children: UIParams[] = []

        const boxsize: number[] = [125, 125]


        children.push(
            {
                type: "Text",
                name: `${this.uiID}_Text_${this.#PlayerProfile.playerID}`,
                textLabel: { text: mod.stringkeys.threeTwoOne, arg: [3] },
                position: [0, 0, 0],
                size: boxsize,
                textSize: 60,
                bgColor: [1, 1, 1],
                textColor: [1, 1, 1],
                bgFill: mod.UIBgFill.None,
                textAnchor: mod.UIAnchor.Center,
                anchor: mod.UIAnchor.Center,
            },
            {
                type: "Container",
                name: `${this.uiID}_leftLine_${this.#PlayerProfile.playerID}`,
                position: [-boxsize[0]/2, 0, 0],
                size: [1, boxsize[1], 0],
                anchor: mod.UIAnchor.Center,
                bgColor: [1, 1, 1],
                bgFill: mod.UIBgFill.Solid,
                bgAlpha: 1
            },
            {
                type: "Container",
                name: `${this.uiID}_rightLine_${this.#PlayerProfile.playerID}`,
                position: [boxsize[0]/2, 0, 0],
                size: [1, boxsize[1], 0],
                anchor: mod.UIAnchor.Center,
                bgColor: [1, 1, 1],
                bgFill: mod.UIBgFill.Solid,
                bgAlpha: 1
            }
        )

        const popup = ParseUI({
            type: "Container",
            name: `${this.uiID}_Container_${this.#PlayerProfile.playerID}`,
            position: [0, 30, 0],
            size: boxsize,
            anchor: mod.UIAnchor.TopCenter,
            bgColor: [1, 1, 1],
            bgFill: mod.UIBgFill.Blur,
            bgAlpha: 1,
            padding: 20,
            children: children,
            playerId: this.#PlayerProfile.player
        })

        this.widgets.push(
            { type: "text", widget: mod.FindUIWidgetWithName(`${this.uiID}_Text_${this.#PlayerProfile.playerID}`) },
            { type: "background", widget: mod.FindUIWidgetWithName(`${this.uiID}_Container_${this.#PlayerProfile.playerID}`) },
        )

        return popup
    }


}


// === HoH_UIHelpers.ts ===


enum buttonEventType {
    ButtonDown,
    ButtonUp,
    FocusIn,
    FocusOut,
    HoverIn,
    HoverOut,
    unknown
}

interface WidgetType {
    type: "text" | "background"
    widget: mod.UIWidget
}

let fadingWidget: Map<string, number> = new Map()


async function ShowWidget(widget: WidgetType[]) {
    widget.forEach(element => {
        mod.SetUIWidgetVisible(element.widget, true)
        if (element.type == "text") {
            mod.SetUITextAlpha(element.widget, 1)
        } else if (element.type == "background") {
            mod.SetUIWidgetBgAlpha(element.widget, 1)
        }
    });
}

async function FadeWidget(widgetID: string, widget: WidgetType[], time: number) {
    const tick = 0.1
    let currentTime = time

    const runningFade = fadingWidget.get(widgetID)

    if (runningFade !== undefined) {
        fadingWidget.set(widgetID, runningFade + 1)
    } else {
        fadingWidget.set(widgetID, 0)
    }

    const RunningID = fadingWidget.get(widgetID)!

    while (currentTime > 0) {
        const runningFade = fadingWidget.get(widgetID)

        if (RunningID !== runningFade) {
            return // newer fade started, cancel this one
        }

        widget.forEach(element => {
            if (element.type == "text") {
                mod.SetUITextAlpha(element.widget, HoH_Helpers.normalize(currentTime, 0, time))
            } else if (element.type == "background") {
                mod.SetUIWidgetBgAlpha(element.widget, HoH_Helpers.normalize(currentTime, 0, time))
            }
        });



        currentTime -= tick
        await mod.Wait(tick)
    }

    // make sure each widget is fully invisible at the end
    widget.forEach(element => {
        mod.SetUIWidgetVisible(element.widget, false)
        if (element.type == "text") {
            mod.SetUITextAlpha(element.widget, 0)
        } else {
            mod.SetUIWidgetBgAlpha(element.widget, 0)
        }
    });


}


export function GetButtonEventName(event: mod.UIButtonEvent): buttonEventType {
    if (mod.Equals(event, mod.UIButtonEvent.ButtonDown)) {
        return buttonEventType.ButtonDown;
    } else if (mod.Equals(event, mod.UIButtonEvent.ButtonUp)) {
        return buttonEventType.ButtonUp;
    } else if (mod.Equals(event, mod.UIButtonEvent.FocusIn)) {
        return buttonEventType.FocusIn;
    } else if (mod.Equals(event, mod.UIButtonEvent.FocusOut)) {
        return buttonEventType.FocusOut;
    } else if (mod.Equals(event, mod.UIButtonEvent.HoverIn)) {
        return buttonEventType.HoverIn;
    } else if (mod.Equals(event, mod.UIButtonEvent.HoverOut)) {
        return buttonEventType.HoverOut;
    } else {
        return buttonEventType.unknown;
    }

}

interface WidgetEntry {
    type: "text" | "background" | "image";
    widget: mod.UIWidget;
}

export type UIVector = mod.Vector | number[];

interface UIParamsBase {
    name?: string;
    type: string;
    position?: UIVector;
    size?: UIVector;
    anchor?: mod.UIAnchor;
    parent?: mod.UIWidget;
    visible?: boolean;
    padding?: number;
    bgColor?: UIVector;
    bgAlpha?: number;
    bgFill?: mod.UIBgFill;
    teamId?: mod.Team;
    playerId?: mod.Player;
    children?: UIParams[];
}

interface UIText {
    text: string
    arg?: number[] | mod.Player[]
}

interface UITextParams extends UIParamsBase {
    type: "Text";
    textLabel: UIText;
    textColor?: UIVector;
    textAlpha?: number;
    textSize?: number;
    textAnchor?: mod.UIAnchor;
}

interface UIImageParams extends UIParamsBase {
    type: "Image";
    imageType?: mod.UIImageType;
    imageColor?: UIVector;
    imageAlpha?: number;
}

interface UIButtonParams extends UIParamsBase {
    type: "Button";
    buttonEnabled?: boolean;
    buttonColorBase?: UIVector;
    buttonAlphaBase?: number;
    buttonColorDisabled?: UIVector;
    buttonAlphaDisabled?: number;
    buttonColorPressed?: UIVector;
    buttonAlphaPressed?: number;
    buttonColorHover?: UIVector;
    buttonAlphaHover?: number;
    buttonColorFocused?: UIVector;
    buttonAlphaFocused?: number;
}

interface UIContainerParams extends UIParamsBase {
    type: "Container";
}

type UIParams = UIContainerParams | UITextParams | UIImageParams | UIButtonParams;

type ResolvedContainer = Required<UIContainerParams>;
type ResolvedText = Required<UITextParams>;
type ResolvedImage = Required<UIImageParams>;
type ResolvedButton = Required<UIButtonParams>;

type ResolvedUIParams = ResolvedContainer | ResolvedText | ResolvedImage | ResolvedButton;

const defaults = {
    base: {
        name: "",
        position: mod.CreateVector(0, 0, 0) as mod.Vector,
        size: mod.CreateVector(100, 100, 0) as mod.Vector,
        anchor: mod.UIAnchor.TopLeft,
        parent: mod.GetUIRoot(),
        visible: true,
        padding: 8,
        bgColor: mod.CreateVector(0.25, 0.25, 0.25) as mod.Vector,
        bgAlpha: 0.5,
        bgFill: mod.UIBgFill.Solid,
        teamId: undefined as mod.Team | undefined,
        playerId: undefined as mod.Player | undefined,
        children: [] as UIParams[],
    },
    text: {
        textLabel: "",
        textColor: mod.CreateVector(1, 1, 1) as mod.Vector,
        textAlpha: 1,
        textSize: 0,
        textAnchor: mod.UIAnchor.CenterLeft,
    },
    image: {
        imageType: mod.UIImageType.None,
        imageColor: mod.CreateVector(1, 1, 1) as mod.Vector,
        imageAlpha: 1,
    },
    button: {
        buttonEnabled: true,
        buttonColorBase: mod.CreateVector(0.7, 0.7, 0.7) as mod.Vector,
        buttonAlphaBase: 1,
        buttonColorDisabled: mod.CreateVector(0.2, 0.2, 0.2) as mod.Vector,
        buttonAlphaDisabled: 0.5,
        buttonColorPressed: mod.CreateVector(0.25, 0.25, 0.25) as mod.Vector,
        buttonAlphaPressed: 1,
        buttonColorHover: mod.CreateVector(1, 1, 1) as mod.Vector,
        buttonAlphaHover: 1,
        buttonColorFocused: mod.CreateVector(1, 1, 1) as mod.Vector,
        buttonAlphaFocused: 1,
    },
};

export function toVector(param: UIVector): mod.Vector {
    if (Array.isArray(param)) {
        return mod.CreateVector(param[0], param[1], param.length === 2 ? 0 : param[2]);
    }
    return param;
}

export function toMessage(param?: string | mod.Message, args?: number[] | mod.Player[]): mod.Message {
    if (param == null) {
        return mod.Message("");
    }

    if (typeof param === "string") {
        if (!args) {
            return mod.Message(param);
        }
        switch (args.length) {
            case 0: return mod.Message(param);
            case 1: return mod.Message(param, args[0]);
            case 2: return mod.Message(param, args[0], args[1]);
            case 3: return mod.Message(param, args[0], args[1], args[2]);
            default:
                throw new Error("Invalid number of arguments");
        }
    }

    return param;
}

function mergeDefaults(params: UIParams): ResolvedUIParams {
    const mergedChildren = (params.children ?? []).map(child => mergeDefaults(child));

    switch (params.type) {
        case "Text":
            return {
                ...defaults.base,
                ...defaults.text,
                ...params,
                children: mergedChildren,
            } as ResolvedText;

        case "Image":
            return {
                ...defaults.base,
                ...defaults.image,
                ...params,
                children: mergedChildren,
            } as ResolvedImage;

        case "Button":
            return {
                ...defaults.base,
                ...defaults.button,
                ...params,
                children: mergedChildren,
            } as ResolvedButton;

        case "Container":
        default:
            return {
                ...defaults.base,
                ...params,
                children: mergedChildren,
            } as ResolvedContainer;
    }
}

const uniqueName = "----uniquename----";

export function setNameAndGetWidget(uniqueName: string, params: ResolvedUIParams): mod.UIWidget {
    const widget = mod.FindUIWidgetWithName(uniqueName) as mod.UIWidget;
    mod.SetUIWidgetName(widget, params.name);
    return widget;
}

export function addUIContainer(params: ResolvedContainer): mod.UIWidget {
    const restrict = params.teamId ?? params.playerId;
    if (restrict) {
        mod.AddUIContainer(
            uniqueName,
            toVector(params.position),
            toVector(params.size),
            params.anchor,
            params.parent,
            params.visible,
            params.padding,
            toVector(params.bgColor),
            params.bgAlpha,
            params.bgFill,
            restrict
        );
    } else {
        mod.AddUIContainer(
            uniqueName,
            toVector(params.position),
            toVector(params.size),
            params.anchor,
            params.parent,
            params.visible,
            params.padding,
            toVector(params.bgColor),
            params.bgAlpha,
            params.bgFill
        );
    }

    const widget = setNameAndGetWidget(uniqueName, params);

    params.children.forEach(child => {
        child.parent = widget;
        addUIWidget(mergeDefaults(child));
    });

    return widget;
}

export function addUIText(params: ResolvedText): mod.UIWidget {
    const restrict = params.teamId ?? params.playerId;
    if (restrict) {
        mod.AddUIText(
            uniqueName,
            toVector(params.position),
            toVector(params.size),
            params.anchor,
            params.parent,
            params.visible,
            params.padding,
            toVector(params.bgColor),
            params.bgAlpha,
            params.bgFill,
            toMessage(params.textLabel.text, params.textLabel.arg),
            params.textSize,
            toVector(params.textColor),
            params.textAlpha,
            params.textAnchor,
            restrict
        );
    } else {
        mod.AddUIText(
            uniqueName,
            toVector(params.position),
            toVector(params.size),
            params.anchor,
            params.parent,
            params.visible,
            params.padding,
            toVector(params.bgColor),
            params.bgAlpha,
            params.bgFill,
            toMessage(params.textLabel.text, params.textLabel.arg),
            params.textSize,
            toVector(params.textColor),
            params.textAlpha,
            params.textAnchor
        );
    }

    return setNameAndGetWidget(uniqueName, params);
}

export function addUIImage(params: ResolvedImage): mod.UIWidget {
    const restrict = params.teamId ?? params.playerId;
    if (restrict) {
        mod.AddUIImage(
            uniqueName,
            toVector(params.position),
            toVector(params.size),
            params.anchor,
            params.parent,
            params.visible,
            params.padding,
            toVector(params.bgColor),
            params.bgAlpha,
            params.bgFill,
            params.imageType,
            toVector(params.imageColor),
            params.imageAlpha,
            restrict
        );
    } else {
        mod.AddUIImage(
            uniqueName,
            toVector(params.position),
            toVector(params.size),
            params.anchor,
            params.parent,
            params.visible,
            params.padding,
            toVector(params.bgColor),
            params.bgAlpha,
            params.bgFill,
            params.imageType,
            toVector(params.imageColor),
            params.imageAlpha
        );
    }
    return setNameAndGetWidget(uniqueName, params);
}

export function addUIButton(params: ResolvedButton): mod.UIWidget {
    const restrict = params.teamId ?? params.playerId;
    if (restrict) {
        mod.AddUIButton(
            uniqueName,
            toVector(params.position),
            toVector(params.size),
            params.anchor,
            params.parent,
            params.visible,
            params.padding,
            toVector(params.bgColor),
            params.bgAlpha,
            params.bgFill,
            params.buttonEnabled,
            toVector(params.buttonColorBase),
            params.buttonAlphaBase,
            toVector(params.buttonColorDisabled),
            params.buttonAlphaDisabled,
            toVector(params.buttonColorPressed),
            params.buttonAlphaPressed,
            toVector(params.buttonColorHover),
            params.buttonAlphaHover,
            toVector(params.buttonColorFocused),
            params.buttonAlphaFocused,
            restrict
        );
    } else {
        mod.AddUIButton(
            uniqueName,
            toVector(params.position),
            toVector(params.size),
            params.anchor,
            params.parent,
            params.visible,
            params.padding,
            toVector(params.bgColor),
            params.bgAlpha,
            params.bgFill,
            params.buttonEnabled,
            toVector(params.buttonColorBase),
            params.buttonAlphaBase,
            toVector(params.buttonColorDisabled),
            params.buttonAlphaDisabled,
            toVector(params.buttonColorPressed),
            params.buttonAlphaPressed,
            toVector(params.buttonColorHover),
            params.buttonAlphaHover,
            toVector(params.buttonColorFocused),
            params.buttonAlphaFocused
        );
    }
    return setNameAndGetWidget(uniqueName, params);
}

export function addUIWidget(params: ResolvedUIParams): mod.UIWidget | undefined {
    if (!params) return undefined;

    switch (params.type) {
        case "Container":
            return addUIContainer(params as ResolvedContainer);
        case "Text":
            return addUIText(params as ResolvedText);
        case "Image":
            return addUIImage(params as ResolvedImage);
        case "Button":
            return addUIButton(params as ResolvedButton);
    }
    return undefined;
}

export function ParseUI(...params: UIParams[]): mod.UIWidget | undefined {
    let widget: mod.UIWidget | undefined;
    for (const p of params) {
        const merged = mergeDefaults(p);
        widget = addUIWidget(merged);
    }
    return widget;
}

// === HoH_UIReadyUp.ts ===








class HoH_UIReadyUp {

    static instances: HoH_UIReadyUp[] = [];

    uiID = "HoH_UIReadyUp"

    #PlayerProfile: PlayerProfile

    private UiWidget: mod.UIWidget | undefined

    constructor(PlayerProfile: PlayerProfile) {
        this.#PlayerProfile = PlayerProfile
        HoH_UIReadyUp.instances.push(this);
        //this.Show()
    }

    private widgets: WidgetEntry[] = []

    async Show() {
        if (!this.UiWidget) {
            this.UiWidget = this.CreateUI() as mod.UIWidget
            mod.SetUIWidgetDepth(this.UiWidget, mod.UIDepth.BelowGameUI)
        } else {
            if (this.UiWidget) {
                mod.SetUIWidgetVisible(this.UiWidget, true)
            }
        }

    }

    async update() {
        this.Show()
        if (this.#PlayerProfile.readyUp) {
            this.widgets[2]?.widget && mod.SetUIWidgetBgFill(this.widgets[2].widget, mod.UIBgFill.Solid)
            this.widgets[2]?.widget && mod.SetUIWidgetBgColor(this.widgets[2].widget, mod.CreateVector(0, 0.8, 0))
            this.widgets[0]?.widget && mod.SetUITextColor(this.widgets[0].widget, mod.CreateVector(0, 0, 0))
        } else {
            this.widgets[2]?.widget && mod.SetUIWidgetBgFill(this.widgets[2].widget, mod.UIBgFill.Blur)
            this.widgets[2]?.widget && mod.SetUIWidgetBgColor(this.widgets[2].widget, mod.CreateVector(1, 1, 1))
            this.widgets[0]?.widget && mod.SetUITextColor(this.widgets[0].widget, mod.CreateVector(1, 1, 1))
        }
    }

    static GlobalUpdate() {
        for (const instance of HoH_UIReadyUp.instances) {
            instance.update();
        }
    }

    static GlobalClose() {
        for (const instance of HoH_UIReadyUp.instances) {
            instance.Close();
        }
    }

    Delete() {
        if (this.UiWidget) {
            mod.DeleteUIWidget(this.UiWidget)
        }
        const i = HoH_UIReadyUp.instances.indexOf(this);
        if (i !== -1) HoH_UIReadyUp.instances.splice(i, 1);
    }

    Close() {
        if (this.UiWidget) {
            mod.SetUIWidgetVisible(this.UiWidget, false)
        }
    }

    CreateUI() {

        const children: UIParams[] = []

        const boxsize: number[] = [160, 50]

        children.push(
            {
                type: "Text",
                name: `${this.uiID}_Text_${this.#PlayerProfile.playerID}`,
                textLabel: { text: mod.stringkeys.readyUp },
                position: [0, 0, 0],
                size: boxsize,
                textSize: 40,
                bgColor: [1, 1, 1],
                textColor: [1, 1, 1],
                bgFill: mod.UIBgFill.None,
                textAnchor: mod.UIAnchor.Center,
                anchor: mod.UIAnchor.Center,
            },
            {
                type: "Container",
                name: `${this.uiID}_TopLine_${this.#PlayerProfile.playerID}`,
                position: [0, 0, 0],
                size: [170, 60],
                bgColor: [1, 1, 1],
                bgFill: mod.UIBgFill.OutlineThin,
                anchor: mod.UIAnchor.Center,
            },
        )

        const popup = ParseUI({
            type: "Container",
            name: `${this.uiID}_Container_${this.#PlayerProfile.playerID}`,
            position: [0, 25, 0],
            size: boxsize,
            anchor: mod.UIAnchor.BottomCenter,
            bgColor: [1, 1, 1],
            bgFill: mod.UIBgFill.Blur,
            bgAlpha: 1,
            padding: 20,
            children: children,
            playerId: this.#PlayerProfile.player
        })

        this.widgets.push(
            { type: "text", widget: mod.FindUIWidgetWithName(`${this.uiID}_Text_${this.#PlayerProfile.playerID}`) },
            { type: "background", widget: mod.FindUIWidgetWithName(`${this.uiID}_TopLine_${this.#PlayerProfile.playerID}`) },
            { type: "background", widget: mod.FindUIWidgetWithName(`${this.uiID}_Container_${this.#PlayerProfile.playerID}`) },

        )

        return popup
    }


}


// === HoH_UIRoundWinner.ts ===








class HoH_UIRoundWinner {

    static instances: HoH_UIRoundWinner[] = [];

    uiID = "HoH_UIRoundWinner"

    #PlayerProfile: PlayerProfile

    private UiWidget: mod.UIWidget | undefined

    constructor(PlayerProfile: PlayerProfile) {
        this.#PlayerProfile = PlayerProfile
        HoH_UIRoundWinner.instances.push(this);
    }

    private widgets: WidgetEntry[] = []

    async Show() {
        if (!this.UiWidget) {
            this.UiWidget = this.CreateUI() as mod.UIWidget
            mod.SetUIWidgetDepth(this.UiWidget, mod.UIDepth.BelowGameUI)
        } else {
            if (this.UiWidget) {
                mod.SetUIWidgetVisible(this.UiWidget, true)
            }
        }

    }

    async update(player: mod.Player) {
        this.Show()
        this.widgets[0]?.widget && mod.SetUITextLabel(this.widgets[0].widget, toMessage(mod.stringkeys.roundWinner, [player]))
        await mod.Wait(5)
        this.Close()
    }

    static GlobalUpdate(player: mod.Player) {
        for (const instance of HoH_UIRoundWinner.instances) {
            instance.update(player);
        }
    }

    static GlobalClose() {
        for (const instance of HoH_UIRoundWinner.instances) {
            instance.Close();
        }
    }

    Delete() {
        if (this.UiWidget) {
            mod.DeleteUIWidget(this.UiWidget)
        }
        const i = HoH_UIRoundWinner.instances.indexOf(this);
        if (i !== -1) HoH_UIRoundWinner.instances.splice(i, 1);
    }

    Close() {
        if (this.UiWidget) {
            mod.SetUIWidgetVisible(this.UiWidget, false)
        }
    }

    CreateUI() {

        const children: UIParams[] = []

        const boxsize: number[] = [700, 80]

        children.push(
            {
                type: "Text",
                name: `${this.uiID}_Text_${this.#PlayerProfile.playerID}`,
                textLabel: { text: mod.stringkeys.roundWinner, arg: [this.#PlayerProfile.player] },
                position: [0, 0, 0],
                size: [boxsize[0], 25, 0],
                textSize: 40,
                bgColor: [1, 1, 1],
                textColor: [1, 1, 1],
                bgFill: mod.UIBgFill.None,
                textAnchor: mod.UIAnchor.Center,
                anchor: mod.UIAnchor.Center,
            },
        )

        const popup = ParseUI({
            type: "Container",
            name: `${this.uiID}_Container_${this.#PlayerProfile.playerID}`,
            position: [0, 50, 0],
            size: boxsize,
            anchor: mod.UIAnchor.TopCenter,
            bgColor: [1, 1, 1],
            bgFill: mod.UIBgFill.Blur,
            bgAlpha: 1,
            padding: 20,
            children: children,
            playerId: this.#PlayerProfile.player
        })

        this.widgets.push(
            { type: "text", widget: mod.FindUIWidgetWithName(`${this.uiID}_Text_${this.#PlayerProfile.playerID}`) },
            { type: "background", widget: mod.FindUIWidgetWithName(`${this.uiID}_Container_${this.#PlayerProfile.playerID}`) },
        )

        return popup
    }


}


// === HoH_UIScoreboard.ts ===







class HoH_UIScoreBoard {

    static instances: HoH_UIScoreBoard[] = [];

    uiID = "HoH_UIScoreBoard"

    #PlayerProfile: PlayerProfile

    private UiWidget: mod.UIWidget | undefined

    static playersScoreBoard: PlayerProfile[] = []

    constructor(PlayerProfile: PlayerProfile) {
        this.#PlayerProfile = PlayerProfile
        HoH_UIScoreBoard.instances.push(this);
        HoH_UIScoreBoard.GlobalUpdate()
    }

    private widgets: WidgetEntry[] = []

    private ScoreBoardTextWidgets: WidgetEntry[] = []
    private ScoreBoardImage1Widgets: WidgetEntry[] = []
    private ScoreBoardImage2Widgets: WidgetEntry[] = []
    private ScoreBoardImage3Widgets: WidgetEntry[] = []

    async Show() {
        if (!this.UiWidget) {
            this.UiWidget = this.CreateUI() as mod.UIWidget
            mod.SetUIWidgetDepth(this.UiWidget, mod.UIDepth.BelowGameUI)
        } else {
            if (this.UiWidget) {
                mod.SetUIWidgetVisible(this.UiWidget, true)
            }
        }
    }

    async update() {
        this.Show()

        for (let index = 0; index < HoH_GameHandler.maxPlayers; index++) {

            const playerProf = HoH_UIScoreBoard.playersScoreBoard[index]

            if (playerProf) {
                mod.SetUIWidgetVisible(this.ScoreBoardTextWidgets[index].widget, true)

                mod.SetUIWidgetVisible(this.ScoreBoardImage1Widgets[index].widget, true)
                playerProf.wonRounds >= 1 ? mod.SetUIImageColor(this.ScoreBoardImage1Widgets[index].widget, mod.CreateVector(1, 1, 1)) : mod.SetUIImageColor(this.ScoreBoardImage1Widgets[index].widget, mod.CreateVector(0, 0, 0))

                mod.SetUIWidgetVisible(this.ScoreBoardImage2Widgets[index].widget, true)
                playerProf.wonRounds >= 2 ? mod.SetUIImageColor(this.ScoreBoardImage2Widgets[index].widget, mod.CreateVector(1, 1, 1)) : mod.SetUIImageColor(this.ScoreBoardImage2Widgets[index].widget, mod.CreateVector(0, 0, 0))

                mod.SetUIWidgetVisible(this.ScoreBoardImage3Widgets[index].widget, true)
                playerProf.wonRounds >= 3 ? mod.SetUIImageColor(this.ScoreBoardImage3Widgets[index].widget, mod.CreateVector(1, 1, 1)) : mod.SetUIImageColor(this.ScoreBoardImage3Widgets[index].widget, mod.CreateVector(0, 0, 0))


                mod.SetUITextLabel(this.ScoreBoardTextWidgets[index].widget, toMessage(mod.stringkeys.playerName, [playerProf.player]))

                if (HoH_GameHandler.gameState == GameState.WaitingForPlayers || HoH_GameHandler.gameState == GameState.GameStartCountdown) {

                    if (playerProf.readyUp) {
                        mod.SetUITextColor(this.ScoreBoardTextWidgets[index].widget, mod.CreateVector(0, 1, 0))
                    } else {
                        mod.SetUITextColor(this.ScoreBoardTextWidgets[index].widget, mod.CreateVector(1, 1, 1))
                    }

                } else {
                    mod.SetUITextColor(this.ScoreBoardTextWidgets[index].widget, mod.CreateVector(1, 1, 1))
                }

            } else {
                mod.SetUIWidgetVisible(this.ScoreBoardTextWidgets[index].widget, false)
                mod.SetUIWidgetVisible(this.ScoreBoardImage1Widgets[index].widget, false)
                mod.SetUIWidgetVisible(this.ScoreBoardImage2Widgets[index].widget, false)
                mod.SetUIWidgetVisible(this.ScoreBoardImage3Widgets[index].widget, false)
            }
        }
    }

    static GlobalUpdate() {
        const playerProfiles = PlayerProfile.GetAllPlayerProfiles()
        playerProfiles.sort((a, b) => b.wonRounds - a.wonRounds)
        HoH_UIScoreBoard.playersScoreBoard = playerProfiles

        for (const instance of HoH_UIScoreBoard.instances) {
            instance.update();
        }
    }

    static GlobalClose() {
        for (const instance of HoH_UIScoreBoard.instances) {
            instance.Close();
        }
    }

    Delete() {
        if (this.UiWidget) {
            mod.DeleteUIWidget(this.UiWidget)
        }
        const i = HoH_UIScoreBoard.instances.indexOf(this);
        if (i !== -1) HoH_UIScoreBoard.instances.splice(i, 1);
    }

    Close() {
        if (this.UiWidget) {
            mod.SetUIWidgetVisible(this.UiWidget, false)
        }
    }

    CreateUI() {

        const children: UIParams[] = []

        const boxsize: number[] = [250, 300]
        const scoreYpadding = 25;


        children.push(
            {
                type: "Text",
                name: `${this.uiID}_Text_${this.#PlayerProfile.playerID}`,
                textLabel: { text: mod.stringkeys.gameGoal },
                position: [-10, -40, 0],
                size: [350, 150, 0],
                textSize: 20,
                bgColor: [1, 1, 1],
                textColor: [1, 1, 1],
                bgFill: mod.UIBgFill.None,
                textAnchor: mod.UIAnchor.TopCenter,
                anchor: mod.UIAnchor.TopCenter,
                visible: true
            },

            {
                type: "Container",
                name: `${this.uiID}_TopLine_${this.#PlayerProfile.playerID}`,
                position: [-10, 0, 0],
                size: [boxsize[0] - 30, 2, 0],
                bgColor: [1, 1, 1],
                bgFill: mod.UIBgFill.Solid,
                anchor: mod.UIAnchor.TopLeft,
            },
            //  {
            //      type: "Container",
            //      name: `${this.uiID}_BottomLine_${this.#PlayerProfile.playerID}`,
            //      position: [-10, 0, 0],
            //      size: [boxsize[0] - 30, 2, 0],
            //      bgColor: [1, 1, 1],
            //      bgFill: mod.UIBgFill.Solid,
            //      anchor: mod.UIAnchor.BottomLeft,
            //  },
        )

        for (let index = 0; index < HoH_GameHandler.maxPlayers; index++) {

            children.push(
                {
                    type: "Text",
                    name: `${this.uiID}_Text_${index}_${this.#PlayerProfile.playerID}`,
                    textLabel: { text: mod.stringkeys.playerName, arg: [this.#PlayerProfile.player] },
                    position: [10, index * scoreYpadding, 0],
                    size: [250, 150, 0],
                    textSize: 20,
                    bgColor: [1, 1, 1],
                    textColor: [1, 1, 1],
                    bgFill: mod.UIBgFill.None,
                    textAnchor: mod.UIAnchor.TopLeft,
                    anchor: mod.UIAnchor.TopCenter,
                    visible: false

                },
                {
                    type: "Image",
                    name: `${this.uiID}_Image_${index}_${this.#PlayerProfile.playerID}`,
                    position: [40, index * scoreYpadding, 0],
                    imageType: mod.UIImageType.CrownSolid,
                    size: [30, 30, 0],
                    imageColor: [1, 1, 1],
                    bgFill: mod.UIBgFill.None,
                    anchor: mod.UIAnchor.TopCenter,
                    visible: false
                },
                {
                    type: "Image",
                    name: `${this.uiID}_Image2_${index}_${this.#PlayerProfile.playerID}`,
                    position: [60, index * scoreYpadding, 0],
                    imageType: mod.UIImageType.CrownSolid,
                    size: [30, 30, 0],
                    imageColor: [1, 1, 1],
                    bgFill: mod.UIBgFill.None,
                    anchor: mod.UIAnchor.TopCenter,
                    visible: false
                },
                {
                    type: "Image",
                    name: `${this.uiID}_Image3_${index}_${this.#PlayerProfile.playerID}`,
                    position: [80, index * scoreYpadding, 0],
                    imageType: mod.UIImageType.CrownSolid,
                    size: [30, 30, 0],
                    imageColor: [1, 1, 1],
                    bgFill: mod.UIBgFill.None,
                    anchor: mod.UIAnchor.TopCenter,
                    visible: false
                }

            )

        }



        const popup = ParseUI({
            type: "Container",
            name: `${this.uiID}_Container_${this.#PlayerProfile.playerID}`,
            position: [0, 125, 0],
            size: boxsize,
            anchor: mod.UIAnchor.TopLeft,
            bgColor: [1, 1, 1],
            bgFill: mod.UIBgFill.None,
            bgAlpha: 1,
            padding: 20,
            children: children,
            playerId: this.#PlayerProfile.player
        })


        for (let index = 0; index < HoH_GameHandler.maxPlayers; index++) {
            this.ScoreBoardTextWidgets.push(
                { type: "text", widget: mod.FindUIWidgetWithName(`${this.uiID}_Text_${index}_${this.#PlayerProfile.playerID}`) },
            )
            this.ScoreBoardImage1Widgets.push(
                { type: "image", widget: mod.FindUIWidgetWithName(`${this.uiID}_Image_${index}_${this.#PlayerProfile.playerID}`) },
            )
            this.ScoreBoardImage2Widgets.push(
                { type: "image", widget: mod.FindUIWidgetWithName(`${this.uiID}_Image2_${index}_${this.#PlayerProfile.playerID}`) },
            )
            this.ScoreBoardImage3Widgets.push(
                { type: "image", widget: mod.FindUIWidgetWithName(`${this.uiID}_Image3_${index}_${this.#PlayerProfile.playerID}`) },
            )
        }

        return popup
    }


}


