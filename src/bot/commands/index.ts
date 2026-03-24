import { Bot } from "../bot";
import { Commands } from "./type";

import "./bcdice";
import "./config";

Bot.helpers.upsertGlobalApplicationCommands(Commands.array());