import { PrismaClient, Prisma } from '@prisma/client';

// Extend PrismaClient for proper event typing
const prismaClientSingleton = () => {
    return new PrismaClient({
        log: [
            { emit: 'event', level: 'query' },
            { emit: 'event', level: 'info' },
            { emit: 'event', level: 'warn' },
            { emit: 'event', level: 'error' },
        ],
        datasources: {
            db: {
                url: process.env.DATABASE_URL
            }
        }
    });
};

declare global {
    var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = global.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
    global.prisma = prisma;

    prisma.$use(async (params, next) => {
        const start = Date.now();
        const result = await next(params);
        const end = Date.now();

        console.log(`Query ${params.model}.${params.action} took ${end - start}ms`);
        return result;
    });

    // Properly typed event listener for Prisma
    prisma.$on('query', (event: Prisma.QueryEvent) => {
        console.log('----------------------------------------');
        console.log('Timestamp:', new Date().toISOString());
        console.log('Query:', event.query);
        console.log('Parameters:', event.params);
        console.log('Duration:', event.duration + 'ms');
        console.log('----------------------------------------');
    });

    // Handle other log levels
    prisma.$on('info', (event: Prisma.LogEvent) => {
        console.log('[INFO]', event.message);
    });

    prisma.$on('warn', (event: Prisma.LogEvent) => {
        console.warn('[WARN]', event.message);
    });

    prisma.$on('error', (event: Prisma.LogEvent) => {
        console.error('[ERROR]', event.message);
    });
}

export default prisma;
