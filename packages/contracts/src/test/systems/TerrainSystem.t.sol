// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

import "../MudTest.t.sol";
import { Perlin } from "noise/Perlin.sol";
import { TerrainSystem, ID as TerrainSystemID, VoxelCoord } from "../../systems/TerrainSystem.sol";
import { StoneID, WaterID, LogID, AirID, GrassID, AirID, SandID } from "../../prototypes/Blocks.sol";

contract TerrainSystemTest is MudTest {
  function testExecute() public {
    uint256 blockType = TerrainSystem(system(TerrainSystemID)).executeTyped(VoxelCoord(-327, 21, -603));
    assertEq(blockType, StoneID);

    blockType = TerrainSystem(system(TerrainSystemID)).executeTyped(VoxelCoord(-377, -1, -632));
    assertEq(blockType, WaterID);

    blockType = TerrainSystem(system(TerrainSystemID)).executeTyped(VoxelCoord(-377, -1, -631));
    assertEq(blockType, LogID);

    blockType = TerrainSystem(system(TerrainSystemID)).executeTyped(VoxelCoord(-377, 0, -631));
    assertEq(blockType, AirID);

    blockType = TerrainSystem(system(TerrainSystemID)).executeTyped(VoxelCoord(-571, 0, -703));
    assertEq(blockType, GrassID);

    blockType = TerrainSystem(system(TerrainSystemID)).executeTyped(VoxelCoord(-573, 0, -708));
    assertEq(blockType, SandID);
  }
}
