export interface ConfigDataProperty {
  default_system: string | undefined;
  chat_dice_roll: boolean | undefined;
}
export type ConfigKey = keyof ConfigDataProperty;
export type ConfigValueType = ConfigDataProperty[ConfigKey];
export type ConfigObject = { [name in ConfigKey]: ConfigDataProperty[name] };

export class ConfigData implements ConfigDataProperty {
  default_system: string | undefined;
  chat_dice_roll: boolean | undefined;

  constructor(default_system: string | undefined = undefined, chat_dice_roll: boolean | undefined = undefined) {
    this.default_system = default_system;
    this.chat_dice_roll = chat_dice_roll;
  }

  copy(): ConfigData {
    return new ConfigData(this.default_system, this.chat_dice_roll);
  }

  getValue<TKey extends ConfigKey>(key: TKey): ConfigDataProperty[TKey] {
    return (this as ConfigDataProperty)[key];
  }

  setValue<TKey extends ConfigKey>(key: TKey, value: ConfigDataProperty[TKey]): void {
    (this as ConfigDataProperty)[key] = value;
  }

  toDescription(channel: ConfigData = ConfigData.empty): string {
    return `デフォルトシステム: ${channel.default_system ?? this.default_system}\nチャットでダイスを振る: ${channel.chat_dice_roll ?? this.chat_dice_roll}`;
  }

  toObject(): ConfigObject {
    return {
      "default_system": this.default_system,
      "chat_dice_roll": this.chat_dice_roll,
    };
  }

  static default = new ConfigData("DiceBot", true);
  static empty = new ConfigData(undefined, undefined);

  static fromObject(object: ConfigObject): ConfigData {
    return new ConfigData(object.default_system, object.chat_dice_roll);
  }
}