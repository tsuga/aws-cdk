import { IAction } from './action';
import { CfnPipeline } from './codepipeline.generated';
import { validateTriggers } from './private/validation';

/**
 * Git push filter for trigger.
 */
export interface GitPushFilter extends GitFilter {
  /**
   * The list of patterns of Git tags that, when pushed, are to be excluded from
   * starting the pipeline.
   *
   * You can filter with glob patterns. The `tagsExcludes` takes priority
   * over the `tagsIncludes`.
   *
   * Maximum length of this array is 8.
   *
   * @default - no tags.
   */
  readonly tagsExcludes?: string[];

  /**
   * The list of patterns of Git tags that, when pushed, are to be included as
   * criteria that starts the pipeline.
   *
   * You can filter with glob patterns. The `tagsExcludes` takes priority
   * over the `tagsIncludes`.
   *
   * Maximum length of this array is 8.
   *
   * @default - no tags.
   */
  readonly tagsIncludes?: string[];
}

/**
 * Git pull request filter for trigger.
 */
export interface GitPullRequestFilter extends GitFilter {

  /**
   * The field that specifies which pull request events to filter on (opened, updated, closed)
   * for the trigger configuration.
   *
   * @default - all events.
   */
  readonly events?: GitPullRequestEvent[];
}

/**
 * Git filter of branches and files for trigger branches and files.
 */
interface GitFilter {
  /**
   * The list of patterns of Git branches that, when pull request events occurs, are
   * to be excluded from starting the pipeline.
   *
   * You can filter with glob patterns. The `branchesExcludes` takes priority
   * over the `branchesIncludes`.
   *
   * Maximum length of this array is 8.
   *
   * @default - no branches.
   */
  readonly branchesExcludes?: string[];

  /**
   * The list of patterns of Git branches that, when pull request events occurs, are
   * to be included as criteria that starts the pipeline.
   *
   * You can filter with glob patterns. The `branchesExcludes` takes priority
   * over the `branchesIncludes`.
   *
   * Maximum length of this array is 8.
   *
   * @default - no branches.
   */
  readonly branchesIncludes?: string[];

  /**
   * The list of patterns of Git repository file paths that, when pull request events occurs,
   * are to be excluded from starting the pipeline.
   *
   * You can filter with glob patterns. The `filePathsExcludes` takes priority
   * over the `filePathsIncludes`.
   *
   * Maximum length of this array is 8.
   *
   * @default - no filePaths.
   */
  readonly filePathsExcludes?: string[];

  /**
   * The list of patterns of Git repository file paths that, when pull request events occurs,
   * are to be included as criteria that starts the pipeline.
   *
   * You can filter with glob patterns. The `filePathsExcludes` takes priority
   * over the `filePathsIncludes`.
   *
   * Maximum length of this array is 8.
   *
   * @default - no filePaths.
   */
  readonly filePathsIncludes?: string[];
}

/**
 * Event for trigger with pull request filter.
 */
export enum GitPullRequestEvent {
  /**
   * OPEN
   */
  OPEN = 'OPEN',

  /**
   * UPDATED
   */
  UPDATED = 'UPDATED',

  /**
   * CLOSED
   */
  CLOSED = 'CLOSED',
}

/**
 * Git configuration for trigger.
 */
export interface GitConfiguration {
  /**
   * The pipeline source action where the trigger configuration, such as Git tags.
   *
   * The trigger configuration will start the pipeline upon the specified change only.
   * You can only specify one trigger configuration per source action.
   *
   * Since the provider for `sourceAction` must be `CodeStarSourceConnection`, you can use
   * `CodeStarConnectionsSourceAction` construct in `aws-codepipeline-actions` module.
   */
  readonly sourceAction: IAction;

  /**
   * The field where the repository event that will start the pipeline,
   * such as pushing Git tags, is specified with details.
   *
   * Git tags, file paths and branches are supported event type.
   *
   * The length must be less than or equal to 3.
   *
   * @default - no filter.
   */
  readonly pushFilter?: GitPushFilter[];

  /**
   * The field where the repository event that will start the pipeline
   * is specified as pull requests.
   *
   * The length must be less than or equal to 3.
   *
   * @default - no filter.
   */
  readonly pullRequestFilter?: GitPullRequestFilter[];
}

/**
 * Provider type for trigger.
 */
export enum ProviderType {
  /**
   * CodeStarSourceConnection
   */
  CODE_STAR_SOURCE_CONNECTION = 'CodeStarSourceConnection',
}

/**
 * Properties of trigger.
 */
export interface TriggerProps {
  /**
   * The source provider for the event, such as connections configured
   * for a repository with Git tags, for the specified trigger configuration.
   */
  readonly providerType: ProviderType;

