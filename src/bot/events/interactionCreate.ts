import { ApplicationCommandOptionTypes, commandOptionsParser, InteractionDataOption, InteractionResponseTypes, InteractionTypes } from "@discordeno/bot";
import { Bot } from "../bot";
import { Commands, ExecuteBase, RootSub, RootSubCommand } from "../commands/type";

Bot.events.interactionCreate = async (interaction) => {
  if (!interaction.data || interaction.type != InteractionTypes.ApplicationCommand) return;

  let command = Commands.get(interaction.data.name);
  if (!command) {
    Bot.logger.error(`The command '${interaction.data.name}' was not found.`);
    Bot.helpers.sendInteractionResponse(interaction.id, interaction.token, {
      type: InteractionResponseTypes.ChannelMessageWithSource,
      data: {
        content: `The command \\'${interaction.data.name}\\' was not found.\nPlease create an issue describing the commands you used and the situation.`,
        flags: 0b01000000
      }
    });
    return;
  }

  let executor: ExecuteBase<any> | undefined;
  let options: InteractionDataOption[] | undefined = interaction.data.options;

  if ("execute" in command) {
    executor = command;
  }
  else {
    let sub: RootSubCommand<any> | RootSub | undefined = command;

    while (true) {
      const option = options?.[0];
      if (!option) break;
      if (option.type != ApplicationCommandOptionTypes.SubCommand && option.type != ApplicationCommandOptionTypes.SubCommandGroup) 
        break;
      sub = sub?.options?.find((value: { name: string; }) => value.name === option.name);
      if (!sub) break;
      options = option.options;
      if ("execute" in sub) {
        executor = sub;
        break;
      }
    }
  }

  if (!executor) {
    Bot.logger.error(`The subcommand for '${command.name}' was not found.`);
    Bot.helpers.sendInteractionResponse(interaction.id, interaction.token, {
      type: InteractionResponseTypes.ChannelMessageWithSource,
      data: {
        content: `The subcommand for \\'${command.name}\\' was not found.\nPlease create an issue describing the commands you used and the situation.`,
        flags: 0b01000000
      }
    });
    return;
  }

  try {
    await executor?.execute(interaction, commandOptionsParser(interaction, options));
  }
  catch (error) {
    Bot.logger.error(`There was an error running the ${command.name} command.\n${error}`);
    Bot.helpers.sendInteractionResponse(interaction.id, interaction.token, {
      type: InteractionResponseTypes.ChannelMessageWithSource,
      data: {
        content: `There was an error running the ${command.name} command.\n${error}\nPlease create an issue describing the commands you used and the situation.`,
        flags: 0b01000000
      }
    });
  }
};