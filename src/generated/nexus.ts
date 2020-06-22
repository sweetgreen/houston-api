/**
 * This file was generated by Nexus Schema
 * Do not make changes to this file directly
 */


import { core } from "@nexus/schema"
declare global {
  interface NexusGenCustomInputMethods<TypeName extends string> {
    json<FieldName extends string>(fieldName: FieldName, opts?: core.ScalarInputFieldConfig<core.GetGen3<"inputTypes", TypeName, FieldName>>): void // "JSON";
  }
}
declare global {
  interface NexusGenCustomOutputMethods<TypeName extends string> {
    json<FieldName extends string>(fieldName: FieldName, ...opts: core.ScalarOutSpread<TypeName, FieldName>): void // "JSON";
  }
}
declare global {
  interface NexusGenCustomOutputProperties<TypeName extends string> {
    model: NexusPrisma<TypeName, 'model'>
    crud: any
  }
}

declare global {
  interface NexusGen extends NexusGenTypes {}
}

export interface NexusGenInputs {
  InviteSearch: { // input type
    email?: string | null; // String
    inviteUuid?: any | null; // Uuid
  }
  UserSearch: { // input type
    email?: string | null; // String
    fullName?: string | null; // String
    username?: string | null; // String
    userUuid?: any | null; // Uuid
  }
}

export interface NexusGenEnums {
  EntityType: "DEPLOYMENT" | "SYSTEM" | "WORKSPACE"
  MetricType: "DEPLOYMENT_DATABASE" | "DEPLOYMENT_QUOTAS" | "DEPLOYMENT_SCHEDULER" | "DEPLOYMENT_STATUS" | "DEPLOYMENT_TASKS" | "DEPLOYMENT_USAGE"
  Operator: "AND" | "OR"
  Role: "DEPLOYMENT_ADMIN" | "DEPLOYMENT_EDITOR" | "DEPLOYMENT_VIEWER" | "SYSTEM_ADMIN" | "SYSTEM_EDITOR" | "SYSTEM_VIEWER" | "USER" | "WORKSPACE_ADMIN" | "WORKSPACE_EDITOR" | "WORKSPACE_VIEWER"
}