  /**
   * Provides the filter criteria and the source stage for the repository
   * event that starts the pipeline, such as Git tags.
   *
   * @default - no configuration.
   */
  readonly gitConfiguration?: GitConfiguration;
}

/**
 * Trigger.
 */
export class Trigger {
  /**
   * The pipeline source action where the trigger configuration.
   */
  public readonly sourceAction: IAction | undefined;

  constructor(private readonly props: TriggerProps) {
    this.sourceAction = props.gitConfiguration?.sourceAction;
    this.validate();
  }

  private validate() {
    if (this.props.gitConfiguration) {
      validateTriggers(this.props.gitConfiguration);
    }
  }

  /**
   * Render to CloudFormation property.
   *
   * @internal
   */
  public _render(): CfnPipeline.PipelineTriggerDeclarationProperty {
    let gitConfiguration: CfnPipeline.GitConfigurationProperty | undefined;
    if (this.props.gitConfiguration) {
      const { sourceAction, pushFilter, pullRequestFilter } = this.props.gitConfiguration;

      const push = this.renderPushFilter(pushFilter);
      const pullRequest = this.renderPullRequestFilter(pullRequestFilter);

      gitConfiguration = {
        // set to undefined if empty array because CloudFormation does not accept empty array
        push: push?.length ? push : undefined,
        // set to undefined if empty array because CloudFormation does not accept empty array
        pullRequest: pullRequest?.length ? pullRequest : undefined,
        sourceActionName: sourceAction.actionProperties.actionName,
      };
    }
    return {
      gitConfiguration,
      providerType: this.props.providerType,
    };
  }

  private renderPushFilter(pushFilter?: GitPushFilter[]): CfnPipeline.GitPushFilterProperty[] | undefined {
    return pushFilter?.map(filter => {
      const branches: CfnPipeline.GitBranchFilterCriteriaProperty | undefined =
        this.getBranchFilterProperty(filter);
      const filePaths: CfnPipeline.GitFilePathFilterCriteriaProperty | undefined =
        this.getFilePathsFilterProperty(filter);
      const tags: CfnPipeline.GitTagFilterCriteriaProperty | undefined =
        this.getTagsFilterProperty(filter);
      return { branches, filePaths, tags };
    });
  }

  private renderPullRequestFilter(pullRequest?: GitPullRequestFilter[]): CfnPipeline.GitPullRequestFilterProperty[] | undefined {
    return pullRequest?.map(filter => {
      const branches: CfnPipeline.GitBranchFilterCriteriaProperty | undefined =
        this.getBranchFilterProperty(filter);
      const filePaths: CfnPipeline.GitFilePathFilterCriteriaProperty | undefined =
        this.getFilePathsFilterProperty(filter);
      // set to all events if empty array or undefined because CloudFormation does not accept empty array and undefined
      const events: string[] = this.getEventsFilterProperty(filter);
      return { branches, filePaths, events };
    });
  }

  private getBranchFilterProperty(filter: GitFilter) : CfnPipeline.GitBranchFilterCriteriaProperty | undefined {
    return filter.branchesExcludes?.length || filter.branchesIncludes?.length ? {
      // set to undefined if empty array because CloudFormation does not accept empty array
      excludes: filter.branchesExcludes?.length ? filter.branchesExcludes : undefined,
      includes: filter.branchesIncludes?.length ? filter.branchesIncludes : undefined,
    } : undefined;
  }

  private getFilePathsFilterProperty(filter: GitFilter) : CfnPipeline.GitFilePathFilterCriteriaProperty | undefined {
    return filter.filePathsExcludes?.length || filter.filePathsIncludes?.length ? {
      // set to undefined if empty array because CloudFormation does not accept empty array
      excludes: filter.filePathsExcludes?.length ? filter.filePathsExcludes : undefined,
      includes: filter.filePathsIncludes?.length ? filter.filePathsIncludes : undefined,
    } : undefined;
  }

  private getTagsFilterProperty(filter: GitPushFilter) : CfnPipeline.GitTagFilterCriteriaProperty | undefined {
    return filter.tagsExcludes?.length || filter.tagsIncludes?.length ? {
      // set to undefined if empty array because CloudFormation does not accept empty array
      excludes: filter.tagsExcludes?.length ? filter.tagsExcludes : undefined,
      includes: filter.tagsIncludes?.length ? filter.tagsIncludes : undefined,
    } : undefined;
  }

  private getEventsFilterProperty(filter: GitPullRequestFilter) : string[] {
    return filter.events?.length ? Array.from(new Set(filter.events)) : [
      GitPullRequestEvent.OPEN,
      GitPullRequestEvent.UPDATED,
      GitPullRequestEvent.CLOSED,
    ];
  }
}
