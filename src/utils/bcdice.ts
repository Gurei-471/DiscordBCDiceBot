import { DynamicLoader } from "@gurei-471/bcdice-js";
import GameSystemClass from "@gurei-471/bcdice-js/lib/game_system";
import Result from "@gurei-471/bcdice-js/lib/result";

const loader = new DynamicLoader();
export const SystemInfos = loader.listAvailableGameSystems();
export const DiceBot = await loader.dynamicLoad("DiceBot");
const systems = new Map<string, GameSystemClass>([
  ["DiceBot", DiceBot]
]);
export async function getSystem(id: string): Promise<GameSystemClass> {
  if (systems.has(id)) return systems.get(id)!;
  if (SystemInfos.findIndex(value => value.id == id) != -1) {
    const system = await loader.dynamicLoad(id);
    systems.set(system.ID, system);
    systems.set(system.NAME, system);
    return system;
  }
  if (SystemInfos.findIndex(value => value.name == id) != -1) {
    const system = await loader.dynamicLoad(loader.getGameSystemIdByName(id));
    systems.set(system.ID, system);
    systems.set(system.NAME, system);
    return system;
  }
  systems.set(id, DiceBot);
  return DiceBot;
}

export function getResultText(result: Result) {
  const color: number = result.success || result.critical ? 34 : (result.failure || result.fumble ? 31 : 0);
  return `\`\`\`ansi\n\u001b[${color}m${result.text}\u001b[0m\n\`\`\``;
}