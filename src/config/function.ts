import { open } from "sqlite";
import sqlite3 from "sqlite3";
import { ConfigData, ConfigDataProperty, ConfigKey, ConfigObject } from "./type";

const database = await open({
  filename: "./dicebot.db",
  driver: sqlite3.Database
});

await database.exec(`
  CREATE TABLE IF NOT EXISTS guild_config (
    id TEXT PRIMARY KEY,
    default_system TEXT NOT NULL DEFAULT 'DiceBot',
    chat_dice_roll BOOLEAN NOT NULL DEFAULT '1',
    channel_configs JSON NOT NULL DEFAULT '{}'
  )
`);

const get_guild_config = await database.prepare("SELECT * FROM guild_config WHERE id = ?");
const get_channel_configs = await database.prepare("SELECT json_extract(channel_configs, '$') AS channel_configs FROM guild_config WHERE id = ?");
const set_guild_config = await database.prepare(`
  INSERT INTO guild_config (id, default_system, chat_dice_roll) VALUES (?, ?, ?)
  ON CONFLICT (id) DO UPDATE SET default_system = excluded.default_system, chat_dice_roll = excluded.chat_dice_roll
`);
const set_channel_configs = await database.prepare("UPDATE guild_config SET channel_configs = ? WHERE id = ?");
const set_channel_config = await database.prepare("UPDATE guild_config SET channel_configs = json_set(channel_configs, '$.' || ?, json(?)) WHERE id = ?");
const remove_channel_config = await database.prepare("UPDATE guild_config SET channel_configs = json_remove(channel_configs, '$.' || ?) WHERE id = ?");

export type Configs = {
  [key: string]: ConfigData;
}

export function toObject(configs: Configs): { [key: string]: ConfigObject } {
  return Object.fromEntries(
    new Map<string, ConfigObject>(
      Array.from(Object.entries(configs), ([key, data]) => [key, data.toObject()])
    )
  );
}

export async function getGuildConfig(guild: bigint): Promise<ConfigData> {
  const guild_config = await get_guild_config.get<{ default_system: string, chat_dice_roll: number }>(guild.toString());
  if (guild_config == undefined) return ConfigData.default.copy();
  return new ConfigData(guild_config.default_system, Boolean(guild_config.chat_dice_roll));
}

export async function getChannelConfigs(guild: bigint): Promise<Configs> {
  const guild_config = await get_channel_configs.get<{ channel_configs: string }>(guild.toString());
  const result: Configs = { };
  if (guild_config == undefined) return result;
  const parse = JSON.parse(guild_config.channel_configs);
  for (const key in parse) {
    result[key] = ConfigData.fromObject(parse[key]);
  }
  return result;
}

export async function getChannelConfig(guild: bigint, channel: bigint): Promise<ConfigData> {
  const channel_config = (await getChannelConfigs(guild))[channel.toString()];
  if (channel_config != undefined) {
    return channel_config;
  }
  return ConfigData.empty.copy();
}

export async function getDMConfigs(): Promise<Configs> {
  const dm_config = await get_channel_configs.get<{ channel_configs: string }>("DM");
  const result: Configs = { };
  if (dm_config == undefined) return result;
  const parse = JSON.parse(dm_config.channel_configs);
  for (const key in parse) {
    result[key] = ConfigData.fromObject(JSON.parse(parse[key]));
  }
  return result;
}

export async function getDMConfig(dm: bigint): Promise<ConfigData> {
  const dm_config = (await getDMConfigs())[dm.toString()];
  if (dm_config != undefined) {
    return dm_config;
  }
  return ConfigData.default.copy();
}

export async function setGuildConfig(guild: bigint, data: ConfigData): Promise<void> {
  await set_guild_config.run(guild.toString(), data.default_system, data.chat_dice_roll ? 1 : 0);
}

export async function setChannelConfigs(guild: bigint, data: Configs): Promise<void> {
  await set_channel_configs.run(JSON.stringify(toObject(data)), guild.toString());
}

export async function setChannelConfig(guild: bigint, channel: bigint, data: ConfigData): Promise<void> {
  await set_channel_config.run(channel.toString(), JSON.stringify(data.toObject()), guild.toString());
}

export async function setDMConfigs(data: Configs): Promise<void> {
  await set_channel_configs.run(JSON.stringify(toObject(data)), "DM");
}

export async function setDMConfig(dm: bigint, data: ConfigData): Promise<void> {
  await set_channel_config.run(dm.toString(), JSON.stringify(data.toObject()), "DM");
}

export async function removeChannelConfig(guild: bigint, channel: bigint): Promise<void> {
  await remove_channel_config.run(channel.toString(), guild.toString());
}

export async function removeDMConfig(dm: bigint): Promise<void> {
  await remove_channel_config.run(dm.toString(), "DM");
}

export async function getGuildConfigValue<TKey extends ConfigKey>(guild: bigint, key: TKey): Promise<ConfigDataProperty[TKey]> {
  return (await getGuildConfig(guild)).getValue(key);
}

export async function getChannelConfigValue<TKey extends ConfigKey>(guild: bigint, channel: bigint, key: TKey): Promise<ConfigDataProperty[TKey]> {
  return (await getChannelConfig(guild, channel)).getValue(key);
}

export async function getDMConfigValue<TKey extends ConfigKey>(dm: bigint, key: TKey): Promise<ConfigDataProperty[TKey]> {
  return (await getDMConfig(dm)).getValue(key);
}

export async function getConfigValue<TKey extends ConfigKey>(guild: bigint | undefined, channel: bigint, key: TKey): Promise<ConfigDataProperty[TKey]> {
  return (
    guild ? (
      await getChannelConfigValue(guild, channel, key) ?? await getGuildConfigValue(guild, key)
    ) : (
      await getDMConfigValue(channel, key)
    )
  ) ?? ConfigData.default.getValue(key);
}