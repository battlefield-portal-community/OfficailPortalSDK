// === src\HoH_Skirmish_main.ts ===
const VERSION = [1, 15, 244];
//version format is [ship, delivery, patch/compile]







export async function OnGameModeStarted() {
    console.log("Game Mode Started - Initializing Enhanced Loot System");
   // mod.SetSpawnMode(mod.SpawnModes.AutoSpawn)
    //mod.SpawnAIFromAISpawner(mod.GetSpawner(0));
    //console.log("AI spawned from spawner 0");

    mod.SetAIToHumanDamageModifier(0.1);

    TeamData.Initialize([mod.GetTeam(1), mod.GetTeam(2), mod.GetTeam(3), mod.GetTeam(4)]);

    InitializeInteractPoints();

    //await mod.Wait(2);

    //mod.SetFriendlyFire(true)

    GS.StartPreRound();

    TickUpdate();
    SlowTickUpdate();
    // DebugSpawnAI()
}

async function TickUpdate() {
    while (true) {
        GC.thirdPersonMode && UpdateADS();
        await mod.Wait(0);
    }
}

async function SlowTickUpdate() {
    while (true) {
        //await ForceSpawnAllPlayers();
        await mod.Wait(0.5);
    }
}


async function DebugSpawnAI() {
    while (true) {

        mod.SpawnAIFromAISpawner(mod.GetSpawner(30))
        mod.SpawnAIFromAISpawner(mod.GetSpawner(31))
        mod.SpawnAIFromAISpawner(mod.GetSpawner(32))
        await mod.Wait(15.0);

        const players = mod.AllPlayers();
        const n = mod.CountOf(players);
        for (let i = 0; i < n; i++) {
            const loopPlayer = mod.ValueInArray(players, i);
            if (mod.GetSoldierState(loopPlayer, mod.SoldierStateBool.IsAISoldier)) {
                mod.Kill(loopPlayer)
            }
        }
        await mod.Wait(15.0);

    }
}


function UpdateADS() {
    PlayerProfile.playerInstances.forEach((player: mod.Player) => {
        let pp = PlayerProfile.Get(player);

        if (pp && mod.IsPlayerValid(player) && mod.GetSoldierState(player, mod.SoldierStateBool.IsAlive)) {
            if (mod.GetSoldierState(player, mod.SoldierStateBool.IsZooming)) {
                if (pp.isADS == false) {
                    mod.SetCameraTypeForPlayer(player, mod.Cameras.FirstPerson);
                    pp.isADS = true;
                }
            }
            else {
                if (pp.isADS == true) {
                    mod.SetCameraTypeForPlayer(player, mod.Cameras.ThirdPerson);
                    pp.isADS = false;
                };
            }
        }
    });
}

async function InitializeInteractPoints() {
    EnableInteractPoints(true);
    EnableBuyWorldIcons(true);
}


function EnableInteractPoints(bool: boolean) {
    mod.EnableInteractPoint(mod.GetInteractPoint(0), bool);
    mod.EnableInteractPoint(mod.GetInteractPoint(1), bool);
    mod.EnableInteractPoint(mod.GetInteractPoint(2), bool);
    mod.EnableInteractPoint(mod.GetInteractPoint(3), bool);
}

function EnableBuyWorldIcons(bool: boolean) {

    // Bind world Icons to team
    mod.SetWorldIconOwner(mod.GetWorldIcon(0), mod.GetTeam(1))
    mod.SetWorldIconOwner(mod.GetWorldIcon(1), mod.GetTeam(2))
    mod.SetWorldIconOwner(mod.GetWorldIcon(2), mod.GetTeam(3))
    mod.SetWorldIconOwner(mod.GetWorldIcon(3), mod.GetTeam(4))

    mod.EnableWorldIconImage(mod.GetWorldIcon(0), bool);
    mod.EnableWorldIconImage(mod.GetWorldIcon(1), bool);
    mod.EnableWorldIconImage(mod.GetWorldIcon(2), bool);
    mod.EnableWorldIconImage(mod.GetWorldIcon(3), bool);
}

export function OnPlayerInteract(eventPlayer: mod.Player): void {
    if (mod.IsPlayerValid(eventPlayer)) {
        UseBuyMenu(eventPlayer);
    }
}

export async function OnPlayerJoinGame(player: mod.Player) {

    while (true) {
        if (mod.GetObjId(player) > -1 && mod.IsPlayerValid(player)) {
            break;
        }
        await mod.Wait(0.5);
    }

    console.log("OnplayerJOin player isvalid")

    if (GD.roundActive) {
        return
    }

    await mod.Wait(2.0);

    TeamHandler(player);

    PlayerProfile.Get(player);

    UI.UpdateUIForWidgetType(pp => pp.playerRemainingPlayersWidget[0], PlayerProfile.playerInstances, H.MakeMessage(mod.stringkeys.remainingPlayers, PlayerProfile.deployedPlayers.length, GC.maxPlayers), true);
    UI.UpdateUIForWidgetType(pp => pp.playerRemainingPlayersWidget.slice(1), PlayerProfile.playerInstances, undefined, true);

    if (!GD.roundActive) {
        //Update every Players playerOnTeamUI
        PlayerProfile.playerInstances.forEach(element => {
            const playerPof = PlayerProfile.Get(element)
            playerPof?.playerOnTeamWidget && UI.UpdatePlayerOnTeamUI(playerPof?.playerOnTeamWidget, playerPof)
        });
    }

}

async function TeamHandler(player: mod.Player) {
    let teamId = 1;
    const lowestCount = Math.min(GC.teamMemberCount[0], GC.teamMemberCount[1], GC.teamMemberCount[2], GC.teamMemberCount[3]);

    // Find teams with the lowest count
    const teamIndices = [0, 1, 2, 3]; // All four teams

    // Filter to get only teams with the lowest count
    const teamsWithLowestCount = teamIndices.filter(i => GC.teamMemberCount[i] === lowestCount);
    // Randomly select from teams with lowest count
    const randomIndex = Math.floor(Math.random() * teamsWithLowestCount.length);
    const selectedTeamIndex = teamsWithLowestCount[randomIndex];
    teamId = selectedTeamIndex + 1; // Convert back to team number (1-based)


    try {
        if (mod.GetObjId(mod.GetTeam(teamId)) != mod.GetObjId(mod.GetTeam(player))) {
            mod.SetTeam(player, mod.GetTeam(teamId));
            GC.teamMemberCount[selectedTeamIndex]++;
            console.log("teammebercount " + GC.teamMemberCount[selectedTeamIndex])
        }
    } catch {
        console.log("ERROR THIS IS REALLY BAD")
    }

    RefreshTeamMemberCount();
}

function RefreshTeamMemberCount() {
    GC.teamMemberCount = [0, 0, 0, 0];
    const players = mod.AllPlayers();
    const n = mod.CountOf(players);
    for (let i = 0; i < n; i++) {
        const loopPlayer = mod.ValueInArray(players, i);
        if (mod.IsPlayerValid(loopPlayer)) {
            const teamId = H.GetTeamNumber(loopPlayer); // This returns 1-4

            GC.teamMemberCount[teamId - 1]++; // Convert to 0-3 index
        }
    }
    console.log("Team member count refreshed - team 1: " + GC.teamMemberCount[0] + ", team 2: " + GC.teamMemberCount[1] + ", team 3: " + GC.teamMemberCount[2] + ", team 4: " + GC.teamMemberCount[3]);
}

async function GivePlayerCurrency(player: mod.Player, amount: number) {
    if (player && mod.IsPlayerValid(player)) {
        try {
            const playerProfile = PlayerProfile.Get(player);
            if (playerProfile) {
                playerProfile.currency += amount;
                UI.UpdateUI(playerProfile.playerCurrencyWidget, H.MakeMessage(mod.stringkeys.currency, playerProfile.currency), true);
                UI.ShowCurrencyFeedback(playerProfile);
                console.log("gave player " + amount + " currency, new total: " + playerProfile.currency);
                //mod.SetGameModeScore(eventPlayer, playerProfile.currency);
            }
        } catch { }
    }
}

// Add this variable at the top of your file with other global variables
let isProcessingWinCondition = false;

async function CheckWinCondition() {
    // Prevent multiple simultaneous win condition checks
    if (isProcessingWinCondition) {
        console.log("Win condition check already in progress, skipping...");
        return;
    }

    if (!GD.roundActive) {
        console.log("Checking win condition... Current round active: false");
        return;
    }

    // Set the flag to prevent concurrent execution
    isProcessingWinCondition = true;

    try {
        console.log("Checking win condition... Current round active: true");

        const aliveTeams: number[] = [];

        for (let teamId = 1; teamId <= 4; teamId++) {
            let hasAlivePlayer = false;

            // Clean the playersInRound array first
            PlayerProfile.playersInRound = PlayerProfile.playersInRound.filter(player => {
                try {
                    return player && mod.IsPlayerValid(player);
                } catch {
                    return false;
                }
            });

            PlayerProfile.playersInRound.forEach(element => {
                try {
                    if (!mod.IsPlayerValid(element)) {
                        return; // Skip invalid players
                    }

                    if (H.GetTeamNumber(element) === teamId &&
                        mod.GetSoldierState(element, mod.SoldierStateBool.IsAlive)) {
                        hasAlivePlayer = true;
                    }
                } catch (error) {
                    console.log(`Error checking player ${mod.GetObjId(element)}: ${error}`);
                }
            });

            if (hasAlivePlayer) {
                aliveTeams.push(teamId);
            }
        }

        if (aliveTeams.length === 1) {
            // Double-check that the round is still active before proceeding
            if (!GD.roundActive) {
                console.log("Round ended while processing win condition, aborting...");
                return;
            }

            //mod.DisplayNotificationMessage(H.MakeMessage(mod.stringkeys.teamWinsRound, aliveTeams[0]));
            //console.log("Team " + aliveTeams[0] + " has won the round");

            // IMMEDIATELY set roundActive to false to prevent duplicate processing
            GD.roundActive = false;

            // Increment score only once
            GD.teamDataArray[aliveTeams[0] - 1].score++;
            //console.log(`Team ${aliveTeams[0]} score incremented to: ${GD.teamDataArray[aliveTeams[0] - 1].score}`);

            // Update UI for all players
            PlayerProfile.playerInstances.forEach(player => {
                try {
                    if (!mod.IsPlayerValid(player)) return;

                    const playerProfile = PlayerProfile.Get(player);
                    if (playerProfile) {
                        playerProfile?.playerTeamScoreWidgets && UI.UpdateUI(playerProfile.playerTeamScoreWidgets[aliveTeams[0] - 1], H.MakeMessage(mod.stringkeys.teamScore, aliveTeams[0], GD.teamDataArray[aliveTeams[0] - 1].score), false);
                        if (H.GetTeamNumber(player) == aliveTeams[0]) {
                            UI.UpdateIndividualTeamScore(playerProfile, GD.teamDataArray[aliveTeams[0] - 1].score);
                            console.log("should now update individual team score to: " + GD.teamDataArray[aliveTeams[0] - 1].score);
                            GivePlayerCurrency(player, GC.currencyGainOnWin);
                            UI.ShowPersonalAnnouncement(H.MakeMessage(mod.stringkeys.yourTeamWinsRound), true, playerProfile);
                            UI.ShowMinorAnnouncement(H.MakeMessage(mod.stringkeys.roundWon), true, playerProfile);
                        } else {
                            UI.ShowPersonalAnnouncement(H.MakeMessage(mod.stringkeys.teamWinsRound, aliveTeams[0]), false, playerProfile);
                            UI.ShowMinorAnnouncement(H.MakeMessage(mod.stringkeys.roundLost), false, playerProfile);
                        }
                    }
                } catch (error) {
                    console.log(`Error updating UI for player: ${error}`);
                }
            });

            let teamsWithScore = 0;
            let willTerminateExistence = false;

            GD.teamDataArray.forEach(element => {
                if (element.score >= GC.maxRounds) {
                    console.log(`Team ${element.team} has won the game with score ${element.score}`);
                    mod.Wait(3);
                    mod.EndGameMode(element.team);
                    mod.DeleteAllUIWidgets();
                    willTerminateExistence = true;
                    return;
                } else if (element.score > 0) {
                    teamsWithScore++;
                }
            });

            // Check if 3 teams have scores (draw condition)
            // if (teamsWithScore >= 3) {
            //     console.log("Three teams have scores - ending game in draw");
            //     mod.Wait(3);
            //     mod.EndGameMode(mod.GetTeam(0));
            //     mod.DeleteAllUIWidgets();
            //     willTerminateExistence = true;
            // }

            if (willTerminateExistence) {
                return; // Game is ending, don't continue with round logic
            }

            await mod.Wait(5.0);
            console.log("Ending round due to win condition");

            // Call EndRound to properly reset game state
            GS.EndRound();
        }
    } finally {
        // Always reset the flag, even if an error occurs
        isProcessingWinCondition = false;
    }
}

export async function OnPlayerDeployed(player: mod.Player) {

    if (GD.roundActive && !PlayerProfile.dyingPlayers.includes(player)) {
        mod.UndeployPlayer(player)
        return
    }

    //console.log("gamer has spawned at " + mod.GetObjectPosition(mod.GetSpawnPoint(1)))
    if (mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier)) {
        mod.SpotTarget(player, 10000000);
        mod.AIBattlefieldBehavior(player);
    }

    if (mod.IsPlayerValid(player)) {
        mod.SkipManDown(player, true);
        //await mod.Wait(1.0);
        const playerProfile = PlayerProfile.Get(player);
        if (GC.thirdPersonMode && playerProfile && !playerProfile?.hasSetThirdPersonView) {
            mod.SetCameraTypeForPlayer(player, mod.Cameras.ThirdPerson);
            playerProfile.hasSetThirdPersonView = true;
        }
        //UI.ShowLoadoutWarningUI(true, playerProfile);

        if (/* GD.isInPreRound */true) { //enable this later when preround deployment is more under control
            //await mod.Wait(0.5);
            /* if (!playerProfile?.buyPhaseUI?.hasBeenCreated) {
                await mod.Wait(1);
                playerProfile?.buyPhaseUI?.createUI();
            }
            await mod.Wait(0.1);
            playerProfile?.buyPhaseUI?.OpenTab("weapons"); */
            UI.UpdateUI(playerProfile?.playerDeployWidget, H.MakeMessage(mod.stringkeys.preRoundStarted), false);

        }

        if (playerProfile?.maxHealth != undefined) {
            playerProfile.maxHealth = mod.GetSoldierState(player, mod.SoldierStateNumber.MaxHealth);
        }

        SetPlayerLoadout(player);
        PlayerProfile.deployedPlayers.push(player);
        if (GD.currentRound == 1) {
            GS.GameStartDeploymentUpdate();
        }

        if (GD.currentRound == 1 && GD.isInPreRound) {
            if (!mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier)) mod.SetPlayerMaxHealth(player, 900);
        }

        if (GD.roundActive) {
            UI.UpdateUIForWidgetType(pp => pp.playerRemainingPlayersWidget[0], PlayerProfile.playerInstances, H.MakeMessage(mod.stringkeys.remainingPlayers, PlayerProfile.playersInRound.length, GC.maxPlayers), true);
        } else {
            UI.UpdateUIForWidgetType(pp => pp.playerRemainingPlayersWidget[0], PlayerProfile.playerInstances, H.MakeMessage(mod.stringkeys.remainingPlayers, PlayerProfile.deployedPlayers.length, GC.maxPlayers), true);

            //Update every Players playerOnTeamUI
            PlayerProfile.playerInstances.forEach(element => {
                const playerPof = PlayerProfile.Get(element)
                playerPof?.playerOnTeamWidget && UI.UpdatePlayerOnTeamUI(playerPof?.playerOnTeamWidget, playerPof)
            });

        }
        UI.UpdateUIForWidgetType(pp => pp.playerRemainingPlayersWidget.slice(1), PlayerProfile.playerInstances, undefined, true);

        console.log("has started update gamestartcountdown");

        if (!GC.gameStartDebounce) {
            //mod.EnableAllInputRestrictions(player, true);
        } else {
            //mod.EnableAllInputRestrictions(player, false);
        }

        //  console.log("spawn test weapon on player2")
        //  await mod.Wait(5)
        //  //Test one
        //  const pos = mod.GetSoldierState(player, mod.SoldierStateVector.GetPosition)
        //  const obj = mod.SpawnObject(mod.RuntimeSpawn_Common.LootSpawner, pos, mod.CreateVector(0, 0, 0), mod.CreateVector(0, 0, 0))
        //  mod.SpawnLoot(obj, mod.Weapons.AssaultRifle_AK4D)
        //
        //  //Test two
        //  const objId = mod.GetObjId(obj)
        //  const spawner = mod.GetLootSpawner(objId)
        //  mod.SpawnLoot(spawner, mod.Weapons.AssaultRifle_AK4D)
        //
        //
        //
        //  //Test three
        //  mod.SpawnLoot(mod.GetLootSpawner(1), mod.Weapons.AssaultRifle_AK4D)
        //  mod.SpawnLoot(mod.GetLootSpawner(2), mod.Weapons.AssaultRifle_AK4D)
        //  mod.SpawnLoot(mod.GetLootSpawner(3), mod.Weapons.AssaultRifle_AK4D)
        //  mod.SpawnLoot(mod.GetLootSpawner(4), mod.Weapons.AssaultRifle_AK4D)

    }
}

export function OnRevived(eventPlayer: mod.Player, eventOtherPlayer: mod.Player) {

    console.log("OnRevived")

    PlayerProfile.deployedPlayers.push(eventPlayer)
    PlayerProfile.playersInRound.push(eventPlayer)

    UI.UpdateUIForWidgetType(pp => pp.playerRemainingPlayersWidget[0], PlayerProfile.playerInstances, H.MakeMessage(mod.stringkeys.remainingPlayers, PlayerProfile.deployedPlayers.length, GC.maxPlayers), true);
    UI.UpdateUIForWidgetType(pp => pp.playerRemainingPlayersWidget.slice(1), PlayerProfile.playerInstances, undefined, true);

    const index = PlayerProfile.dyingPlayers.indexOf(eventPlayer);
    if (index !== -1) PlayerProfile.dyingPlayers.splice(index, 1);

}

export async function OnPlayerDied(player: mod.Player,
    eventOtherPlayer: mod.Player,
    eventDeathType: mod.DeathType,
    eventWeaponUnlock: mod.WeaponUnlock) {


    console.log("OnPlayerDied")
    const playersOnEachTeam = H.GetPlayersOnTeam();
    const playerTeam = mod.GetTeam(player);
    const playerTeamId = mod.GetObjId(playerTeam);
    const playersOnTeam = playersOnEachTeam[playerTeamId] || [];
    const alivePlayersOnTeam = playersOnTeam.filter(x =>
        mod.GetSoldierState(x, mod.SoldierStateBool.IsAlive)
    );

    if (alivePlayersOnTeam.length <= 1) {
        mod.Kill(player)
    }

    PlayerProfile.dyingPlayers.push(player)

    if (mod.IsPlayerValid(player)) {
        PlayerProfile.RemovePlayerFromDeployedPlayers(player);
        PlayerProfile.RemovePlayerFromPlayersInRound(player);
        if (GD.currentRound == 1 && !GC.gameStartDebounce) {
            GS.GameStartDeploymentUpdate();
        }

        UI.UpdateUIForWidgetType(pp => pp.playerRemainingPlayersWidget[0], PlayerProfile.playerInstances, H.MakeMessage(mod.stringkeys.remainingPlayers, PlayerProfile.deployedPlayers.length, GC.maxPlayers), true);
        UI.UpdateUIForWidgetType(pp => pp.playerRemainingPlayersWidget.slice(1), PlayerProfile.playerInstances, undefined, true);

        CheckWinCondition();
    }
}



// Assign dead players cameras if target player died
function ReAssignSpectateCameras(removedPlayerID: number) {
    for (const [spectator, target] of SpectateMap.entries()) {
        if (!mod.IsPlayerValid(target) || !mod.GetSoldierState(target, mod.SoldierStateBool.IsAlive) || mod.GetObjId(target) == removedPlayerID) {
            AssignSpectateCamera(spectator);
        }
    }
}

// Global map: spectator -> current spectated player
const SpectateMap = new Map<mod.Player, mod.Player>();

function SetSpectateTarget(spectator: mod.Player, target: mod.Player) {
    mod.SetCameraTargetForPlayer(spectator, target);
    SpectateMap.set(spectator, target);
}

async function AssignSpectateCamera(player: mod.Player) {
    const playersOnEachTeam = H.GetPlayersOnTeam();

    const playerTeam = mod.GetTeam(player);
    if (!playerTeam) return;

    const playerTeamId = mod.GetObjId(playerTeam);
    const playersOnTeam = playersOnEachTeam[playerTeamId] || [];

    // Alive teammates
    const alivePlayersOnTeam = playersOnTeam.filter(x =>
        mod.GetSoldierState(x, mod.SoldierStateBool.IsAlive)
    );

    if (alivePlayersOnTeam.length > 0) {
        SetSpectateTarget(player, alivePlayersOnTeam[0]);
    } else {
        // Try any alive player in the game
        const allPlayers = Object.values(playersOnEachTeam).flat();
        const alivePlayers = allPlayers.filter(x =>
            mod.GetSoldierState(x, mod.SoldierStateBool.IsAlive)
        );

        if (alivePlayers.length > 0) {
            SetSpectateTarget(player, alivePlayers[0]);
        } else {
            mod.SetCameraTypeForPlayer(player, mod.Cameras.FirstPerson);
            SpectateMap.delete(player);
        }
    }
}

export async function OnPlayerUndeploy(player: mod.Player) {
    if (mod.IsPlayerValid(player)) {
        PlayerProfile.RemovePlayerFromDeployedPlayers(player);
        PlayerProfile.RemovePlayerFromPlayersInRound(player);
        if (GD.currentRound == 1 && !GC.gameStartDebounce) {
            GS.GameStartDeploymentUpdate();
        }

        if (GD.roundActive) {
            UI.UpdateUIForWidgetType(pp => pp.playerRemainingPlayersWidget[0], PlayerProfile.playerInstances, H.MakeMessage(mod.stringkeys.remainingPlayers, PlayerProfile.playersInRound.length, GC.maxPlayers), true);
        } else {
            UI.UpdateUIForWidgetType(pp => pp.playerRemainingPlayersWidget[0], PlayerProfile.playerInstances, H.MakeMessage(mod.stringkeys.remainingPlayers, PlayerProfile.deployedPlayers.length, GC.maxPlayers), true);
        }
        UI.UpdateUIForWidgetType(pp => pp.playerRemainingPlayersWidget.slice(1), PlayerProfile.playerInstances, undefined, true);

        CheckWinCondition();
    }
}


export function OnPlayerLeaveGame(eventNumber: number) {
    console.log("Cleaning up disconnected players...");

    //ReAssignSpectateCameras(eventNumber)

    PlayerProfile.DeletePlayerWidgets(eventNumber)

    // Clean up deployedPlayers array
    PlayerProfile.deployedPlayers = PlayerProfile.deployedPlayers.filter(element => {
        try {
            return element && mod.IsPlayerValid(element);
        } catch {
            console.log("Removed invalid player from deployedPlayers: ", element ? mod.GetObjId(element) : "null");
            return false;
        }
    });

    // Clean up playerInstances array
    PlayerProfile.playerInstances = PlayerProfile.playerInstances.filter(element => {
        try {
            return element && mod.IsPlayerValid(element);
        } catch {
            console.log("Removed invalid player from playerInstances: ", element ? mod.GetObjId(element) : "null");
            return false;
        }
    });

    // Clean up playersInRound array
    PlayerProfile.playersInRound = PlayerProfile.playersInRound.filter(element => {
        try {
            return element && mod.IsPlayerValid(element);
        } catch {
            console.log("Removed invalid player from playersInRound: ", element ? mod.GetObjId(element) : "null");
            return false;
        }
    });

    RefreshTeamMemberCount();

    if (GD.roundActive) {
        UI.UpdateUIForWidgetType(pp => pp.playerRemainingPlayersWidget[0], PlayerProfile.playerInstances, H.MakeMessage(mod.stringkeys.remainingPlayers, PlayerProfile.playersInRound.length, GC.maxPlayers), true);
    } else {
        UI.UpdateUIForWidgetType(pp => pp.playerRemainingPlayersWidget[0], PlayerProfile.playerInstances, H.MakeMessage(mod.stringkeys.remainingPlayers, PlayerProfile.deployedPlayers.length, GC.maxPlayers), true);

        //Update every Players playerOnTeamUI
        PlayerProfile.playerInstances.forEach(element => {
            const playerPof = PlayerProfile.Get(element)
            playerPof?.playerOnTeamWidget && UI.UpdatePlayerOnTeamUI(playerPof?.playerOnTeamWidget, playerPof)
        });
    }
    UI.UpdateUIForWidgetType(pp => pp.playerRemainingPlayersWidget.slice(1), PlayerProfile.playerInstances, undefined, true);




    // Check win condition after player leaves (in case it was the last player on a team)
    CheckWinCondition();
}

export function OnPlayerEarnedKill(
    eventPlayer: mod.Player,
    eventOtherPlayer: mod.Player
) {
    if (eventPlayer && mod.IsPlayerValid(eventPlayer) && mod.GetObjId(eventPlayer) != mod.GetObjId(eventOtherPlayer)) {
        try {
            const playerProfile = PlayerProfile.Get(eventPlayer);
            if (playerProfile) {
                playerProfile.currency += GC.currencyGainOnKill;
                UI.UpdateUI(playerProfile.playerCurrencyWidget, H.MakeMessage(mod.stringkeys.currency, playerProfile.currency), true);
                UI.ShowCurrencyFeedback(playerProfile);
                //mod.SetGameModeScore(eventPlayer, playerProfile.currency);
            }
        } catch { }
    }
}

function SetPlayerLoadout(player: mod.Player) {
    /*     if(mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier)) return;
        
        const weapons = Object.values(mod.Weapons) as mod.Weapons[];
        const gadgets = Object.values(mod.Gadgets) as mod.Gadgets[];
        
        weapons.forEach(element => {
            if(mod.HasEquipment(player, element)){
                mod.RemoveEquipment(player, element);
            }
        });
    
        gadgets.forEach(element => {
            if(mod.HasEquipment(player, element)){
                mod.RemoveEquipment(player, element);
            }
        }); */
}

async function UseBuyMenu(player: mod.Player) {
    const playerProfile = PlayerProfile.Get(player);

    /* if (playerProfile?.buyPhaseUI?.isOpen && playerProfile?.buyPhaseUI?.hasFinishedCreating){
        playerProfile?.buyPhaseUI?.CloseAll();
        console.log("should be interacting and closing")
    } */
    if (!playerProfile?.buyPhaseUI?.isOpen) {
        playerProfile?.buyPhaseUI?.MoveSubHeader(true);
    }

    if (!playerProfile?.buyPhaseUI?.hasBeenCreated) {
        //await mod.Wait(1);
        await playerProfile?.buyPhaseUI?.createUI();
    }
    await mod.Wait(0.1);
    playerProfile?.buyPhaseUI?.OpenTab("weapons");
}

export async function OnPlayerUIButtonEvent(
    eventPlayer: mod.Player,
    eventUIWidget: mod.UIWidget,
    eventUIButtonEvent: mod.UIButtonEvent
) {
    //console.log(`UI Button Event: ${mod.GetUIWidgetName(eventUIWidget)}`);

    const playerProfile = PlayerProfile.Get(eventPlayer);
    if (playerProfile?.buyPhaseUI?.isOpen) {
        const buttonName = mod.GetUIWidgetName(eventUIWidget);
        playerProfile.buyPhaseUI.handleButtonEvent(buttonName, eventUIButtonEvent);
        return;
    }
}

// === src\HoH_BuyPhaseUI.ts ===





const bufferTime: number = 1;

const buttonWidth: number = 120;
const buttonHeight: number = 42;
const hoverBorderOffset: number = 2;

const tabButtonWidth: number = 150;
const tabButtonHeight: number = 25;

const containerWidth: number = 1300;
const containerHeight: number = 440;

const exitButtonWidth: number = 40;
const exitButtonHeight: number = 25;

const globalYOffset: number = -80;

type ClickFunction = () => void;
type FocusFunction = (focusIn: boolean) => void;

class UIButtonHolder {
    playerProfile: PlayerProfile;
    buttonId: string;
    buttonWidget: mod.UIWidget;
    buttonTextId: string;
    buttonTextWidget: mod.UIWidget;
    borderWidget?: mod.UIWidget;
    clickCallback: ClickFunction;
    focusCallback: FocusFunction;

    constructor(
        playerProfile: PlayerProfile,
        buttonId: string,
        textId: string,
        borderId?: string,
        clickFunction?: ClickFunction,
        focusFunction?: FocusFunction
    ) {
        this.playerProfile = playerProfile;
        this.buttonId = buttonId;
        this.buttonWidget = mod.FindUIWidgetWithName(buttonId);
        this.buttonTextId = textId;
        this.buttonTextWidget = mod.FindUIWidgetWithName(textId);

        if (borderId) {
            this.borderWidget = mod.FindUIWidgetWithName(borderId);
        }

        // Enable button events for focus
        if (focusFunction) {
            mod.EnableUIButtonEvent(this.buttonWidget, mod.UIButtonEvent.FocusIn, true);
            mod.EnableUIButtonEvent(this.buttonWidget, mod.UIButtonEvent.FocusOut, true);
        }

        this.clickCallback = clickFunction || this.defaultClick;
        this.focusCallback = focusFunction || this.defaultFocus;
    }

    defaultClick() {
        // Removed console.log
    }

    defaultFocus() {
        // Removed console.log
    }

    handleFocus(focusIn: boolean) {
        // Show/hide border on focus
        if (this.borderWidget) {
            mod.SetUIWidgetVisible(this.borderWidget, focusIn);
        }

        // Change button colors on hover
        if (focusIn) {
            mod.SetUIWidgetBgColor(this.buttonWidget, UI.battlefieldWhite);
            mod.SetUITextColor(this.buttonTextWidget, mod.CreateVector(1, 1, 1));
        } else {
            mod.SetUIWidgetBgColor(this.buttonWidget, mod.CreateVector(1, 1, 1));
            mod.SetUITextColor(this.buttonTextWidget, UI.battlefieldWhite);
        }

        this.focusCallback(focusIn);
    }

    handleClick() {
        this.clickCallback();
    }

    setEnabled(enabled: boolean) {
        mod.SetUIButtonEnabled(this.buttonWidget, enabled);
        mod.SetUIWidgetVisible(this.buttonWidget, enabled);
    }

    setText(text: string) {
        mod.SetUITextLabel(this.buttonTextWidget, H.MakeMessage(text));
    }
}

let uniqueAsyncOpId: number = 0;

class BuyPhaseUI {
    playerProfile: PlayerProfile;
    hasBeenCreated: boolean = false;
    hasFinishedCreating: boolean = false;
    prevTabOpen: string = "weapons";
    isOpen: boolean = false;
    isOpeningTabs: boolean = false;
    currentAsyncOps: number[] = [];

    rootWidget: mod.UIWidget | undefined = undefined
    weaponTabWidget: mod.UIWidget | undefined = undefined;
    gadgetsTabWidget: mod.UIWidget | undefined = undefined;
    consumableTabWidget: mod.UIWidget | undefined = undefined;
    exitButtonWidget: mod.UIWidget | undefined = undefined;
    buttons: UIButtonHolder[] = [];
    currencyWidget?: mod.UIWidget;
    tabButtonWidget: mod.UIWidget[] = [];
    boughtGadget: string[] = [];

    //Used for setting the color of the price cost for the items.
    itemCostTexts: mod.UIWidget[] = [];

    constructor(playerProfile: PlayerProfile) {
        this.playerProfile = playerProfile;
    }

    async ControlledWait(time: number): Promise<void> {
        this.currentAsyncOps.push(uniqueAsyncOpId);
        await mod.Wait(time);
        this.currentAsyncOps.splice(this.currentAsyncOps.indexOf(uniqueAsyncOpId), 1);
        uniqueAsyncOpId++;
    }

