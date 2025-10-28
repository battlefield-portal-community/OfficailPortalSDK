// === HoH_WarFactory.ts ===
const VERSION = [0, 8, 177];








export const TeamOne: mod.Team = mod.GetTeam(1)
export const TeamTwo: mod.Team = mod.GetTeam(2)

export async function OnGameModeStarted() {

    console.log("HoH Test Game Mode Started");
    InitializeBaseData()

    mod.SetAIToHumanDamageModifier(0.5)

    ProgressionLoop();

    //HoH_Debugger.SwitchTeamOnWeaponShot()


}



class GameHandler {

    static MaxGameScore: number = 15000
    static CapturePointRange: number = 30;
    static teamOneScore: number = 0;

    static teamTwoScore: number = 0;


    static AddScore(team: mod.Team, Points: number, gainName?: string) {
        if (HoH_Helpers.IsObjectIDsEqual(team, TeamOne)) {
            if (this.teamOneScore + Points >= this.MaxGameScore) {
                GameHandler.teamOneScore = this.MaxGameScore;
            } else {
                GameHandler.teamOneScore += Points;
            }

        } else if (HoH_Helpers.IsObjectIDsEqual(team, TeamTwo)) {
            if (this.teamTwoScore + Points >= this.MaxGameScore) {
                GameHandler.teamTwoScore = this.MaxGameScore;
            } else {
                GameHandler.teamTwoScore += Points;
            }
        }

        if (gainName) {
            PlayerProfile.playerInstances.forEach(p =>
                PlayerProfile.get(p)?.ProgressUI.updatePointsFeedback(gainName, Points, team)
            )
        }

        this.UpdateProgress();
    }

    static UpdateProgress() {

        PlayerProfile.playerInstances.forEach(player => {
            const playerProfile = PlayerProfile.get(player);
            playerProfile?.ProgressUI.updateBar(TeamOne, GameHandler.teamOneScore)
            playerProfile?.ProgressUI.updateBar(TeamTwo, GameHandler.teamTwoScore)
        });

        if (this.teamOneScore >= this.MaxGameScore) {
            GameHandler.Victory(TeamOne)
        } else if (this.teamTwoScore >= this.MaxGameScore) {
            GameHandler.Victory(TeamTwo)
        }
    }



    static Victory(team: mod.Team) {
        console.log("Game Over")
        mod.EndGameMode(team)
    }


    static getLeadingTeam(): mod.Team | undefined {

        if (GameHandler.teamOneScore == GameHandler.teamTwoScore) {
            return undefined
        } else if (GameHandler.teamOneScore > GameHandler.teamTwoScore) {
            return TeamOne
        } else if (GameHandler.teamTwoScore > GameHandler.teamOneScore) {
            return TeamTwo
        }
        return undefined
    }

}

async function ProgressionLoop() {
    const teamOne = mod.GetTeam(1);
    const teamTwo = mod.GetTeam(2);

    while (true) {


        let team1IncomeGain = 0;
        let team2IncomeGain = 0;

        let team1PointsGain = 0;
        let team2PointsGain = 0;

        BaseRuntimeData.forEach(base => {
            if (!base.ownerTeam) return; // skip bases with no owner

            if (HoH_Helpers.IsObjectIDsEqual(base.ownerTeam, teamOne)) {
                base.baseMinedWorth += base.capturePointGain;
                team1PointsGain += base.capturePointGain;
                team1IncomeGain += base.captureCashGain;
            } else if (HoH_Helpers.IsObjectIDsEqual(base.ownerTeam, teamTwo)) {
                base.baseMinedWorth += base.capturePointGain
                team2PointsGain += base.capturePointGain
                team2IncomeGain += base.captureCashGain;
            }



        });

        PlayerProfile.playerInstances.forEach(player => {
            const playerProfile = PlayerProfile.get(player);
            const playerTeam = mod.GetTeam(player);

            if (!playerProfile) return; // skip if no profile

            if (HoH_Helpers.IsObjectIDsEqual(playerTeam, teamOne)) {
                playerProfile.AddCash(team1IncomeGain, mod.stringkeys.income);
            } else if (HoH_Helpers.IsObjectIDsEqual(playerTeam, teamTwo)) {
                playerProfile.AddCash(team2IncomeGain, mod.stringkeys.income);
            }
            //Update The base worth
            playerProfile.ShopUI.UpdateAllBasesWorth()
        });

        GameHandler.AddScore(teamOne, team1PointsGain)
        GameHandler.AddScore(teamTwo, team2PointsGain)



        await mod.Wait(10);
    }
}


export async function OnPlayerDeployed(player: mod.Player) {

    if (mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier)) {
        // PlayerProfile.get(player)
        AIBehaviorHandler.OnAIPlayerSpawn(player)

        //HoH_Debugger.addAIToPlayer(player)

        

        return;
    } else {
        const playerprofile = PlayerProfile.get(player)
        playerprofile?.ProgressUI.Open()

        playerprofile?.StartPopup.Show();
        //HoH_Debugger.GiveCashToEachPlayer()
        //HoH_Debugger.debugTestScoreBoard()
        //HoH_Debugger.SpawnAIEnemy()
    }
}

export async function OnCapturePointLost(eventCapturePoint: mod.CapturePoint) {
    console.log("OnCapturePointLost")

    const basedata = BaseRuntimeData.find(base => HoH_Helpers.IsObjectIDsEqual(mod.GetCapturePoint(base.capturePointID), eventCapturePoint))

    if (!basedata) {
        console.log("ERROR: could not find captured base data")
        return
    }

    //When a base is captured by the opposite team, we direct the already spawned AI back to the base.
    basedata.ownerTeam && AIBehaviorHandler.TeamLostBase(basedata, basedata.ownerTeam)

    const baseTotalWorth = basedata.GetBaseTotalWorth()
    basedata.ownerTeam && GameHandler.AddScore(basedata.ownerTeam, -baseTotalWorth, mod.stringkeys.baseLoss)
    basedata.ownerTeam = undefined;
}

export async function OnCapturePointCaptured(eventCapturePoint: mod.CapturePoint) {
    console.log("OnCapturePointCaptured")

    const currentOwnerTeamId = mod.GetCurrentOwnerTeam(eventCapturePoint);

    console.log("capture point: " + mod.GetObjId(eventCapturePoint))

    const basedata = BaseRuntimeData.find(base => HoH_Helpers.IsObjectIDsEqual(mod.GetCapturePoint(base.capturePointID), eventCapturePoint))

    if (!basedata) {
        console.log("ERROR: could not find captured base data")
        return
    }

    const baseTotalWorth = basedata.GetBaseTotalWorth()

    GameHandler.AddScore(currentOwnerTeamId, baseTotalWorth, mod.stringkeys.baseCapture)

    basedata.CapturedByTeam(currentOwnerTeamId)

    const baseWorth = baseTotalWorth

    //This fail sometimes, switched to a distance check instead.
    //const playersOnPoint = mod.GetPlayersOnPoint(eventCapturePoint)

    const playersOnPoint = HoH_Helpers.GetPlayersNearPoint(basedata.basePosition, GameHandler.CapturePointRange)

    // console.log("Players on point" + mod.CountOf(playersOnPoint))

    //const nonAIPlayersOnPoint = HoH_Helpers.GetAllNonAIPlayersInArray(playersOnPoint)

    console.log("non AI Players on point" + playersOnPoint.length)

    const payout = Math.round(baseWorth / playersOnPoint.length);

    for (let i = 0; i < playersOnPoint.length; i++) {
        console.log("Player found in zone")
        let player = playersOnPoint[i]
        const playerProfile = PlayerProfile.get(player)
        if (playerProfile && HoH_Helpers.IsObjectIDsEqual(mod.GetTeam(player), currentOwnerTeamId)) {
            console.log("Player given cash")
            playerProfile.AddCash(payout, mod.stringkeys.playerCaptureBase);
        }
    }

    PlayerProfile.playerInstances.forEach(player => {
        const playerProf = PlayerProfile.get(player)
        playerProf?.ShopUI.UpdateAllBasesAttackButtonsColors()
    })


}



export async function OnPlayerLeaveGame(playernb: number) {
    PlayerProfile.removePlayer(playernb)
}

export async function OnPlayerDied(eventPlayer: mod.Player, eventOtherPlayer: mod.Player, eventDeathType: mod.DeathType, eventWeaponUnlock: mod.WeaponUnlock) {

    if (mod.GetSoldierState(eventPlayer, mod.SoldierStateBool.IsAISoldier)) {
        AIBehaviorHandler.OnAIPlayerDied(eventPlayer)
    } else {
        PlayerProfile.get(eventPlayer)?.ShopUI.CloseShop()
    }
}

export async function OnPlayerEarnedKill(eventPlayer: mod.Player, eventOtherPlayer: mod.Player, eventDeathType: mod.DeathType, eventWeaponUnlock: mod.WeaponUnlock) {

    if (!eventPlayer || !eventOtherPlayer) {
        return
    }

    if (HoH_Helpers.IsObjectIDsEqual(eventPlayer, eventOtherPlayer)) {
        return
    }

    if (mod.GetSoldierState(eventPlayer, mod.SoldierStateBool.IsAISoldier)) {
        return
    }

    PlayerProfile.get(eventPlayer)?.OnPlayerKill()

}


export function OnPlayerEarnedKillAssist(eventPlayer: mod.Player, eventOtherPlayer: mod.Player) {

    console.log("OnPlayerEarnedKillAssist")

    if (!eventPlayer || !eventOtherPlayer) {
        return
    }

    if (HoH_Helpers.IsObjectIDsEqual(eventPlayer, eventOtherPlayer)) {
        return
    }


    PlayerProfile.get(eventPlayer)?.OnPlayerAssist()
}


export function OnVehicleDestroyed(eventVehicle: mod.Vehicle) {
    console.log("OnVehicleDestroyed")
}

export function OnVehicleSpawned(eventVehicle: mod.Vehicle) {
    console.log("OnVehicleSpawned")
    //AIBehaviorHandler.VehicleSpawned(eventVehicle)

    //AIBehaviorHandler.AIPlayersInGame[0] && mod.ForcePlayerToSeat(AIBehaviorHandler.AIPlayersInGame[0].AiPlayer, eventVehicle, 0)

}



// === HoH_AIBehaviorHandler.ts ===




interface AIProfile {
    player: mod.Player
    directOrderIndex: number
    team: mod.Team,
    base: Base,
    currentTargetPosition?: mod.Vector,
}

class AIBehaviorHandler {


    static maxAmountOfAi = 36;
    static AiPlayers: AIProfile[] = [];
    static MaxRadius = 20;
    static MinRadius = 5;

    static OnAIPlayerSpawn(player: mod.Player) {


        const playerPos = mod.GetSoldierState(player, mod.SoldierStateVector.GetPosition);
        if (!playerPos || BaseRuntimeData.length === 0) return;

        // Find closest base using reduce
        const closestBase = BaseRuntimeData.reduce((closest, base) => {
            const closestDist = mod.DistanceBetween(closest.basePosition, playerPos);
            const currentDist = mod.DistanceBetween(base.basePosition, playerPos);
            return currentDist < closestDist ? base : closest;
        });


        // Assign AI to closest base
        if (closestBase) {

            const newAIProfile = { player: player, directOrderIndex: -1, base: closestBase, team: mod.GetTeam(player) }

            const attackPos = BaseRuntimeData.find(base => base.id == closestBase.AIAttackTargetBaseID)

            AIBehaviorHandler.AiPlayers.push(newAIProfile)
            attackPos && AIBehaviorHandler.DirectAiToAttackPoint(newAIProfile, attackPos.basePosition)

        } else {
            mod.Kill(player)
        }

    }

    static GetAllAIPlayers() {
        let AiPlayers:mod.Player[] = []
 
         AIBehaviorHandler.AiPlayers.forEach(element => {
            AiPlayers.push(element.player)
        });

        return AiPlayers
    }

    static OnAIPlayerDied(player: mod.Player) {

        const index = AIBehaviorHandler.AiPlayers.findIndex(x => HoH_Helpers.IsObjectIDsEqual(x.player, player));
        if (index !== -1) {
            AIBehaviorHandler.AiPlayers.splice(index, 1);
        }
    }

    //When a base is captured by the opposite team, we direct the already spawned AI back to the base.
    static async TeamLostBase(base: Base, teamWhoLostItsBase: mod.Team) {

        const AiFromBase = AIBehaviorHandler.AiPlayers.filter(p => HoH_Helpers.IsObjectIDsEqual(p.team, teamWhoLostItsBase) && p.base.id == base.id);

        AiFromBase.forEach(aiProfile => {
            AIBehaviorHandler.DirectAiToAttackPoint(aiProfile, base.basePosition)
        })
    }

    static async DirectAllAIFromBaseToAttackPoint(base: Base) {

        const aiProfiles = AIBehaviorHandler.AiPlayers.filter(aiProfile =>
            base.id == aiProfile.base.id
            && HoH_Helpers.IsObjectIDsEqual(base.ownerTeam, aiProfile.team)
        )

        if (aiProfiles.length === 0) return;

        const targetBase = BaseRuntimeData.find(x => x.id == base.AIAttackTargetBaseID)


        if (targetBase == undefined) {
            return
        }

        aiProfiles.forEach(aiProfile => {
            this.DirectAiToAttackPoint(aiProfile, targetBase?.basePosition)
        });
    }


    static GetTotalAISpawnedFromBase(baseid: string) {
        return AIBehaviorHandler.AiPlayers.filter(aiProfile => baseid == aiProfile.base.id).length
    }


    static async VehicleSpawned(vehicle: mod.Vehicle) {

        const vehPos = mod.GetVehicleState(vehicle, mod.VehicleStateVector.VehiclePosition);
        if (!vehPos || BaseRuntimeData.length === 0) return;

        // Find closest base using reduce
        const closestBase = BaseRuntimeData.reduce((closest, base) => {
            const closestDist = mod.DistanceBetween(closest.basePosition, vehPos);
            const currentDist = mod.DistanceBetween(base.basePosition, vehPos);
            return currentDist < closestDist ? base : closest;
        });


        if (closestBase) {
            const aiPlayers = AIBehaviorHandler.AiPlayers.filter(x => x.base.id == closestBase.id)

            for (let index = 0; index < aiPlayers.length; index++) {

                const aiPlayer = aiPlayers[index];

                const aiPlayerpos = mod.GetSoldierState(aiPlayer.player, mod.SoldierStateVector.GetPosition);

                if (mod.DistanceBetween(aiPlayerpos, vehPos) < 100) {
                    mod.ForcePlayerToSeat(aiPlayer.player, vehicle, 0)
                    return;
                }
            }


        }

    }

    static async DirectAiToAttackPoint(aIProfile: AIProfile, targetPosition: mod.Vector) {

        aIProfile.directOrderIndex++;
        const directOrder = aIProfile.directOrderIndex;
        aIProfile.currentTargetPosition = targetPosition;

        mod.AISetMoveSpeed(aIProfile.player, mod.MoveSpeed.InvestigateRun);


        while (
            mod.GetSoldierState(aIProfile.player, mod.SoldierStateBool.IsAlive) &&
            directOrder === aIProfile.directOrderIndex
        ) {
            const playerPosition = mod.GetSoldierState(aIProfile.player, mod.SoldierStateVector.GetPosition);
            const _targetPosition = AIBehaviorHandler.AIHelpMoveTowardsPoint(playerPosition, targetPosition)

            mod.AIMoveToBehavior(aIProfile.player, _targetPosition)

            if (
                mod.DistanceBetween(playerPosition, _targetPosition) < AIBehaviorHandler.MaxRadius
            ) {
                mod.AIBattlefieldBehavior(aIProfile.player)
                //mod.AIDefendPositionBehavior(aIProfile.player, targetPosition, AIBehaviorHandler.MinRadius, AIBehaviorHandler.MaxRadius);
                return
            }

            await mod.Wait(10);
        }
    }

    static AIHelpMoveTowardsPoint(
        from: any,
        to: any,
        maxStep: number = 100
    ): any {
        const fx = mod.XComponentOf(from);
        const fy = mod.YComponentOf(from);
        const fz = mod.ZComponentOf(from);

        const tx = mod.XComponentOf(to);
        const ty = mod.YComponentOf(to);
        const tz = mod.ZComponentOf(to);

        const dx = tx - fx;
        const dy = ty - fy;
        const dz = tz - fz;

        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (distance <= maxStep) {
            return mod.CreateVector(tx, ty, tz);
        }

        const ratio = maxStep / distance;

        return mod.CreateVector(
            fx + dx * ratio,
            fy + dy * ratio,
            fz + dz * ratio
        );
    }

}

// === HoH_BaseHandler.ts ===








const MAX_AI_SPAWNED_FROM_BASE: number = 10;
const DELAY_BETWEEN_AI_SPAWNS: number = 120;
const RADAR_TOWER_SPOT_RANGE: number = 125;

interface vehicleSpawner {
    id: number;
}


enum PassiveUpgradeTypeID {
    BaseGainPointsPerSecUpgrade,
    BaseGainCashPerSecUpgrade,
    BaseRadar
}


interface IPassiveUpgradeData {
    type: PassiveUpgradeTypeID;
    amount: number;
}

enum SpawnState {
    ready,
    waitingForSpawn,
    spawned
}

enum UpgradeCategory {
    vehicle = "vehicle",
    building = "building",
    stationary = "stationary"
}

interface IBase {
    id: string
    name: string
    capturepointID: number;
    capturePointsGainPerTick: number;
    worldiconPointID: number;
    captureCashGainPerTick: number;
    interactID: number;
    baseDefaultWorth: number;
    availableUpgrades: IUpgradeDefinition[]
    teamMainBase?: mod.Team
}



interface IUpgradeDefinition {
    id: string;
    name: string;
    description: string;
    image: mod.UIImageType;
    cost: number;
    category: UpgradeCategory;
    effects: Effect[];
    repeatable?: boolean;
}

abstract class ActiveEffect {
    abstract activate(player: PlayerProfile): Promise<void>;
}



class ActiveEffectBuilding extends ActiveEffect {

    buildingsToSpawn: ObjectTransform[]


    constructor(buildingsToSpawn: ObjectTransform[]) {
        super()
        this.buildingsToSpawn = buildingsToSpawn;
    }

    async activate(player: PlayerProfile): Promise<void> {
        for (let index = 0; index < this.buildingsToSpawn.length; index++) {
            const object = this.buildingsToSpawn[index];

            // const fxSpawn = mod.SpawnObject(
            //     mod.RuntimeSpawn_Common.Modbuilder_FX_Gadget_Sabotage_02_SparkLoop,
            //     mod.CreateVector(object.position.x, object.position.y, object.position.z),
            //     mod.CreateVector(0, 0, 0), mod.CreateVector(1, 1, 1))
            //
            // mod.EnableVFX(fxSpawn, true);

            object.position.y -= 10

            const obj = HoH_Helpers.SpawnObjectFromGodot(object)

            mod.MoveObjectOverTime(
                obj,
                mod.CreateVector(0, 10, 0),
                mod.CreateVector(0, 0, 0), 1, false, false)

            await mod.Wait(1)

            mod.UnspawnObject(obj)
            object.position.y += 10
            HoH_Helpers.SpawnObjectFromGodot(object)

            // mod.EnableVFX(fxSpawn, false);
        }
    }
}

//Modbuilder_FX_BASE_Smoke_Pillar_Black_L
//Modbuilder_FX_BASE_Smoke_Pillar_Black_L_Dist
//Modbuilder_FX_BASE_Smoke_Soft_S_GS
//Modbuilder_FX_Grenade_Smoke_Detonation
//Modbuilder_FX_Gadget_AT_Mine_Detonatio
//Modbuilder_FX_Gadget_Sabotage_02_SparkLoop



class ActivateEffectPassive extends ActiveEffect {
    passives: IPassiveUpgradeData[]
    targetBase: IBase;

    constructor(passives: IPassiveUpgradeData[], base: IBase) {
        super()
        this.passives = passives;
        this.targetBase = base;
    }

    async activate(playerprofile: PlayerProfile): Promise<void> {
        this.passives.forEach(async passive => {
            if (passive.type == PassiveUpgradeTypeID.BaseGainCashPerSecUpgrade) {
                const basedata = BaseRuntimeData.find(base => base.id == this.targetBase.id);
                basedata?.IncreaseCashGainPerSec(passive.amount)
            }
            if (passive.type == PassiveUpgradeTypeID.BaseGainPointsPerSecUpgrade) {
                const basedata = BaseRuntimeData.find(base => base.id == this.targetBase.id)
                basedata?.IncreasePointGainPerSec(passive.amount)
            }
            if (passive.type == PassiveUpgradeTypeID.BaseRadar) {
                const basedata = BaseRuntimeData.find(base => base.id == this.targetBase.id);
                basedata && this.RadarLoop(basedata)
            }
        });
    }

    async RadarLoop(base: Base) {

        while (true) {

            if (base.ownerTeam) {
                let playersInGame = PlayerProfile.playerInstances;
                playersInGame = playersInGame.concat(AIBehaviorHandler.GetAllAIPlayers());

                playersInGame.forEach(player => {

                    const playerPosition = mod.GetSoldierState(player, mod.SoldierStateVector.GetPosition)
                    const dis = mod.DistanceBetween(base.basePosition, playerPosition)

                    if (dis <= RADAR_TOWER_SPOT_RANGE && !HoH_Helpers.IsObjectIDsEqual(mod.GetTeam(player), base.ownerTeam)) {
                        mod.SpotTarget(player, 15, mod.SpotStatus.SpotInBoth)
                    }
                });
            }

            await mod.Wait(5)
        }
    }

}

class ActivateEffectVehSpawn extends ActiveEffect {
    vehToSpawn: VehData[]

    constructor(vehToSpawn: VehData[]) {
        super()
        this.vehToSpawn = vehToSpawn;
    }

    async activate(player: PlayerProfile): Promise<void> {

        this.vehToSpawn.forEach(async veh => {

            const spawner = mod.GetVehicleSpawner(veh.vehSpawnpointID)
            if (veh.type) {
                mod.SetVehicleSpawnerVehicleType(spawner, veh.type)
            }

            mod.ForceVehicleSpawnerSpawn(spawner)
            mod.SetVehicleSpawnerAutoSpawn(spawner, true)

        });
    }

}


class ActivateEffectStationarySpawn extends ActiveEffect {
    staToSpawn: StationaryData[]

    constructor(staToSpawn: StationaryData[]) {
        super()
        this.staToSpawn = staToSpawn;
    }

    async activate(player: PlayerProfile): Promise<void> {
        this.staToSpawn.forEach(async sta => {
            const spawner = mod.GetEmplacementSpawner(sta.stationarySpawnpointID)
            if (sta.type) {
                mod.SetEmplacementSpawnerType(spawner, sta.type)
            }

            mod.SetEmplacementSpawnerAutoSpawn(spawner, true)
            mod.ForceEmplacementSpawnerSpawn(spawner)



        });
    }

}



class ActivateEffectGruntSpawn extends ActiveEffect {
    gruntToSpawn: GruntData[]
    targetBase: IBase;

    constructor(gruntToSpawn: GruntData[], base: IBase) {
        super()
        this.gruntToSpawn = gruntToSpawn;
        this.targetBase = base;
    }

    async activate(player: PlayerProfile): Promise<void> {
        const base = BaseRuntimeData.find(base => base.id == this.targetBase.id);
        if (!base || !base.ownerTeam) return;

        while (true) {
            const currentCount = AIBehaviorHandler.GetTotalAISpawnedFromBase(base.id);

            // calculate total to spawn in this cycle
            const plannedToSpawn = this.gruntToSpawn.reduce((sum, grunt) => sum + grunt.amount, 0);

            if (currentCount + plannedToSpawn <= MAX_AI_SPAWNED_FROM_BASE) {
                for (const gruntData of this.gruntToSpawn) {
                    const spawnPoint = mod.GetSpawner(gruntData.gruntSpawnpointID);

                    for (let i = 0; i < gruntData.amount; i++) {
                        mod.SpawnAIFromAISpawner(spawnPoint, gruntData.soldierClass, base.ownerTeam);
                        await mod.Wait(0.1);
                    }
                }
            }

            await mod.Wait(DELAY_BETWEEN_AI_SPAWNS);
        }
    }

}

enum purshaseMessage {
    notEnoughMoney,
    success,
    failed,
    pooledMoney,
    successRepeatable
}

