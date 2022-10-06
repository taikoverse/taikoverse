import { formatEntityID } from "@latticexyz/network/src/utils";
import { Coord, padToBitLength, to256BitString, toInt32 } from "@latticexyz/utils";

export function getStakeEntity(chunk: Coord, entity: string) {
  console.log("entity", entity);
  return formatEntityID(
    to256BitString(entity) +
      padToBitLength(toInt32(chunk.x).toString(16), 32).substring(2) +
      padToBitLength(toInt32(chunk.y).toString(16), 32).substring(2)
  );
}