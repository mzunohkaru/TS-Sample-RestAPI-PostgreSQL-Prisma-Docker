import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// async function mockCreateUser() {
//   await prisma.user.create({
//     data: {
//       name: "Tanaka Yui",
//       email: "tanaka@g.com",
//       // password = "password"
//       password: "$2b$10$8ANq8uMCypa3Ib/X/emHleMZ29sYi.L9TfXAinc3ZVgoEZR8AMuTq",
//       posts: {
//         create: {
//           title: "タイトル",
//           content: "内容",
//         },
//       },
//     },
//   });
// }

// mockCreateUser();

async function mockCreateUserMany() {
  await prisma.$transaction(async (prisma) => {
    await prisma.user.createMany({
      data: [
        {
          name: "田中 Yui",
          email: "yui@g.com",
          // password = "password"
          password: "$2b$10$8ANq8uMCypa3Ib/X/emHleMZ29sYi.L9TfXAinc3ZVgoEZR8AMuTq",
        },
        {
          name: "田中 玲",
          email: "rei@g.com",
          // password = "password"
          password: "$2b$10$8ANq8uMCypa3Ib/X/emHleMZ29sYi.L9TfXAinc3ZVgoEZR8AMuTq",
        },
      ],
    });
  });
}

mockCreateUserMany();