export interface NexusGenRootTypes {
  AirflowImage: { // root type
    channel: string; // String!
    tag: string; // String!
    version: string; // String!
  }
  AppConfig: { // root type
    baseDomain?: string | null; // String
    manualReleaseNames?: boolean | null; // Boolean
    smtpConfigured?: boolean | null; // Boolean
    version?: string | null; // String
  }
  AstroUnit: { // root type
    actualConns: number; // Float!
    airflowConns: number; // Float!
    cpu: number; // Int!
    memory: number; // Int!
    pods: number; // Float!
    price: number; // Float!
  }
  AuthConfig: {};
  AuthProvider: { // root type
    displayName?: string | null; // String
    name: string; // String!
    url: string; // String!
  }
  AuthUser: {};
  AuthUserCapabilities: { // root type
    canSysAdmin?: boolean | null; // Boolean
  }
  Card: { // root type
    billingEmail?: string | null; // String
    brand?: string | null; // String
    company?: string | null; // String
    expMonth: number; // Int!
    expYear: number; // Int!
    last4: string; // String!
    name?: string | null; // String
  }
  DeployInfo: { // root type
    current?: string | null; // String
  }
  Deployment: { // root type
    airflowVersion?: string | null; // String
    alertEmails: string[]; // [String!]!
    config?: any | null; // JSON
    createdAt: any; // DateTime!
    description?: string | null; // String
    id: string; // String!
    label?: string | null; // String
    releaseName?: string | null; // String
    status?: string | null; // String
    updatedAt: any; // DateTime!
    version?: string | null; // String
  }
  DeploymentCapabilities: { // root type
    canCreateServiceAccount?: boolean | null; // Boolean
    canDeleteDeployment?: boolean | null; // Boolean
    canDeleteServiceAccount?: boolean | null; // Boolean
    canDeploy?: boolean | null; // Boolean
    canUpdateDeployment?: boolean | null; // Boolean
    canUpdateServiceAccount?: boolean | null; // Boolean
  }
  DeploymentConfig: { // root type
    airflowImages: NexusGenRootTypes['AirflowImage'][]; // [AirflowImage!]!
    airflowVersions?: any | null; // JSON
    astroUnit: NexusGenRootTypes['AstroUnit']; // AstroUnit!
    defaultAirflowChartVersion: string; // String!
    defaultAirflowImageTag: string; // String!
    defaults: any; // JSON!
    executors: any; // JSON!
    latestVersion: string; // String!
    limits: any; // JSON!
    loggingEnabled: boolean; // Boolean!
    maxExtraAu?: number | null; // Int
    singleNamespace: boolean; // Boolean!
  }
  DeploymentLog: { // root type
    component?: string | null; // String
    id: string; // String!
    level?: string | null; // String
    message?: string | null; // String
    release?: string | null; // String
    timestamp?: string | null; // String
  }
  DeploymentMetric: { // root type
    label?: string | null; // String
    result?: any | null; // JSON
  }
  DeploymentStatus: { // root type
    result: any; // JSON!
  }
  DeploymentUrl: { // root type
    type?: string | null; // String
    url?: string | null; // String
  }
  DockerImage: { // root type
    createdAt: any; // DateTime!
    digest: string; // String!
    env: any; // JSON!
    id: string; // String!
    labels: any; // JSON!
    name?: string | null; // String
    tag: string; // String!
  }
  Email: { // root type
    address?: string | null; // String
    createdAt: any; // DateTime!
    id: string; // String!
    primary?: boolean | null; // Boolean
    token?: string | null; // String
    updatedAt: any; // DateTime!
    verified?: boolean | null; // Boolean
  }
  Invite: { // root type
    assignments: string; // String!
    createdAt: string; // String!
    email?: string | null; // String
    id: string; // String!
    token?: string | null; // String
    updatedAt: string; // String!
    uuid: string; // String!
  }
  InviteToken: { // root type
    createdAt: any; // DateTime!
    email: string; // String!
    id: string; // String!
    role?: string | null; // String
    token: string; // String!
    updatedAt: any; // DateTime!
  }
  LocalCredential: { // root type
    createdAt: any; // DateTime!
    id: string; // String!
    password?: string | null; // String
    resetToken?: string | null; // String
    updatedAt: any; // DateTime!
  }
  Mutation: {};
  PlatformRelease: { // root type
    createdAt: any; // DateTime!
    description?: string | null; // String
    id: string; // String!
    level?: string | null; // String
    releaseDate: any; // DateTime!
    updatedAt: any; // DateTime!
    url?: string | null; // String
    version?: string | null; // String
  }
  Query: {};
  RoleBinding: { // root type
    createdAt: any; // DateTime!
    id: string; // String!
    role?: string | null; // String
  }
  ServiceAccount: { // root type
    active?: boolean | null; // Boolean
    category?: string | null; // String
    createdAt: any; // DateTime!
    entityUuid?: any | null; // Uuid
    id: string; // String!
    label?: string | null; // String
    lastUsedAt?: any | null; // DateTime
    updatedAt: any; // DateTime!
  }
  Subscription: { // root type
    deploymentStatus: NexusGenRootTypes['DeploymentStatus']; // DeploymentStatus!
    log: NexusGenRootTypes['DeploymentLog']; // DeploymentLog!
    metrics: NexusGenRootTypes['DeploymentMetric'][]; // [DeploymentMetric!]!
  }
  Token: { // root type
    payload?: NexusGenRootTypes['TokenPayload'] | null; // TokenPayload
    value?: string | null; // String
  }
  TokenPayload: { // root type
    exp?: number | null; // Int
    iat?: number | null; // Int
    uuid?: any | null; // Uuid
  }
  User: { // root type
    createdAt: any; // DateTime!
    emails?: NexusGenRootTypes['Email'][] | null; // [Email!]
    fullName?: string | null; // String
    id: string; // String!
    status?: string | null; // String
    updatedAt: any; // DateTime!
    username?: string | null; // String
  }
  UserProp: { // root type
    category?: string | null; // String
    key?: string | null; // String
    value?: string | null; // String
  }
  Workspace: { // root type
    active?: boolean | null; // Boolean
    createdAt: any; // DateTime!
    description?: string | null; // String
    id: string; // String!
    label?: string | null; // String
    properties?: any | null; // JSON
    stripeCustomerId?: string | null; // String
    trialEndsAt?: string | null; // String
    updatedAt: any; // DateTime!
  }
  WorkspaceCapabilities: { // root type
    canCreateDeployment?: boolean | null; // Boolean
    canCreateServiceAccount?: boolean | null; // Boolean
    canDeleteServiceAccount?: boolean | null; // Boolean
    canDeleteUser?: boolean | null; // Boolean
    canDeleteWorkspace?: boolean | null; // Boolean
    canInviteUser?: boolean | null; // Boolean
    canUpdateBilling?: boolean | null; // Boolean
    canUpdateIAM?: boolean | null; // Boolean
    canUpdateServiceAccount?: boolean | null; // Boolean
    canUpdateUser?: boolean | null; // Boolean
    canUpdateWorkspace?: boolean | null; // Boolean
  }
  String: string;
  Int: number;
  Float: number;
  Boolean: boolean;
  ID: string;
  DateTime: any;
  JSON: any;
  Uuid: any;
}