    async createUI() {
        const uniqueId = this.playerProfile.player ? mod.GetObjId(this.playerProfile.player) : 0;
        this.hasBeenCreated = true;

        //Category container
        const rootContaier = `buy_phase_root_container_${uniqueId}`;
        mod.AddUIContainer(rootContaier, mod.CreateVector(0, 0, 0), mod.CreateVector(0, 0, 0), mod.UIAnchor.Center, this.playerProfile.player);
        const roodContainerWidget = mod.FindUIWidgetWithName(rootContaier);
        mod.SetUIWidgetVisible(roodContainerWidget, false);

        this.rootWidget = roodContainerWidget

        // Main container
        const containerName = `buy_phase_container_${uniqueId}`;
        mod.AddUIContainer(containerName, mod.CreateVector(0, globalYOffset - 60, 0), mod.CreateVector(containerWidth, containerHeight, 0), mod.UIAnchor.Center, this.playerProfile.player);
        const containerWidget = mod.FindUIWidgetWithName(containerName);
        mod.SetUITextSize(containerWidget, 28);
        mod.SetUITextAnchor(containerWidget, mod.UIAnchor.Center);
        mod.SetUITextColor(containerWidget, UI.battlefieldWhite);
        mod.SetUIWidgetBgFill(containerWidget, mod.UIBgFill.Blur);
        mod.SetUIWidgetBgColor(containerWidget, UI.battlefieldBlueBg);
        mod.SetUIWidgetBgAlpha(containerWidget, 1);
        mod.SetUIWidgetDepth(containerWidget, mod.UIDepth.BelowGameUI);
        mod.SetUIWidgetVisible(containerWidget, true);
        mod.SetUIWidgetParent(containerWidget, roodContainerWidget)


        // Header
        const headerName = `buy_phase_header_${uniqueId}`;
        mod.AddUIText(headerName, mod.CreateVector(0, globalYOffset - 260, 0), mod.CreateVector(500, 40, 0), mod.UIAnchor.Center, H.MakeMessage(mod.stringkeys.buyPhaseHeader), this.playerProfile.player);
        const headerWidget = mod.FindUIWidgetWithName(headerName);
        mod.SetUITextSize(headerWidget, 28);
        mod.SetUITextAnchor(headerWidget, mod.UIAnchor.Center);
        mod.SetUITextColor(headerWidget, UI.battlefieldWhite);
        mod.SetUIWidgetBgFill(headerWidget, mod.UIBgFill.None);
        mod.SetUIWidgetBgAlpha(headerWidget, 0);
        mod.SetUIWidgetDepth(headerWidget, mod.UIDepth.BelowGameUI);
        mod.SetUIWidgetParent(headerWidget, roodContainerWidget)

        const frameLine1 = UIH.CreateLine({
            baseName: "FrameLine",
            xOffset: 0,
            yOffset: globalYOffset - 238,
            size: mod.CreateVector(400, 1, 0),
            alpha: 0.5,
            color: UI.battlefieldWhite,
            anchor: mod.UIAnchor.Center,
            depth: mod.UIDepth.BelowGameUI,
            visible: true
        }, this.playerProfile);

        mod.SetUIWidgetParent(frameLine1, roodContainerWidget)

        // Create weapon buttons
        await this.CreateItemButtons("weapons", ItemListings.weaponItems, globalYOffset - 155, uniqueId);

        // Create gadget buttons
        await this.CreateItemButtons("gadgets", ItemListings.gadgetItems, globalYOffset - 155, uniqueId);

        // Create consumable buttons
        await this.CreateItemButtons("consumables", ItemListings.consumableItems, globalYOffset - 155, uniqueId);

        // Exit button
        //this.CreateExitButton(uniqueId, mod.CreateVector(containerWidth - exitButtonWidth - 5, globalYOffset - 260/* (containerHeight/2) */ + 5, 0));
        this.CreateExitButton(uniqueId, mod.CreateVector((containerWidth / 2) - (exitButtonWidth / 2) - 5, globalYOffset - 50 - (containerHeight / 2) + 5, 0));

        this.CreateTabButton("weapons", mod.CreateVector(-tabButtonWidth - 30, globalYOffset - 210, 0), uniqueId);
        this.CreateTabButton("gadgets", mod.CreateVector(0, globalYOffset - 210, 0), uniqueId);
        this.CreateTabButton("consumables", mod.CreateVector(tabButtonWidth + 30, globalYOffset - 210, 0), uniqueId);


        this.hasFinishedCreating = true;
    }

    async CreateItemButtons(categoryKey: string, items: any[], yOffset: number, uniqueId: number) {
        let tempWidgetArray: mod.UIWidget[] = [];

        //Category container
        const categoryContainerName = `Tab_Container_${categoryKey}_label_${uniqueId}`;
        mod.AddUIContainer(categoryContainerName, mod.CreateVector(0, 0, 0), mod.CreateVector(0, 0, 0), mod.UIAnchor.Center, this.playerProfile.player);
        const categoryContainerWidget = mod.FindUIWidgetWithName(categoryContainerName);
        mod.SetUIWidgetVisible(categoryContainerWidget, false);
        tempWidgetArray.push(categoryContainerWidget);

        // Category label
        const categoryLabelName = `buy_${categoryKey}_label_${uniqueId}`;
        mod.AddUIText(categoryLabelName, mod.CreateVector(-530, yOffset - 60, 0), mod.CreateVector(150, 30, 0), mod.UIAnchor.Center, H.MakeMessage((mod.stringkeys as any)[categoryKey]), this.playerProfile.player);
        const categoryWidget = mod.FindUIWidgetWithName(categoryLabelName);
        mod.SetUITextSize(categoryWidget, 24);
        mod.SetUITextAnchor(categoryWidget, mod.UIAnchor.CenterLeft);
        mod.SetUITextColor(categoryWidget, UI.battlefieldWhite);
        mod.SetUIWidgetBgFill(categoryWidget, mod.UIBgFill.GradientLeft);
        mod.SetUIWidgetBgColor(categoryWidget, UI.battlefieldWhite);
        mod.SetUIWidgetBgAlpha(categoryWidget, UI.gradientAlpha);
        mod.SetUIWidgetDepth(categoryWidget, mod.UIDepth.BelowGameUI);
        mod.SetUIWidgetVisible(categoryWidget, true);
        mod.SetUIWidgetParent(categoryWidget, categoryContainerWidget)
        tempWidgetArray.push(categoryWidget);

        const frameLine1 = UIH.CreateLine({
            baseName: "FrameLine",
            xOffset: -605,
            yOffset: yOffset - 60,
            size: mod.CreateVector(1, 30, 0),
            alpha: 0.5,
            color: UI.battlefieldWhite,
            anchor: mod.UIAnchor.Center,
            depth: mod.UIDepth.BelowGameUI,
            visible: true
        }, this.playerProfile);
        tempWidgetArray.push(frameLine1);
        mod.SetUIWidgetParent(frameLine1, categoryContainerWidget)

        // Create buttons for each item
        for (let index = 0; index < items.length; index++) {
            const item = items[index];

            const buttonAmountPerRow = Math.floor((containerWidth + 20) / (buttonWidth + 20));
            const xPos = (-containerWidth / 2) + (buttonWidth / 2) + 30 + ((index % buttonAmountPerRow) * (buttonWidth + 20));
            const buttonYOffset = yOffset + (55 * Math.floor(index / buttonAmountPerRow));

            /* if((index % buttonAmountPerRow) == 0){
                console.log("index % buttonAmountPerRow: " + (index % buttonAmountPerRow));
                await this.ControlledWait(bufferTime);
            } */

            const buttonName = `buy_${item.type}_${index}_${uniqueId}`;
            const textName = `buy_${item.type}_text_${index}_${uniqueId}`;
            const borderName = `buy_${item.type}_border_${index}_${uniqueId}`;

            // Border (initially hidden)
            mod.AddUIContainer(borderName, mod.CreateVector(xPos, buttonYOffset, 0), mod.CreateVector(buttonWidth + hoverBorderOffset, buttonHeight + hoverBorderOffset, 0), mod.UIAnchor.Center, this.playerProfile.player);
            const borderWidget = mod.FindUIWidgetWithName(borderName);
            mod.SetUIWidgetBgFill(borderWidget, mod.UIBgFill.OutlineThin);
            mod.SetUIWidgetBgColor(borderWidget, UI.battlefieldWhite);
            mod.SetUIWidgetBgAlpha(borderWidget, 1.0);
            mod.SetUIWidgetDepth(borderWidget, mod.UIDepth.BelowGameUI);
            mod.SetUIWidgetVisible(borderWidget, false);
            mod.SetUIWidgetParent(borderWidget, categoryContainerWidget)
            tempWidgetArray.push(borderWidget);

            // Button
            mod.AddUIButton(buttonName, mod.CreateVector(xPos, buttonYOffset - 2, 0), mod.CreateVector(buttonWidth, buttonHeight, 0), mod.UIAnchor.Center, this.playerProfile.player);
            const buttonWidget = mod.FindUIWidgetWithName(buttonName);
            mod.SetUIWidgetBgFill(buttonWidget, mod.UIBgFill.Blur);
            mod.SetUIWidgetBgColor(buttonWidget, mod.CreateVector(1, 1, 1));
            mod.SetUIWidgetBgAlpha(buttonWidget, 1.0);
            mod.SetUIWidgetVisible(buttonWidget, true);
            mod.SetUIWidgetDepth(buttonWidget, mod.UIDepth.BelowGameUI);
            mod.SetUIWidgetParent(buttonWidget, categoryContainerWidget)
            tempWidgetArray.push(buttonWidget);

            //console.log("item name: " + item.nameKey)
            // Button text
            mod.AddUIText(textName, mod.CreateVector(xPos, buttonYOffset - 5, 0), mod.CreateVector(buttonWidth + 10, buttonHeight, 0), mod.UIAnchor.Center, H.MakeMessage((mod.stringkeys as any)[item.nameKey]), this.playerProfile.player);
            const textWidget = mod.FindUIWidgetWithName(textName);
            mod.SetUITextSize(textWidget, 14);
            mod.SetUITextAnchor(textWidget, mod.UIAnchor.TopCenter);
            mod.SetUIWidgetPadding(textWidget, 8);
            mod.SetUITextColor(textWidget, UI.battlefieldWhite);
            mod.SetUIWidgetVisible(textWidget, true);
            mod.SetUIWidgetBgAlpha(textWidget, 0);
            mod.SetUIWidgetDepth(textWidget, mod.UIDepth.BelowGameUI);
            mod.SetUIWidgetParent(textWidget, categoryContainerWidget)
            tempWidgetArray.push(textWidget);

            // Price text
            const priceTextName = `buy_${item.type}_price_${index}_${uniqueId}`;
            mod.AddUIText(priceTextName, mod.CreateVector(xPos, buttonYOffset + 10, 0), mod.CreateVector(buttonWidth * 0.95, 20, 0), mod.UIAnchor.Center, H.MakeMessage((mod.stringkeys as any).price, item.price), this.playerProfile.player);
            const priceWidget = mod.FindUIWidgetWithName(priceTextName);
            mod.SetUITextSize(priceWidget, 15);
            mod.SetUITextAnchor(priceWidget, mod.UIAnchor.Center);
            mod.SetUIWidgetVisible(priceWidget, true);
            mod.SetUITextColor(priceWidget, UI.currencyYellow);
            mod.SetUIWidgetDepth(priceWidget, mod.UIDepth.BelowGameUI);
            mod.SetUIWidgetParent(priceWidget, categoryContainerWidget)
            tempWidgetArray.push(priceWidget);
            this.itemCostTexts.push(priceWidget)

            // Create button holder
            const buttonHolder = new UIButtonHolder(
                this.playerProfile,
                buttonName,
                textName,
                borderName,
                () => this.purchaseItem(item),
                (focusIn) => this.onButtonFocus(item, focusIn)
            );

            this.buttons.push(buttonHolder);

        }


        for (let index = 1; index < tempWidgetArray.length; index++) {
            const element = tempWidgetArray[index];
            mod.SetUIWidgetParent(element, categoryContainerWidget)
        }

        switch (categoryKey) {
            case "weapons":
                this.weaponTabWidget = categoryContainerWidget
                break;
            case "gadgets":
                this.gadgetsTabWidget = categoryContainerWidget
                break;
            case "consumables":
                this.consumableTabWidget = categoryContainerWidget
                break;
            default:
                break;
        }
    }

    CreateExitButton(uniqueId: number, position: mod.Vector = mod.CreateVector(0, 240, 0)) {
        const exitButtonName = `buy_exit_button_${uniqueId}`;
        const exitTextName = `buy_exit_text_${uniqueId}`;
        const exitBorderName = `buy_exit_border_${uniqueId}`;
        const exitContainerName = `buy_exit_Container_${uniqueId}`;

        // Exit Button Container
        mod.AddUIContainer(exitContainerName, mod.CreateVector(0, 0, 0), mod.CreateVector(0, 0, 0), mod.UIAnchor.Center, this.playerProfile.player);
        const exitContainerWidget = mod.FindUIWidgetWithName(exitContainerName);
        mod.SetUIWidgetVisible(exitContainerWidget, false);
        this.exitButtonWidget = exitContainerWidget

        // Border
        mod.AddUIContainer(exitBorderName, position, mod.CreateVector(exitButtonWidth + hoverBorderOffset, exitButtonHeight + hoverBorderOffset, 0), mod.UIAnchor.Center, this.playerProfile.player);
        const borderWidget = mod.FindUIWidgetWithName(exitBorderName);
        mod.SetUIWidgetBgFill(borderWidget, mod.UIBgFill.OutlineThin);
        mod.SetUIWidgetBgColor(borderWidget, UI.battlefieldWhite);
        mod.SetUIWidgetBgAlpha(borderWidget, 1.0);
        mod.SetUIWidgetDepth(borderWidget, mod.UIDepth.BelowGameUI);
        mod.SetUIWidgetVisible(borderWidget, false);
        mod.SetUIWidgetParent(borderWidget, exitContainerWidget)

        // Button
        mod.AddUIButton(exitButtonName, position, mod.CreateVector(exitButtonWidth, exitButtonHeight, 0), mod.UIAnchor.Center, this.playerProfile.player);
        const buttonWidget = mod.FindUIWidgetWithName(exitButtonName);
        mod.SetUIWidgetBgFill(buttonWidget, mod.UIBgFill.Blur);
        mod.SetUIWidgetBgColor(buttonWidget, mod.CreateVector(1, 1, 1));
        mod.SetUIWidgetBgAlpha(buttonWidget, 1.0);
        mod.SetUIWidgetDepth(buttonWidget, mod.UIDepth.BelowGameUI);
        mod.SetUIWidgetParent(buttonWidget, exitContainerWidget)


        // Text
        mod.AddUIText(exitTextName, position, mod.CreateVector(exitButtonWidth, exitButtonHeight, 0), mod.UIAnchor.Center, H.MakeMessage((mod.stringkeys as any).exit), this.playerProfile.player);
        const textWidget = mod.FindUIWidgetWithName(exitTextName);
        mod.SetUITextSize(textWidget, 20);
        mod.SetUITextAnchor(textWidget, mod.UIAnchor.Center);
        mod.SetUITextColor(textWidget, UI.battlefieldWhite);
        mod.SetUIWidgetBgAlpha(textWidget, 0);
        mod.SetUIWidgetDepth(textWidget, mod.UIDepth.BelowGameUI);
        mod.SetUIWidgetParent(textWidget, exitContainerWidget)


        const exitButton = new UIButtonHolder(
            this.playerProfile,
            exitButtonName,
            exitTextName,
            exitBorderName,
            () => this.CloseAll(),
            (focusIn) => { }
        );

        this.buttons.push(exitButton);
    }

    CreateTabButton(tabName: string, pos: mod.Vector = mod.CreateVector(0, 270, 0), uniqueId: number) {
        const tabButtonName = `buy_${tabName}_button_${uniqueId}`;
        const tabTextName = `buy_${tabName}_text_${uniqueId}`;
        const tabBorderName = `buy_${tabName}_border_${uniqueId}`;
        const tabcontainerName = `buy_${tabName}_container_${uniqueId}`;

        // Exit Button Container
        mod.AddUIContainer(tabcontainerName, mod.CreateVector(0, 0, 0), mod.CreateVector(0, 0, 0), mod.UIAnchor.Center, this.playerProfile.player);
        const tabContainerWidget = mod.FindUIWidgetWithName(tabcontainerName);
        mod.SetUIWidgetVisible(tabContainerWidget, false);
        this.tabButtonWidget.push(tabContainerWidget)

        // Border
        mod.AddUIContainer(tabBorderName, pos, mod.CreateVector(tabButtonWidth + hoverBorderOffset, tabButtonHeight + hoverBorderOffset, 0), mod.UIAnchor.Center, this.playerProfile.player);
        const borderWidget = mod.FindUIWidgetWithName(tabBorderName);
        mod.SetUIWidgetBgFill(borderWidget, mod.UIBgFill.OutlineThin);
        mod.SetUIWidgetBgColor(borderWidget, UI.battlefieldWhite);
        mod.SetUIWidgetBgAlpha(borderWidget, 1.0);
        mod.SetUIWidgetDepth(borderWidget, mod.UIDepth.BelowGameUI);
        mod.SetUIWidgetVisible(borderWidget, false);
        mod.SetUIWidgetParent(borderWidget, tabContainerWidget)
        // Button
        mod.AddUIButton(tabButtonName, pos, mod.CreateVector(tabButtonWidth, tabButtonHeight, 0), mod.UIAnchor.Center, this.playerProfile.player);
        const buttonWidget = mod.FindUIWidgetWithName(tabButtonName);
        mod.SetUIWidgetBgFill(buttonWidget, mod.UIBgFill.Blur);
        mod.SetUIWidgetBgColor(buttonWidget, mod.CreateVector(1, 1, 1));
        mod.SetUIWidgetBgAlpha(buttonWidget, 1.0);
        mod.SetUIWidgetDepth(buttonWidget, mod.UIDepth.BelowGameUI);
        mod.SetUIWidgetParent(buttonWidget, tabContainerWidget)

        let stringKey = (mod.stringkeys as any).exit;

        switch (tabName) {
            case "weapons":
                stringKey = (mod.stringkeys as any).weapons;
                break;
            case "gadgets":
                stringKey = (mod.stringkeys as any).gadgets;
                break;
            case "consumables":
                stringKey = (mod.stringkeys as any).consumables;
                break;
            default:
                break;
        }

        // Text
        mod.AddUIText(tabTextName, pos, mod.CreateVector(tabButtonWidth, tabButtonHeight, 0), mod.UIAnchor.Center, H.MakeMessage(stringKey), this.playerProfile.player);
        const textWidget = mod.FindUIWidgetWithName(tabTextName);
        mod.SetUITextSize(textWidget, 20);
        mod.SetUITextAnchor(textWidget, mod.UIAnchor.Center);
        mod.SetUITextColor(textWidget, UI.battlefieldWhite);
        mod.SetUIWidgetBgAlpha(textWidget, 0);
        mod.SetUIWidgetDepth(textWidget, mod.UIDepth.BelowGameUI);
        mod.SetUIWidgetParent(textWidget, tabContainerWidget)

        const tabButton = new UIButtonHolder(
            this.playerProfile,
            tabButtonName,
            tabTextName,
            tabBorderName,
            () => this.OpenTab(tabName),
            (focusIn) => { }
        );

        this.buttons.push(tabButton);
    }

    purchaseItem(item: any) {
        if (this.canBuyItem(item)) {
            // Deduct currency
            this.playerProfile.currency -= item.price;

            const amountOwned = this.playerProfile.boughtItems.get(item.nameKey) ?? 0
            this.playerProfile.boughtItems.set(item.nameKey, amountOwned + 1)

            this.updateCurrencyDisplay();
            //mod.DisplayNotificationMessage(H.MakeMessage((mod.stringkeys as any)[item.nameKey], mod.stringkeys.itemPurchased), this.playerProfile.player);

            console.log(`Player ${this.playerProfile.player} purchased item ${item.item} for ${item.price}. Remaining currency: ${this.playerProfile.currency}`);
            // Give item to player
            this.giveItemToPlayer(item);
        }
    }

    canBuyItem(item: any) {
        // Check if player has enough cash
        if (this.playerProfile.currency < item.price) {
            return false
        }

        // Get how many times this item has been bought
        const amountOwned = this.playerProfile.boughtItems.get(item.nameKey) ?? 0

        // If no amount is defined, default to 1
        const allowedAmount = item.amount ?? 1

        // Allow purchase only if below max
        return amountOwned < allowedAmount
    }

    giveItemToPlayer(item: any) {
        console.log(`Attempting to give item ${item.item} to player ${this.playerProfile.player}`);
        if (!mod.IsPlayerValid(this.playerProfile.player) && !PlayerProfile.deployedPlayers.includes(this.playerProfile.player)) {
            return;
        }

        if (item.type == "weapon") {

            if (mod.IsInventorySlotActive(this.playerProfile.player, mod.InventorySlots.PrimaryWeapon)) {
                mod.AddEquipment(this.playerProfile.player, item.item, mod.InventorySlots.PrimaryWeapon)
            } else {
                mod.AddEquipment(this.playerProfile.player, item.item, mod.InventorySlots.SecondaryWeapon)
            }


        } else if (item.type == "gadget") {

            mod.AddEquipment(this.playerProfile.player, item.item)


            //  if (this.boughtGadget.includes("gadget")) {
            //      mod.AddEquipment(this.playerProfile.player, item.item, mod.InventorySlots.GadgetTwo)

            //  } else {
            //      this.boughtGadget.push("gadget")
            //      mod.AddEquipment(this.playerProfile.player, item.item, mod.InventorySlots.GadgetOne)
            //  }

        } else if (item.type == "consumable") {
            mod.AddEquipment(this.playerProfile.player, item.item)
        } else {
            mod.AddEquipment(this.playerProfile.player, item.item)
        }

        console.log(`Gave item ${item.item} to player ${this.playerProfile.player}`);
    }

    updateCurrencyDisplay() {
        if (this.currencyWidget) {
            mod.SetUITextLabel(
                this.currencyWidget,
                H.MakeMessage((mod.stringkeys as any).currency, this.playerProfile.currency)
            );
        }

        UI.UpdateUI(this.playerProfile.playerCurrencyWidget, H.MakeMessage(mod.stringkeys.currency, this.playerProfile.currency), true);

        const combined = [...ItemListings.weaponItems, ...ItemListings.gadgetItems, ...ItemListings.consumableItems];

        combined.forEach((element, index) => {

            // Get how many times this item has been bought
            const amountOwned = this.playerProfile.boughtItems.get(element.nameKey) ?? 0
            // If no amount is defined, default to 1
            const allowedAmount = element.amount ?? 1

            const canBuyMore = amountOwned < allowedAmount && this.playerProfile.currency >= element.price

            if (canBuyMore) {
                mod.SetUITextColor(this.itemCostTexts[index], UI.currencyYellow)
            } else {
                mod.SetUITextColor(this.itemCostTexts[index], UI.enemyOrange)
            }

            if (amountOwned >= 1) {
                mod.SetUITextLabel(this.itemCostTexts[index], H.MakeMessage(mod.stringkeys.boughtamount, element.price, amountOwned))
            } else {
                mod.SetUITextLabel(this.itemCostTexts[index], H.MakeMessage(mod.stringkeys.price, element.price))
            }
        });
    }

    onButtonFocus(item: any, focusIn: boolean) {
        if (focusIn) {
            const canAfford = this.playerProfile.currency >= item.price;
            // Could show item details, preview, etc.
        }
    }

    async MoveSubHeader(away: boolean) {
        const offset: number = away ? -120 : 120;
        let originalPos: mod.Vector[] = [];
        for (let index = 0; index < this.playerProfile?.playerSubHeaderWidget.length; index++) {
            const element = this.playerProfile?.playerSubHeaderWidget[index];
            const pos = mod.GetUIWidgetPosition(element)
            originalPos.push(pos);
            mod.SetUIWidgetPosition(this.playerProfile?.playerSubHeaderWidget[index], mod.CreateVector(mod.XComponentOf(pos), mod.YComponentOf(pos) + offset, 0));
        }
    }

    async OpenTab(tabName: string) {
        /* if(!this.isOpen){
            this.MoveSubHeader(true);
        } */
        this.isOpen = true;
        this.isOpeningTabs = true;
        this.updateCurrencyDisplay(); // Update currency when opening

        this.rootWidget && mod.SetUIWidgetVisible(this.rootWidget, true)
        this.exitButtonWidget && mod.SetUIWidgetVisible(this.exitButtonWidget, true)

        this.tabButtonWidget.forEach(widget => {
            mod.SetUIWidgetVisible(widget, true)
        });


        switch (this.prevTabOpen) {
            case "weapons":
                this.weaponTabWidget && mod.SetUIWidgetVisible(this.weaponTabWidget, false);

                //  this.weaponWidgets.forEach(widget => {
                //      mod.SetUIWidgetVisible(widget, false);
                //  });
                break;
            case "gadgets":
                this.gadgetsTabWidget && mod.SetUIWidgetVisible(this.gadgetsTabWidget, false);
                // this.gadgetWidgets.forEach(widget => {
                //     mod.SetUIWidgetVisible(widget, false);
                // });
                break;
            case "consumables":
                this.consumableTabWidget && mod.SetUIWidgetVisible(this.consumableTabWidget, false);
                // this.consumableWidgets.forEach(widget => {
                //     mod.SetUIWidgetVisible(widget, false);
                // });
                break;
        }

        this.prevTabOpen = tabName

        switch (tabName) {
            case "weapons":

                this.weaponTabWidget && mod.SetUIWidgetVisible(this.weaponTabWidget, true);

                //  this.weaponWidgets.forEach(widget => {
                //      mod.SetUIWidgetVisible(widget, true);
                //  });
                break;
            case "gadgets":
                this.gadgetsTabWidget && mod.SetUIWidgetVisible(this.gadgetsTabWidget, true);


                // this.gadgetWidgets.forEach(widget => {
                //     mod.SetUIWidgetVisible(widget, true);
                // });
                break;
            case "consumables":

                this.consumableTabWidget && mod.SetUIWidgetVisible(this.consumableTabWidget, true);
                // this.consumableWidgets.forEach(widget => {
                //     mod.SetUIWidgetVisible(widget, true);
                // });
                break;
            default:
                break;
        }

        // Make sure all borders are hidden when opening
        this.buttons.forEach(button => {
            if (button.borderWidget) {
                mod.SetUIWidgetVisible(button.borderWidget, false);
            }
        });


        this.isOpeningTabs = false;

        /* this.rootWidgets.forEach(widget => {
            mod.SetUIWidgetDepth(widget, mod.UIDepth.AboveGameUI);
        }); */

        if (this.isOpen) mod.EnableUIInputMode(true, this.playerProfile.player);

        /* this.rootWidgets.forEach(widget => {
            mod.SetUIWidgetVisible(widget, true);
        }); */
    }


    async CloseAll() {


        if (this.isOpen) {
            this.isOpen = false;
            mod.EnableUIInputMode(false, this.playerProfile.player);

            this.rootWidget && mod.SetUIWidgetVisible(this.rootWidget, false)
            this.exitButtonWidget && mod.SetUIWidgetVisible(this.exitButtonWidget, false)

            this.tabButtonWidget.forEach(widget => {
                mod.SetUIWidgetVisible(widget, false)
            });

            this.weaponTabWidget && mod.SetUIWidgetVisible(this.weaponTabWidget, false);
            this.gadgetsTabWidget && mod.SetUIWidgetVisible(this.gadgetsTabWidget, false);
            this.consumableTabWidget && mod.SetUIWidgetVisible(this.consumableTabWidget, false);


            mod.EnableUIInputMode(false, this.playerProfile.player);
            this.MoveSubHeader(false);
        }
    }

    async CloseAllWhenPossible() {
        while (true) {
            if (this.currentAsyncOps.length == 0) {
                break;
            }
            mod.Wait(0.1);
        }
    }

    handleButtonEvent(buttonName: string, eventType: mod.UIButtonEvent) {
        const button = this.buttons.find(b => b.buttonId === buttonName);
        if (!button) {
            return;
        }

        if (mod.Equals(eventType, mod.UIButtonEvent.FocusIn)) {
            button.handleFocus(true);
        } else if (mod.Equals(eventType, mod.UIButtonEvent.FocusOut)) {
            button.handleFocus(false);
        } else if (mod.Equals(eventType, mod.UIButtonEvent.ButtonDown)) {
            button.handleClick();
        }
    }

    Delete() {

        this.rootWidget && mod.DeleteUIWidget(this.rootWidget)
        this.weaponTabWidget && mod.DeleteUIWidget(this.weaponTabWidget)
        this.gadgetsTabWidget && mod.DeleteUIWidget(this.gadgetsTabWidget)
        this.consumableTabWidget && mod.DeleteUIWidget(this.consumableTabWidget)
        this.exitButtonWidget && mod.DeleteUIWidget(this.exitButtonWidget)

        this.currencyWidget && mod.DeleteUIWidget(this.currencyWidget)

        for (let index = 0; index < this.tabButtonWidget.length; index++) {
            const element = this.tabButtonWidget[index];
            mod.DeleteUIWidget(element)
        }

        this.buttons = [];
    }
}


// === src\HoH_GameConfig.ts ===
class GC {
    static testingWithAI = false;
    static gameStartDebounce = false;
    static baseGameStartCountdown = 60;
    static gameStartCountdown = 60;
    static requiredPlayersToStart = 2;
    static startTeleportHeight = 200;

    static useCustomRingOfFire = false;
    static thirdPersonMode = false

    static allowManualDeploy = false;
    
    // Randomization radius around each spawn point
    static spawnRandomizationRadius: number = 4;
    
    // Height offset for initial teleport (parachute drop)
    static spawnHeightOffset: number = 80;

    // Available spawn points that teams can be assigned to
    static availableSpawnPoints: mod.Vector[] = [
        mod.CreateVector(-1074.996, 177.897, 388.992),   // Spawn point 1
        mod.CreateVector(-1056.282, 176.341, 202.244),   // Spawn point 2
        mod.CreateVector(-962.95, 176.488, 382.668),  // Spawn point 3
        mod.CreateVector(-926.858, 171.039, 234.177)   // Spawn point 4
    ];
    
    // This will store the randomized assignment of teams to spawn points
    // teamSpawnAssignments[teamNumber] = spawn point index
    static teamSpawnAssignments: number[] = [0, 0, 0, 0, 0]; // Team 0 unused

    static teamAmount = 4;
    static teamMemberCount: number[] = [0, 0, 0, 0];
    static teamColors: mod.Vector[] = [mod.CreateVector(1, 0.1, 0), mod.CreateVector(0, 1, 1), mod.CreateVector(0.5, 0, 1), mod.CreateVector(0, 0.8, 0), mod.CreateVector(0, 0, 0)];
    static maxRounds: number = 1; //Switched to one round since we cannot shut down RingOfFire
    static maxPlayers: number = 16;
    static currencyGainOnKill: number = 100;
    static currencyGainOnWin: number = 200;
    static startingCurrency: number = 500
}

// === src\HoH_GameData.ts ===

class GD {
    static currentRound: number = 0;
    static roundActive: boolean = false;
    static isInPreRound: boolean = false;
    static teamDataArray: TeamData[] = [];
}

class TeamData {
    score: number = 0;
    members: mod.Player[] = [];
    team: mod.Team;

    constructor(team: mod.Team) {
        this.team = team;
    }

    static Initialize(teams: mod.Team[]) {
        teams.forEach(team => {
            const teamData = new TeamData(team);
            GD.teamDataArray.push(teamData);
        });
    }

    AddTeamMember(member: mod.Player) {
        this.members.push(member);
    }

    static RefreshAllTeamMembers() {
        GD.teamDataArray.forEach(teamData => {
            teamData.members = teamData.members.filter(member => PlayerProfile.playerInstances.includes(member));
        });
    }
}

// === src\HoH_GameState.ts ===









class GS {
    static whileLoopStarted: boolean = false;

    // Helper function to randomize which team gets which spawn point
    static RandomizeTeamSpawnAssignments(): void {
        // Create array of available spawn point indices [0, 1, 2, 3]
        const availableIndices = Array.from({ length: GC.availableSpawnPoints.length }, (_, i) => i);

        // Shuffle the indices using Fisher-Yates shuffle
        for (let i = availableIndices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [availableIndices[i], availableIndices[j]] = [availableIndices[j], availableIndices[i]];
        }

        // Assign shuffled indices to teams 1-4
        for (let teamNumber = 1; teamNumber <= 4; teamNumber++) {
            GC.teamSpawnAssignments[teamNumber] = availableIndices[teamNumber - 1];
        }

        console.log("Team spawn assignments randomized:");
        for (let teamNumber = 1; teamNumber <= 4; teamNumber++) {
            const spawnIndex = GC.teamSpawnAssignments[teamNumber];
            const spawnPoint = GC.availableSpawnPoints[spawnIndex];
            console.log("Team " + teamNumber + " -> Spawn Point " + spawnIndex + " at (" +
                mod.XComponentOf(spawnPoint) + ", " + mod.YComponentOf(spawnPoint) + ", " +
                mod.ZComponentOf(spawnPoint) + ")");
        }
    }

    // Helper function to get the assigned spawn position for a team with random offset
    static GetTeamSpawnPosition(teamNumber: number): mod.Vector {
        if (teamNumber < 1 || teamNumber > 4) {
            console.log("Invalid team number: " + teamNumber + ", defaulting to team 1");
            teamNumber = 1;
        }

        const spawnPointIndex = GC.teamSpawnAssignments[teamNumber];
        const baseSpawnPoint = GC.availableSpawnPoints[spawnPointIndex];

        // Generate random offset within the radius
        const angle = Math.random() * 2 * Math.PI; // Random angle in radians
        const distance = Math.random() * GC.spawnRandomizationRadius; // Random distance within radius

        const xOffset = Math.cos(angle) * distance;
        const zOffset = Math.sin(angle) * distance;

        const spawnPosition = mod.CreateVector(
            mod.XComponentOf(baseSpawnPoint) + xOffset,
            mod.YComponentOf(baseSpawnPoint) + GC.spawnHeightOffset, // Add height for parachute drop
            mod.ZComponentOf(baseSpawnPoint) + zOffset
        );

        return spawnPosition;
    }

