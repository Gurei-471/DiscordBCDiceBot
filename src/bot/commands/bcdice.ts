import { ApplicationCommandOptionTypes, EmbedsBuilder, InteractionResponseTypes } from "@discordeno/bot";
import { createGroupCommand, createOption, createSub, createSubCommand } from "./type";
import { Bot } from "../bot";
import { Version } from "@gurei-471/bcdice-js";
import { getResultText, getSystem, SystemInfos } from "../../utils";
import { getConfigValue } from "../../config";

const searchMaxCount = 40;

createSub({
  name: "bcdice",
  description: "BCDice関連のコマンドです",
  options: [
    createSubCommand({
      type: ApplicationCommandOptionTypes.SubCommand,
      name: "version",
      description: "BCDiceのバージョンを表示します",
      options: [
        createOption({
          type: ApplicationCommandOptionTypes.Boolean,
          name: "onlyyourself",
          description: "自分だけに表示 (デフォルト: true)",
        })
      ],
      async execute(interaction, options) {
        await Bot.helpers.sendInteractionResponse(interaction.id, interaction.token, {
          type: InteractionResponseTypes.ChannelMessageWithSource,
          data: {
            content: `BCDiceバージョン: ${Version}`,
            flags: options.onlyyourself ?? true ? 0b01000000 : 0b00000000
          }
        });
      }
    }),
    createGroupCommand({
      type: ApplicationCommandOptionTypes.SubCommandGroup,
      name: "search",
      description: "システム検索関係のコマンドです",
      options: [
        createSubCommand({
          type: ApplicationCommandOptionTypes.SubCommand,
          name: "id",
          description: "システムIdでシステムを検索をします",
          options: [
            createOption({
              type: ApplicationCommandOptionTypes.String,
              name: "id",
              description: "システムId",
              required: true
            }),
            createOption({
              type: ApplicationCommandOptionTypes.Boolean,
              name: "onlyyourself",
              description: "自分だけに表示 (デフォルト: true)"
            })
          ],
          async execute(interaction, options) {
            const list = SystemInfos.filter(value => value.id.includes(options.id));
            let text = list.slice(0, searchMaxCount).reduce<string>((previous, current) => `${previous}${current.name} : ${current.id}\n`, "");
            if (list.length > searchMaxCount) {
              text += `表示できなかった候補: ${list.length - searchMaxCount}個`;
            }
            await Bot.helpers.sendInteractionResponse(interaction.id, interaction.token, {
              type: InteractionResponseTypes.ChannelMessageWithSource,
              data: {
                embeds: new EmbedsBuilder().setTitle(`システムId検索: ${options.id}`).setDescription(text).setColor(0x7FFF7F),
                flags: options.onlyyourself ?? true ? 0b01000000 : 0b00000000
              }
            });
          }
        }),
        createSubCommand({
          type: ApplicationCommandOptionTypes.SubCommand,
          name: "name",
          description: "システム名でシステムを検索をします",
          options: [
            createOption({
              type: ApplicationCommandOptionTypes.String,
              name: "name",
              description: "システム名",
              required: true
            }),
            createOption({
              type: ApplicationCommandOptionTypes.Boolean,
              name: "onlyyourself",
              description: "自分だけに表示 (デフォルト: true)"
            })
          ],
          async execute(interaction, options) {
            const list = SystemInfos.filter(value => value.name.includes(options.name));
            let text = list.slice(0, searchMaxCount).reduce<string>((previous, current) => `${previous}${current.name} : ${current.id}\n`, "");
            if (list.length > searchMaxCount) {
              text += `表示できなかった候補: ${list.length - searchMaxCount}個`;
            }
            await Bot.helpers.sendInteractionResponse(interaction.id, interaction.token, {
              type: InteractionResponseTypes.ChannelMessageWithSource,
              data: {
                embeds: new EmbedsBuilder().setTitle(`システム名検索: ${options.name}`).setDescription(text).setColor(0x7FFF7F),
                flags: options.onlyyourself ?? true ? 0b01000000 : 0b00000000
              }
            });
          }
        }),
      ]
    }),
    createSubCommand({
      type: ApplicationCommandOptionTypes.SubCommand,
      name: "help",
      description: "システムのヘルプを表示します",
      options: [
        createOption({
          type: ApplicationCommandOptionTypes.String,
          name: "system",
          description: "ヘルプの表示するシステム (デフォルト: 実行するチャンネルのデフォルトシステム)"
        }),
        createOption({
          type: ApplicationCommandOptionTypes.Boolean,
          name: "onlyyourself",
          description: "自分だけに表示 (デフォルト: true)"
        })
      ],
      async execute(interaction, options) {
        const system = await getSystem(options.system ?? (await getConfigValue(interaction.guildId, interaction.channel.id!, "default_system"))!);
        await Bot.helpers.sendInteractionResponse(interaction.id, interaction.token, {
          type: InteractionResponseTypes.ChannelMessageWithSource,
          data: {
            embeds: new EmbedsBuilder().setTitle(system.NAME).setDescription(system.HELP_MESSAGE),
            flags: options.onlyyourself ?? true ? 0b01000000 : 0b00000000
          }
        });
      }
    }),
    createSubCommand({
      type: ApplicationCommandOptionTypes.SubCommand,
      name: "roll",
      description: "指定されたシステムでダイスを振ります",
      options: [
        createOption({
          type: ApplicationCommandOptionTypes.String,
          name: "dice",
          description: "ダイスのコマンド",
          required: true,
          minLength: 1
        }),
        createOption({
          type: ApplicationCommandOptionTypes.String,
          name: "system",
          description: "振るダイスのシステムを指定します (デフォルト:実行するチャンネルのデフォルトシステム)"
        }),
        createOption({
          type: ApplicationCommandOptionTypes.Boolean,
          name: "onlyyourself",
          description: "自分だけに表示 (デフォルト: false)"
        })
      ],
      async execute(interaction, options) {
        const system = await getSystem(options.system ?? (await getConfigValue(interaction.guildId, interaction.channel.id!, "default_system"))!);
        const dice = system.eval(options.dice);
        if (dice == undefined) {
          await Bot.helpers.sendInteractionResponse(interaction.id, interaction.token, {
            type: InteractionResponseTypes.ChannelMessageWithSource,
            data: {
              content: `有効なコマンドではありません\nシステムが違う可能性があります`,
              flags: 0b01000000
            }
          });
          return;
        }
        if (dice.secret) {
          Bot.helpers.sendMessage(interaction.channel.id!, {
            content: "シークレットダイス"
          });
        }
        const text = getResultText(dice);
        await Bot.helpers.sendInteractionResponse(interaction.id, interaction.token, {
          type: InteractionResponseTypes.ChannelMessageWithSource,
          data: {
            content: text,
            flags: options.onlyyourself || dice.secret ? 0b01000000 : 0b00000000
          }
        });
      }
    })
  ],
});