export interface NexusGenAllTypes extends NexusGenRootTypes {
  InviteSearch: NexusGenInputs['InviteSearch'];
  UserSearch: NexusGenInputs['UserSearch'];
  EntityType: NexusGenEnums['EntityType'];
  MetricType: NexusGenEnums['MetricType'];
  Operator: NexusGenEnums['Operator'];
  Role: NexusGenEnums['Role'];
}

export interface NexusGenFieldTypes {
  AirflowImage: { // field return type
    channel: string; // String!
    tag: string; // String!
    version: string; // String!
  }
  AppConfig: { // field return type
    baseDomain: string | null; // String
    manualReleaseNames: boolean | null; // Boolean
    smtpConfigured: boolean | null; // Boolean
    version: string | null; // String
  }
  AstroUnit: { // field return type
    actualConns: number; // Float!
    airflowConns: number; // Float!
    cpu: number; // Int!
    memory: number; // Int!
    pods: number; // Float!
    price: number; // Float!
  }
  AuthConfig: { // field return type
    externalSignupUrl: string | null; // String
    initialSignup: boolean | null; // Boolean
    localEnabled: boolean | null; // Boolean
    providers: NexusGenRootTypes['AuthProvider'][]; // [AuthProvider!]!
    publicSignup: boolean | null; // Boolean
  }
  AuthProvider: { // field return type
    displayName: string | null; // String
    name: string; // String!
    url: string; // String!
  }
  AuthUser: { // field return type
    authUserCapabilities: NexusGenRootTypes['AuthUserCapabilities'] | null; // AuthUserCapabilities
    isAdmin: boolean | null; // Boolean
    permissions: any | null; // JSON
    token: NexusGenRootTypes['Token'] | null; // Token
    user: NexusGenRootTypes['User'] | null; // User
  }
  AuthUserCapabilities: { // field return type
    canSysAdmin: boolean | null; // Boolean
  }
  Card: { // field return type
    billingEmail: string | null; // String
    brand: string | null; // String
    company: string | null; // String
    expMonth: number; // Int!
    expYear: number; // Int!
    last4: string; // String!
    name: string | null; // String
  }
  DeployInfo: { // field return type
    current: string | null; // String
    nextCli: string | null; // String
  }
  Deployment: { // field return type
    airflowVersion: string | null; // String
    alertEmails: string[]; // [String!]!
    config: any | null; // JSON
    createdAt: any; // DateTime!
    deployInfo: NexusGenRootTypes['DeployInfo'] | null; // DeployInfo
    deploymentCapabilities: NexusGenRootTypes['DeploymentCapabilities'] | null; // DeploymentCapabilities
    description: string | null; // String
    env: any | null; // JSON
    id: string; // String!
    label: string | null; // String
    properties: any | null; // JSON
    releaseName: string | null; // String
    roleBindings: NexusGenRootTypes['RoleBinding'][]; // [RoleBinding!]!
    status: string | null; // String
    type: string | null; // String
    updatedAt: any; // DateTime!
    urls: NexusGenRootTypes['DeploymentUrl'][] | null; // [DeploymentUrl!]
    version: string | null; // String
    workspace: NexusGenRootTypes['Workspace'] | null; // Workspace
  }
  DeploymentCapabilities: { // field return type
    canCreateServiceAccount: boolean | null; // Boolean
    canDeleteDeployment: boolean | null; // Boolean
    canDeleteServiceAccount: boolean | null; // Boolean
    canDeploy: boolean | null; // Boolean
    canUpdateDeployment: boolean | null; // Boolean
    canUpdateServiceAccount: boolean | null; // Boolean
  }
  DeploymentConfig: { // field return type
    airflowImages: NexusGenRootTypes['AirflowImage'][]; // [AirflowImage!]!
    airflowVersions: any | null; // JSON
    astroUnit: NexusGenRootTypes['AstroUnit']; // AstroUnit!
    defaultAirflowChartVersion: string; // String!
    defaultAirflowImageTag: string; // String!
    defaults: any; // JSON!
    executors: any; // JSON!
    latestVersion: string; // String!
    limits: any; // JSON!
    loggingEnabled: boolean; // Boolean!
    maxExtraAu: number | null; // Int
    singleNamespace: boolean; // Boolean!
  }
  DeploymentLog: { // field return type
    component: string | null; // String
    id: string; // String!
    level: string | null; // String
    message: string | null; // String
    release: string | null; // String
    timestamp: string | null; // String
  }
  DeploymentMetric: { // field return type
    label: string | null; // String
    result: any | null; // JSON
  }
  DeploymentStatus: { // field return type
    result: any; // JSON!
  }
  DeploymentUrl: { // field return type
    type: string | null; // String
    url: string | null; // String
  }
  DockerImage: { // field return type
    createdAt: any; // DateTime!
    deployment: NexusGenRootTypes['Deployment']; // Deployment!
    digest: string; // String!
    env: any; // JSON!
    id: string; // String!
    labels: any; // JSON!
    name: string | null; // String
    tag: string; // String!
  }
  Email: { // field return type
    address: string | null; // String
    createdAt: any; // DateTime!
    id: string; // String!
    primary: boolean | null; // Boolean
    token: string | null; // String
    updatedAt: any; // DateTime!
    user: NexusGenRootTypes['User'] | null; // User
    verified: boolean | null; // Boolean
  }
  Invite: { // field return type
    assignments: string; // String!
    createdAt: string; // String!
    email: string | null; // String
    id: string; // String!
    role: string; // String!
    token: string | null; // String
    updatedAt: string; // String!
    uuid: string; // String!
  }
  InviteToken: { // field return type
    createdAt: any; // DateTime!
    email: string; // String!
    id: string; // String!
    role: string | null; // String
    token: string; // String!
    updatedAt: any; // DateTime!
  }
  LocalCredential: { // field return type
    createdAt: any; // DateTime!
    id: string; // String!
    password: string | null; // String
    resetToken: string | null; // String
    updatedAt: any; // DateTime!
    user: NexusGenRootTypes['User'] | null; // User
  }
  Mutation: { // field return type
    addCard: NexusGenRootTypes['Card']; // Card!
    addCustomerId: NexusGenRootTypes['Workspace']; // Workspace!
    confirmEmail: NexusGenRootTypes['AuthUser']; // AuthUser!
    createDeployment: NexusGenRootTypes['Deployment']; // Deployment!
    createDeploymentServiceAccount: NexusGenRootTypes['ServiceAccount']; // ServiceAccount!
    createServiceAccount: NexusGenRootTypes['ServiceAccount']; // ServiceAccount!
    createSystemRoleBinding: NexusGenRootTypes['RoleBinding']; // RoleBinding!
    createSystemServiceAccount: NexusGenRootTypes['ServiceAccount']; // ServiceAccount!
    createToken: NexusGenRootTypes['AuthUser']; // AuthUser!
    createUser: NexusGenRootTypes['AuthUser'] | null; // AuthUser
    createWorkspace: NexusGenRootTypes['Workspace']; // Workspace!
    createWorkspaceServiceAccount: NexusGenRootTypes['ServiceAccount']; // ServiceAccount!
    deleteDeployment: NexusGenRootTypes['Deployment']; // Deployment!
    deleteDeploymentServiceAccount: NexusGenRootTypes['ServiceAccount']; // ServiceAccount!
    deleteInviteToken: NexusGenRootTypes['Invite']; // Invite!
    deleteServiceAccount: NexusGenRootTypes['ServiceAccount']; // ServiceAccount!
    deleteSystemRoleBinding: NexusGenRootTypes['RoleBinding']; // RoleBinding!
    deleteSystemServiceAccount: NexusGenRootTypes['ServiceAccount']; // ServiceAccount!
    deleteWorkspace: NexusGenRootTypes['Workspace']; // Workspace!
    deleteWorkspaceServiceAccount: NexusGenRootTypes['ServiceAccount']; // ServiceAccount!
    deploymentAlertsUpdate: NexusGenRootTypes['Deployment']; // Deployment!
    extendWorkspaceTrial: NexusGenRootTypes['Workspace']; // Workspace!
    forgotPassword: boolean; // Boolean!
    inviteUser: NexusGenRootTypes['Invite']; // Invite!
    removeUser: NexusGenRootTypes['User']; // User!
    resendConfirmation: boolean; // Boolean!
    resetPassword: NexusGenRootTypes['AuthUser']; // AuthUser!
    suspendWorkspace: NexusGenRootTypes['Workspace']; // Workspace!
    updateCard: NexusGenRootTypes['Card']; // Card!
    updateDeployment: NexusGenRootTypes['Deployment']; // Deployment!
    updateDeploymentServiceAccount: NexusGenRootTypes['ServiceAccount']; // ServiceAccount!
    updateSelf: NexusGenRootTypes['User']; // User!
    updateServiceAccount: NexusGenRootTypes['ServiceAccount']; // ServiceAccount!
    updateWorkspace: NexusGenRootTypes['Workspace']; // Workspace!
    updateWorkspaceServiceAccount: NexusGenRootTypes['ServiceAccount']; // ServiceAccount!
    upgradeDeployment: NexusGenRootTypes['Deployment']; // Deployment!
    verifyEmail: boolean; // Boolean!
    workspaceAddUser: NexusGenRootTypes['Workspace']; // Workspace!
    workspaceRemoveUser: NexusGenRootTypes['Workspace']; // Workspace!
    workspaceUpdateUserRole: NexusGenEnums['Role']; // Role!
  }
  PlatformRelease: { // field return type
    createdAt: any; // DateTime!
    description: string | null; // String
    id: string; // String!
    level: string | null; // String
    releaseDate: any; // DateTime!
    updatedAt: any; // DateTime!
    url: string | null; // String
    version: string | null; // String
  }
  Query: { // field return type
    appConfig: NexusGenRootTypes['AppConfig'] | null; // AppConfig
    authConfig: NexusGenRootTypes['AuthConfig']; // AuthConfig!
    card: NexusGenRootTypes['Card']; // Card!
    deploymentConfig: NexusGenRootTypes['DeploymentConfig']; // DeploymentConfig!
    deployments: NexusGenRootTypes['Deployment'][] | null; // [Deployment!]
    deploymentServiceAccount: NexusGenRootTypes['ServiceAccount']; // ServiceAccount!
    deploymentServiceAccounts: NexusGenRootTypes['ServiceAccount'][] | null; // [ServiceAccount!]
    invites: NexusGenRootTypes['Invite'][] | null; // [Invite!]
    logs: NexusGenRootTypes['DeploymentLog'][] | null; // [DeploymentLog!]
    self: NexusGenRootTypes['AuthUser']; // AuthUser!
    serviceAccounts: NexusGenRootTypes['ServiceAccount'][] | null; // [ServiceAccount!]
    updateAvailable: NexusGenRootTypes['PlatformRelease'] | null; // PlatformRelease
    users: NexusGenRootTypes['User'][]; // [User!]!
    workspace: NexusGenRootTypes['Workspace'] | null; // Workspace
    workspaceDeployment: NexusGenRootTypes['Deployment'] | null; // Deployment
    workspaceDeployments: NexusGenRootTypes['Deployment'][] | null; // [Deployment!]
    workspaceInvites: NexusGenRootTypes['InviteToken'][] | null; // [InviteToken!]
    workspaces: NexusGenRootTypes['Workspace'][] | null; // [Workspace!]
    workspaceServiceAccount: NexusGenRootTypes['ServiceAccount'] | null; // ServiceAccount
    workspaceServiceAccounts: NexusGenRootTypes['ServiceAccount'][] | null; // [ServiceAccount!]
    workspaceUser: NexusGenRootTypes['User'] | null; // User
    workspaceUsers: NexusGenRootTypes['User'][] | null; // [User!]
  }
  RoleBinding: { // field return type
    createdAt: any; // DateTime!
    deployment: NexusGenRootTypes['Deployment'] | null; // Deployment
    id: string; // String!
    role: string | null; // String
    serviceAccount: NexusGenRootTypes['ServiceAccount'] | null; // ServiceAccount
    user: NexusGenRootTypes['User'] | null; // User
    workspace: NexusGenRootTypes['Workspace'] | null; // Workspace
  }
  ServiceAccount: { // field return type
    active: boolean | null; // Boolean
    apiKey: string | null; // String
    category: string | null; // String
    createdAt: any; // DateTime!
    deploymentUuid: any | null; // Uuid
    entityType: string; // String!
    entityUuid: any | null; // Uuid
    id: string; // String!
    label: string | null; // String
    lastUsedAt: any | null; // DateTime
    roleBinding: NexusGenRootTypes['RoleBinding']; // RoleBinding!
    updatedAt: any; // DateTime!
    workspaceUuid: any | null; // Uuid
  }
  Subscription: { // field return type
    deploymentStatus: NexusGenRootTypes['DeploymentStatus']; // DeploymentStatus!
    log: NexusGenRootTypes['DeploymentLog']; // DeploymentLog!
    metrics: NexusGenRootTypes['DeploymentMetric'][]; // [DeploymentMetric!]!
  }
  Token: { // field return type
    payload: NexusGenRootTypes['TokenPayload'] | null; // TokenPayload
    value: string | null; // String
  }
  TokenPayload: { // field return type
    exp: number | null; // Int
    iat: number | null; // Int
    uuid: any | null; // Uuid
  }
  User: { // field return type
    createdAt: any; // DateTime!
    emails: NexusGenRootTypes['Email'][] | null; // [Email!]
    fullName: string | null; // String
    id: string; // String!
    profile: NexusGenRootTypes['UserProp'][]; // [UserProp!]!
    roleBindings: NexusGenRootTypes['RoleBinding'][]; // [RoleBinding!]!
    status: string | null; // String
    updatedAt: any; // DateTime!
    username: string | null; // String
  }
  UserProp: { // field return type
    category: string | null; // String
    key: string | null; // String
    value: string | null; // String
  }
  Workspace: { // field return type
    active: boolean | null; // Boolean
    billingEnabled: boolean | null; // Boolean
    createdAt: any; // DateTime!
    deployments: NexusGenRootTypes['Deployment'][] | null; // [Deployment!]
    description: string | null; // String
    id: string; // String!
    invites: NexusGenRootTypes['Invite']; // Invite!
    label: string | null; // String
    paywallEnabled: boolean | null; // Boolean
    properties: any | null; // JSON
    roleBindings: NexusGenRootTypes['RoleBinding'][]; // [RoleBinding!]!
    stripeCustomerId: string | null; // String
    trialEndsAt: string | null; // String
    updatedAt: any; // DateTime!
    users: NexusGenRootTypes['User'][] | null; // [User!]
    uuid: any | null; // Uuid
    workspaceCapabilities: NexusGenRootTypes['WorkspaceCapabilities'] | null; // WorkspaceCapabilities
  }
  WorkspaceCapabilities: { // field return type
    canCreateDeployment: boolean | null; // Boolean
    canCreateServiceAccount: boolean | null; // Boolean
    canDeleteServiceAccount: boolean | null; // Boolean
    canDeleteUser: boolean | null; // Boolean
    canDeleteWorkspace: boolean | null; // Boolean
    canInviteUser: boolean | null; // Boolean
    canUpdateBilling: boolean | null; // Boolean
    canUpdateIAM: boolean | null; // Boolean
    canUpdateServiceAccount: boolean | null; // Boolean
    canUpdateUser: boolean | null; // Boolean
    canUpdateWorkspace: boolean | null; // Boolean
  }
}