    static async GameStartDeploymentUpdate() {
        if (GC.gameStartDebounce || this.whileLoopStarted) return;
        PlayerProfile.playerInstances.forEach(element => {
            const playerProfile = PlayerProfile.Get(element);
            //UI.UpdateUI(playerProfile?.playerHeaderWidget, H.MakeMessage(mod.stringkeys.waitingForPlayers), true);
            UI.UpdateUI(playerProfile?.playerSubHeaderWidget[0], H.MakeMessage(mod.stringkeys.playersToWaitFor, PlayerProfile.deployedPlayers.length, GC.requiredPlayersToStart), true);
        });
        if (PlayerProfile.deployedPlayers.length >= GC.requiredPlayersToStart && !this.whileLoopStarted) {
            await this.RunCountdownLoop();
        } else {
            GC.gameStartCountdown = GC.baseGameStartCountdown; // reset the countdown if not enough players are deployed
            PlayerProfile.playerInstances.forEach(element => {
                const playerProfile = PlayerProfile.Get(element);
                //UI.UpdateUI(playerProfile?.playerHeaderWidget, H.MakeMessage(mod.stringkeys.waitingForPlayers), true);
                UI.UpdateUI(playerProfile?.playerSubHeaderWidget[0], H.MakeMessage(mod.stringkeys.playersToWaitFor, PlayerProfile.deployedPlayers.length, GC.requiredPlayersToStart), true);
            });
        }
    }

    static async RunCountdownLoop() {
        this.whileLoopStarted = true;
        //UI.TriggerSubHeaderLineCountdownProcess(GC.gameStartCountdown/*  - (0.5 * GC.gameStartCountdown) */);
        while (true) {
            PlayerProfile.playerInstances.forEach(element => {
                const playerProfile = PlayerProfile.Get(element);
                const formattedTime = H.FormatTime(GC.gameStartCountdown);
                //UI.UpdateUI(playerProfile?.playerHeaderWidget, H.MakeMessage(mod.stringkeys.gameStartingIn), true);
                UI.UpdateUI(playerProfile?.playerSubHeaderWidget[0], H.MakeMessage(mod.stringkeys.timerCounterThing, formattedTime[0], formattedTime[1], formattedTime[2]), true);
                if (GC.gameStartCountdown <= 0 && mod.GetSoldierState(element, mod.SoldierStateBool.IsAlive)) {
                    mod.EnableAllInputRestrictions(element, false);
                }
            });

            if (GD.currentRound == 1 && PlayerProfile.deployedPlayers.length < GC.requiredPlayersToStart) {
                GC.gameStartCountdown = GC.baseGameStartCountdown; // reset the countdown if not enough players are deployed
                PlayerProfile.playerInstances.forEach(element => {
                    const playerProfile = PlayerProfile.Get(element);
                    //UI.UpdateUI(playerProfile?.playerHeaderWidget, H.MakeMessage(mod.stringkeys.waitingForPlayers), true);
                    UI.UpdateUI(playerProfile?.playerSubHeaderWidget[0], H.MakeMessage(mod.stringkeys.playersToWaitFor, PlayerProfile.deployedPlayers.length, GC.requiredPlayersToStart), true);
                });
                this.whileLoopStarted = false;
                break;
            }

            if (GC.gameStartCountdown <= 0 && !GC.gameStartDebounce) {
                GC.gameStartDebounce = true;
                PlayerProfile.playerInstances.forEach(element => {
                    const playerProfile = PlayerProfile.Get(element);
                    //UI.UpdateUI(playerProfile?.playerHeaderWidget, H.MakeMessage(mod.stringkeys.ringFireActive), true);
                    if (GD.currentRound == 1) {
                        UI.UpdateUI(playerProfile?.playerSubHeaderWidget[0], H.MakeMessage(mod.stringkeys.experienceName), true);
                    } else {
                        UI.UpdateUI(playerProfile?.playerSubHeaderWidget[0], H.MakeMessage(mod.stringkeys.roundBeingStarted), true);
                    }
                });
                this.StartRound();
                console.log("Game started, countdown ended");
                break;
            }

            await mod.Wait(1);
            GC.gameStartCountdown -= 1;
        }
    }

    static async StartPreRound() {
        await mod.Wait(1);

        GD.isInPreRound = true;
        mod.EnableAllPlayerDeploy(true);

        EnableInteractPoints(true);

        EnableBuyWorldIcons(true);

        // MAKE PLAYERS INVINCIBLE DURING PREROUND
        PlayerProfile.deployedPlayers.forEach(player => {
            // Set extremely high health to make players effectively invincible
            if (!mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier)) mod.SetPlayerMaxHealth(player, 900.0);
        });

        if (GC.testingWithAI) {
            mod.SpawnAIFromAISpawner(mod.GetSpawner(30),mod.SoldierClass.Support);
            await mod.Wait(0.1);
            mod.SpawnAIFromAISpawner(mod.GetSpawner(31),mod.SoldierClass.Support);
            await mod.Wait(0.1);
            mod.SpawnAIFromAISpawner(mod.GetSpawner(32),mod.SoldierClass.Support);
            await mod.Wait(0.1);
            mod.SpawnAIFromAISpawner(mod.GetSpawner(33),mod.SoldierClass.Support);
            await mod.Wait(0.1);
            mod.SpawnAIFromAISpawner(mod.GetSpawner(34),mod.SoldierClass.Support);
            await mod.Wait(0.1);
            mod.SpawnAIFromAISpawner(mod.GetSpawner(35),mod.SoldierClass.Support);
            await mod.Wait(0.1);
            mod.SpawnAIFromAISpawner(mod.GetSpawner(36),mod.SoldierClass.Support);
            await mod.Wait(0.1);
            mod.SpawnAIFromAISpawner(mod.GetSpawner(37),mod.SoldierClass.Support);
            console.log("AI spawned from spawner 0");
        }

        GD.currentRound += 1;
        console.log("Starting round: ", GD.currentRound);

        // Randomize team spawn assignments at the start of each round
        this.RandomizeTeamSpawnAssignments();

        UI.UpdateUIForWidgetType(pp => pp.playerRoundWidget, PlayerProfile.playerInstances, H.MakeMessage(mod.stringkeys.roundStatus, GD.currentRound, GC.maxRounds), true);
        //UI.UpdateUIForWidgetType(pp => pp.playerDeployWidget, PlayerProfile.playerInstances, H.MakeMessage(mod.stringkeys.preRoundStarted), true);
    //   UI.UpdateUIForWidgetType(pp => pp.playerStateWidget, PlayerProfile.playerInstances, H.MakeMessage(mod.stringkeys.invincible), true);
        UI.UpdateUIForWidgetType(pp => pp.playerTeamScoreWidgets, PlayerProfile.playerInstances, undefined, true);
        UI.UpdateUIForWidgetType(pp => pp.playerSubHeaderWidget, PlayerProfile.playerInstances, undefined, true);
        UI.UpdateUIForWidgetType(pp => pp.playerRingInfoWidget, PlayerProfile.playerInstances, undefined, false);
        UI.ShowPlayerTeamWidget(true);

        GC.gameStartCountdown = GC.baseGameStartCountdown;
        GS.whileLoopStarted = false;
        GC.gameStartDebounce = false;

        if (GD.currentRound > 1) {
            await GS.RunCountdownLoop();
        }
    }

    static async StartRound() {
        GD.isInPreRound = false;
        GD.roundActive = true;

        EnableInteractPoints(false);

        PlayerProfile.playerInstances.forEach(player => {
            const playerProfile = PlayerProfile.Get(player);
            playerProfile?.buyPhaseUI?.CloseAll();
        });

        EnableBuyWorldIcons(false);

        mod.Wait(1);

        if (GD.currentRound == 1) {

            if (GC.maxRounds > 1) {
                UI.ShowAnnouncement(H.MakeMessage(mod.stringkeys.experienceSubtext));
            } else {
                UI.ShowAnnouncement(H.MakeMessage(mod.stringkeys.experienceSubtextTwo));
            }

            UI.TriggerSubHeaderUnshowProcess();
            InitializeLootSystem();
        } else {
            UI.TriggerSubHeaderUnshowProcess();
            //UI.ShowAnnouncement(H.MakeMessage(mod.stringkeys.roundBeingStartedSubtext));
        }

        this.DelayedRoundStartActions();

        await ForceSpawnAllPlayers();

        console.log("post forcespawnallplayers")

       // UI.UpdateUIForWidgetType(pp => pp.playerStateWidget, PlayerProfile.playerInstances, H.MakeMessage(mod.stringkeys.invincible), false);
        UI.UpdateUIForWidgetType(pp => pp.playerTeamScoreWidgets, PlayerProfile.playerInstances, undefined, false);
        UI.UpdateUIForWidgetType(pp => pp.playerOnTeamWidget, PlayerProfile.playerInstances, undefined, false);
        UI.ShowPlayerTeamWidget(false);

        // RESET HEALTH WHEN ROUND STARTS
        PlayerProfile.playerInstances.forEach(player => {
            // Reset max health to normal value (you might need to adjust this value)
            mod.SetPlayerMaxHealth(player, 100.0);
            console.log("health should be set to " + mod.GetSoldierState(player, mod.SoldierStateNumber.MaxHealth))
        });

        PlayerProfile.playerInstances.forEach((element, elementIndex) => {
            const playerProfile = PlayerProfile.Get(element);
            if (!mod.GetSoldierState(element, mod.SoldierStateBool.IsAlive)) UI.UpdateUI(playerProfile?.playerDeployWidget, H.MakeMessage(mod.stringkeys.roundStarted), true);
        });

        // Teleport players by team to their assigned spawn points
        PlayerProfile.deployedPlayers.forEach(player => {
            const playerTeamNumber = H.GetTeamNumber(player);
            const spawnPosition = this.GetTeamSpawnPosition(playerTeamNumber);

            // Teleport player to their team's assigned spawn position
            mod.Teleport(player, spawnPosition, 0);


            // Give player primary and Secondary ammo
            this.GiveAmmoToPlayer(player)

            const playerProfile = PlayerProfile.Get(player);
            //playerProfile?.buyPhaseUI?.CloseAll();
            UI.UpdateUI(playerProfile?.playerDeployWidget, H.MakeMessage(mod.stringkeys.preRoundStarted), false);
            PlayerProfile.playersInRound.push(player);

            const spawnIndex = GC.teamSpawnAssignments[playerTeamNumber];
            console.log("Player " + mod.GetObjId(player) + " on team " + playerTeamNumber +
                " teleported to spawn point " + spawnIndex + " at " +
                mod.XComponentOf(spawnPosition) + ", " + mod.YComponentOf(spawnPosition) + ", " +
                mod.ZComponentOf(spawnPosition));
        });

        UI.UpdateUIForWidgetType(pp => pp.playerRemainingPlayersWidget, PlayerProfile.playerInstances, H.MakeMessage(mod.stringkeys.remainingPlayers, PlayerProfile.playersInRound.length, GC.maxPlayers), true)
        UI.UpdateUIForWidgetType(pp => pp.playerRingInfoWidget && pp.playerRingInfoWidget.slice(3), PlayerProfile.playerInstances, undefined, true);

        mod.DisablePlayerJoin();
        mod.EnableAllPlayerDeploy(false);
        mod.SetSpectateOnDeath(true)
        mod.SetSpawnMode(mod.SpawnModes.Spectating)

        if (GC.useCustomRingOfFire) {
            RingOfFireAnalogue.Initialize();
        } else {
            RingOfFireController.getInstance().startRing();
        }


    }

    static GiveAmmoToPlayer(player: mod.Player) {
        if (mod.IsInventorySlotActive(player, mod.InventorySlots.PrimaryWeapon)
            && mod.GetSoldierState(player, mod.SoldierStateBool.IsAlive)
            && mod.IsPlayerValid(player)) {
            mod.SetInventoryAmmo(player, mod.InventorySlots.PrimaryWeapon, 100)
            mod.SetInventoryMagazineAmmo(player, mod.InventorySlots.PrimaryWeapon, 100)
        }

        if (mod.IsInventorySlotActive(player, mod.InventorySlots.SecondaryWeapon)
            && mod.GetSoldierState(player, mod.SoldierStateBool.IsAlive)
            && mod.IsPlayerValid(player)) {
            mod.SetInventoryAmmo(player, mod.InventorySlots.SecondaryWeapon, 100)
            mod.SetInventoryMagazineAmmo(player, mod.InventorySlots.SecondaryWeapon, 100)
        }
    }

    static async DelayedRoundStartActions() {
        await mod.Wait(2)
        PlayerProfile.playerInstances.forEach(element => {
            mod.SkipManDown(element, false)
        });
    }

    static async EndRound() {

        //UI.ShowAnnouncement(H.MakeMessage(mod.stringkeys.roundEnd));
        GD.roundActive = false;

        if (GC.useCustomRingOfFire) {
            RingOfFireAnalogue.ClearRingIcons();
        } else {
            RingOfFireController.getInstance().stopRing();
        }

        UI.UpdateUIForWidgetType(pp => pp.playerRingInfoWidget, PlayerProfile.playerInstances, undefined, false);
        UI.UpdateUIForWidgetType(pp => pp.playerRingInfoWidget && pp.playerRingInfoWidget.slice(3), PlayerProfile.playerInstances, undefined, false);

        await mod.Wait(2.0);

        // RESET HEALTH BEFORE UNDEPLOYING (just in case)
        PlayerProfile.playersInRound.forEach(player => {
            // Reset max health to normal value
            mod.SetPlayerMaxHealth(player, 100.0);
            //mod.Kill(player);
            mod.UndeployPlayer(player);
        });

        await mod.Wait(1.0);

        PlayerProfile.playersInRound = [];

        if (GC.testingWithAI) {
            mod.UnspawnAllAIsFromAISpawner(mod.GetSpawner(30));
            mod.UnspawnAllAIsFromAISpawner(mod.GetSpawner(31));
            mod.UnspawnAllAIsFromAISpawner(mod.GetSpawner(32));
            mod.UnspawnAllAIsFromAISpawner(mod.GetSpawner(33));
            mod.UnspawnAllAIsFromAISpawner(mod.GetSpawner(34));

            await mod.Wait(1.0);
        }

        RefreshTeamMemberCount();

        await mod.Wait(1.0);

        await ForceSpawnAllPlayers();

        //Reset player bought list
        PlayerProfile.playersInRound.forEach(player => {
            const playerProfile = PlayerProfile.Get(player)
            if (playerProfile) playerProfile.boughtItems.clear()
        });

        this.StartPreRound();
    }
}

// === src\HoH_Helpers.ts ===

class H {


    static toArray<T>(value: T | T[] | undefined): T[] {
        if (value === undefined) return [];
        return Array.isArray(value) ? value : [value];
    }

    static IsPlayerTrullyAlive(player: mod.Player) {
        if (
            mod.IsPlayerValid(player) &&
            !mod.GetSoldierState(player, mod.SoldierStateBool.IsManDown) &&
            mod.GetSoldierState(player, mod.SoldierStateBool.IsAlive) &&
            !mod.GetSoldierState(player, mod.SoldierStateBool.IsDead)
        ) {
            return true
        }
        return false
    }

    static GetPlayersOnTeam() {
        const players = mod.AllPlayers();
        const n = mod.CountOf(players);

        const teams: Record<string, mod.Player[]> = {}; // or specify a Player type

        for (let index = 0; index < n; index++) {
            const player = mod.ValueInArray(players, index);
            const team = mod.GetObjId(mod.GetTeam(player));

            // If this team doesnt exist in our record yet, initialize it
            if (!teams[team]) {
                teams[team] = [];
            }

            // Add the player to that teams list
            teams[team].push(player);
        }

        return teams;
    }

    static Lerp(a: number, b: number, t: number): number {
        return a + (b - a) * t;
    }

    static LerpConstant(a: number, b: number, speed: number, deltaTime: number): number {
        const difference = b - a;
        const distance = Math.abs(difference);

        if (distance <= speed * deltaTime) {
            // Close enough to target, return the target
            return b;
        }

        // Move at constant speed toward target
        const direction = difference > 0 ? 1 : -1;
        return a + direction * speed * deltaTime;
    }

    static LerpVector(a: mod.Vector, b: mod.Vector, t: number): mod.Vector {
        return mod.CreateVector(
            this.Lerp(mod.XComponentOf(a), mod.XComponentOf(b), t),
            this.Lerp(mod.YComponentOf(a), mod.YComponentOf(b), t),
            this.Lerp(mod.ZComponentOf(a), mod.ZComponentOf(b), t)
        );
    }

