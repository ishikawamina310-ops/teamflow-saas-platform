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

  const taskSeeds: Array<{
    title: string;
    status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    position: number;
    assigneeId: string | null;
    dueDate: Date | null;
  }> = [
    { title: 'Setup AWS deployment pipeline', status: 'TODO', priority: 'HIGH', position: 1000, assigneeId: admin.id, dueDate: new Date('2026-05-28') },
    { title: 'Implement workspace analytics dashboard', status: 'TODO', priority: 'MEDIUM', position: 2000, assigneeId: demo.id, dueDate: new Date('2026-06-02') },
    { title: 'Add CSV export for task reports', status: 'TODO', priority: 'LOW', position: 3000, assigneeId: null, dueDate: null },
    { title: 'Refactor RBAC middleware', status: 'IN_PROGRESS', priority: 'HIGH', position: 1000, assigneeId: admin.id, dueDate: new Date('2026-05-22') },
    { title: 'Optimize Prisma query performance', status: 'IN_PROGRESS', priority: 'MEDIUM', position: 2000, assigneeId: demo.id, dueDate: new Date('2026-05-25') },
    { title: 'Integrate Slack webhook notifications', status: 'IN_REVIEW', priority: 'MEDIUM', position: 1000, assigneeId: demo.id, dueDate: new Date('2026-05-21') },
    { title: 'Improve mobile Kanban interactions', status: 'IN_REVIEW', priority: 'HIGH', position: 2000, assigneeId: admin.id, dueDate: new Date('2026-05-20') },
    { title: 'Add activity log system', status: 'DONE', priority: 'MEDIUM', position: 1000, assigneeId: admin.id, dueDate: new Date('2026-05-15') },
    { title: 'Configure CI/CD with GitHub Actions', status: 'DONE', priority: 'HIGH', position: 2000, assigneeId: demo.id, dueDate: new Date('2026-05-12') },
    { title: 'Design system token documentation', status: 'DONE', priority: 'LOW', position: 3000, assigneeId: demo.id, dueDate: new Date('2026-05-10') },
  ];

  for (const t of taskSeeds) {
    await prisma.task.create({
      data: {
        title: t.title,
        status: t.status,
        priority: t.priority,
        position: t.position,
        dueDate: t.dueDate,
        projectId: project.id,
        authorId: admin.id,
        assigneeId: t.assigneeId,
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