// Base Upgrade class
class Upgrade {
    id: string;
    name: string;
    description: string;
    cost: number;
    category: UpgradeCategory;
    parentBaseID: string;
    image: mod.UIImageType
    purchased: boolean = false;
    repeatable: boolean = false;
    pooledMoney: number = 0;
    spawnState: SpawnState = SpawnState.ready;
    upgradePosition: Vector3 | undefined;

    activeEffects: ActiveEffect[] = []

    constructor(id: string, name: string, description: string, cost: number, parentBaseID: string, image: mod.UIImageType, activeEffects: ActiveEffect[], category: UpgradeCategory, repeatable?: boolean, position?: Vector3) {
        this.id = id
        this.cost = cost
        this.name = name;
        this.description = description;
        this.repeatable = repeatable ?? false;
        this.parentBaseID = parentBaseID;
        this.image = image;
        this.activeEffects = activeEffects;
        this.upgradePosition = position;
        this.category = category;
    }

    canPurchase(player: PlayerProfile): boolean {
        return !this.purchased && player.GetCashAmount() >= (this.cost - this.pooledMoney);
    }

    poolMoney(player: PlayerProfile): purshaseMessage {

        if (this.purchased) {
            console.log("Upgrade Already purchased")
            return purshaseMessage.failed
        }

        const Base = BaseRuntimeData.find(base => base.id == this.parentBaseID)

        if (!Base) {
            return purshaseMessage.failed
        }

        if (!Base.ownerTeam || !HoH_Helpers.IsObjectIDsEqual(mod.GetTeam(player.player), Base.ownerTeam)) {
            return purshaseMessage.failed
        }

        const playerCash = player.GetCashAmount()

        if (playerCash <= 0) {
            console.log(`Player ${player.playerID} has no money`);
            return purshaseMessage.notEnoughMoney;
        }

        const needed = this.cost - this.pooledMoney;
        if (playerCash >= needed) {
            player.RemoveCash(needed, mod.stringkeys.boughtUpgrade);
            this.pooledMoney = this.cost;
            return this.purchase(player);
        } else {
            this.pooledMoney += playerCash;
            player.RemoveCash(playerCash, mod.stringkeys.pooledMoney);
            console.log(
                `Pooled money for upgrade ${this.id}: ${this.pooledMoney}/${this.cost}`
            );
            return purshaseMessage.pooledMoney;
        }
    }

    purchase(player: PlayerProfile): purshaseMessage {

        if (!this.repeatable) this.purchased = true;

        this.StartBuild(player)

        if (this.repeatable) {
            return purshaseMessage.successRepeatable
        }
        return purshaseMessage.success
    }


    async StartBuild(player: PlayerProfile) {

        for (let index = 0; index < this.activeEffects.length; index++) {
            const effect = this.activeEffects[index];
            await effect.activate(player)
        }

        console.log(`Upgrade ${this.id} purchased`);
    }



}

let BaseRuntimeData: Base[] = []

function InitializeBaseData() {

    BASE_DEFINITIONS.forEach(base => {

        let Upgrades: Upgrade[] = []

        base.availableUpgrades.forEach(Iupgrade => {

            let activeEffects: ActiveEffect[] = []
            let position: Vector3 | undefined = undefined

            Iupgrade.effects.forEach(effect => {

                if (effect.type == "Building") {
                    activeEffects.push(new ActiveEffectBuilding(presetBuildingDataSource[effect.data]))
                    position = HoH_Helpers.getCenterPosition(presetBuildingDataSource[effect.data]) // Used for the position players should rotate towards when they bug an upgrade.
                }
                if (effect.type == "Grunt") {
                    activeEffects.push(new ActivateEffectGruntSpawn(presetGruntDataSource[effect.data], base))
                }
                if (effect.type == "Vehicle") {
                    activeEffects.push(new ActivateEffectVehSpawn(presetVehicleDataSource[effect.data]))
                }
                if (effect.type == "Stationary") {
                    activeEffects.push(new ActivateEffectStationarySpawn(presetStationaryDataSource[effect.data]))
                }
                if (effect.type == "Effect") {
                    activeEffects.push(new ActivateEffectPassive(presetPassiveDataSource[effect.data], base))
                }

            });

            Upgrades.push(
                new Upgrade(
                    Iupgrade.id,
                    Iupgrade.name,
                    Iupgrade.description,
                    Iupgrade.cost, base.id,
                    Iupgrade.image,
                    activeEffects,
                    Iupgrade.category,
                    Iupgrade.repeatable,
                    position))
        });

        const sorted = Upgrades.sort((a, b) => {
            if (a instanceof ActiveEffectBuilding && !(b instanceof ActiveEffectBuilding)) return -1;
            if (!(a instanceof ActiveEffectBuilding) && b instanceof ActiveEffectBuilding) return 1;
            return 0; // keep original order otherwise
        });

        BaseRuntimeData.push(new Base(
            base.id,
            base.name,
            base.capturepointID,
            base.capturePointsGainPerTick,
            base.captureCashGainPerTick,
            base.interactID,
            base.worldiconPointID,
            base.baseDefaultWorth,
            sorted,
            mod.GetObjectPosition(mod.GetCapturePoint(base.capturepointID)), // Get The position of the capture point and save it for easier for the AI attack targeting 
            base.teamMainBase
        ))
    });
}

class Base {
    id: string;
    name: string;
    baseDefaultWorth: number
    baseBuildingdWorth: number = 0
    baseMinedWorth: number = 0
    interactPointID: number
    worldiconPointID: number
    capturePointGain: number
    captureCashGain: number
    availableUpgrades: Upgrade[];
    ownerTeam: mod.Team | undefined
    capturePointID: number = -1
    teamMainBase: mod.Team | undefined;
    basePosition: mod.Vector;
    AIAttackTargetBaseID: string;

    constructor(id: string, name: string, capturePointID: number, capturePointGain: number, captureCashGain: number,
        interactPointID: number, worldiconPointID: number, baseDefaultWorth: number, availableUpgrades: Upgrade[], basePosition: mod.Vector, teamMainBase?: mod.Team) {
        this.id = id;
        this.name = name;
        this.availableUpgrades = availableUpgrades;
        this.capturePointID = capturePointID;
        this.interactPointID = interactPointID;
        this.capturePointGain = capturePointGain;
        this.captureCashGain = captureCashGain;
        this.worldiconPointID = worldiconPointID;
        this.teamMainBase = teamMainBase;
        this.baseDefaultWorth = baseDefaultWorth;
        this.basePosition = basePosition;
        this.AIAttackTargetBaseID = id;

        const worldIcon = mod.GetWorldIcon(this.worldiconPointID)

        if (this.teamMainBase) {
            mod.EnableInteractPoint(mod.GetInteractPoint(this.interactPointID), true)
            mod.EnableWorldIconImage(worldIcon, true)
            mod.EnableWorldIconText(worldIcon, true)
            this.CapturedByTeam(this.teamMainBase)
        } else {
            mod.EnableInteractPoint(mod.GetInteractPoint(this.interactPointID), false)
            mod.EnableWorldIconImage(worldIcon, false)
            mod.EnableWorldIconText(worldIcon, false)
        }
    }

    purchaseUpgrade(id: string, playerProfile: PlayerProfile): Boolean {

        const targetUpgrade = this.availableUpgrades.find(upgrade => upgrade.id == id)

        if (targetUpgrade) {



            const success = targetUpgrade.poolMoney(playerProfile);

            if (success == purshaseMessage.pooledMoney) {
                // tell every player to update their shop UI
                PlayerProfile.playerInstances.forEach(playerprofile => {
                    const playerPof = PlayerProfile.get(playerprofile)
                    playerPof?.ShopUI.UpdateAvailableUpgrades(this)
                })
            } else if (success == purshaseMessage.success || success == purshaseMessage.successRepeatable) {
                this.baseBuildingdWorth += targetUpgrade.cost
                this.ownerTeam && GameHandler.AddScore(this.ownerTeam, targetUpgrade.cost, targetUpgrade.name)

                // tell every player to update their shop UI
                PlayerProfile.playerInstances.forEach(playerprofile => {
                    const playerPof = PlayerProfile.get(playerprofile)
                    playerPof?.ShopUI.UpdateAvailableUpgrades(this)

                })

                playerProfile?.ShopUI.CloseShop()
                this.RotateTowardsUpgrade(playerProfile, targetUpgrade)

                return true
            }

            return false
        }

        return false
    }

    RotateTowardsUpgrade(playerProfile: PlayerProfile, upgrade: Upgrade) {

        const position = mod.GetSoldierState(playerProfile.player, mod.SoldierStateVector.GetPosition)

        if (upgrade.upgradePosition) {
            const direction = HoH_Helpers.directionYaw({ x: mod.XComponentOf(position), y: mod.YComponentOf(position), z: mod.ZComponentOf(position) }, upgrade.upgradePosition)
            mod.Teleport(playerProfile.player, position, direction)
        }

    }

    GetBaseTotalWorth(): number {
        return this.baseDefaultWorth + this.baseBuildingdWorth + this.baseMinedWorth;
    }

    CapturedByTeam(team: mod.Team) {
        this.ownerTeam = team;

        console.log("Team" + team + " captured point: " + this.name)

        const worldIcon = mod.GetWorldIcon(this.worldiconPointID)

        mod.EnableInteractPoint(mod.GetInteractPoint(this.interactPointID), true)
        mod.EnableWorldIconImage(worldIcon, true)
        mod.EnableWorldIconText(worldIcon, true)
        mod.SetWorldIconOwner(worldIcon, this.ownerTeam)

        this.AIAttackTargetBaseID = this.id

        PlayerProfile.playerInstances.forEach(player => {
            PlayerProfile.get(player)?.ShopUI.UpdateBaseAttackTargets(this.id, this.id)
        })
    }

    IncreaseCashGainPerSec(cash: number) {
        this.captureCashGain += cash;
    }

    IncreasePointGainPerSec(points: number) {
        this.capturePointGain += points;
    }

    SetAIAttackTarget(base: Base, player: mod.Player) {

        if (!this.ownerTeam || !HoH_Helpers.IsObjectIDsEqual(mod.GetTeam(player), this.ownerTeam)) {
            console.log("Player do not own base and cannot direct an attack: " + base.name)
            return;
        }

        this.AIAttackTargetBaseID = base.id
        console.log("Ai attack position: " + base.name)

        AIBehaviorHandler.DirectAllAIFromBaseToAttackPoint(this)

        PlayerProfile.playerInstances.forEach(player => {
            PlayerProfile.get(player)?.ShopUI.UpdateBaseAttackTargets(this.id, base.id)
        })
    }


    HasActiveGruntSpawner(): boolean {
        return this.availableUpgrades.some(
            (x) => x instanceof ActivateEffectGruntSpawn && x.purchased === true
        );
    }

}

interface GruntData {
    soldierClass: mod.SoldierClass,
    amount: number,
    gruntSpawnpointID: number,
}



interface VehData {
    vehSpawnpointID: number,
    type?: mod.VehicleList,
}

interface StationaryData {
    stationarySpawnpointID: number,
    type?: mod.StationaryEmplacements,
}

interface GruntEffect {
    type: "Grunt";
    data: GruntPresetID;
}

interface BuildingEffect {
    type: "Building";
    data: BuildingPresetID;
}

interface StationaryEmplacementEffect {
    type: "Stationary";
    data: StationaryPresetID;
}

interface PassiveEffect {
    type: "Effect";
    data: PassivePresetID;
}

interface VehicleEffect {
    type: "Vehicle";
    data: VehiclePresetID;
}

type Effect = GruntEffect | BuildingEffect | PassiveEffect | VehicleEffect | StationaryEmplacementEffect;










// === HoH_BaseRawData.ts ===






enum BaseID {
    BaseOne = "BaseOne",
    BaseTwo = "BaseTwo",
    BaseThree = "BaseThree",
    BaseFour = "BaseFour"
}

enum BuildingPresetID {

    TeamOneMainBase_Buggy1 = "TeamOneMainBase_Buggy1",
    TeamOneMainBase_Buggy2 = "TeamOneMainBase_Buggy2",
    TeamOneMainBase_Car = "TeamOneMainBase_Car",
    TeamOneMainBase_TransportHeli = "TeamOneMainBase_TransportHeli",

    TeamTwoMainBase_Buggy1 = "TeamTwoMainBase_Buggy1",
    TeamTwoMainBase_Buggy2 = "TeamTwoMainBase_Buggy2",
    TeamTwoMainBase_Car = "TeamTwoMainBase_Car",

    AirPortOne_LandinStrip = "AirPortOne_LandinStrip",
    AirPortOne_LandinStripTwo = "AirPortOne_LandinStripTwo",
    AirPortOne_AirGuns = "AirPortOne_AirGuns",
    AirPortOne_GruntSpawner = "AirPortOne_GruntSpawner",

    AirPortTwo_LandinStrip = "AirPortTwo_LandinStrip",
    AirPortTwo_AirGuns = "AirPortTwo_AirGuns",
    AirPortTwo_GruntSpawner = "AirPortTwo_GruntSpawner",
    AirPortTwo_LandinStripTwo = "AirPortTwo_LandinStripTwo",
    AirPortTwo_OilRig = "AirPortTwo_OilRig",

    HeliBaseOne_Helipad = "HeliBaseOne_Helipad",
    HeliBaseOne_GruntSpawner = "HeliBaseOne_GruntSpawner",
    HeliBaseOne_HelipadTwo = "HeliBaseOne_HelipadTwo",

    HeliBaseTwo_Helipad = "HeliBaseTwo_Helipad",
    HeliBaseTwo_GruntSpawner = "HeliBaseTwo_GruntSpawner",
    HeliBaseTwo_HelipadTwo = "HeliBaseTwo_HelipadTwo",

    TankBaseOne_TankBuilding = "TankBaseOne_TankBuilding",
    TankBaseOne_OilRig = "TankBaseOne_OilRIg",
    TankBaseOne_CarSpawn1 = "TankBaseOne_CarSpawn1",
    TankBaseOne_CarSpawn2 = "TankBaseOne_CarSpawn2",
    TankBaseOne_AntiAir = "TankBaseOne_AntiAir",
    TankBaseOne_GruntSpawner = "TankBaseOne_GruntSpawner",

    TankBaseTwo_TankBuilding = "TankBaseTwo_TankBuilding",
    TankBaseTwo_OilRig = "TankBaseTwo_OilRIg",
    TankBasetwo_CarSpawn1 = "TankBaseTwo_CarSpawn1",
    TankBaseTwo_CarSpawn2 = "TankBaseTwo_CarSpawn2",
    TankBaseTwo_AntiAir = "TankBaseTwo_AntiAir",
    TankBaseTwo_GruntSpawner = "TankBaseTwo_GruntSpawner",

    CenterBase_RadarTower = "CenterBase_RadarTower",

    TeamTwoMainBase_TransportHeli = "TeamTwoMainBase_TransportHeli",
    AirPortOne_OilRig = "AirPortOne_OilRig",

}

enum StationaryPresetID {
    AirPortOne_AirGuns = "AirPortOne_AirGuns",
    AirPortTwo_AirGuns = "AirPortTwo_AirGuns",
    TankBaseOne_AntiAir = "TankBaseOne_AntiAir",
    TankBaseTwo_AntiAir = "TankBaseTwo_AntiAir",
    CenterBase_AntiTank = "CenterBase_AntiTank"
}

enum VehiclePresetID {

    TeamOneMainBase_Buggy1 = "TeamOneMainBase_Buggy1",
    TeamOneMainBase_Buggy2 = "TeamOneMainBase_Buggy2",
    TeamOneMainBase_Car = "TeamOneMainBase_Car",
    TeamOneMainBase_TransportHeli = "TeamOneMainBase_TransportHeli",

    TeamTwoMainBase_Buggy1 = "TeamTwoMainBase_Buggy1",
    TeamTwoMainBase_Buggy2 = "TeamTwoMainBase_Buggy2",
    TeamTwoMainBase_Car = "TeamTwoMainBase_Car",

    AirPortOne_Plane = "AirPort_one_Plane",
    AirPortOne_PlaneTwo = "AirPortOne_PlaneTwo",

    AirPortTwo_Plane = "AirPort_two_Plane",
    AirPortTwo_PlaneTwo = "AirPortTwo_PlaneTwo",

    HeliBaseOne_Heli = "HeliBaseOne_Heli",
    HeliBaseOne_Helitwo = "HeliBaseOne_Helitwo",

    HeliBaseTwo_Heli = "HeliBaseTwo_Heli",
    HeliBaseTwo_HeliTwo = "HeliBaseTwo_HeliTwo",

    TankBaseOne_Tanks = "TankBaseOne_Tanks",
    TankBaseOne_CarSpawn1 = "TankBaseOne_CarSpawn1",
    TankBaseOne_CarSpawn2 = "TankBaseOne_CarSpawn2",
    TankBaseTwo_Tanks = "TankBaseTwo_Tanks",
    TankBaseTwo_CarSpawn1 = "TankBaseTwo_CarSpawn1",
    TankBaseTwo_CarSpawn2 = "TankBaseTwo_CarSpawn2",
    TeamTwoMainBase_TransportHeli = "TeamTwoMainBase_TransportHeli",




}

enum PassivePresetID {
    Default_MoneyPrinter = "BaseOne_MoneyPrinter",
    Default_MorePoints = "BaseOne_MorePoints",
    BaseTwo_MoneyPrinter = "BaseTwo_MoneyPrinter",
    BaseTwo_MorePoints = "BaseTwo_MorePoints",
    CenterBase_RadarTower = "Center_RadarTower"
}


enum GruntPresetID {
    TankBaseOne_Assault = "BaseOne_Assault",
    TankBaseTwo_Assault = "BaseTwo_Assault",
    HeliBaseOne_Assault = "HeliBaseOne_Assault",
    HeliBaseTwo_Assault = "HeliBaseTwo_Assault",
    AirPortBaseTwo_Assault = "AirPortBaseTwo_Assault",
    AirPortBaseOne_Assault = "AirPortBaseOne_Assault"
}