    static LerpVectorConstant(a: mod.Vector, b: mod.Vector, speed: number, deltaTime: number): mod.Vector {
        const direction = mod.CreateVector(
            mod.XComponentOf(b) - mod.XComponentOf(a),
            mod.YComponentOf(b) - mod.YComponentOf(a),
            mod.ZComponentOf(b) - mod.ZComponentOf(a)
        );

        const distance = Math.sqrt(
            Math.pow(mod.XComponentOf(direction), 2) +
            Math.pow(mod.YComponentOf(direction), 2) +
            Math.pow(mod.ZComponentOf(direction), 2)
        );

        if (distance <= speed * deltaTime) {
            // Close enough to target, return the target
            return b;
        }

        // Normalize direction and multiply by speed * deltaTime
        const normalizedSpeed = (speed * deltaTime) / distance;

        return mod.CreateVector(
            mod.XComponentOf(a) + mod.XComponentOf(direction) * normalizedSpeed,
            mod.YComponentOf(a) + mod.YComponentOf(direction) * normalizedSpeed,
            mod.ZComponentOf(a) + mod.ZComponentOf(direction) * normalizedSpeed
        );
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

    static FormatTime(sec: number): [number, number, number] {
        if (sec < 0) sec = 0;
        const minutes = Math.floor(sec / 60);
        const remainingSeconds = Math.floor(sec % 60);
        const secondsTens = Math.floor(remainingSeconds / 10);  // tens digit of seconds
        const secondsOnes = remainingSeconds % 10;              // ones digit of seconds
        return [minutes, secondsTens, secondsOnes];
    }

    static GetRandomInt(max: number) {
        return Math.floor(Math.random() * max);
    }

    static GetTeamNumber(player?: mod.Player | undefined, team?: mod.Team | undefined): number {
        let teamId: mod.Team | undefined;
        if (player) teamId = mod.GetTeam(player);
        if (team) teamId = team;
        let teamInt = -1;

        if (teamId) {
            for (let i = 1; i <= GC.teamAmount; i++) {
                if (mod.GetObjId(teamId) == mod.GetObjId(mod.GetTeam(i))) {
                    teamInt = i;
                    break;
                }
            }
        }

        return teamInt;
    }
}

// === src\HoH_LootConfig.ts ===
// HoH_LootConfig.ts - Compact configuration for loot system
const LOOT_CONFIG = {
    // Basic spawn settings
    baseSpawnChance: 100,
    spawnerDensity: 1.0,
    minSpawnersPerZone: 3,
    maxSpawnersPerZone: 3,

    // Zone modifiers (applied to base values)
    zoneModifiers: {
        central: { spawnChance: 1.2, rarityBonus: 30, weaponBias: 20 },
        building: { spawnChance: 1.0, rarityBonus: 0, weaponBias: 0 },
        outdoor: { spawnChance: 0.9, rarityBonus: -5, weaponBias: -15 }
    },

    // Rarity thresholds (0-100) 
    // highly unlikely to actually do anything regarding loot quality, aside from choosing a specific weapon.
    rarityRolls: [35, 60, 75, 90], // Common, Uncommon, Rare, Epic, Legendary

    // Item type distribution (0-100) 
    typeRolls: [10, 20, 55], // Primary, Secondary, Gadgets, Ammo

    // Performance settings
    maxSpawnersPerTick: 10,
    spawnDelay: 0.1,
    forcedSpawnDelay: -1,
    spawnerSelfDestructDelay: 0.7
};

// Complete weapon catalog with all available primary and secondary weapons
const LOOT_POOLS = {
    weapons: {
        primary: [
            // Common - Assault Rifles, Carbines, SMGs
            [
                mod.Weapons.Carbine_M4A1, mod.Weapons.AssaultRifle_L85A3, mod.Weapons.Carbine_AK_205,
                mod.Weapons.AssaultRifle_B36A4, mod.Weapons.AssaultRifle_TR_7, mod.Weapons.AssaultRifle_M433,
                mod.Weapons.Carbine_GRT_BC, mod.Weapons.SMG_SCW_10, mod.Weapons.SMG_KV9,
                mod.Weapons.SMG_UMG_40, mod.Weapons.SMG_PW7A2, mod.Weapons.SMG_PW5A3
            ],
            // Uncommon - More assault rifles and advanced carbines
            [
                mod.Weapons.AssaultRifle_AK4D, mod.Weapons.AssaultRifle_NVO_228E, mod.Weapons.AssaultRifle_SOR_556_Mk2,
                mod.Weapons.AssaultRifle_KORD_6P67, mod.Weapons.Carbine_M417_A2, mod.Weapons.Carbine_SOR_300SC,
                mod.Weapons.Carbine_QBZ_192, mod.Weapons.SMG_USG_90, mod.Weapons.SMG_SGX
            ],
            // Rare - DMRs and Light Machine Guns  
            [
                mod.Weapons.DMR_M39_EMR, mod.Weapons.DMR_SVDM, mod.Weapons.DMR_LMR27,
                mod.Weapons.DMR_SVK_86, mod.Weapons.LMG_DRS_IAR, mod.Weapons.LMG_KTS100_MK8,
                mod.Weapons.LMG_L110, mod.Weapons.LMG_RPKM
            ],
            // Epic - Heavy LMGs and Advanced DMRs
            [
                mod.Weapons.LMG_M250, mod.Weapons.LMG_M240L, mod.Weapons.LMG_M_60,
                mod.Weapons.LMG_M123K, mod.Weapons.Sniper_PSR
            ],
            // Legendary - Sniper rifles and Shotguns
            [
                mod.Weapons.Sniper_SV_98, mod.Weapons.Sniper_M2010_ESR, mod.Weapons.Shotgun_M87A1,
                mod.Weapons.Shotgun_M1014
            ]
        ],
        secondary: [
            // Common - Basic pistols
            [mod.Weapons.Sidearm_P18, mod.Weapons.Sidearm_M45A1],
            // Uncommon - Standard sidearms
            [mod.Weapons.Sidearm_ES_57, mod.Weapons.Sidearm_GGH_22, mod.Weapons.Sidearm_M45A1],
            // Rare - Higher caliber pistols
            [mod.Weapons.Sidearm_M44, mod.Weapons.Sidearm_ES_57],
            // Epic - Powerful sidearms
            [mod.Weapons.Sidearm_M44],
            // Legendary - Top tier pistols
            [mod.Weapons.Sidearm_M44]
        ]
    },
    ammo: [ // this setup is reverse right now since we want most types to be available
        // Common
        [mod.AmmoTypes.AR_Carbine_Ammo, mod.AmmoTypes.Pistol_SMG_Ammo, mod.AmmoTypes.Sniper_DMR_Ammo, mod.AmmoTypes.LMG_Ammo, mod.AmmoTypes.Armor_Plate],
        // Uncommon
        [mod.AmmoTypes.AR_Carbine_Ammo, mod.AmmoTypes.Pistol_SMG_Ammo, mod.AmmoTypes.Sniper_DMR_Ammo, mod.AmmoTypes.LMG_Ammo],
        // Rare
        [mod.AmmoTypes.AR_Carbine_Ammo, mod.AmmoTypes.Pistol_SMG_Ammo, mod.AmmoTypes.LMG_Ammo],
        // Epic
        [mod.AmmoTypes.AR_Carbine_Ammo, mod.AmmoTypes.Pistol_SMG_Ammo],
        // Legendary
        [mod.AmmoTypes.Pistol_SMG_Ammo]
    ],
    gadgets: {
        throwables: [
            // Common - Basic utility throwables (3 items)
            [
                mod.Throwables.ThrowingKnife, mod.Throwables.FlashGrenade, mod.Throwables.SmokeGrenade
            ],
            // Uncommon - Standard grenades (3 items)
            [
                mod.Throwables.FragmentationGrenade, mod.Throwables.StunGrenade, mod.Throwables.MiniFragGrenade
            ],
            // Rare - Specialized throwables (3 items)
            [
                mod.Throwables.IncendiaryGrenade, mod.Throwables.ThrowableMotionSensor
            ],
            // Epic - High damage throwables (2 items)
            [
                mod.Throwables.IncendiaryGrenade
            ],
            // Legendary - Most powerful throwables (1 item)
            [
                mod.Throwables.FragmentationGrenade
            ]
        ],
        openGadgets: [
            // Common - Basic support equipment (8 items)
            [
                mod.OpenGadgets.RepairTool, mod.OpenGadgets.DeployableCover, mod.OpenGadgets.SupplyPouch,
                mod.OpenGadgets.MotionSensor, mod.OpenGadgets.SniperDecoy, mod.OpenGadgets.AdrenalineInjector,
                mod.OpenGadgets.SupplyBag, mod.OpenGadgets.DeployBeacon
            ],
            // Uncommon - Medical and detection gear (8 items)
            [
                mod.OpenGadgets.ArmorPlate, mod.OpenGadgets.Defibrillator, mod.OpenGadgets.TracerDart,
                mod.OpenGadgets.ReconDrone, mod.OpenGadgets.LaserDesignator, mod.OpenGadgets.TripwireSensorMine,
                mod.OpenGadgets.PressureMine, mod.OpenGadgets.GrenadeInterceptSystem
            ],
            // Rare - Advanced equipment and basic launchers (8 items)
            [
                mod.OpenGadgets.UnguidedRocketLauncher, mod.OpenGadgets.LongRangeLauncher,
                mod.OpenGadgets.MotionSensorMine, mod.OpenGadgets.AntiPersonnelMine,
                mod.OpenGadgets.HandheldBreechingProjectileLauncher, mod.OpenGadgets.DemolitionCharge,
                mod.OpenGadgets.SmokeGrenadeLauncher, mod.OpenGadgets.AssaultLadder
            ],
            // Epic - Heavy launchers and advanced systems (8 items)
            [
                mod.OpenGadgets.AimGuidedLauncher, mod.OpenGadgets.PortableMortar,
                mod.OpenGadgets.HighExplosiveLauncher, mod.OpenGadgets.ThermobaricGrenadeLauncher,
                mod.OpenGadgets.AutoGuidedLauncher, mod.OpenGadgets.FlameRoundShotgun
            ],
            // Legendary - Top tier equipment and call-ins (6 items)
            [
                mod.OpenGadgets.EODBot, mod.OpenGadgets.IncendiaryAirburstWeaponSystem
           
            ]
        ],
        miscGadgets: [
            // Common - Basic armor (2 items)
            [
                mod.ArmorTypes.SoftArmor
            ],
            // Uncommon - Improved armor and basic callins (3 items)
            [
                mod.ArmorTypes.CeramicArmor
            ],
            // Rare - Support callins (4 items)
      

        ]
    }
};

// === src\HoH_LootCoordinates.ts ===
// Auto-generated loot coordinates - DO NOT EDIT MANUALLY
// Generated from HoH_Skirmish.spatial.json at 2025-10-24T13:40:27.591Z

const LOOT_COORDINATES = {
    lootZones: [
        { x: -867.67, y: 122.33, z: 209.99, radius: 1.65 }, // LootZones/LootZone75 (scale: X=3.31, Y=3.31, Z=3.31)
        { x: -867.67, y: 127.43, z: 209.99, radius: 1.65 }, // LootZones/LootZone378 (scale: X=3.31, Y=3.31, Z=3.31)
        { x: -869.41, y: 127.43, z: 226.07, radius: 1.65 }, // LootZones/LootZone379 (scale: X=3.31, Y=3.31, Z=3.31)
        { x: -904.13, y: 122.33, z: 184.45, radius: 1.65 }, // LootZones/LootZone77 (scale: X=3.31, Y=3.31, Z=3.31)
        { x: -900.38, y: 126.91, z: 181.98, radius: 1.65 }, // LootZones/LootZone289 (scale: X=3.31, Y=3.31, Z=3.31)
        { x: -915.14, y: 126.91, z: 177.6, radius: 1.65 }, // LootZones/LootZone291 (scale: X=3.31, Y=3.31, Z=3.31)
        { x: -911.93, y: 122.33, z: 173.79, radius: 1.65 }, // LootZones/LootZone78 (scale: X=3.31, Y=3.31, Z=3.31)
        { x: -920.49, y: 122.33, z: 184.19, radius: 1.65 }, // LootZones/LootZone80 (scale: X=3.31, Y=3.31, Z=3.31)
        { x: -907.93, y: 122.33, z: 190.65, radius: 1.4 }, // LootZones/LootZone81 (scale: X=2.8, Y=2.8, Z=2.8)
        { x: -913.34, y: 122.33, z: 201.81, radius: 1.65 }, // LootZones/LootZone82 (scale: X=3.31, Y=3.31, Z=3.31)
        { x: -930.68, y: 122.33, z: 194.73, radius: 1.65 }, // LootZones/LootZone83 (scale: X=3.31, Y=3.31, Z=3.31)
        { x: -922.65, y: 126.84, z: 181.52, radius: 1.65 }, // LootZones/LootZone292 (scale: X=3.31, Y=3.31, Z=3.31)
        { x: -909.1, y: 126.84, z: 190.55, radius: 1.4 }, // LootZones/LootZone293 (scale: X=2.8, Y=2.8, Z=2.8)
        { x: -915.41, y: 126.84, z: 205.18, radius: 1.65 }, // LootZones/LootZone294 (scale: X=3.31, Y=3.31, Z=3.31)
        { x: -927.76, y: 126.93, z: 214.54, radius: 1.65 }, // LootZones/LootZone296 (scale: X=3.31, Y=3.31, Z=3.31)
        { x: -925.04, y: 131.43, z: 212.88, radius: 1.65 }, // LootZones/LootZone310 (scale: X=3.31, Y=3.31, Z=3.31)
        { x: -922.88, y: 136.02, z: 214.79, radius: 1.65 }, // LootZones/LootZone311 (scale: X=3.31, Y=3.31, Z=3.31)
        { x: -927.31, y: 122.46, z: 212.88, radius: 1.65 }, // LootZones/LootZone297 (scale: X=3.31, Y=3.31, Z=3.31)
        { x: -932.82, y: 126.84, z: 193.3, radius: 1.34 }, // LootZones/LootZone295 (scale: X=2.69, Y=2.69, Z=2.69)
        { x: -922.65, y: 131.31, z: 181.52, radius: 1.65 }, // LootZones/LootZone305 (scale: X=3.31, Y=3.31, Z=3.31)
        { x: -910.61, y: 131.31, z: 190.55, radius: 1.4 }, // LootZones/LootZone306 (scale: X=2.8, Y=2.8, Z=2.8)
        { x: -915.41, y: 131.31, z: 205.18, radius: 1.65 }, // LootZones/LootZone307 (scale: X=3.31, Y=3.31, Z=3.31)
        { x: -927.76, y: 131.39, z: 218.41, radius: 1.65 }, // LootZones/LootZone308 (scale: X=3.31, Y=3.31, Z=3.31)
        { x: -932.82, y: 131.31, z: 194.27, radius: 1.34 }, // LootZones/LootZone309 (scale: X=2.69, Y=2.69, Z=2.69)
        { x: -939.68, y: 122.43, z: 159.31, radius: 1.65 }, // LootZones/LootZone84 (scale: X=3.31, Y=3.31, Z=3.31)
        { x: -955.27, y: 122.33, z: 149.93, radius: 1.65 }, // LootZones/LootZone85 (scale: X=3.31, Y=3.31, Z=3.31)
        { x: -961.45, y: 122.33, z: 164.08, radius: 1.65 }, // LootZones/LootZone86 (scale: X=3.31, Y=3.31, Z=3.31)
        { x: -967.72, y: 122.33, z: 155.57, radius: 1.65 }, // LootZones/LootZone87 (scale: X=3.31, Y=3.31, Z=3.31)
        { x: -962.17, y: 122.33, z: 141.43, radius: 1.65 }, // LootZones/LootZone88 (scale: X=3.31, Y=3.31, Z=3.31)
        { x: -975.24, y: 122.33, z: 148.5, radius: 1.65 }, // LootZones/LootZone89 (scale: X=3.31, Y=3.31, Z=3.31)
        { x: -969.05, y: 122.33, z: 137.78, radius: 1.65 }, // LootZones/LootZone90 (scale: X=3.31, Y=3.31, Z=3.31)
        { x: -939.68, y: 126.94, z: 159.31, radius: 1.65 }, // LootZones/LootZone298 (scale: X=3.31, Y=3.31, Z=3.31)
        { x: -954.22, y: 126.85, z: 151.06, radius: 1.65 }, // LootZones/LootZone299 (scale: X=3.31, Y=3.31, Z=3.31)
        { x: -963.28, y: 126.85, z: 163.03, radius: 1.65 }, // LootZones/LootZone300 (scale: X=3.31, Y=3.31, Z=3.31)
        { x: -967.72, y: 126.85, z: 155.57, radius: 1.65 }, // LootZones/LootZone301 (scale: X=3.31, Y=3.31, Z=3.31)
        { x: -958.53, y: 126.85, z: 143.08, radius: 1.65 }, // LootZones/LootZone302 (scale: X=3.31, Y=3.31, Z=3.31)
        { x: -939.68, y: 131.48, z: 159.31, radius: 1.65 }, // LootZones/LootZone312 (scale: X=3.31, Y=3.31, Z=3.31)
        { x: -949.98, y: 131.38, z: 151.06, radius: 1.65 }, // LootZones/LootZone313 (scale: X=3.31, Y=3.31, Z=3.31)
        { x: -943.33, y: 135.9, z: 157.76, radius: 1.65 }, // LootZones/LootZone317 (scale: X=3.31, Y=3.31, Z=3.31)
        { x: -932, y: 140.95, z: 153.92, radius: 0.63 }, // LootZones/LootZone318 (scale: X=1.25, Y=1.25, Z=1.25)
        { x: -963.28, y: 131.38, z: 163.03, radius: 1.65 }, // LootZones/LootZone314 (scale: X=3.31, Y=3.31, Z=3.31)
        { x: -967.72, y: 131.38, z: 155.57, radius: 1.65 }, // LootZones/LootZone315 (scale: X=3.31, Y=3.31, Z=3.31)
        { x: -958.53, y: 131.38, z: 143.08, radius: 1.65 }, // LootZones/LootZone316 (scale: X=3.31, Y=3.31, Z=3.31)
        { x: -975.24, y: 126.85, z: 148.5, radius: 1.65 }, // LootZones/LootZone303 (scale: X=3.31, Y=3.31, Z=3.31)
        { x: -969.05, y: 126.85, z: 137.78, radius: 1.65 }, // LootZones/LootZone304 (scale: X=3.31, Y=3.31, Z=3.31)
        { x: -988.52, y: 122.33, z: 128.15, radius: 1.65 }, // LootZones/LootZone91 (scale: X=3.31, Y=3.31, Z=3.31)
        { x: -994.99, y: 122.33, z: 138.52, radius: 1.65 }, // LootZones/LootZone92 (scale: X=3.31, Y=3.31, Z=3.31)
        { x: -1008.34, y: 122.33, z: 126.9, radius: 1.65 }, // LootZones/LootZone93 (scale: X=3.31, Y=3.31, Z=3.31)
        { x: -997.86, y: 122.33, z: 122.93, radius: 1.65 }, // LootZones/LootZone94 (scale: X=3.31, Y=3.31, Z=3.31)
        { x: -988.52, y: 126.92, z: 128.15, radius: 1.65 }, // LootZones/LootZone319 (scale: X=3.31, Y=3.31, Z=3.31)
        { x: -998.07, y: 126.92, z: 136.13, radius: 1.65 }, // LootZones/LootZone320 (scale: X=3.31, Y=3.31, Z=3.31)
        { x: -1015.81, y: 126.92, z: 123.04, radius: 1.65 }, // LootZones/LootZone321 (scale: X=3.31, Y=3.31, Z=3.31)
        { x: -997.86, y: 126.92, z: 122.93, radius: 1.65 }, // LootZones/LootZone322 (scale: X=3.31, Y=3.31, Z=3.31)
        { x: -1018.51, y: 122.41, z: 120.67, radius: 1.65 }, // LootZones/LootZone95 (scale: X=3.31, Y=3.31, Z=3.31)
        { x: -1009.07, y: 122.41, z: 111.48, radius: 1.65 }, // LootZones/LootZone96 (scale: X=3.31, Y=3.31, Z=3.31)
        { x: -1045.7, y: 122.28, z: 97.78, radius: 1.65 }, // LootZones/LootZone97 (scale: X=3.31, Y=3.31, Z=3.31)
        { x: -1049.32, y: 122.28, z: 109.96, radius: 1.65 }, // LootZones/LootZone98 (scale: X=3.31, Y=3.31, Z=3.31)
        { x: -1067.33, y: 122.28, z: 111.6, radius: 1.65 }, // LootZones/LootZone99 (scale: X=3.31, Y=3.31, Z=3.31)
        { x: -1059.57, y: 122.28, z: 121.4, radius: 1.65 }, // LootZones/LootZone100 (scale: X=3.31, Y=3.31, Z=3.31)
        { x: -1064.78, y: 122.28, z: 132.2, radius: 1.65 }, // LootZones/LootZone101 (scale: X=3.31, Y=3.31, Z=3.31)
        { x: -1073.39, y: 122.28, z: 141.05, radius: 1.65 }, // LootZones/LootZone102 (scale: X=3.31, Y=3.31, Z=3.31)
        { x: -1046.12, y: 126.8, z: 96.52, radius: 1.65 }, // LootZones/LootZone323 (scale: X=3.31, Y=3.31, Z=3.31)
        { x: -1051.31, y: 126.8, z: 114.29, radius: 1.65 }, // LootZones/LootZone324 (scale: X=3.31, Y=3.31, Z=3.31)
        { x: -1067.33, y: 126.8, z: 111.6, radius: 1.65 }, // LootZones/LootZone325 (scale: X=3.31, Y=3.31, Z=3.31)
        { x: -1057.29, y: 126.8, z: 97, radius: 1.65 }, // LootZones/LootZone329 (scale: X=3.31, Y=3.31, Z=3.31)
        { x: -1050.44, y: 131.25, z: 95.5, radius: 1.65 }, // LootZones/LootZone330 (scale: X=3.31, Y=3.31, Z=3.31)
        { x: -1051.01, y: 131.25, z: 116.08, radius: 1.65 }, // LootZones/LootZone331 (scale: X=3.31, Y=3.31, Z=3.31)
        { x: -1059.57, y: 126.8, z: 121.4, radius: 1.65 }, // LootZones/LootZone326 (scale: X=3.31, Y=3.31, Z=3.31)
        { x: -1073.8, y: 126.8, z: 128.62, radius: 1.65 }, // LootZones/LootZone332 (scale: X=3.31, Y=3.31, Z=3.31)
        { x: -1064.78, y: 126.8, z: 132.2, radius: 1.65 }, // LootZones/LootZone327 (scale: X=3.31, Y=3.31, Z=3.31)
        { x: -1072.99, y: 126.8, z: 138.31, radius: 1.65 }, // LootZones/LootZone328 (scale: X=3.31, Y=3.31, Z=3.31)
        { x: -1077.63, y: 126.8, z: 145.15, radius: 1.65 }, // LootZones/LootZone333 (scale: X=3.31, Y=3.31, Z=3.31)
        { x: -1064.78, y: 131.34, z: 132.2, radius: 1.65 }, // LootZones/LootZone334 (scale: X=3.31, Y=3.31, Z=3.31)
        { x: -1074.43, y: 131.34, z: 138.31, radius: 1.65 }, // LootZones/LootZone335 (scale: X=3.31, Y=3.31, Z=3.31)
        { x: -1080.66, y: 131.34, z: 146.84, radius: 1.65 }, // LootZones/LootZone336 (scale: X=3.31, Y=3.31, Z=3.31)
        { x: -1072.1, y: 135.85, z: 141.2, radius: 1.65 }, // LootZones/LootZone337 (scale: X=3.31, Y=3.31, Z=3.31)
        { x: -1067, y: 135.85, z: 129.26, radius: 1.65 }, // LootZones/LootZone338 (scale: X=3.31, Y=3.31, Z=3.31)
        { x: -1043.77, y: 121.78, z: 154.95, radius: 2.18 }, // LootZones/LootZone103 (scale: X=4.36, Y=4.36, Z=4.36)
        { x: -1021.24, y: 121.78, z: 161.19, radius: 2.18 }, // LootZones/LootZone104 (scale: X=4.36, Y=4.36, Z=4.36)
        { x: -1048.94, y: 121.78, z: 174.4, radius: 2.18 }, // LootZones/LootZone105 (scale: X=4.36, Y=4.36, Z=4.36)
        { x: -1065.65, y: 121.78, z: 178.45, radius: 2.18 }, // LootZones/LootZone106 (scale: X=4.36, Y=4.36, Z=4.36)
        { x: -1043.77, y: 126.97, z: 154.95, radius: 2.18 }, // LootZones/LootZone339 (scale: X=4.36, Y=4.36, Z=4.36)
        { x: -1023.22, y: 126.97, z: 160.58, radius: 2.18 }, // LootZones/LootZone340 (scale: X=4.36, Y=4.36, Z=4.36)
        { x: -1048.94, y: 126.97, z: 174.4, radius: 2.18 }, // LootZones/LootZone341 (scale: X=4.36, Y=4.36, Z=4.36)
        { x: -1063.33, y: 126.97, z: 178.45, radius: 2.18 }, // LootZones/LootZone342 (scale: X=4.36, Y=4.36, Z=4.36)
        { x: -1043.77, y: 132.21, z: 154.95, radius: 2.18 }, // LootZones/LootZone343 (scale: X=4.36, Y=4.36, Z=4.36)
        { x: -1023.22, y: 132.21, z: 163.05, radius: 2.18 }, // LootZones/LootZone344 (scale: X=4.36, Y=4.36, Z=4.36)
        { x: -1048.94, y: 132.21, z: 174.4, radius: 2.18 }, // LootZones/LootZone345 (scale: X=4.36, Y=4.36, Z=4.36)
        { x: -1063.33, y: 132.21, z: 178.45, radius: 2.18 }, // LootZones/LootZone346 (scale: X=4.36, Y=4.36, Z=4.36)
        { x: -1027.05, y: 122.51, z: 210.78, radius: 1.69 }, // LootZones/LootZone107 (scale: X=3.37, Y=3.37, Z=3.37)
        { x: -1011.43, y: 122.51, z: 207.86, radius: 1.69 }, // LootZones/LootZone108 (scale: X=3.37, Y=3.37, Z=3.37)
        { x: -1022.29, y: 122.51, z: 217.51, radius: 1.69 }, // LootZones/LootZone109 (scale: X=3.37, Y=3.37, Z=3.37)
        { x: -1011.89, y: 122.51, z: 222.21, radius: 1.69 }, // LootZones/LootZone110 (scale: X=3.37, Y=3.37, Z=3.37)
        { x: -1000.19, y: 122.51, z: 212.85, radius: 1.69 }, // LootZones/LootZone111 (scale: X=3.37, Y=3.37, Z=3.37)
        { x: -1011.89, y: 127, z: 222.21, radius: 1.69 }, // LootZones/LootZone359 (scale: X=3.37, Y=3.37, Z=3.37)
        { x: -1001.19, y: 127, z: 214.17, radius: 1.69 }, // LootZones/LootZone360 (scale: X=3.37, Y=3.37, Z=3.37)
        { x: -1015.71, y: 127, z: 205.49, radius: 1.69 }, // LootZones/LootZone361 (scale: X=3.37, Y=3.37, Z=3.37)
        { x: -1024.11, y: 127, z: 218.31, radius: 1.69 }, // LootZones/LootZone362 (scale: X=3.37, Y=3.37, Z=3.37)
        { x: -1030.6, y: 127, z: 214.06, radius: 1.69 }, // LootZones/LootZone363 (scale: X=3.37, Y=3.37, Z=3.37)
        { x: -1030.6, y: 131.36, z: 214.06, radius: 1.69 }, // LootZones/LootZone364 (scale: X=3.37, Y=3.37, Z=3.37)
        { x: -1027.75, y: 131.36, z: 202.33, radius: 1.69 }, // LootZones/LootZone365 (scale: X=3.37, Y=3.37, Z=3.37)
        { x: -1020.7, y: 135.83, z: 216.1, radius: 1.69 }, // LootZones/LootZone366 (scale: X=3.37, Y=3.37, Z=3.37)
        { x: -980.96, y: 122.12, z: 183.68, radius: 1.69 }, // LootZones/LootZone112 (scale: X=3.37, Y=3.37, Z=3.37)
        { x: -975.73, y: 122.12, z: 199.38, radius: 1.69 }, // LootZones/LootZone347 (scale: X=3.37, Y=3.37, Z=3.37)
        { x: -969.18, y: 122.06, z: 188.83, radius: 1.69 }, // LootZones/LootZone113 (scale: X=3.37, Y=3.37, Z=3.37)
        { x: -956.39, y: 122.06, z: 200.82, radius: 1.69 }, // LootZones/LootZone114 (scale: X=3.37, Y=3.37, Z=3.37)
        { x: -982.2, y: 126.62, z: 183.39, radius: 1.69 }, // LootZones/LootZone348 (scale: X=3.37, Y=3.37, Z=3.37)
        { x: -982.2, y: 131.11, z: 179.84, radius: 1.69 }, // LootZones/LootZone352 (scale: X=3.37, Y=3.37, Z=3.37)
        { x: -977.41, y: 131.11, z: 189.67, radius: 1.69 }, // LootZones/LootZone353 (scale: X=3.37, Y=3.37, Z=3.37)
        { x: -964.78, y: 131.11, z: 189.83, radius: 1.69 }, // LootZones/LootZone354 (scale: X=3.37, Y=3.37, Z=3.37)
        { x: -960.11, y: 131.11, z: 204.85, radius: 1.69 }, // LootZones/LootZone355 (scale: X=3.37, Y=3.37, Z=3.37)
        { x: -950.4, y: 131.11, z: 203.66, radius: 1.69 }, // LootZones/LootZone356 (scale: X=3.37, Y=3.37, Z=3.37)
        { x: -955.68, y: 135.63, z: 196.77, radius: 1.69 }, // LootZones/LootZone357 (scale: X=3.37, Y=3.37, Z=3.37)
        { x: -983.1, y: 135.63, z: 181.32, radius: 1.69 }, // LootZones/LootZone358 (scale: X=3.37, Y=3.37, Z=3.37)
        { x: -975.73, y: 126.62, z: 199.38, radius: 1.69 }, // LootZones/LootZone349 (scale: X=3.37, Y=3.37, Z=3.37)
        { x: -969.18, y: 126.56, z: 188.83, radius: 1.69 }, // LootZones/LootZone350 (scale: X=3.37, Y=3.37, Z=3.37)
        { x: -956.39, y: 126.56, z: 200.82, radius: 1.69 }, // LootZones/LootZone351 (scale: X=3.37, Y=3.37, Z=3.37)
        { x: -954.65, y: 122.46, z: 228.96, radius: 1.69 }, // LootZones/LootZone115 (scale: X=3.37, Y=3.37, Z=3.37)
        { x: -960.43, y: 122.46, z: 238.44, radius: 1.69 }, // LootZones/LootZone116 (scale: X=3.37, Y=3.37, Z=3.37)
        { x: -977.49, y: 122.46, z: 243.95, radius: 1.69 }, // LootZones/LootZone117 (scale: X=3.37, Y=3.37, Z=3.37)
        { x: -988.2, y: 122.46, z: 237.52, radius: 1.69 }, // LootZones/LootZone118 (scale: X=3.37, Y=3.37, Z=3.37)
        { x: -983.39, y: 122.46, z: 226.99, radius: 1.69 }, // LootZones/LootZone367 (scale: X=3.37, Y=3.37, Z=3.37)
        { x: -960.43, y: 126.95, z: 238.44, radius: 1.69 }, // LootZones/LootZone368 (scale: X=3.37, Y=3.37, Z=3.37)
        { x: -977.49, y: 126.95, z: 243.95, radius: 1.69 }, // LootZones/LootZone369 (scale: X=3.37, Y=3.37, Z=3.37)
        { x: -988.81, y: 126.95, z: 237.4, radius: 1.69 }, // LootZones/LootZone370 (scale: X=3.37, Y=3.37, Z=3.37)
        { x: -983.39, y: 126.95, z: 226.99, radius: 1.69 }, // LootZones/LootZone371 (scale: X=3.37, Y=3.37, Z=3.37)
        { x: -969.21, y: 126.95, z: 230.04, radius: 1.69 }, // LootZones/LootZone372 (scale: X=3.37, Y=3.37, Z=3.37)
        { x: -969.21, y: 131.39, z: 238.5, radius: 1.69 }, // LootZones/LootZone373 (scale: X=3.37, Y=3.37, Z=3.37)
        { x: -951.65, y: 131.39, z: 234.18, radius: 1.69 }, // LootZones/LootZone374 (scale: X=3.37, Y=3.37, Z=3.37)
        { x: -992.77, y: 131.39, z: 240.09, radius: 1.69 }, // LootZones/LootZone375 (scale: X=3.37, Y=3.37, Z=3.37)
        { x: -976.1, y: 135.92, z: 243.96, radius: 1.69 }, // LootZones/LootZone376 (scale: X=3.37, Y=3.37, Z=3.37)
        { x: -950.89, y: 135.92, z: 226.75, radius: 1.69 }, // LootZones/LootZone377 (scale: X=3.37, Y=3.37, Z=3.37)
        { x: -889.52, y: 122.46, z: 253.42, radius: 1.69 }, // LootZones/LootZone119 (scale: X=3.37, Y=3.37, Z=3.37)
        { x: -889.52, y: 122.35, z: 253.42, radius: 1.69 }, // LootZones/LootZone120 (scale: X=3.37, Y=3.37, Z=3.37)
        { x: -898.83, y: 122.35, z: 261.63, radius: 1.16 }, // LootZones/LootZone121 (scale: X=2.32, Y=2.32, Z=2.32)
        { x: -891.71, y: 122.35, z: 270.52, radius: 1.16 }, // LootZones/LootZone385 (scale: X=2.32, Y=2.32, Z=2.32)
        { x: -903.03, y: 122.35, z: 286.64, radius: 1.16 }, // LootZones/LootZone386 (scale: X=2.32, Y=2.32, Z=2.32)
        { x: -911.02, y: 122.35, z: 299.17, radius: 1.16 }, // LootZones/LootZone387 (scale: X=2.32, Y=2.32, Z=2.32)
        { x: -907.21, y: 122.35, z: 274.58, radius: 1.16 }, // LootZones/LootZone122 (scale: X=2.32, Y=2.32, Z=2.32)
        { x: -911.08, y: 122.23, z: 281.37, radius: 1.16 }, // LootZones/LootZone123 (scale: X=2.32, Y=2.32, Z=2.32)
        { x: -919.07, y: 122.23, z: 290.6, radius: 1.16 }, // LootZones/LootZone124 (scale: X=2.32, Y=2.32, Z=2.32)
        { x: -888.74, y: 126.93, z: 252.22, radius: 1.69 }, // LootZones/LootZone380 (scale: X=3.37, Y=3.37, Z=3.37)
        { x: -898.83, y: 126.8, z: 261.63, radius: 1.16 }, // LootZones/LootZone381 (scale: X=2.32, Y=2.32, Z=2.32)
        { x: -907.21, y: 126.8, z: 274.58, radius: 1.16 }, // LootZones/LootZone382 (scale: X=2.32, Y=2.32, Z=2.32)
        { x: -911.08, y: 126.67, z: 281.37, radius: 1.16 }, // LootZones/LootZone383 (scale: X=2.32, Y=2.32, Z=2.32)
        { x: -919.07, y: 126.73, z: 290.6, radius: 1.16 }, // LootZones/LootZone384 (scale: X=2.32, Y=2.32, Z=2.32)
        { x: -912.46, y: 126.73, z: 299.67, radius: 1.33 }, // LootZones/LootZone388 (scale: X=2.66, Y=2.66, Z=2.66)
        { x: -905.91, y: 126.73, z: 282.46, radius: 1.33 }, // LootZones/LootZone389 (scale: X=2.66, Y=2.66, Z=2.66)
        { x: -887.61, y: 126.73, z: 268.67, radius: 1.33 }, // LootZones/LootZone390 (scale: X=2.66, Y=2.66, Z=2.66)
        { x: -893.57, y: 131.28, z: 265.97, radius: 1.33 }, // LootZones/LootZone391 (scale: X=2.66, Y=2.66, Z=2.66)
        { x: -889.4, y: 131.28, z: 246.59, radius: 1.33 }, // LootZones/LootZone392 (scale: X=2.66, Y=2.66, Z=2.66)
        { x: -894.91, y: 131.34, z: 254.05, radius: 1.33 }, // LootZones/LootZone393 (scale: X=2.66, Y=2.66, Z=2.66)
        { x: -899.88, y: 131.34, z: 260.29, radius: 1.33 }, // LootZones/LootZone394 (scale: X=2.66, Y=2.66, Z=2.66)
        { x: -912.95, y: 131.34, z: 278.52, radius: 1.33 }, // LootZones/LootZone395 (scale: X=2.66, Y=2.66, Z=2.66)
        { x: -916.54, y: 131.34, z: 289.52, radius: 1.33 }, // LootZones/LootZone396 (scale: X=2.66, Y=2.66, Z=2.66)
        { x: -900.42, y: 135.77, z: 262.26, radius: 1.33 }, // LootZones/LootZone397 (scale: X=2.66, Y=2.66, Z=2.66)
        { x: -895.86, y: 135.77, z: 250, radius: 1.33 }, // LootZones/LootZone398 (scale: X=2.66, Y=2.66, Z=2.66)
        { x: -942.06, y: 122.33, z: 315.13, radius: 1.16 }, // LootZones/LootZone125 (scale: X=2.32, Y=2.32, Z=2.32)
        { x: -944.61, y: 122.33, z: 323.9, radius: 1.16 }, // LootZones/LootZone126 (scale: X=2.32, Y=2.32, Z=2.32)
        { x: -955.32, y: 122.33, z: 333.48, radius: 1.16 }, // LootZones/LootZone127 (scale: X=2.32, Y=2.32, Z=2.32)
        { x: -961.15, y: 122.33, z: 338.87, radius: 1.16 }, // LootZones/LootZone128 (scale: X=2.32, Y=2.32, Z=2.32)
        { x: -948.76, y: 122.33, z: 352.09, radius: 1.16 }, // LootZones/LootZone403 (scale: X=2.32, Y=2.32, Z=2.32)
        { x: -941.93, y: 122.33, z: 341.67, radius: 1.16 }, // LootZones/LootZone404 (scale: X=2.32, Y=2.32, Z=2.32)
        { x: -941.93, y: 126.86, z: 341.67, radius: 1.16 }, // LootZones/LootZone405 (scale: X=2.32, Y=2.32, Z=2.32)
        { x: -951.43, y: 126.86, z: 351.23, radius: 1.16 }, // LootZones/LootZone406 (scale: X=2.32, Y=2.32, Z=2.32)
        { x: -938.63, y: 126.86, z: 325.21, radius: 1.16 }, // LootZones/LootZone407 (scale: X=2.32, Y=2.32, Z=2.32)
        { x: -947.71, y: 131.3, z: 319.21, radius: 1.16 }, // LootZones/LootZone408 (scale: X=2.32, Y=2.32, Z=2.32)
        { x: -953.11, y: 131.3, z: 336.96, radius: 1.16 }, // LootZones/LootZone409 (scale: X=2.32, Y=2.32, Z=2.32)
        { x: -962.69, y: 131.3, z: 341.16, radius: 1.16 }, // LootZones/LootZone410 (scale: X=2.32, Y=2.32, Z=2.32)
        { x: -932.07, y: 131.3, z: 316.33, radius: 1.16 }, // LootZones/LootZone411 (scale: X=2.32, Y=2.32, Z=2.32)
        { x: -942.06, y: 126.82, z: 311.15, radius: 1.16 }, // LootZones/LootZone399 (scale: X=2.32, Y=2.32, Z=2.32)
        { x: -944.61, y: 126.82, z: 323.9, radius: 1.16 }, // LootZones/LootZone400 (scale: X=2.32, Y=2.32, Z=2.32)
        { x: -955.32, y: 126.82, z: 328.32, radius: 1.16 }, // LootZones/LootZone401 (scale: X=2.32, Y=2.32, Z=2.32)
        { x: -961.15, y: 126.82, z: 344.02, radius: 1.16 }, // LootZones/LootZone402 (scale: X=2.32, Y=2.32, Z=2.32)
        { x: -964.95, y: 122.33, z: 355, radius: 1.16 }, // LootZones/LootZone129 (scale: X=2.32, Y=2.32, Z=2.32)
        { x: -956.7, y: 122.33, z: 362.87, radius: 1.16 }, // LootZones/LootZone130 (scale: X=2.32, Y=2.32, Z=2.32)
        { x: -968.04, y: 122.33, z: 374.67, radius: 1.16 }, // LootZones/LootZone131 (scale: X=2.32, Y=2.32, Z=2.32)
        { x: -971.35, y: 122.33, z: 364.64, radius: 1.16 }, // LootZones/LootZone132 (scale: X=2.32, Y=2.32, Z=2.32)
        { x: -980.03, y: 122.33, z: 374.51, radius: 1.16 }, // LootZones/LootZone133 (scale: X=2.32, Y=2.32, Z=2.32)
        { x: -974.14, y: 122.33, z: 384.06, radius: 1.16 }, // LootZones/LootZone134 (scale: X=2.32, Y=2.32, Z=2.32)
        { x: -988.66, y: 122.33, z: 384.06, radius: 1.16 }, // LootZones/LootZone135 (scale: X=2.32, Y=2.32, Z=2.32)
        { x: -981.84, y: 122.33, z: 393.29, radius: 1.16 }, // LootZones/LootZone136 (scale: X=2.32, Y=2.32, Z=2.32)
        { x: -964.95, y: 126.76, z: 355, radius: 1.16 }, // LootZones/LootZone412 (scale: X=2.32, Y=2.32, Z=2.32)
        { x: -956.7, y: 126.76, z: 362.87, radius: 1.16 }, // LootZones/LootZone413 (scale: X=2.32, Y=2.32, Z=2.32)
        { x: -968.04, y: 126.76, z: 374.67, radius: 1.16 }, // LootZones/LootZone414 (scale: X=2.32, Y=2.32, Z=2.32)
        { x: -979.93, y: 127.5, z: 359.06, radius: 1.16 }, // LootZones/LootZone415 (scale: X=2.32, Y=2.32, Z=2.32)
        { x: -974.14, y: 126.76, z: 384.06, radius: 1.16 }, // LootZones/LootZone417 (scale: X=2.32, Y=2.32, Z=2.32)
        { x: -988.66, y: 126.76, z: 384.06, radius: 1.16 }, // LootZones/LootZone418 (scale: X=2.32, Y=2.32, Z=2.32)
        { x: -975.77, y: 122.33, z: 288.53, radius: 1.16 }, // LootZones/LootZone137 (scale: X=2.32, Y=2.32, Z=2.32)
        { x: -991.79, y: 122.54, z: 279.42, radius: 1.16 }, // LootZones/LootZone138 (scale: X=2.32, Y=2.32, Z=2.32)
        { x: -988.9, y: 122.54, z: 294.06, radius: 1.16 }, // LootZones/LootZone139 (scale: X=2.32, Y=2.32, Z=2.32)
        { x: -992.83, y: 122.54, z: 301.82, radius: 1.16 }, // LootZones/LootZone140 (scale: X=2.32, Y=2.32, Z=2.32)
        { x: -1000.82, y: 122.54, z: 312.25, radius: 1.16 }, // LootZones/LootZone141 (scale: X=2.32, Y=2.32, Z=2.32)
        { x: -1010.46, y: 122.54, z: 303.6, radius: 1.16 }, // LootZones/LootZone460 (scale: X=2.32, Y=2.32, Z=2.32)
        { x: -1005.52, y: 122.54, z: 298.23, radius: 1.16 }, // LootZones/LootZone461 (scale: X=2.32, Y=2.32, Z=2.32)
        { x: -1005.52, y: 126.91, z: 298.23, radius: 1.16 }, // LootZones/LootZone462 (scale: X=2.32, Y=2.32, Z=2.32)
        { x: -1016.18, y: 126.91, z: 314.5, radius: 1.16 }, // LootZones/LootZone463 (scale: X=2.32, Y=2.32, Z=2.32)
        { x: -1042.05, y: 122.13, z: 294.88, radius: 1.16 }, // LootZones/LootZone482 (scale: X=2.32, Y=2.32, Z=2.32)
        { x: -1039.21, y: 122.13, z: 299.29, radius: 1.16 }, // LootZones/LootZone483 (scale: X=2.32, Y=2.32, Z=2.32)
        { x: -1013.8, y: 131.53, z: 318.86, radius: 1.16 }, // LootZones/LootZone464 (scale: X=2.32, Y=2.32, Z=2.32)
        { x: -1011.63, y: 131.53, z: 329.18, radius: 1.16 }, // LootZones/LootZone465 (scale: X=2.32, Y=2.32, Z=2.32)
        { x: -988.63, y: 131.53, z: 303.46, radius: 1.16 }, // LootZones/LootZone466 (scale: X=2.32, Y=2.32, Z=2.32)
        { x: -998.38, y: 131.53, z: 311.66, radius: 1.16 }, // LootZones/LootZone469 (scale: X=2.32, Y=2.32, Z=2.32)
        { x: -1006.38, y: 131.53, z: 321.34, radius: 1.16 }, // LootZones/LootZone470 (scale: X=2.32, Y=2.32, Z=2.32)
        { x: -1010.26, y: 136.07, z: 323.29, radius: 1.16 }, // LootZones/LootZone471 (scale: X=2.32, Y=2.32, Z=2.32)
        { x: -996.33, y: 136.07, z: 313.27, radius: 1.16 }, // LootZones/LootZone472 (scale: X=2.32, Y=2.32, Z=2.32)
        { x: -982.3, y: 131.53, z: 286.08, radius: 1.16 }, // LootZones/LootZone467 (scale: X=2.32, Y=2.32, Z=2.32)
        { x: -992.65, y: 131.53, z: 272.29, radius: 1.16 }, // LootZones/LootZone468 (scale: X=2.32, Y=2.32, Z=2.32)
        { x: -1013.41, y: 122.54, z: 322.99, radius: 1.16 }, // LootZones/LootZone142 (scale: X=2.32, Y=2.32, Z=2.32)
        { x: -975.77, y: 126.86, z: 288.53, radius: 1.16 }, // LootZones/LootZone454 (scale: X=2.32, Y=2.32, Z=2.32)
        { x: -991.79, y: 126.92, z: 279.42, radius: 1.16 }, // LootZones/LootZone455 (scale: X=2.32, Y=2.32, Z=2.32)
        { x: -988.9, y: 126.92, z: 294.06, radius: 1.16 }, // LootZones/LootZone456 (scale: X=2.32, Y=2.32, Z=2.32)
        { x: -992.83, y: 126.92, z: 301.82, radius: 1.16 }, // LootZones/LootZone457 (scale: X=2.32, Y=2.32, Z=2.32)
        { x: -999.25, y: 126.92, z: 310.9, radius: 1.16 }, // LootZones/LootZone458 (scale: X=2.32, Y=2.32, Z=2.32)
        { x: -1013.41, y: 127.01, z: 322.99, radius: 1.16 }, // LootZones/LootZone459 (scale: X=2.32, Y=2.32, Z=2.32)
        { x: -1038.63, y: 122.32, z: 346.35, radius: 1.16 }, // LootZones/LootZone143 (scale: X=2.32, Y=2.32, Z=2.32)
        { x: -1033.51, y: 126.86, z: 353.17, radius: 1.58 }, // LootZones/LootZone484 (scale: X=3.15, Y=3.15, Z=3.15)
        { x: -1048.72, y: 126.86, z: 359.63, radius: 1.16 }, // LootZones/LootZone485 (scale: X=2.32, Y=2.32, Z=2.32)
        { x: -1056.65, y: 126.86, z: 391.1, radius: 1.16 }, // LootZones/LootZone487 (scale: X=2.32, Y=2.32, Z=2.32)
        { x: -1062.71, y: 126.86, z: 399.12, radius: 1.16 }, // LootZones/LootZone488 (scale: X=2.32, Y=2.32, Z=2.32)
        { x: -1071.28, y: 126.86, z: 399.12, radius: 1.16 }, // LootZones/LootZone489 (scale: X=2.32, Y=2.32, Z=2.32)
        { x: -1086.04, y: 126.86, z: 399.12, radius: 1.16 }, // LootZones/LootZone490 (scale: X=2.32, Y=2.32, Z=2.32)
        { x: -1082.64, y: 131.35, z: 396.84, radius: 1.94 }, // LootZones/LootZone491 (scale: X=3.88, Y=3.88, Z=3.88)
        { x: -1057.07, y: 131.35, z: 391.54, radius: 1.94 }, // LootZones/LootZone492 (scale: X=3.88, Y=3.88, Z=3.88)
        { x: -1073.64, y: 135.83, z: 400.37, radius: 1.94 }, // LootZones/LootZone493 (scale: X=3.88, Y=3.88, Z=3.88)
        { x: -1072.21, y: 131.36, z: 400.37, radius: 1.94 }, // LootZones/LootZone494 (scale: X=3.88, Y=3.88, Z=3.88)
        { x: -1050.54, y: 126.86, z: 381.2, radius: 2 }, // LootZones/LootZone486 (scale: X=4.01, Y=4.01, Z=4.01)
        { x: -1029.65, y: 122.32, z: 355.45, radius: 1.16 }, // LootZones/LootZone144 (scale: X=2.32, Y=2.32, Z=2.32)
        { x: -1037.19, y: 122.32, z: 366.79, radius: 1.16 }, // LootZones/LootZone145 (scale: X=2.32, Y=2.32, Z=2.32)
        { x: -1048.27, y: 122.32, z: 360.9, radius: 1.16 }, // LootZones/LootZone146 (scale: X=2.32, Y=2.32, Z=2.32)
        { x: -1051.54, y: 122.32, z: 365.98, radius: 1.16 }, // LootZones/LootZone147 (scale: X=2.32, Y=2.32, Z=2.32)
        { x: -1042.95, y: 122.32, z: 377.46, radius: 1.16 }, // LootZones/LootZone148 (scale: X=2.32, Y=2.32, Z=2.32)
        { x: -1058.28, y: 122.32, z: 374.49, radius: 1.16 }, // LootZones/LootZone149 (scale: X=2.32, Y=2.32, Z=2.32)
        { x: -1049.4, y: 122.32, z: 385.74, radius: 1.16 }, // LootZones/LootZone150 (scale: X=2.32, Y=2.32, Z=2.32)
        { x: -1057.83, y: 122.32, z: 392, radius: 1.16 }, // LootZones/LootZone151 (scale: X=2.32, Y=2.32, Z=2.32)
        { x: -1073.88, y: 122.32, z: 400.98, radius: 1.16 }, // LootZones/LootZone152 (scale: X=2.32, Y=2.32, Z=2.32)
        { x: -1086.6, y: 122.32, z: 399.28, radius: 1.16 }, // LootZones/LootZone153 (scale: X=2.32, Y=2.32, Z=2.32)
        { x: -1002.66, y: 122.38, z: 407.5, radius: 1.49 }, // LootZones/LootZone154 (scale: X=2.99, Y=2.99, Z=2.99)
        { x: -1014.27, y: 122.38, z: 419.28, radius: 1.49 }, // LootZones/LootZone155 (scale: X=2.99, Y=2.99, Z=2.99)
        { x: -1006.23, y: 122.38, z: 426.62, radius: 1.49 }, // LootZones/LootZone156 (scale: X=2.99, Y=2.99, Z=2.99)
        { x: -1021.36, y: 122.38, z: 425.47, radius: 1.29 }, // LootZones/LootZone157 (scale: X=2.58, Y=2.58, Z=2.58)
        { x: -1028.13, y: 122.38, z: 438.08, radius: 1.29 }, // LootZones/LootZone158 (scale: X=2.58, Y=2.58, Z=2.58)
        { x: -1035.76, y: 122.38, z: 447.98, radius: 1.29 }, // LootZones/LootZone159 (scale: X=2.58, Y=2.58, Z=2.58)
        { x: -1045.28, y: 122.38, z: 456.61, radius: 1.29 }, // LootZones/LootZone160 (scale: X=2.58, Y=2.58, Z=2.58)
        { x: -1034.64, y: 122.38, z: 463.61, radius: 1.29 }, // LootZones/LootZone161 (scale: X=2.58, Y=2.58, Z=2.58)
        { x: -1026.96, y: 122.38, z: 455.4, radius: 1.29 }, // LootZones/LootZone426 (scale: X=2.58, Y=2.58, Z=2.58)
        { x: -1022.19, y: 126.82, z: 453.48, radius: 1.29 }, // LootZones/LootZone427 (scale: X=2.58, Y=2.58, Z=2.58)
        { x: -1024.55, y: 126.82, z: 442.63, radius: 1.29 }, // LootZones/LootZone428 (scale: X=2.58, Y=2.58, Z=2.58)
        { x: -1034.08, y: 131.24, z: 442.63, radius: 1.29 }, // LootZones/LootZone429 (scale: X=2.58, Y=2.58, Z=2.58)
        { x: -1037.92, y: 131.24, z: 460.5, radius: 1.29 }, // LootZones/LootZone430 (scale: X=2.58, Y=2.58, Z=2.58)
        { x: -1018.57, y: 131.24, z: 425.76, radius: 1.29 }, // LootZones/LootZone431 (scale: X=2.58, Y=2.58, Z=2.58)
        { x: -1003.21, y: 131.24, z: 413.81, radius: 1.29 }, // LootZones/LootZone432 (scale: X=2.58, Y=2.58, Z=2.58)
        { x: -1002.39, y: 131.24, z: 401.13, radius: 1.29 }, // LootZones/LootZone433 (scale: X=2.58, Y=2.58, Z=2.58)
        { x: -1006.21, y: 135.85, z: 407.92, radius: 1.29 }, // LootZones/LootZone434 (scale: X=2.58, Y=2.58, Z=2.58)
        { x: -1017.4, y: 135.85, z: 415.53, radius: 1.29 }, // LootZones/LootZone435 (scale: X=2.58, Y=2.58, Z=2.58)
        { x: -1005.17, y: 126.93, z: 401.61, radius: 1.49 }, // LootZones/LootZone416 (scale: X=2.99, Y=2.99, Z=2.99)
        { x: -1015.28, y: 126.93, z: 419.88, radius: 1.49 }, // LootZones/LootZone419 (scale: X=2.99, Y=2.99, Z=2.99)
        { x: -1006.23, y: 126.93, z: 426.62, radius: 1.49 }, // LootZones/LootZone420 (scale: X=2.99, Y=2.99, Z=2.99)
        { x: -1021.36, y: 126.93, z: 425.47, radius: 1.29 }, // LootZones/LootZone421 (scale: X=2.58, Y=2.58, Z=2.58)
        { x: -1028.13, y: 126.93, z: 438.08, radius: 1.29 }, // LootZones/LootZone422 (scale: X=2.58, Y=2.58, Z=2.58)
        { x: -1035.76, y: 126.93, z: 447.98, radius: 1.29 }, // LootZones/LootZone423 (scale: X=2.58, Y=2.58, Z=2.58)
        { x: -1043.18, y: 126.93, z: 458.54, radius: 1.29 }, // LootZones/LootZone424 (scale: X=2.58, Y=2.58, Z=2.58)
        { x: -1034.64, y: 126.93, z: 463.61, radius: 1.29 }, // LootZones/LootZone425 (scale: X=2.58, Y=2.58, Z=2.58)
        { x: -1004.67, y: 122.38, z: 467.68, radius: 2.31 }, // LootZones/LootZone162 (scale: X=4.62, Y=4.62, Z=4.62)
        { x: -984.01, y: 122.38, z: 474.2, radius: 2.31 }, // LootZones/LootZone163 (scale: X=4.62, Y=4.62, Z=4.62)
        { x: -980.8, y: 122.38, z: 457.25, radius: 2.31 }, // LootZones/LootZone164 (scale: X=4.62, Y=4.62, Z=4.62)
        { x: -963.34, y: 122.38, z: 449.81, radius: 2.31 }, // LootZones/LootZone165 (scale: X=4.62, Y=4.62, Z=4.62)
        { x: -980.65, y: 122.38, z: 434.67, radius: 1.78 }, // LootZones/LootZone166 (scale: X=3.57, Y=3.57, Z=3.57)
        { x: -1004.67, y: 127.58, z: 467.68, radius: 2.31 }, // LootZones/LootZone436 (scale: X=4.62, Y=4.62, Z=4.62)
        { x: -984.01, y: 127.58, z: 474.2, radius: 2.31 }, // LootZones/LootZone437 (scale: X=4.62, Y=4.62, Z=4.62)
        { x: -980.8, y: 127.58, z: 457.25, radius: 2.31 }, // LootZones/LootZone438 (scale: X=4.62, Y=4.62, Z=4.62)
        { x: -963.34, y: 127.58, z: 449.81, radius: 2.31 }, // LootZones/LootZone439 (scale: X=4.62, Y=4.62, Z=4.62)
        { x: -980.65, y: 127.58, z: 434.67, radius: 1.78 }, // LootZones/LootZone440 (scale: X=3.57, Y=3.57, Z=3.57)
        { x: -1003.79, y: 132.66, z: 466.38, radius: 2.31 }, // LootZones/LootZone441 (scale: X=4.62, Y=4.62, Z=4.62)
        { x: -992.83, y: 127.69, z: 538.69, radius: 2.31 }, // LootZones/LootZone446 (scale: X=4.62, Y=4.62, Z=4.62)
        { x: -995.55, y: 127.69, z: 550.93, radius: 2.31 }, // LootZones/LootZone447 (scale: X=4.62, Y=4.62, Z=4.62)
        { x: -996.98, y: 122.36, z: 545, radius: 1.45 }, // LootZones/LootZone448 (scale: X=2.9, Y=2.9, Z=2.9)
        { x: -994, y: 122.36, z: 534.2, radius: 1.45 }, // LootZones/LootZone449 (scale: X=2.9, Y=2.9, Z=2.9)
        { x: -984.01, y: 132.66, z: 474.2, radius: 2.31 }, // LootZones/LootZone442 (scale: X=4.62, Y=4.62, Z=4.62)
        { x: -980.8, y: 132.66, z: 457.25, radius: 2.31 }, // LootZones/LootZone443 (scale: X=4.62, Y=4.62, Z=4.62)
        { x: -963.34, y: 132.66, z: 449.81, radius: 2.31 }, // LootZones/LootZone444 (scale: X=4.62, Y=4.62, Z=4.62)
        { x: -980.65, y: 132.66, z: 434.67, radius: 1.78 }, // LootZones/LootZone445 (scale: X=3.57, Y=3.57, Z=3.57)
        { x: -1083.9, y: 121.43, z: 350.16, radius: 1.78 }, // LootZones/LootZone167 (scale: X=3.57, Y=3.57, Z=3.57)
        { x: -1082.57, y: 121.43, z: 335.76, radius: 1.78 }, // LootZones/LootZone168 (scale: X=3.57, Y=3.57, Z=3.57)
        { x: -1081.85, y: 121.37, z: 320.85, radius: 1.41 }, // LootZones/LootZone169 (scale: X=2.82, Y=2.82, Z=2.82)
        { x: -1083.22, y: 121.37, z: 310.24, radius: 1.41 }, // LootZones/LootZone170 (scale: X=2.82, Y=2.82, Z=2.82)
        { x: -1082.05, y: 121.37, z: 296.96, radius: 1.41 }, // LootZones/LootZone171 (scale: X=2.82, Y=2.82, Z=2.82)
        { x: -1071.8, y: 121.37, z: 308.17, radius: 1.41 }, // LootZones/LootZone172 (scale: X=2.82, Y=2.82, Z=2.82)
        { x: -1071.8, y: 121.37, z: 319.42, radius: 1.41 }, // LootZones/LootZone173 (scale: X=2.82, Y=2.82, Z=2.82)
        { x: -1071.8, y: 121.37, z: 335.35, radius: 1.41 }, // LootZones/LootZone174 (scale: X=2.82, Y=2.82, Z=2.82)
        { x: -1083.9, y: 125.91, z: 350.16, radius: 1.78 }, // LootZones/LootZone510 (scale: X=3.57, Y=3.57, Z=3.57)
        { x: -1082.57, y: 125.91, z: 335.76, radius: 1.78 }, // LootZones/LootZone511 (scale: X=3.57, Y=3.57, Z=3.57)
        { x: -1081.85, y: 125.84, z: 320.85, radius: 1.41 }, // LootZones/LootZone512 (scale: X=2.82, Y=2.82, Z=2.82)
        { x: -1081.35, y: 125.84, z: 307.91, radius: 1.41 }, // LootZones/LootZone513 (scale: X=2.82, Y=2.82, Z=2.82)
        { x: -1083.86, y: 130.27, z: 332.54, radius: 1.41 }, // LootZones/LootZone516 (scale: X=2.82, Y=2.82, Z=2.82)
        { x: -1079.04, y: 130.42, z: 342.98, radius: 1.41 }, // LootZones/LootZone518 (scale: X=2.82, Y=2.82, Z=2.82)
        { x: -1083.26, y: 134.94, z: 349.18, radius: 1.41 }, // LootZones/LootZone520 (scale: X=2.82, Y=2.82, Z=2.82)
        { x: -1081.17, y: 130.42, z: 349.38, radius: 1.41 }, // LootZones/LootZone519 (scale: X=2.82, Y=2.82, Z=2.82)
        { x: -1082.05, y: 125.95, z: 296.96, radius: 1.41 }, // LootZones/LootZone514 (scale: X=2.82, Y=2.82, Z=2.82)
        { x: -1082.05, y: 134.95, z: 299.37, radius: 1.41 }, // LootZones/LootZone521 (scale: X=2.82, Y=2.82, Z=2.82)
        { x: -1080.98, y: 130.44, z: 300.15, radius: 1.41 }, // LootZones/LootZone522 (scale: X=2.82, Y=2.82, Z=2.82)
        { x: -1082.55, y: 130.44, z: 289.96, radius: 1.41 }, // LootZones/LootZone523 (scale: X=2.82, Y=2.82, Z=2.82)
        { x: -1071.8, y: 125.84, z: 308.17, radius: 1.41 }, // LootZones/LootZone515 (scale: X=2.82, Y=2.82, Z=2.82)
        { x: -1071.8, y: 125.84, z: 335.35, radius: 1.41 }, // LootZones/LootZone517 (scale: X=2.82, Y=2.82, Z=2.82)
        { x: -1071.1, y: 121.37, z: 269.35, radius: 1.41 }, // LootZones/LootZone175 (scale: X=2.82, Y=2.82, Z=2.82)
        { x: -1082.36, y: 121.37, z: 269.35, radius: 1.41 }, // LootZones/LootZone176 (scale: X=2.82, Y=2.82, Z=2.82)
        { x: -1082.36, y: 121.37, z: 256.08, radius: 1.41 }, // LootZones/LootZone177 (scale: X=2.82, Y=2.82, Z=2.82)
        { x: -1082.36, y: 121.37, z: 241, radius: 1.41 }, // LootZones/LootZone178 (scale: X=2.82, Y=2.82, Z=2.82)
        { x: -1072.03, y: 121.45, z: 228.38, radius: 1.41 }, // LootZones/LootZone179 (scale: X=2.82, Y=2.82, Z=2.82)
        { x: -1071.23, y: 121.37, z: 256.92, radius: 1.41 }, // LootZones/LootZone180 (scale: X=2.82, Y=2.82, Z=2.82)
        { x: -1067.89, y: 125.82, z: 269.39, radius: 1.41 }, // LootZones/LootZone495 (scale: X=2.82, Y=2.82, Z=2.82)
        { x: -1081.74, y: 130.29, z: 269.11, radius: 1.41 }, // LootZones/LootZone501 (scale: X=2.82, Y=2.82, Z=2.82)
        { x: -1087.5, y: 130.29, z: 263, radius: 1.41 }, // LootZones/LootZone502 (scale: X=2.82, Y=2.82, Z=2.82)
        { x: -1085.52, y: 130.29, z: 256.44, radius: 1.41 }, // LootZones/LootZone503 (scale: X=2.82, Y=2.82, Z=2.82)
        { x: -1080.93, y: 130.29, z: 245.05, radius: 1.41 }, // LootZones/LootZone504 (scale: X=2.82, Y=2.82, Z=2.82)
        { x: -1074.19, y: 130.29, z: 240.87, radius: 1.41 }, // LootZones/LootZone505 (scale: X=2.82, Y=2.82, Z=2.82)
        { x: -1067.39, y: 130.29, z: 224.06, radius: 1.41 }, // LootZones/LootZone506 (scale: X=2.82, Y=2.82, Z=2.82)
        { x: -1070.63, y: 134.92, z: 227.88, radius: 1.41 }, // LootZones/LootZone507 (scale: X=2.82, Y=2.82, Z=2.82)
        { x: -1087.09, y: 134.92, z: 243.89, radius: 1.41 }, // LootZones/LootZone508 (scale: X=2.82, Y=2.82, Z=2.82)
        { x: -1081.93, y: 134.92, z: 256.35, radius: 1.41 }, // LootZones/LootZone509 (scale: X=2.82, Y=2.82, Z=2.82)
        { x: -1082.36, y: 125.82, z: 268.87, radius: 1.41 }, // LootZones/LootZone496 (scale: X=2.82, Y=2.82, Z=2.82)
        { x: -1082.36, y: 125.82, z: 257.63, radius: 1.41 }, // LootZones/LootZone497 (scale: X=2.82, Y=2.82, Z=2.82)
        { x: -1083.79, y: 125.87, z: 241, radius: 1.41 }, // LootZones/LootZone498 (scale: X=2.82, Y=2.82, Z=2.82)
        { x: -1068.36, y: 125.91, z: 224.52, radius: 1.41 }, // LootZones/LootZone499 (scale: X=2.82, Y=2.82, Z=2.82)
        { x: -1071.23, y: 125.82, z: 256.92, radius: 1.41 }, // LootZones/LootZone500 (scale: X=2.82, Y=2.82, Z=2.82)
        { x: -1040.62, y: 122.36, z: 258.28, radius: 1.41 }, // LootZones/LootZone181 (scale: X=2.82, Y=2.82, Z=2.82)
        { x: -1035.62, y: 122.36, z: 244.53, radius: 1.41 }, // LootZones/LootZone182 (scale: X=2.82, Y=2.82, Z=2.82)
        { x: -1024.77, y: 122.36, z: 252.54, radius: 1.41 }, // LootZones/LootZone183 (scale: X=2.82, Y=2.82, Z=2.82)
        { x: -1035.39, y: 122.36, z: 261.4, radius: 1.41 }, // LootZones/LootZone184 (scale: X=2.82, Y=2.82, Z=2.82)
        { x: -1017.52, y: 122.36, z: 261.48, radius: 1.41 }, // LootZones/LootZone185 (scale: X=2.82, Y=2.82, Z=2.82)
        { x: -1040.62, y: 126.92, z: 258.28, radius: 1.41 }, // LootZones/LootZone473 (scale: X=2.82, Y=2.82, Z=2.82)
        { x: -1035.62, y: 126.92, z: 244.53, radius: 1.41 }, // LootZones/LootZone474 (scale: X=2.82, Y=2.82, Z=2.82)
        { x: -1024.77, y: 126.92, z: 252.54, radius: 1.41 }, // LootZones/LootZone475 (scale: X=2.82, Y=2.82, Z=2.82)
        { x: -1024.77, y: 131.39, z: 252.54, radius: 1.41 }, // LootZones/LootZone478 (scale: X=2.82, Y=2.82, Z=2.82)
        { x: -1021.12, y: 131.39, z: 265.9, radius: 1.41 }, // LootZones/LootZone480 (scale: X=2.82, Y=2.82, Z=2.82)
        { x: -1012.52, y: 131.39, z: 258, radius: 1.41 }, // LootZones/LootZone481 (scale: X=2.82, Y=2.82, Z=2.82)
        { x: -1024.77, y: 135.86, z: 255.28, radius: 1.41 }, // LootZones/LootZone479 (scale: X=2.82, Y=2.82, Z=2.82)
        { x: -1035.39, y: 126.92, z: 261.4, radius: 1.41 }, // LootZones/LootZone476 (scale: X=2.82, Y=2.82, Z=2.82)
        { x: -1017.52, y: 126.92, z: 261.48, radius: 1.41 }, // LootZones/LootZone477 (scale: X=2.82, Y=2.82, Z=2.82)
        { x: -911.93, y: 122.33, z: 182.98, radius: 1.65 }, // LootZones/LootZone79 (scale: X=3.31, Y=3.31, Z=3.31)
        { x: -872.68, y: 122.33, z: 224.32, radius: 1.1 }, // LootZones/LootZone76 (scale: X=2.19, Y=2.19, Z=2.19)
    ]
};

const LOOT_ZONE_COUNT = 341;


// === src\HoH_LootSystem.ts ===




let isLootSystemActive = false;

// Configuration for splitting loot zones across rounds
const ROUND_ZONE_SPLIT_COUNT = 2; // Number of arrays to split into

async function InitializeLootSystem(): Promise<void> {
    console.log("Initializing streamlined loot system with auto-cleanup spawners");

    isLootSystemActive = true;
    await setupSpawnersAndSpawnLoot();
}

async function CleanupLootSystem(): Promise<void> {
    console.log("Cleaning up loot system...");
    isLootSystemActive = false;
    await mod.Wait(0.1);
    console.log("Loot system cleanup completed");
}

async function RestartLootSystem(): Promise<void> {
    console.log("Restarting loot system...");
    await CleanupLootSystem();
    await mod.Wait(1.0);
    await InitializeLootSystem();
}

/**
 * Splits the loot zones array into multiple sub-arrays based on the split count
 * Example: if splitCount is 3, elements at indices 0,3,6,... go to array 0,
 * elements at indices 1,4,7,... go to array 1, etc.
 */
function splitLootZonesByRound(zones: any[], splitCount: number): any[][] {
    const splitArrays: any[][] = [];

    // Initialize empty arrays for each split
    for (let i = 0; i < splitCount; i++) {
        splitArrays.push([]);
    }

    // Distribute zones into the split arrays
    zones.forEach((zone, index) => {
        const arrayIndex = index % splitCount;
        splitArrays[arrayIndex].push(zone);
    });

    return splitArrays;
}

/**
 * Gets the appropriate zone array for the current round
 */
function getZonesForCurrentRound(): any[] {
    const splitZones = splitLootZonesByRound(LOOT_COORDINATES.lootZones, ROUND_ZONE_SPLIT_COUNT);

    //const roundIndex = Math.min(GD.currentRound - 1, 2);
    const zoneArrayIndex = H.GetRandomInt(ROUND_ZONE_SPLIT_COUNT - 1);

    const selectedZones = splitZones[zoneArrayIndex] || [];

    console.log(`Round ${GD.currentRound}: Using zone array ${zoneArrayIndex} with ${selectedZones.length} zones`);

    return selectedZones;
}

async function setupSpawnersAndSpawnLoot(): Promise<void> {
    let totalSpawners = 0;
    let totalSpawned = 0;
    let totalAttempted = 0;
    let totalNullItems = 0;

    console.log(`Current Round: ${GD.currentRound}`);

    // Get the zones for the current round
    const currentRoundZones = getZonesForCurrentRound();

    if (currentRoundZones.length === 0) {
        console.log("No zones available for current round");
        return;
    }

    // Process each zone and spawn loot immediately
    for (const zone of currentRoundZones) {
        // Calculate spawners based on zone size
        const baseSpawners = Math.floor(zone.radius * LOOT_CONFIG.spawnerDensity);
        const spawnerCount = Math.min(
            Math.max(baseSpawners, LOOT_CONFIG.minSpawnersPerZone - (GD.currentRound - 1)),
            LOOT_CONFIG.maxSpawnersPerZone - (GD.currentRound - 1)
        );

        const zoneIndex = currentRoundZones.indexOf(zone) + 1;
        //console.log(`Spawning zone ${zoneIndex} out of ${currentRoundZones.length} (Round ${GD.currentRound})`);

        for (let i = 0; i < spawnerCount; i++) {
            const [x, y, z] = generateSpawnPoint(zone, zone.radius);

            // Spawn the loot spawner
            const spawnerObj = mod.SpawnObject(
                mod.RuntimeSpawn_Common.LootSpawner,
                mod.CreateVector(x, y, z),
                mod.CreateVector(0, Math.random() * 360, 0),
                mod.CreateVector(1, 1, 1)
            );

            const spawnerId = mod.GetObjId(spawnerObj);
            totalSpawners++;

            // Immediately try to spawn loot at this spawner
            const config = LOOT_CONFIG.zoneModifiers.building;
            const spawnChance = LOOT_CONFIG.baseSpawnChance * config.spawnChance;

            if (Math.random() * 100 < spawnChance) {
                totalAttempted++;
                const item = rollLootItem(config);
                if (item) {
                    try {
                        const lootSpawner = mod.GetLootSpawner(spawnerId);
                        mod.SpawnLoot(lootSpawner, item);
                        totalSpawned++;
                    } catch (error) {
                        console.log("Error spawning loot:", error);
                    }
                } else {
                    totalNullItems++;
                }
            }

            // Schedule spawner cleanup after a short delay
            cleanupSpawnerAsync(spawnerObj);

            if (LOOT_CONFIG.forcedSpawnDelay > -1) await mod.Wait(LOOT_CONFIG.forcedSpawnDelay);

            // Rate limiting for performance
            if (totalSpawners % LOOT_CONFIG.maxSpawnersPerTick === 0) {
                await mod.Wait(LOOT_CONFIG.spawnDelay);
            }
        }
    }

    console.log(`Round ${GD.currentRound} loot system initialized: ${totalSpawners} spawners created and cleaned up`);
    console.log(`Spawn Results: ${totalSpawned} items spawned, ${totalAttempted} attempts, ${totalNullItems} null items`);
    console.log(`Spawn chance: ${LOOT_CONFIG.baseSpawnChance}%, Success rate: ${Math.round(totalSpawned / totalSpawners * 100)}%`);
}

// Async function to cleanup spawners with a small delay
async function cleanupSpawnerAsync(spawnerObj: mod.Object): Promise<void> {
    // Wait a small amount to ensure loot spawning completes
    await mod.Wait(LOOT_CONFIG.spawnerSelfDestructDelay);
    try {
        mod.UnspawnObject(spawnerObj);
    } catch (error) {
        console.log("Error unspawning spawner:", error);
    }
}

function generateSpawnPoint(center: any, radius: number): [number, number, number] {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * radius;

    return [
        center.x + Math.cos(angle) * distance,
        center.y,
        center.z + Math.sin(angle) * distance
    ];
}

function rollLootItem(config: any): any {
    // Roll rarity with zone bonus
    let rarityRoll = Math.random() * 100 + config.rarityBonus;
    const rarity = LOOT_CONFIG.rarityRolls.findIndex(threshold => rarityRoll < threshold);
    const rarityIndex = rarity === -1 ? LOOT_CONFIG.rarityRolls.length - 1 : rarity;

    // Roll item type with weapon bias
    let typeRoll = Math.random() * 100 + config.weaponBias;

    let selectedPool = null;
    let poolName = "";

    // Select pool and item (now with 4 categories: Primary, Secondary, Gadgets, Ammo)
    if (typeRoll < LOOT_CONFIG.typeRolls[0]) {
        // Primary weapons (0-25)
        selectedPool = LOOT_POOLS.weapons.primary;
        poolName = "primary";
    } else if (typeRoll < LOOT_CONFIG.typeRolls[1]) {
        // Secondary weapons (25-50)
        selectedPool = LOOT_POOLS.weapons.secondary;
        poolName = "secondary";
    } else if (typeRoll < LOOT_CONFIG.typeRolls[2]) {
        // Gadgets (50-75) - split between throwables and open gadgets
        if (Math.random() < 0.5) {
            selectedPool = LOOT_POOLS.gadgets.throwables;
            poolName = "throwables";
        } else {
            selectedPool = LOOT_POOLS.gadgets.openGadgets;
            poolName = "openGadgets";
        }
    } else {
        // Ammo (75-100)
        selectedPool = LOOT_POOLS.ammo;
        poolName = "ammo";
    }

    const item = rollFromPool(selectedPool, rarityIndex);

    // Debug logging for null items (commented out for performance)
    if (!item) {
        // console.log(`NULL ITEM: ${poolName} rarity=${rarityIndex} poolLength=${selectedPool?.length || 'undefined'}`);
    }

    return item;
}

function rollFromPool(pool: any[][], rarityIndex: number): any {
    if (!pool || rarityIndex >= pool.length) {
        return null;
    }

    const tierItems = pool[rarityIndex];
    if (!tierItems || tierItems.length === 0) {
        return null;
    }

    const randomIndex = Math.floor(Math.random() * tierItems.length);
    const item = tierItems[randomIndex];

    return item;
}

// Utility functions
function isLootSystemRunning(): boolean {
    return isLootSystemActive;
}

function getSpawnerCount(): number {
    // Since spawners are cleaned up immediately, this always returns 0 after initialization
    return 0;
}

// Helper function for working with Vector components as required
export function getVectorComponent(vector: mod.Vector, component: 'x' | 'y' | 'z'): number {
    switch (component) {
        case 'x': return mod.XComponentOf(vector);
        case 'y': return mod.YComponentOf(vector);
        case 'z': return mod.ZComponentOf(vector);
        default: return 0;
    }
}

// Helper function to create vectors from individual components
export function createVectorFromComponents(x: number, y: number, z: number): mod.Vector {
    return mod.CreateVector(x, y, z);
}

export function ClearPlayerInventory(player: mod.Player): void {
    // Remove starting equipment - handle each type separately
    if (mod.HasEquipment(player, mod.Weapons.Sidearm_P18)) {
        mod.RemoveEquipment(player, mod.Weapons.Sidearm_P18);
    }
    if (mod.HasEquipment(player, mod.Gadgets.Class_Repair_Tool)) {
        mod.RemoveEquipment(player, mod.Gadgets.Class_Repair_Tool);
    }
}

// Enhanced inventory clearing function that removes all weapon types
export function ClearAllPlayerWeapons(player: mod.Player): void {
    if (mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier)) return;

