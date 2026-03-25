import { ApplicationCommandOptionTypes, ChannelTypes, EmbedsBuilder, InteractionResponseTypes } from "@discordeno/bot";
import { createGroupCommand, createOption, createSub, createSubCommand } from "./type";
import { Bot } from "../bot";
import { getChannelConfig, getDMConfig, getGuildConfig, removeChannelConfig, removeDMConfig, setChannelConfig, setDMConfig, setGuildConfig } from "../../config";
import { SystemInfos } from "../../utils";

createSub({
  name: "config",
  description: "設定関連のコマンドです",
  options: [
    createGroupCommand({
      type: ApplicationCommandOptionTypes.SubCommandGroup,
      name: "view",
      description: "設定を表示します",
      options: [
        createSubCommand({
          type: ApplicationCommandOptionTypes.SubCommand,
          name: "guild",
          description: "現在のサーバーの設定を表示します",
          options: [
            createOption({
              type: ApplicationCommandOptionTypes.Boolean,
              name: "onlyyourself",
              description: "自分だけに表示 (デフォルト: true)",
            })
          ],
          async execute(interaction, options) {
            if (!interaction.guildId) {
              await Bot.helpers.sendInteractionResponse(interaction.id, interaction.token, {
                type: InteractionResponseTypes.ChannelMessageWithSource,
                data: {
                  embeds: new EmbedsBuilder().setTitle("DM設定").setDescription((await getDMConfig(interaction.channel.id!)).toDescription()),
                  flags: options.onlyyourself ?? true ? 0b01000000 : 0b00000000
                }
              });
              return;
            }
            await Bot.helpers.sendInteractionResponse(interaction.id, interaction.token, {
              type: InteractionResponseTypes.ChannelMessageWithSource,
              data: {
                embeds: new EmbedsBuilder().setTitle("サーバー設定").setDescription((await getGuildConfig(interaction.guildId)).toDescription()),
                flags: options.onlyyourself ?? true ? 0b01000000 : 0b00000000
              }
            });
          }
        }),
        createSubCommand({
          type: ApplicationCommandOptionTypes.SubCommand,
          name: "channel",
          description: "チャンネルの設定を表示します",
          options: [
            createOption({
              type: ApplicationCommandOptionTypes.Channel,
              name: "channel",
              description: "どのチャンネルの設定を表示するか (デフォルト:実行したチャンネル)",
              channelTypes: [ChannelTypes.GuildText, ChannelTypes.GuildVoice, ChannelTypes.GuildForum]
            }),
            createOption({
              type: ApplicationCommandOptionTypes.Boolean,
              name: "onlyyourself",
              description: "自分だけに表示 (デフォルト: true)",
            })
          ],
          async execute(interaction, options) {
            if (!interaction.guildId) {
              const channelId = interaction.channel.id!;
              await Bot.helpers.sendInteractionResponse(interaction.id, interaction.token, {
                type: InteractionResponseTypes.ChannelMessageWithSource,
                data: {
                  embeds: new EmbedsBuilder().setTitle("DM設定").setDescription((await getDMConfig(channelId)).toDescription()).newEmbed(),
                  flags: options.onlyyourself ?? true ? 0b01000000 : 0b00000000
                }
              });
              if (options.channel != undefined) {
                const message = await Bot.helpers.sendMessage(channelId, {
                  content: "覗き見はダメですよ",
                });
                setTimeout(async () => await Bot.helpers.deleteMessage(channelId, message.id), 5000);
              }
              return;
            }
            await Bot.helpers.sendInteractionResponse(interaction.id, interaction.token, {
              type: InteractionResponseTypes.ChannelMessageWithSource,
              data: {
                embeds: new EmbedsBuilder().setTitle("チャンネル設定").setDescription((await getChannelConfig(
                  interaction.guildId, (options.channel ?? interaction.channel).id!
                )).toDescription()),
                flags: options.onlyyourself ?? true ? 0b01000000 : 0b00000000
              }
            });
          }
        }),
        createSubCommand({
          type: ApplicationCommandOptionTypes.SubCommand,
          name: "outline",
          description: "設定の概要を表示します",
          options: [
            createOption({
              type: ApplicationCommandOptionTypes.Channel,
              name: "channel",
              description: "どのチャンネルの設定を表示するか (デフォルト:実行したチャンネル)",
              channelTypes: [ChannelTypes.GuildText, ChannelTypes.GuildVoice, ChannelTypes.GuildForum]
            }),
            createOption({
              type: ApplicationCommandOptionTypes.Boolean,
              name: "onlyyourself",
              description: "自分だけに表示 (デフォルト: true)",
            })
          ],
          async execute(interaction, options) {
            if (!interaction.guildId) {
              const channelId = interaction.channel.id!;
              await Bot.helpers.sendInteractionResponse(interaction.id, interaction.token, {
                type: InteractionResponseTypes.ChannelMessageWithSource,
                data: {
                  embeds: new EmbedsBuilder().setTitle("DM設定").setDescription((await getDMConfig(channelId)).toDescription()).newEmbed(),
                  flags: options.onlyyourself ?? true ? 0b01000000 : 0b00000000
                }
              });
              if (options.channel != undefined) {
                const message = await Bot.helpers.sendMessage(channelId, {
                  content: "覗き見はダメですよ",
                });
                setTimeout(async () => await Bot.helpers.deleteMessage(channelId, message.id), 5000);
              }
              return;
            }
            await Bot.helpers.sendInteractionResponse(interaction.id, interaction.token, {
              type: InteractionResponseTypes.ChannelMessageWithSource,
              data: {
                embeds: new EmbedsBuilder().setTitle("設定").setDescription((await getGuildConfig(interaction.guildId)).toDescription(
                  await getChannelConfig(interaction.guildId, (options.channel ?? interaction.channel).id!)
                )),
                flags: options.onlyyourself ?? true ? 0b01000000 : 0b00000000
              }
            });
          }
        })
      ]
    }),
    createGroupCommand({
      type: ApplicationCommandOptionTypes.SubCommandGroup,
      name: "guild",
      description: "サーバー設定関連のコマンドです (管理者限定)",
      options: [
        createSubCommand({
          type: ApplicationCommandOptionTypes.SubCommand,
          name: "default_system",
          description: "デフォルトのシステムを変更します (管理者限定)",
          options: [
            createOption({
              type: ApplicationCommandOptionTypes.String,
              name: "value",
              description: "変更する値",
              required: true
            })
          ],
          async execute(interaction, options) {
            if (interaction.guildId && !interaction.member?.permissions?.has("ADMINISTRATOR")) {
              await Bot.helpers.sendInteractionResponse(interaction.id, interaction.token, {
                type: InteractionResponseTypes.ChannelMessageWithSource,
                data: {
                  content: "あなたの権限では実行できません",
                  flags: 0b01000000
                }
              });
              return;
            }
            if (SystemInfos.findIndex(x => x.id == options.value || x.name == options.value) == -1) {
              await Bot.helpers.sendInteractionResponse(interaction.id, interaction.token, {
                type: InteractionResponseTypes.ChannelMessageWithSource,
                data: {
                  content: `${options.value}というシステムを確認することができませんでした`,
                  flags: 0b01000000
                }
              });
              return;
            }
            if (interaction.guildId) {
              const config = await getGuildConfig(interaction.guildId);
              config.setValue("default_system", options.value);
              await setGuildConfig(interaction.guildId, config);
            }
            else {
              if (interaction.channel.id) {
                const config = await getDMConfig(interaction.channel.id);
                config.setValue("default_system", options.value);
                await setDMConfig(interaction.channel.id, config);
              }
              else {
                await Bot.helpers.sendInteractionResponse(interaction.id, interaction.token, {
                  type: InteractionResponseTypes.ChannelMessageWithSource,
                  data: {
                    content: `設定を変更することができませんでした`,
                    flags: 0b01000000
                  }
                });
                return;
              }
            }
            await Bot.helpers.sendInteractionResponse(interaction.id, interaction.token, {
              type: InteractionResponseTypes.ChannelMessageWithSource,
              data: {
                content: `設定を変更しました\nデフォルトシステム: ${options.value}`,
                flags: 0b01000000
              }
            });
          }
        }),
        createSubCommand({
          type: ApplicationCommandOptionTypes.SubCommand,
          name: "chat_dice_roll",
          description: "チャットでダイスロールが可能かを変更します (管理者限定)",
          options: [
            createOption({
              type: ApplicationCommandOptionTypes.Boolean,
              name: "value",
              description: "変更する値",
              required: true
            })
          ],
          async execute(interaction, options) {
            if (interaction.guildId && !interaction.member?.permissions?.has("ADMINISTRATOR")) {
              await Bot.helpers.sendInteractionResponse(interaction.id, interaction.token, {
                type: InteractionResponseTypes.ChannelMessageWithSource,
                data: {
                  content: "あなたの権限では実行できません",
                  flags: 0b01000000
                }
              });
              return;
            }
            if (interaction.guildId) {
              const config = await getGuildConfig(interaction.guildId);
              config.setValue("chat_dice_roll", options.value);
              await setGuildConfig(interaction.guildId, config);
            }
            else {
              if (interaction.channel.id) {
                const config = await getDMConfig(interaction.channel.id);
                config.setValue("chat_dice_roll", options.value);
                await setDMConfig(interaction.channel.id, config);
              }
              else {
                await Bot.helpers.sendInteractionResponse(interaction.id, interaction.token, {
                  type: InteractionResponseTypes.ChannelMessageWithSource,
                  data: {
                    content: `設定を変更することができませんでした`,
                    flags: 0b01000000
                  }
                });
                return;
              }
            }
            await Bot.helpers.sendInteractionResponse(interaction.id, interaction.token, {
              type: InteractionResponseTypes.ChannelMessageWithSource,
              data: {
                content: `設定を変更しました\nチャットでダイスを振る: ${options.value}`,
                flags: 0b01000000
              }
            });
          }
        })
      ]
    }),
    createGroupCommand({
      type: ApplicationCommandOptionTypes.SubCommandGroup,
      name: "channel",
      description: "チャンネル設定関連のコマンドです (チャンネル管理者 及び チャンネル作成者限定)",
      options: [
        createSubCommand({
          type: ApplicationCommandOptionTypes.SubCommand,
          name: "default_system",
          description: "デフォルトのシステムを変更します (チャンネル管理者 及び チャンネル作成者限定)",
          options: [
            createOption({
              type: ApplicationCommandOptionTypes.String,
              name: "value",
              description: "変更する値",
              required: true
            })
          ],
          async execute(interaction, options) {
            if (interaction.guildId && !(interaction.member?.permissions?.has("MANAGE_CHANNELS") || interaction.channel.ownerId == interaction.user.id)) {
              await Bot.helpers.sendInteractionResponse(interaction.id, interaction.token, {
                type: InteractionResponseTypes.ChannelMessageWithSource,
                data: {
                  content: "あなたの権限では実行できません",
                  flags: 0b01000000
                }
              });
              return;
            }
            if (SystemInfos.findIndex(x => x.id == options.value || x.name == options.value) == -1) {
              await Bot.helpers.sendInteractionResponse(interaction.id, interaction.token, {
                type: InteractionResponseTypes.ChannelMessageWithSource,
                data: {
                  content: `${options.value}というシステムを確認することができませんでした`,
                  flags: 0b01000000
                }
              });
              return;
            }
            if (interaction.channel.id) {
              if (interaction.guildId) {
                const config = await getChannelConfig(interaction.guildId, interaction.channel.id);
                config.setValue("default_system", options.value);
                await setChannelConfig(interaction.guildId, interaction.channel.id, config);
              }
              else {
                const config = await getDMConfig(interaction.channel.id);
                config.setValue("default_system", options.value);
                await setDMConfig(interaction.channel.id, config);
              }
              await Bot.helpers.sendInteractionResponse(interaction.id, interaction.token, {
                type: InteractionResponseTypes.ChannelMessageWithSource,
                data: {
                  content: `設定を変更しました\nデフォルトシステム: ${options.value}`,
                  flags: 0b01000000
                }
              });
              return;
            }
            await Bot.helpers.sendInteractionResponse(interaction.id, interaction.token, {
              type: InteractionResponseTypes.ChannelMessageWithSource,
              data: {
                content: `設定を変更することができませんでした`,
                flags: 0b01000000
              }
            });
          }
        }),
        createSubCommand({
          type: ApplicationCommandOptionTypes.SubCommand,
          name: "chat_dice_roll",
          description: "チャットでダイスロールが可能かを変更します (チャンネル管理者 及び チャンネル作成者限定)",
          options: [
            createOption({
              type: ApplicationCommandOptionTypes.Boolean,
              name: "value",
              description: "変更する値",
              required: true
            })
          ],
          async execute(interaction, options) {
            if (interaction.guildId && !(interaction.member?.permissions?.has("MANAGE_CHANNELS") || interaction.channel.ownerId == interaction.user.id)) {
              await Bot.helpers.sendInteractionResponse(interaction.id, interaction.token, {
                type: InteractionResponseTypes.ChannelMessageWithSource,
                data: {
                  content: "あなたの権限では実行できません",
                  flags: 0b01000000
                }
              });
              return;
            }
            if (interaction.channel.id) {
              if (interaction.guildId) {
                const config = await getChannelConfig(interaction.guildId, interaction.channel.id);
                config.setValue("chat_dice_roll", options.value);
                await setChannelConfig(interaction.guildId, interaction.channel.id, config);
              }
              else {
                const config = await getDMConfig(interaction.channel.id);
                config.setValue("chat_dice_roll", options.value);
                await setDMConfig(interaction.channel.id, config);
              }
              await Bot.helpers.sendInteractionResponse(interaction.id, interaction.token, {
                type: InteractionResponseTypes.ChannelMessageWithSource,
                data: {
                  content: `設定を変更しました\nチャットでダイスを振る: ${options.value}`,
                  flags: 0b01000000
                }
              });
              return;
            }
            await Bot.helpers.sendInteractionResponse(interaction.id, interaction.token, {
              type: InteractionResponseTypes.ChannelMessageWithSource,
              data: {
                content: `設定を変更することができませんでした`,
                flags: 0b01000000
              }
            });
          }
        }),
        createSubCommand({
          type: ApplicationCommandOptionTypes.SubCommand,
          name: "remove",
          description: "チャンネルの設定を削除します (チャンネル管理者 及び チャンネル作成者限定)",
          async execute(interaction, options) {
            if (interaction.guildId && !(interaction.member?.permissions?.has("MANAGE_CHANNELS") || interaction.channel.ownerId == interaction.user.id)) {
              await Bot.helpers.sendInteractionResponse(interaction.id, interaction.token, {
                type: InteractionResponseTypes.ChannelMessageWithSource,
                data: {
                  content: "あなたの権限では実行できません",
                  flags: 0b01000000
                }
              });
              return;
            }
            if (interaction.channel.id) {
              if (interaction.guildId) {
                await removeChannelConfig(interaction.guildId, interaction.channel.id);
              }
              else {
                await removeDMConfig(interaction.channel.id);
              }
              return await Bot.helpers.sendInteractionResponse(interaction.id, interaction.token, {
                type: InteractionResponseTypes.ChannelMessageWithSource,
                data: {
                  content: "チャンネル設定を削除しました"
                }
              })
            }
          }
        })
      ]
    })
  ]
});