import { removeChannelConfig, removeDMConfig } from "../../config";
import { Bot } from "../bot";

Bot.events.channelDelete = async (channel) => {
  if (channel.guildId) {
    await removeChannelConfig(channel.guildId, channel.id);
  }
  else {
    await removeDMConfig(channel.id);
  }
};