    // Remove all primary weapons
    const primaryWeapons = Object.values(mod.Weapons) as mod.Weapons[];
    primaryWeapons.forEach(weapon => {
        try {
            if (mod.HasEquipment(player, weapon)) {
                mod.RemoveEquipment(player, weapon);
            }
        } catch (error) {
            // Ignore errors for weapons that can't be checked/removed
        }
    });

    // Remove all secondary weapons
    const secondaryWeapons = Object.values(mod.Weapons) as mod.Weapons[];
    secondaryWeapons.forEach(weapon => {
        try {
            if (mod.HasEquipment(player, weapon)) {
                mod.RemoveEquipment(player, weapon);
            }
        } catch (error) {
            // Ignore errors
        }
    });

    // Remove all gadgets
    const gadgets = Object.values(mod.Gadgets) as mod.Gadgets[];
    gadgets.forEach(gadget => {
        try {
            if (mod.HasEquipment(player, gadget)) {
                mod.RemoveEquipment(player, gadget);
            }
        } catch (error) {
            // Ignore errors
        }
    });

  // // Remove all throwables
  // const throwables = Object.values(mod.Throwables) as mod.Throwables[];
  // throwables.forEach(throwable => {
  //     try {
  //         if (mod.HasEquipment(player, throwable)) {
  //             mod.RemoveEquipment(player, throwable);
  //         }
  //     } catch (error) {
  //         // Ignore errors
  //     }
  // });
}

// Debug function to see how zones are distributed across rounds
function debugZoneDistribution(): void {
    console.log("=== Zone Distribution Debug ===");
    const splitZones = splitLootZonesByRound(LOOT_COORDINATES.lootZones, ROUND_ZONE_SPLIT_COUNT);

    splitZones.forEach((zones, index) => {
        console.log(`Round ${index + 1}: ${zones.length} zones`);
        console.log(`  First few zones: ${zones.slice(0, 3).map(z => `(${z.x}, ${z.z})`).join(', ')}`);
    });
}

// === src\HoH_PlayerProfile.ts ===




class PlayerProfile {

    player: mod.Player;
    maxHealth: number = 100;
    currency: number = GC.startingCurrency;
    boughtItems: Map<string, number> = new Map();
    hasSetThirdPersonView: boolean = false;
    isADS: boolean = false;

    playerTeamWidget: mod.UIWidget[] | undefined;
    playerSubHeaderWidget: mod.UIWidget[];
    playerCurrencyFeedbackWidget: mod.UIWidget[];
    playerRoundWidget: mod.UIWidget | undefined;
    playerCurrencyWidget: mod.UIWidget;
    playerTeamScoreWidgets: mod.UIWidget[] | undefined;
    playerDeployWidget: mod.UIWidget;
    playerAnnouncementWidget: mod.UIWidget[];
    playerMinorAnnouncementWidget: mod.UIWidget[];
    playerRingInfoWidget: mod.UIWidget[] | undefined;
   // playerStateWidget: mod.UIWidget[];
    playerIndividualTeamScoreWidget: mod.UIWidget[] | undefined;
    playerRemainingPlayersWidget: mod.UIWidget[];
    buyPhaseUI?: BuyPhaseUI;

    //playerHeaderWidget: mod.UIWidget;
    //playerLoadoutWarningWidget: mod.UIWidget;
    versionWidget: mod.UIWidget;
    currencyFeedbackBeingShown: boolean = false;
    currencyFeedbackQueued: boolean = false;
    static playerInstances: mod.Player[] = [];
    static deployedPlayers: mod.Player[] = [];
    static dyingPlayers: mod.Player[] = [];
    static playersInRound: mod.Player[] = [];
    static #allPlayerProfiles: { [key: number]: PlayerProfile } = {}; // probably remove playerprofile here as well when players leave
    playerOnTeamWidget: mod.UIWidget[] = [];

    constructor(player: mod.Player) {
        this.player = player;
        //this.playerHeaderWidget = UI.CreateHeaderUI(this);
        this.playerSubHeaderWidget = UI.CreateSubHeaderUI(this);

        this.playerCurrencyFeedbackWidget = [UI.CreateCurrencyFeedbackUI(this), UI.CreateCurrencyFadeLineUI(true, this), UI.CreateCurrencyFadeLineUI(false, this)];
        this.playerDeployWidget = UI.CreateDeployUI(this);
        this.playerAnnouncementWidget = UI.CreateAnnouncementHeaderUI(this);
        this.playerMinorAnnouncementWidget = UI.CreateMinorAnnouncementUI(this);

        //this.playerStateWidget = UI.CreatePlayerStateUI(this);

        this.playerRemainingPlayersWidget = UI.CreateRemainingPlayersUI(this);
        //this.playerLoadoutWarningWidget = UI.CreateLoadoutWarningUI(this);
        this.versionWidget = UI.CreateVersionUI(this);
        this.buyPhaseUI = new BuyPhaseUI(this);
        this.buyPhaseUI.createUI();

        this.playerCurrencyWidget = UI.CreateCurrencyUI(this);

        this.playerRingInfoWidget = UI.CreateRingInfoUI(this);
        this.playerTeamWidget = UI.CreatePlayerTeamUI(this);

        if (GC.maxRounds > 1) {
            this.playerTeamScoreWidgets = UI.CreateTeamScoreUI(this);
            this.playerRoundWidget = UI.CreateRoundUI(this);
            this.playerIndividualTeamScoreWidget = UI.CreateIndividualTeamScoreUI(this);
        } else {
            this.playerOnTeamWidget = UI.CreatePlayerOnTeamUI(this)
        }

        PlayerProfile.playerInstances.push(this.player);
        PlayerProfile.HandleIfTheGameIsFull();
    }

    static Get(player: mod.Player): PlayerProfile | undefined {
        if (mod.GetObjId(player) > -1) {
            let index = mod.GetObjId(player);
            let playerProfile = this.#allPlayerProfiles[index];

            // if the player does not have a profile, create and initialize one
            if (!playerProfile) {
                playerProfile = new PlayerProfile(player);

                this.#allPlayerProfiles[index] = playerProfile;
            }
            return playerProfile;
        }
    }

