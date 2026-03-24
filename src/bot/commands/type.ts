import { ApplicationCommandOption, ApplicationCommandOptionTypes, Attachment, Camelize, Collection, CreateSlashApplicationCommand, DesiredPropertiesBehavior, InteractionResolvedChannel, InteractionResolvedUser, ParsedInteractionOption, Role, TransformersDesiredProperties, TransformProperty } from "@discordeno/bot";
import { Behavior, DesiredInteraction, Properties } from "../bot";

export type ParametersTypes = Exclude<ApplicationCommandOptionTypes, ApplicationCommandOptionTypes.SubCommand | ApplicationCommandOptionTypes.SubCommandGroup>;

export type OptionType<
  TType extends ApplicationCommandOptionTypes,
  TProps extends TransformersDesiredProperties = typeof Properties,
  TBehavior extends DesiredPropertiesBehavior = typeof Behavior
> =
  TType extends ApplicationCommandOptionTypes.SubCommand ? ParsedInteractionOption<TProps, TBehavior> :
  TType extends ApplicationCommandOptionTypes.SubCommandGroup ? ParsedInteractionOption<TProps, TBehavior> :
  TType extends ApplicationCommandOptionTypes.String ? string :
  TType extends ApplicationCommandOptionTypes.Integer ? number :
  TType extends ApplicationCommandOptionTypes.Boolean ? boolean :
  TType extends ApplicationCommandOptionTypes.User ? TransformProperty<InteractionResolvedUser, TProps, TBehavior> :
  TType extends ApplicationCommandOptionTypes.Channel ? TransformProperty<InteractionResolvedChannel, TProps, TBehavior> :
  TType extends ApplicationCommandOptionTypes.Role ? TransformProperty<Role, TProps, TBehavior> :
  TType extends ApplicationCommandOptionTypes.Mentionable ? TransformProperty<InteractionResolvedUser, TProps, TBehavior> | TransformProperty<Role, TProps, TBehavior> :
  TType extends ApplicationCommandOptionTypes.Number ? number :
  TType extends ApplicationCommandOptionTypes.Attachment ? TransformProperty<Attachment, TProps, TBehavior> : never;

export type ParseOptions<T extends ParameterOption[]> = {
  [K in T[number] as K["name"]]: K["required"] extends true ? OptionType<K["type"]> : OptionType<K["type"]> | undefined
};

export type Execute<
  TOptions extends ParameterOption[]
> = (interaction: DesiredInteraction, options: ParseOptions<TOptions>) => Promise<unknown>;

export interface RootCommandBase extends Omit<CreateSlashApplicationCommand, 'options'> { }

export interface OptionBase<
  TType extends ApplicationCommandOptionTypes
> extends Omit<ApplicationCommandOption, 'type' | 'options'> {
  type: TType;
}

export interface ParameterOption extends OptionBase<ParametersTypes> { }

export interface ExecuteBase<
  TOptions extends ParameterOption[]
> {
  options?: Camelize<TOptions>;
  execute: Execute<TOptions>;
}

export interface SubCommandOption<
  TOptions extends ParameterOption[]
> extends OptionBase<ApplicationCommandOptionTypes.SubCommand>, ExecuteBase<TOptions> { }

export interface SubGroupOption<
  TOptions extends SubCommandOption<any>[]
> extends OptionBase<ApplicationCommandOptionTypes.SubCommandGroup> {
  options: Camelize<TOptions>;
}

export type RootSub = SubCommandOption<any> | SubGroupOption<any>;

export interface RootCommand<
  TOptions extends ParameterOption[]
> extends RootCommandBase, ExecuteBase<TOptions> { }

export interface RootSubCommand<
  TOptions extends RootSub[]
> extends RootCommandBase {
  options: Camelize<TOptions>;
}

export const Commands = new Collection<
  string, RootCommand<any> | RootSubCommand<any>
>();

export function createCommand<const T extends ParameterOption[]>(
  command: RootCommand<T>
): RootCommand<T> {
  Commands.set(command.name, command);
  return command;
}

export function createSub<const T extends RootSub[]>(
  command: RootSubCommand<T>
): RootSubCommand<T> {
  Commands.set(command.name, command);
  return command;
}

export function createSubCommand<const T extends ParameterOption[]>(
  option: SubCommandOption<T>
): SubCommandOption<T> {
  return option;
}

export function createGroupCommand<const T extends SubCommandOption<any>[]>(
  option: SubGroupOption<T>
): SubGroupOption<T> {
  return option;
}

export function createOption<const T extends ParameterOption>(
  option: T
): T {
  return option;
}