export interface NexusGenArgTypes {
  Mutation: {
    addCard: { // args
      billingEmail?: string | null; // String
      company?: string | null; // String
      token?: string | null; // String
      workspaceUuid?: any | null; // Uuid
    }
    addCustomerId: { // args
      stripeCustomerId?: string | null; // String
      workspaceUuid?: any | null; // Uuid
    }
    confirmEmail: { // args
      duration?: number | null; // Int
      token?: string | null; // String
    }
    createDeployment: { // args
      airflowVersion?: string | null; // String
      cloudRole?: string | null; // String
      config?: any | null; // JSON
      description?: string | null; // String
      env?: any | null; // JSON
      label?: string | null; // String
      properties?: any | null; // JSON
      releaseName?: string | null; // String
      type?: string | null; // String
      version?: string | null; // String
      workspaceUuid?: any | null; // Uuid
    }
    createDeploymentServiceAccount: { // args
      category?: string | null; // String
      deploymentUuid?: any | null; // Uuid
      label?: string | null; // String
      role?: NexusGenEnums['Role'] | null; // Role
    }
    createServiceAccount: { // args
      category?: string | null; // String
      entityType?: NexusGenEnums['EntityType'] | null; // EntityType
      entityUuid?: any | null; // Uuid
      label?: string | null; // String
      role?: NexusGenEnums['Role'] | null; // Role
    }
    createSystemRoleBinding: { // args
      role?: NexusGenEnums['Role'] | null; // Role
      userId?: string | null; // ID
    }
    createSystemServiceAccount: { // args
      category?: string | null; // String
      label?: string | null; // String
      role?: NexusGenEnums['Role'] | null; // Role
    }
    createToken: { // args
      duration?: number | null; // Int
      identity?: string | null; // String
      password?: string | null; // String
    }
    createUser: { // args
      duration?: number | null; // Int
      email: string; // String!
      inviteToken?: string | null; // String
      password: string; // String!
      profile?: any | null; // JSON
      username?: string | null; // String
    }
    createWorkspace: { // args
      description?: string | null; // String
      isSuspended?: boolean | null; // Boolean
      label?: string | null; // String
      trialEndsAt?: string | null; // String
    }
    createWorkspaceServiceAccount: { // args
      category?: string | null; // String
      label?: string | null; // String
      role?: NexusGenEnums['Role'] | null; // Role
      workspaceUuid?: any | null; // Uuid
    }
    deleteDeployment: { // args
      deploymentUuid?: any | null; // Uuid
    }
    deleteDeploymentServiceAccount: { // args
      deploymentUuid?: any | null; // Uuid
      serviceAccountUuid?: any | null; // Uuid
    }
    deleteInviteToken: { // args
      inviteUuid?: any | null; // Uuid
    }
    deleteServiceAccount: { // args
      serviceAccountUuid?: any | null; // Uuid
    }
    deleteSystemRoleBinding: { // args
      role?: NexusGenEnums['Role'] | null; // Role
      userId?: string | null; // ID
    }
    deleteSystemServiceAccount: { // args
      serviceAccountUuid?: any | null; // Uuid
    }
    deleteWorkspace: { // args
      workspaceUuid?: any | null; // Uuid
    }
    deleteWorkspaceServiceAccount: { // args
      serviceAccountUuid?: any | null; // Uuid
      workspaceUuid?: any | null; // Uuid
    }
    deploymentAlertsUpdate: { // args
      alertEmails?: string[] | null; // [String!]
      deploymentUuid?: any | null; // Uuid
    }
    extendWorkspaceTrial: { // args
      extraDays?: number | null; // Int
      workspaceUuid?: any | null; // Uuid
    }
    forgotPassword: { // args
      email?: string | null; // String
    }
    inviteUser: { // args
      email?: string | null; // String
    }
    removeUser: { // args
      userUuid?: any | null; // Uuid
    }
    resendConfirmation: { // args
      email?: string | null; // String
    }
    resetPassword: { // args
      duration?: number | null; // Int
      password?: string | null; // String
      token?: string | null; // String
    }
    suspendWorkspace: { // args
      isSuspended?: boolean | null; // Boolean
      workspaceUuid?: any | null; // Uuid
    }
    updateCard: { // args
      billingEmail?: string | null; // String
      company?: string | null; // String
      token?: string | null; // String
      workspaceUuid?: any | null; // Uuid
    }
    updateDeployment: { // args
      cloudRole?: string | null; // String
      config?: any | null; // JSON
      deploymentUuid?: any | null; // Uuid
      env?: any | null; // JSON
      payload?: any | null; // JSON
      sync?: boolean | null; // Boolean
    }
    updateDeploymentServiceAccount: { // args
      deploymentUuid?: any | null; // Uuid
      payload?: any | null; // JSON
      serviceAccountUuid?: any | null; // Uuid
    }
    updateSelf: { // args
      payload?: any | null; // JSON
    }
    updateServiceAccount: { // args
      payload?: any | null; // JSON
      serviceAccountUuid?: any | null; // Uuid
    }
    updateWorkspace: { // args
      payload?: any | null; // JSON
      workspaceUuid?: any | null; // Uuid
    }
    updateWorkspaceServiceAccount: { // args
      payload?: any | null; // JSON
      serviceAccountUuid?: any | null; // Uuid
      workspaceUuid?: any | null; // Uuid
    }
    upgradeDeployment: { // args
      deploymentUuid?: any | null; // Uuid
      version?: string | null; // String
    }
    verifyEmail: { // args
      email?: string | null; // String
    }
    workspaceAddUser: { // args
      email?: string | null; // String
      role?: NexusGenEnums['Role'] | null; // Role
      workspaceUuid?: any | null; // Uuid
    }
    workspaceRemoveUser: { // args
      userUuid?: any | null; // Uuid
      workspaceUuid?: any | null; // Uuid
    }
    workspaceUpdateUserRole: { // args
      email?: string | null; // String
      role?: NexusGenEnums['Role'] | null; // Role
      workspaceUuid?: any | null; // Uuid
    }
  }
  Query: {
    authConfig: { // args
      duration?: number | null; // Int
      extras?: any | null; // JSON
      inviteToken?: string | null; // String
      redirect?: string | null; // String
    }
    card: { // args
      stripeCustomerId?: string | null; // String
      workspaceUuid: any; // Uuid!
    }
    deploymentConfig: { // args
      deploymentUuid?: any | null; // Uuid
      type?: string | null; // String
      version?: string | null; // String
      workspaceUuid?: any | null; // Uuid
    }
    deploymentServiceAccount: { // args
      deploymentUuid: any; // Uuid!
      serviceAccountUuid: any; // Uuid!
    }
    deploymentServiceAccounts: { // args
      deploymentUuid: any; // Uuid!
    }
    invites: { // args
      invite?: NexusGenInputs['InviteSearch'] | null; // InviteSearch
    }
    logs: { // args
      component?: string | null; // String
      deploymentUuid: any; // Uuid!
      search?: string | null; // String
      timestamp?: string | null; // String
    }
    serviceAccounts: { // args
      entityType: NexusGenEnums['EntityType']; // EntityType!
      entityUuid?: any | null; // Uuid
      serviceAccountUuid?: any | null; // Uuid
    }
    users: { // args
      user?: NexusGenInputs['UserSearch'] | null; // UserSearch
    }
    workspace: { // args
      workspaceUuid: any; // Uuid!
    }
    workspaceDeployment: { // args
      releaseName: string; // String!
      workspaceUuid: any; // Uuid!
    }
    workspaceDeployments: { // args
      releaseName?: string | null; // String
      workspaceUuid: any; // Uuid!
    }
    workspaceInvites: { // args
      invite?: NexusGenInputs['InviteSearch'] | null; // InviteSearch
      workspaceUuid: any; // Uuid!
    }
    workspaceServiceAccount: { // args
      serviceAccountUuid: any; // Uuid!
      workspaceUuid: any; // Uuid!
    }
    workspaceServiceAccounts: { // args
      workspaceUuid: any; // Uuid!
    }
    workspaceUser: { // args
      user: NexusGenInputs['UserSearch']; // UserSearch!
      workspaceUuid: any; // Uuid!
    }
    workspaceUsers: { // args
      user?: NexusGenInputs['UserSearch'] | null; // UserSearch
      workspaceUuid: any; // Uuid!
    }
  }
  Subscription: {
    deploymentStatus: { // args
      releaseName?: string | null; // String
    }
    log: { // args
      component?: string | null; // String
      deploymentUuid: any; // Uuid!
      search?: string | null; // String
      timestamp?: string | null; // String
    }
    metrics: { // args
      deploymentUuid: any; // Uuid!
      metricType?: NexusGenEnums['MetricType'][] | null; // [MetricType!]
      since?: number | null; // Int
      step?: number | null; // Int
    }
  }
}