    static DeletePlayerWidgets(eventNumber: number) {

        const playerProf = this.#allPlayerProfiles[eventNumber]
        if (playerProf) {

            playerProf.buyPhaseUI?.Delete()

            const mergedWidgets = [
                ...H.toArray(playerProf.playerTeamWidget),
                ...H.toArray(playerProf.playerSubHeaderWidget),
                ...H.toArray(playerProf.playerCurrencyFeedbackWidget),
                ...H.toArray(playerProf.playerRoundWidget),
                ...H.toArray(playerProf.playerCurrencyWidget),
                ...H.toArray(playerProf.playerTeamScoreWidgets),
                ...H.toArray(playerProf.playerDeployWidget),
                ...H.toArray(playerProf.playerAnnouncementWidget),
                ...H.toArray(playerProf.playerMinorAnnouncementWidget),
                ...H.toArray(playerProf.playerRingInfoWidget),
               // ...H.toArray(playerProf.playerStateWidget),
                ...H.toArray(playerProf.playerIndividualTeamScoreWidget),
                ...H.toArray(playerProf.playerRemainingPlayersWidget),
                ...H.toArray(playerProf.playerOnTeamWidget),
            ];

            for (let index = 0; index < mergedWidgets.length; index++) {
                const element = mergedWidgets[index];
                element && mod.DeleteUIWidget(element)
            }

            delete this.#allPlayerProfiles[eventNumber];
        }

    }



    static HandleIfTheGameIsFull() {
        if (this.playerInstances.length >= 16) {
            mod.DisablePlayerJoin(); // if there's ever a way to undo this, run the check in OnPlayerLeaveGame
        }
    }

    static RemovePlayerFromDeployedPlayers(player: mod.Player) {
        const index = this.deployedPlayers.findIndex(p => mod.GetObjId(p) === mod.GetObjId(player));
        if (index !== -1) {
            this.deployedPlayers.splice(index, 1);
            console.log("Removed player from deployedPlayers: ", mod.GetObjId(player));
        } else {
            //console.warn("Player not found in deployedPlayers: ", mod.GetObjId(player));
        }
    }

    static RemovePlayerFromPlayerInstances(player: mod.Player) {
        const index = this.playerInstances.findIndex(p => mod.GetObjId(p) === mod.GetObjId(player));
        if (index !== -1) {
            this.playerInstances.splice(index, 1);
            console.log("Removed player from playerInstances: ", mod.GetObjId(player));
        } else {
            //console.warn("Player not found in playerInstances: ", mod.GetObjId(player));
        }
    }

    static RemovePlayerFromPlayersInRound(player: mod.Player) {
        const index = this.playersInRound.findIndex(p => mod.GetObjId(p) === mod.GetObjId(player));
        if (index !== -1) {
            this.playersInRound.splice(index, 1);
            console.log("Removed player from playersInRound: ", mod.GetObjId(player));
        } else {
            //console.warn("Player not found in playersInRound: ", mod.GetObjId(player));
        }
    }
}

// === src\HoH_RingOfFireAnalogue.ts ===




export function OnRingOfFireZoneSizeChange(eventRingOfFire: mod.RingOfFire, eventNumber: number) {

    console.log("CurrentRing" + RingOfFireController.CurrentRing)
    console.log("Time" + RingOfFireController.Time)
    console.log("Event number" + eventNumber)


    RingOfFireController.setTime()

}


class RingOfFireController {
    // The single instance of the class
    private static instance: RingOfFireController;

    #ringOfFireObjectID = 1;

    static shrinkTime = [35, 35, 35, 35, 35, 35, 35, 35];
    static stableTime = [35, 35, 35, 35, 35, 35, 35, 35];

    static ringOfFireDamage = 900

    static CurrentRing = 0;
    static Time: number = 35

    static setTime() {
        this.CurrentRing += 1
        this.Time = this.shrinkTime[this.CurrentRing % this.shrinkTime.length]
    }

    // Private constructor to prevent instantiation from outside
    private constructor() {
        // Initialization code here
        console.log('RingOfFireController instance created!');
    }

    // Static method to get the single instance of the class
    public static getInstance(): RingOfFireController {
        if (!RingOfFireController.instance) {
            RingOfFireController.instance = new RingOfFireController();
        }
        return RingOfFireController.instance;
    }

    // Example method to demonstrate functionality

