import { config } from "dotenv";
config();

import { createBot, createDesiredPropertiesObject, DesiredPropertiesBehavior, GatewayIntents } from "@discordeno/bot";

export const Properties = createDesiredPropertiesObject({
  channel: {
    id: true,
    guildId: true
  },
  interaction: {
    id: true,
    type: true,
    guildId: true,
    channel: true,
    member: true,
    user: true,
    token: true,
    data: true
  },
  member: {
    permissions: true
  },
  message: {
    author: true,
    channelId: true,
    content: true,
    guildId: true,
    id: true,
    type: true
  },
  user: {
    toggles: true,
    username: true,
    id: true
  }
});
export const Behavior = DesiredPropertiesBehavior.RemoveKey;

export const Bot = createBot({
  token: process.env.BOT_TOKEN as string,
  intents: GatewayIntents.GuildMessages | GatewayIntents.DirectMessages | GatewayIntents.MessageContent,
  desiredProperties: Properties,
  desiredPropertiesBehavior: Behavior,
});

export type DesiredInteraction = typeof Bot.transformers.$inferredTypes.interaction;