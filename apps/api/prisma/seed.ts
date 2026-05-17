import { PrismaClient, UserRole, WorkspaceMemberRole } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const adminEmail = 'admin@teamflow.dev';
  const userEmail = 'demo@teamflow.dev';

  const adminPassword = await bcrypt.hash('Admin@1234', 12);
  const userPassword = await bcrypt.hash('Demo@1234', 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: adminPassword,
      name: 'TeamFlow Admin',
      role: UserRole.ADMIN,
      emailVerified: new Date(),
    },
  });

  const demo = await prisma.user.upsert({
    where: { email: userEmail },
    update: {},
    create: {
      email: userEmail,
      passwordHash: userPassword,
      name: 'Demo User',
      role: UserRole.USER,
      emailVerified: new Date(),
    },
  });

  const workspace = await prisma.workspace.upsert({
    where: { slug: 'acme' },
    update: {},
    create: {
      slug: 'acme',
      name: 'Acme Inc.',
      description: 'Default demo workspace.',
      ownerId: admin.id,
      members: {
        create: [
          { userId: admin.id, role: WorkspaceMemberRole.OWNER },
          { userId: demo.id, role: WorkspaceMemberRole.MEMBER },
        ],
      },
    },
  });

  const project = await prisma.project.upsert({
    where: { id: 'seed-project-1' },
    update: {},
    create: {
      id: 'seed-project-1',
      workspaceId: workspace.id,
      name: 'Website Redesign',
      description: 'Marketing site v2.',
      color: '#1E40AF',
    },
  });

  const taskSeeds = [
    { title: 'Define brand palette', status: 'TODO' as const, position: 1 },
    { title: 'Implement landing hero', status: 'IN_PROGRESS' as const, position: 2 },
    { title: 'Review competitor sites', status: 'DONE' as const, position: 3 },
  ];

  for (const t of taskSeeds) {
    await prisma.task.create({
      data: {
        ...t,
        projectId: project.id,
        authorId: admin.id,
        assigneeId: demo.id,
      },
    });
  }

  // eslint-disable-next-line no-console
  console.log('✅ Seed complete.');
  // eslint-disable-next-line no-console
  console.log(`   admin: ${adminEmail} / Admin@1234`);
  // eslint-disable-next-line no-console
  console.log(`   user : ${userEmail} / Demo@1234`);
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