    public startRing(): void {
        console.log("Starting ring of fire")
        // this.setStableTime(1000000)
        mod.RingOfFireStart(mod.GetRingOfFire(this.#ringOfFireObjectID));
        mod.SetRingOfFireDamageAmount(mod.GetRingOfFire(this.#ringOfFireObjectID), RingOfFireController.ringOfFireDamage)
        this.runShrinkSequence()
    }



    public stopRing(): void {
        mod.UnspawnObject(mod.GetRingOfFire(this.#ringOfFireObjectID))
    }

    public setStableTime(time: number): void {
        mod.SetRingOfFireStableTime(mod.GetRingOfFire(this.#ringOfFireObjectID), time);
    }

    public setDamageAmount(damageAmount: number): void {
        mod.SetRingOfFireDamageAmount(mod.GetRingOfFire(this.#ringOfFireObjectID), damageAmount);
    }

    public async runShrinkSequence() {

        while (true) {

            if (RingOfFireController.CurrentRing >= RingOfFireController.shrinkTime.length) {
                UI.UpdateUIForWidgetType(pp => pp.playerRingInfoWidget && pp.playerRingInfoWidget[2], PlayerProfile.playerInstances, H.MakeMessage(mod.stringkeys.ringFireFinalRingSub), true);
                return
            }

            if (RingOfFireController.Time > 0) {

                RingOfFireController.Time -= 0.1;

                if (RingOfFireController.Time > 0) {
                    const formattedTime = H.FormatTime(RingOfFireController.Time);
                    UI.UpdateUIForWidgetType(pp => pp.playerRingInfoWidget && pp.playerRingInfoWidget[2], PlayerProfile.playerInstances, H.MakeMessage(mod.stringkeys.ringInfoRingShrinking), false);
                    UI.UpdateUIForWidgetType(pp => pp.playerRingInfoWidget && pp.playerRingInfoWidget[0], PlayerProfile.playerInstances, H.MakeMessage(mod.stringkeys.ringInfoRingShrinksIn), true);
                    UI.UpdateUIForWidgetType(pp => pp.playerRingInfoWidget && pp.playerRingInfoWidget[1], PlayerProfile.playerInstances, H.MakeMessage(mod.stringkeys.timerCounterThing, formattedTime[0], formattedTime[1], formattedTime[2]), true);
                } else {
                    UI.UpdateUIForWidgetType(pp => pp.playerRingInfoWidget, PlayerProfile.playerInstances, H.MakeMessage(mod.stringkeys.ringInfoRingShrinking), false);
                    UI.UpdateUIForWidgetType(pp => pp.playerRingInfoWidget && pp.playerRingInfoWidget[2], PlayerProfile.playerInstances, H.MakeMessage(mod.stringkeys.ringInfoRingShrinking), true);
                    UI.UpdateUIForWidgetType(pp => pp.playerRingInfoWidget && pp.playerRingInfoWidget.slice(3), PlayerProfile.playerInstances, undefined, true);
                }

            }


            await mod.Wait(0.1);
        }




    }


}


class RingOfFireAnalogue {
    static timeTilNextShrink: number = 35;
    static baseTimeTilNextShrink: number = 45;
    static safeTimeTillNextShrink: number = 35;
    static ringRadii: number[] = [300, 150, 75, 37.5, 18.75];
    static possibleRingFieldOrigin: mod.Vector = mod.CreateVector(-1000.449, 120.386, 279.615); // map midpoint
    static currentRingRadius: number = this.ringRadii[0];
    static targetRingRadius: number = this.ringRadii[0];
    static currentRingPosition: mod.Vector = mod.CreateVector(0, 0, 0);
    static targetRingPosition: mod.Vector = mod.CreateVector(0, 0, 0);
    static currentRingStage: number = 0;
    static timeAtLastTick: number = Date.now();
    static sequentialRingOriginFactor: number = 0.75;

    static shrinkSpeed: number = 0.5;

    static isShrinking: boolean = false;
    static shrinkComplete: boolean = false;
    static moveComplete: boolean = false;

    static Initialize() {
        this.currentRingRadius = this.ringRadii[0];
        this.currentRingStage = 0;
        this.currentRingPosition = this.GetRandomRingPosition(true);
        this.timeTilNextShrink = this.safeTimeTillNextShrink;
        this.isShrinking = false;
        this.shrinkComplete = false;
        this.moveComplete = false;
        this.timeAtLastTick = Date.now();
        this.Update();
    }

    static async Update() {
        while (GD.roundActive) {
            //  this.CheckToDamagePlayers();
            this.CheckToShrinkRing();
            //  this.RingVisualization();
            await mod.Wait(0.1);
        }
    }

    static async CheckToDamagePlayers() {
        // Create a copy of the array and filter out invalid players
        const validPlayers = PlayerProfile.playersInRound.filter(player => {
            try {
                return player && mod.IsPlayerValid(player);
            } catch {
                return false;
            }
        });

        // Update the original array with only valid players
        PlayerProfile.playersInRound = validPlayers;

        // Now safely check each valid player
        validPlayers.forEach(element => {
            try {
                // Double-check validity and that player is alive before getting position
                if (mod.IsPlayerValid(element) && mod.GetSoldierState(element, mod.SoldierStateBool.IsAlive)) {
                    const playerPosition = mod.GetSoldierState(element, mod.SoldierStateVector.GetPosition);
                    const distanceFromRing = mod.DistanceBetween(playerPosition, this.currentRingPosition);

                    if (distanceFromRing > this.currentRingRadius) {
                        mod.DealDamage(element, 1);
                    }
                }
            } catch (error) {
                console.log(`Error processing player ${mod.GetObjId(element)} in ring damage check: ${error}`);
                // Remove the problematic player from all arrays
                PlayerProfile.RemovePlayerFromPlayersInRound(element);
            }
        });
    }

    static async CheckToShrinkRing() {
        if (!this.isShrinking && this.currentRingStage < this.ringRadii.length - 1) {
            // Timer countdown logic
            this.timeTilNextShrink -= 0.1;
            const formattedTime = H.FormatTime(this.timeTilNextShrink);
            UI.UpdateUIForWidgetType(pp => pp.playerRingInfoWidget && pp.playerRingInfoWidget[2], PlayerProfile.playerInstances, H.MakeMessage(mod.stringkeys.ringInfoRingShrinking), false);
            UI.UpdateUIForWidgetType(pp => pp.playerRingInfoWidget && pp.playerRingInfoWidget[0], PlayerProfile.playerInstances, H.MakeMessage(mod.stringkeys.ringInfoRingShrinksIn), true);
            UI.UpdateUIForWidgetType(pp => pp.playerRingInfoWidget && pp.playerRingInfoWidget[1], PlayerProfile.playerInstances, H.MakeMessage(mod.stringkeys.timerCounterThing, formattedTime[0], formattedTime[1], formattedTime[2]), true);
        } else if (this.currentRingStage >= this.ringRadii.length - 1) {
            UI.UpdateUIForWidgetType(pp => pp.playerRingInfoWidget && pp.playerRingInfoWidget[2], PlayerProfile.playerInstances, H.MakeMessage(mod.stringkeys.ringFireFinalRingSub), true);
        }

        // Add bounds check here too
        if (!this.isShrinking && this.timeTilNextShrink <= 0 && this.currentRingStage < this.ringRadii.length - 1) {
            //UI.ShowAnnouncement(H.MakeMessage(mod.stringkeys.annRingShrinking));
            UI.UpdateUIForWidgetType(pp => pp.playerRingInfoWidget, PlayerProfile.playerInstances, H.MakeMessage(mod.stringkeys.ringInfoRingShrinking), false);
            UI.UpdateUIForWidgetType(pp => pp.playerRingInfoWidget && pp.playerRingInfoWidget[2], PlayerProfile.playerInstances, H.MakeMessage(mod.stringkeys.ringInfoRingShrinking), true);
            UI.UpdateUIForWidgetType(pp => pp.playerRingInfoWidget && pp.playerRingInfoWidget.slice(3), PlayerProfile.playerInstances, undefined, true);
            this.isShrinking = true;
            this.ShrinkRing();
            this.MoveRing();
            this.currentRingStage++;
        } else if (this.isShrinking && this.shrinkComplete && this.moveComplete) {
            this.timeTilNextShrink = this.safeTimeTillNextShrink;
            //console.log("shrink complete");
            //UI.ShowAnnouncement(H.MakeMessage(mod.stringkeys.annRingOnStandby));
            this.isShrinking = false;
            this.shrinkComplete = false;
            this.moveComplete = false;
        }
    }

    static async ShrinkRing() {
        // Add safety check
        if (this.currentRingStage >= this.ringRadii.length - 1) {
            this.shrinkComplete = true;
            return;
        }

        //UI.UpdateUIForWidgetType(pp => pp.playerHeaderWidget, PlayerProfile.playerInstances, H.MakeMessage(mod.stringkeys.ringFireWarning), true);
        //UI.UpdateUIForWidgetType(pp => pp.playerSubHeaderWidget, PlayerProfile.playerInstances, H.MakeMessage(mod.stringkeys.ringFireActiveSub), true);
        this.targetRingRadius = this.ringRadii[this.currentRingStage + 1];

        while (true) {
            if ((this.currentRingRadius - this.targetRingRadius) > 2) {
                this.currentRingRadius = H.LerpConstant(this.currentRingRadius, this.targetRingRadius, this.shrinkSpeed, this.shrinkSpeed);
                //console.log("current ring radius: " + this.currentRingRadius + " target ring radius: " + this.targetRingRadius)
                await mod.Wait(0.1);
            } else {
                this.shrinkComplete = true;
                break;
            }
        }
    }

    static async MoveRing() {
        this.targetRingPosition = this.GetRandomRingPosition(false);
        while (true) {
            if (mod.DistanceBetween(this.currentRingPosition, this.targetRingPosition) > 2) {
                //console.log("distance between: " + mod.DistanceBetween(this.currentRingPosition, this.targetRingPosition) + " and current ring position: " + mod.XComponentOf(this.currentRingPosition) + mod.YComponentOf(this.currentRingPosition) + mod.ZComponentOf(this.currentRingPosition) + " and target ring position: " + mod.XComponentOf(this.targetRingPosition) + mod.YComponentOf(this.targetRingPosition) + mod.ZComponentOf(this.targetRingPosition))
                this.currentRingPosition = H.LerpVectorConstant(this.currentRingPosition, this.targetRingPosition, this.shrinkSpeed, this.shrinkSpeed);
                await mod.Wait(0.1);
            } else {
                this.moveComplete = true;
                break;
            }
        }
    }

    static GetRandomRingPosition(origin: boolean): mod.Vector {
        return mod.Add(
            origin ? this.possibleRingFieldOrigin : this.currentRingPosition,
            mod.CreateVector(
                H.GetRandomInt(this.ringRadii[this.currentRingStage + 1]) - (this.ringRadii[this.currentRingStage + 1] * this.sequentialRingOriginFactor),
                0,
                H.GetRandomInt(this.ringRadii[this.currentRingStage + 1]) - (this.ringRadii[this.currentRingStage + 1] * this.sequentialRingOriginFactor)
            )
        );
    }

    static RingVisualization() {
        // Calculate how many icons to place around the ring perimeter
        const iconCount = 8; // Number of icons around the ring
        const angleStep = (Math.PI * 2) / iconCount;

        // If we don't have icons yet, create them
        if (this.ringIconObjects.length === 0) {
            this.CreateRingIcons(iconCount);
        }

        // Update positions of existing icons
        for (let i = 0; i < iconCount && i < this.ringIconObjects.length; i++) {
            const angle = i * angleStep;

            // Calculate position on the ring edge
            const x = mod.XComponentOf(this.currentRingPosition) + Math.cos(angle) * this.currentRingRadius;
            const y = mod.YComponentOf(this.currentRingPosition);
            const z = mod.ZComponentOf(this.currentRingPosition) + Math.sin(angle) * this.currentRingRadius;

            const iconPosition = mod.CreateVector(x, y, z);

            try {
                const iconObject = this.ringIconObjects[i];

                // Check if it's a spawned object or custom world icon
                if (this.isSpawnedObject(iconObject)) {
                    // For spawned objects, get the WorldIcon and update position
                    const objectId = mod.GetObjId(iconObject);
                    const worldIcon = mod.GetWorldIcon(objectId);
                    mod.SetWorldIconPosition(worldIcon, iconPosition);
                } else {
                    // For custom world icons, update position directly
                    mod.SetWorldIconPosition(iconObject, iconPosition);
                }
            } catch (error) {
                //console.log(`Error updating ring icon ${i}: ${error}`);
            }
        }
    }

    static CreateRingIcons(iconCount: number) {
        for (let i = 0; i < iconCount; i++) {
            try {
                // Try to spawn a WorldIcon directly from RuntimeSpawn_Common
                const worldIconObj = mod.SpawnObject(
                    mod.RuntimeSpawn_Common.WorldIcon,
                    mod.CreateVector(0, 0, 0), // Initial position, will be updated
                    mod.CreateVector(0, 0, 0),
                    mod.CreateVector(1, 1, 1)
                );

                // Get the object ID first, then get the WorldIcon
                const objectId = mod.GetObjId(worldIconObj);
                const worldIcon = mod.GetWorldIcon(objectId);
                mod.SetWorldIconImage(worldIcon, mod.WorldIconImages.Hazard);
                mod.SetWorldIconColor(worldIcon, mod.CreateVector(1, 0.2, 0)); // Orange/red color
                mod.EnableWorldIconImage(worldIcon, true);
                mod.EnableWorldIconText(worldIcon, false);

                this.ringIconObjects.push(worldIconObj);

            } catch (error) {
                // If RuntimeSpawn_Common.WorldIcon doesn't work, use custom world icons
                // Cycle through custom world icon IDs (400-407)
                const customIconId = 400 + (i % 8); // Use 8 different icons cyclically

                const customIconObj = mod.GetWorldIcon(customIconId);
                if (customIconObj) {
                    mod.SetWorldIconImage(customIconObj, mod.WorldIconImages.Hazard);
                    mod.SetWorldIconColor(customIconObj, mod.CreateVector(1, 0.2, 0));
                    mod.EnableWorldIconImage(customIconObj, true);
                    mod.EnableWorldIconText(customIconObj, false);

                    this.ringIconObjects.push(customIconObj);
                }
            }
        }
    }

    static isSpawnedObject(iconObject: any): boolean {
        try {
            // Try to get object ID - if this works, it's a spawned object
            mod.GetObjId(iconObject);
            return true;
        } catch (error) {
            // If GetObjId fails, it's probably a custom WorldIcon
            return false;
        }
    }

    static ringIconObjects: any[] = [];

    static ClearRingIcons() {
        // Remove all existing ring icons
        this.ringIconObjects.forEach(iconObject => {
            try {
                if (this.isSpawnedObject(iconObject)) {
                    mod.UnspawnObject(iconObject);
                } else {
                    // For custom world icons, just hide them
                    mod.EnableWorldIconImage(iconObject, false);
                }
            } catch (error) {
                // Object might already be destroyed, ignore
            }
        });
        this.ringIconObjects = [];
    }
}

// === src\HoH_ShopInventory.ts ===
class ItemListings {
    static weaponItems = [
        { nameKey: "M4A1", price: 200, amount: 1, type: "weapon", item: mod.Weapons.Carbine_M4A1 },
        { nameKey: "L85A3", price: 200, type: "weapon", item: mod.Weapons.AssaultRifle_L85A3 },
        { nameKey: "AK205", price: 200, type: "weapon", item: mod.Weapons.Carbine_AK_205 },
        { nameKey: "B36A4", price: 200, type: "weapon", item: mod.Weapons.AssaultRifle_B36A4 },
        { nameKey: "M433", price: 200, type: "weapon", item: mod.Weapons.AssaultRifle_M433 },
        { nameKey: "GRT_BC", price: 200, type: "weapon", item: mod.Weapons.Carbine_GRT_BC },
        { nameKey: "SCW_10", price: 200, type: "weapon", item: mod.Weapons.SMG_SCW_10 },
        { nameKey: "UMG_40", price: 200, type: "weapon", item: mod.Weapons.SMG_UMG_40 },
        { nameKey: "PW7A2", price: 150, type: "weapon", item: mod.Weapons.SMG_PW7A2 },
        { nameKey: "PW5A3", price: 180, type: "weapon", item: mod.Weapons.SMG_PW5A3 },
        { nameKey: "AK4D", price: 150, type: "weapon", item: mod.Weapons.AssaultRifle_AK4D },
        { nameKey: "NVO_228E", price: 150, type: "weapon", item: mod.Weapons.AssaultRifle_NVO_228E },
        { nameKey: "SOR_556", price: 150, type: "weapon", item: mod.Weapons.AssaultRifle_SOR_556_Mk2 },
        { nameKey: "KORD6P67", price: 150, type: "weapon", item: mod.Weapons.AssaultRifle_KORD_6P67 },
        { nameKey: "M417_A2", price: 150, type: "weapon", item: mod.Weapons.Carbine_M417_A2 },
        { nameKey: "SOR_300SC", price: 150, type: "weapon", item: mod.Weapons.Carbine_SOR_300SC },
        { nameKey: "QBZ_192", price: 150, type: "weapon", item: mod.Weapons.Carbine_QBZ_192 },
        { nameKey: "USG_90", price: 150, type: "weapon", item: mod.Weapons.SMG_USG_90 },
        { nameKey: "M39EMR", price: 150, type: "weapon", item: mod.Weapons.DMR_M39_EMR },
        { nameKey: "SVDM", price: 150, type: "weapon", item: mod.Weapons.DMR_SVDM },
        { nameKey: "LMR27", price: 150, type: "weapon", item: mod.Weapons.DMR_LMR27 },
        { nameKey: "SVK_86", price: 150, type: "weapon", item: mod.Weapons.DMR_SVK_86 },
        { nameKey: "DSR_IAR", price: 150, type: "weapon", item: mod.Weapons.LMG_DRS_IAR },
        { nameKey: "KTS100", price: 150, type: "weapon", item: mod.Weapons.LMG_KTS100_MK8 },
        { nameKey: "L110", price: 150, type: "weapon", item: mod.Weapons.LMG_L110 },
        { nameKey: "RPKM", price: 150, type: "weapon", item: mod.Weapons.LMG_RPKM },
        { nameKey: "M250", price: 150, type: "weapon", item: mod.Weapons.LMG_M250 },
        { nameKey: "M240L", price: 150, type: "weapon", item: mod.Weapons.LMG_M240L },
        { nameKey: "M60", price: 150, type: "weapon", item: mod.Weapons.LMG_M_60 },
        { nameKey: "M123K", price: 150, type: "weapon", item: mod.Weapons.LMG_M123K },
        { nameKey: "PSR", price: 150, type: "weapon", item: mod.Weapons.Sniper_PSR },
        { nameKey: "SV98", price: 150, type: "weapon", item: mod.Weapons.Sniper_SV_98 },
        { nameKey: "M2010_ESR", price: 150, type: "weapon", item: mod.Weapons.Sniper_M2010_ESR },
        { nameKey: "M87A1", price: 150, type: "weapon", item: mod.Weapons.Shotgun_M87A1 },
        { nameKey: "M1014", price: 150, type: "weapon", item: mod.Weapons.Shotgun_M1014 },
    ];

    static gadgetItems = [
        // Basic support equipment
        { nameKey: "RepairTool", price: 50, type: "gadget", item: mod.Gadgets.Class_Repair_Tool },
        { nameKey: "DeployableCover", price: 75, type: "gadget", item: mod.Gadgets.Deployable_Cover },
        { nameKey: "SupplyPouch", price: 60, type: "gadget", item: mod.Gadgets.Misc_Supply_Pouch },
        { nameKey: "MotionSensor", price: 80, type: "gadget", item: mod.Gadgets.Class_Motion_Sensor },
        { nameKey: "AdrenalineInjector", price: 70, type: "gadget", item: mod.Gadgets.Class_Adrenaline_Injector },
        { nameKey: "SupplyBag", price: 90, type: "gadget", item: mod.Gadgets.Class_Supply_Bag },
        { nameKey: "DeployBeacon", price: 65, type: "gadget", item: mod.Gadgets.Deployable_Deploy_Beacon },

        // Medical and detection gear
        { nameKey: "Defibrillator", price: 120, type: "gadget", item: mod.Gadgets.Misc_Defibrillator },
        { nameKey: "TracerDart", price: 60, type: "gadget", item: mod.Gadgets.Misc_Tracer_Dart },
        { nameKey: "ReconDrone", price: 150, type: "gadget", item: mod.Gadgets.Deployable_Recon_Drone },
        { nameKey: "LaserDesignator", price: 130, type: "gadget", item: mod.Gadgets.Misc_Laser_Designator },
        { nameKey: "TripwireSensorMine", price: 85, type: "gadget", item: mod.Gadgets.Misc_Tripwire_Sensor_AV_Mine },
        { nameKey: "PressureMine", price: 95, type: "gadget", item: mod.Gadgets.Misc_Anti_Vehicle_Mine },
        { nameKey: "GrenadeInterceptSystem", price: 180, type: "gadget", item: mod.Gadgets.Deployable_Grenade_Intercept_System },

        // Advanced equipment and launchers
        { nameKey: "UnguidedRocketLauncher", price: 250, type: "gadget", item: mod.Gadgets.Launcher_Unguided_Rocket },
        { nameKey: "LongRangeLauncher", price: 280, type: "gadget", item: mod.Gadgets.Launcher_Long_Range },
        { nameKey: "MotionSensorMine", price: 110, type: "gadget", item: mod.Gadgets.Misc_Acoustic_Sensor_AV_Mine },
        { nameKey: "AntiPersonnelMine", price: 120, type: "gadget", item: mod.Gadgets.Misc_Anti_Personnel_Mine },
        { nameKey: "HandheldBreechingProjectileLauncher", price: 200, type: "gadget", item: mod.Gadgets.Launcher_Breaching_Projectile },
        { nameKey: "DemolitionCharge", price: 160, type: "gadget", item: mod.Gadgets.Misc_Demolition_Charge },
        { nameKey: "SmokeGrenadeLauncher", price: 140, type: "gadget", item: mod.Gadgets.Launcher_Smoke_Grenade },
        { nameKey: "AssaultLadder", price: 80, type: "gadget", item: mod.Gadgets.Misc_Assault_Ladder },

        // Heavy launchers and advanced systems
        { nameKey: "AimGuidedLauncher", price: 350, type: "gadget", item: mod.Gadgets.Launcher_Aim_Guided },
        { nameKey: "PortableMortar", price: 400, type: "gadget", item: mod.Gadgets.Deployable_Portable_Mortar },
        { nameKey: "HighExplosiveLauncher", price: 320, type: "gadget", item: mod.Gadgets.Launcher_High_Explosive },
        { nameKey: "ThermobaricGrenadeLauncher", price: 380, type: "gadget", item: mod.Gadgets.Launcher_Thermobaric_Grenade },
        { nameKey: "AutoGuidedLauncher", price: 420, type: "gadget", item: mod.Gadgets.Launcher_Auto_Guided },
        { nameKey: "FlameRoundShotgun", price: 300, type: "gadget", item: mod.Gadgets.Misc_Incendiary_Round_Shotgun },

        // Top tier equipment
        { nameKey: "EODBot", price: 500, type: "gadget", item: mod.Gadgets.Deployable_EOD_Bot },
        { nameKey: "IncendiaryAirburstWeaponSystem", price: 450, type: "gadget", item: mod.Gadgets.Throwable_Incendiary_Grenade },

        { nameKey: "ThrowableMotionSensor", price: 85, type: "gadget", item: mod.Gadgets.Throwable_Proximity_Detector },

        // Misc Gadgets - Armor
        // { nameKey: "SoftArmor", price: 100, type: "gadget", item: mod.MiscGadgets.SoftArmor },
        { nameKey: "CeramicArmor", price: 200, amount: 1, type: "gadget", item: mod.ArmorTypes.CeramicArmor },

        // Misc Gadgets - Call-ins
     //  { nameKey: "WeaponCallin", price: 180, type: "gadget", item: mod.MiscGadgets.WeaponCallin },
     //  { nameKey: "SmokescreenCallin", price: 200, type: "gadget", item: mod.MiscGadgets.SmokescreenCallin },
     //  { nameKey: "UAVCallin", price: 250, type: "gadget", item: mod.MiscGadgets.UAVCallin },
     //  { nameKey: "AntiVehicleCallin", price: 300, type: "gadget", item: mod.MiscGadgets.AntiVehicleCallin },
     //  { nameKey: "AirStrikeCallin", price: 400, type: "gadget", item: mod.MiscGadgets.AirStrikeCallin },
     //  { nameKey: "PowerWeaponsCallin", price: 450, type: "gadget", item: mod.MiscGadgets.PowerWeaponsCallin },
     //  { nameKey: "ArtilleryStrikeCallin", price: 500, type: "gadget", item: mod.MiscGadgets.ArtilleryStrikeCallin }
    ];

    static consumableItems = [
        // Medical consumables (using appropriate gadgets)
        { nameKey: "armorPlates", price: 100, type: "consumable", item: mod.ArmorTypes.SoftArmor },

        // Throwable consumables
        { nameKey: "SmokeGrenade", price: 35, amount: 1, type: "consumable", item: mod.Gadgets.Throwable_Smoke_Grenade },
        { nameKey: "FragmentationGrenade", price: 75, type: "consumable", item: mod.Gadgets.Throwable_Fragmentation_Grenade },
        { nameKey: "FlashGrenade", price: 40, type: "consumable", item: mod.Gadgets.Throwable_Flash_Grenade },
        { nameKey: "StunGrenade", price: 60, type: "consumable", item: mod.Gadgets.Throwable_Stun_Grenade },
        { nameKey: "IncendiaryGrenade", price: 90, type: "consumable", item: mod.Gadgets.Throwable_Incendiary_Grenade },
        { nameKey: "MiniFragGrenade", price: 50, type: "consumable", item: mod.Gadgets.Throwable_Mini_Frag_Grenade },
        { nameKey: "ThrowingKnife", price: 25, type: "consumable", item: mod.Gadgets.Throwable_Throwing_Knife }
    ];
}

// === src\HoH_SpawningFunctions.ts ===
// Force spawn solution for Battlefield 6 Battle Royale mode
// This replaces the non-functional DeployPlayer() and DeployAllPlayers() functions




/**
 * Forces all players to spawn at their team's designated spawn points
 * This replaces the non-functional DeployAllPlayers()
 */
async function ForceSpawnAllPlayers(): Promise<void> {
    console.log("Force spawning all players...");
    
    // Enable deployment for all players temporarily
    mod.EnableAllPlayerDeploy(true);
    await mod.Wait(1);
    
    // Use PlayerProfile.playerInstances which contains all valid players
    const players = PlayerProfile.playerInstances;
    
    for (const player of players) {
        if (!mod.IsPlayerValid(player)) {
            continue;
        }
        
        // Check if player is dead/in deploy screen (objId > -1 might work but hold off for now)
        const objId = mod.GetObjId(player);
        if (!mod.GetSoldierState(player, mod.SoldierStateBool.IsAlive)) {
            // Get the player's team number using your helper
            const teamNumber = H.GetTeamNumber(player);
            
            if (teamNumber < 1 || teamNumber > 4) {
                continue;
            }
            
            // Spawn the player
            mod.SpawnPlayerFromSpawnPoint(player, teamNumber);
        }
    }
    
    // Wait for all spawns to complete
    await mod.Wait(2);
    
    // Disable deployment again if needed
    if (!GC.allowManualDeploy) {
        //mod.EnableAllPlayerDeploy(false);
    }
    
    console.log("Force spawn complete");
}

// === src\HoH_UI.ts ===






class UI {
    static uniqueNameNumber: number = 0;
    static allyBlue = mod.CreateVector(0.820, 0.843, 0.847);
    static enemyOrange = mod.CreateVector(0.996, 0.482, 0.329);
    static battlefieldWhite = mod.CreateVector(0.733, 0.808, 0.851);
    static battlefieldWhiteAlt = mod.CreateVector(0.820, 0.843, 0.847);
    static battlefieldBlue = mod.CreateVector(0.678, 0.753, 0.800);
    static battlefieldBlueBg = mod.CreateVector(0.8, 0.8, 0.8);
    static battlefieldGrey = mod.CreateVector(0.616, 0.635, 0.647);
    static currencyYellow = mod.CreateVector(0.9, 0.9, 0.4);
    static gradientAlpha: number = 0.04;

    static UpdateUIForWidgetType(
        widgetGetter: (pp: PlayerProfile) => mod.UIWidget | mod.UIWidget[] | undefined,
        arrayOfPlayers: mod.Player[],
        message: mod.Message | undefined,
        show: boolean
    ): void {
        arrayOfPlayers.forEach(player => {
            const playerProfile = PlayerProfile.Get(player);
            if (playerProfile) {
                const widget = widgetGetter(playerProfile);
                if (widget) {
                    if (Array.isArray(widget)) {
                        // Handle array of widgets
                        widget.forEach(w => {
                            if (message && widget.indexOf(w) === 0) {
                                this.UpdateUI(w, message, show);
                            } else {
                                mod.SetUIWidgetVisible(w, show);
                            }
                        });
                    } else {
                        // Handle single widget
                        if (message) {
                            UI.UpdateUI(widget, message, show);
                        } else {
                            mod.SetUIWidgetVisible(widget, show);
                        }
                    }
                }
            }
        });
    }

    static CreateVersionUI(pp: PlayerProfile): mod.UIWidget {
        const coolahhuiname: string = "VersionUI" + UI.uniqueNameNumber++;
        mod.AddUIText(coolahhuiname, mod.CreateVector(0, 0, 0), mod.CreateVector(200, 25, 0), mod.UIAnchor.BottomRight, H.MakeMessage(mod.stringkeys.modversion, VERSION[0], VERSION[1], VERSION[2]), pp.player);
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

    static ShowLoadoutWarningUI(show: boolean, pp: PlayerProfile | undefined) {
        if (pp) {
            //mod.SetUIWidgetVisible(pp.playerLoadoutWarningWidget, show);
        }
    }

    static CreateLoadoutWarningUI(pp: PlayerProfile): mod.UIWidget {
        const coolahhuiname: string = "LoadoutWarningUI" + UI.uniqueNameNumber++;
        mod.AddUIText(coolahhuiname, mod.CreateVector(0, 70, 0), mod.CreateVector(370, 35, 0), mod.UIAnchor.Center, H.MakeMessage(mod.stringkeys.loadoutWarning), pp.player);
        let widget = mod.FindUIWidgetWithName(coolahhuiname) as mod.UIWidget;
        mod.SetUITextSize(widget, 20);
        mod.SetUITextAnchor(widget, mod.UIAnchor.Center);
        mod.SetUIWidgetBgColor(widget, mod.CreateVector(1, 0.8, 0.8));
        mod.SetUITextColor(widget, mod.CreateVector(1, 1, 1));
        mod.SetUIWidgetBgFill(widget, mod.UIBgFill.Blur);
        mod.SetUIWidgetBgAlpha(widget, 1);
        mod.SetUIWidgetDepth(widget, mod.UIDepth.AboveGameUI);
        mod.SetUIWidgetVisible(widget, false);

        return widget;
    }

    static CreateCarryTextBlockUI(pp: PlayerProfile): mod.UIWidget {
        const coolahhuiname: string = "CarryTextBlockUI" + UI.uniqueNameNumber++;
        mod.AddUIText(coolahhuiname, mod.CreateVector(0, 148, 0), mod.CreateVector(170, 22, 0), mod.UIAnchor.TopCenter, H.MakeMessage(mod.stringkeys.xfirex), pp.player);
        let widget = mod.FindUIWidgetWithName(coolahhuiname) as mod.UIWidget;
        mod.SetUITextSize(widget, 18);
        mod.SetUITextAnchor(widget, mod.UIAnchor.Center);
        mod.SetUIWidgetPadding(widget, 0)
        mod.SetUIWidgetBgColor(widget, mod.CreateVector(1, 0.8, 0.8));
        mod.SetUITextColor(widget, mod.CreateVector(1, 1, 1));
        mod.SetUIWidgetBgFill(widget, mod.UIBgFill.Blur);
        mod.SetUIWidgetBgAlpha(widget, 1);
        mod.SetUIWidgetVisible(widget, false);

        return widget;
    }

    static CreatePlayerTeamUI(pp: PlayerProfile): mod.UIWidget[] {
        const coolahhteamuiname: string = "TeamUI" + UI.uniqueNameNumber++;
        mod.AddUIText(coolahhteamuiname, mod.CreateVector(110, 176, 0), mod.CreateVector(150, 25, 0), mod.UIAnchor.TopLeft, H.MakeMessage(mod.stringkeys.teamNumber, H.GetTeamNumber(pp.player)), pp.player);
        let widgets = [mod.FindUIWidgetWithName(coolahhteamuiname) as mod.UIWidget];
        mod.SetUITextSize(widgets[0], 26);
        mod.SetUITextAnchor(widgets[0], mod.UIAnchor.CenterLeft);
        mod.SetUITextColor(widgets[0], UI.battlefieldWhite);
        mod.SetUIWidgetBgFill(widgets[0], mod.UIBgFill.Solid);
        mod.SetUIWidgetBgAlpha(widgets[0], 0);

        widgets = widgets.concat(this.CreatePlayerTeamBgUI(pp));

        const frameLine1 = UIH.CreateLine({
            baseName: "FrameLine",
            xOffset: 20,
            yOffset: 210,
            size: mod.CreateVector(200, 2, 0),
            alpha: 0.5,
            color: UI.battlefieldWhite,
            anchor: mod.UIAnchor.TopLeft,
            visible: true
        }, pp);

        widgets = widgets.concat(frameLine1);

        const coolahhteamuiname2: string = "TeamUI" + UI.uniqueNameNumber++;
        mod.AddUIText(coolahhteamuiname2, mod.CreateVector(10, 339, 0), mod.CreateVector(150, 25, 0), mod.UIAnchor.TopLeft, H.MakeMessage(mod.stringkeys.dashLine), pp.player);
        let widgets2 = [mod.FindUIWidgetWithName(coolahhteamuiname2) as mod.UIWidget];
        mod.SetUITextSize(widgets2[0], 12);
        mod.SetUITextAnchor(widgets2[0], mod.UIAnchor.CenterLeft);
        mod.SetUITextColor(widgets2[0], UI.battlefieldGrey);
        mod.SetUIWidgetBgFill(widgets2[0], mod.UIBgFill.Solid);
        mod.SetUIWidgetBgAlpha(widgets2[0], 0);

        widgets = widgets.concat(widgets2);

        return widgets;
    }

    static CreatePlayerTeamBgUI(pp: PlayerProfile): mod.UIWidget[] {
        const coolahhteamuiname: string = "TeamBgUI" + UI.uniqueNameNumber++;
        mod.AddUIText(coolahhteamuiname, mod.CreateVector(20, 172, 0), mod.CreateVector(214, 35, 0), mod.UIAnchor.TopLeft, H.MakeMessage(mod.stringkeys.youAreOnTeam), pp.player);
        let widgets = [mod.FindUIWidgetWithName(coolahhteamuiname) as mod.UIWidget];
        mod.SetUITextSize(widgets[0], 20);
        mod.SetUITextAnchor(widgets[0], mod.UIAnchor.CenterLeft);
        mod.SetUITextColor(widgets[0], UI.battlefieldGrey);
        mod.SetUIWidgetBgFill(widgets[0], mod.UIBgFill.Solid);
        mod.SetUIWidgetBgColor(widgets[0], UI.battlefieldBlueBg);
        mod.SetUIWidgetBgAlpha(widgets[0], 0);

        return widgets;
    }

    static ShowPlayerTeamWidget(show: boolean) {
        if (show) {
            UI.UpdateUIForWidgetType(pp => pp.playerTeamWidget && pp.playerTeamWidget[0], PlayerProfile.playerInstances, undefined, true);
            UI.UpdateUIForWidgetType(pp => pp.playerTeamWidget && pp.playerTeamWidget[1], PlayerProfile.playerInstances, undefined, true);
            UI.UpdateUIForWidgetType(pp => pp.playerTeamWidget && pp.playerTeamWidget[2], PlayerProfile.playerInstances, undefined, true);
            UI.UpdateUIForWidgetType(pp => pp.playerTeamWidget && pp.playerTeamWidget[3], PlayerProfile.playerInstances, undefined, true);
            /* mod.SetUITextLabel(pp.playerTeamWidget[0], H.MakeMessage(mod.stringkeys.teamNumber, H.GetTeamNumber(pp.player)));
            mod.SetUIWidgetBgColor(pp.playerTeamWidget[0], GC.teamColors[H.GetTeamNumber(pp.player) - 1]); */
        } else {
            UI.UpdateUIForWidgetType(pp => pp.playerTeamWidget && pp.playerTeamWidget[0], PlayerProfile.playerInstances, undefined, false);
            UI.UpdateUIForWidgetType(pp => pp.playerTeamWidget && pp.playerTeamWidget[1], PlayerProfile.playerInstances, undefined, false);
            UI.UpdateUIForWidgetType(pp => pp.playerTeamWidget && pp.playerTeamWidget[2], PlayerProfile.playerInstances, undefined, false);
            UI.UpdateUIForWidgetType(pp => pp.playerTeamWidget && pp.playerTeamWidget[3], PlayerProfile.playerInstances, undefined, false);
        }
    }

    /* static UpdateUI(widget: mod.UIWidget | undefined, message: mod.Message): void
    static UpdateUI(widget: mod.UIWidget | undefined, show: boolean): void
    static UpdateUI(widget: mod.UIWidget | undefined, message: mod.Message, show: boolean): void */

    static UpdateUI(widget: mod.UIWidget | undefined, message: mod.Message, show?: boolean): void {
        widget && message && mod.SetUITextLabel(widget, message);
        widget && show != undefined && mod.SetUIWidgetVisible(widget, show);
    }

    //currentLerpvalue: number = 0;

    static async InterpCurrencyFeedback(pp: PlayerProfile) {
        let currentLerpvalue: number = 0;
        let lerpIncrement: number = 0;
        while (currentLerpvalue < 1.0) {
            if (!pp.currencyFeedbackBeingShown) break;
            lerpIncrement = lerpIncrement + 0.1;
            currentLerpvalue = H.Lerp(currentLerpvalue, 1, lerpIncrement);
            mod.SetUIWidgetBgAlpha(pp.playerCurrencyFeedbackWidget[0], 1 - currentLerpvalue);
            mod.SetUIWidgetBgAlpha(pp.playerCurrencyFeedbackWidget[1], 1 - currentLerpvalue);
            mod.SetUIWidgetBgAlpha(pp.playerCurrencyFeedbackWidget[2], 1 - currentLerpvalue);
            mod.SetUITextAlpha(pp.playerCurrencyFeedbackWidget[0], 1 - currentLerpvalue);
            await mod.Wait(0.0);
        }
    }

    static async ShowCurrencyFeedback(pp: PlayerProfile) {
        if (pp.currencyFeedbackBeingShown) {
            pp.currencyFeedbackQueued = true;
            return;
        }

        pp.currencyFeedbackBeingShown = true;
        mod.SetUIWidgetVisible(pp.playerCurrencyFeedbackWidget[0], true);
        mod.SetUIWidgetVisible(pp.playerCurrencyFeedbackWidget[1], true);
        mod.SetUIWidgetVisible(pp.playerCurrencyFeedbackWidget[2], true);
        mod.SetUIWidgetBgAlpha(pp.playerCurrencyFeedbackWidget[0], 1);
        mod.SetUIWidgetBgAlpha(pp.playerCurrencyFeedbackWidget[1], 1);
        mod.SetUIWidgetBgAlpha(pp.playerCurrencyFeedbackWidget[2], 1);

        mod.SetUITextAlpha(pp.playerCurrencyFeedbackWidget[0], 1);

        await mod.Wait(0.9)
        this.InterpCurrencyFeedback(pp);
        await mod.Wait(0.5);

        if (pp.currencyFeedbackQueued) {
            pp.currencyFeedbackBeingShown = false;
            pp.currencyFeedbackQueued = false;
            mod.SetUIWidgetVisible(pp.playerCurrencyFeedbackWidget[0], false);
            mod.SetUIWidgetVisible(pp.playerCurrencyFeedbackWidget[1], false);
            mod.SetUIWidgetVisible(pp.playerCurrencyFeedbackWidget[2], false);
            await mod.Wait(0.1);
            this.ShowCurrencyFeedback(pp);
            return;
        }

        pp.currencyFeedbackBeingShown = false;
        mod.SetUIWidgetVisible(pp.playerCurrencyFeedbackWidget[0], false);
        mod.SetUIWidgetVisible(pp.playerCurrencyFeedbackWidget[1], false);
        mod.SetUIWidgetVisible(pp.playerCurrencyFeedbackWidget[2], false);
    }

    static CreateCurrencyFeedbackUI(pp: PlayerProfile): mod.UIWidget {
        const coolahhuiname: string = "CurrencyFeedbackUI" + UI.uniqueNameNumber++;
        mod.AddUIText(coolahhuiname, mod.CreateVector(0, 180, 0), mod.CreateVector(150, 25, 0), mod.UIAnchor.BottomCenter, H.MakeMessage(mod.stringkeys.currencyUp, GC.currencyGainOnKill), pp.player);
        let widget = mod.FindUIWidgetWithName(coolahhuiname) as mod.UIWidget;
        mod.SetUITextColor(widget, mod.CreateVector(0, 0, 0));
        mod.SetUITextSize(widget, 18);
        mod.SetUITextAnchor(widget, mod.UIAnchor.Center);
        mod.SetUIWidgetPadding(widget, -100);
        mod.SetUIWidgetVisible(widget, true);
        mod.SetUIWidgetBgFill(widget, mod.UIBgFill.Solid);
        mod.SetUIWidgetBgColor(widget, UI.currencyYellow);
        mod.SetUIWidgetBgAlpha(widget, 0.9);
        mod.SetUIWidgetVisible(widget, false);

        return widget;
    }

    static CreateCurrencyFadeLineUI(right: boolean, pp: PlayerProfile): mod.UIWidget {
        const coolahhuiname: string = "CurrencyFadeLineUI" + UI.uniqueNameNumber++;
        let horizontalOffset: number = right ? 150 : -150;
        mod.AddUIContainer(coolahhuiname, mod.CreateVector(horizontalOffset, 180, 0), mod.CreateVector(150, 25, 0), mod.UIAnchor.BottomCenter, pp.player);
        let widget = mod.FindUIWidgetWithName(coolahhuiname) as mod.UIWidget;
        mod.SetUIWidgetPadding(widget, 1);
        right ? mod.SetUIWidgetBgFill(widget, mod.UIBgFill.GradientLeft) : mod.SetUIWidgetBgFill(widget, mod.UIBgFill.GradientRight);
        mod.SetUIWidgetBgColor(widget, UI.currencyYellow);
        mod.SetUIWidgetBgAlpha(widget, 0.9);
        mod.SetUIWidgetVisible(widget, false);

        return widget;
    }

    static async TriggerSubHeaderLineCountdownProcess(countdownTime: number) {
        UIH.AnimateUIToSizeOverTime(pp => pp.playerSubHeaderWidget[2], PlayerProfile.playerInstances, mod.CreateVector(0, 3, 0), countdownTime * 30);
    }

    static async TriggerSubHeaderUnshowProcess() {
        await mod.Wait(4)
        const sizeChain = UIH.AnimateUIToSizeOverTime(pp => pp.playerSubHeaderWidget[1], PlayerProfile.playerInstances, mod.CreateVector(0, 1, 0), 8);
        const textChain = UIH.AnimateUITextToAlphaOverTime(pp => [pp.playerSubHeaderWidget[0]], PlayerProfile.playerInstances, 0, 5);

        sizeChain.then(() => UI.UpdateUIForWidgetType(pp => pp.playerSubHeaderWidget[1], PlayerProfile.playerInstances, undefined, false));
        textChain.then(() => UI.UpdateUIForWidgetType(pp => pp.playerSubHeaderWidget[0], PlayerProfile.playerInstances, undefined, false));

        await Promise.all([sizeChain, textChain]);
    }

    static subHeaderPos = mod.CreateVector(0, 228, 0)
    static subHeaderSize = mod.CreateVector(430, 22, 0)

    static CreateSubHeaderUI(pp: PlayerProfile): mod.UIWidget[] {
        const coolahhuiname: string = "SubHeaderUI" + UI.uniqueNameNumber++;
        mod.AddUIText(coolahhuiname, this.subHeaderPos, this.subHeaderSize, mod.UIAnchor.TopCenter, H.MakeMessage(mod.stringkeys.playersToWaitFor), pp.player);
        let widgets = [mod.FindUIWidgetWithName(coolahhuiname) as mod.UIWidget];
        mod.SetUITextColor(widgets[0], UI.battlefieldWhite);
        mod.SetUITextSize(widgets[0], 38);
        mod.SetUITextAnchor(widgets[0], mod.UIAnchor.Center);
        mod.SetUIWidgetPadding(widgets[0], 5);
        mod.SetUIWidgetVisible(widgets[0], true);
        mod.SetUIWidgetBgAlpha(widgets[0], 0);
        mod.SetUIWidgetBgFill(widgets[0], mod.UIBgFill.Solid);
        mod.SetUIWidgetDepth(widgets[0], mod.UIDepth.BelowGameUI);

        const underLine = UIH.CreateLine({
            baseName: "Dividing",
            xOffset: 0,
            yOffset: 262,
            size: mod.CreateVector(300, 3, 0),
            alpha: 0.5,
            color: UI.battlefieldWhite,
            anchor: mod.UIAnchor.TopCenter,
            visible: true,
            depth: mod.UIDepth.BelowGameUI
        }, pp);

        widgets = widgets.concat(underLine);

        /* const loadingUnderLine = UIH.CreateLine({
            baseName: "Dividing",
            xOffset: 0,
            yOffset: 262,
            size: mod.CreateVector(290, 3, 0),
            alpha: 1,
            color: UI.battlefieldWhite,
            anchor: mod.UIAnchor.TopCenter,
            visible: true,
            depth: mod.UIDepth.BelowGameUI
        }, pp);

        widgets = widgets.concat(loadingUnderLine); */

        return widgets;
    }

    static CreateAnnouncementHeaderUI(pp: PlayerProfile): mod.UIWidget[] {
        const coolahhuiname: string = "AnnouncementHeaderUI" + UI.uniqueNameNumber++;
        mod.AddUIText(coolahhuiname, mod.CreateVector(0, 301, 0), mod.CreateVector(380, 49, 0), mod.UIAnchor.TopCenter, H.MakeMessage(mod.stringkeys.roundStart), pp.player);
        let widgets = [mod.FindUIWidgetWithName(coolahhuiname) as mod.UIWidget];
        mod.SetUITextColor(widgets[0], UI.battlefieldWhite);
        mod.SetUITextSize(widgets[0], 32);
        mod.SetUITextAnchor(widgets[0], mod.UIAnchor.Center);
        mod.SetUIWidgetPadding(widgets[0], 5);
        mod.SetUIWidgetVisible(widgets[0], false);
        mod.SetUIWidgetBgAlpha(widgets[0], 0);
        mod.SetUIWidgetBgColor(widgets[0], UI.battlefieldWhite)
        mod.SetUIWidgetBgFill(widgets[0], mod.UIBgFill.Solid);
        mod.SetUIWidgetDepth(widgets[0], mod.UIDepth.AboveGameUI);

        const gradientLines: mod.UIWidget[] = UIH.CreateGradientLinePair({
            xOffset: 200,
            yOffset: 301,
            size: mod.CreateVector(400, 49, 0),
            alpha: 0.2
        }, pp);
        widgets = widgets.concat(gradientLines);

        const dividingLines1 = UIH.CreateLine({
            baseName: "Dividing",
            xOffset: 0,
            yOffset: 300,
            size: mod.CreateVector(800, 1, 0),
            alpha: 0.4,
            color: UI.battlefieldWhite,
            anchor: mod.UIAnchor.TopCenter
        }, pp);
        widgets = widgets.concat(dividingLines1);

        const dividingLines2 = UIH.CreateLine({
            baseName: "Dividing",
            xOffset: 0,
            yOffset: 350,
            size: mod.CreateVector(800, 1, 0),
            alpha: 0.4,
            color: UI.battlefieldWhite,
            anchor: mod.UIAnchor.TopCenter
        }, pp);
        widgets = widgets.concat(dividingLines2);
        return widgets;
    }

    static showingAnnouncement: boolean = false;

    static async ShowAnnouncement(message: mod.Message) {
        if (this.showingAnnouncement) {
            console.log("tried to show announcement before it was done")
            return;
        }
        this.showingAnnouncement = true;
        PlayerProfile.playerInstances.forEach(element => {
            const pProfile = PlayerProfile.Get(element);

            if (pProfile) {
                //UI.UpdateUIForWidgetType(pp => pp.playerMinorAnnouncementWidget, [pProfile.player], undefined, false);

                mod.SetUIWidgetBgColor(pProfile.playerAnnouncementWidget[0], UI.battlefieldWhite);
                mod.SetUITextColor(pProfile.playerAnnouncementWidget[0], UI.battlefieldWhite);
                for (let i = 1; i < 5; i = i + 1) {
                    mod.SetUIWidgetBgColor(pProfile.playerAnnouncementWidget[i], UI.battlefieldWhite);
                }
            }
        });
        UI.UpdateUIForWidgetType(pp => pp.playerAnnouncementWidget[0], PlayerProfile.playerInstances, message, true);
        UI.UpdateUIForWidgetType(pp => pp.playerAnnouncementWidget?.slice(1), PlayerProfile.playerInstances, undefined, true);

        await mod.Wait(4);
        UIH.AnimateUIToBgAlphaOverTime(pp => pp.playerAnnouncementWidget?.slice(1), PlayerProfile.playerInstances, 0, 7);
        UIH.AnimateUITextToAlphaOverTime(pp => [pp.playerAnnouncementWidget[0]], PlayerProfile.playerInstances, 0, 7);
        await mod.Wait(7);
        UI.UpdateUIForWidgetType(pp => pp.playerAnnouncementWidget[0], PlayerProfile.playerInstances, message, false);
        UI.UpdateUIForWidgetType(pp => pp.playerAnnouncementWidget?.slice(1), PlayerProfile.playerInstances, undefined, false);
        this.showingAnnouncement = false;
    }

    static async ShowPersonalAnnouncement(message: mod.Message, good: boolean, pProfile: PlayerProfile) {
        //UI.UpdateUIForWidgetType(pp => pp.playerMinorAnnouncementWidget, [pProfile.player], undefined, false);

        let goodColor: mod.Vector = good ? UI.allyBlue : UI.enemyOrange;
        UI.UpdateUIForWidgetType(pp => pp.playerAnnouncementWidget[0], [pProfile.player], message, true);
        //mod.SetUIWidgetBgColor(pProfile.playerAnnouncementWidget[0], goodColor);
        mod.SetUITextColor(pProfile.playerAnnouncementWidget[0], goodColor);

        for (let i = 1; i < pProfile.playerAnnouncementWidget.length; i = i + 1) {
            UI.UpdateUIForWidgetType(pp => pp.playerAnnouncementWidget[i], [pProfile.player], undefined, true);
            mod.SetUIWidgetBgColor(pProfile.playerAnnouncementWidget[i], goodColor);
        }

        await mod.Wait(4);

        UIH.AnimateUIToBgAlphaOverTime(pp => pp.playerAnnouncementWidget?.slice(1), [pProfile.player], 0, 7);
        UIH.AnimateUITextToAlphaOverTime(pp => [pp.playerAnnouncementWidget[0]], [pProfile.player], 0, 7);

        /* await Promise.all([
            UIH.AnimateUIToBgAlphaOverTime(pp => pp.playerAnnouncementWidget?.slice(1), PlayerProfile.playerInstances, 0, 7),
            UIH.AnimateUITextToAlphaOverTime(pp => [pp.playerAnnouncementWidget[0]], PlayerProfile.playerInstances, 0, 7).then(() =>
                UI.PostPersonalAnnouncementCleanup(pProfile)
            )
        ]); */
    }

    static PostPersonalAnnouncementCleanup(pp: PlayerProfile) {
        mod.SetUIWidgetBgColor(pp.playerAnnouncementWidget[0], UI.battlefieldWhite); // will need to set this on real announcement start instead, or queue them
        mod.SetUITextColor(pp.playerAnnouncementWidget[0], UI.battlefieldWhite);
        mod.SetUIWidgetVisible(pp.playerAnnouncementWidget[0], false);

        for (let i = 1; i < 5; i = i + 1) {
            UI.UpdateUIForWidgetType(pp => pp.playerAnnouncementWidget[i], [pp.player], undefined, false);
            mod.SetUIWidgetBgColor(pp.playerAnnouncementWidget[i], UI.battlefieldWhite);
        }
    }

    static CreateMinorAnnouncementUI(pp: PlayerProfile): mod.UIWidget[] {
        const coolahhuiname: string = "MinorAnnouncementUI" + UI.uniqueNameNumber++;
        mod.AddUIText(coolahhuiname, mod.CreateVector(0, 385, 0), mod.CreateVector(281, 37, 0), mod.UIAnchor.TopCenter, H.MakeMessage(mod.stringkeys.loading), pp.player);
        let widgets = [mod.FindUIWidgetWithName(coolahhuiname) as mod.UIWidget];
        mod.SetUITextColor(widgets[0], UI.allyBlue);
        mod.SetUITextSize(widgets[0], 28);
        mod.SetUITextAnchor(widgets[0], mod.UIAnchor.Center);
        mod.SetUIWidgetPadding(widgets[0], 5);
        mod.SetUIWidgetVisible(widgets[0], false);
        mod.SetUIWidgetBgAlpha(widgets[0], 0);
        mod.SetUIWidgetBgColor(widgets[0], UI.battlefieldWhite)
        mod.SetUIWidgetBgFill(widgets[0], mod.UIBgFill.Solid);
        mod.SetUIWidgetDepth(widgets[0], mod.UIDepth.AboveGameUI);

        const dividingLines1 = UIH.CreateLine({
            baseName: "Dividing",
            xOffset: 0,
            yOffset: 385,
            size: mod.CreateVector(281, 1, 0),
            alpha: 0.5,
            color: UI.allyBlue,
            anchor: mod.UIAnchor.TopCenter
        }, pp);
        widgets = widgets.concat(dividingLines1);

        const dividingLines2 = UIH.CreateLine({
            baseName: "Dividing",
            xOffset: 0,
            yOffset: 423,
            size: mod.CreateVector(281, 1, 0),
            alpha: 0.5,
            color: UI.allyBlue,
            anchor: mod.UIAnchor.TopCenter
        }, pp);
        widgets = widgets.concat(dividingLines2);
        return widgets;
    }

    static async ShowMinorAnnouncement(message: mod.Message, good: boolean, playerProfile: PlayerProfile) { // just a quick version right now, should use UpdateUI() instead
        let goodColor: mod.Vector = (good ? UI.allyBlue : UI.enemyOrange);
        UI.UpdateUIForWidgetType(pp => pp.playerMinorAnnouncementWidget[0], [playerProfile.player], message, true);
        //mod.SetUIWidgetBgColor(pProfile.playerAnnouncementWidget[0], goodColor);
        mod.SetUITextColor(playerProfile.playerMinorAnnouncementWidget[0], goodColor);

        for (let i = 1; i < playerProfile.playerMinorAnnouncementWidget.length; i = i + 1) {
            UI.UpdateUIForWidgetType(pp => pp.playerMinorAnnouncementWidget[i], [playerProfile.player], undefined, true);
            mod.SetUIWidgetBgColor(playerProfile.playerMinorAnnouncementWidget[i], goodColor);
        }

        await mod.Wait(4);

        UI.UpdateUIForWidgetType(pp => pp.playerMinorAnnouncementWidget, [playerProfile.player], undefined, false);

        /* UIH.AnimateUIToBgAlphaOverTime(pp => pp.playerAnnouncementWidget?.slice(1), [playerProfile.player], 0, 7);
        UIH.AnimateUITextToAlphaOverTime(pp => [pp.playerAnnouncementWidget[0]], [playerProfile.player], 0, 7); */
    }

    static CreatePlayerStateUI(pp: PlayerProfile): mod.UIWidget[] {
        const coolahhuiname: string = "PlayerStateUI" + UI.uniqueNameNumber++;
        mod.AddUIText(coolahhuiname, mod.CreateVector(0, 180, 0), mod.CreateVector(190, 32, 0), mod.UIAnchor.BottomCenter, H.MakeMessage(mod.stringkeys.invincible), pp.player);
        let widgets = [mod.FindUIWidgetWithName(coolahhuiname) as mod.UIWidget];
        mod.SetUITextColor(widgets[0], UI.battlefieldWhite);
        mod.SetUITextSize(widgets[0], 28);
        mod.SetUITextAnchor(widgets[0], mod.UIAnchor.Center);
        mod.SetUIWidgetPadding(widgets[0], 5);
        mod.SetUIWidgetVisible(widgets[0], false);
        mod.SetUIWidgetBgAlpha(widgets[0], 1);
        mod.SetUIWidgetBgFill(widgets[0], mod.UIBgFill.Blur);
        mod.SetUIWidgetBgColor(widgets[0], UI.battlefieldWhite);

        widgets = widgets.concat(UIH.CreateBlockFrame(mod.CreateVector(0, 195, 0), 190, 32, mod.UIAnchor.BottomCenter, pp));

        return widgets;
    }

    static CreateRoundUI(pp: PlayerProfile): mod.UIWidget {
        const coolahhuiname1: string = "RoundUI" + UI.uniqueNameNumber++;
        mod.AddUIContainer(coolahhuiname1, mod.CreateVector(30, 19, 0), mod.CreateVector(176, 46, 0), mod.UIAnchor.TopLeft, pp.player);
        let widget1 = mod.FindUIWidgetWithName(coolahhuiname1) as mod.UIWidget;
        mod.SetUIWidgetPadding(widget1, 5);
        mod.SetUIWidgetVisible(widget1, true);
        mod.SetUIWidgetBgFill(widget1, mod.UIBgFill.Blur);
        mod.SetUIWidgetBgColor(widget1, UI.battlefieldBlueBg);
        mod.SetUIWidgetBgAlpha(widget1, 1);

        const coolahhuiname2: string = "RoundUI" + UI.uniqueNameNumber++;
        mod.AddUIContainer(coolahhuiname2, mod.CreateVector(30, 19, 0), mod.CreateVector(176, 46, 0), mod.UIAnchor.TopLeft, pp.player);
        let widget2 = mod.FindUIWidgetWithName(coolahhuiname2) as mod.UIWidget;
        mod.SetUIWidgetPadding(widget2, 5);
        mod.SetUIWidgetVisible(widget2, true);
        mod.SetUIWidgetBgFill(widget2, mod.UIBgFill.GradientLeft);
        mod.SetUIWidgetBgColor(widget2, UI.battlefieldWhite);
        mod.SetUIWidgetBgAlpha(widget2, UI.gradientAlpha);

        const coolahhuiname3: string = "RoundUI" + UI.uniqueNameNumber++;
        mod.AddUIText(coolahhuiname3, mod.CreateVector(36, 19, 0), mod.CreateVector(176, 46, 0), mod.UIAnchor.TopLeft, H.MakeMessage(mod.stringkeys.roundStatus, GD.currentRound, GC.maxRounds), pp.player);
        let widget3 = mod.FindUIWidgetWithName(coolahhuiname3) as mod.UIWidget;
        mod.SetUITextColor(widget3, UI.battlefieldWhite);
        mod.SetUITextSize(widget3, 34);
        mod.SetUITextAnchor(widget3, mod.UIAnchor.CenterLeft);
        mod.SetUIWidgetPadding(widget3, 5);
        mod.SetUIWidgetVisible(widget3, true);
        mod.SetUIWidgetBgFill(widget3, mod.UIBgFill.Solid);
        mod.SetUIWidgetBgColor(widget3, UI.battlefieldWhite);
        mod.SetUIWidgetBgAlpha(widget3, 0);

        const frameLine1 = UIH.CreateLine({
            baseName: "FrameLine",
            xOffset: 30,
            yOffset: 19,
            size: mod.CreateVector(1, 46, 0),
            alpha: 0.5,
            color: UI.battlefieldWhite,
            anchor: mod.UIAnchor.TopLeft,
            visible: true
        }, pp);

        return widget3;
    }

    static CreateRemainingPlayersUI(pp: PlayerProfile): mod.UIWidget[] {
        const coolahhuiname1: string = "RemainingPlayersUI" + UI.uniqueNameNumber++;
        mod.AddUIText(coolahhuiname1, mod.CreateVector(68, 19, 0), mod.CreateVector(140, 46, 0), mod.UIAnchor.TopRight, H.MakeMessage(mod.stringkeys.remainingPlayers, PlayerProfile.playerInstances.length, GC.maxPlayers), pp.player);
        let widgets = [mod.FindUIWidgetWithName(coolahhuiname1) as mod.UIWidget];
        mod.SetUITextColor(widgets[0], UI.battlefieldWhite);
        mod.SetUITextSize(widgets[0], 40);
        mod.SetUITextAnchor(widgets[0], mod.UIAnchor.CenterRight);
        mod.SetUIWidgetPadding(widgets[0], 5);
        mod.SetUIWidgetVisible(widgets[0], true);
        mod.SetUIWidgetBgFill(widgets[0], mod.UIBgFill.Blur);
        mod.SetUIWidgetBgColor(widgets[0], UI.battlefieldBlueBg);
        mod.SetUIWidgetBgAlpha(widgets[0], 0);

        const coolahhuiname2: string = "RemainingPlayersUI" + UI.uniqueNameNumber++;
        mod.AddUIContainer(coolahhuiname2, mod.CreateVector(30, 19, 0), mod.CreateVector(140, 46, 0), mod.UIAnchor.TopRight, pp.player);
        let widgets2 = [mod.FindUIWidgetWithName(coolahhuiname2) as mod.UIWidget];
        mod.SetUIWidgetPadding(widgets2[0], 5);
        mod.SetUIWidgetVisible(widgets2[0], true);
        mod.SetUIWidgetBgFill(widgets2[0], mod.UIBgFill.Blur);
        mod.SetUIWidgetBgColor(widgets2[0], UI.battlefieldBlueBg);
        mod.SetUIWidgetBgAlpha(widgets2[0], 1);

        widgets = widgets.concat(widgets2);

        const coolahhuiname3: string = "RemainingPlayersUI" + UI.uniqueNameNumber++;
        mod.AddUIContainer(coolahhuiname3, mod.CreateVector(30, 19, 0), mod.CreateVector(140, 46, 0), mod.UIAnchor.TopRight, pp.player);
        let widgets3 = [mod.FindUIWidgetWithName(coolahhuiname3) as mod.UIWidget];
        mod.SetUIWidgetPadding(widgets3[0], 5);
        mod.SetUIWidgetVisible(widgets3[0], true);
        mod.SetUIWidgetBgFill(widgets3[0], mod.UIBgFill.GradientRight);
        mod.SetUIWidgetBgColor(widgets3[0], UI.battlefieldWhite);
        mod.SetUIWidgetBgAlpha(widgets3[0], UI.gradientAlpha);

        widgets = widgets.concat(widgets3);

        const coolahhuiname4: string = "RemainingPlayersUI" + UI.uniqueNameNumber++;
        mod.AddUIImage(coolahhuiname4, mod.CreateVector(38, 25, 0), mod.CreateVector(32, 32, 0), mod.UIAnchor.TopRight, mod.UIImageType.SelfHeal, pp.player);
        let widgets4 = [mod.FindUIWidgetWithName(coolahhuiname4) as mod.UIWidget];
        mod.SetUIWidgetPadding(widgets4[0], 5);
        mod.SetUIWidgetVisible(widgets4[0], true);
        mod.SetUIWidgetBgFill(widgets4[0], mod.UIBgFill.Solid);
        mod.SetUIWidgetBgColor(widgets4[0], UI.battlefieldWhite);
        mod.SetUIWidgetBgAlpha(widgets4[0], 0);

        widgets = widgets.concat(widgets4);

        const frameLine1 = UIH.CreateLine({
            baseName: "FrameLine",
            xOffset: 30,
            yOffset: 19,
            size: mod.CreateVector(1, 46, 0),
            alpha: 0.5,
            color: UI.battlefieldWhite,
            anchor: mod.UIAnchor.TopRight,
            visible: true
        }, pp);

        widgets = widgets.concat(frameLine1);

        return widgets;
    }

    static ringInfoPos = mod.CreateVector(50, 345, 0)
    static ringInfoSize = mod.CreateVector(230, 75, 0)

    static CreateRingInfoUI(pp: PlayerProfile): mod.UIWidget[] {
        const coolahhuiname: string = "RingInfoUI" + UI.uniqueNameNumber++;
        mod.AddUIText(coolahhuiname, this.ringInfoPos, this.ringInfoSize, mod.UIAnchor.BottomLeft, H.MakeMessage(mod.stringkeys.ringInfoRingShrinksIn), pp.player);
        let widgets = [mod.FindUIWidgetWithName(coolahhuiname) as mod.UIWidget];
        mod.SetUITextColor(widgets[0], UI.battlefieldGrey);
        mod.SetUITextSize(widgets[0], 28);
        mod.SetUITextAnchor(widgets[0], mod.UIAnchor.TopCenter);
        mod.SetUIWidgetPadding(widgets[0], 3);
        mod.SetUIWidgetVisible(widgets[0], false);
        mod.SetUIWidgetBgAlpha(widgets[0], 0);
        mod.SetUIWidgetBgFill(widgets[0], mod.UIBgFill.Solid);
        mod.SetUIWidgetDepth(widgets[0], mod.UIDepth.BelowGameUI);

        const coolahhuiname1: string = "RingInfoUI" + UI.uniqueNameNumber++;
        mod.AddUIText(coolahhuiname1, this.ringInfoPos, this.ringInfoSize, mod.UIAnchor.BottomLeft, H.MakeMessage(mod.stringkeys.timerCounterThing), pp.player);
        let widgets2 = [mod.FindUIWidgetWithName(coolahhuiname1) as mod.UIWidget];
        mod.SetUITextColor(widgets2[0], UI.battlefieldWhite);
        mod.SetUITextSize(widgets2[0], 42);
        mod.SetUITextAnchor(widgets2[0], mod.UIAnchor.BottomCenter);
        mod.SetUIWidgetPadding(widgets2[0], 3);
        mod.SetUIWidgetVisible(widgets2[0], false);
        mod.SetUIWidgetBgAlpha(widgets2[0], 0);
        mod.SetUIWidgetBgFill(widgets2[0], mod.UIBgFill.Solid);
        mod.SetUIWidgetDepth(widgets2[0], mod.UIDepth.BelowGameUI);

        widgets = widgets.concat(widgets2);

        const coolahhuiname3: string = "RingInfoUI" + UI.uniqueNameNumber++;
        mod.AddUIText(coolahhuiname3, this.ringInfoPos, this.ringInfoSize, mod.UIAnchor.BottomLeft, H.MakeMessage(mod.stringkeys.ringInfoRingShrinking), pp.player);
        let widgets3 = [mod.FindUIWidgetWithName(coolahhuiname3) as mod.UIWidget];
        mod.SetUITextColor(widgets3[0], UI.enemyOrange);
        mod.SetUITextSize(widgets3[0], 32);
        mod.SetUITextAnchor(widgets3[0], mod.UIAnchor.Center);
        mod.SetUIWidgetPadding(widgets3[0], 5);
        mod.SetUIWidgetVisible(widgets3[0], false);
        mod.SetUIWidgetBgAlpha(widgets3[0], 0);
        mod.SetUIWidgetBgFill(widgets3[0], mod.UIBgFill.Solid);
        mod.SetUIWidgetDepth(widgets3[0], mod.UIDepth.BelowGameUI);

        widgets = widgets.concat(widgets3);

        const coolahhuiname4: string = "RingInfoUI" + UI.uniqueNameNumber++;
        mod.AddUIContainer(coolahhuiname4, this.ringInfoPos, this.ringInfoSize, mod.UIAnchor.BottomLeft, pp.player);
        let widgets4 = [mod.FindUIWidgetWithName(coolahhuiname4) as mod.UIWidget];
        mod.SetUIWidgetPadding(widgets4[0], 5);
        mod.SetUIWidgetVisible(widgets4[0], false);
        mod.SetUIWidgetBgAlpha(widgets4[0], 1);
        mod.SetUIWidgetBgColor(widgets4[0], UI.battlefieldWhite);
        mod.SetUIWidgetBgFill(widgets4[0], mod.UIBgFill.Blur);
        mod.SetUIWidgetDepth(widgets4[0], mod.UIDepth.BelowGameUI);

        widgets = widgets.concat(widgets4);

        const overLine = UIH.CreateLine({
            baseName: "Dividing",
            xOffset: mod.XComponentOf(this.ringInfoPos),
            yOffset: mod.YComponentOf(this.ringInfoPos) + 75,
            size: mod.CreateVector(230, 1, 0),
            alpha: 0.5,
            color: UI.battlefieldWhite,
            anchor: mod.UIAnchor.BottomLeft,
            visible: false,
            depth: mod.UIDepth.BelowGameUI
        }, pp);

        widgets = widgets.concat(overLine);

        const underLine = UIH.CreateLine({
            baseName: "Dividing",
            xOffset: mod.XComponentOf(this.ringInfoPos),
            yOffset: mod.YComponentOf(this.ringInfoPos),
            size: mod.CreateVector(230, 1, 0),
            alpha: 0.5,
            color: UI.battlefieldWhite,
            anchor: mod.UIAnchor.BottomLeft,
            visible: false,
            depth: mod.UIDepth.BelowGameUI
        }, pp);

        widgets = widgets.concat(underLine);

        return widgets;
    }

    static CreateCurrencyUI(pp: PlayerProfile): mod.UIWidget {
        const coolahhuiname1: string = "RemainingPlayersUI" + UI.uniqueNameNumber++;
        mod.AddUIContainer(coolahhuiname1, mod.CreateVector(0, 50, 0), mod.CreateVector(176, 62, 0), mod.UIAnchor.BottomCenter, pp.player);
        let widget1 = mod.FindUIWidgetWithName(coolahhuiname1) as mod.UIWidget;
        mod.SetUIWidgetPadding(widget1, 5);
        mod.SetUIWidgetVisible(widget1, true);
        mod.SetUIWidgetBgFill(widget1, mod.UIBgFill.Blur);
        mod.SetUIWidgetBgColor(widget1, UI.battlefieldBlueBg);
        mod.SetUIWidgetBgAlpha(widget1, 1);

        const coolahhuiname4: string = "RemainingPlayersUI" + UI.uniqueNameNumber++;
        mod.AddUIContainer(coolahhuiname4, mod.CreateVector(0, 50, 0), mod.CreateVector(176, 62, 0), mod.UIAnchor.BottomCenter, pp.player);
        let widget4 = mod.FindUIWidgetWithName(coolahhuiname4) as mod.UIWidget;
        mod.SetUIWidgetPadding(widget4, 5);
        mod.SetUIWidgetVisible(widget4, true);
        mod.SetUIWidgetBgFill(widget4, mod.UIBgFill.GradientBottom);
        mod.SetUIWidgetBgColor(widget4, UI.battlefieldWhite);
        mod.SetUIWidgetBgAlpha(widget4, UI.gradientAlpha);

        const coolahhuiname: string = "CurrencyUI" + UI.uniqueNameNumber++;
        mod.AddUIText(coolahhuiname, mod.CreateVector(0, 50, 0), mod.CreateVector(220, 62, 0), mod.UIAnchor.BottomCenter, H.MakeMessage(mod.stringkeys.currency, pp.currency), pp.player);
        let widget = mod.FindUIWidgetWithName(coolahhuiname) as mod.UIWidget;
        mod.SetUITextColor(widget, UI.battlefieldWhite);
        mod.SetUITextSize(widget, 48);
        mod.SetUITextAnchor(widget, mod.UIAnchor.Center);
        mod.SetUIWidgetPadding(widget, 5);
        mod.SetUIWidgetVisible(widget, true);
        mod.SetUIWidgetBgFill(widget, mod.UIBgFill.Blur);
        mod.SetUIWidgetBgColor(widget, UI.battlefieldBlueBg);
        mod.SetUIWidgetBgAlpha(widget, 0);

        const frameLine1 = UIH.CreateLine({
            baseName: "FrameLine",
            xOffset: 88,
            yOffset: 50,
            size: mod.CreateVector(1, 62, 0),
            alpha: 0.5,
            color: UI.battlefieldWhite,
            anchor: mod.UIAnchor.BottomCenter,
            visible: true
        }, pp);

        const frameLine2 = UIH.CreateLine({
            baseName: "FrameLine",
            xOffset: -88,
            yOffset: 50,
            size: mod.CreateVector(1, 62, 0),
            alpha: 0.5,
            color: UI.battlefieldWhite,
            anchor: mod.UIAnchor.BottomCenter,
            visible: true
        }, pp);

        return widget;
    }

    static CreateIndividualTeamScoreUI(pp: PlayerProfile): mod.UIWidget[] {
        const coolahhuiname1: string = "IndividualTeamScoreUI" + UI.uniqueNameNumber++;
        mod.AddUIContainer(coolahhuiname1, mod.CreateVector(30, 77, 0), mod.CreateVector(90, 36, 0), mod.UIAnchor.TopLeft, pp.player);
        let widgets = [mod.FindUIWidgetWithName(coolahhuiname1) as mod.UIWidget];
        mod.SetUIWidgetPadding(widgets[0], 5);
        mod.SetUIWidgetVisible(widgets[0], true);
        mod.SetUIWidgetBgFill(widgets[0], mod.UIBgFill.Blur);
        mod.SetUIWidgetBgColor(widgets[0], UI.battlefieldBlueBg);
        mod.SetUIWidgetBgAlpha(widgets[0], 1);

        const coolahhuiname2: string = "IndividualTeamScoreUI" + UI.uniqueNameNumber++;
        mod.AddUIContainer(coolahhuiname2, mod.CreateVector(30, 77, 0), mod.CreateVector(90, 36, 0), mod.UIAnchor.TopLeft, pp.player);
        let widgets2 = [mod.FindUIWidgetWithName(coolahhuiname2) as mod.UIWidget];
        mod.SetUIWidgetPadding(widgets2[0], 5);
        mod.SetUIWidgetVisible(widgets2[0], true);
        mod.SetUIWidgetBgFill(widgets2[0], mod.UIBgFill.GradientLeft);
        mod.SetUIWidgetBgColor(widgets2[0], UI.battlefieldWhite);
        mod.SetUIWidgetBgAlpha(widgets2[0], UI.gradientAlpha);

        widgets = widgets.concat(widgets2);

        const coolahhuiname3: string = "IndividualTeamScoreUI" + UI.uniqueNameNumber++;
        mod.AddUIImage(coolahhuiname3, mod.CreateVector(36, 82, 0), mod.CreateVector(33, 26, 0), mod.UIAnchor.TopLeft, mod.UIImageType.CrownOutline, pp.player);
        let widgets3 = [mod.FindUIWidgetWithName(coolahhuiname3) as mod.UIWidget];
        mod.SetUIWidgetPadding(widgets3[0], 5);
        mod.SetUIWidgetVisible(widgets3[0], true);
        mod.SetUIWidgetBgFill(widgets3[0], mod.UIBgFill.Solid);
        mod.SetUIWidgetBgColor(widgets3[0], UI.battlefieldWhite);
        mod.SetUIWidgetBgAlpha(widgets3[0], 0);

        widgets = widgets.concat(widgets3);

        const coolahhuiname4: string = "IndividualTeamScoreUI" + UI.uniqueNameNumber++;
        mod.AddUIImage(coolahhuiname4, mod.CreateVector(80, 82, 0), mod.CreateVector(33, 26, 0), mod.UIAnchor.TopLeft, mod.UIImageType.CrownOutline, pp.player);
        let widgets4 = [mod.FindUIWidgetWithName(coolahhuiname4) as mod.UIWidget];
        mod.SetUIWidgetPadding(widgets4[0], 5);
        mod.SetUIWidgetVisible(widgets4[0], true);
        mod.SetUIWidgetBgFill(widgets4[0], mod.UIBgFill.Solid);
        mod.SetUIWidgetBgColor(widgets4[0], UI.battlefieldWhite);
        mod.SetUIWidgetBgAlpha(widgets4[0], 0);

        widgets = widgets.concat(widgets4);

        const frameLine1 = UIH.CreateLine({
            baseName: "FrameLine",
            xOffset: 30,
            yOffset: 77,
            size: mod.CreateVector(1, 36, 0),
            alpha: 0.5,
            color: UI.battlefieldWhite,
            anchor: mod.UIAnchor.TopLeft,
            visible: true
        }, pp);

        return widgets;
    }

    static async UpdateIndividualTeamScore(pp: PlayerProfile, score: number) { // not iterating through this because it seems to crash the game (might just have been anchor that messes up but not taking any chances)
        console.log("should now update individual team score to: " + score)
        switch (score) {
            case 0:
                pp.playerIndividualTeamScoreWidget && mod.SetUIImageType(pp.playerIndividualTeamScoreWidget[2], mod.UIImageType.CrownOutline)
                pp.playerIndividualTeamScoreWidget && mod.SetUIImageType(pp.playerIndividualTeamScoreWidget[3], mod.UIImageType.CrownOutline)
                break;
            case 1:
                pp.playerIndividualTeamScoreWidget && mod.SetUIImageType(pp.playerIndividualTeamScoreWidget[2], mod.UIImageType.CrownSolid)
                pp.playerIndividualTeamScoreWidget && mod.SetUIImageType(pp.playerIndividualTeamScoreWidget[3], mod.UIImageType.CrownOutline)
                break;
            case 2:
                pp.playerIndividualTeamScoreWidget && mod.SetUIImageType(pp.playerIndividualTeamScoreWidget[2], mod.UIImageType.CrownSolid)
                pp.playerIndividualTeamScoreWidget && mod.SetUIImageType(pp.playerIndividualTeamScoreWidget[3], mod.UIImageType.CrownSolid)
                break;

            default:
                break;
        }
    }

    static CreateTeamScoreUI(pp: PlayerProfile): mod.UIWidget[] {
        let widgets: mod.UIWidget[] = [];
        for (let i = 0; i < 4; i++) {
            const coolahhuiname: string = "TeamScoreUI" + UI.uniqueNameNumber++;
            mod.AddUIText(coolahhuiname, mod.CreateVector(20, 213 + (i * 33), 0), mod.CreateVector(140, 30, 0), mod.UIAnchor.TopLeft, H.MakeMessage(mod.stringkeys.teamScore, i + 1, 0), pp.player);
            widgets.push(mod.FindUIWidgetWithName(coolahhuiname) as mod.UIWidget);
            mod.SetUITextColor(widgets[i], UI.battlefieldWhite);
            mod.SetUITextSize(widgets[i], 20);
            mod.SetUITextAnchor(widgets[i], mod.UIAnchor.TopLeft);
            mod.SetUIWidgetPadding(widgets[i], 5);
            mod.SetUIWidgetVisible(widgets[i], true);
            mod.SetUIWidgetBgFill(widgets[i], mod.UIBgFill.Solid);
            mod.SetUIWidgetBgColor(widgets[i], UI.battlefieldBlueBg);
            mod.SetUIWidgetBgAlpha(widgets[i], 0);
        }

        return widgets;
    }


    static CreatePlayerOnTeamUI(pp: PlayerProfile): mod.UIWidget[] {
        let widgets: mod.UIWidget[] = [];

        const playersOnEachTeam = H.GetPlayersOnTeam()

        const playerOnTeam = playersOnEachTeam[mod.GetObjId(mod.GetTeam(pp.player))];

        for (let i = 0; i < 4; i++) {
            const coolahhuiname: string = "OnTeamUI" + UI.uniqueNameNumber++;
            mod.AddUIText(coolahhuiname, mod.CreateVector(20, 213 + (i * 33), 0), mod.CreateVector(140, 30, 0), mod.UIAnchor.TopLeft, H.MakeMessage(mod.stringkeys.playerOnTeamName, pp.player), pp.player);
            widgets.push(mod.FindUIWidgetWithName(coolahhuiname) as mod.UIWidget);
            mod.SetUITextColor(widgets[i], UI.battlefieldWhite);
            mod.SetUITextSize(widgets[i], 20);
            mod.SetUITextAnchor(widgets[i], mod.UIAnchor.TopLeft);
            mod.SetUIWidgetPadding(widgets[i], 5);
            mod.SetUIWidgetBgFill(widgets[i], mod.UIBgFill.Solid);
            mod.SetUIWidgetBgColor(widgets[i], UI.battlefieldBlueBg);
            mod.SetUIWidgetBgAlpha(widgets[i], 0);

            if (i >= 0 && i < playerOnTeam.length) {
                mod.SetUITextLabel(widgets[i], H.MakeMessage(mod.stringkeys.playerOnTeamName, playerOnTeam[i]))
                mod.SetUIWidgetVisible(widgets[i], true);
            } else {
                mod.SetUIWidgetVisible(widgets[i], false);
            }
        }

        return widgets;
    }

    static UpdatePlayerOnTeamUI(widgets: mod.UIWidget[], pp: PlayerProfile) {

        const playersOnEachTeam = H.GetPlayersOnTeam()

        const playerOnTeam = playersOnEachTeam[mod.GetObjId(mod.GetTeam(pp.player))];

        for (let i = 0; i < widgets.length; i++) {
            if (i >= 0 && i < playerOnTeam.length) {
                mod.SetUITextLabel(widgets[i], H.MakeMessage(mod.stringkeys.playerOnTeamName, playerOnTeam[i]))
                mod.SetUIWidgetVisible(widgets[i], true);
            } else {
                mod.SetUIWidgetVisible(widgets[i], false);
            }
        }

    }

    static CreateDeployUI(pp: PlayerProfile): mod.UIWidget {
        const coolahhuiname: string = "DeployUI" + UI.uniqueNameNumber++;
        mod.AddUIText(coolahhuiname, mod.CreateVector(0, 210, 0), mod.CreateVector(600, 60, 0), mod.UIAnchor.TopCenter, H.MakeMessage(mod.stringkeys.preRoundStarted), pp.player);
        let widget = mod.FindUIWidgetWithName(coolahhuiname) as mod.UIWidget;
        mod.SetUITextColor(widget, UI.battlefieldWhite);
        mod.SetUITextSize(widget, 38);
        mod.SetUITextAnchor(widget, mod.UIAnchor.Center);
        mod.SetUIWidgetPadding(widget, 5);
        mod.SetUIWidgetVisible(widget, true);
        mod.SetUIWidgetBgFill(widget, mod.UIBgFill.Blur);
        mod.SetUIWidgetBgColor(widget, UI.battlefieldBlueBg);
        mod.SetUIWidgetBgAlpha(widget, 1);
        mod.SetUIWidgetDepth(widget, mod.UIDepth.AboveGameUI);

        return widget;
    }
}

// === src\HoH_UIHelpers.ts ===




// Interface for basic line configuration
interface LineConfig {
    baseName: string;           // Base name for the line (e.g., "DividingLine", "FrameLine")
    xOffset: number;            // Horizontal offset from anchor
    yOffset: number;            // Vertical offset from anchor
    size: mod.Vector;           // Width and height of the line
    anchor: mod.UIAnchor;       // UI anchor point
    color?: mod.Vector;         // Line color (defaults to battlefield blue)
    alpha?: number;             // Line transparency (defaults to 1)
    bgFill?: mod.UIBgFill;      // Background fill type (defaults to Solid)
    depth?: mod.UIDepth;        // UI depth (optional)
    visible?: boolean;          // Initial visibility (defaults to false)
    padding?: number;           // UI padding (optional)
}

// Interface for gradient line configuration
interface GradientLineConfig {
    baseName?: string;          // Base name for the line (defaults to "UIH")
    right: boolean;             // True for right gradient, false for left
    xOffset?: number;           // Horizontal offset from center (defaults to 150)
    yOffset?: number;           // Vertical offset from anchor (defaults to 185)
    size?: mod.Vector;          // Width and height (defaults to 150x25)
    alpha: number;              // Line transparency (required)
    color?: mod.Vector;         // Line color (defaults to battlefield white)
    anchor?: mod.UIAnchor;      // UI anchor point (defaults to TopCenter)
    depth?: mod.UIDepth;        // UI depth (optional)
    visible?: boolean;          // Initial visibility (defaults to false)
    padding?: number;           // UI padding (defaults to 1)
}

class UIH {
    static async AnimateUIToSizeOverTime(widgetGetter: (pp: PlayerProfile) => mod.UIWidget | undefined, players: mod.Player[], vector: mod.Vector, timeInSeconds: number/* , constant: boolean */){
        let terminate: boolean = false;
        const timeIncrement: number = ((1/30)/timeInSeconds);
        let originalSize: mod.Vector;
        let originalObtained: boolean = false;

        for (let i = 0; i < 1; i = i + timeIncrement) {
            players.forEach(element => {
                const pp = PlayerProfile.Get(element);
                if(pp){
                    const widget = widgetGetter(pp);
                    if(widget) {
                        if(!originalObtained){
                            originalObtained = true;
                            originalSize = mod.GetUIWidgetSize(widget)
                        }
                        const lerpedValue = H.LerpVector(mod.GetUIWidgetSize(widget), vector, i);
                        mod.SetUIWidgetSize(widget, lerpedValue);
                        if(mod.DistanceBetween(lerpedValue, vector) < 2) {
                            mod.SetUIWidgetSize(widget, vector);
                            //console.log("returning from interp size");
                            //setInvisibleWhenDone && mod.SetUIWidgetVisible(widget, false);
                            terminate = true;
                        }

                        if(terminate || (i + timeIncrement) >= 1){
                            console.log("running good terminate for " + mod.GetUIWidgetName(widget))
                            mod.SetUIWidgetVisible(widget, false);
                            mod.SetUIWidgetSize(widget, originalSize);
                            return;
                        }
                    }
                }
            });

            if(terminate) {
                //console.log("breaking size interp due to terminate");
                break;
            }

            //console.log("interping size");
            await mod.Wait(timeIncrement);
        }
    }

    static async AnimateUITextToAlphaOverTime(widgetGetter: (pp: PlayerProfile) => mod.UIWidget[] | undefined, players: mod.Player[], alpha: number, timeInSeconds: number){
        let terminate: boolean = false;
        const timeIncrement: number = ((1/30)/timeInSeconds);
        let alphaValues: number[] = []
        let originalsObtained: boolean = false;

        for (let i = 0; i < 1; i = i + timeIncrement) {
            players.forEach(element => {
                const pp = PlayerProfile.Get(element);
                if(pp){
                    const widgets = widgetGetter(pp);
                    if(widgets) {
                        widgets.forEach(element => {
                            const currentAlpha = mod.GetUITextAlpha(element);

                            if (!originalsObtained) alphaValues.push(currentAlpha);

                            const lerpedValue = H.Lerp(mod.GetUITextAlpha(element), alpha, i)
                            mod.SetUITextAlpha(element, lerpedValue);
                            if(Math.abs(lerpedValue - alpha) < 0.005) {
                                mod.SetUITextAlpha(element, alpha);
                                terminate = true;
                            }
                        });

                        if(!originalsObtained){
                            originalsObtained = true;
                            //console.log("text originals obtained")
                        }

                        if(terminate || (i + timeIncrement) >= 1){
                            widgets.forEach(element => {
                                const alphaToReset = alphaValues.shift()
                                if(alphaToReset) { 
                                    //console.log("setting text alpha: " + alphaToReset)
                                    mod.SetUIWidgetVisible(element, false);
                                    mod.SetUITextAlpha(element, alphaToReset);
                                }
                            });
                            return;
                        }
                    }
                }
            });

            if(terminate) {
                break;
            }

            await mod.Wait(timeIncrement);
        }
    }

    static async AnimateUIToBgAlphaOverTime(widgetGetter: (pp: PlayerProfile) => mod.UIWidget[] | undefined, players: mod.Player[], alpha: number, timeInSeconds: number){
        let terminate: boolean = false;
        const timeIncrement: number = ((1/30)/timeInSeconds);
        let alphaValues: number[] = []
        let originalsObtained: boolean = false;

        for (let i = 0; i < 1; i = i + timeIncrement) {
            players.forEach(element => {
                const pp = PlayerProfile.Get(element);
                if(pp){
                    const widgets = widgetGetter(pp);
                    if(widgets) {
                        widgets.forEach(element => {
                            const currentAlpha = mod.GetUIWidgetBgAlpha(element);

                            if (!originalsObtained) alphaValues.push(currentAlpha);

                            const lerpedValue = H.Lerp(mod.GetUIWidgetBgAlpha(element), alpha, i)
                            mod.SetUIWidgetBgAlpha(element, lerpedValue);
                            //console.log(lerpedValue);
                            if(Math.abs(lerpedValue - alpha) < 0.005) {
                                mod.SetUIWidgetBgAlpha(element, alpha);
                                terminate = true;
                            }
                        });

                        if(!originalsObtained){
                            originalsObtained = true;
                        }

                        if(terminate || (i + timeIncrement) >= 1){
                            widgets.forEach(element => {
                                const alphaToReset = alphaValues.shift();
                                if(alphaToReset){
                                    mod.SetUIWidgetVisible(element, false);
                                    mod.SetUIWidgetBgAlpha(element, alphaToReset);
                                }
                            });
                            return;
                        }
                    }
                }
            });

            if(terminate) {
                break;
            }

            await mod.Wait(timeIncrement);
        }
    }
    
    static CreateBlockFrame(pos: mod.Vector, width: number, height: number, anchor: mod.UIAnchor, pp: PlayerProfile, customUIDepth?: mod.UIDepth): mod.UIWidget[] {
        const xBorderOffset: number = -4;
        const yBorderOffset: number = 10;

        const blockWidth: number = 10;
        const blockHeight: number = 2;

        const widgets: mod.UIWidget[] = [];
        const dividingLines1 = UIH.CreateLine({
            baseName: "Dividing",
            xOffset: mod.XComponentOf(pos) + ((width + xBorderOffset)/2),
            yOffset: mod.YComponentOf(pos) + ((height + yBorderOffset)/2),
            size: mod.CreateVector(blockWidth, blockHeight, 0),
            alpha: 1,
            color: UI.battlefieldWhite,
            depth: customUIDepth,
            anchor: anchor,
            visible: true
        }, pp);
        widgets.push(dividingLines1);

        const dividingLines2 = UIH.CreateLine({
            baseName: "Dividing",
            xOffset: mod.XComponentOf(pos) + ((-width - xBorderOffset)/2),
            yOffset: mod.YComponentOf(pos) + ((height + yBorderOffset)/2),
            size: mod.CreateVector(blockWidth, blockHeight, 0),
            alpha: 1,
            color: UI.battlefieldWhite,
            depth: customUIDepth,
            anchor: anchor,
            visible: true
        }, pp);
        widgets.push(dividingLines2);

        const dividingLines3 = UIH.CreateLine({
            baseName: "Dividing",
            xOffset: mod.XComponentOf(pos) + ((width + xBorderOffset)/2),
            yOffset: mod.YComponentOf(pos) + ((-height - yBorderOffset)/2),
            size: mod.CreateVector(blockWidth, blockHeight, 0),
            alpha: 1,
            color: UI.battlefieldWhite,
            depth: customUIDepth,
            anchor: anchor,
            visible: true
        }, pp);
        widgets.push(dividingLines3);

        const dividingLines4 = UIH.CreateLine({
            baseName: "Dividing",
            xOffset: mod.XComponentOf(pos) + ((-width - xBorderOffset)/2),
            yOffset: mod.YComponentOf(pos) + ((-height - yBorderOffset)/2),
            size: mod.CreateVector(blockWidth, blockHeight, 0),
            alpha: 1,
            color: UI.battlefieldWhite,
            depth: customUIDepth,
            anchor: anchor,
            visible: true
        }, pp);
        widgets.push(dividingLines4);


        return widgets;
    }
    /**
     * Creates a single decorative line UI element
     */
    static CreateLine(config: LineConfig, pp: PlayerProfile): mod.UIWidget {
        const coolahhuiname: string = config.baseName + UI.uniqueNameNumber++;
        const position = mod.CreateVector(config.xOffset, config.yOffset, 0);
        
        mod.AddUIContainer(
            coolahhuiname, 
            position, 
            config.size, 
            config.anchor, 
            pp.player
        );
        
        let widget = mod.FindUIWidgetWithName(coolahhuiname) as mod.UIWidget;
        
        // Apply styling with defaults
        mod.SetUIWidgetVisible(widget, config.visible ?? false);
        mod.SetUIWidgetBgFill(widget, config.bgFill ?? mod.UIBgFill.Solid);
        mod.SetUIWidgetBgColor(widget, config.color ?? UI.battlefieldBlue);
        mod.SetUIWidgetBgAlpha(widget, config.alpha ?? 1);
        
        // Set padding if provided
        if (config.padding !== undefined) {
            mod.SetUIWidgetPadding(widget, config.padding);
        }
        
        // Set depth if provided
        if (config.depth) {
            mod.SetUIWidgetDepth(widget, config.depth);
        }
        
        return widget;
    }

    /**
     * Creates a gradient line UI element (left or right gradient)
     */
    static CreateGradientLine(config: GradientLineConfig, pp: PlayerProfile): mod.UIWidget {
        const coolahhuiname: string = (config.baseName ?? "UIH") + UI.uniqueNameNumber++;
        const horizontalOffset: number = config.right ? (config.xOffset ?? 150) : -(config.xOffset ?? 150);
        const position = mod.CreateVector(horizontalOffset, config.yOffset ?? 185, 0);
        const size = config.size ?? mod.CreateVector(150, 25, 0);
        const anchor = config.anchor ?? mod.UIAnchor.TopCenter;
        
        mod.AddUIContainer(coolahhuiname, position, size, anchor, pp.player);
        
        let widget = mod.FindUIWidgetWithName(coolahhuiname) as mod.UIWidget;
        
        // Set padding
        mod.SetUIWidgetPadding(widget, config.padding ?? 1);
        
        // Set gradient direction based on right parameter
        const gradientFill = config.right ? mod.UIBgFill.GradientLeft : mod.UIBgFill.GradientRight;
        mod.SetUIWidgetBgFill(widget, gradientFill);
        
        // Apply styling
        mod.SetUIWidgetBgColor(widget, config.color ?? UI.battlefieldWhite);
        mod.SetUIWidgetBgAlpha(widget, config.alpha);
        mod.SetUIWidgetVisible(widget, config.visible ?? false);
        
        // Set depth if provided
        if (config.depth) {
            mod.SetUIWidgetDepth(widget, config.depth);
        }
        
        return widget;
    }

    /**
     * Creates a pair of gradient lines (left and right) with matching configuration
     */
    static CreateGradientLinePair(config: Omit<GradientLineConfig, 'right'>, pp: PlayerProfile): mod.UIWidget[] {
        const leftConfig: GradientLineConfig = { ...config, right: false };
        const rightConfig: GradientLineConfig = { ...config, right: true };
        
        return [
            UIH.CreateGradientLine(leftConfig, pp),
            UIH.CreateGradientLine(rightConfig, pp)
        ];
    }

    /**
     * Legacy method for backward compatibility
     */
    static CreateUIH(
        right: boolean, 
        pp: PlayerProfile, 
        xOffset: number = 150, 
        yOffset: number = 185, 
        size: mod.Vector = mod.CreateVector(150, 25, 0), 
        alpha: number, 
        color: mod.Vector = UI.battlefieldWhite
    ): mod.UIWidget {
        return UIH.CreateGradientLine({
            right: right,
            xOffset: xOffset,
            yOffset: yOffset,
            size: size,
            alpha: alpha,
            color: color
        }, pp);
    }
}

