import { MessageTypes, DiscordMessageReferenceType, MessageFlags } from "@discordeno/bot";
import { getConfigValue } from "../../config";
import { getResultText, getSystem } from "../../utils";
import { Bot } from "../bot";

Bot.events.messageCreate = async ({ author, channelId, content, guildId, id, type }) => {
  if (type != MessageTypes.Default) return;
  if (author == undefined) return;
  if (author.bot) return;
  if (content == "") return;
  if (!await getConfigValue(guildId, channelId, "chat_dice_roll")) return;
  const system = await getSystem((await getConfigValue(guildId, channelId, "default_system"))!);
  const dice = system.eval(content);
  if (dice == undefined) return;
  const text = getResultText(dice);
  if (!dice.secret) {
    await Bot.helpers.sendMessage(channelId, {
      content: text,
      allowedMentions: {
        repliedUser: false
      },
      messageReference: {
        type: DiscordMessageReferenceType.Default,
        messageId: id,
        channelId: channelId,
        guildId: guildId,
        failIfNotExists: false,
      },
      flags: MessageFlags.SuppressNotifications
    });
  }
  else {
    const secret_text = await Bot.helpers.sendMessage(channelId, {
      content: "シークレットダイス",
      allowedMentions: {
        repliedUser: false
      },
      messageReference: {
        type: DiscordMessageReferenceType.Default,
        messageId: id,
        channelId: channelId,
        guildId: guildId,
        failIfNotExists: false,
      },
      flags: MessageFlags.SuppressNotifications
    });
    try {
      await Bot.helpers.sendMessage((await Bot.helpers.getDmChannel(author.id)).id, {
        allowedMentions: {
          repliedUser: false
        },
        messageReference: {
          type: DiscordMessageReferenceType.Forward,
          messageId: id,
          channelId: channelId,
          guildId: guildId,
          failIfNotExists: false,
        },
        flags: MessageFlags.SuppressNotifications
      });
      await Bot.helpers.sendMessage((await Bot.helpers.getDmChannel(author.id)).id, {
        content: text,
        allowedMentions: {
          repliedUser: false
        },
        flags: MessageFlags.SuppressNotifications
      });
    }
    catch {
      await Bot.helpers.deleteMessage(channelId, secret_text.id);
      await Bot.helpers.sendMessage(channelId, {
        content: `DMを受け取れない設定のようです\n\n${text}`,
        allowedMentions: {
          repliedUser: false
        },
        messageReference: {
          type: DiscordMessageReferenceType.Default,
          messageId: id,
          channelId: channelId,
          guildId: guildId,
          failIfNotExists: false,
        },
        flags: MessageFlags.SuppressNotifications
      });
    }
  }
};