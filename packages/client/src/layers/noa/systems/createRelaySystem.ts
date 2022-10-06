import { Quaternion } from "@babylonjs/core";
import { NetworkLayer } from "../../network/types";
import { NoaLayer } from "../types";
import {
  defineRxSystem,
  EntityID,
  EntityIndex,
  getComponentValueStrict,
  Has,
  HasValue,
  removeComponent,
  runQuery,
  setComponent,
} from "@latticexyz/recs";
import {
  Area,
  concatUint8Arrays,
  Int32ArrayToUint8Array,
  splitUint8Arrays,
  streamToDefinedComputed,
  Uint8ArrayToInt32Array,
  VoxelCoord,
} from "@latticexyz/utils";
import { getNoaPositionStrict } from "../engine/components/utils";
import { map, timer } from "rxjs";
import { createChunks, getChunksInArea, pixelToChunkCoord } from "@latticexyz/phaserx";
import { ChunkCoord } from "@latticexyz/phaserx/src/types";
import { toJS } from "mobx";

const PRECISION = 2;
const UNRESPONSIVE_PLAYER_CLEANUP = 2_000;
const TIMEOUT = 1_000;
export const RELAY_CHUNK_SIZE = 64;

function toFixedPoint(n: number): number {
  return Math.floor(n * Math.pow(10, PRECISION));
}

function fromFixedPoint(n: number): number {
  return n / Math.pow(10, PRECISION);
}

function createChunkTopicMessage(chunk: ChunkCoord) {
  return `c(${chunk.x},${chunk.y})`;
}

function encodeMessage(position: number[], direction: number[]): Uint8Array {
  const transformedData = [...position, ...direction].map(toFixedPoint);
  const data = Int32ArrayToUint8Array(transformedData);
  return concatUint8Arrays(data);
}

function decodeMessage(data: Uint8Array): { position: number[]; direction: number[] } {
  const [positionBytes, directionBytes] = splitUint8Arrays(data, [12, 16]);
  return {
    position: Uint8ArrayToInt32Array(positionBytes).map(fromFixedPoint),
    direction: Uint8ArrayToInt32Array(directionBytes).map(fromFixedPoint),
  };
}

export async function createRelaySystem(network: NetworkLayer, context: NoaLayer) {
  const {
    world,
    components: { PlayerPosition, PlayerRelayerChunkPosition, PlayerDirection, PlayerLastMessage },
    noa,
  } = context;

  const {
    network: { connectedAddress },
    relay,
  } = network;

  if (!relay) {
    console.warn("ECS message relayer not available. Not syncronizing player positions.");
    return;
  }

  function removePlayerComponent(entity: EntityIndex) {
    removeComponent(PlayerPosition, entity);
    removeComponent(PlayerDirection, entity);
    removeComponent(PlayerRelayerChunkPosition, entity);
    removeComponent(PlayerLastMessage, entity);
  }

  const playerPosition$ = timer(0, 200).pipe(map(() => getNoaPositionStrict(noa, noa.playerEntity)));
  const HALF_LENGTH = RELAY_CHUNK_SIZE;

  const currentArea$ = playerPosition$.pipe(
    map<VoxelCoord, Area>((c) => ({
      x: c.x - HALF_LENGTH,
      y: c.z - HALF_LENGTH,
      width: HALF_LENGTH * 2,
      height: HALF_LENGTH * 2,
    }))
  );

  const currentChunk$ = playerPosition$.pipe(
    map<VoxelCoord, ChunkCoord>((vc) => pixelToChunkCoord({ x: vc.x, y: vc.z }, RELAY_CHUNK_SIZE))
  );

  const currentChunkComputed = streamToDefinedComputed(currentChunk$);
  const { addedChunks$, removedChunks$, visibleChunks } = createChunks(currentArea$, RELAY_CHUNK_SIZE, 0);

  // Initial subscription
  const initialArea = toJS((await streamToDefinedComputed(currentArea$)).get());
  for (const c of getChunksInArea(initialArea, RELAY_CHUNK_SIZE).coords()) {
    relay.subscribe(createChunkTopicMessage(c));
  }

  const addedChunkSubscription = addedChunks$.subscribe((chunk) => {
    relay.subscribe(createChunkTopicMessage(chunk));
  });

  const removedChunksSubcription = removedChunks$.subscribe((chunk) => {
    const removedPlayers = runQuery([
      Has(PlayerDirection),
      Has(PlayerPosition),
      HasValue(PlayerRelayerChunkPosition, chunk),
    ]);
    relay.unsubscribe(createChunkTopicMessage(chunk));
    for (const r of removedPlayers) {
      removePlayerComponent(r);
    }
  });

  async function relayPositionAndDirection(position: number[], direction: number[]) {
    const currentChunk = toJS((await currentChunkComputed).get());
    relay?.push(createChunkTopicMessage(currentChunk), encodeMessage(position, direction));
  }

  const relaySubscription = playerPosition$.subscribe(() => {
    const position = getNoaPositionStrict(noa, noa.playerEntity);
    const pitch = noa.camera.pitch;
    const yaw = noa.camera.heading;
    const q = Quaternion.FromEulerAngles(pitch, yaw, 0);
    const quaternion: number[] = [];
    q.toArray(quaternion);
    relayPositionAndDirection([position.x, position.y, position.z], quaternion);
  });

  defineRxSystem(world, relay.event$, ({ message, address }) => {
    const {
      position: [x, y, z],
      direction: [qx, qy, qz, qw],
    } = decodeMessage(message.data);
    if (address === connectedAddress.get()) return;
    const playerChunk = pixelToChunkCoord({ x, y: z }, RELAY_CHUNK_SIZE);
    if (!visibleChunks.current.has(playerChunk) || !visibleChunks.current.get(playerChunk)) return;
    const entity = world.registerEntity({ id: address as EntityID });
    setComponent(PlayerPosition, entity, { x, y, z });
    setComponent(PlayerDirection, entity, { qx, qy, qz, qw });
    setComponent(PlayerLastMessage, entity, { value: Date.now() });
  });

  defineRxSystem(world, timer(UNRESPONSIVE_PLAYER_CLEANUP, UNRESPONSIVE_PLAYER_CLEANUP), () => {
    const allPlayers = runQuery([Has(PlayerLastMessage)]);
    const timeOut = Date.now() - TIMEOUT;
    for (const player of allPlayers) {
      const { value: lastMessage } = getComponentValueStrict(PlayerLastMessage, player);
      if (lastMessage < timeOut) removePlayerComponent(player);
    }
  });

  world.registerDisposer(() => relaySubscription.unsubscribe());
  world.registerDisposer(() => addedChunkSubscription.unsubscribe());
  world.registerDisposer(() => removedChunksSubcription.unsubscribe());
}
