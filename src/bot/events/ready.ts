import { logger } from "@discordeno/bot";
import { Bot } from "../bot";

Bot.events.ready = ({ user }) => {
  logger.info(`${user.username} is ready!`);
};