export interface NexusGenAbstractResolveReturnTypes {
}

export interface NexusGenInheritedFields {}

export type NexusGenObjectNames = "AirflowImage" | "AppConfig" | "AstroUnit" | "AuthConfig" | "AuthProvider" | "AuthUser" | "AuthUserCapabilities" | "Card" | "DeployInfo" | "Deployment" | "DeploymentCapabilities" | "DeploymentConfig" | "DeploymentLog" | "DeploymentMetric" | "DeploymentStatus" | "DeploymentUrl" | "DockerImage" | "Email" | "Invite" | "InviteToken" | "LocalCredential" | "Mutation" | "PlatformRelease" | "Query" | "RoleBinding" | "ServiceAccount" | "Subscription" | "Token" | "TokenPayload" | "User" | "UserProp" | "Workspace" | "WorkspaceCapabilities";

export type NexusGenInputNames = "InviteSearch" | "UserSearch";

export type NexusGenEnumNames = "EntityType" | "MetricType" | "Operator" | "Role";

export type NexusGenInterfaceNames = never;

export type NexusGenScalarNames = "Boolean" | "DateTime" | "Float" | "ID" | "Int" | "JSON" | "String" | "Uuid";

export type NexusGenUnionNames = never;

export interface NexusGenTypes {
  context: Context.Context;
  inputTypes: NexusGenInputs;
  rootTypes: NexusGenRootTypes;
  argTypes: NexusGenArgTypes;
  fieldTypes: NexusGenFieldTypes;
  allTypes: NexusGenAllTypes;
  inheritedFields: NexusGenInheritedFields;
  objectNames: NexusGenObjectNames;
  inputNames: NexusGenInputNames;
  enumNames: NexusGenEnumNames;
  interfaceNames: NexusGenInterfaceNames;
  scalarNames: NexusGenScalarNames;
  unionNames: NexusGenUnionNames;
  allInputTypes: NexusGenTypes['inputNames'] | NexusGenTypes['enumNames'] | NexusGenTypes['scalarNames'];
  allOutputTypes: NexusGenTypes['objectNames'] | NexusGenTypes['enumNames'] | NexusGenTypes['unionNames'] | NexusGenTypes['interfaceNames'] | NexusGenTypes['scalarNames'];
  allNamedTypes: NexusGenTypes['allInputTypes'] | NexusGenTypes['allOutputTypes']
  abstractTypes: NexusGenTypes['interfaceNames'] | NexusGenTypes['unionNames'];
  abstractResolveReturn: NexusGenAbstractResolveReturnTypes;
}


declare global {
  interface NexusGenPluginTypeConfig<TypeName extends string> {
  }
  interface NexusGenPluginFieldConfig<TypeName extends string, FieldName extends string> {
  }
  interface NexusGenPluginSchemaConfig {
  }
}