// Raw preset data
const presetBuildingDataSource: Record<BuildingPresetID, ObjectTransform[]> = {

    // TEAM ONE MAIN BASE
    [BuildingPresetID.TeamOneMainBase_TransportHeli]: [
        { id: mod.RuntimeSpawn_FireStorm.ConstructionSite_02_B, position: { x: -368.485290527344, y: 116.411987304688, z: -385.156036376953 }, rotation: { x: 0.0, y: 0.0, z: 1.0, w: -0.0000000437114 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
        { id: mod.RuntimeSpawn_FireStorm.StairsRefinery_02, position: { x: -373.068786621094, y: 108.70866394043, z: -390.800903320313 }, rotation: { x: 0.0, y: 0.70710676908493, z: 0.0, w: 0.70710676908493 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
        { id: mod.RuntimeSpawn_FireStorm.StairsRefinery_02, position: { x: -375.986877441406, y: 108.70866394043, z: -381.866638183594 }, rotation: { x: 0.0, y: 1.0, z: 0.0, w: -0.0000000437114 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
        { id: mod.RuntimeSpawn_FireStorm.StairsRefinery_02, position: { x: -364.436340332031, y: 108.70866394043, z: -379.526062011719 }, rotation: { x: 0.0, y: -0.70710670948029, z: 0.0, w: 0.70710682868958 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
        { id: mod.RuntimeSpawn_FireStorm.StairsRefinery_02, position: { x: -360.886505126953, y: 108.70866394043, z: -388.241546630859 }, rotation: { x: 0.0, y: 0.000000087423, z: 0.0, w: 1.0 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
    ],
    [BuildingPresetID.TeamOneMainBase_Buggy1]: [
        { id: mod.RuntimeSpawn_FireStorm.WorkBench_01, position: { x: -377.158081054688, y: 123.933723449707, z: -302.705963134766 }, rotation: { x: -0.00000001303852, y: 1.0, z: -0.0, w: -0.00000004371139 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
        { id: mod.RuntimeSpawn_Common.WeaponsCache_01_Crate_B, position: { x: -380.069641113281, y: 123.94947052002, z: -301.865325927734 }, rotation: { x: 0.00000000372529, y: 1.0, z: 0.0, w: 0.00000004371138 }, scale: { x: 1.0, y: 1.00000035762787, z: 1.0 } },
    ],
    [BuildingPresetID.TeamOneMainBase_Buggy2]: [
        { id: mod.RuntimeSpawn_FireStorm.WeaponCasesPallet_01, position: { x: -357.240386962891, y: 123.903251647949, z: -301.900726318359 }, rotation: { x: -0.00000001117587, y: 1.0, z: -0.0, w: 0.00000004371138 }, scale: { x: 1.0, y: 1.00000035762787, z: 1.0 } },
        { id: mod.RuntimeSpawn_FireStorm.WorkBench_01, position: { x: -360.858489990234, y: 123.933753967285, z: -302.628204345703 }, rotation: { x: -0.00000001117587, y: 1.0, z: -0.0, w: -0.00000004371139 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
    ],
    [BuildingPresetID.TeamOneMainBase_Car]: [
        { id: mod.RuntimeSpawn_Common.CrateAmmo_01_StackA, position: { x: -378.513000488281, y: 123.953002929688, z: -330.152008056641 }, rotation: { x: 0.0, y: 0.0, z: 0.0, w: 1.0 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
        { id: mod.RuntimeSpawn_Common.CrateAmmo_01_StackC, position: { x: -381.598999023438, y: 123.934005737305, z: -330.175994873047 }, rotation: { x: 0.0, y: 0.0, z: 0.0, w: 1.0 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
    ],


    // TEAM TWO MAIN BASE
    [BuildingPresetID.TeamTwoMainBase_TransportHeli]: [
        { id: mod.RuntimeSpawn_FireStorm.ConstructionSite_02_B, position: { x: 338.156280517578, y: 117.482215881348, z: 142.651794433594 }, rotation: { x: 1.0, y: -0.0000000437114, z: 0.00000001490115, w: -0.0 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
        { id: mod.RuntimeSpawn_FireStorm.StairsRefinery_02, position: { x: 342.739776611328, y: 109.77889251709, z: 148.296661376953 }, rotation: { x: 0.0, y: -0.70710676908493, z: 0.0, w: 0.70710676908493 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
        { id: mod.RuntimeSpawn_FireStorm.StairsRefinery_02, position: { x: 345.657836914063, y: 109.77889251709, z: 139.362396240234 }, rotation: { x: 0.0, y: 0.00000002881025, z: 0.0, w: 1.0 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
        { id: mod.RuntimeSpawn_FireStorm.StairsRefinery_02, position: { x: 334.107330322266, y: 109.77889251709, z: 137.021820068359 }, rotation: { x: 0.0, y: 0.70710682868958, z: 0.0, w: 0.70710670948029 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
        { id: mod.RuntimeSpawn_FireStorm.StairsRefinery_02, position: { x: 330.557495117188, y: 109.77889251709, z: 145.7373046875 }, rotation: { x: 0.0, y: 1.0, z: 0.0, w: -0.00000007252185 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
    ],
    [BuildingPresetID.TeamTwoMainBase_Buggy1]: [
        { id: mod.RuntimeSpawn_FireStorm.WorkBench_01, position: { x: 346.829345703125, y: 121, z: 54.0080261230469 }, rotation: { x: 0.0, y: 0.00000002881023, z: -0.00000001303852, w: 1.0 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
        { id: mod.RuntimeSpawn_Common.WeaponsCache_01_Crate_B, position: { x: 349.740936279297, y: 121, z: 53.1673889160156 }, rotation: { x: -0.0, y: -0.00000005861255, z: 0.00000000372529, w: 1.0 }, scale: { x: 1.0, y: 1.00000035762787, z: 1.0 } },
    ],
    [BuildingPresetID.TeamTwoMainBase_Car]: [
        { id: mod.RuntimeSpawn_Common.CrateAmmo_01_StackA, position: { x: 348.184295654297, y: 121, z: 81.4540557861328 }, rotation: { x: 0.0, y: 1.0, z: 0.0, w: 0.00000001490116 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
        { id: mod.RuntimeSpawn_Common.CrateAmmo_01_StackC, position: { x: 351.270294189453, y: 121, z: 81.4780578613281 }, rotation: { x: 0.0, y: 1.0, z: 0.0, w: 0.00000001490116 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
    ],
    [BuildingPresetID.TeamTwoMainBase_Buggy2]: [
        { id: mod.RuntimeSpawn_FireStorm.WorkBench_01, position: { x: 330.52978515625, y: 121, z: 53.9302558898926 }, rotation: { x: 0.0, y: 0.00000002881023, z: -0.00000001117587, w: 1.0 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
        { id: mod.RuntimeSpawn_FireStorm.WeaponCasesPallet_01, position: { x: 326.911682128906, y: 121, z: 53.2027778625488 }, rotation: { x: 0.0, y: -0.00000005861255, z: -0.00000001117587, w: 1.0 }, scale: { x: 1.0, y: 1.00000035762787, z: 1.0 } },
    ],


    //AIR PORT ONE
    [BuildingPresetID.AirPortOne_LandinStrip]: [
        { id: mod.RuntimeSpawn_FireStorm.StairsRefinery_02, position: { x: -383.869750976563, y: 130.271453857422, z: -120.239501953125 }, rotation: { x: 0.0, y: -0.70710676908493, z: 0.0, w: 0.70710676908493 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
        { id: mod.RuntimeSpawn_FireStorm.StairsRefinery_02, position: { x: -428.491302490234, y: 130.271453857422, z: -120.239501953125 }, rotation: { x: 0.0, y: -0.70710676908493, z: 0.0, w: 0.70710676908493 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
        { id: mod.RuntimeSpawn_FireStorm.StairsRefinery_02, position: { x: -431.015991210938, y: 130.271453857422, z: -139.377090454102 }, rotation: { x: 0.0, y: 0.70710670948029, z: 0.0, w: 0.70710682868958 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
        { id: mod.RuntimeSpawn_FireStorm.StairsRefinery_02, position: { x: -386.708618164063, y: 130.271453857422, z: -139.377105712891 }, rotation: { x: 0.0, y: 0.70710670948029, z: 0.0, w: 0.70710682868958 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
        { id: mod.RuntimeSpawn_Common.HighwayOverpass_Straight_01_4096, position: { x: -428.847106933594, y: 139.937301635742, z: -129.880493164063 }, rotation: { x: 0.0, y: 0.0, z: 0.0, w: 1.0 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
        { id: mod.RuntimeSpawn_Common.HighwayOverpass_Straight_01_4096, position: { x: -387.846557617188, y: 139.937408447266, z: -129.880599975586 }, rotation: { x: 0.0, y: 0.0, z: 0.0, w: 1.0 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
        { id: mod.RuntimeSpawn_Common.HighwayOverpass_Straight_01_4096, position: { x: -346.846588134766, y: 139.937408447266, z: -129.880599975586 }, rotation: { x: 0.0, y: 0.0, z: 0.0, w: 1.0 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },

    ],
    [BuildingPresetID.AirPortOne_AirGuns]: [],
    [BuildingPresetID.AirPortOne_GruntSpawner]: [
        { id: mod.RuntimeSpawn_FireStorm.Barrack_01_A_Firestorm, position: { x: -423.796997070313, y: 134.837310791016, z: -46.6708221435547 }, rotation: { x: 0.0, y: 0.0, z: 0.0, w: 1.0 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
    ],
    [BuildingPresetID.AirPortOne_LandinStripTwo]: [
        { id: mod.RuntimeSpawn_FireStorm.StairsRefinery_02, position: { x: -383.869750976563, y: 130.271453857422, z: -147.262588500977 }, rotation: { x: 0.0, y: -0.70710676908493, z: 0.0, w: 0.70710676908493 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
        { id: mod.RuntimeSpawn_FireStorm.StairsRefinery_02, position: { x: -428.491302490234, y: 130.271453857422, z: -147.262588500977 }, rotation: { x: 0.0, y: -0.70710676908493, z: 0.0, w: 0.70710676908493 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
        { id: mod.RuntimeSpawn_FireStorm.StairsRefinery_02, position: { x: -431.015991210938, y: 130.271453857422, z: -166.400192260742 }, rotation: { x: 0.0, y: 0.70710670948029, z: 0.0, w: 0.70710682868958 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
        { id: mod.RuntimeSpawn_FireStorm.StairsRefinery_02, position: { x: -386.708618164063, y: 130.271453857422, z: -166.400192260742 }, rotation: { x: 0.0, y: 0.70710670948029, z: 0.0, w: 0.70710682868958 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
        { id: mod.RuntimeSpawn_Common.HighwayOverpass_Straight_01_4096, position: { x: -346.846588134766, y: 139.937408447266, z: -156.903686523438 }, rotation: { x: 0.0, y: 0.0, z: 0.0, w: 1.0 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
        { id: mod.RuntimeSpawn_Common.HighwayOverpass_Straight_01_4096, position: { x: -428.847106933594, y: 139.937301635742, z: -156.903594970703 }, rotation: { x: 0.0, y: 0.0, z: 0.0, w: 1.0 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
        { id: mod.RuntimeSpawn_Common.HighwayOverpass_Straight_01_4096, position: { x: -387.846557617188, y: 139.937408447266, z: -156.903686523438 }, rotation: { x: 0.0, y: 0.0, z: 0.0, w: 1.0 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
    ],
    [BuildingPresetID.AirPortOne_OilRig]: [
        { id: mod.RuntimeSpawn_FireStorm.RefineryChimney_01, position: { x: -453.365081787109, y: 138.172454833984, z: -73.2012023925781 }, rotation: { x: 0.0, y: -0.69883990287781, z: 0.0, w: 0.71527820825577 }, scale: { x: 1.00000035762787, y: 1.0, z: 1.00000035762787 } },
        { id: mod.RuntimeSpawn_FireStorm.RefineryConstruction_01, position: { x: -450.967315673828, y: 134.920166015625, z: -69.3077621459961 }, rotation: { x: 0.0, y: -0.69883990287781, z: 0.0, w: 0.71527820825577 }, scale: { x: 1.00000035762787, y: 1.0, z: 1.00000035762787 } },
    ],


    //AIR PORT TWO
    [BuildingPresetID.AirPortTwo_LandinStrip]: [
        { id: mod.RuntimeSpawn_FireStorm.StairsRefinery_02, position: { x: 386.623291015625, y: 115.757759094238, z: -50.5504989624023 }, rotation: { x: 0.0, y: -0.70710682868958, z: 0.0, w: 0.70710670948029 }, scale: { x: 0.99999964237213, y: 1.0, z: 0.99999964237213 } },
        { id: mod.RuntimeSpawn_FireStorm.StairsRefinery_02, position: { x: 342.001770019531, y: 115.757759094238, z: -50.5505027770996 }, rotation: { x: 0.0, y: -0.70710682868958, z: 0.0, w: 0.70710670948029 }, scale: { x: 0.99999964237213, y: 1.0, z: 0.99999964237213 } },
        { id: mod.RuntimeSpawn_FireStorm.StairsRefinery_02, position: { x: 339.47705078125, y: 115.757759094238, z: -69.6880950927734 }, rotation: { x: 0.0, y: 0.70710664987564, z: 0.0, w: 0.70710688829422 }, scale: { x: 0.99999964237213, y: 1.0, z: 0.99999964237213 } },
        { id: mod.RuntimeSpawn_FireStorm.StairsRefinery_02, position: { x: 383.784423828125, y: 115.757759094238, z: -69.6880950927734 }, rotation: { x: 0.0, y: 0.70710664987564, z: 0.0, w: 0.70710688829422 }, scale: { x: 0.99999964237213, y: 1.0, z: 0.99999964237213 } },
        { id: mod.RuntimeSpawn_Common.HighwayOverpass_Straight_01_4096, position: { x: 341.645965576172, y: 125.423606872559, z: -60.1915016174316 }, rotation: { x: 0.0, y: -0.00000004793274, z: 0.0, w: 1.0 }, scale: { x: 0.99999964237213, y: 1.0, z: 0.99999964237213 } },
        { id: mod.RuntimeSpawn_Common.HighwayOverpass_Straight_01_4096, position: { x: 382.646484375, y: 125.423706054688, z: -60.1915969848633 }, rotation: { x: 0.0, y: -0.00000004793274, z: 0.0, w: 1.0 }, scale: { x: 0.99999964237213, y: 1.0, z: 0.99999964237213 } },
        { id: mod.RuntimeSpawn_Common.HighwayOverpass_Straight_01_4096, position: { x: 423.646423339844, y: 125.423706054688, z: -60.191593170166 }, rotation: { x: 0.0, y: -0.00000004793274, z: 0.0, w: 1.0 }, scale: { x: 0.99999964237213, y: 1.0, z: 0.99999964237213 } },

    ],
    [BuildingPresetID.AirPortTwo_LandinStripTwo]: [
        { id: mod.RuntimeSpawn_FireStorm.StairsRefinery_02, position: { x: 386.623291015625, y: 115.757759094238, z: -23.51682472229 }, rotation: { x: 0.0, y: -0.70710682868958, z: 0.0, w: 0.70710670948029 }, scale: { x: 0.99999964237213, y: 1.0, z: 0.99999964237213 } },
        { id: mod.RuntimeSpawn_FireStorm.StairsRefinery_02, position: { x: 342.001770019531, y: 115.757759094238, z: -23.5168266296387 }, rotation: { x: 0.0, y: -0.70710682868958, z: 0.0, w: 0.70710670948029 }, scale: { x: 0.99999964237213, y: 1.0, z: 0.99999964237213 } },
        { id: mod.RuntimeSpawn_FireStorm.StairsRefinery_02, position: { x: 339.47705078125, y: 115.757759094238, z: -42.6544189453125 }, rotation: { x: 0.0, y: 0.70710664987564, z: 0.0, w: 0.70710688829422 }, scale: { x: 0.99999964237213, y: 1.0, z: 0.99999964237213 } },
        { id: mod.RuntimeSpawn_FireStorm.StairsRefinery_02, position: { x: 383.784423828125, y: 115.757759094238, z: -42.6544151306152 }, rotation: { x: 0.0, y: 0.70710664987564, z: 0.0, w: 0.70710688829422 }, scale: { x: 0.99999964237213, y: 1.0, z: 0.99999964237213 } },
        { id: mod.RuntimeSpawn_Common.HighwayOverpass_Straight_01_4096, position: { x: 341.645965576172, y: 125.423606872559, z: -33.1578254699707 }, rotation: { x: 0.0, y: -0.00000004793274, z: 0.0, w: 1.0 }, scale: { x: 0.99999964237213, y: 1.0, z: 0.99999964237213 } },
        { id: mod.RuntimeSpawn_Common.HighwayOverpass_Straight_01_4096, position: { x: 382.646484375, y: 125.423706054688, z: -33.1579208374023 }, rotation: { x: 0.0, y: -0.00000004793274, z: 0.0, w: 1.0 }, scale: { x: 0.99999964237213, y: 1.0, z: 0.99999964237213 } },
        { id: mod.RuntimeSpawn_Common.HighwayOverpass_Straight_01_4096, position: { x: 423.646423339844, y: 125.423706054688, z: -33.1579170227051 }, rotation: { x: 0.0, y: -0.00000004793274, z: 0.0, w: 1.0 }, scale: { x: 0.99999964237213, y: 1.0, z: 0.99999964237213 } },
    ],
    [BuildingPresetID.AirPortTwo_AirGuns]: [],
    [BuildingPresetID.AirPortTwo_GruntSpawner]: [
        { id: mod.RuntimeSpawn_FireStorm.Barrack_01_A_Firestorm, position: { x: 371.901123046875, y: 115.592620849609, z: -137.569549560547 }, rotation: { x: 0.0, y: -0.71804136037827, z: 0.0, w: 0.69600051641464 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
    ],
    [BuildingPresetID.AirPortTwo_OilRig]: [
        { id: mod.RuntimeSpawn_FireStorm.RefineryChimney_01, position: { x: 413.257751464844, y: 115.880889892578, z: -124.358612060547 }, rotation: { x: 0.0, y: 0.75097036361694, z: 0.0, w: 0.660335958004 }, scale: { x: 1.00000011920929, y: 1.0, z: 1.00000011920929 } },
        { id: mod.RuntimeSpawn_FireStorm.RefineryConstruction_01, position: { x: 410.465087890625, y: 112.628593444824, z: -127.97925567627 }, rotation: { x: 0.0, y: 0.75097036361694, z: 0.0, w: 0.660335958004 }, scale: { x: 1.00000011920929, y: 1.0, z: 1.00000011920929 } },
    ],


    //HELI BASE ONE
    [BuildingPresetID.HeliBaseOne_Helipad]: [
        { id: mod.RuntimeSpawn_FireStorm.ConstructionSite_02_B, position: { x: 237.979721069336, y: 123.880020141602, z: -281.2509765625 }, rotation: { x: 0.0, y: 0.0, z: 1.0, w: -0.0000000437114 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
        { id: mod.RuntimeSpawn_FireStorm.StairsRefinery_02, position: { x: 233.845458984375, y: 116.176696777344, z: -286.895843505859 }, rotation: { x: 0.0, y: 0.70710676908493, z: 0.0, w: 0.70710676908493 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
        { id: mod.RuntimeSpawn_FireStorm.StairsRefinery_02, position: { x: 230.478164672852, y: 116.176696777344, z: -277.754608154297 }, rotation: { x: 0.0, y: 1.0, z: 0.0, w: -0.0000000437114 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
        { id: mod.RuntimeSpawn_FireStorm.StairsRefinery_02, position: { x: 242.618179321289, y: 116.176696777344, z: -275.621002197266 }, rotation: { x: 0.0, y: -0.70710670948029, z: 0.0, w: 0.70710682868958 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
        { id: mod.RuntimeSpawn_FireStorm.StairsRefinery_02, position: { x: 245.578521728516, y: 116.176696777344, z: -284.937530517578 }, rotation: { x: 0.0, y: 0.000000087423, z: 0.0, w: 1.0 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
    ],
    [BuildingPresetID.HeliBaseOne_HelipadTwo]: [
        { id: mod.RuntimeSpawn_FireStorm.ConstructionSite_02_B, position: { x: 237.979721069336, y: 123.880020141602, z: -253.650970458984 }, rotation: { x: 0.0, y: 0.0, z: 1.0, w: -0.0000000437114 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
        { id: mod.RuntimeSpawn_FireStorm.StairsRefinery_02, position: { x: 233.217575073242, y: 116.176696777344, z: -259.295837402344 }, rotation: { x: 0.0, y: 0.70710676908493, z: 0.0, w: 0.70710676908493 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
        { id: mod.RuntimeSpawn_FireStorm.StairsRefinery_02, position: { x: 230.478164672852, y: 116.176696777344, z: -250.908264160156 }, rotation: { x: 0.0, y: 1.0, z: 0.0, w: -0.0000000437114 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
        { id: mod.RuntimeSpawn_FireStorm.StairsRefinery_02, position: { x: 243.137954711914, y: 116.176696777344, z: -248.02099609375 }, rotation: { x: 0.0, y: -0.70710670948029, z: 0.0, w: 0.70710682868958 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
        { id: mod.RuntimeSpawn_FireStorm.StairsRefinery_02, position: { x: 245.578521728516, y: 116.176696777344, z: -256.741271972656 }, rotation: { x: 0.0, y: 0.000000087423, z: 0.0, w: 1.0 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
    ],
    [BuildingPresetID.HeliBaseOne_GruntSpawner]: [
        { id: mod.RuntimeSpawn_FireStorm.Barrack_01_A_Firestorm, position: { x: 194.306137084961, y: 117.492080688477, z: -226.945068359375 }, rotation: { x: 0.0, y: 0.70710676908493, z: 0.0, w: 0.70710676908493 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
    ],


    //HELI BASE TWO
    [BuildingPresetID.HeliBaseTwo_Helipad]: [
        { id: mod.RuntimeSpawn_FireStorm.ConstructionSite_02_B, position: { x: -233.551834106445, y: 131.841537475586, z: 93.6090850830078 }, rotation: { x: 0.0, y: 0.0, z: 1.0, w: -0.0000000437114 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
        { id: mod.RuntimeSpawn_FireStorm.StairsRefinery_02, position: { x: -238.279937744141, y: 124.138214111328, z: 87.9642181396484 }, rotation: { x: 0.0, y: 0.70710676908493, z: 0.0, w: 0.70710676908493 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
        { id: mod.RuntimeSpawn_FireStorm.StairsRefinery_02, position: { x: -241.05339050293, y: 124.138214111328, z: 96.4582443237305 }, rotation: { x: 0.0, y: 1.0, z: 0.0, w: -0.0000000437114 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
        { id: mod.RuntimeSpawn_FireStorm.StairsRefinery_02, position: { x: -228.64714050293, y: 124.138214111328, z: 99.2390594482422 }, rotation: { x: 0.0, y: -0.70710670948029, z: 0.0, w: 0.70710682868958 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
        { id: mod.RuntimeSpawn_FireStorm.StairsRefinery_02, position: { x: -225.953033447266, y: 124.138214111328, z: 90.4311370849609 }, rotation: { x: 0.0, y: 0.000000087423, z: 0.0, w: 1.0 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },

    ],
    [BuildingPresetID.HeliBaseTwo_HelipadTwo]: [
        { id: mod.RuntimeSpawn_FireStorm.ConstructionSite_02_B, position: { x: -202.36897277832, y: 131.022247314453, z: 127.627777099609 }, rotation: { x: 0.0, y: 0.0, z: 1.0, w: -0.0000000437114 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
        { id: mod.RuntimeSpawn_FireStorm.StairsRefinery_02, position: { x: -206.952453613281, y: 123.318916320801, z: 121.98291015625 }, rotation: { x: 0.0, y: 0.70710676908493, z: 0.0, w: 0.70710676908493 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
        { id: mod.RuntimeSpawn_FireStorm.StairsRefinery_02, position: { x: -209.870529174805, y: 123.318916320801, z: 130.917175292969 }, rotation: { x: 0.0, y: 1.0, z: 0.0, w: -0.0000000437114 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
        { id: mod.RuntimeSpawn_FireStorm.StairsRefinery_02, position: { x: -198.320007324219, y: 123.318916320801, z: 133.257751464844 }, rotation: { x: 0.0, y: -0.70710670948029, z: 0.0, w: 0.70710682868958 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
        { id: mod.RuntimeSpawn_FireStorm.StairsRefinery_02, position: { x: -194.770172119141, y: 123.318916320801, z: 124.542266845703 }, rotation: { x: 0.0, y: 0.000000087423, z: 0.0, w: 1.0 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },

    ],
    [BuildingPresetID.HeliBaseTwo_GruntSpawner]: [
        { id: mod.RuntimeSpawn_FireStorm.Barrack_01_A_Firestorm, position: { x: -199.582870483398, y: 125.630065917969, z: 102.19409942627 }, rotation: { x: 0.0, y: 0.70710676908493, z: 0.0, w: 0.70710676908493 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
    ],


    //TANK BASE ONE
    [BuildingPresetID.TankBaseOne_TankBuilding]: [
        { id: mod.RuntimeSpawn_Common.HighwayOverpass_Foundation_01, position: { x: -180.833465576172, y: 121.121688842773, z: -355.97216796875 }, rotation: { x: 0.70710670948029, y: 0.00000005338515, z: 0.70710682868958, w: 0.00000005338514 }, scale: { x: 0.99999994039536, y: 0.99999994039536, z: 1.0 } },
        { id: mod.RuntimeSpawn_Common.HighwayOverpass_Foundation_01, position: { x: -167.20361328125, y: 120.963989257813, z: -355.662811279297 }, rotation: { x: 0.70710670948029, y: 0.00000005338515, z: 0.70710682868958, w: 0.00000005338514 }, scale: { x: 0.99999994039536, y: 0.99999994039536, z: 1.0 } },
        { id: mod.RuntimeSpawn_Common.HighwayOverpass_Foundation_01, position: { x: -154.823013305664, y: 121.121688842773, z: -355.97216796875 }, rotation: { x: 0.70710670948029, y: 0.00000005338515, z: 0.70710682868958, w: 0.00000005338514 }, scale: { x: 0.99999994039536, y: 0.99999994039536, z: 1.0 } },
        { id: mod.RuntimeSpawn_Common.HighwayOverpass_Foundation_01, position: { x: -154.823013305664, y: 121.121688842773, z: -345.97216796875 }, rotation: { x: 0.70710670948029, y: 0.00000005338515, z: 0.70710682868958, w: 0.00000005338514 }, scale: { x: 0.99999994039536, y: 0.99999994039536, z: 1.0 } },
        { id: mod.RuntimeSpawn_Common.HighwayOverpass_Foundation_01, position: { x: -154.823013305664, y: 121.121688842773, z: -335.97216796875 }, rotation: { x: 0.70710670948029, y: 0.00000005338515, z: 0.70710682868958, w: 0.00000005338514 }, scale: { x: 0.99999994039536, y: 0.99999994039536, z: 1.0 } },
        { id: mod.RuntimeSpawn_Common.HighwayOverpass_Foundation_01, position: { x: -136.458679199219, y: 115.644538879395, z: -333.47119140625 }, rotation: { x: 0.6803874373436, y: -0.19254305958748, z: 0.68038755655289, w: 0.19254311919212 }, scale: { x: 0.99999988079071, y: 0.99999994039536, z: 1.0 } },
        { id: mod.RuntimeSpawn_Common.HighwayOverpass_Foundation_01, position: { x: -154.823013305664, y: 121.121688842773, z: -325.97216796875 }, rotation: { x: 0.70710670948029, y: 0.00000005338515, z: 0.70710682868958, w: 0.00000005338514 }, scale: { x: 0.99999994039536, y: 0.99999994039536, z: 1.0 } },
        { id: mod.RuntimeSpawn_Common.HighwayOverpass_Foundation_01, position: { x: -174.408737182617, y: 120.932846069336, z: -304.237762451172 }, rotation: { x: 0.99977016448975, y: 0.00000007454348, z: 0.00000004532001, w: -0.02143972739577 }, scale: { x: 0.99999988079071, y: 0.99999994039536, z: 0.99999994039536 } },
        { id: mod.RuntimeSpawn_Common.HighwayOverpass_Foundation_01, position: { x: -187.970428466797, y: 121.357795715332, z: -328.385528564453 }, rotation: { x: 0.99809032678604, y: 0.06177152693272, z: -0.00000004362791, w: 0.00000000270012 }, scale: { x: 1.0, y: 1.0, z: 0.99999994039536 } },
        { id: mod.RuntimeSpawn_Common.HighwayOverpass_Foundation_01, position: { x: -180.833465576172, y: 121.121688842773, z: -345.97216796875 }, rotation: { x: 0.70710670948029, y: 0.00000005338515, z: 0.70710682868958, w: 0.00000005338514 }, scale: { x: 0.99999994039536, y: 0.99999994039536, z: 1.0 } },
        { id: mod.RuntimeSpawn_Common.HighwayOverpass_Straight_01_4096, position: { x: -178.442443847656, y: 120.487319946289, z: -354.582611083984 }, rotation: { x: -0.70648944377899, y: -0.00000003088164, z: 0.70772355794907, w: 0.00000003093558 }, scale: { x: 0.99999994039536, y: 1.0, z: 0.99999994039536 } },
        { id: mod.RuntimeSpawn_FireStorm.BarrierConcreteWall_01_Row3, position: { x: -171.395294189453, y: 120.853424072266, z: -313.94873046875 }, rotation: { x: 0.0, y: 0.0, z: 0.0, w: 1.0 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
        { id: mod.RuntimeSpawn_FireStorm.ConcreteBrickStack_04, position: { x: -187.726806640625, y: 121.430778503418, z: -314.399688720703 }, rotation: { x: 0.0, y: 0.0, z: 0.0, w: 1.0 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
        { id: mod.RuntimeSpawn_FireStorm.Warehouse_01_C, position: { x: -189.30859375, y: 121.456230163574, z: -343.775207519531 }, rotation: { x: 0.0, y: 0.0, z: 0.0, w: 1.0 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
    ],
    [BuildingPresetID.TankBaseOne_OilRig]: [
        { id: mod.RuntimeSpawn_FireStorm.RefineryConstruction_01, position: { x: -221.372711181641, y: 121.966011047363, z: -345.945709228516 }, rotation: { x: 0.0, y: 1.0, z: 0.0, w: 0.0000000437114 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
        { id: mod.RuntimeSpawn_FireStorm.RefineryChimney_01, position: { x: -216.231231689453, y: 125.15837097168, z: -348.260437011719 }, rotation: { x: 0.0, y: 1.0, z: 0.0, w: 0.0000000437114 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
    ],
    [BuildingPresetID.TankBaseOne_CarSpawn1]: [
        { id: mod.RuntimeSpawn_FireStorm.BarrierHesco_01_Row06, position: { x: -248.165496826172, y: 123.870590209961, z: -308.712829589844 }, rotation: { x: 0.0, y: 0.70710676908493, z: 0.0, w: 0.70710676908493 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
        { id: mod.RuntimeSpawn_FireStorm.BarrierHesco_01_Row06, position: { x: -243.163055419922, y: 123.870590209961, z: -308.62744140625 }, rotation: { x: 0.0, y: 0.70710676908493, z: 0.0, w: 0.70710676908493 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
        { id: mod.RuntimeSpawn_FireStorm.BarrierHesco_01_Row06, position: { x: -242.35319519043, y: 123.870590209961, z: -319.587860107422 }, rotation: { x: 0.0, y: -0.70710670948029, z: 0.0, w: 0.70710682868958 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
        { id: mod.RuntimeSpawn_FireStorm.BarrierHesco_01_Row06, position: { x: -247.504150390625, y: 123.870590209961, z: -319.587860107422 }, rotation: { x: 0.0, y: -0.70710670948029, z: 0.0, w: 0.70710682868958 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
    ],
    [BuildingPresetID.TankBaseOne_CarSpawn2]: [
        { id: mod.RuntimeSpawn_FireStorm.BarrierHesco_01_Row06, position: { x: -248.165496826172, y: 124.094116210938, z: -295.563720703125 }, rotation: { x: 0.0, y: 0.70710676908493, z: 0.0, w: 0.70710676908493 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
        { id: mod.RuntimeSpawn_FireStorm.BarrierHesco_01_Row06, position: { x: -243.163055419922, y: 124.094116210938, z: -295.478332519531 }, rotation: { x: 0.0, y: 0.70710676908493, z: 0.0, w: 0.70710676908493 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
        { id: mod.RuntimeSpawn_FireStorm.BarrierHesco_01_Row06, position: { x: -242.35319519043, y: 124.094116210938, z: -306.438751220703 }, rotation: { x: 0.0, y: -0.70710670948029, z: 0.0, w: 0.70710682868958 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
        { id: mod.RuntimeSpawn_FireStorm.BarrierHesco_01_Row06, position: { x: -247.504150390625, y: 124.094116210938, z: -306.438751220703 }, rotation: { x: 0.0, y: -0.70710670948029, z: 0.0, w: 0.70710682868958 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
    ],
    [BuildingPresetID.TankBaseOne_AntiAir]: [
        { id: mod.RuntimeSpawn_Common.HighwayOverpass_Foundation_01, position: { x: -158.703186035156, y: 112.014999389648, z: -297.987457275391 }, rotation: { x: 0.5, y: 0.50000005960464, z: 0.5, w: -0.49999994039536 }, scale: { x: 0.99999994039536, y: 0.99999994039536, z: 1.0 } },
        { id: mod.RuntimeSpawn_FireStorm.StairsRefineryPlatform_01_320x512x32, position: { x: -161.710006713867, y: 120.506042480469, z: -303.477691650391 }, rotation: { x: 0.00000000380761, y: -0.00000000049721, z: 0.11487647891045, w: 0.99337977170944 }, scale: { x: 1.0, y: 1.00000011920929, z: 1.0 } },
        { id: mod.RuntimeSpawn_Common.SandBags_01_256x60, position: { x: -151.296051025391, y: 121.621627807617, z: -302.386962890625 }, rotation: { x: 0.0, y: -0.70710676908493, z: 0.0, w: 0.70710676908493 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
        { id: mod.RuntimeSpawn_Common.SandBags_01_256x180, position: { x: -153.21208190918, y: 121.603187561035, z: -307.108276367188 }, rotation: { x: 0.0, y: 0.0, z: 0.0, w: 1.0 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
        { id: mod.RuntimeSpawn_FireStorm.SandBags_01_256x60_DDPF, position: { x: -150.677108764648, y: 121.621627807617, z: -302.316802978516 }, rotation: { x: 0.0, y: 0.70710670948029, z: 0.0, w: 0.70710682868958 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
        { id: mod.RuntimeSpawn_FireStorm.SandBags_01_256x60_DDPF, position: { x: -157.847229003906, y: 121.621627807617, z: -303.720642089844 }, rotation: { x: 0.0, y: 0.70710670948029, z: 0.0, w: 0.70710682868958 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
        { id: mod.RuntimeSpawn_FireStorm.SandBags_01_256x60_DDPF, position: { x: -157.248764038086, y: 121.621627807617, z: -307.130462646484 }, rotation: { x: 0.0, y: 0.0, z: 0.0, w: 1.0 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
        { id: mod.RuntimeSpawn_FireStorm.SandBags_01_256x60_DDPF, position: { x: -151.275375366211, y: 121.621627807617, z: -307.238159179688 }, rotation: { x: 0.0, y: -0.70710676908493, z: 0.0, w: 0.70710676908493 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
        { id: mod.RuntimeSpawn_FireStorm.SandBags_01_C45_a_DDPF, position: { x: -153.290451049805, y: 121.617317199707, z: -298.503051757813 }, rotation: { x: 0.0, y: 0.0, z: 0.0, w: 1.0 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
        { id: mod.RuntimeSpawn_FireStorm.SandBags_01_C90_a_DDPF, position: { x: -158.477493286133, y: 121.619819641113, z: -299.785919189453 }, rotation: { x: 0.0, y: -0.70710676908493, z: 0.0, w: 0.70710676908493 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
        { id: mod.RuntimeSpawn_FireStorm.SandBags_01_256x180_DDPF, position: { x: -155.884963989258, y: 121.603179931641, z: -307.084991455078 }, rotation: { x: 0.0, y: 0.0, z: 0.0, w: 1.0 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
        { id: mod.RuntimeSpawn_Common.SandBags_01_C90_A, position: { x: -157.070007324219, y: 121.619819641113, z: -307.784973144531 }, rotation: { x: 0.0, y: 1.0, z: 0.0, w: 0.00000004371139 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
        { id: mod.RuntimeSpawn_FireStorm.SandBags_01_256x60_DDPF, position: { x: -155.754013061523, y: 121.621635437012, z: -298.382171630859 }, rotation: { x: 0.0, y: 0.0, z: 0.0, w: 1.0 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
        { id: mod.RuntimeSpawn_FireStorm.SandBags_01_256x60_DDPF, position: { x: -155.727294921875, y: 121.621627807617, z: -299.003265380859 }, rotation: { x: 0.0, y: 1.0, z: 0.0, w: 0.00000004371139 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
    ],
    [BuildingPresetID.TankBaseOne_GruntSpawner]: [
        { id: mod.RuntimeSpawn_FireStorm.Barrack_01_A_Firestorm, position: { x: -243.033004760742, y: 128.563003540039, z: -270.620971679688 }, rotation: { x: 0.0, y: 0.70710676908493, z: 0.0, w: 0.70710676908493 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
    ],


    //TANK BASE TWO
    [BuildingPresetID.TankBaseTwo_AntiAir]: [
        { id: mod.RuntimeSpawn_Common.HighwayOverpass_Foundation_01, position: { x: 171.716400146484, y: 112.743507385254, z: 97.4325637817383 }, rotation: { x: 0.51466530561447, y: 0.50164949893951, z: 0.49074405431747, w: -0.49258267879486 }, scale: { x: 0.99999982118607, y: 1.0, z: 0.99999982118607 } },
        { id: mod.RuntimeSpawn_FireStorm.StairsRefineryPlatform_01_320x512x32, position: { x: 168.772384643555, y: 120.888061523438, z: 91.7149276733398 }, rotation: { x: -0.01521213632077, y: 0.00978804472834, z: 0.14254066348076, w: 0.98962366580963 }, scale: { x: 1.00000011920929, y: 1.0, z: 0.99999982118607 } },
        { id: mod.RuntimeSpawn_Common.SandBags_01_256x60, position: { x: 179.161102294922, y: 122.114974975586, z: 92.6096420288086 }, rotation: { x: -0.01561473496258, y: -0.70172822475433, z: 0.00771124754101, w: 0.71223187446594 }, scale: { x: 0.99999988079071, y: 0.99999988079071, z: 1.00000011920929 } },
        { id: mod.RuntimeSpawn_Common.SandBags_01_256x180, position: { x: 177.174209594727, y: 121.963104248047, z: 87.9201431274414 }, rotation: { x: -0.01649394445121, y: 0.00742728589103, z: -0.00558860693127, w: 0.99982076883316 }, scale: { x: 1.00000011920929, y: 0.99999988079071, z: 0.99999988079071 } },
        { id: mod.RuntimeSpawn_FireStorm.SandBags_01_256x60_DDPF, position: { x: 179.780990600586, y: 122.110221862793, z: 92.6707000732422 }, rotation: { x: -0.00771124660969, y: 0.71223187446594, z: -0.01561473403126, w: 0.70172822475433 }, scale: { x: 0.99999988079071, y: 0.99999988079071, z: 1.00000011920929 } },
        { id: mod.RuntimeSpawn_FireStorm.SandBags_01_256x60_DDPF, position: { x: 172.591003417969, y: 122.145919799805, z: 91.3729400634766 }, rotation: { x: -0.00771124660969, y: 0.71223187446594, z: -0.01561473403126, w: 0.70172822475433 }, scale: { x: 0.99999988079071, y: 0.99999988079071, z: 1.00000011920929 } },
        { id: mod.RuntimeSpawn_FireStorm.SandBags_01_256x60_DDPF, position: { x: 173.138092041016, y: 122.026901245117, z: 87.9565734863281 }, rotation: { x: -0.01649394445121, y: 0.00742728589103, z: -0.00558860693127, w: 0.99982076883316 }, scale: { x: 1.00000011920929, y: 0.99999988079071, z: 0.99999988079071 } },
        { id: mod.RuntimeSpawn_FireStorm.SandBags_01_256x60_DDPF, position: { x: 175.563247680664, y: 121.999198913574, z: 87.9209976196289 }, rotation: { x: -0.01649394445121, y: 0.00742728589103, z: -0.00558860693127, w: 0.99982076883316 }, scale: { x: 1.00000011920929, y: 0.99999988079071, z: 0.99999988079071 } },
        { id: mod.RuntimeSpawn_FireStorm.SandBags_01_256x60_DDPF, position: { x: 179.108825683594, y: 121.955139160156, z: 87.7613296508789 }, rotation: { x: -0.01561473496258, y: -0.70172822475433, z: 0.00771124754101, w: 0.71223187446594 }, scale: { x: 0.99999988079071, y: 0.99999988079071, z: 1.00000011920929 } },
        { id: mod.RuntimeSpawn_FireStorm.SandBags_01_C45_a_DDPF, position: { x: 177.225402832031, y: 122.261215209961, z: 96.5204391479492 }, rotation: { x: -0.01649394445121, y: 0.00742728589103, z: -0.00558860693127, w: 0.99982076883316 }, scale: { x: 1.00000011920929, y: 0.99999988079071, z: 0.99999988079071 } },
        { id: mod.RuntimeSpawn_FireStorm.SandBags_01_C90_a_DDPF, position: { x: 172.019989013672, y: 122.280754089355, z: 95.3143920898438 }, rotation: { x: -0.01561473496258, y: -0.70172822475433, z: 0.00771124754101, w: 0.71223187446594 }, scale: { x: 0.99999988079071, y: 0.99999988079071, z: 1.00000011920929 } },
        { id: mod.RuntimeSpawn_Common.SandBags_01_C90_A, position: { x: 173.30696105957, y: 122.001518249512, z: 87.299934387207 }, rotation: { x: 0.00558860553429, y: 0.99982076883316, z: -0.01649394445121, w: -0.00742724211887 }, scale: { x: 1.00000011920929, y: 0.99999988079071, z: 0.99999988079071 } },
        { id: mod.RuntimeSpawn_FireStorm.SandBags_01_256x60_DDPF, position: { x: 174.764129638672, y: 122.297645568848, z: 96.6772232055664 }, rotation: { x: -0.01649394445121, y: 0.00742728589103, z: -0.00558860693127, w: 0.99982076883316 }, scale: { x: 1.00000011920929, y: 0.99999988079071, z: 0.99999988079071 } },
        { id: mod.RuntimeSpawn_FireStorm.SandBags_01_256x60_DDPF, position: { x: 174.781494140625, y: 122.276901245117, z: 96.0561294555664 }, rotation: { x: 0.00558860553429, y: 0.99982076883316, z: -0.01649394445121, w: -0.00742724211887 }, scale: { x: 1.00000011920929, y: 0.99999988079071, z: 0.99999988079071 } },
    ],
    [BuildingPresetID.TankBasetwo_CarSpawn1]: [
        { id: mod.RuntimeSpawn_FireStorm.BarrierHesco_01_Row06, position: { x: 164.407684326172, y: 122.236511230469, z: 137.931045532227 }, rotation: { x: 0.0, y: 1.0, z: 0.0, w: -0.0000000754979 }, scale: { x: 1.0, y: 1.0, z: 0.99999994039536 } },
        { id: mod.RuntimeSpawn_FireStorm.BarrierHesco_01_Row06, position: { x: 164.399841308594, y: 122.171936035156, z: 142.982452392578 }, rotation: { x: 0.0, y: 1.0, z: 0.0, w: -0.0000000754979 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
    ],
    [BuildingPresetID.TankBaseTwo_CarSpawn2]: [
        { id: mod.RuntimeSpawn_FireStorm.BarrierHesco_01_Row06, position: { x: 173.399963378906, y: 122.076370239258, z: 143.273132324219 }, rotation: { x: -0.00000000223579, y: 0.9995613694191, z: 0.02961390838027, w: -0.00000007546478 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
        { id: mod.RuntimeSpawn_FireStorm.BarrierHesco_01_Row06, position: { x: 173.397308349609, y: 122.207618713379, z: 138.242950439453 }, rotation: { x: -0.00000000223579, y: 0.9995613694191, z: 0.02961390838027, w: -0.00000007546478 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
    ],
    [BuildingPresetID.TankBaseTwo_OilRig]: [
        { id: mod.RuntimeSpawn_FireStorm.RefineryChimney_01, position: { x: 182.420150756836, y: 122.029876708984, z: 129.852645874023 }, rotation: { x: 0.0, y: -0.00000000000001, z: 0.0, w: 1.0 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
        { id: mod.RuntimeSpawn_FireStorm.RefineryConstruction_01, position: { x: 187.561630249023, y: 122.029876708984, z: 127.53791809082 }, rotation: { x: 0.0, y: -0.00000000000001, z: 0.0, w: 1.0 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
    ],
    [BuildingPresetID.TankBaseTwo_TankBuilding]: [
        { id: mod.RuntimeSpawn_Common.HighwayOverpass_Straight_01_4096, position: { x: 136.146835327148, y: 124.883110046387, z: 133.3798828125 }, rotation: { x: 1.0, y: -0.0000000754979, z: 0.0000000437114, w: -0.0 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
        { id: mod.RuntimeSpawn_Common.HighwayOverpass_Straight_01_4096, position: { x: 94.8469848632813, y: 115.044593811035, z: 122.490295410156 }, rotation: { x: 0.50000005960464, y: 0.5, z: -0.49999997019768, w: 0.5 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
        { id: mod.RuntimeSpawn_Common.HighwayOverpass_Straight_01_4096, position: { x: 136.019866943359, y: 115.289375305176, z: 123.159515380859 }, rotation: { x: 0.70710676908493, y: -0.0000000842937, z: -0.00000002247646, w: 0.70710676908493 }, scale: { x: 1.0, y: 0.99999994039536, z: 0.99999994039536 } },
        { id: mod.RuntimeSpawn_Common.HighwayOverpass_Foundation_01, position: { x: 135.830078125, y: 117.467491149902, z: 120.515441894531 }, rotation: { x: 0.0, y: 0.70710676908493, z: 0.0, w: 0.70710676908493 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
        { id: mod.RuntimeSpawn_Common.HighwayOverpass_Foundation_01, position: { x: 135.830078125, y: 117.467491149902, z: 130.51545715332 }, rotation: { x: 0.0, y: 0.70710676908493, z: 0.0, w: 0.70710676908493 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
        { id: mod.RuntimeSpawn_Common.HighwayOverpass_Foundation_01, position: { x: 107.714424133301, y: 114.789619445801, z: 117.317825317383 }, rotation: { x: -0.15723603963852, y: 0.0, z: 0.0, w: 0.98756104707718 }, scale: { x: 0.99999994039536, y: 0.99999988079071, z: 0.99999988079071 } },
        { id: mod.RuntimeSpawn_Common.HighwayOverpass_Foundation_01, position: { x: 117.944198608398, y: 114.789619445801, z: 117.317825317383 }, rotation: { x: -0.15723603963852, y: 0.0, z: 0.0, w: 0.98756104707718 }, scale: { x: 0.99999994039536, y: 0.99999988079071, z: 0.99999988079071 } },
        { id: mod.RuntimeSpawn_Common.HighwayOverpass_Foundation_01, position: { x: 103.472412109375, y: 116.661697387695, z: 156.343704223633 }, rotation: { x: 0.0, y: 0.70710676908493, z: 0.0, w: 0.70710676908493 }, scale: { x: 0.99999994039536, y: 0.99999994039536, z: 1.0 } },
        { id: mod.RuntimeSpawn_Common.HighwayOverpass_Foundation_01, position: { x: 122.47241973877, y: 116.661697387695, z: 156.343719482422 }, rotation: { x: 0.0, y: 0.70710676908493, z: 0.0, w: 0.70710676908493 }, scale: { x: 0.99999994039536, y: 0.99999994039536, z: 1.0 } },
        { id: mod.RuntimeSpawn_Common.HighwayOverpass_Foundation_01, position: { x: 142.472412109375, y: 116.661697387695, z: 156.343734741211 }, rotation: { x: 0.0, y: 0.70710676908493, z: 0.0, w: 0.70710676908493 }, scale: { x: 0.99999994039536, y: 0.99999994039536, z: 1.0 } },
        { id: mod.RuntimeSpawn_Common.HighwayOverpass_Foundation_01, position: { x: 142.472412109375, y: 116.661697387695, z: 146.34375 }, rotation: { x: 0.0, y: 0.70710676908493, z: 0.0, w: 0.70710676908493 }, scale: { x: 0.99999994039536, y: 0.99999994039536, z: 1.0 } },
        { id: mod.RuntimeSpawn_Common.HighwayOverpass_Foundation_01, position: { x: 142.472412109375, y: 116.661697387695, z: 136.343765258789 }, rotation: { x: 0.0, y: 0.70710676908493, z: 0.0, w: 0.70710676908493 }, scale: { x: 0.99999994039536, y: 0.99999994039536, z: 1.0 } },
        { id: mod.RuntimeSpawn_FireStorm.Warehouse_01_C, position: { x: 124.812217712402, y: 125.934143066406, z: 122.353393554688 }, rotation: { x: 0.0, y: -0.70710670948029, z: 0.0, w: 0.70710682868958 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
    ],
    [BuildingPresetID.TankBaseTwo_GruntSpawner]: [
        { id: mod.RuntimeSpawn_FireStorm.Barrack_01_A_Firestorm, position: { x: 203.922332763672, y: 121.830101013184, z: 62.1745529174805 }, rotation: { x: 0.0, y: 1.0, z: 0.0, w: -0.0000000437114 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
    ],

    //CENTER BASE
    [BuildingPresetID.CenterBase_RadarTower]: [
        { id: mod.RuntimeSpawn_FireStorm.NASARADAR_01_A_UNGROUPED, position: { x: -5.39212417602539, y: 121.319839477539, z: -116.000564575195 }, rotation: { x: 0.0, y: 0.0, z: 0.0, w: 1.0 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
    ]
};

const presetPassiveDataSource: Record<PassivePresetID, IPassiveUpgradeData[]> = {
    [PassivePresetID.Default_MoneyPrinter]: [{ type: PassiveUpgradeTypeID.BaseGainPointsPerSecUpgrade, amount: 10 }],
    [PassivePresetID.Default_MorePoints]: [{ type: PassiveUpgradeTypeID.BaseGainCashPerSecUpgrade, amount: 10 }],
    [PassivePresetID.BaseTwo_MoneyPrinter]: [{ type: PassiveUpgradeTypeID.BaseGainPointsPerSecUpgrade, amount: 10 }],
    [PassivePresetID.BaseTwo_MorePoints]: [{ type: PassiveUpgradeTypeID.BaseGainCashPerSecUpgrade, amount: 10 }],
    [PassivePresetID.CenterBase_RadarTower]: [{ type: PassiveUpgradeTypeID.BaseRadar, amount: 15 }],
};

const presetVehicleDataSource: Record<VehiclePresetID, VehData[]> = {
    [VehiclePresetID.TeamOneMainBase_Buggy1]: [{ vehSpawnpointID: 101 }, { vehSpawnpointID: 102 }, { vehSpawnpointID: 103 }, { vehSpawnpointID: 104 }],
    [VehiclePresetID.TeamOneMainBase_Buggy2]: [{ vehSpawnpointID: 105 }, { vehSpawnpointID: 106 }, { vehSpawnpointID: 107 }, { vehSpawnpointID: 108 }],
    [VehiclePresetID.TeamOneMainBase_Car]: [{ vehSpawnpointID: 166 }],
    [VehiclePresetID.TeamOneMainBase_TransportHeli]: [{ vehSpawnpointID: 125 }],

    [VehiclePresetID.TeamTwoMainBase_Buggy1]: [{ vehSpawnpointID: 301 }, { vehSpawnpointID: 302 }, { vehSpawnpointID: 303 }, { vehSpawnpointID: 304 }],
    [VehiclePresetID.TeamTwoMainBase_Buggy2]: [{ vehSpawnpointID: 305 }, { vehSpawnpointID: 306 }, { vehSpawnpointID: 307 }, { vehSpawnpointID: 308 }],
    [VehiclePresetID.TeamTwoMainBase_Car]: [{ vehSpawnpointID: 167 }],
    [VehiclePresetID.TeamTwoMainBase_TransportHeli]: [{ vehSpawnpointID: 182 }],

    [VehiclePresetID.AirPortOne_Plane]: [{ vehSpawnpointID: 5 }],
    [VehiclePresetID.AirPortOne_PlaneTwo]: [{ vehSpawnpointID: 61 }],

    [VehiclePresetID.AirPortTwo_Plane]: [{ vehSpawnpointID: 11 }],
    [VehiclePresetID.AirPortTwo_PlaneTwo]: [{ vehSpawnpointID: 13 }],

    [VehiclePresetID.HeliBaseOne_Heli]: [{ vehSpawnpointID: 7 }],
    [VehiclePresetID.HeliBaseOne_Helitwo]: [{ vehSpawnpointID: 159 }],

    [VehiclePresetID.HeliBaseTwo_Heli]: [{ vehSpawnpointID: 9 }],
    [VehiclePresetID.HeliBaseTwo_HeliTwo]: [{ vehSpawnpointID: 71 }],

    [VehiclePresetID.TankBaseOne_Tanks]: [{ vehSpawnpointID: 8 }],
    [VehiclePresetID.TankBaseOne_CarSpawn1]: [{ vehSpawnpointID: 81 }],
    [VehiclePresetID.TankBaseOne_CarSpawn2]: [{ vehSpawnpointID: 82 }],

    [VehiclePresetID.TankBaseTwo_Tanks]: [{ vehSpawnpointID: 12 }],
    [VehiclePresetID.TankBaseTwo_CarSpawn1]: [{ vehSpawnpointID: 121 }],
    [VehiclePresetID.TankBaseTwo_CarSpawn2]: [{ vehSpawnpointID: 122 }]

};

const presetGruntDataSource: Record<GruntPresetID, GruntData[]> = {
    [GruntPresetID.TankBaseOne_Assault]: [
        { gruntSpawnpointID: 10, amount: 2, soldierClass: mod.SoldierClass.Assault },
        { gruntSpawnpointID: 10, amount: 1, soldierClass: mod.SoldierClass.Recon },
        { gruntSpawnpointID: 10, amount: 1, soldierClass: mod.SoldierClass.Engineer },
        { gruntSpawnpointID: 10, amount: 1, soldierClass: mod.SoldierClass.Support }
    ],
    [GruntPresetID.TankBaseTwo_Assault]: [
        { gruntSpawnpointID: 11, amount: 2, soldierClass: mod.SoldierClass.Assault },
        { gruntSpawnpointID: 11, amount: 1, soldierClass: mod.SoldierClass.Recon },
        { gruntSpawnpointID: 11, amount: 1, soldierClass: mod.SoldierClass.Engineer },
        { gruntSpawnpointID: 11, amount: 1, soldierClass: mod.SoldierClass.Support }
    ],
    [GruntPresetID.HeliBaseOne_Assault]: [
        { gruntSpawnpointID: 12, amount: 2, soldierClass: mod.SoldierClass.Assault },
        { gruntSpawnpointID: 12, amount: 1, soldierClass: mod.SoldierClass.Recon },
        { gruntSpawnpointID: 12, amount: 1, soldierClass: mod.SoldierClass.Engineer },
        { gruntSpawnpointID: 12, amount: 1, soldierClass: mod.SoldierClass.Support }
    ],
    [GruntPresetID.HeliBaseTwo_Assault]: [
        { gruntSpawnpointID: 13, amount: 2, soldierClass: mod.SoldierClass.Assault },
        { gruntSpawnpointID: 13, amount: 1, soldierClass: mod.SoldierClass.Recon },
        { gruntSpawnpointID: 13, amount: 1, soldierClass: mod.SoldierClass.Engineer },
        { gruntSpawnpointID: 13, amount: 1, soldierClass: mod.SoldierClass.Support }

    ],
    [GruntPresetID.AirPortBaseTwo_Assault]: [
        { gruntSpawnpointID: 14, amount: 2, soldierClass: mod.SoldierClass.Assault },
        { gruntSpawnpointID: 14, amount: 1, soldierClass: mod.SoldierClass.Recon },
        { gruntSpawnpointID: 14, amount: 1, soldierClass: mod.SoldierClass.Engineer },
        { gruntSpawnpointID: 14, amount: 1, soldierClass: mod.SoldierClass.Support }
    ],
    [GruntPresetID.AirPortBaseOne_Assault]: [
        { gruntSpawnpointID: 15, amount: 2, soldierClass: mod.SoldierClass.Assault },
        { gruntSpawnpointID: 15, amount: 1, soldierClass: mod.SoldierClass.Recon },
        { gruntSpawnpointID: 15, amount: 1, soldierClass: mod.SoldierClass.Engineer },
        { gruntSpawnpointID: 15, amount: 1, soldierClass: mod.SoldierClass.Support }
    ]
};

const presetStationaryDataSource: Record<StationaryPresetID, StationaryData[]> = {
    [StationaryPresetID.AirPortOne_AirGuns]: [{ stationarySpawnpointID: 5, type: mod.StationaryEmplacements.GDF009 }],
    [StationaryPresetID.AirPortTwo_AirGuns]: [{ stationarySpawnpointID: 111, type: mod.StationaryEmplacements.GDF009 }],
    [StationaryPresetID.TankBaseOne_AntiAir]: [{ stationarySpawnpointID: 83, type: mod.StationaryEmplacements.GDF009 }],
    [StationaryPresetID.TankBaseTwo_AntiAir]: [{ stationarySpawnpointID: 121, type: mod.StationaryEmplacements.GDF009 }],
    [StationaryPresetID.CenterBase_AntiTank]: [{ stationarySpawnpointID: 122, type: mod.StationaryEmplacements.BGM71TOW }],
};


const BASE_DEFINITIONS: IBase[] = [
    {
        id: "team_one_home_base",
        name: mod.stringkeys.hqbase,
        capturepointID: -1,
        worldiconPointID: 10,
        interactID: 1,
        capturePointsGainPerTick: 0,
        captureCashGainPerTick: 0,
        teamMainBase: TeamOne,
        baseDefaultWorth: 0,
        availableUpgrades: [
            {
                id: "team_one_home_base_buggySpawn",
                name: mod.stringkeys.buggySpawners,
                description: mod.stringkeys.buggySpawnersDescription,
                image: mod.UIImageType.TEMP_PortalIcon,
                cost: 250,
                category: UpgradeCategory.vehicle,
                effects: [
                    { type: "Building", data: BuildingPresetID.TeamOneMainBase_Buggy1 },
                    { type: "Vehicle", data: VehiclePresetID.TeamOneMainBase_Buggy1 }
                ]
            },
            {
                id: "team_one_home_base_buggySpawn2",
                name: mod.stringkeys.buggySpawners,
                description: mod.stringkeys.buggySpawnersDescription,
                image: mod.UIImageType.TEMP_PortalIcon,
                cost: 250,
                category: UpgradeCategory.vehicle,
                effects: [
                    { type: "Building", data: BuildingPresetID.TeamOneMainBase_Buggy2 },
                    { type: "Vehicle", data: VehiclePresetID.TeamOneMainBase_Buggy2 }
                ]
            },
            {
                id: "team_one_home_base_carSpawn",
                name: mod.stringkeys.carSpawner,
                description: mod.stringkeys.carSpawnerDescription,
                image: mod.UIImageType.TEMP_PortalIcon,
                cost: 400,
                category: UpgradeCategory.vehicle,
                effects: [
                    { type: "Building", data: BuildingPresetID.TeamOneMainBase_Car },
                    { type: "Vehicle", data: VehiclePresetID.TeamOneMainBase_Car }
                ]
            },
            {
                id: "team_one_home_base_transport_heli",
                name: mod.stringkeys.transportHeliSpawner,
                description: mod.stringkeys.transportHeliDescription,
                image: mod.UIImageType.TEMP_PortalIcon,
                cost: 550,
                category: UpgradeCategory.vehicle,
                effects: [
                    { type: "Building", data: BuildingPresetID.TeamOneMainBase_TransportHeli },
                    { type: "Vehicle", data: VehiclePresetID.TeamOneMainBase_TransportHeli }
                ]
            }
        ]
    },
    {
        id: "team_two_home_base",
        name: mod.stringkeys.hq2base,
        capturepointID: 2,
        worldiconPointID: 20,
        interactID: 2,
        capturePointsGainPerTick: 0,
        captureCashGainPerTick: 0,
        baseDefaultWorth: 0,
        teamMainBase: TeamTwo,
        availableUpgrades: [
            {
                id: "team_two_home_base_buggySpawn",
                name: mod.stringkeys.buggySpawners,
                description: mod.stringkeys.buggySpawnersDescription,
                image: mod.UIImageType.TEMP_PortalIcon,
                cost: 250,
                category: UpgradeCategory.vehicle,
                effects: [
                    { type: "Building", data: BuildingPresetID.TeamTwoMainBase_Buggy1 },
                    { type: "Vehicle", data: VehiclePresetID.TeamTwoMainBase_Buggy1 }
                ]
            },
            {
                id: "team_two_home_base_buggySpawn2",
                name: mod.stringkeys.buggySpawners,
                description: mod.stringkeys.buggySpawnersDescription,
                image: mod.UIImageType.TEMP_PortalIcon,
                cost: 250,
                category: UpgradeCategory.vehicle,
                effects: [
                    { type: "Building", data: BuildingPresetID.TeamTwoMainBase_Buggy2 },
                    { type: "Vehicle", data: VehiclePresetID.TeamTwoMainBase_Buggy2 }
                ]
            },
            {
                id: "team_two_home_base_carSpawn",
                name: mod.stringkeys.carSpawner,
                description: mod.stringkeys.carSpawnerDescription,
                image: mod.UIImageType.TEMP_PortalIcon,
                cost: 400,
                category: UpgradeCategory.vehicle,
                effects: [
                    { type: "Building", data: BuildingPresetID.TeamTwoMainBase_Car },
                    { type: "Vehicle", data: VehiclePresetID.TeamTwoMainBase_Car }
                ]
            },
            {
                id: "team_two_home_base_transport_heli",
                name: mod.stringkeys.transportHeliSpawner,
                description: mod.stringkeys.transportHeliDescription,
                image: mod.UIImageType.TEMP_PortalIcon,
                cost: 550,
                category: UpgradeCategory.vehicle,
                effects: [
                    { type: "Building", data: BuildingPresetID.TeamTwoMainBase_TransportHeli },
                    { type: "Vehicle", data: VehiclePresetID.TeamTwoMainBase_TransportHeli }
                ]
            }
        ]
    },
    {
        id: "air_port_base_one",
        name: mod.stringkeys.abase,
        capturepointID: 5,
        worldiconPointID: 5,
        interactID: 5,
        capturePointsGainPerTick: 0,
        captureCashGainPerTick: 0,
        baseDefaultWorth: 500,
        availableUpgrades: [
            {
                id: "air_port_base_one_landing_strip",
                name: mod.stringkeys.airplaneSpawner,
                description: mod.stringkeys.airplaneSpawnerDescription,
                image: mod.UIImageType.TEMP_PortalIcon,
                cost: 2000,
                category: UpgradeCategory.vehicle,
                effects: [
                    { type: "Building", data: BuildingPresetID.AirPortOne_LandinStrip },
                    { type: "Vehicle", data: VehiclePresetID.AirPortOne_Plane }
                ]
            },
            {
                id: "air_port_base_one_landing_strip_two",
                name: mod.stringkeys.airplaneSpawner,
                description: mod.stringkeys.airplaneSpawnerDescription,
                image: mod.UIImageType.TEMP_PortalIcon,
                cost: 2000,
                category: UpgradeCategory.vehicle,
                effects: [
                    { type: "Building", data: BuildingPresetID.AirPortOne_LandinStripTwo },
                    { type: "Vehicle", data: VehiclePresetID.AirPortOne_PlaneTwo }
                ]
            },
            {
                id: "air_port_base_one_air_guns",
                name: mod.stringkeys.anitiAirSpawner,
                description: mod.stringkeys.anitiAirSpawnerDescription,
                image: mod.UIImageType.TEMP_PortalIcon,
                cost: 150,
                category: UpgradeCategory.stationary,
                effects: [
                    { type: "Building", data: BuildingPresetID.AirPortOne_AirGuns },
                    { type: "Stationary", data: StationaryPresetID.AirPortOne_AirGuns }
                ]
            },
            {
                id: "air_port_base_one_gruntSpawner",
                name: mod.stringkeys.gruntSpawners,
                description: mod.stringkeys.gruntSpawnersDescription,
                image: mod.UIImageType.TEMP_PortalIcon,
                cost: 350,
                category: UpgradeCategory.building,
                effects: [
                    { type: "Building", data: BuildingPresetID.AirPortOne_GruntSpawner },
                    { type: "Grunt", data: GruntPresetID.AirPortBaseOne_Assault }
                ]
            },
            {
                id: "air_port_base_one_oilRig",
                name: mod.stringkeys.oildRig,
                description: mod.stringkeys.oildRigDescription,
                image: mod.UIImageType.TEMP_PortalIcon,
                cost: 600,
                category: UpgradeCategory.building,
                effects: [
                    { type: "Building", data: BuildingPresetID.AirPortOne_OilRig },
                    { type: "Effect", data: PassivePresetID.Default_MoneyPrinter },
                    { type: "Effect", data: PassivePresetID.Default_MorePoints }
                ]
            },
        ]
    },
    {
        id: "air_port_base_two",
        name: mod.stringkeys.bbase,
        capturepointID: 11,
        worldiconPointID: 11,
        interactID: 11,
        capturePointsGainPerTick: 0,
        captureCashGainPerTick: 0,
        baseDefaultWorth: 500,
        availableUpgrades: [
            {
                id: "air_port_base_two_landing_strip",
                name: mod.stringkeys.airplaneSpawner,
                description: mod.stringkeys.airplaneSpawnerDescription,
                image: mod.UIImageType.TEMP_PortalIcon,
                cost: 2000,
                category: UpgradeCategory.vehicle,
                effects: [
                    { type: "Building", data: BuildingPresetID.AirPortTwo_LandinStrip },
                    { type: "Vehicle", data: VehiclePresetID.AirPortTwo_Plane }
                ]
            },
            {
                id: "air_port_base_two_landing_strip_two",
                name: mod.stringkeys.airplaneSpawner,
                description: mod.stringkeys.airplaneSpawnerDescription,
                image: mod.UIImageType.TEMP_PortalIcon,
                cost: 2000,
                category: UpgradeCategory.vehicle,
                effects: [
                    { type: "Building", data: BuildingPresetID.AirPortTwo_LandinStripTwo },
                    { type: "Vehicle", data: VehiclePresetID.AirPortTwo_PlaneTwo }
                ]
            },
            {
                id: "air_port_base_two_air_guns",
                name: mod.stringkeys.anitiAirSpawner,
                description: mod.stringkeys.anitiAirSpawnerDescription,
                image: mod.UIImageType.TEMP_PortalIcon,
                cost: 150,
                category: UpgradeCategory.stationary,
                effects: [
                    { type: "Building", data: BuildingPresetID.AirPortTwo_AirGuns },
                    { type: "Stationary", data: StationaryPresetID.AirPortTwo_AirGuns }
                ]
            },
            {
                id: "air_port_base_two_gruntSpawner",
                name: mod.stringkeys.gruntSpawners,
                description: mod.stringkeys.gruntSpawnersDescription,
                image: mod.UIImageType.TEMP_PortalIcon,
                cost: 350,
                category: UpgradeCategory.building,
                effects: [
                    { type: "Building", data: BuildingPresetID.AirPortTwo_GruntSpawner },
                    { type: "Grunt", data: GruntPresetID.AirPortBaseTwo_Assault }
                ]
            },
            {
                id: "air_port_base_two_oilRig",
                name: mod.stringkeys.oildRig,
                description: mod.stringkeys.oildRigDescription,
                image: mod.UIImageType.TEMP_PortalIcon,
                cost: 600,
                category: UpgradeCategory.building,
                effects: [
                    { type: "Building", data: BuildingPresetID.AirPortTwo_OilRig },
                    { type: "Effect", data: PassivePresetID.Default_MoneyPrinter },
                    { type: "Effect", data: PassivePresetID.Default_MorePoints }
                ]
            },
        ]
    },
    {
        id: "heli_base_one",
        name: mod.stringkeys.dbase,
        capturepointID: 7,
        worldiconPointID: 7,
        interactID: 7,
        capturePointsGainPerTick: 0,
        captureCashGainPerTick: 0,
        baseDefaultWorth: 500,
        availableUpgrades: [
            {
                id: "heli_base_one_helipad",
                name: mod.stringkeys.helispawner,
                description: mod.stringkeys.helispawnerDescription,
                image: mod.UIImageType.TEMP_PortalIcon,
                cost: 2000,
                category: UpgradeCategory.vehicle,
                effects: [
                    { type: "Building", data: BuildingPresetID.HeliBaseOne_Helipad },
                    { type: "Vehicle", data: VehiclePresetID.HeliBaseOne_Heli }
                ]
            },
            {
                id: "heli_base_one_helipad_two",
                name: mod.stringkeys.helispawner,
                description: mod.stringkeys.helispawnerDescription,
                image: mod.UIImageType.TEMP_PortalIcon,
                cost: 2000,
                category: UpgradeCategory.vehicle,
                effects: [
                    { type: "Building", data: BuildingPresetID.HeliBaseOne_HelipadTwo },
                    { type: "Vehicle", data: VehiclePresetID.HeliBaseOne_Helitwo }
                ]
            },
            {
                id: "Heli_base_one_gruntSpawner",
                name: mod.stringkeys.gruntSpawners,
                description: mod.stringkeys.gruntSpawnersDescription,
                image: mod.UIImageType.TEMP_PortalIcon,
                cost: 350,
                category: UpgradeCategory.building,
                effects: [
                    { type: "Building", data: BuildingPresetID.HeliBaseOne_GruntSpawner },
                    { type: "Grunt", data: GruntPresetID.HeliBaseOne_Assault }
                ]
            },
        ]
    },
    {
        id: "heli_base_two",
        name: mod.stringkeys.ebase,
        capturepointID: 9,
        worldiconPointID: 9,
        interactID: 9,
        capturePointsGainPerTick: 0,
        captureCashGainPerTick: 0,
        baseDefaultWorth: 500,
        availableUpgrades: [
            {
                id: "heli_base_two_helipad",
                name: mod.stringkeys.helispawner,
                description: mod.stringkeys.helispawnerDescription,
                image: mod.UIImageType.TEMP_PortalIcon,
                cost: 2000,
                category: UpgradeCategory.vehicle,
                effects: [
                    { type: "Building", data: BuildingPresetID.HeliBaseTwo_Helipad },
                    { type: "Vehicle", data: VehiclePresetID.HeliBaseTwo_Heli }
                ]
            },
            {
                id: "heli_base_two_helipad_two",
                name: mod.stringkeys.helispawner,
                description: mod.stringkeys.helispawnerDescription,
                image: mod.UIImageType.TEMP_PortalIcon,
                cost: 2000,
                category: UpgradeCategory.vehicle,
                effects: [
                    { type: "Building", data: BuildingPresetID.HeliBaseTwo_HelipadTwo },
                    { type: "Vehicle", data: VehiclePresetID.HeliBaseTwo_HeliTwo }
                ]
            },
            {
                id: "Heli_base_two_gruntSpawner",
                name: mod.stringkeys.gruntSpawners,
                description: mod.stringkeys.gruntSpawnersDescription,
                image: mod.UIImageType.TEMP_PortalIcon,
                cost: 350,
                category: UpgradeCategory.building,
                effects: [
                    { type: "Building", data: BuildingPresetID.HeliBaseTwo_GruntSpawner },
                    { type: "Grunt", data: GruntPresetID.HeliBaseTwo_Assault }
                ]
            },
        ]
    },
    {
        id: "tank_base_one",
        name: mod.stringkeys.gbase,
        capturepointID: 8,
        worldiconPointID: 8,
        interactID: 8,
        capturePointsGainPerTick: 0,
        captureCashGainPerTick: 0,
        baseDefaultWorth: 500,
        availableUpgrades: [
            {
                id: "Tank_base_one_tankspawner",
                name: mod.stringkeys.tankSpawner,
                description: mod.stringkeys.tankSpawnerDescription,
                image: mod.UIImageType.TEMP_PortalIcon,
                cost: 1500,
                category: UpgradeCategory.vehicle,
                effects: [
                    { type: "Building", data: BuildingPresetID.TankBaseOne_TankBuilding },
                    { type: "Vehicle", data: VehiclePresetID.TankBaseOne_Tanks }
                ]
            },
            {
                id: "Tank_base_one_gruntSpawner",
                name: mod.stringkeys.gruntSpawners,
                description: mod.stringkeys.gruntSpawnersDescription,
                image: mod.UIImageType.TEMP_PortalIcon,
                cost: 350,
                category: UpgradeCategory.building,
                effects: [
                    { type: "Building", data: BuildingPresetID.TankBaseOne_GruntSpawner },
                    { type: "Grunt", data: GruntPresetID.TankBaseOne_Assault }
                ]
            },
            {
                id: "Tank_base_one_oilRig",
                name: mod.stringkeys.oildRig,
                description: mod.stringkeys.oildRigDescription,
                image: mod.UIImageType.TEMP_PortalIcon,
                cost: 600,
                category: UpgradeCategory.building,
                effects: [
                    { type: "Building", data: BuildingPresetID.TankBaseOne_OilRig },
                    { type: "Effect", data: PassivePresetID.Default_MoneyPrinter },
                    { type: "Effect", data: PassivePresetID.Default_MorePoints }
                ]
            },
            {
                id: "Tank_base_one_carSpawn1",
                name: mod.stringkeys.carSpawner,
                description: mod.stringkeys.carSpawnerDescription,
                image: mod.UIImageType.TEMP_PortalIcon,
                cost: 400,
                category: UpgradeCategory.vehicle,
                effects: [
                    { type: "Building", data: BuildingPresetID.TankBaseOne_CarSpawn1 },
                    { type: "Vehicle", data: VehiclePresetID.TankBaseOne_CarSpawn1 }
                ]
            },
            {
                id: "Tank_base_one_carSpawn2",
                name: mod.stringkeys.carSpawner,
                description: mod.stringkeys.carSpawnerDescription,
                image: mod.UIImageType.TEMP_PortalIcon,
                cost: 400,
                category: UpgradeCategory.vehicle,
                effects: [
                    { type: "Building", data: BuildingPresetID.TankBaseOne_CarSpawn2 },
                    { type: "Vehicle", data: VehiclePresetID.TankBaseOne_CarSpawn2 }
                ]
            },
            {
                id: "Tank_base_one_antiAir",
                name: mod.stringkeys.anitiAirSpawner,
                description: mod.stringkeys.anitiAirSpawnerDescription,
                image: mod.UIImageType.TEMP_PortalIcon,
                cost: 150,
                category: UpgradeCategory.stationary,
                effects: [
                    { type: "Building", data: BuildingPresetID.TankBaseOne_AntiAir },
                    { type: "Stationary", data: StationaryPresetID.TankBaseOne_AntiAir }
                ]
            }
        ]
    },
    {
        id: "tank_base_two",
        name: mod.stringkeys.cbase,
        capturepointID: 12,
        worldiconPointID: 12,
        interactID: 12,
        capturePointsGainPerTick: 0,
        captureCashGainPerTick: 0,
        baseDefaultWorth: 500,
        availableUpgrades: [
            {
                id: "Tank_base_two_tankspawner",
                name: mod.stringkeys.tankSpawner,
                description: mod.stringkeys.tankSpawnerDescription,
                image: mod.UIImageType.TEMP_PortalIcon,
                cost: 1500,
                category: UpgradeCategory.vehicle,
                effects: [
                    { type: "Building", data: BuildingPresetID.TankBaseTwo_TankBuilding },
                    { type: "Vehicle", data: VehiclePresetID.TankBaseTwo_Tanks }
                ]
            },
            {
                id: "Tank_base_two_oilRig",
                name: mod.stringkeys.oildRig,
                description: mod.stringkeys.oildRigDescription,
                image: mod.UIImageType.TEMP_PortalIcon,
                cost: 600,
                category: UpgradeCategory.building,
                effects: [
                    { type: "Building", data: BuildingPresetID.TankBaseTwo_OilRig },
                    { type: "Effect", data: PassivePresetID.BaseTwo_MoneyPrinter },
                    { type: "Effect", data: PassivePresetID.BaseTwo_MorePoints }
                ]
            },
            {
                id: "Tank_base_two_carSpawn1",
                name: mod.stringkeys.carSpawner,
                description: mod.stringkeys.carSpawnerDescription,
                image: mod.UIImageType.TEMP_PortalIcon,
                cost: 400,
                category: UpgradeCategory.vehicle,
                effects: [
                    { type: "Building", data: BuildingPresetID.TankBasetwo_CarSpawn1 },
                    { type: "Vehicle", data: VehiclePresetID.TankBaseTwo_CarSpawn1 }
                ]
            },
            {
                id: "Tank_base_two_gruntSpawner",
                name: mod.stringkeys.gruntSpawners,
                description: mod.stringkeys.gruntSpawnersDescription,
                image: mod.UIImageType.TEMP_PortalIcon,
                cost: 350,
                category: UpgradeCategory.building,
                effects: [
                    { type: "Building", data: BuildingPresetID.TankBaseTwo_GruntSpawner },
                    { type: "Grunt", data: GruntPresetID.TankBaseTwo_Assault }
                ]
            },
            {
                id: "Tank_base_two_carSpawn2",
                name: mod.stringkeys.carSpawner,
                description: mod.stringkeys.carSpawnerDescription,
                image: mod.UIImageType.TEMP_PortalIcon,
                cost: 400,
                category: UpgradeCategory.vehicle,
                effects: [
                    { type: "Building", data: BuildingPresetID.TankBaseTwo_CarSpawn2 },
                    { type: "Vehicle", data: VehiclePresetID.TankBaseTwo_CarSpawn2 }
                ]
            },
            {
                id: "Tank_base_two_antiAir",
                name: mod.stringkeys.anitiAirSpawner,
                description: mod.stringkeys.anitiAirSpawnerDescription,
                image: mod.UIImageType.TEMP_PortalIcon,
                cost: 150,
                category: UpgradeCategory.stationary,
                effects: [
                    { type: "Building", data: BuildingPresetID.TankBaseTwo_AntiAir },
                    { type: "Stationary", data: StationaryPresetID.TankBaseTwo_AntiAir }
                ]
            }
        ]
    },
    {
        id: "center_base",
        name: mod.stringkeys.fbase,
        capturepointID: 13,
        worldiconPointID: 13,
        interactID: 13,
        capturePointsGainPerTick: 5,
        captureCashGainPerTick: 5,
        baseDefaultWorth: 1000,
        availableUpgrades: [
            {
                id: "CenterBase_Anti_Tank",
                name: mod.stringkeys.anitiTankSpawner,
                description: mod.stringkeys.anitiTankSpawnerDescription,
                image: mod.UIImageType.TEMP_PortalIcon,
                cost: 150,
                category: UpgradeCategory.stationary,
                effects: [
                    { type: "Stationary", data: StationaryPresetID.CenterBase_AntiTank }
                ]
            },
            {
                id: "CenterBase_Radar",
                name: mod.stringkeys.radarTower,
                description: mod.stringkeys.radarTowerDescription,
                image: mod.UIImageType.TEMP_PortalIcon,
                cost: 1000,
                category: UpgradeCategory.building,
                effects: [
                    { type: "Building", data: BuildingPresetID.CenterBase_RadarTower },
                    { type: "Effect", data: PassivePresetID.CenterBase_RadarTower },
                ]
            }
        ]
    },
];

// === HoH_Debug.ts ===




class HoH_Debugger {

    static count = 10;

    static SpawnAIEnemy() {
        mod.SpawnAIFromAISpawner(mod.GetSpawner(10))
    }

    static addAIToPlayer(player: mod.Player) {
        PlayerProfile.get(player)
    }

    static async GiveCashToEachPlayer() {
        PlayerProfile.playerInstances.forEach(element => {
            const playerProf = PlayerProfile.get(element)
            playerProf?.AddCash(10000)
        });

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

    static async debugTestScoreBoard() {
        console.log("testing scoreboard")


        let team = TeamOne
        while (true) {
            await mod.Wait(10)

            //GameHandler.AddScore(TeamOne, 2000, mod.stringkeys.baseCapture)
            GameHandler.AddScore(team, 2000, mod.stringkeys.baseCapture)
            await mod.Wait(2)
            //  GameHandler.AddScore(TeamOne, -1000, mod.stringkeys.baseLoss)
            GameHandler.AddScore(team, -2000, mod.stringkeys.baseLoss)
            await mod.Wait(2)
            // GameHandler.AddScore(TeamOne, 5000, mod.stringkeys.baseCapture)
            GameHandler.AddScore(team, 500, mod.stringkeys.baseCapture)
            await mod.Wait(2)
            // GameHandler.AddScore(TeamOne, -500, mod.stringkeys.baseLoss)
            GameHandler.AddScore(team, -500, mod.stringkeys.baseLoss)

            if (team == TeamOne) {
                team = TeamTwo
            } else {
                team = TeamOne
            }
        }


    }


    static async SwitchTeamOnWeaponShot() {

        while (true) {
            PlayerProfile.playerInstances.forEach(element => {

                if (element) {
                    const pp = PlayerProfile.get(element)

                    if (!pp) {
                        return
                    }

                    if (
                        element
                        && mod.IsInventorySlotActive(element, mod.InventorySlots.GadgetOne)
                        && mod.GetSoldierState(element, mod.SoldierStateBool.IsAlive)
                        && mod.GetSoldierState(element, mod.SoldierStateBool.IsFiring)
                    ) {

                        if (HoH_Helpers.IsObjectIDsEqual(mod.GetTeam(pp.player), TeamOne)) {
                            mod.SetTeam(pp.player, TeamTwo)
                        } else {
                            mod.SetTeam(pp.player, TeamOne)
                        }


                    }
                }
            });
            await mod.Wait(0);
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
}



// === HoH_Playerprofile.ts ===







let uniqueID = 0;

class PlayerProfile {

    player: mod.Player;
    playerID: number = -1;
    readyUp: boolean = false;
    #money: number = 250;
    ShopUI: HoH_BuyUI;
    StartPopup: HoH_UIStartPopup;

    ProgressUI: HoH_UIGameProgress;
    versionWidget: mod.UIWidget | undefined;

    static playerInstances: mod.Player[] = [];

    static #allPlayers: { [key: number]: PlayerProfile } = {};


    constructor(player: mod.Player) {
        this.player = player;
        this.playerID = uniqueID++;

        this.ShopUI = new HoH_BuyUI(this);
        this.versionWidget = HoH_Debugger.CreateVersionUI(this);
        this.ProgressUI = new HoH_UIGameProgress(this);
        this.StartPopup = new HoH_UIStartPopup(this)
    }

    static get(player: mod.Player) {

        if (mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier)) {
            return undefined
        }

        if (mod.GetObjId(player) > -1) {
            let index = mod.GetObjId(player);

            let hohPlayer = this.#allPlayers[index];
            if (!hohPlayer) {
                hohPlayer = new PlayerProfile(player);
                console.log("Creating Player Profile");
                this.#allPlayers[index] = hohPlayer;
                this.playerInstances.push(player)
            }
            return hohPlayer;
        }
        console.log("Error: could not finds an valid player object ID.");
        return undefined;
    }


    AddCash(cash: number, type?: string) {
        this.#money += cash

        this.ProgressUI.updateCurrencyUI(cash, type)


        return this.#money;
    }

    RemoveCash(cash: number, type?: string) {
        this.#money -= cash;
        if (this.#money < 0) {
            this.#money = 0;
        }
        this.ProgressUI.updateCurrencyUI(-cash, type)

        return this.#money;
    }

    GetCashAmount() {
        return this.#money;
    }

    SetCashAmount(cash: number) {
        this.#money = cash;
        this.ProgressUI.updateCurrencyUI(this.#money)
    }



    OnPlayerKill() {
        this.AddCash(100, mod.stringkeys.kill);
    }

    OnPlayerAssist() {
        this.AddCash(50, mod.stringkeys.assist);
    }


    static removePlayer(playernb: number) {

        const playerprof = this.#allPlayers[playernb];

        if (playerprof) {
            playerprof.ShopUI?.Delete()
            playerprof.StartPopup?.Delete()
            playerprof.versionWidget && mod.DeleteUIWidget(playerprof.versionWidget)
            playerprof.ProgressUI?.Delete()
        }

        // Remove the player from the internal player map
        delete this.#allPlayers[playernb];

        // Filter out ALL invalid player instances
        PlayerProfile.playerInstances = PlayerProfile.playerInstances.filter(instance =>
            mod.GetObjId(instance) >= 0
        );
    }


    static isValidPlayer(player: mod.Player | null | undefined): boolean {
        // Check for null/undefined before calling mod function
        return player != null && mod.IsPlayerValid(player);
    }






}




// === HoH_UIGameProgress.ts ===











interface BarData {
    mainBar?: mod.UIWidget
    gainLossBar?: mod.UIWidget
    scoreWidget?: mod.UIWidget
    leaderTopLine?: mod.UIWidget
    leaderBottomLine?: mod.UIWidget
    feedback?: mod.UIWidget
}


const SCORE_JUMP_THRESHOLD = 100;
const BAR_DELAY_TICKS = 5;

interface TeamBarState {
    previousScore: number;
    pendingTicks: number;       // countdown for delayed update
    needsUpdate: boolean;       // whether a delayed update is pending
    lastChangePositive: boolean; // true if last large change was positive
    targetScore: number;         // latest target for main/gainLoss bar
}

class HoH_UIGameProgress {

    #PlayerProfile: PlayerProfile;
    private widgetsUI: mod.UIWidget | undefined;
    private playerCurrencyFeedbackWidget: mod.UIWidget | undefined;

    private BarData = new Map<string, BarData>();
    private playerCurrencyWidget: mod.UIWidget | undefined = undefined;

    private barMaxWidth = 187;
    private barMaxHeight = 12;

    private HIDE_DELAY = 5

    private readonly GainColor: mod.Vector = mod.CreateVector(0.816, 0.859, 0.847); // White
    private readonly LossColor: mod.Vector = mod.CreateVector(0.780, 0.286, 0.286); // Red

    /** All team states stored by team */
    private teamStates = new Map<string, TeamBarState>();


    constructor(PlayerProfile: PlayerProfile) {
        this.#PlayerProfile = PlayerProfile;
    }

    Open() {
        if (!this.widgetsUI) {
            this.widgetsUI = this.CreateProgressUI()
        } else {
            mod.SetUIWidgetVisible(this.widgetsUI, true)
        }
        this.updateCurrencyUI()

        // Initialize team states
        this.teamStates.set("FriendlyTeam", {
            previousScore: GameHandler.teamOneScore,
            pendingTicks: 0,
            needsUpdate: false,
            lastChangePositive: true,
            targetScore: GameHandler.teamOneScore
        });

        this.teamStates.set("EnemyTeam", {
            previousScore: GameHandler.teamTwoScore,
            pendingTicks: 0,
            needsUpdate: false,
            lastChangePositive: true,
            targetScore: GameHandler.teamTwoScore
        });

        // Start catch-up loop
        this.processAllBarsCatchUp(team =>
            team === "FriendlyTeam" ? GameHandler.teamOneScore : GameHandler.teamTwoScore
        );

        // Initial update
        this.updateBar(TeamOne, GameHandler.teamOneScore);
        this.updateBar(TeamTwo, GameHandler.teamTwoScore);
    }

    updateCurrencyUI(amount?: number, type?: string) {
        this.playerCurrencyWidget &&
            mod.SetUITextLabel(
                this.playerCurrencyWidget,
                toMessage(mod.stringkeys.cash, [this.#PlayerProfile.GetCashAmount()])
            );

        if (amount && type) {
            this.updateCashFeedback(type, amount)
        }
    }

    hideDelays = {
        cash: 0,
        teamOne: 0,
        teamTwo: 0,
    }

    // Track active timers
    private hideTasks: Partial<Record<keyof typeof this.hideDelays, boolean>> = {}

    private async hideFeedback(widget: mod.UIWidget, key: keyof typeof this.hideDelays) {
        // Prevent multiple timers for the same widget

        if (this.hideTasks[key]) return
        this.hideTasks[key] = true

        while (this.hideDelays[key] > 0) {
            this.hideDelays[key]--
            await mod.Wait(1)
        }

        if (widget) {
            mod.SetUIWidgetVisible(widget, false)
        }

        this.hideTasks[key] = false
    }

    // Generic feedback setter
    private async showFeedback(
        widget: mod.UIWidget | undefined,
        key: keyof typeof this.hideDelays,
        text: string,
        cost: number
    ) {
        if (!widget) return

        const isPositive = cost > 0;

        isPositive && mod.SetUITextColor(widget, this.GainColor)
        !isPositive && mod.SetUITextColor(widget, this.LossColor)

        mod.SetUITextLabel(widget, toMessage(text, [cost]))
        mod.SetUIWidgetVisible(widget, true)

        // Reset timer
        this.hideDelays[key] = this.HIDE_DELAY

        // Ensure hideFeedback is running
        this.hideFeedback(widget, key)
    }


    updatePointsFeedback(text: string, cost: number, team: mod.Team) {


        console.log(mod.GetObjId(team) + "   " + mod.GetObjId(mod.GetTeam(this.#PlayerProfile.player)))

        //Get teams
        if (HoH_Helpers.IsObjectIDsEqual(team, mod.GetTeam(this.#PlayerProfile.player))) {
            const bar = this.BarData.get("FriendlyTeam")
            bar && this.showFeedback(bar.feedback, "teamOne", text, cost)
        } else {
            const bar = this.BarData.get("EnemyTeam")
            bar && this.showFeedback(bar.feedback, "teamTwo", text, cost)
        }
    }

    updateCashFeedback(text: string, cost: number) {
        this.showFeedback(this.playerCurrencyFeedbackWidget, "cash", text, cost)
    }


    Close() {
        if (this.widgetsUI) {
            mod.SetUIWidgetVisible(this.widgetsUI, false)
        }
    }

    Delete() {
        if (this.widgetsUI) {
            mod.DeleteUIWidget(this.widgetsUI)
        }
    }

    CreateProgressUI() {
        const children: any[] = [];

        const offsetFromCenter = 4;
        const offsetFromPoints = 8;
        const playerId = this.#PlayerProfile.playerID.toString();

        //  Colors
        const Colors = {
            team1: {
                main: [0.380, 0.878, 1.000],
                background: [0.063, 0.196, 0.263],
            },
            team2: {
                main: [1.000, 0.561, 0.384],
                background: [0.263, 0.106, 0.078],
            },
            gain: [0.816, 0.859, 0.847],
            loss: [0.780, 0.286, 0.286],
            white: [1, 1, 1],
        };

        // Name builder
        const Names = {
            team1: {
                mainBar: (id: string) => `Team1_MainBar_${id}`,
                gainLoss: (id: string) => `Team1_GainLoss_${id}`,
                background: (id: string) => `Team1_Background_${id}`,
                scoreText: (id: string) => `Team1_ScoreText_${id}`,
                feedback: (id: string) => `Team1_Feedback_${id}`,
                LeaderLineBottom: (id: string) => `Team1_LeaderLine1_${id}`,
                LeaderLineTop: (id: string) => `Team1_LeaderLine2_${id}`
            },
            team2: {
                mainBar: (id: string) => `Team2_MainBar_${id}`,
                gainLoss: (id: string) => `Team2_GainLoss_${id}`,
                background: (id: string) => `Team2_Background_${id}`,
                scoreText: (id: string) => `Team2_ScoreText_${id}`,
                feedback: (id: string) => `Team2_Feedback_${id}`,
                LeaderLineBottom: (id: string) => `Team2_LeaderLine1_${id}`,
                LeaderLineTop: (id: string) => `Team2_LeaderLine2_${id}`
            },
            currency: {
                text: (id: string) => `Currency_Text_${id}`,
                line: (id: string) => `Currency_Line_${id}`,
                feedback: (id: string) => `Currency_Feedback_${id}`,
            },
            container: (id: string) => `GameProgressContainer_${id}`,
        };

        // Helper for team bars
        const makeTeamBars = (
            team: "team1" | "team2",
            anchor: number,
            feedbackText: { text: string; arg: number[] },
            feedbackColor: number[],
        ) => {
            const names = Names[team];
            const isLeft = team === "team1";
            const barColor = Colors[team].main;
            const feedbackAnchor = isLeft ? mod.UIAnchor.CenterRight : mod.UIAnchor.CenterLeft;

            return [
                {
                    type: "Container",
                    name: names.background(playerId),
                    position: [-this.barMaxWidth - offsetFromCenter, 80, -1],
                    size: [this.barMaxWidth, this.barMaxHeight, 0],
                    anchor,
                    bgColor: barColor,
                    bgAlpha: 0.75,
                    bgFill: mod.UIBgFill.Blur,
                },
                {
                    type: "Container",
                    name: names.gainLoss(playerId),
                    position: [-this.barMaxWidth - offsetFromCenter, 80, 0],
                    size: [0, this.barMaxHeight, 0],
                    anchor,
                    bgColor: isLeft ? Colors.gain : Colors.loss,
                    bgAlpha: 1,
                },
                {
                    type: "Container",
                    name: names.mainBar(playerId),
                    position: [-this.barMaxWidth - offsetFromCenter, 80, 1],
                    size: [0, this.barMaxHeight, 0],
                    anchor,
                    bgColor: barColor,
                    bgAlpha: 1,
                },
                {
                    type: "Text",
                    name: names.scoreText(playerId),
                    textLabel: { text: mod.stringkeys.points, arg: [40023] },
                    position: [this.barMaxWidth + offsetFromCenter + offsetFromPoints, 80, 1],
                    size: [84, 32, 0],
                    textSize: 24,
                    bgFill: mod.UIBgFill.Blur,
                    bgAlpha: 0.75,
                    bgColor: barColor,
                    textColor: barColor,
                    padding: 5,
                    textAnchor: mod.UIAnchor.Center,
                    anchor: isLeft ? mod.UIAnchor.CenterRight : mod.UIAnchor.CenterLeft,
                },

                //LeaderLineBottom
                {
                    type: "Container",
                    name: names.LeaderLineBottom(playerId),
                    position: [this.barMaxWidth + offsetFromCenter + offsetFromPoints + 15, 80 - 18, 2],
                    size: [60, 1, 0],
                    anchor: isLeft ? mod.UIAnchor.CenterRight : mod.UIAnchor.CenterLeft,
                    bgColor: barColor,
                    bgAlpha: 1,

                },
                //LeaderLineTop
                {
                    type: "Container",
                    name: names.LeaderLineTop(playerId),
                    position: [this.barMaxWidth + offsetFromCenter + offsetFromPoints + 15, 80 + 18, 2],
                    size: [60, 1, 0],
                    anchor: isLeft ? mod.UIAnchor.CenterRight : mod.UIAnchor.CenterLeft,
                    bgColor: barColor,
                    bgAlpha: 1,
                },

                {
                    type: "Text",
                    name: names.feedback(playerId),
                    textLabel: feedbackText,
                    visible: false,
                    position: [0, 62, 1],
                    size: [this.barMaxWidth, 12, 0],
                    textSize: 16,
                    bgFill: mod.UIBgFill.None,
                    padding: offsetFromCenter,
                    textColor: feedbackColor,
                    textAnchor: feedbackAnchor,
                    anchor: feedbackAnchor,

                },
            ];
        };

        // Add both teams
        children.push(
            ...makeTeamBars("team1", mod.UIAnchor.CenterLeft, { text: mod.stringkeys.baseCapture, arg: [1060] }, Colors.gain),
            ...makeTeamBars("team2", mod.UIAnchor.CenterRight, { text: mod.stringkeys.baseLoss, arg: [1060] }, Colors.loss),
        );

        //Currency widgets
        children.push(
            {
                type: "Text",
                name: Names.currency.text(playerId),
                textLabel: { text: mod.stringkeys.cash, arg: [this.#PlayerProfile.GetCashAmount()] },
                position: [0, 110, 1],
                size: [90, 37, 0],
                textSize: 28,
                bgFill: mod.UIBgFill.None,
                textColor: Colors.gain,
                padding: 5,
                textAnchor: mod.UIAnchor.Center,
                anchor: mod.UIAnchor.Center,
            },
            {
                type: "Container",
                name: Names.currency.line(playerId),
                position: [0, 130, 1],
                size: [120, 1, 0],
                anchor: mod.UIAnchor.TopCenter,
                bgColor: Colors.white,
                bgAlpha: 1,
                bgFill: mod.UIBgFill.Solid,
            },
            {
                type: "Text",
                name: Names.currency.feedback(playerId),
                textLabel: { text: mod.stringkeys.baseCapture, arg: [142] },
                position: [0, 144, 1],
                size: [this.barMaxWidth, 12, 0],
                textSize: 16,
                visible: false,
                bgFill: mod.UIBgFill.None,
                padding: offsetFromCenter,
                textColor: Colors.gain,
                textAnchor: mod.UIAnchor.Center,
                anchor: mod.UIAnchor.Center,
            },
        );

        // Parent container
        const parentWidget = ParseUI({
            type: "Container",
            name: Names.container(playerId),
            position: [0, 0, 0],
            size: [0, 0, 0],
            anchor: mod.UIAnchor.TopCenter,
            bgColor: [0, 0, 0],
            bgAlpha: 0.0,
            padding: 0,
            bgFill: mod.UIBgFill.None,
            children,
            playerId: this.#PlayerProfile.player,
        });

        //Store references
        this.BarData.set("FriendlyTeam", {
            mainBar: mod.FindUIWidgetWithName(Names.team1.mainBar(playerId)),
            gainLossBar: mod.FindUIWidgetWithName(Names.team1.gainLoss(playerId)),
            scoreWidget: mod.FindUIWidgetWithName(Names.team1.scoreText(playerId)),
            leaderBottomLine: mod.FindUIWidgetWithName(Names.team1.LeaderLineBottom(playerId)),
            leaderTopLine: mod.FindUIWidgetWithName(Names.team1.LeaderLineTop(playerId)),
            feedback: mod.FindUIWidgetWithName(Names.team1.feedback(playerId)),
        });

        this.BarData.set("EnemyTeam", {
            mainBar: mod.FindUIWidgetWithName(Names.team2.mainBar(playerId)),
            gainLossBar: mod.FindUIWidgetWithName(Names.team2.gainLoss(playerId)),
            scoreWidget: mod.FindUIWidgetWithName(Names.team2.scoreText(playerId)),
            leaderBottomLine: mod.FindUIWidgetWithName(Names.team2.LeaderLineBottom(playerId)),
            leaderTopLine: mod.FindUIWidgetWithName(Names.team2.LeaderLineTop(playerId)),
            feedback: mod.FindUIWidgetWithName(Names.team2.feedback(playerId)),

        });

        this.playerCurrencyWidget = mod.FindUIWidgetWithName(Names.currency.text(playerId));
        this.playerCurrencyFeedbackWidget = mod.FindUIWidgetWithName(Names.currency.feedback(playerId))

        return parentWidget;
    }


    updateBar(team: mod.Team, score: number) {

        const targetTeam = this.GetTeam(team)

        const state = this.teamStates.get(targetTeam);
        if (!state) return;

        const diff = score - state.previousScore;

        if (Math.abs(diff) > SCORE_JUMP_THRESHOLD) {
            // Large jump
            this.handleLargeChange(targetTeam, score, state.previousScore);
        } else {
            // Only apply smooth update if no pending large change
            if (!state.needsUpdate) {

                this.updateSmooth(targetTeam, score);
                state.previousScore = score; // update only for smooth updates
                this.teamStates.set(targetTeam, state);
            }
        }

        // Always update the score label
        this.updateScoreLabel(targetTeam, score);
    }


    private GetTeam(team: mod.Team | undefined) {

        if (team == undefined) {
            return "Undefined"
        }

        const playersTeam = mod.GetTeam(this.#PlayerProfile.player)

        if (playersTeam == undefined) {
            return "Undefined"
        }

        if (HoH_Helpers.IsObjectIDsEqual(team, playersTeam)) {
            return "FriendlyTeam"
        }
        return "EnemyTeam"

    }


    /** Handle large jumps */
    private handleLargeChange(team: string, newScore: number, previousScore: number) {

        const bar = this.BarData.get(team);
        if (!bar) {
            console.log("Error HandleLargeChange cold not find team")
            return;

        }

        const diff = newScore - previousScore;

        const state: TeamBarState = {
            previousScore: newScore,
            targetScore: newScore,
            pendingTicks: BAR_DELAY_TICKS,
            needsUpdate: true,
            lastChangePositive: (diff > 0)
        };

        if (diff > 0) {
            // Positive jump: gain/loss bar moves immediately, main bar will follow after delay
            bar.gainLossBar && mod.SetUIWidgetBgColor(bar.gainLossBar, this.GainColor);
            bar.gainLossBar && mod.SetUIWidgetSize(bar.gainLossBar, this.makeScaleVector(this.calcScale(newScore)));

        } else if (diff < 0) {
            // Negative jump: main bar moves immediately, gain/loss bar will follow after delay
            bar.mainBar && mod.SetUIWidgetSize(bar.mainBar, this.makeScaleVector(this.calcScale(newScore)));
            bar.gainLossBar && mod.SetUIWidgetBgColor(bar.gainLossBar, this.LossColor);
        }

        // Save updated state
        this.teamStates.set(team, state);
    }

    /** Smooth updates for small changes */
    private updateSmooth(team: string, score: number) {
        const scale = this.calcScale(score);



        const bar = this.BarData.get(team);

        if (!bar) {
            console.log(`[updateSmooth] Bar data not found for team: ${team}`);
            return;
        }

        const vector = this.makeScaleVector(scale);

        bar.mainBar && mod.SetUIWidgetSize(bar.mainBar, vector);
        bar.gainLossBar && mod.SetUIWidgetSize(bar.gainLossBar, vector);
    }

    /** Single loop to gradually catch up delayed bars */
    async processAllBarsCatchUp(getScore: (team: string) => number) {
        const teams = Array.from(this.teamStates.keys());

        while (true) {
            for (const team of teams) {



                const state = this.teamStates.get(team);
                if (!state) {
                    console.log("could not Find State")
                    continue;
                }

                if (!state.needsUpdate) {
                    continue;
                }

                // Decrement delay
                state.pendingTicks--;
                this.teamStates.set(team, state); // persist countdown

                if (state.pendingTicks <= 0) {

                    const bar = this.BarData.get(team);
                    if (!bar) {
                        console.log("Error processAllBarsCatchUp could not find bar");
                        continue;
                    }

                    const targetScore = state.targetScore;
                    const positive = state.lastChangePositive;
                    const scale = this.calcScale(targetScore)


                    if (positive) {
                        // Positive jump: main bar catches up
                        bar.mainBar && mod.SetUIWidgetSize(bar.mainBar, this.makeScaleVector(scale));

                    } else {
                        // Negative jump: gain/loss bar catches up
                        bar.gainLossBar && mod.SetUIWidgetSize(bar.gainLossBar, this.makeScaleVector(scale));

                    }

                    // Mark as finished
                    state.needsUpdate = false;
                    state.pendingTicks = 0;
                    state.previousScore = targetScore; // update previousScore
                    this.teamStates.set(team, state);
                }
            }


            await mod.Wait(1);
        }
    }
    /** Update score label */
    private updateScoreLabel(team: string, score: number) {
        const bar = this.BarData.get(team);
        bar?.scoreWidget &&
            mod.SetUITextLabel(
                bar.scoreWidget,
                toMessage(mod.stringkeys.points, [score])
            );


        const leaderTeam = GameHandler.getLeadingTeam()

        const ShowLeadWidget = (this.GetTeam(leaderTeam) == team)

        bar?.leaderBottomLine && mod.SetUIWidgetVisible(bar.leaderBottomLine, ShowLeadWidget)
        bar?.leaderTopLine && mod.SetUIWidgetVisible(bar.leaderTopLine, ShowLeadWidget)
    }

    /** Helpers */
    private calcScale(score: number) {
        // Ensure score never exceeds MaxGameScore and never goes below 0
        const clampedScore = HoH_Helpers.clamp(score, 0, GameHandler.MaxGameScore)
        return clampedScore / GameHandler.MaxGameScore
    }

    private makeScaleVector(scale: number) {
        return mod.CreateVector(this.barMaxWidth * scale, this.barMaxHeight, 0)
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
    arg?: number[]
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

export function toMessage(param?: string | mod.Message, args?: number[]): mod.Message {
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

// === HoH_UIShop.ts ===










/**
    type ButtonHandler = (
        player: mod.Player,
        widget: mod.UIWidget,
        event: mod.UIButtonEvent,
    ) => void;
    
    
    interface BaseUIData {
        elementData: ElementData[]
    }
*/

interface ElementData {
    id: string;
    elementName: string;
    elementWidget?: mod.UIWidget;
}


interface ShopPage {
    selectedCategory: UpgradeCategory;
    uiElements: ElementData2[]
}

interface ElementData2 {
    id: string;
    elementWidget: mod.UIWidget | undefined
    type: "button" | "text" | "container";
    eventClick?: (widget: mod.UIWidget, event: any) => void;
    eventFocusIn?: (widget: mod.UIWidget, event: any) => void;
    eventFocusOut?: (widget: mod.UIWidget, event: any) => void;
}



class HoH_BuyUI {

    #PlayerProfile: PlayerProfile

    private widgetPageMap = new Map<string, ShopPage>()
    widgetToElementMap = new Map<string, ElementData2>();

    private widgetsUIs = new Map<string, mod.UIWidget>()
    // private buttonHandlers = new Map<string, Map<buttonEventType, ButtonHandler>>()

    private gamemodeInfoWidget: mod.UIWidget | undefined;
    private upgradeInfoWidget: mod.UIWidget | undefined;

    private selectedCategory: UpgradeCategory = UpgradeCategory.vehicle;

    constructor(PlayerProfile: PlayerProfile) {
        this.#PlayerProfile = PlayerProfile
    }

    private IsShopOpen: boolean = false;

    private Colors = {
        team1: {
            main: [0.380, 0.878, 1.000],
        },
        team2: {
            main: [1.000, 0.561, 0.384],
        },
        gain: [0.816, 0.859, 0.847],
        loss: [0.780, 0.286, 0.286],
        white: [1, 1, 1],
        black: [0.0, 0.0, 0.0],
        gray: [0.2, 0.2, 0.2],
        blue: [0, 0, 1],
        yellow: [1, 1, 0],
        brightBlue: [0.380, 0.878, 1.000],
        orange: [1.000, 0.561, 0.384]
    };

    public SetShopData(
        key: string,
        selectedCategory?: UpgradeCategory,
        elementData?: ElementData2[],
    ): void {
        const existing = this.widgetPageMap.get(key);
        const mergeElements = existing ? existing.uiElements.slice() : [];

        if (elementData) {


            for (const element of elementData) {
                // Merge or push new element
                const index = mergeElements.findIndex(b => b.id === element.id);
                const oldElement = index >= 0 ? mergeElements[index] : undefined;

                const mergedElement: ElementData2 = {
                    ...element,
                    elementWidget: element.elementWidget ?? oldElement?.elementWidget,
                    eventClick: element.eventClick ?? oldElement?.eventClick,
                    eventFocusIn: element.eventFocusIn ?? oldElement?.eventFocusIn,
                    eventFocusOut: element.eventFocusOut ?? oldElement?.eventFocusOut,
                };

                if (index >= 0) mergeElements[index] = mergedElement;
                else mergeElements.push(mergedElement);


                if (mergedElement.elementWidget) {

                    if (mergedElement.eventClick) {
                        this.widgetToElementMap.set(mod.GetUIWidgetName(mergedElement.elementWidget), mergedElement);
                    }

                    //  Enable Focus events if handlers exist
                    if (mergedElement.eventFocusIn) {
                        mod.EnableUIButtonEvent(mergedElement.elementWidget, mod.UIButtonEvent.FocusIn, true);
                    }
                    if (mergedElement.eventFocusOut) {
                        mod.EnableUIButtonEvent(mergedElement.elementWidget, mod.UIButtonEvent.FocusOut, true);
                    }
                }
            }
        }

        // Save merged data
        this.widgetPageMap.set(key, {
            uiElements: mergeElements,
            selectedCategory: selectedCategory ?? UpgradeCategory.building,
        });
    }

    OpenShop(base: Base) {


        if (!this.gamemodeInfoWidget) {
            this.gamemodeInfoWidget = this.CreateGameInfoWidget() as mod.UIWidget
            mod.SetUIWidgetDepth(this.gamemodeInfoWidget, mod.UIDepth.AboveGameUI)
        } else {
            if (this.gamemodeInfoWidget) {
                mod.SetUIWidgetVisible(this.gamemodeInfoWidget, true)
            }
        }


        mod.EnableUIInputMode(true, this.#PlayerProfile.player)

        this.IsShopOpen = true

        this.Open(base)

    }

    async Open(base: Base) {

        if (!this.widgetsUIs.has(base.id)) {
            const widget = this.createbuyMenu(base) as mod.UIWidget
            this.widgetsUIs.set(base.id, widget)
            mod.SetUIWidgetDepth(widget, mod.UIDepth.AboveGameUI)
            this.UpdateBaseAttackButtonColors(base.id)
        } else {
            const widget = this.widgetsUIs.get(base.id)
            if (widget) {
                mod.SetUIWidgetVisible(widget, true)
            }
        }
    }

    Delete() {
        if (this.gamemodeInfoWidget) {
            mod.DeleteUIWidget(this.gamemodeInfoWidget)
        }

        if (this.upgradeInfoWidget) {
            mod.DeleteUIWidget(this.upgradeInfoWidget)
        }

        this.widgetsUIs.forEach(x => {
            mod.DeleteUIWidget(x)
        })
    }

    CloseShop() {
        this.IsShopOpen = false
        mod.EnableUIInputMode(false, this.#PlayerProfile.player)
        if (this.gamemodeInfoWidget) {
            mod.SetUIWidgetVisible(this.gamemodeInfoWidget, false)
        }



        if (this.upgradeInfoWidget) {
            mod.SetUIWidgetVisible(this.upgradeInfoWidget, false)
        }

        this.widgetsUIs.forEach(x => {
            mod.SetUIWidgetVisible(x, false)
        })
    }

    private GetTeam(team: mod.Team | undefined) {

        if (team == undefined) {
            return "Undefined"
        }

        const playersTeam = mod.GetTeam(this.#PlayerProfile.player)

        if (playersTeam == undefined) {
            return "Undefined"
        }

        if (HoH_Helpers.IsObjectIDsEqual(team, playersTeam)) {
            return "FriendlyTeam"
        }
        return "EnemyTeam"

    }

    UpdateAvailableUpgrades(base: Base) {
        Object.values(UpgradeCategory).forEach((category, catIndex) => {
            const upgradesForThisCategory = base.availableUpgrades.filter(x => x.category === category);

            upgradesForThisCategory.forEach((upgrade, upgIndex) => {
                const buyButtonId = `BuyButton${upgrade.id}_${upgIndex + 1}button_${base.id}_${this.#PlayerProfile.playerID}`;
                const buyTextId = `BuyButton${upgrade.id}_${upgIndex + 1}Text_${base.id}_${this.#PlayerProfile.playerID}`;
                const buyCostId = `BuyButton${upgrade.id}_${upgIndex + 1}cost_${base.id}_${this.#PlayerProfile.playerID}`;
                const buyPoolId = `BuyButton${upgrade.id}_${upgIndex + 1}pool_${base.id}_${this.#PlayerProfile.playerID}`;

                const data = this.widgetPageMap.get(base.id);

                const buyButton = data?.uiElements.find(x => x.id === buyButtonId);
                const buyText = data?.uiElements.find(x => x.id === buyTextId);
                const buyCost = data?.uiElements.find(x => x.id === buyCostId);
                const buyPool = data?.uiElements.find(x => x.id === buyPoolId);

                if (!upgrade.repeatable && upgrade.purchased) {
                    buyButton?.elementWidget && mod.SetUIWidgetBgAlpha(buyButton.elementWidget, 0.1);
                    // buyText?.elementWidget && mod.SetUITextLabel(buyText.elementWidget, toMessage(mod.stringkeys.bought, []));
                    buyCost?.elementWidget && mod.SetUITextLabel(buyCost.elementWidget, toMessage(mod.stringkeys.bought, []));
                    buyPool?.elementWidget && mod.SetUITextLabel(buyPool.elementWidget, toMessage(mod.stringkeys.emptyString));
                } else {
                    buyPool?.elementWidget && mod.SetUITextLabel(buyPool.elementWidget, toMessage(mod.stringkeys.pooledCash, [upgrade.pooledMoney]));
                }
            });
        });

        this.UpdateBaseWorth(base.id, base.GetBaseTotalWorth());
    }

    UpdateAllBasesWorth() {
        BaseRuntimeData.forEach(basedata => {
            this.UpdateBaseWorth(basedata.id, basedata.GetBaseTotalWorth())
        });
    }



    UpdateBaseWorth(baseID: string, amount: number) {
        const data = this.widgetPageMap.get(baseID);
        if (data) {
            const baseWorthElement = data.uiElements.find(baseWorth => baseWorth.id == `Menu_BaseWorth_${baseID}_${this.#PlayerProfile.playerID}`)
            baseWorthElement?.elementWidget && mod.SetUITextLabel(baseWorthElement.elementWidget, toMessage(mod.stringkeys.points, [amount]))
        }
    }

    UpdateBaseAttackTargets(baseID: string, attackbaseID: string) {

        const BasesWithoutMainBases = BaseRuntimeData.filter(base => !base.teamMainBase)


        BasesWithoutMainBases.forEach(baseTarget => {
            const data = this.widgetPageMap.get(baseID)
            if (data) {
                const SelectButton = data.uiElements.find(x => x.id == `AttackButtonSelected_${baseID}_${baseTarget.id}_${this.#PlayerProfile.playerID}`)
                SelectButton?.elementWidget && mod.SetUIWidgetVisible(SelectButton.elementWidget, baseTarget.id == attackbaseID)
            }
        });
    }

    UpdateAllBasesAttackButtonsColors() {
        const basesWithoutMain = BaseRuntimeData.filter(base => !base.teamMainBase);

        basesWithoutMain.forEach(base => {
            this.UpdateBaseAttackButtonColors(base.id)
        });


    }

    UpdateBaseAttackButtonColors(baseID: string) {
        const data = this.widgetPageMap.get(baseID)
        if (!data) return;

        const BasesWithoutMainBases = BaseRuntimeData.filter(base => !base.teamMainBase)


        BasesWithoutMainBases.forEach(baseTarget => {
            const data = this.widgetPageMap.get(baseID)
            if (data) {

                const buttonName = `AttackTargetButton_${baseID}_${baseTarget.id}_${this.#PlayerProfile.playerID}`;
                const buttonSelectName = `AttackButtonSelected_${baseID}_${baseTarget.id}_${this.#PlayerProfile.playerID}`
                const buttonText = `AttackButtonText_${baseID}_${baseTarget.id}_${this.#PlayerProfile.playerID}`

                const buttonElementName = data.uiElements.find(x => x.id == buttonName)
                const buttonSelectElementName = data.uiElements.find(x => x.id == buttonSelectName)
                const buttonElementText = data.uiElements.find(x => x.id == buttonText)


                let color: number[] = this.Colors.white;
                if (baseTarget) {
                    const teamStatus = HoH_Helpers.GetTeamAllegianceToPlayer(baseTarget.ownerTeam, this.#PlayerProfile)

                    if (teamStatus === TeamAllegiance.Friendly) {
                        color = this.Colors.brightBlue;
                    } else if (teamStatus === TeamAllegiance.Enemy) {
                        color = this.Colors.orange;
                    } else {
                        color = this.Colors.white;
                    }
                }

                buttonElementName?.elementWidget && mod.SetUIWidgetBgColor(buttonElementName.elementWidget, mod.CreateVector(color[0], color[1], color[2]));
                buttonSelectElementName?.elementWidget && mod.SetUIWidgetBgColor(buttonSelectElementName.elementWidget, mod.CreateVector(color[0], color[1], color[2]));
                buttonElementText?.elementWidget && mod.SetUITextColor(buttonElementText.elementWidget, mod.CreateVector(color[0], color[1], color[2]));
            }
        });
    }


    SelectCategory(base: Base, _category: UpgradeCategory) {


        const wid = this.widgetPageMap.get(base.id)

        if (!wid) {
            console.log("Could not find selected category: " + _category)
            return
        }

        wid.selectedCategory = _category


        Object.values(UpgradeCategory).forEach((category, index) => {

            console.log(category + " vs " + _category)

            const categoriesElements = wid.uiElements.find(x => x.id.includes(`UpgradeCategories_${category}Button_${base.id}_${index}_${this.#PlayerProfile.playerID}`))
            categoriesElements?.elementWidget && mod.SetUIWidgetBgFill(categoriesElements?.elementWidget, _category == category ? mod.UIBgFill.None : mod.UIBgFill.Blur)


            const upgradesForThisCategory = base.availableUpgrades.filter(x => x.category == category)

            upgradesForThisCategory.forEach((upgrade, index) => {

                const upgradeButt = `BuyButton${upgrade.id}_${index + 1}button_${base.id}_${this.#PlayerProfile.playerID}`
                const upgradeText = `BuyButton${upgrade.id}_${index + 1}Text_${base.id}_${this.#PlayerProfile.playerID}`
                const upgradePool = `BuyButton${upgrade.id}_${index + 1}cost_${base.id}_${this.#PlayerProfile.playerID}`
                const upgradeCost = `BuyButton${upgrade.id}_${index + 1}pool_${base.id}_${this.#PlayerProfile.playerID}`

                const upgradeButtWidget = wid.uiElements.find(x => x.id == upgradeButt)?.elementWidget
                const upgradeTextWidget = wid.uiElements.find(x => x.id == upgradeText)?.elementWidget
                const upgradePoolWidget = wid.uiElements.find(x => x.id == upgradePool)?.elementWidget
                const upgradeCostWidget = wid.uiElements.find(x => x.id == upgradeCost)?.elementWidget

                upgradeButtWidget && mod.SetUIWidgetVisible(upgradeButtWidget, upgrade.category == _category)
                upgradeTextWidget && mod.SetUIWidgetVisible(upgradeTextWidget, upgrade.category == _category)
                upgradePoolWidget && mod.SetUIWidgetVisible(upgradePoolWidget, upgrade.category == _category)
                upgradeCostWidget && mod.SetUIWidgetVisible(upgradeCostWidget, upgrade.category == _category)
            })


        })
    }

    GetUpgradeCategoryString(upgradeCategory: UpgradeCategory) {

        if (upgradeCategory == UpgradeCategory.building) {
            return mod.stringkeys.upgradeCategoryBuilding
        } else if (upgradeCategory == UpgradeCategory.vehicle) {
            return mod.stringkeys.upgradeCategoryVehicle
        } else if (upgradeCategory == UpgradeCategory.stationary) {
            return mod.stringkeys.upgradeCategoryStationary
        }

        return ""
    }

    DisplayUpgradeInfo(baseID: string, upgradeID: string) {

        if (!this.IsShopOpen) {
            return
        }

        if (!this.upgradeInfoWidget) {
            this.upgradeInfoWidget = this.CreateUpgradeInfoWidget() as mod.UIWidget
            mod.SetUIWidgetDepth(this.upgradeInfoWidget, mod.UIDepth.AboveGameUI)
        } else {
            if (this.upgradeInfoWidget) {
                mod.SetUIWidgetVisible(this.upgradeInfoWidget, true)
            }
        }

        const upgrade = BaseRuntimeData.find(x => x.id == baseID)?.availableUpgrades.find(y => y.id == upgradeID)

        if (upgrade) {
            const upgradeInfoWidgets = this.widgetPageMap.get("UpgradeInfoWidget")
            const upgradeName = upgradeInfoWidgets?.uiElements.find(x => x.id == "UpgradeInfo_name_Text_" + this.#PlayerProfile.playerID)
            const upgradeDescription = upgradeInfoWidgets?.uiElements.find(x => x.id == "UpgradeInfo_description_Text_" + this.#PlayerProfile.playerID)

            upgradeName?.elementWidget && mod.SetUITextLabel(upgradeName.elementWidget, toMessage(upgrade.name))
            upgradeDescription?.elementWidget && mod.SetUITextLabel(upgradeDescription.elementWidget, toMessage(upgrade.description))
        }
    }

    DisplayAttackButtonInfo() {

        if (!this.IsShopOpen) {
            return
        }

        if (!this.upgradeInfoWidget) {
            this.upgradeInfoWidget = this.CreateUpgradeInfoWidget() as mod.UIWidget
            mod.SetUIWidgetDepth(this.upgradeInfoWidget, mod.UIDepth.AboveGameUI)
        } else {
            if (this.upgradeInfoWidget) {
                mod.SetUIWidgetVisible(this.upgradeInfoWidget, true)
            }
        }

        const upgradeInfoWidgets = this.widgetPageMap.get("UpgradeInfoWidget")
        const upgradeName = upgradeInfoWidgets?.uiElements.find(x => x.id == "UpgradeInfo_name_Text_" + this.#PlayerProfile.playerID)
        const upgradeDescription = upgradeInfoWidgets?.uiElements.find(x => x.id == "UpgradeInfo_description_Text_" + this.#PlayerProfile.playerID)

        upgradeName?.elementWidget && mod.SetUITextLabel(upgradeName.elementWidget, toMessage(mod.stringkeys.command))
        upgradeDescription?.elementWidget && mod.SetUITextLabel(upgradeDescription.elementWidget, toMessage(mod.stringkeys.commandTroopsInfo))

    }

    HideUpgradeInfo() {

        if (this.upgradeInfoWidget) {
            mod.SetUIWidgetVisible(this.upgradeInfoWidget, false)
        }


    }

    rowOffsets(rowLength: number, buttonSize: number, spacing: number) {
        const centerIndex = (rowLength - 1) / 2;
        return Array.from({ length: rowLength }, (_, i) => (i - centerIndex) * (buttonSize + spacing));
    }

    CreateGameInfoWidget(): mod.UIWidget | undefined {

        const children: UIParams[] = []

        children.push(
            {
                type: "Text",
                name: "GamemodeInfo_Text_" + this.#PlayerProfile.playerID,
                textLabel: { text: mod.stringkeys.gameWinDescription, arg: [GameHandler.MaxGameScore] },
                position: [0, 40, 1],
                size: [450, 500, 0],
                bgFill: mod.UIBgFill.None,
                textSize: 35,
                textColor: [1, 1, 1],
                textAnchor: mod.UIAnchor.TopCenter,
                anchor: mod.UIAnchor.Center,
            },
            {
                type: "Container",
                name: `GamemodeInfo_Container_Line_${this.#PlayerProfile.playerID}`,
                position: [0, 130, 1],
                size: [200, 2, 0],
                bgColor: this.Colors.white,
                bgFill: mod.UIBgFill.Solid,
                anchor: mod.UIAnchor.TopCenter,
            },
            {
                type: "Text",
                name: "GamemodeCashInfo_Text_" + this.#PlayerProfile.playerID,
                textLabel: { text: mod.stringkeys.gameEarnMoneyDescription },
                position: [0, 0, 1],
                size: [450, 500, 0],
                bgFill: mod.UIBgFill.None,
                textSize: 35,
                textColor: [1, 1, 1],
                textAnchor: mod.UIAnchor.Center,
                anchor: mod.UIAnchor.Center,
            },
            {
                type: "Container",
                name: `GamemodeInfo_Line_Two_${this.#PlayerProfile.playerID}`,
                position: [0, 50, 1],
                size: [200, 2, 0],
                bgColor: this.Colors.white,
                bgFill: mod.UIBgFill.Solid,
                anchor: mod.UIAnchor.Center,
            },
            {
                type: "Text",
                name: "GamemodeBaseInfo_Text_" + this.#PlayerProfile.playerID,
                textLabel: { text: mod.stringkeys.gameBaseDescription },
                position: [0, -20, 1],
                size: [450, 500, 0],
                bgFill: mod.UIBgFill.None,
                textSize: 35,
                textColor: [1, 1, 1],
                textAnchor: mod.UIAnchor.BottomCenter,
                anchor: mod.UIAnchor.Center,
            },
            {
                type: "Container",
                name: `GamemodeInfo_Line_Three_${this.#PlayerProfile.playerID}`,
                position: [0, 0, 1],
                size: [200, 2, 0],
                bgColor: this.Colors.white,
                bgFill: mod.UIBgFill.Solid,
                anchor: mod.UIAnchor.BottomCenter,
            },

        )

        const GameInfoWidget = ParseUI({
            type: "Container",
            name: `GamemodeInfo_Container_${this.#PlayerProfile.playerID}`,
            position: [-500, -100, 0],
            size: [450, 500, 0],
            anchor: mod.UIAnchor.Center,
            bgColor: [1, 1, 1],
            bgFill: mod.UIBgFill.Blur,
            bgAlpha: 1,
            padding: 20,
            children: children,
            playerId: this.#PlayerProfile.player
        })






        return GameInfoWidget
    }

    createbuyMenu(base: Base) {
        const containerWidth = 450
        const containerHeight = 700
        const buttonWidth = 420
        const buttonHeight = 30
        const yOffset = 0;

        const baseY = -containerHeight / 2
        const spacingY = buttonHeight + 5

        // Shop Static Texts
        const children: UIParams[] = [
            {
                type: "Text",
                name: `Menu_TitleText_${base.id}_${this.#PlayerProfile.playerID}`,
                textLabel: { text: mod.stringkeys.baseTotalvalue },
                position: [0, -containerHeight / 2 + 30, 0],
                size: [containerWidth, 40, 0],
                textSize: 40,
                textColor: [1, 1, 1],
                bgFill: mod.UIBgFill.None,
                textAnchor: mod.UIAnchor.Center,
                anchor: mod.UIAnchor.Center,
            },
            {
                type: "Container",
                name: `Menu_TitleText_Line_${base.id}_${this.#PlayerProfile.playerID}`,
                position: [0, -containerHeight / 2 + 60, 0],
                size: [200, 2, 0],
                bgColor: this.Colors.white,
                bgFill: mod.UIBgFill.Solid,
                anchor: mod.UIAnchor.Center,
            },
            {
                type: "Text",
                name: `Menu_BaseWorth_${base.id}_${this.#PlayerProfile.playerID}`,
                textLabel: { text: mod.stringkeys.points, arg: [base.GetBaseTotalWorth()] },
                position: [0, -containerHeight / 2 + 90, 0],
                size: [containerWidth, 40, 0],
                textSize: 60,
                textColor: [1, 1, 1],
                bgFill: mod.UIBgFill.None,
                textAnchor: mod.UIAnchor.Center,
                anchor: mod.UIAnchor.Center,
            },
            {
                type: "Text",
                name: `Menu_commandText_${base.id}_${this.#PlayerProfile.playerID}`,
                textLabel: { text: mod.stringkeys.command },
                position: [0, -containerHeight / 2 + 150, 0],
                size: [containerWidth, 40, 0],
                textSize: 40,
                textColor: [1, 1, 1],
                bgFill: mod.UIBgFill.None,
                textAnchor: mod.UIAnchor.Center,
                anchor: mod.UIAnchor.Center,
            },
            {
                type: "Container",
                name: `Menu_CommandText_Line_${base.id}_${this.#PlayerProfile.playerID}`,
                position: [0, -containerHeight / 2 + 180, 0],
                size: [200, 2, 0],
                bgColor: this.Colors.white,
                bgFill: mod.UIBgFill.Solid,
                anchor: mod.UIAnchor.Center,
            },

        ]



        //Attack Target Buttons    

        let BasesWithoutMainBases = BaseRuntimeData.filter(base => !base.teamMainBase)

        BasesWithoutMainBases = BasesWithoutMainBases.sort((a, b) => a.name.localeCompare(b.name));


        const buttonSize = 50;
        const bigButtonSize = 50;
        const spacing = 8;
        const topY = -120;
        const bottomY = -50;

        const topRow = BasesWithoutMainBases.slice(0, 4);
        const bottomRow = BasesWithoutMainBases.slice(4);

        const topOffsets = this.rowOffsets(topRow.length, buttonSize, spacing);
        const bottomOffsets = this.rowOffsets(bottomRow.length, buttonSize, spacing);


        topRow.forEach((baseTarget, index) => {
            const size = base.id == baseTarget.id ? bigButtonSize : buttonSize; // middle button bigger
            const xPos = topOffsets[index];
            const yPos = topY;

            const buttonName = `AttackTargetButton_${base.id}_${baseTarget.id}_${this.#PlayerProfile.playerID}`;
            const buttonSelectName = `AttackButtonSelected_${base.id}_${baseTarget.id}_${this.#PlayerProfile.playerID}`
            const buttonText = `AttackButtonText_${base.id}_${baseTarget.id}_${this.#PlayerProfile.playerID}`

            children.push(
                {
                    type: "Container",
                    name: buttonSelectName,
                    position: [xPos, yPos, 0],
                    size: [size - 13, size - 13, 1],
                    bgColor: this.Colors.white,
                    bgFill: mod.UIBgFill.OutlineThin,
                    anchor: mod.UIAnchor.Center,
                    visible: (baseTarget.id == base.id ? true : false)
                },
                {
                    type: "Button",
                    name: buttonName,
                    position: [xPos, yPos, 0],
                    size: [size, size, 0],
                    anchor: mod.UIAnchor.Center,
                    bgFill: mod.UIBgFill.OutlineThin,
                    bgAlpha: 1,
                    bgColor: this.Colors.white,
                    buttonColorHover: [0, 0, 0],
                    buttonColorFocused: [0, 0, 0],
                },


                {
                    type: "Text",
                    name: buttonText,
                    textLabel: { text: baseTarget.name },
                    position: [xPos, yPos, 1],
                    size: [size, size, 0],
                    bgFill: mod.UIBgFill.None,
                    textSize: 32,
                    textColor: [1, 1, 1],
                    textAnchor: mod.UIAnchor.Center,
                    anchor: mod.UIAnchor.Center,
                },

            );

        });

        bottomRow.forEach((baseTarget, index) => {
            const size = base.id == baseTarget.id ? bigButtonSize : buttonSize; // middle button bigger
            const xPos = bottomOffsets[index];
            const yPos = bottomY;

            const buttonName = `AttackTargetButton_${base.id}_${baseTarget.id}_${this.#PlayerProfile.playerID}`;
            const buttonSelectName = `AttackButtonSelected_${base.id}_${baseTarget.id}_${this.#PlayerProfile.playerID}`
            const buttonText = `AttackButtonText_${base.id}_${baseTarget.id}_${this.#PlayerProfile.playerID}`

            children.push(
                {
                    type: "Container",
                    name: buttonSelectName,
                    position: [xPos, yPos, 1],
                    size: [size - 13, size - 13, 1],
                    bgColor: this.Colors.white,
                    bgFill: mod.UIBgFill.OutlineThin,
                    anchor: mod.UIAnchor.Center,
                    visible: (baseTarget.id == base.id ? true : false)
                },
                {
                    type: "Button",
                    name: buttonName,
                    position: [xPos, yPos, 0],
                    size: [size, size, 0],
                    anchor: mod.UIAnchor.Center,
                    bgFill: mod.UIBgFill.OutlineThin,
                    bgAlpha: 1,
                    bgColor: this.Colors.white,
                    buttonColorHover: [0, 0, 0],
                    buttonColorFocused: [0, 0, 0],
                },
                {
                    type: "Text",
                    name: buttonText,
                    textLabel: { text: baseTarget.name },
                    position: [xPos, yPos, 1],
                    size: [size, size, 0],
                    bgFill: mod.UIBgFill.None,
                    textSize: 32,
                    textColor: [1, 1, 1],
                    textAnchor: mod.UIAnchor.Center,
                    anchor: mod.UIAnchor.Center,
                },
            );
        });


        const BaseUpgradeYOffset = 10

        children.push(
            {
                type: "Text",
                name: `BaseUpgrades_${base.id}_${this.#PlayerProfile.playerID}`,
                textLabel: { text: mod.stringkeys.baseUpgrades },
                position: [0, BaseUpgradeYOffset, 0],
                size: [containerWidth, 40, 0],
                textSize: 40,
                textColor: [1, 1, 1],
                bgFill: mod.UIBgFill.None,
                textAnchor: mod.UIAnchor.Center,
                anchor: mod.UIAnchor.Center,
            },
            {
                type: "Container",
                name: `BaseUpgrades_Line_${base.id}_${this.#PlayerProfile.playerID}`,
                position: [0, BaseUpgradeYOffset + 25, 0],
                size: [200, 2, 0],
                bgColor: this.Colors.white,
                bgFill: mod.UIBgFill.Solid,
                anchor: mod.UIAnchor.Center,
            },
        )

        const amountOfCategories = Object.keys(UpgradeCategory).length;
        const upgradeWidth = buttonWidth;
        const catagoryButtonXSize = upgradeWidth / amountOfCategories;

        // compute where the first button should start
        const totalRowWidth = amountOfCategories * catagoryButtonXSize;
        const startX = -totalRowWidth / 2 + catagoryButtonXSize / 2;
        const upgradeCategoryYOffset = 65

        Object.values(UpgradeCategory).forEach((category, index) => {
            const x = startX + index * catagoryButtonXSize;

            children.push(
                {
                    type: "Button",
                    name: `UpgradeCategories_${category}Button_${base.id}_${index}_${this.#PlayerProfile.playerID}`,
                    position: [x, upgradeCategoryYOffset, 0],
                    size: [catagoryButtonXSize, 30, 0],
                    anchor: mod.UIAnchor.Center,
                    bgFill: category == this.selectedCategory ? mod.UIBgFill.None : mod.UIBgFill.Blur,
                    bgAlpha: 1,
                    bgColor: this.Colors.white,
                    buttonColorHover: [0, 0, 0],
                    buttonColorFocused: [0, 0, 0],
                },
                {
                    type: "Text",
                    name: `UpgradeCategories_${category}Text_${base.id}_${index}_${this.#PlayerProfile.playerID}`,
                    textLabel: { text: this.GetUpgradeCategoryString(category) },
                    position: [x, upgradeCategoryYOffset, 1],
                    size: [catagoryButtonXSize, 30, 0],
                    textSize: 18,
                    bgFill: mod.UIBgFill.None,
                    textColor: [1, 1, 1],
                    textAnchor: mod.UIAnchor.Center,
                    anchor: mod.UIAnchor.Center,
                },
            );


            const upgradesForThisCategory = base.availableUpgrades.filter(x => x.category == category)
            const upgradeButtonOffset = 110;

            upgradesForThisCategory.forEach((upgrade, index) => {
                const yPos = upgradeButtonOffset + index * spacingY
                const upgradebuttonName = `BuyButton${upgrade.id}_${index + 1}button_${base.id}_${this.#PlayerProfile.playerID}`
                const upgradetextName = `BuyButton${upgrade.id}_${index + 1}Text_${base.id}_${this.#PlayerProfile.playerID}`
                const upgradeCostWidgetName = `BuyButton${upgrade.id}_${index + 1}cost_${base.id}_${this.#PlayerProfile.playerID}`
                const upgradePooledWidgetName = `BuyButton${upgrade.id}_${index + 1}pool_${base.id}_${this.#PlayerProfile.playerID}`

                children.push(
                    {
                        type: "Button",
                        name: upgradebuttonName,
                        position: [0, yPos, 0],
                        size: [buttonWidth, buttonHeight, 0],
                        anchor: mod.UIAnchor.Center,
                        bgFill: mod.UIBgFill.Blur,
                        bgAlpha: 1,
                        bgColor: this.Colors.white,
                        buttonColorHover: [0, 0, 0],
                        buttonColorFocused: [0, 0, 0],
                        visible: this.selectedCategory == category
                    },
                    {
                        type: "Text",
                        name: upgradetextName,
                        textLabel: { text: upgrade.name },
                        position: [0, yPos, 1],
                        size: [buttonWidth, buttonHeight, 0],
                        textSize: 16,
                        bgFill: mod.UIBgFill.None,
                        textColor: [1, 1, 1],
                        textAnchor: mod.UIAnchor.CenterLeft,
                        anchor: mod.UIAnchor.Center,
                        visible: this.selectedCategory == category
                    },
                    {
                        type: "Text",
                        name: upgradePooledWidgetName,
                        textLabel: { text: mod.stringkeys.pooledCash, arg: [upgrade.pooledMoney] },
                        position: [-50, yPos, 1],
                        size: [buttonWidth, buttonHeight, 0],
                        textSize: 13,
                        bgFill: mod.UIBgFill.None,
                        textColor: [1, 1, 1],
                        textAnchor: mod.UIAnchor.BottomRight,
                        anchor: mod.UIAnchor.Center,
                        visible: this.selectedCategory == category
                    },
                    {
                        type: "Text",
                        name: upgradeCostWidgetName,
                        textLabel: { text: mod.stringkeys.cost, arg: [upgrade.cost] },
                        position: [0, yPos, 1],
                        size: [buttonWidth, buttonHeight, 0],
                        textSize: 16,
                        bgFill: mod.UIBgFill.None,
                        textColor: [1, 1, 1],
                        textAnchor: mod.UIAnchor.CenterRight,
                        anchor: mod.UIAnchor.Center,
                        visible: this.selectedCategory == category

                    }
                )

            })

        });


        // Exit button
        const exitButtonSize = [200, 50, 0]
        const exitButtonyOffset = 10;
        children.push(
            {
                type: "Button",
                name: `ExitButton_${base.id}_${this.#PlayerProfile.playerID}`,
                position: [0, (containerHeight / 2) - exitButtonSize[1] / 2 - exitButtonyOffset, 0],
                size: exitButtonSize,
                anchor: mod.UIAnchor.Center,
                buttonColorBase: [0, 0, 0],
                bgColor: [1, 0, 0],
                buttonAlphaBase: 1,
                bgFill: mod.UIBgFill.Solid,
                bgAlpha: 1,
                buttonColorHover: [1, 0, 0],
                buttonColorFocused: [1, 0, 0],
            },
            {
                type: "Text",
                name: `ExitButton_Label_${base.id}_${this.#PlayerProfile.playerID}`,
                textLabel: { text: mod.stringkeys.close },
                position: [0, (containerHeight / 2) - exitButtonSize[1] / 2 - exitButtonyOffset, 1],
                size: exitButtonSize,
                textSize: 36,
                textColor: [1, 1, 1],
                textAnchor: mod.UIAnchor.Center,
                anchor: mod.UIAnchor.Center,
            }
        )

        const buyMenu = ParseUI({
            type: "Container",
            name: `BuyMenuContainer_${base.id}_${this.#PlayerProfile.playerID}`,
            position: [0, yOffset, 0],
            size: [containerWidth, containerHeight, 0],
            anchor: mod.UIAnchor.Center,
            bgColor: [1, 1, 1],
            bgFill: mod.UIBgFill.Blur,
            bgAlpha: 1,
            padding: 20,
            children: children,
            playerId: this.#PlayerProfile.player
        })

        //----------------Bind buttons after we have created the widgets--------------------

        // bind BaseWorth text
        this.SetShopData(base.id, undefined, [
            {
                id: `Menu_BaseWorth_${base.id}_${this.#PlayerProfile.playerID}`,
                elementWidget: mod.FindUIWidgetWithName(`Menu_BaseWorth_${base.id}_${this.#PlayerProfile.playerID}`),
                type: "text",
            }
        ])

        // Bind Attack buttons
        BasesWithoutMainBases.forEach(baseTarget => {

            const buttonName = `AttackTargetButton_${base.id}_${baseTarget.id}_${this.#PlayerProfile.playerID}`;
            const buttonSelectName = `AttackButtonSelected_${base.id}_${baseTarget.id}_${this.#PlayerProfile.playerID}`
            const buttonText = `AttackButtonText_${base.id}_${baseTarget.id}_${this.#PlayerProfile.playerID}`

            this.SetShopData(base.id, undefined, [
                {
                    id: buttonName,
                    elementWidget: mod.FindUIWidgetWithName(buttonName),
                    type: "button",
                    eventClick: (widget, event) => {
                        base.SetAIAttackTarget(baseTarget, this.#PlayerProfile.player)
                    },
                    eventFocusIn: (widget, event) => {
                        this.DisplayAttackButtonInfo()
                    },
                    eventFocusOut: (widget, event) => {
                        this.HideUpgradeInfo();
                    },
                },
                {
                    id: buttonSelectName,
                    elementWidget: mod.FindUIWidgetWithName(buttonSelectName),
                    type: "container"
                },
                {
                    id: buttonText,
                    elementWidget: mod.FindUIWidgetWithName(buttonText),
                    type: "text"
                },

            ])

        })



        // Bind upgrade buttons
        Object.values(UpgradeCategory).forEach((category, index) => {

            const upgradesForThisCategory = base.availableUpgrades.filter(x => x.category == category)
            const upgradeCatogreyName = `UpgradeCategories_${category}Button_${base.id}_${index}_${this.#PlayerProfile.playerID}`

            this.SetShopData(base.id, undefined, [
                {
                    id: upgradeCatogreyName,
                    elementWidget: mod.FindUIWidgetWithName(upgradeCatogreyName),
                    type: "button",
                    eventClick: (widget, event) => {
                        this.SelectCategory(base, category)
                    }
                }

            ])

            upgradesForThisCategory.forEach((upgrade, index) => {


                const buybuttonButton = `BuyButton${upgrade.id}_${index + 1}button_${base.id}_${this.#PlayerProfile.playerID}`
                const buybuttonText = `BuyButton${upgrade.id}_${index + 1}Text_${base.id}_${this.#PlayerProfile.playerID}`
                const buybuttonCost = `BuyButton${upgrade.id}_${index + 1}cost_${base.id}_${this.#PlayerProfile.playerID}`
                const buybuttonPool = `BuyButton${upgrade.id}_${index + 1}pool_${base.id}_${this.#PlayerProfile.playerID}`


                this.SetShopData(base.id, undefined, [
                    {
                        id: buybuttonButton,
                        elementWidget: mod.FindUIWidgetWithName(buybuttonButton),
                        type: "button",
                        eventClick: (widget, event) => {
                            base.purchaseUpgrade(upgrade.id, this.#PlayerProfile)
                        },
                        eventFocusIn: (widget, event) => {
                            this.DisplayUpgradeInfo(base.id, upgrade.id)
                        },
                        eventFocusOut: (widget, event) => {
                            this.HideUpgradeInfo();
                        },
                    },
                    {
                        id: buybuttonText,
                        elementWidget: mod.FindUIWidgetWithName(buybuttonText),
                        type: "text"
                    },
                    {
                        id: buybuttonCost,
                        elementWidget: mod.FindUIWidgetWithName(buybuttonCost),
                        type: "text"
                    },
                    {
                        id: buybuttonPool,
                        elementWidget: mod.FindUIWidgetWithName(buybuttonPool),
                        type: "text"
                    }
                ])

            })
        })

        const ExitButtonName = `ExitButton_${base.id}_${this.#PlayerProfile.playerID}`

        // Bind Exit Button
        this.SetShopData(base.id, undefined, [
            {
                id: ExitButtonName,
                elementWidget: mod.FindUIWidgetWithName(ExitButtonName),
                type: "button",
                eventClick: (widget, event) => {
                    this.CloseShop()
                },
            }
        ])


        return buyMenu
    }

    CreateUpgradeInfoWidget(): mod.UIWidget | undefined {

        const children: UIParams[] = []

        children.push(
            {
                type: "Text",
                name: "UpgradeInfo_name_Text_" + this.#PlayerProfile.playerID,
                textLabel: { text: mod.stringkeys.gameWinDescription, arg: [GameHandler.MaxGameScore] },
                position: [0, 40, 1],
                size: [450, 500, 0],
                bgFill: mod.UIBgFill.None,
                textSize: 35,
                textColor: [1, 1, 1],
                textAnchor: mod.UIAnchor.TopCenter,
                anchor: mod.UIAnchor.Center,
            },
            {
                type: "Container",
                name: `UpgradeInfo_Container_Line_${this.#PlayerProfile.playerID}`,
                position: [0, 80, 1],
                size: [200, 2, 0],
                bgColor: this.Colors.white,
                bgFill: mod.UIBgFill.Solid,
                anchor: mod.UIAnchor.TopCenter,
            },
            {
                type: "Text",
                name: "UpgradeInfo_description_Text_" + this.#PlayerProfile.playerID,
                textLabel: { text: mod.stringkeys.gameEarnMoneyDescription },
                position: [0, 100, 1],
                size: [450, 500, 0],
                bgFill: mod.UIBgFill.None,
                textSize: 35,
                textColor: [1, 1, 1],
                textAnchor: mod.UIAnchor.TopCenter,
                anchor: mod.UIAnchor.Center,
            },
        )

        const UpgradeInfoWidget = ParseUI({
            type: "Container",
            name: `UpgradeInfo_Container_${this.#PlayerProfile.playerID}`,
            position: [500, -100, 0],
            size: [450, 500, 0],
            anchor: mod.UIAnchor.Center,
            bgColor: [1, 1, 1],
            bgFill: mod.UIBgFill.Blur,
            bgAlpha: 1,
            padding: 20,
            children: children,
            playerId: this.#PlayerProfile.player
        })


        this.SetShopData("UpgradeInfoWidget", undefined, [
            {
                id: "UpgradeInfo_name_Text_" + this.#PlayerProfile.playerID,
                elementWidget: mod.FindUIWidgetWithName("UpgradeInfo_name_Text_" + this.#PlayerProfile.playerID),
                type: "text",
            },
            {
                id: "UpgradeInfo_description_Text_" + this.#PlayerProfile.playerID,
                elementWidget: mod.FindUIWidgetWithName("UpgradeInfo_description_Text_" + this.#PlayerProfile.playerID),
                type: "text",
            }
        ])


        return UpgradeInfoWidget
    }
}

export function OnPlayerUIButtonEvent(eventPlayer: mod.Player, eventUIWidget: mod.UIWidget, eventUIButtonEvent: mod.UIButtonEvent) {
    console.log("OnPlayerUIButtonEvent" + mod.GetUIWidgetName(eventUIWidget) + "_" + eventUIButtonEvent)

    // Look up elementData for this widget
    const element = PlayerProfile.get(eventPlayer)?.ShopUI.widgetToElementMap.get(mod.GetUIWidgetName(eventUIWidget));
    if (!element) return;

    // Trigger the right handler based on event type
    if (mod.Equals(eventUIButtonEvent, mod.UIButtonEvent.ButtonDown)) {
        element.eventClick?.(eventUIWidget, eventUIButtonEvent);
    } else if (mod.Equals(eventUIButtonEvent, mod.UIButtonEvent.FocusIn)) {
        element.eventFocusIn?.(eventUIWidget, eventUIButtonEvent);
    } else if (mod.Equals(eventUIButtonEvent, mod.UIButtonEvent.FocusOut)) {
        element.eventFocusOut?.(eventUIWidget, eventUIButtonEvent);
    }

}

export function OnPlayerInteract(eventPlayer: mod.Player, eventInteractPoint: mod.InteractPoint) {

    const baseData = BaseRuntimeData.find(base => HoH_Helpers.IsObjectIDsEqual(mod.GetInteractPoint(base.interactPointID), eventInteractPoint))

    if (!baseData) {
        console.log("Error: Could not find interact point for base.")
        return
    }

    if (!HoH_Helpers.IsObjectIDsEqual(mod.GetTeam(eventPlayer), baseData.ownerTeam)) {
        console.log("Player team do not own base.")
        return
    }

    const playerprof = PlayerProfile.get(eventPlayer)

    if (playerprof) {
        playerprof.ShopUI.OpenShop(baseData);
    }
}





// === HoH_UIStart.ts ===





class HoH_UIStartPopup {

    #PlayerProfile: PlayerProfile

    private UiWidget: mod.UIWidget | undefined

    playerSpawned: boolean = false;

    constructor(PlayerProfile: PlayerProfile) {
        this.#PlayerProfile = PlayerProfile


    }

    private fadeOutWidgets: WidgetType[] = []

    async Show() {

        if (this.playerSpawned) {
            return
        }
        this.playerSpawned = true

        if (!this.UiWidget) {
            this.UiWidget = this.CreateUI() as mod.UIWidget
            mod.SetUIWidgetDepth(this.UiWidget, mod.UIDepth.BelowGameUI)
        } else {
            if (this.UiWidget) {
                mod.SetUIWidgetVisible(this.UiWidget, true)
            }
        }


        await ShowWidget(this.fadeOutWidgets)

        await mod.Wait(20)

        await FadeWidget("HoH_UIStartPopup", this.fadeOutWidgets, 5)

        this.Close()
    }

    Delete() {
        if (this.UiWidget) {
            mod.DeleteUIWidget(this.UiWidget)
        }
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
                name: `Start_Popup_Objective_Text_${this.#PlayerProfile.playerID}`,
                textLabel: { text: mod.stringkeys.objective },
                position: [0, -20, 0],
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
                name: `Start_Popup_Line_${this.#PlayerProfile.playerID}`,
                position: [0, 0, 0],
                size: [250, 1, 0],
                bgColor: [1, 1, 1],
                bgFill: mod.UIBgFill.Solid,
                anchor: mod.UIAnchor.Center,
            },
            {
                type: "Text",
                name: `Start_Popup_Text_${this.#PlayerProfile.playerID}`,
                textLabel: { text: mod.stringkeys.gameWinDescription, arg: [GameHandler.MaxGameScore] },
                position: [0, 20, 0],
                size: boxsize,
                textSize: 25,
                bgFill: mod.UIBgFill.None,
                textColor: [1, 1, 1],
                textAnchor: mod.UIAnchor.Center,
                anchor: mod.UIAnchor.Center,
            }
        )

        const popup = ParseUI({
            type: "Container",
            name: `Start_Popup_${this.#PlayerProfile.playerID}`,
            position: [0, 160, 0],
            size: boxsize,
            anchor: mod.UIAnchor.TopCenter,
            bgColor: [1, 1, 1],
            bgFill: mod.UIBgFill.Blur,
            bgAlpha: 1,
            padding: 20,
            children: children,
            playerId: this.#PlayerProfile.player
        })

        this.fadeOutWidgets.push(
            { type: "text", widget: mod.FindUIWidgetWithName(`Start_Popup_Objective_Text_${this.#PlayerProfile.playerID}`) },
            { type: "background", widget: mod.FindUIWidgetWithName(`Start_Popup_Line_${this.#PlayerProfile.playerID}`) },
            { type: "text", widget: mod.FindUIWidgetWithName(`Start_Popup_Text_${this.#PlayerProfile.playerID}`) },
            { type: "background", widget: mod.FindUIWidgetWithName(`Start_Popup_${this.#PlayerProfile.playerID}`) },
        )

        return popup
    }


}


