import {Client} from 'eris';
import {configure, Log4js} from 'log4js';
import {Config, loadConfig} from '../util/config';
import {EventRegistry} from '../registry/events';
import {GroupRegistry} from '../registry/groups';
import {PluginRegistry} from '../registry/plugins';
import {SlashRegistry} from '../registry/slashes';
import {TypeORM} from './database';

interface Internals {
  config: Config;
  client: Client;
  logger?: Log4js;
  database?: TypeORM;
}

/**
 * The core Blueprint client class to manage everything
 */
export class Blueprint {
  public events: EventRegistry;
  public groups: GroupRegistry;
  public plugins: PluginRegistry;
  public slashes?: SlashRegistry;
  private readonly config: Config;
  private readonly client: Client;
  private readonly logger?: Log4js;
  private readonly database?: TypeORM;

  /**
   * Creates a new Blueprint instance
   * @param config A path to a Blueprint configuration file
   */
  constructor(config: string) {
    this.config = loadConfig(config);
    if (this.config.logging) this.logger = configure(this.config.logging);
    if (this.config.database) this.database = new TypeORM(this.config.database);
    this.client = new Client(this.config.bot.token, this.config.bot.options);
    if (this.config.interactions) this.slashes = new SlashRegistry(this);
    this.groups = new GroupRegistry(this.config.developers);
    this.plugins = new PluginRegistry(this);
    this.events = new EventRegistry(this);
  }

  /**
   * Returns the internals of the Blueprint instance
   */
  get core(): Internals {
    return {
      config: this.config,
      client: this.client,
      logger: this.logger,
      database: this.database,
    };
  }

  /**
   * Initializes everything and connects to Discord
   */
  async start() {
    await this.database?.connect();
    await this.client.connect();
    await this.slashes?.sync();
  }
}
