import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Clean existing data
  await prisma.notification.deleteMany();
  await prisma.ticketMessage.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.testimonial.deleteMany();
  await prisma.reviewRequest.deleteMany();
  await prisma.review.deleteMany();
  await prisma.file.deleteMany();
  await prisma.folder.deleteMany();
  await prisma.pageView.deleteMany();
  await prisma.analyticsSummary.deleteMany();
  await prisma.bookingWidget.deleteMany();
  await prisma.availabilitySlot.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.formSubmission.deleteMany();
  await prisma.emailRecipient.deleteMany();
  await prisma.emailCampaign.deleteMany();
  await prisma.contactTagLink.deleteMany();
  await prisma.contactNote.deleteMany();
  await prisma.contactTag.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.paymentReminder.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.maintenanceLog.deleteMany();
  await prisma.websiteStatus.deleteMany();
  await prisma.revision.deleteMany();
  await prisma.milestone.deleteMany();
  await prisma.project.deleteMany();
  await prisma.tenantModule.deleteMany();
  await prisma.module.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();

  // Create modules
  const modules = await Promise.all([
    prisma.module.create({
      data: {
        name: "Projecten",
        slug: "projecten",
        description: "Beheer je projecten, milestones en revisies",
        icon: "FolderKanban",
      },
    }),
    prisma.module.create({
      data: {
        name: "Website",
        slug: "website",
        description: "Monitor je website uptime, snelheid en SSL",
        icon: "Globe",
      },
    }),
    prisma.module.create({
      data: {
        name: "Facturatie",
        slug: "facturatie",
        description: "Maak en verstuur facturen, volg betalingen",
        icon: "Receipt",
      },
    }),
    prisma.module.create({
      data: {
        name: "CRM",
        slug: "crm",
        description: "Beheer je klanten en contacten",
        icon: "Users",
      },
    }),
    prisma.module.create({
      data: {
        name: "Bestanden",
        slug: "bestanden",
        description: "Upload en deel bestanden veilig",
        icon: "FileBox",
      },
    }),
    prisma.module.create({
      data: {
        name: "E-mail",
        slug: "email",
        description: "Verstuur nieuwsbrieven en bekijk formulier-inzendingen",
        icon: "Mail",
      },
    }),
    prisma.module.create({
      data: {
        name: "Afspraken",
        slug: "afspraken",
        description: "Plan afspraken en beheer je agenda",
        icon: "CalendarDays",
      },
    }),
    prisma.module.create({
      data: {
        name: "Statistieken",
        slug: "statistieken",
        description: "Bekijk bezoekersdata en website-analyses",
        icon: "BarChart3",
      },
    }),
    prisma.module.create({
      data: {
        name: "Reviews",
        slug: "reviews",
        description: "Verzamel en beheer klantreviews",
        icon: "Star",
      },
    }),
  ]);

  const moduleBySlug = Object.fromEntries(modules.map((m) => [m.slug, m]));

  // Plan -> module mapping
  const planModules: Record<string, string[]> = {
    STARTER: ["projecten", "website", "statistieken"],
    BUSINESS: [
      "projecten",
      "website",
      "statistieken",
      "facturatie",
      "crm",
      "bestanden",
    ],
    PREMIUM: [
      "projecten",
      "website",
      "statistieken",
      "facturatie",
      "crm",
      "bestanden",
      "email",
      "afspraken",
      "reviews",
    ],
  };

  // Create admin user
  const adminPassword = await hash("admin123", 12);
  await prisma.user.create({
    data: {
      name: "Ayoub (Admin)",
      email: "admin@akwebsolutions.nl",
      password: adminPassword,
      role: "ADMIN",
    },
  });
  console.log("Admin user created: admin@akwebsolutions.nl / admin123");

  // Create tenants
  const tenantsData = [
    {
      companyName: "Kapper Jan",
      slug: "kapper-jan",
      plan: "PREMIUM" as const,
      domain: "https://kapperjan.nl",
      address: "Kerkstraat 12",
      postalCode: "1011 AB",
      city: "Amsterdam",
      phone: "020-1234567",
      email: "info@kapperjan.nl",
      kvkNumber: "12345678",
      btwNumber: "NL123456789B01",
      iban: "NL91 ABNA 0417 1643 00",
      bic: "ABNANL2A",
      user: {
        name: "Jan de Vries",
        email: "jan@kapperjan.nl",
        password: "klant123",
      },
    },
    {
      companyName: "Studio Bloem Fotografie",
      slug: "studio-bloem",
      plan: "BUSINESS" as const,
      domain: "https://studiobloem.nl",
      address: "Prinsengracht 88",
      postalCode: "1015 DZ",
      city: "Amsterdam",
      phone: "020-9876543",
      email: "lisa@studiobloem.nl",
      kvkNumber: "87654321",
      btwNumber: "NL987654321B01",
      iban: "NL39 RABO 0300 0652 64",
      bic: "RABONL2U",
      user: {
        name: "Lisa Bloem",
        email: "lisa@studiobloem.nl",
        password: "klant123",
      },
    },
    {
      companyName: "Coach Marloes",
      slug: "coach-marloes",
      plan: "STARTER" as const,
      domain: "https://coachmarloes.nl",
      address: "Dorpsstraat 5",
      postalCode: "3511 KL",
      city: "Utrecht",
      phone: "030-2345678",
      email: "marloes@coachmarloes.nl",
      kvkNumber: "11223344",
      btwNumber: "NL112233449B01",
      iban: "NL20 INGB 0001 2345 67",
      bic: "INGBNL2A",
      user: {
        name: "Marloes Bakker",
        email: "marloes@coachmarloes.nl",
        password: "klant123",
      },
    },
  ];

  for (const td of tenantsData) {
    const tenant = await prisma.tenant.create({
      data: {
        companyName: td.companyName,
        slug: td.slug,
        plan: td.plan,
        domain: td.domain,
        address: td.address,
        postalCode: td.postalCode,
        city: td.city,
        phone: td.phone,
        email: td.email,
        kvkNumber: td.kvkNumber,
        btwNumber: td.btwNumber,
        iban: td.iban,
        bic: td.bic,
      },
    });

    const userPassword = await hash(td.user.password, 12);
    await prisma.user.create({
      data: {
        name: td.user.name,
        email: td.user.email,
        password: userPassword,
        role: "CLIENT",
        tenantId: tenant.id,
      },
    });

    // Enable modules based on plan
    for (const mod of modules) {
      await prisma.tenantModule.create({
        data: {
          tenantId: tenant.id,
          moduleId: mod.id,
          enabled: planModules[td.plan].includes(mod.slug),
        },
      });
    }

    // Create sample data for each tenant
    // Projects
    const project = await prisma.project.create({
      data: {
        tenantId: tenant.id,
        name: `Website ${td.companyName}`,
        status: "ACTIEF",
        description: `Ontwikkeling en onderhoud van de website voor ${td.companyName}`,
        startDate: new Date("2025-01-15"),
      },
    });

    await prisma.milestone.createMany({
      data: [
        {
          projectId: project.id,
          title: "Design goedgekeurd",
          completed: true,
          dueDate: new Date("2025-02-01"),
        },
        {
          projectId: project.id,
          title: "Ontwikkeling homepage",
          completed: true,
          dueDate: new Date("2025-02-15"),
        },
        {
          projectId: project.id,
          title: "Content plaatsen",
          completed: false,
          dueDate: new Date("2025-03-01"),
        },
        {
          projectId: project.id,
          title: "Live gang",
          completed: false,
          dueDate: new Date("2025-03-15"),
        },
      ],
    });

    await prisma.revision.create({
      data: {
        projectId: project.id,
        description: "Logo iets groter maken op de homepage",
        status: "AFGEROND",
        remaining: 2,
      },
    });

    // Website status
    await prisma.websiteStatus.create({
      data: {
        tenantId: tenant.id,
        url: td.domain || "https://example.nl",
        uptimePercent: 99.9,
        isOnline: true,
        loadTime: 1.2,
        sslExpiry: new Date("2026-06-15"),
        lastCheck: new Date(),
      },
    });

    // Maintenance logs
    await prisma.maintenanceLog.createMany({
      data: [
        {
          tenantId: tenant.id,
          description: "WordPress core update naar 6.4",
          type: "UPDATE",
          performedAt: new Date("2025-02-01"),
        },
        {
          tenantId: tenant.id,
          description: "Automatische backup uitgevoerd",
          type: "BACKUP",
          performedAt: new Date("2025-02-10"),
        },
        {
          tenantId: tenant.id,
          description: "SSL certificaat vernieuwd",
          type: "SECURITY",
          performedAt: new Date("2025-01-20"),
        },
      ],
    });

    // Support ticket
    const ticket = await prisma.ticket.create({
      data: {
        tenantId: tenant.id,
        subject: "Contactformulier werkt niet",
        status: "OPEN",
        priority: "NORMAAL",
      },
    });

    const clientUser = await prisma.user.findFirst({
      where: { tenantId: tenant.id },
    });
    if (clientUser) {
      await prisma.ticketMessage.create({
        data: {
          ticketId: ticket.id,
          senderId: clientUser.id,
          senderRole: "CLIENT",
          content:
            "Hallo, het contactformulier op onze website stuurt geen e-mails meer. Kunnen jullie dit bekijken?",
        },
      });

      // Notification
      await prisma.notification.create({
        data: {
          userId: clientUser.id,
          title: "Welkom bij AK Web Solutions",
          message:
            "Je klantportaal is klaar. Bekijk je dashboard voor een overzicht.",
          link: "/dashboard",
        },
      });
    }

    // Premium: Appointments, Reviews, Email campaigns, Analytics
    if (td.plan === "PREMIUM") {
      // Appointments
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const nextWeek2 = new Date();
      nextWeek2.setDate(nextWeek2.getDate() + 10);

      await prisma.appointment.createMany({
        data: [
          {
            tenantId: tenant.id,
            customerName: "Maria Hendriks",
            customerEmail: "maria@example.nl",
            customerPhone: "06-55667788",
            date: nextWeek,
            startTime: "10:00",
            endTime: "10:30",
            status: "BEVESTIGD",
            notes: "Eerste afspraak",
          },
          {
            tenantId: tenant.id,
            customerName: "Erik Smit",
            customerEmail: "erik@example.nl",
            date: nextWeek2,
            startTime: "14:00",
            endTime: "15:00",
            status: "BEVESTIGD",
          },
          {
            tenantId: tenant.id,
            customerName: "Anna de Groot",
            customerEmail: "anna@example.nl",
            date: new Date("2025-12-20"),
            startTime: "11:00",
            endTime: "12:00",
            status: "AFGEROND",
          },
        ],
      });

      // Availability slots (Mon-Fri 09:00-17:00)
      await prisma.availabilitySlot.createMany({
        data: [1, 2, 3, 4, 5].map((day) => ({
          tenantId: tenant.id,
          dayOfWeek: day,
          startTime: "09:00",
          endTime: "17:00",
          active: true,
        })),
      });

      // Reviews
      await prisma.review.createMany({
        data: [
          {
            tenantId: tenant.id,
            customerName: "Peter de Jong",
            rating: 5,
            text: "Fantastische service! Onze website ziet er prachtig uit.",
            source: "MANUAL",
            verified: true,
          },
          {
            tenantId: tenant.id,
            customerName: "Sandra Visser",
            rating: 4,
            text: "Snelle communicatie en mooi resultaat.",
            source: "GOOGLE",
            verified: true,
          },
          {
            tenantId: tenant.id,
            customerName: "Mark Janssen",
            rating: 5,
            text: "Heel tevreden over de samenwerking. Aanrader!",
            source: "MANUAL",
          },
        ],
      });

      // Email campaign
      const campaign = await prisma.emailCampaign.create({
        data: {
          tenantId: tenant.id,
          subject: "Nieuwsbrief januari - Nieuwe diensten",
          body: "<h1>Welkom</h1><p>Bekijk onze nieuwe diensten voor dit jaar!</p>",
          status: "CONCEPT",
        },
      });

      // Form submissions
      await prisma.formSubmission.createMany({
        data: [
          {
            tenantId: tenant.id,
            formName: "Contactformulier",
            data: {
              naam: "Henk Bakker",
              email: "henk@test.nl",
              bericht: "Ik wil graag een offerte ontvangen.",
            },
          },
          {
            tenantId: tenant.id,
            formName: "Contactformulier",
            data: {
              naam: "Iris Mulder",
              email: "iris@test.nl",
              bericht: "Kan ik een afspraak maken?",
            },
            read: true,
          },
        ],
      });
    }

    // All tenants: Sample analytics (batch)
    const now = new Date();
    const pageViewData: any[] = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const count = Math.floor(Math.random() * 15) + 3;

      for (let j = 0; j < count; j++) {
        pageViewData.push({
          tenantId: tenant.id,
          page: ["/", "/over-ons", "/diensten", "/contact", "/blog"][
            Math.floor(Math.random() * 5)
          ],
          referrer: [null, "google.com", "facebook.com", "instagram.com"][
            Math.floor(Math.random() * 4)
          ],
          device: ["desktop", "mobile", "tablet"][
            Math.floor(Math.random() * 3)
          ],
          createdAt: date,
        });
      }
    }
    await prisma.pageView.createMany({ data: pageViewData });

    // Business/Premium: Sample invoices & contacts
    if (td.plan === "BUSINESS" || td.plan === "PREMIUM") {
      await prisma.invoice.create({
        data: {
          tenantId: tenant.id,
          invoiceNumber: "AK-2025-001",
          customerName: "Klant A",
          customerEmail: "klanta@example.nl",
          items: [
            {
              description: "Website onderhoud januari",
              quantity: 1,
              unitPrice: 59,
              total: 59,
            },
          ],
          subtotal: 59,
          vatRate: "STANDAARD",
          vatAmount: 12.39,
          total: 71.39,
          status: "BETAALD",
          dueDate: new Date("2025-02-15"),
          paidAt: new Date("2025-02-10"),
        },
      });

      await prisma.invoice.create({
        data: {
          tenantId: tenant.id,
          invoiceNumber: "AK-2025-002",
          customerName: "Klant B",
          customerEmail: "klantb@example.nl",
          items: [
            {
              description: "Logo ontwerp",
              quantity: 1,
              unitPrice: 250,
              total: 250,
            },
          ],
          subtotal: 250,
          vatRate: "STANDAARD",
          vatAmount: 52.5,
          total: 302.5,
          status: "VERZONDEN",
          dueDate: new Date("2025-03-01"),
        },
      });

      await prisma.contact.createMany({
        data: [
          {
            tenantId: tenant.id,
            firstName: "Pieter",
            lastName: "Jansen",
            email: "pieter@example.nl",
            phone: "06-12345678",
            company: "Jansen BV",
          },
          {
            tenantId: tenant.id,
            firstName: "Sophie",
            lastName: "van Dijk",
            email: "sophie@example.nl",
            phone: "06-87654321",
            company: "Van Dijk Coaching",
          },
          {
            tenantId: tenant.id,
            firstName: "Thomas",
            lastName: "de Boer",
            email: "thomas@example.nl",
            phone: "06-11223344",
          },
        ],
      });

      await prisma.contactTag.createMany({
        data: [
          { tenantId: tenant.id, name: "Klant", color: "#22C55E" },
          { tenantId: tenant.id, name: "Lead", color: "#3B82F6" },
          { tenantId: tenant.id, name: "VIP", color: "#EAB308" },
        ],
      });

      // Folders & files
      const docsFolder = await prisma.folder.create({
        data: { tenantId: tenant.id, name: "Documenten" },
      });
      const imagesFolder = await prisma.folder.create({
        data: { tenantId: tenant.id, name: "Afbeeldingen" },
      });

      await prisma.file.createMany({
        data: [
          {
            tenantId: tenant.id,
            name: "offerte-website.pdf",
            key: `uploads/${tenant.slug}/offerte-website.pdf`,
            size: 245000,
            mimeType: "application/pdf",
            folderId: docsFolder.id,
          },
          {
            tenantId: tenant.id,
            name: "logo.png",
            key: `uploads/${tenant.slug}/logo.png`,
            size: 85000,
            mimeType: "image/png",
            folderId: imagesFolder.id,
          },
          {
            tenantId: tenant.id,
            name: "contract-2025.pdf",
            key: `uploads/${tenant.slug}/contract-2025.pdf`,
            size: 320000,
            mimeType: "application/pdf",
            folderId: docsFolder.id,
          },
        ],
      });
    }

    console.log(
      `Tenant created: ${td.companyName} (${td.plan}) — ${td.user.email} / ${td.user.password}`,
    );
  }

  console.log("\nSeed completed!");
  console.log("\nLogin credentials:");
  console.log("  Admin:   admin@akwebsolutions.nl / admin123");
  console.log("  Klant 1: jan@kapperjan.nl / klant123 (Premium)");
  console.log("  Klant 2: lisa@studiobloem.nl / klant123 (Business)");
  console.log("  Klant 3: marloes@coachmarloes.nl / klant123 (Starter)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
