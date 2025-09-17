import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

interface DBConfig {
  connectionString: string;
  maxConnections?: number;
  enablePrepare?: boolean;
  enableSSL?: boolean | 'require';
  debug?: boolean;
}

// detect deployment platform
function detectPlatform() {
  if (process.env.VERCEL_ENV) return 'vercel';
  if (process.env.NETLIFY) return 'netlify';
  if (process.env.AWS_LAMBDA_FUNCTION_NAME) return 'lambda';
  return 'server';
}

// detect database provider
function detectDatabase(connectionString: string) {
  if (connectionString.includes('supabase')) return 'supabase';
  if (connectionString.includes('neon')) return 'neon';
  if (connectionString.includes('amazonaws.com')) return 'aws-rds';
  if (connectionString.includes('googleapis.com')) return 'gcp-sql';
  return 'self-hosted';
}

// generate database configuration
export function createDatabaseConfig(config: DBConfig) {
  const platform = detectPlatform();
  const database = detectDatabase(config.connectionString);

  // base configuration template
  const platformConfigs = {
    // Serverless platform configuration
    vercel: {
      max: 1,
      prepare: false,
      idle_timeout: 0,
      max_lifetime: 0,
      connect_timeout: 10,
    },
    netlify: {
      max: 1,
      prepare: false,
      idle_timeout: 0,
      max_lifetime: 0,
      connect_timeout: 10,
    },
    lambda: {
      max: 1,
      prepare: false,
      idle_timeout: 0,
      max_lifetime: 0,
      connect_timeout: 15,
    },
    // long running server
    server: {
      max: 30,
      prepare: true,
      idle_timeout: 600,
      max_lifetime: 7200,
      connect_timeout: 30,
    },
  };

  // database specific configuration
  const databaseConfigs = {
    supabase: {
      ssl: 'require' as const,
      application_name: 'drizzle-supabase',
    },
    neon: {
      ssl: 'require' as const,
      application_name: 'drizzle-neon',
      // Neon special optimization
      ...(platform === 'vercel' && { prepare: false }),
    },
    'aws-rds': {
      ssl: 'require' as const,
      application_name: 'drizzle-aws',
    },
    'gcp-sql': {
      ssl: 'require' as const,
      application_name: 'drizzle-gcp',
    },
    'self-hosted': {
      ssl: false,
      application_name: 'drizzle-app',
    },
  };

  const platformConfig = platformConfigs[platform];
  const databaseConfig = databaseConfigs[database];

  const finalConfig = {
    ...platformConfig,
    ...databaseConfig,

    ...(config.maxConnections && { max: config.maxConnections }),
    ...(config.enablePrepare !== undefined && { prepare: config.enablePrepare }),
    ...(config.enableSSL !== undefined && { ssl: config.enableSSL }),

    transform: {
      undefined: null,
      date: true,
    },

    debug: config.debug ?? (process.env.NODE_ENV === 'development'),
    onnotice: process.env.NODE_ENV === 'development' ? console.log : undefined,
  };

  return finalConfig;
}

// create database connection
export function createDatabase(config: DBConfig) {
  const connectionConfig = createDatabaseConfig(config);
  const client = postgres(config.connectionString, connectionConfig);

  console.log(`🚀 Database initialized:`);
  console.log(`   Platform: ${detectPlatform()}`);
  console.log(`   Database: ${detectDatabase(config.connectionString)}`);
  console.log(`   Max connections: ${connectionConfig.max}`);
  console.log(`   Prepare statements: ${connectionConfig.prepare}`);
  console.log(`   SSL: ${connectionConfig.ssl}`);

  return drizzle(client);
}

export function previewConfig(config: DBConfig) {
  const finalConfig = createDatabaseConfig(config);
  const platform = detectPlatform();
  const database = detectDatabase(config.connectionString);

  return {
    platform,
    database,
    config: finalConfig,
    summary: {
      isServerless: ['vercel', 'netlify', 'lambda'].includes(platform),
      requiresSSL: finalConfig.ssl !== false,
      connectionPooling: finalConfig.max > 1,
      preparedStatements: finalConfig.prepare,
    }
  };
}
