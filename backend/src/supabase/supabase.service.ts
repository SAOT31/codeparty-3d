import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class SupabaseService implements OnModuleInit, OnModuleDestroy {
  private pool: Pool | null = null;
  private isPostgresAvailable = false;

  async onModuleInit(): Promise<void> {
    await this.verificarConexiones();
  }

  async onModuleDestroy(): Promise<void> {
    if (this.pool) {
      await this.pool.end().catch(() => {});
    }
  }

  private async verificarConexiones(): Promise<void> {
    const candidateUrls = [
      process.env.DATABASE_URL,
      'postgresql://postgres:postgres@postgres:5432/codeparty',
      'postgresql://postgres:postgres@localhost:5433/codeparty',
    ].filter(Boolean) as string[];

    for (const dbUrl of candidateUrls) {
      try {
        const testPool = new Pool({ connectionString: dbUrl, max: 10, idleTimeoutMillis: 30000 });
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('TIMEOUT')), 1500)
        );
        await Promise.race([testPool.query('SELECT 1'), timeoutPromise]);
        this.pool = testPool;
        this.isPostgresAvailable = true;
        console.log(`[Database] Conectado exitosamente a PostgreSQL (${dbUrl.includes('postgres:5432') ? 'Docker Network' : 'Local Host'})`);
        return;
      } catch {}
    }

    console.log('[Database] Modo memoria activo como fallback de alta velocidad');
  }

  getPool(): Pool | null {
    return this.isPostgresAvailable ? this.pool : null;
  }

  getClient(): null {
    return null;
  }

  isOnline(): boolean {
    return this.isPostgresAvailable;
  }
}